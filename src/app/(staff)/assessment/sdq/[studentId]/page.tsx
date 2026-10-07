"use client";

import { Suspense, use, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StepIndicator } from "@/components/assessment/step-indicator";
import { SdqForm } from "@/components/assessment/sdq-form";
import { SdqRaterComparison } from "@/components/assessment/sdq-comparison";
import { CombinedSdqSummary, SdqAnswersToggle, SdqLevelBadge } from "@/components/assessment/sdq-result";
import { CaseTriggerOutcome } from "@/components/assessment/trigger-outcome";
import { InlineAutofill } from "@/components/demo/inline-autofill";
import { WindowNotice } from "@/components/shared/window-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatThaiDateTime } from "@/lib/format";
import { combineSdq } from "@/lib/rules";
import { useStore, type SaveSdqResult } from "@/lib/store";
import { PREVIOUS_TERM } from "@/lib/mock-data";
import { SDQ_RATER_LABEL } from "@/lib/types";

export default function SdqPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">กำลังโหลด...</div>}>
      <SdqContent studentId={studentId} />
    </Suspense>
  );
}

function SdqContent({ studentId }: { studentId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const store = useStore();
  const student = store.getStudent(studentId);
  const [saved, setSaved] = useState<Extract<SaveSdqResult, { ok: true }> | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!student) return <p className="p-8 text-sm text-muted-foreground">ไม่พบข้อมูลนักเรียน</p>;
  if (!store.canSeeSensitive(studentId))
    return <p className="p-8 text-sm text-muted-foreground">ผล SDQ เป็นข้อมูลอ่อนไหว — ดูได้เฉพาะครูประจำชั้นและแอดมิน</p>;

  const plan = store.assessmentPlanOf(studentId);
  const set = plan.sdqForms;
  const teacherForm = set.find((s) => s.rater === "teacher");
  const teacherBlocked = store.sdqBlockReason(studentId, "teacher");
  const previousCombined =
    plan.round === 2 ? combineSdq(store.sdqOf(studentId).filter((s) => s.termId === PREVIOUS_TERM.termId)) : null;

  const triggerText =
    from === "red-flag"
      ? "ผลแบบคัดกรอง Red Flag ระบุว่าควรดูแล"
      : from === "nine-s"
        ? "ผลแบบประเมิน 9S ระบุว่าควรดูแล"
        : null;

  const openSet = () => {
    const res = store.openSdqSet(studentId);
    if (!res.ok) setError(res.error);
  };

  const submit = (answers: Record<number, 0 | 1 | 2>) => {
    const res = store.saveSdq(studentId, "teacher", answers);
    if (!res.ok) return setError(res.error);
    setError(null);
    setSaved(res);
  };

  return (
    <>
      <PageHeader
        title="แบบประเมิน SDQ"
        subtitle={`ฉบับครูประเมิน · ครั้งที่ ${plan.round} · ${store.currentTerm.label}`}
      />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-3xl">
          <StepIndicator
            current={3}
            round={plan.round}
            carried={plan.carriedFromEarlierTerm}
            skipNineS={plan.redFlag?.result === "needs_care"}
          />
          <WindowNotice activity="sdq" className="mb-4" />
          <InlineAutofill />

          {triggerText && set.length > 0 && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-accent px-4 py-3">
              <Sparkles className="size-5 shrink-0 text-primary" />
              <p className="text-[13px] text-accent-foreground">
                {triggerText} — เปิด SDQ ครั้งที่ {plan.round} ให้ทุกฝ่ายแล้ว
              </p>
            </div>
          )}

          <Card className="mb-4">
            <CardContent className="p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-lg font-bold">{student.fullName}</div>
                  <div className="mt-0.5 text-[13px] text-muted-foreground">
                    {student.roomName} เลขที่ {student.classNo}
                  </div>
                </div>
                <div className="text-right">
                  <div className="mb-1 text-[12px] text-muted-foreground">ผล SDQ รวม ครั้งที่ {plan.round}</div>
                  <CombinedSdqSummary combined={plan.combined} />
                </div>
              </div>

              {set.length > 0 && (
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {set.map((record) => {
                    const done = record.status === "submitted";
                    return (
                      <div key={record.id} className="rounded-lg bg-surface p-3">
                        <div className="text-[12px] text-muted-foreground">{SDQ_RATER_LABEL[record.rater]}</div>
                        {done ? (
                          <>
                            <div className="mt-1 flex items-baseline gap-2">
                              <span className="text-lg font-bold">{record.totalDifficulties}</span>
                              {record.level && <SdqLevelBadge level={record.level} className="px-2 py-0.5 text-[11px]" />}
                            </div>
                            <div className="mt-1 text-[11px] text-muted-foreground">
                              {store.nameOf(record.raterUserId)} · {record.submittedAt ? formatThaiDateTime(record.submittedAt) : ""}
                            </div>
                            <SdqAnswersToggle form={record} />
                          </>
                        ) : (
                          <div className="mt-1.5 text-[13px] font-medium text-muted-foreground">รอทำแบบประเมิน</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {set.length > 0 && (
                <SdqRaterComparison studentId={studentId} forms={set} className="mt-4 border-t border-border pt-4" />
              )}

              {previousCombined && (
                <p className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-[12px] text-muted-foreground">
                  ผล SDQ รวม ครั้งที่ 1 (ภาคเรียนที่ 1): <CombinedSdqSummary combined={previousCombined} />
                </p>
              )}
            </CardContent>
          </Card>

          {error && <p className="mb-4 text-[13px] text-risk-red">{error}</p>}

          {saved ? (
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="text-center">
                  <h2 className="text-lg font-bold">ส่งแบบประเมินฉบับครูแล้ว</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    คะแนนรวมพฤติกรรมที่เป็นปัญหา {saved.form.totalDifficulties} คะแนน — ฉบับที่ส่งแล้วแก้ไขไม่ได้
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[13px]">
                    ผล SDQ รวม: <CombinedSdqSummary combined={saved.combined} />
                  </div>
                </div>
                <CaseTriggerOutcome studentId={studentId} result={saved.trigger} />
                <div className="flex justify-center gap-3">
                  <Button variant="outline" onClick={() => router.push(`/assessment`)}>
                    กลับหน้าการประเมิน
                  </Button>
                  <Button onClick={() => router.push(`/care-cases?student=${studentId}`)}>ไปที่ care case</Button>
                </div>
              </CardContent>
            </Card>
          ) : set.length === 0 ? (
            <Card>
              <CardContent className="space-y-3 p-6 text-center">
                {plan.next === "red_flag" || plan.next === "nine_s" ? (
                  <p className="text-sm text-muted-foreground">
                    ต้องทำ{plan.next === "red_flag" ? "แบบคัดกรอง Red Flag" : "แบบประเมิน 9S"}ก่อน
                  </p>
                ) : plan.sdqRequired ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {plan.needsCare
                        ? `ผล Red Flag/9S ควรดูแล — ต้องทำ SDQ ครั้งที่ ${plan.round}`
                        : `ต้องทำ SDQ ครั้งที่ ${plan.round} ตามที่โรงเรียนกำหนด`}
                    </p>
                    {plan.next === "wait_sdq_window" ? (
                      <p className="text-[13px] font-medium text-muted-foreground">
                        รอเปิดช่วงทำ SDQ
                      </p>
                    ) : (
                      store.canEdit(studentId) && (
                        <Button onClick={openSet}>เปิดแบบประเมิน SDQ ครั้งที่ {plan.round}</Button>
                      )
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    ผลปกติ — ไม่ต้องทำ SDQ ครั้งที่ {plan.round}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : teacherForm?.status === "submitted" ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                <Badge className="mb-2">ฉบับครูประเมิน · ส่งแล้ว</Badge>
                <p>
                  ส่งโดย {store.nameOf(teacherForm.raterUserId)}
                  {teacherForm.submittedAt ? ` เมื่อ ${formatThaiDateTime(teacherForm.submittedAt)}` : ""} — แก้ไขไม่ได้
                </p>
                <CaseTriggerOutcome studentId={studentId} result={null} className="mt-4 text-left" />
              </CardContent>
            </Card>
          ) : teacherBlocked ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted px-4 py-3 text-[13px] text-muted-foreground">
              <Lock className="size-4 shrink-0" />
              {teacherBlocked}
            </div>
          ) : (
            <SdqForm rater="teacher" inlineAutofill={false} onSubmit={submit} submitLabel="ส่งแบบประเมิน (แก้ไขไม่ได้หลังส่ง)" />
          )}
        </div>
      </div>
    </>
  );
}
