"use client";

import { use, useMemo, useState } from "react";
import { nineSAnswersFor } from "@/lib/demo/assessment-autofill";
import { useDemoPageTool } from "@/lib/demo/page-tools";
import { useRouter } from "next/navigation";
import { CheckCircle2, Lock } from "lucide-react";
import { CaseTriggerOutcome } from "@/components/assessment/trigger-outcome";
import { WindowNotice } from "@/components/shared/window-notice";
import { LinkButton } from "@/components/ui/link-button";
import { PageHeader } from "@/components/layout/page-header";
import { StepIndicator } from "@/components/assessment/step-indicator";
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
import { evaluateNineS, NINE_S_QUESTIONS, SDQ_CHOICES } from "@/lib/rules";
import { useStore, type SaveNineSResult } from "@/lib/store";
import { NINE_S_CLUSTER_LABEL, NineSCluster } from "@/lib/types";

export default function NineSPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const router = useRouter();
  const store = useStore();
  const student = store.getStudent(studentId);

  const existing = store.nineSOf(studentId);
  const plan = store.assessmentPlanOf(studentId);
  const blocked = store.nineSBlockReason(studentId);
  const redFlag = store.redFlagOf(studentId);
  // nine_s_assessments เก็บเฉพาะคะแนนรายกลุ่ม (ไม่เก็บคำตอบรายข้อ) — แก้ไขต้องตอบใหม่ทั้งชุด
  const [answers, setAnswers] = useState<Record<string, 0 | 1 | 2>>({});
  const [saved, setSaved] = useState<Extract<SaveNineSResult, { ok: true }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const missing = useMissingAnswers();

  const autofill = (target: "normal" | "needs_care") => {
    if (blocked || saved) return;
    setAnswers(nineSAnswersFor(target));
    missing.reset();
  };
  useDemoPageTool("กรอกอัตโนมัติ · ผลปกติ", () => autofill("normal"), "ทุกกลุ่มต่ำกว่า 3 คะแนน");
  useDemoPageTool("กรอกอัตโนมัติ · ควรดูแล", () => autofill("needs_care"), "กลุ่มซึมเศร้า/วิตกกังวลได้ 3 คะแนน → เปิด SDQ");
  const answeredCount = Object.keys(answers).length;

  const unanswered = NINE_S_QUESTIONS.map((q, index) => ({ q, index })).filter(
    ({ q }) => answers[q.id] === undefined
  );

  /** คำนวณคะแนนรายกลุ่มแบบเรียลไทม์ */
  const preview = useMemo(() => evaluateNineS(answers), [answers]);

  const clusters = Object.keys(NINE_S_CLUSTER_LABEL) as NineSCluster[];

  if (!student) return <p className="p-8 text-sm text-muted-foreground">ไม่พบข้อมูลนักเรียน</p>;

  const answer = (id: string, value: 0 | 1 | 2) => {
    if (blocked) return;
    setAnswers((prev) => ({ ...prev, [id]: value }));
    missing.resolve(id);
  };

  const handleSubmit = () => {
    if (unanswered.length > 0) {
      missing.report(unanswered.map(({ q, index }) => ({ key: q.id, label: `ข้อ ${index + 1}` })));
      return;
    }
    const res = store.saveNineS(studentId, answers);
    if (!res.ok) return setError(res.error);
    setSaved(res);
  };

  return (
    <>
      <PageHeader
        title="แบบประเมิน 9S"
        subtitle={`ขั้นที่ 2 — ทำต่อเมื่อผล Red Flag เป็นปกติ · ${store.currentTerm.label}`}
      />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-3xl">
          <StepIndicator current={2} round={plan.round} />
          <WindowNotice activity="screening" className="mb-4" />

          {redFlag?.result === "normal" && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-green-200 bg-risk-green-bg px-4 py-3">
              <CheckCircle2 className="size-5 shrink-0 text-risk-green" />
              <p className="text-[13.5px] text-risk-green">
                ผลแบบคัดกรอง Red Flag ของ {student.fullName} อยู่ในเกณฑ์ปกติ — ดำเนินการประเมิน 9S ต่อ
              </p>
            </div>
          )}

          {saved ? (
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="text-center">
                  <h2 className="text-lg font-bold">
                    ผล 9S: {saved.record.result === "needs_care" ? "ควรดูแล" : "ปกติ"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {saved.record.result === "needs_care"
                      ? saved.sdqOpened > 0
                        ? `ระบบเปิดแบบ SDQ ครั้งที่ ${plan.round} ให้ ${saved.sdqOpened} ฉบับ และแจ้งผู้ปกครอง/นักเรียนแล้ว`
                        : `แบบ SDQ ครั้งที่ ${plan.round} เปิดไว้แล้ว`
                      : plan.sdqRequired
                        ? `ผลปกติ — โรงเรียนกำหนดให้ทำ SDQ ครั้งที่ ${plan.round} ด้วย`
                        : "ผลปกติ — ไม่ต้องทำ SDQ รอบนี้"}
                  </p>
                </div>
                <CaseTriggerOutcome studentId={studentId} result={null} />
                <div className="flex justify-center gap-3">
                  <Button variant="outline" onClick={() => setSaved(null)}>
                    แก้ไขคำตอบ
                  </Button>
                  {saved.record.result === "needs_care" || plan.sdqRequired ? (
                    <LinkButton href={`/assessment/sdq/${studentId}?from=nine-s`}>ไปที่ SDQ ฉบับครู</LinkButton>
                  ) : (
                    <LinkButton href="/assessment">กลับหน้าการประเมิน</LinkButton>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
          <>
          {blocked && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-muted px-4 py-3 text-[13px] text-muted-foreground">
              <Lock className="size-4 shrink-0" />
              {blocked}
            </div>
          )}
          {existing && (
            <p className="mb-4 rounded-lg bg-surface px-3 py-2 text-[12.5px] text-muted-foreground">
              ผลที่บันทึกไว้: {existing.result === "needs_care" ? "ควรดูแล" : "ปกติ"} (
              {clusters.map((c) => `${NINE_S_CLUSTER_LABEL[c]} ${existing.clusterScores[c]}`).join(" · ")})
              {!blocked && " — ตอบใหม่ทั้งชุดเพื่อแก้ไข ได้จนปิดช่วงดำเนินงานคัดกรอง"}
            </p>
          )}

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
                      disabled={!!blocked}
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
            {unanswered.length > 0 && (
              <span className="mr-auto text-[13px] text-risk-red">
                ยังไม่ได้ตอบ {unanswered.length} ข้อ
              </span>
            )}
            {error && <span className="mr-auto text-[13px] text-risk-red">{error}</span>}
            <Button variant="outline" onClick={() => router.push(`/assessment`)}>
              กลับ
            </Button>
            {!blocked && <Button onClick={handleSubmit}>บันทึกและประมวลผล 9S</Button>}
          </div>
          </>
          )}
        </div>
      </div>
    </>
  );
}
