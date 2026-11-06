"use client";

import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StepIndicator } from "@/components/assessment/step-indicator";
import { AutosaveStatus } from "@/components/assessment/autosave-status";
import { useDraft } from "@/components/assessment/use-draft";
import {
  MissingNote,
  MissingSummary,
  QuestionNumber,
  questionShellClass,
  useMissingAnswers,
} from "@/components/assessment/missing-answers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CURRENT_TERM } from "@/lib/mock-data";
import { evaluateNineS, NINE_S_QUESTIONS, SDQ_CHOICES } from "@/lib/rules";
import { draftKey, useStore } from "@/lib/store";
import { NINE_S_CLUSTER_LABEL, NineSCluster } from "@/lib/types";

export default function NineSPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const router = useRouter();
  const store = useStore();
  const student = store.getStudent(studentId);
  const key = draftKey("nine_s", studentId);

  const draft = useDraft<Record<string, 0 | 1 | 2>>(key, () => ({}));
  const answers = draft.value;
  const missing = useMissingAnswers();
  const answeredCount = Object.keys(answers).length;

  const unanswered = NINE_S_QUESTIONS.map((q, index) => ({ q, index })).filter(
    ({ q }) => answers[q.id] === undefined
  );

  /** คำนวณคะแนนรายกลุ่มแบบเรียลไทม์ */
  const preview = useMemo(() => evaluateNineS(answers), [answers]);

  if (!student) return <p className="p-8 text-sm text-muted-foreground">ไม่พบข้อมูลนักเรียน</p>;

  const answer = (id: string, value: 0 | 1 | 2) => {
    draft.update((prev) => ({ ...prev, [id]: value }));
    missing.resolve(id);
  };

  const handleSubmit = () => {
    if (unanswered.length > 0) {
      missing.report(unanswered.map(({ q, index }) => ({ key: q.id, label: `ข้อ ${index + 1}` })));
      return;
    }
    const result = store.saveNineS(studentId, answers);
    router.push(
      result === "needs_care"
        ? `/assessment/sdq/${studentId}?from=nine-s`
        : `/students/${studentId}?ninesNormal=1`
    );
  };

  const clusters = Object.keys(NINE_S_CLUSTER_LABEL) as NineSCluster[];

  return (
    <>
      <PageHeader
        title="แบบประเมิน 9S"
        subtitle={`ขั้นที่ 2 — ทำต่อเมื่อผล Red Flag เป็นปกติ · ${CURRENT_TERM.label}`}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="mx-auto max-w-3xl">
          <StepIndicator current={2} />

          <div className="mb-4 flex items-center gap-3 rounded-xl border border-green-200 bg-risk-green-bg px-4 py-3">
            <CheckCircle2 className="size-5 shrink-0 text-risk-green" />
            <p className="text-[13.5px] text-risk-green">
              ผลแบบคัดกรอง Red Flag ของ {student.fullName} อยู่ในเกณฑ์ปกติ — ดำเนินการประเมิน 9S ต่อ
            </p>
          </div>

          <Card className="mb-4">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[13px] text-muted-foreground">คะแนนรายกลุ่ม (อัปเดตอัตโนมัติ)</span>
                <span className="text-[13px] font-semibold text-primary">
                  ตอบแล้ว {answeredCount} / {NINE_S_QUESTIONS.length} ข้อ
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {clusters.map((c) => {
                  const needsCare = preview.clusterResults[c] === "needs_care";
                  return (
                    <div key={c} className="rounded-lg bg-surface p-3">
                      <div className="text-[12px] text-muted-foreground">
                        {NINE_S_CLUSTER_LABEL[c]}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xl font-bold">{preview.clusterScores[c]}</span>
                        <span
                          className={
                            needsCare
                              ? "rounded-full bg-risk-amber-bg px-2 py-0.5 text-[11px] font-semibold text-risk-amber"
                              : "rounded-full bg-risk-green-bg px-2 py-0.5 text-[11px] font-semibold text-risk-green"
                          }
                        >
                          {needsCare ? "ควรดูแล" : "ปกติ"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[11.5px] text-muted-foreground">
                เกณฑ์: คะแนนรวมในกลุ่มใดตั้งแต่ 3 คะแนนขึ้นไป ถือว่าควรดูแล
                และระบบจะเปิดแบบประเมิน SDQ ให้โดยอัตโนมัติ
              </p>
            </CardContent>
          </Card>

          <div className="mb-4">
            <MissingSummary missing={missing.missing} onJump={missing.jumpTo} />
          </div>

          <Card>
            <CardContent className="divide-y divide-border p-0">
              {NINE_S_QUESTIONS.map((q, index) => {
                const answered = answers[q.id] !== undefined;
                const flagged = missing.isMissing(q.id) && !answered;
                return (
                  <div
                    key={q.id}
                    ref={missing.registerNode(q.id)}
                    className={`p-5 ${questionShellClass(flagged)}`}
                  >
                    <div className="mb-3 flex gap-3">
                      <QuestionNumber no={index + 1} answered={answered} missing={flagged} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] leading-relaxed">{q.text}</p>
                        <span className="text-[11.5px] text-muted-foreground">
                          {NINE_S_CLUSTER_LABEL[q.cluster]}
                        </span>
                        <MissingNote show={flagged} />
                      </div>
                    </div>

                    <RadioGroup
                      value={answers[q.id]?.toString() ?? ""}
                      onValueChange={(v) => answer(q.id, Number(v) as 0 | 1 | 2)}
                      className="ml-9 flex flex-wrap gap-2.5"
                    >
                      {SDQ_CHOICES.map((choice) => (
                        <Label
                          key={choice.value}
                          htmlFor={`${q.id}-${choice.value}`}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium has-[[data-checked]]:border-primary has-[[data-checked]]:bg-accent has-[[data-checked]]:text-primary"
                        >
                          <RadioGroupItem
                            id={`${q.id}-${choice.value}`}
                            value={choice.value.toString()}
                          />
                          {choice.label}
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3 pb-4">
            <div className="mr-auto flex flex-col gap-0.5">
              <AutosaveStatus restored={draft.restored} savedAt={draft.savedAt} />
              {unanswered.length > 0 && (
                <span className="text-[13px] text-destructive">ยังไม่ได้ตอบ {unanswered.length} ข้อ</span>
              )}
            </div>
            <Button variant="outline" onClick={() => router.push(`/students/${studentId}`)}>
              ออกและทำต่อภายหลัง
            </Button>
            <Button onClick={handleSubmit}>ประมวลผล 9S</Button>
          </div>
        </div>
      </div>
    </>
  );
}
