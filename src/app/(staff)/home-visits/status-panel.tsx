"use client";

/**
 * สถานะนัดหมายฝั่งครู (UC4)
 * - Alt-C: คำขอเปลี่ยนวันพร้อมเหตุผล ครูยืนยันวันใหม่หรือคงวันเดิม วันเดิมยังมีผลระหว่างรอ
 * - Scenario D / Alt-D: ใครยืนยันนัด รวมถึงระบบยืนยันเองเมื่อถึงวันนัด
 * - Scenario E / Alt-E / Alt-F: สถานะการยืนยันว่าได้เยี่ยมจริงหลังบันทึกผล
 */

import { Button } from "@/components/ui/button";
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
    return <div className={box}>{a.visitRespondedBy} ยืนยันว่าได้เยี่ยมบ้านจริงแล้ว · ปิดงานเยี่ยมบ้าน</div>;

  if (a.status === "completed_no_response")
    return <div className={box}>ครบระยะเวลายืนยันโดยไม่มีผู้ตอบ ระบบปิดงานเป็น “ยืนยันโดยไม่มีผู้ตอบกลับ”</div>;

  if (a.status === "confirmed" && a.confirmedBy)
    return <div className={box}>ยืนยันนัดโดย {a.confirmedBy}</div>;

  return null;
}
