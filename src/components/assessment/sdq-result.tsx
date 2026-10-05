"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "cn";
import { combinedSdqBasisLabel, SDQ_CHOICES, SDQ_QUESTIONS } from "@/lib/rules";
import { useStore } from "@/lib/store";
import { SDQ_LEVEL_LABEL, type CombinedSdqResult, type SdqAssessment, type SdqLevel } from "@/lib/types";

const LEVEL_STYLE: Record<SdqLevel, string> = {
  normal: "bg-risk-green-bg text-risk-green",
  risk: "bg-risk-amber-bg text-risk-amber",
  problem: "bg-risk-red-bg text-risk-red",
};

/** ป้ายผล SDQ: ปกติ / เสี่ยง / มีปัญหา */
export function SdqLevelBadge({ level, className }: { level: SdqLevel; className?: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", LEVEL_STYLE[level], className)}>
      {SDQ_LEVEL_LABEL[level]}
    </span>
  );
}

/**
 * ผล SDQ รวม พร้อมป้าย "อิงจาก N จาก M ฉบับ" เสมอ
 * ยังไม่มีผลจนกว่าฉบับครูจะส่ง
 */
export function CombinedSdqSummary({
  combined,
  className,
}: {
  combined: CombinedSdqResult | null;
  className?: string;
}) {
  if (!combined) return <span className={cn("text-[12.5px] text-muted-foreground", className)}>ยังไม่เปิดแบบประเมิน</span>;
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-2", className)}>
      {combined.level ? (
        <SdqLevelBadge level={combined.level} />
      ) : (
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">รอฉบับครู</span>
      )}
      <span className="text-[11.5px] text-muted-foreground">{combinedSdqBasisLabel(combined)}</span>
    </span>
  );
}

/**
 * ปุ่ม "ดูคำตอบรายข้อ" ของ SDQ ฉบับหนึ่ง
 * เปิดได้เฉพาะฉบับที่ผลเป็นมีปัญหา และทุกครั้งที่เปิดจะบันทึก VIEW_SENSITIVE
 */
export function SdqAnswersToggle({ form }: { form: SdqAssessment }) {
  const store = useStore();
  const [answers, setAnswers] = useState<Record<number, 0 | 1 | 2> | null>(null);
  if (!store.canViewSdqAnswers(form)) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setAnswers((prev) => (prev ? null : store.viewSdqAnswers(form.id)))}
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:underline"
      >
        {answers ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        {answers ? "ซ่อนคำตอบรายข้อ" : "ดูคำตอบรายข้อ"}
      </button>
      {answers && (
        <div className="mt-2 rounded-lg border border-border bg-card p-3">
          <p className="mb-2 text-[11px] text-muted-foreground">การเปิดดูครั้งนี้ถูกบันทึกใน audit log แล้ว</p>
          <ol className="space-y-1 text-[12px]">
            {SDQ_QUESTIONS.map((q) => (
              <li key={q.no} className="flex gap-2">
                <span className="w-5 shrink-0 text-right text-muted-foreground">{q.no}.</span>
                <span className="flex-1">{q.text}</span>
                <span className="shrink-0 font-semibold">
                  {SDQ_CHOICES.find((c) => c.value === answers[q.no])?.label ?? "-"}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
