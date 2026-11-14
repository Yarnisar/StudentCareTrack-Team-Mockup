"use client";

/**
 * สถานะนัดหมายฝั่งครู (UC4)
 * - Alt-C: คำขอเปลี่ยนวันพร้อมเหตุผล ครูยืนยันวันใหม่หรือคงวันเดิม วันเดิมยังมีผลระหว่างรอ
 * - Scenario D / Alt-D: ใครยืนยันนัด รวมถึงระบบยืนยันเองเมื่อถึงวันนัด
 * - Scenario E / Alt-E / Alt-F: สถานะการยืนยันว่าได้เยี่ยมจริงหลังบันทึกผล
 * - Scenario F: ครูเลื่อนหรือยกเลิกนัดที่ยังไม่ถึงวันเยี่ยม (ManageAppointment)
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEMO_TODAY } from "@/lib/mock-data";
import { formatThaiDate, formatThaiTime } from "@/lib/format";
import { useStore } from "@/lib/store";

export function AppointmentStatusPanel({ appointmentId, onReschedule }: { appointmentId: string; onReschedule: () => void }) {
  const store = useStore();
  const a = store.appointments.find((x) => x.appointmentId === appointmentId);
  if (!a) return null;

  const box = "rounded-xl border border-border bg-card px-5 py-4 text-[13.5px]";

  if (a.status === "reschedule_requested" && a.reschedule)
    return (
      <div className={box}>
        <div className="font-semibold">
          {a.reschedule.by} ขอเปลี่ยนเป็น {formatThaiDate(a.reschedule.date)} {formatThaiTime(a.reschedule.date)}
        </div>
        <div className="mt-0.5 text-muted-foreground">
          เหตุผล: {a.reschedule.reason} · วันนัดเดิม {formatThaiDate(a.proposedDate)} ยังมีผลระหว่างรอพิจารณา
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => store.resolveReschedule(a.appointmentId, true)}>
            ยืนยันวันใหม่และแจ้งผู้เกี่ยวข้อง
          </Button>
          <Button size="sm" variant="outline" onClick={() => store.resolveReschedule(a.appointmentId, false)}>
            คงวันเดิม
          </Button>
        </div>
      </div>
    );

  if (a.status === "awaiting_visit_confirmation")
    return (
      <div className={box}>
        บันทึกผลแล้ว รอนักเรียนหรือผู้ปกครองยืนยันว่าได้เยี่ยมจริง ภายใน {formatThaiDate(a.visitConfirmDeadline ?? "")}
        <span className="block text-[12px] text-muted-foreground">ถ้าครบกำหนดโดยไม่มีผู้ตอบ ระบบปิดงานเป็น “ยืนยันโดยไม่มีผู้ตอบกลับ”</span>
      </div>
    );

  if (a.status === "visit_confirmed")
    return (
      <div className={box}>
        {a.visitRespondedBy} ยืนยันว่าได้เยี่ยมบ้านจริงแล้ว · ปิดงานเมื่อครบกำหนด {formatThaiDate(a.visitConfirmDeadline ?? "")}
        <span className="block text-[12px] text-muted-foreground">ระหว่างนี้นักเรียนหรือผู้ปกครองยังแจ้งว่าไม่ได้เยี่ยมจริงได้</span>
      </div>
    );

  if (a.status === "visit_disputed")
    return (
      <div className={box}>
        <div className="font-semibold">{a.visitRespondedBy} แจ้งว่าไม่ได้เยี่ยมบ้านจริง</div>
        <div className="mt-0.5 text-muted-foreground">ตรวจสอบกับนักเรียนหรือผู้ปกครอง แล้วนัดหมายใหม่</div>
        <Button size="sm" className="mt-3" onClick={onReschedule}>
          นัดหมายใหม่
        </Button>
      </div>
    );

  if (a.status === "completed" && a.visitRespondedBy)
    return <div className={box}>{a.visitRespondedBy} ยืนยันว่าได้เยี่ยมบ้านจริง · ครบกำหนดแล้ว ปิดงานเยี่ยมบ้าน</div>;

  if (a.status === "completed_no_response")
    return <div className={box}>ครบระยะเวลายืนยันโดยไม่มีผู้ตอบ ระบบปิดงานเป็น “ยืนยันโดยไม่มีผู้ตอบกลับ”</div>;

  if (a.status === "cancelled")
    return (
      <div className={box}>
        <div className="font-semibold">ครูยกเลิกนัดนี้แล้ว</div>
        {a.cancelReason && <div className="mt-0.5 text-muted-foreground">เหตุผล: {a.cancelReason}</div>}
        <Button size="sm" className="mt-3" onClick={onReschedule}>
          นัดหมายใหม่
        </Button>
      </div>
    );

  if (a.status === "confirmed" && a.confirmedBy)
    return <div className={box}>ยืนยันนัดโดย {a.confirmedBy}</div>;

  return null;
}

const CANCEL_REASONS = ["นักเรียนหรือผู้ปกครองไม่สะดวก", "ครูติดภารกิจ", "เหตุสุดวิสัย"];
const TIMES = ["15:30", "16:00", "16:30", "17:00"];

/** ครูเลื่อนหรือยกเลิกนัดที่ยังไม่ถึงวันเยี่ยม (UC4 Scenario F) */
export function ManageAppointment({ appointmentId, onDone }: { appointmentId: string; onDone: (text: string) => void }) {
  const store = useStore();
  const a = store.appointments.find((x) => x.appointmentId === appointmentId);
  const [mode, setMode] = useState<"none" | "postpone" | "cancel">("none");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [other, setOther] = useState("");
  if (!a) return null;
  // เลื่อน/ยกเลิกได้เมื่อนัดยังไม่ถึงวันเยี่ยมและยังไม่มีการบันทึกผล
  const manageable = ["pending", "confirmed", "reschedule_requested"].includes(a.status) && a.proposedDate.slice(0, 10) > DEMO_TODAY;
  if (!manageable) return null;

  const win = store.assessmentWindows.find((w) => w.kind === "home_visit" && w.enabled);
  const minDate = win && win.openDate > DEMO_TODAY ? win.openDate : DEMO_TODAY;
  const maxDate = win?.closeDate ?? "";
  const error =
    date && (date <= DEMO_TODAY || date < minDate || (maxDate && date > maxDate))
      ? `วันนัดใหม่ต้องเป็นวันหลังวันนี้ และอยู่ระหว่าง ${formatThaiDate(minDate)} ถึง ${formatThaiDate(maxDate)}`
      : "";
  const finalReason = reason === "อื่น ๆ" ? other.trim() : reason;
  const close = () => {
    setMode("none");
    setDate("");
    setTime("");
    setReason("");
    setOther("");
  };

  if (mode === "none")
    return (
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setMode("postpone")}>
          เลื่อนนัด
        </Button>
        <Button size="sm" variant="outline" onClick={() => setMode("cancel")}>
          ยกเลิกนัด
        </Button>
      </div>
    );

  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4 text-[13.5px]">
      {mode === "postpone" ? (
        <>
          <div className="font-semibold">เลื่อนนัดเป็น</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Input
              type="date"
              aria-label="วันนัดใหม่"
              value={date}
              min={minDate}
              max={maxDate || undefined}
              onChange={(e) => setDate(e.target.value)}
              className="w-44"
            />
            {TIMES.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={time === t}
                onClick={() => setTime(t)}
                className={
                  time === t
                    ? "rounded-lg border border-primary bg-accent px-3 py-1.5 text-[13px] font-semibold text-primary"
                    : "rounded-lg border border-border px-3 py-1.5 text-[13px] hover:bg-muted"
                }
              >
                {t}
              </button>
            ))}
          </div>
          {error && <p className="mt-2 text-[12.5px] text-destructive">{error}</p>}
          <p className="mt-2 text-[12px] text-muted-foreground">ระบบล้างการยืนยันเดิมและคำขอเปลี่ยนวันที่ยังไม่ได้ตอบ แล้วแจ้งนักเรียนและผู้ปกครองทางอีเมลให้ยืนยันนัดใหม่</p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              disabled={!date || !time || !!error}
              onClick={() => {
                store.postponeAppointment(a.appointmentId, `${date}T${time}:00`);
                onDone(`เลื่อนนัดเป็นวันที่ ${formatThaiDate(date)} ${time} น. แล้ว · แจ้งนักเรียนและผู้ปกครองทางอีเมลแล้ว รอยืนยันนัดใหม่`);
                close();
              }}
            >
              ยืนยันเลื่อนนัด
            </Button>
            <Button size="sm" variant="ghost" onClick={close}>
              ไม่เลื่อน
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="font-semibold">เหตุผลที่ยกเลิกนัด</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {[...CANCEL_REASONS, "อื่น ๆ"].map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={reason === r}
                onClick={() => setReason(r)}
                className={
                  reason === r
                    ? "rounded-lg border border-primary bg-accent px-3 py-1.5 text-[13px] font-semibold text-primary"
                    : "rounded-lg border border-border px-3 py-1.5 text-[13px] hover:bg-muted"
                }
              >
                {r}
              </button>
            ))}
          </div>
          {reason === "อื่น ๆ" && (
            <Input aria-label="เหตุผลอื่น" value={other} onChange={(e) => setOther(e.target.value)} placeholder="ระบุเหตุผล" className="mt-2" />
          )}
          <p className="mt-2 text-[12px] text-muted-foreground">แจ้งนักเรียนและผู้ปกครองทางอีเมล แล้วนัดหมายใหม่ได้จากปุ่มสร้างนัดหมาย</p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              disabled={finalReason === ""}
              onClick={() => {
                store.cancelAppointment(a.appointmentId, finalReason);
                onDone("ยกเลิกนัดแล้ว · แจ้งนักเรียนและผู้ปกครองทางอีเมลแล้ว");
                close();
              }}
            >
              ยืนยันยกเลิกนัด
            </Button>
            <Button size="sm" variant="ghost" onClick={close}>
              ไม่ยกเลิก
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
