"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CombinedSdqSummary } from "@/components/assessment/sdq-result";
import { PagerNumbered, usePagination } from "@/components/shared/pagination";
import { WindowNotice } from "@/components/shared/window-notice";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import {
  ASSESSMENT_NEXT_STEP_LABEL,
  SDQ_LEVEL_LABEL,
  SDQ_RATER_LABEL,
  type AssessmentNextStep,
  type AssessmentOutcome,
  type SdqAssessment,
} from "@/lib/types";
import { byClassNo, initialOf } from "@/lib/format";

const shortRater = (f: SdqAssessment) =>
  SDQ_RATER_LABEL[f.rater].replace("ประเมินตนเอง", "").replace("ประเมิน", "");

export default function AssessmentPage() {
  const store = useStore();
  const term = store.currentTerm;
  const round = term.semester;
  const students = store.students.filter((s) => store.canSeeSensitive(s.studentId)).sort(byClassNo);
  const [pageSize, setPageSize] = useState(10);
  const pager = usePagination(students, pageSize);

  return (
    <>
      <PageHeader
        title="การประเมิน"
        subtitle={`Red Flag → 9S → SDQ ครั้งที่ ${round} · ${term.label}`}
      />

      <div className="flex-1 overflow-y-auto p-8">
        <WindowNotice activity="sdq" className="mb-4" />

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-[15.5px] font-bold">สถานะการประเมินรายบุคคล</h2>

            <div className="divide-y divide-border">
              {pager.slice.map((student) => {
                const plan = store.assessmentPlanOf(student.studentId);
                const rfFromSem1 = plan.redFlag && plan.redFlag.termId !== term.termId;
                const nsFromSem1 = plan.nineS && plan.nineS.termId !== term.termId;
                const action = actionOf(plan.next, student.studentId, round);

                return (
                  <div key={student.studentId} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {initialOf(student.fullName)}
                    </div>
                    <div className="w-48 shrink-0">
                      <div className="text-sm font-semibold">{student.fullName}</div>
                      <div className="text-xs text-muted-foreground">
                        {student.roomName} เลขที่ {student.classNo} · {ASSESSMENT_NEXT_STEP_LABEL[plan.next]}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-wrap items-center gap-1.5 text-[11.5px]">
                      <OutcomeChip label="Red Flag" outcome={plan.redFlag?.result} note={rfFromSem1 ? "ภาค 1" : undefined} />
                      <OutcomeChip
                        label="9S"
                        outcome={plan.nineS?.result}
                        note={plan.redFlag?.result === "needs_care" && !plan.nineS ? "ข้าม" : nsFromSem1 ? "ภาค 1" : undefined}
                      />
                      {plan.sdqForms.map((f) => (
                        <Chip
                          key={f.id}
                          label={`SDQ${round}: ${shortRater(f)}`}
                          state={f.status === "pending" ? "pending" : f.level === "normal" ? "ok" : "care"}
                          hint={f.status === "submitted" && f.level ? SDQ_LEVEL_LABEL[f.level] : undefined}
                        />
                      ))}
                      {plan.combined && <CombinedSdqSummary combined={plan.combined} className="ml-1" />}
                    </div>

                    {action && (
                      <LinkButton size="sm" variant={action.primary ? "default" : "outline"} href={action.href}>
                        {action.label}
                      </LinkButton>
                    )}
                  </div>
                );
              })}
            </div>

            <PagerNumbered
              page={pager.page}
              totalPages={pager.totalPages}
              setPage={pager.setPage}
              from={pager.from}
              to={pager.to}
              total={pager.total}
              pageSize={pageSize}
              onPageSize={(n) => {
                setPageSize(n);
                pager.reset();
              }}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function actionOf(next: AssessmentNextStep, studentId: string, round: 1 | 2) {
  switch (next) {
    case "red_flag":
      return { href: `/assessment/red-flag/${studentId}`, label: "ทำ Red Flag", primary: true };
    case "nine_s":
      return { href: `/assessment/nine-s/${studentId}`, label: "ทำ 9S", primary: true };
    case "open_sdq":
      return { href: `/assessment/sdq/${studentId}`, label: `เปิด SDQ ครั้งที่ ${round}`, primary: true };
    case "wait_sdq_window":
      return { href: `/assessment/sdq/${studentId}`, label: "ดู SDQ", primary: false };
    case "sdq":
      return { href: `/assessment/sdq/${studentId}`, label: "ไปที่ SDQ", primary: false };
    case "done":
      return { href: `/assessment/sdq/${studentId}`, label: "ดูผล SDQ", primary: false };
    default:
      return null;
  }
}

function OutcomeChip({ label, outcome, note }: { label: string; outcome?: AssessmentOutcome; note?: string }) {
  return (
    <Chip
      label={label}
      state={!outcome ? "none" : outcome === "needs_care" ? "care" : "ok"}
      hint={outcome ? `${outcome === "needs_care" ? "ควรดูแล" : "ปกติ"}${note ? ` (${note})` : ""}` : note}
    />
  );
}

function Chip({
  label,
  state,
  hint,
}: {
  label: string;
  state: "none" | "pending" | "ok" | "care";
  hint?: string;
}) {
  const styles = {
    none: "bg-muted text-muted-foreground",
    pending: "bg-risk-amber-bg text-risk-amber",
    ok: "bg-risk-green-bg text-risk-green",
    care: "bg-risk-red-bg text-risk-red",
  } as const;

  const suffix = state === "pending" ? " · รอทำ" : hint ? ` · ${hint}` : state === "none" ? " · ยังไม่ทำ" : "";

  return (
    <span className={`rounded-md px-2 py-1 font-semibold ${styles[state]}`}>
      {label}
      {suffix}
    </span>
  );
}
