import { CloudCheck } from "lucide-react";

/** สถานะร่างอัตโนมัติ แสดงข้างปุ่มส่งของแบบฟอร์ม */
export function AutosaveStatus({
  restored,
  savedAt,
}: {
  restored: boolean;
  savedAt: Date | null;
}) {
  const text = savedAt
    ? `บันทึกร่างอัตโนมัติแล้ว · ${savedAt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.`
    : restored
      ? "ทำต่อจากร่างที่บันทึกไว้"
      : "คำตอบจะบันทึกเป็นร่างให้อัตโนมัติ";

  return (
    <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground" aria-live="polite">
      <CloudCheck className="size-4" />
      {text}
    </span>
  );
}
