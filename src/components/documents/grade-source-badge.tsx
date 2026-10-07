import { GraduationCap } from "lucide-react";

/** ป้ายบนเอกสาร/ส่วนที่มีข้อมูลผลการเรียน (Team A อ่านอย่างเดียว) */
export function GradeSourceBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[12px] font-semibold text-muted-foreground ${className ?? ""}`}
    >
      <GraduationCap className="size-3.5" />
      ข้อมูลผลการเรียนจากงานวิชาการ
    </span>
  );
}
