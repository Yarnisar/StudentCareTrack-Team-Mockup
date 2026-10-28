"use client";

/**
 * PROTOTYPE ONLY — ส่วนที่ทุก variant ใช้ร่วมกัน (ทิ้งได้)
 *
 * คำถามที่ต้นแบบนี้ตอบ: "หน้าความประพฤติควรจัดวางอย่างไร ให้ชื่อพฤติกรรมและรายละเอียดเหตุการณ์
 * แสดงได้ครบโดยไม่ถูกตัด" — ของเดิมบีบรายการไว้ในคอลัมน์กว้างตายตัวข้างแถบฟอร์มด้านขวา
 * เหลือที่ให้ข้อความราว 400px จึงต้อง truncate ทิ้ง
 *
 * ไฟล์นี้เก็บเฉพาะ "เนื้อหา" ที่ใช้ซ้ำ (การ์ดสถิติ, ป้าย) ส่วน "การจัดวาง"
 * เป็นหน้าที่ของแต่ละ variant ซึ่งเป็นสิ่งที่กำลังเปรียบเทียบกัน
 * การบันทึกย้ายไปอยู่ที่ตัวบันทึกเดียว (../behavior-recorder.tsx) แล้ว
 */

import { Card, CardContent } from "@/components/ui/card";
import { behaviorRules } from "@/lib/store";
import type { BehaviorRecord, BehaviorRule } from "@/lib/types";

export const SEVERITY_LABEL: Record<BehaviorRule["severity"], string> = {
  minor: "เล็กน้อย",
  moderate: "ปานกลาง",
  severe: "ร้ายแรง",
  positive: "คะแนนบวก",
};

export function ruleOf(ruleId: string) {
  return behaviorRules.find((r) => r.ruleId === ruleId);
}

export function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-[13px] font-semibold text-muted-foreground">{label}</div>
        <div className={accent ? "mt-2 text-2xl font-bold text-primary" : "mt-2 text-2xl font-bold"}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

/** ที่มาของบันทึก และรูปหลักฐานย่อ (ถ้ามี) */
export function SourceBadge({ source, evidence }: { source: BehaviorRecord["source"]; evidence?: string[] }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5">
      <span
        className={
          source === "card_scan"
            ? "rounded-md bg-accent px-2 py-1 text-[11px] font-semibold text-primary"
            : "rounded-md bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground"
        }
      >
        {source === "card_scan" ? "สแกนบัตร" : "เลือกจากรายชื่อ"}
      </span>
      {evidence?.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- รูปจากเครื่องผู้ใช้ (data URL) ไม่ผ่าน next/image
        <img key={i} src={src} alt={`หลักฐาน ${i + 1}`} className="size-7 rounded border border-border object-cover" />
      ))}
    </span>
  );
}

export function ScoreChip({ delta, size = "md" }: { delta: number; size?: "md" | "lg" }) {
  const positive = delta > 0;
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
