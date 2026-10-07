"use client";

import Link from "next/link";
import { SdqRaterComparison } from "@/components/assessment/sdq-comparison";
import { CombinedSdqSummary, SdqAnswersToggle, SdqLevelBadge } from "@/components/assessment/sdq-result";
import { formatThaiDate } from "@/lib/format";
import { PREVIOUS_TERM } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { ASSESSMENT_NEXT_STEP_LABEL, SDQ_RATER_LABEL, type AssessmentNextStep, type SdqRater } from "@/lib/types";
import { Chip, SectionCard, termLabelOf } from "./section-card";

const NEXT_HREF: Record<AssessmentNextStep, string | null> = {
  red_flag: "red-flag",
  nine_s: "nine-s",
  open_sdq: "sdq",
  wait_sdq_window: "sdq",
  sdq: "sdq",
  done: "sdq",
  not_required: null,
};

/** ผล SDQ รอบปัจจุบัน (ผลรวม + รายผู้ประเมิน) และผลรวมรอบก่อน — ข้อมูลอ่อนไหว */
export function SdqCard({ studentId }: { studentId: string }) {
  const store = useStore();
  const plan = store.assessmentPlanOf(studentId);
  const forms = store.currentSdqOf(studentId);
  const combined = store.combinedSdqOf(studentId);
  const previous = store.combinedSdqOf(studentId, PREVIOUS_TERM.termId);
  // ประถมไม่มีฉบับนักเรียน — แสดงเฉพาะฉบับที่มีในชุด
  const raters = (["teacher", "student", "parent"] as SdqRater[]).filter((r) => forms.some((f) => f.rater === r));
  const nextHref = NEXT_HREF[plan.next];

  return (
    <SectionCard
      title={`ผลการประเมิน SDQ ครั้งที่ ${plan.round}`}
      aside={
        <span className="flex items-center gap-2">
          <Chip tone={plan.next === "done" || plan.next === "not_required" ? "green" : "amber"}>
            ขั้นถัดไป: {ASSESSMENT_NEXT_STEP_LABEL[plan.next]}
          </Chip>
          {nextHref && (
            <Link
              href={`/assessment/${nextHref}/${studentId}`}
              className="text-[12px] font-semibold text-primary hover:underline"
            >
              ไปที่แบบประเมิน →
            </Link>
          )}
        </span>
      }
    >
      {combined && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[12px]">
          <span className="text-muted-foreground">ผลรวม:</span>
          <CombinedSdqSummary combined={combined} />
        </div>
      )}

      {forms.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {raters.map((rater) => {
            const rec = forms.find((s) => s.rater === rater);
            const done = rec?.status === "submitted";
            return (
              <div
                key={rater}
                className={
                  done ? "rounded-xl border border-border p-4" : "rounded-xl border border-dashed border-border bg-surface p-4"
                }
              >
                <div className="text-[12px] text-muted-foreground">{SDQ_RATER_LABEL[rater]}</div>
                {done && rec ? (
                  <>
                    <div className="my-1.5 text-2xl font-bold">
                      {rec.totalDifficulties}
                      <span className="ml-1 text-[12px] font-medium text-muted-foreground">คะแนน</span>
                    </div>
                    {rec.level && <SdqLevelBadge level={rec.level} />}
                    <div className="mt-1.5 text-[11px] text-muted-foreground">
                      ส่ง {rec.submittedAt ? formatThaiDate(rec.submittedAt) : "-"}
                      {rater === "parent" && rec.raterUserId ? ` · ${store.nameOf(rec.raterUserId)}` : ""}
                    </div>
                    <SdqAnswersToggle form={rec} />
                  </>
                ) : (
                  <div className="mt-3 text-[13px] font-medium text-muted-foreground">
                    รอทำแบบประเมิน
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[13px] text-muted-foreground">ยังไม่เปิดแบบประเมินรอบนี้</p>
      )}

      {forms.length > 0 && (
        <SdqRaterComparison studentId={studentId} forms={forms} className="mt-4 border-t border-border pt-4" />
      )}

      {previous && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-[12px]">
          <span className="text-muted-foreground">
            ครั้งที่ {previous.round} ({termLabelOf(previous.termId)}):
          </span>
          <CombinedSdqSummary combined={previous} />
        </div>
      )}
    </SectionCard>
  );
}
