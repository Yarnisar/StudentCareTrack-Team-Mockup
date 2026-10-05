"use client";

import { CalendarClock, Lock } from "lucide-react";
import { formatThaiDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { OPERATING_ACTIVITY_LABEL, type OperatingActivity } from "@/lib/types";

/**
 * แถบสถานะช่วงดำเนินงานสำหรับวางบนฟอร์มบันทึก
 * - เปิดอยู่ปกติ: ไม่แสดง
 * - ใกล้ปิด (ภายใน remindDaysBefore วัน): เตือนวันปิด
 * - ยังไม่เปิด / ปิดแล้ว / ไม่ได้กำหนด: แจ้งว่าดูได้แต่บันทึกไม่ได้
 * ฟอร์มยังต้องตรวจ isWindowOpen(activity) เองก่อนบันทึก
 */
export function WindowNotice({ activity, className }: { activity: OperatingActivity; className?: string }) {
  const store = useStore();
  const win = store.windowOf(activity);
  const status = store.windowStatusOf(activity);
  const label = OPERATING_ACTIVITY_LABEL[activity];

  if (status === "open") {
    if (!store.isWindowClosingSoon(activity) || !win) return null;
    return (
      <div
        className={`flex items-center gap-2.5 rounded-xl border border-amber-200 bg-risk-amber-bg px-4 py-3 text-[13px] text-risk-amber ${className ?? ""}`}
      >
        <CalendarClock className="size-4 shrink-0" />
        ช่วงดำเนินงาน{label} จะปิดวันที่ {formatThaiDate(win.closesAt)} — หลังจากนั้นระบบล็อก บันทึกเพิ่มไม่ได้
      </div>
    );
  }

  const text =
    status === "upcoming" && win
      ? `ยังไม่ถึงช่วงดำเนินงาน${label} (เปิด ${formatThaiDate(win.opensAt)})`
      : status === "closed" && win
        ? `ปิดช่วงดำเนินงาน${label} แล้วเมื่อ ${formatThaiDate(win.closesAt)}`
        : `ยังไม่ได้กำหนดช่วงดำเนินงาน${label} ของภาคเรียนนี้`;

  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border border-border bg-muted px-4 py-3 text-[13px] text-muted-foreground ${className ?? ""}`}
    >
      <Lock className="size-4 shrink-0" />
      {text} — ดูข้อมูลได้ แต่บันทึกไม่ได้
    </div>
  );
}
