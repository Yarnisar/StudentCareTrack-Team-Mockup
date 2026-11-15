"use client";

/** ส่วนแสดงผลที่หน้าความประพฤติใช้ร่วมกัน: หากฎ รูปหลักฐาน ป้ายคะแนน */

import { useStore } from "@/lib/store";

/** หากฎจากชุดเดียวกับหน้าตั้งค่า กฎที่ผู้ดูแลระบบเพิ่มใหม่จึงแสดงชื่อได้ */
export function useRuleOf() {
  const { behaviorRules } = useStore();
  return (ruleId: string) => behaviorRules.find((r) => r.ruleId === ruleId);
}

/** รูปหลักฐานย่อ (ถ้ามี) */
export function Evidence({ images }: { images?: string[] }) {
  if (!images || images.length === 0) return null;
  return (
    <span className="mt-1.5 flex gap-1.5">
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- รูปจากเครื่องผู้ใช้ (data URL) ไม่ผ่าน next/image
        <img key={i} src={src} alt={`หลักฐาน ${i + 1}`} className="size-8 rounded border border-border object-cover" />
      ))}
    </span>
  );
}

export function ScoreChip({
  delta,
  size = "md",
  cancelled = false,
}: {
  delta: number;
  size?: "md" | "lg";
  /** กฎถูกยกเลิก: รายการนี้ไม่นับคะแนน (UC7 Scenario C) */
  cancelled?: boolean;
}) {
  const positive = delta > 0;
  if (cancelled)
    return (
      <span
        className={`shrink-0 rounded-md bg-muted text-center font-semibold text-muted-foreground line-through ${
          size === "lg" ? "px-3 py-1.5 text-base" : "w-12 py-1 text-xs"
        }`}
      >
        {delta > 0 ? `+${delta}` : delta || "ส่งต่อ"}
      </span>
    );
  // กฎส่งต่อไม่มีคะแนน (UC8 Alt-G) จึงแสดงเป็นสถานะสีกลาง
  if (delta === 0)
    return (
      <span
        className={`shrink-0 rounded-md bg-muted text-center font-semibold text-muted-foreground ${
          size === "lg" ? "px-3 py-1.5 text-base" : "w-12 py-1 text-xs"
        }`}
      >
        ส่งต่อ
      </span>
    );
  return (
    <span
      className={`shrink-0 rounded-md text-center font-bold ${
        size === "lg" ? "px-3 py-1.5 text-base" : "w-12 py-1 text-sm"
      } ${positive ? "bg-risk-green-bg text-risk-green" : "bg-risk-red-bg text-risk-red"}`}
    >
      {positive ? `+${delta}` : delta}
    </span>
  );
}
