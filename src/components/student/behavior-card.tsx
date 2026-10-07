"use client";

import { isAutoConfirmed } from "@/lib/behavior";
import { formatThaiDateTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import { BEHAVIOR_SCORE_BASE, BEHAVIOR_STATUS_LABEL, type BehaviorRecord } from "@/lib/types";
import { Chip, SectionCard } from "./section-card";

const STATUS_TONE: Record<BehaviorRecord["status"], "muted" | "green" | "amber" | "red"> = {
  pending: "amber",
  confirmed: "green",
  excused: "muted",
  voided: "red",
};

/** ความประพฤติล่าสุด + คะแนน N/100 — ครูทุกคนเห็นได้ */
export function BehaviorCard({ studentId, limit = 6 }: { studentId: string; limit?: number }) {
  const store = useStore();
  const records = store.behaviorOf(studentId).slice(0, limit);
  const score = store.behaviorScoreOf(studentId);
  const low = store.isBehaviorScoreLow(studentId);
  const sensitive = store.canSeeSensitive(studentId);

  return (
    <SectionCard
      title="ประวัติความประพฤติล่าสุด"
      aside={
        <span className="text-[13px] font-semibold">
          คะแนนความประพฤติ:{" "}
          <span className={low ? "text-risk-red" : "text-risk-green"}>
            {score}/{BEHAVIOR_SCORE_BASE}
          </span>
        </span>
      }
    >
      {low && (
        <p className="mb-2 rounded-lg bg-risk-amber-bg px-3 py-2 text-[12px] text-risk-amber">
          คะแนนต่ำกว่าเกณฑ์ที่โรงเรียนกำหนด ({store.schoolSettings.behaviorAlertScore} คะแนน)
          {sensitive ? " · ควรพิจารณาเปิด care case" : ""}
        </p>
      )}
      <div className="divide-y divide-border">
        {records.map((rec) => {
          const rule = store.ruleOf(rec.ruleId);
          const delta = rule?.scoreDelta ?? 0;
          const counted = rec.status === "confirmed";
          return (
            <div key={rec.recordId} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
              <span className="w-32 shrink-0 text-[12px] text-muted-foreground">
                {formatThaiDateTime(rec.occurredAt)}
              </span>
              <span className="min-w-0 flex-1 text-[13px]">{rule?.name}</span>
              {rec.source === "qr_checkin" && (
                <span className="rounded bg-accent px-2 py-0.5 text-[11px] font-semibold text-primary">QR</span>
              )}
              <Chip tone={STATUS_TONE[rec.status]}>
                {isAutoConfirmed(rec) ? "ยืนยันอัตโนมัติ" : BEHAVIOR_STATUS_LABEL[rec.status]}
              </Chip>
              <span
                className={`w-10 text-right text-[13px] font-bold ${
                  !counted ? "text-muted-foreground line-through" : delta > 0 ? "text-risk-green" : "text-risk-red"
                }`}
                title={counted ? undefined : "ไม่นับคะแนน"}
              >
                {delta > 0 ? `+${delta}` : delta}
              </span>
            </div>
          );
        })}
        {records.length === 0 && <p className="py-4 text-[13px] text-muted-foreground">ยังไม่มีบันทึกความประพฤติ</p>}
      </div>
    </SectionCard>
  );
}
