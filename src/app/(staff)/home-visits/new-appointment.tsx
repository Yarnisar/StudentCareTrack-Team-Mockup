"use client";

/**
 * ครูประจำชั้นนัดหมายเยี่ยมบ้าน (UC4 Scenario B)
 * - เลือกนักเรียนในห้องที่ยังไม่มีนัดที่ค้างอยู่ (ข้อ 2)
 * - แสดงข้อมูลติดต่อและเวลาที่สะดวกที่ผู้ปกครองให้ไว้ (ข้อ 5)
 * - เลือกวันภายในช่วงเวลาเยี่ยมบ้านที่แอดมินกำหนด และเลือกเวลาจากปุ่ม (ข้อ 6)
 * - ตรวจข้อมูลก่อนบันทึก (ข้อ 8, Alt-B) แล้วแจ้งผู้เกี่ยวข้อง (ข้อ 10)
 * PROTOTYPE: การแจ้งทางอีเมลเป็นข้อความยืนยันเท่านั้น ยังไม่ส่งจริง ช่วงเวลาที่สะดวกเป็นปุ่มตัวอย่าง
 */

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatThaiDate } from "@/lib/format";
import { DEMO_TODAY } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

const TIMES = ["15:30", "16:00", "16:30", "17:00"];
const OPEN_STATUSES = ["pending", "confirmed", "reschedule_requested"];

export function NewAppointmentDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (appointmentId: string, notice: string) => void;
}) {
  const store = useStore();
  const window_ = store.assessmentWindows.find((w) => w.kind === "home_visit" && w.enabled);
  const minDate = window_ && window_.openDate > DEMO_TODAY ? window_.openDate : DEMO_TODAY;
  const maxDate = window_?.closeDate ?? "";

  const busy = new Set(
    store.appointments.filter((a) => OPEN_STATUSES.includes(a.status)).map((a) => a.studentId)
  );
  const candidates = store.students.filter((s) => !busy.has(s.studentId));

  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const student = store.getStudent(studentId);
  const lastInfo = store.appointments.find((a) => a.studentId === studentId && a.guardianPhone);

  const errors: string[] = [];
  if (!window_) errors.push("แอดมินยังไม่ได้เปิดช่วงเวลาเยี่ยมบ้าน");
  if (date && (date < minDate || (maxDate && date > maxDate)))
    errors.push(`วันนัดต้องอยู่ระหว่าง ${formatThaiDate(minDate)} ถึง ${formatThaiDate(maxDate)}`);
  const canSave = !!student && !!date && !!time && errors.length === 0;

  const save = () => {
    if (!student) return;
    const appt = store.createAppointment(student.studentId, `${date}T${time}:00`);
    onCreated(
      appt.appointmentId,
      `นัดเยี่ยมบ้าน ${student.fullName} วันที่ ${formatThaiDate(date)} ${time} น. แล้ว · แจ้งผู้ปกครองและนักเรียนทางอีเมลแล้ว รอการยืนยัน`
    );
  };

  const chip = (on: boolean) =>
    on
      ? "rounded-lg border border-primary bg-accent px-3 py-1.5 text-[13px] font-semibold text-primary"
      : "rounded-lg border border-border px-3 py-1.5 text-[13px] hover:bg-muted";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 sm:items-center" role="dialog" aria-modal="true" aria-label="สร้างนัดหมายเยี่ยมบ้าน">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl bg-card shadow-lg sm:rounded-2xl">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
          <h2 className="flex-1 text-[16px] font-bold">สร้างนัดหมายเยี่ยมบ้าน</h2>
          <button type="button" aria-label="ปิด" onClick={onClose} className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div>
            <div className="mb-1.5 text-[12.5px] text-muted-foreground">นักเรียน (เฉพาะคนที่ยังไม่มีนัดค้างอยู่)</div>
            <div className="flex flex-wrap gap-1.5">
              {candidates.map((s) => (
                <button key={s.studentId} type="button" aria-pressed={studentId === s.studentId} onClick={() => setStudentId(s.studentId)} className={chip(studentId === s.studentId)}>
                  {s.fullName} <span className="font-normal text-muted-foreground">เลขที่ {s.classNo}</span>
                </button>
              ))}
              {candidates.length === 0 && <p className="text-[13px] text-muted-foreground">นักเรียนทุกคนมีนัดหมายแล้ว</p>}
            </div>
          </div>

          {student && (
            <div className="rounded-lg bg-surface px-3 py-2.5 text-[12.5px] leading-relaxed">
              <div>
                ผู้ปกครอง {student.guardianName} ({student.guardianRelation}) · {lastInfo?.guardianPhone ?? student.guardianPhone}
              </div>
              {lastInfo?.guardianNote ? (
                <div className="text-muted-foreground">ผู้ปกครองแจ้งไว้: {lastInfo.guardianNote}</div>
              ) : (
                <div className="text-muted-foreground">ผู้ปกครองยังไม่ได้แจ้งเวลาที่สะดวก</div>
              )}
            </div>
          )}

          <div>
            <div className="mb-1.5 text-[12.5px] text-muted-foreground">
              วันนัด {window_ && `(ช่วงเยี่ยมบ้าน ${formatThaiDate(window_.openDate)} – ${formatThaiDate(window_.closeDate)})`}
            </div>
            <Input type="date" aria-label="วันนัด" value={date} min={minDate} max={maxDate} onChange={(e) => setDate(e.target.value)} className="w-48" />
          </div>

          <div>
            <div className="mb-1.5 text-[12.5px] text-muted-foreground">เวลา</div>
            <div className="flex flex-wrap gap-1.5">
              {TIMES.map((t) => (
                <button key={t} type="button" aria-pressed={time === t} onClick={() => setTime(t)} className={chip(time === t)}>
                  {t} น.
                </button>
              ))}
            </div>
          </div>

          {errors.length > 0 && (
            <ul className="list-disc pl-5 text-[12.5px] text-destructive">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-2 border-t border-border px-5 py-3.5">
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button className="flex-1" disabled={!canSave} onClick={save}>
            ยืนยันนัดหมายและแจ้งผู้ปกครอง
          </Button>
        </div>
      </div>
    </div>
  );
}
