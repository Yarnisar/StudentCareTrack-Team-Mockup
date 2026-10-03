"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
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
import { CURRENT_TERM } from "@/lib/mock-data";
import { RED_FLAG_QUESTIONS } from "@/lib/rules";
import { useStore } from "@/lib/store";

export default function RedFlagPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const router = useRouter();
  const store = useStore();
  const student = store.getStudent(studentId);

  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const missing = useMissingAnswers();

  const unanswered = RED_FLAG_QUESTIONS.map((q, index) => ({ q, index })).filter(
    ({ q }) => answers[q.id] === undefined
  );

  if (!student) return <p className="p-8 text-sm text-muted-foreground">ไม่พบข้อมูลนักเรียน</p>;

  const answer = (id: string, value: boolean) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    missing.resolve(id);
  };

  const handleSubmit = () => {
    if (unanswered.length > 0) {
      missing.report(unanswered.map(({ q, index }) => ({ key: q.id, label: `ข้อ ${index + 1}` })));
      return;
    }
    const result = store.saveRedFlag(studentId, answers);
    // ควรดูแล -> ระบบเปิด SDQ ทั้ง 3 ฉบับอัตโนมัติแล้วพาไปทำฉบับครู
    // ปกติ    -> ไปทำแบบประเมิน 9S ต่อ
    router.push(
      result === "needs_care"
        ? `/assessment/sdq/${studentId}?from=red-flag`
        : `/assessment/nine-s/${studentId}`
    );
  };

  return (
    <>
      <PageHeader
        title="แบบคัดกรอง Red Flag"
        subtitle={`ขั้นที่ 1 ของการประเมินด้านสุขภาพจิต · ${CURRENT_TERM.label}`}
      />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-3xl">
          <StepIndicator current={1} />

          <Card className="mb-4">
            <CardContent className="p-5">
              <div className="text-lg font-bold">{student.fullName}</div>
              <div className="mt-0.5 text-[13px] text-muted-foreground">
                {student.roomName} เลขที่ {student.classNo} · เลขประจำตัว {student.studentId}
              </div>
            </CardContent>
          </Card>

          <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-risk-amber-bg px-4 py-3">
            <AlertTriangle className="size-5 shrink-0 text-risk-amber" />
            <p className="text-[13.5px] text-risk-amber">
              หากตอบ &quot;ใช่&quot; แม้เพียงข้อเดียว ระบบจะเปิดแบบประเมิน SDQ
              ทั้งฉบับครู นักเรียน และผู้ปกครองโดยอัตโนมัติ
            </p>
          </div>

          <div className="mb-4">
            <MissingSummary missing={missing.missing} onJump={missing.jumpTo} />
          </div>

          <Card>
            <CardContent className="divide-y divide-border p-0">
              {RED_FLAG_QUESTIONS.map((q, index) => {
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
                        <MissingNote show={flagged} />
                      </div>
                    </div>

                    <RadioGroup
                      value={answers[q.id] === undefined ? "" : answers[q.id] ? "yes" : "no"}
                      onValueChange={(v) => answer(q.id, v === "yes")}
                      className="ml-9 flex gap-3"
                    >
                      {[
                        { value: "no", label: "ไม่ใช่" },
                        { value: "yes", label: "ใช่" },
                      ].map((opt) => (
                        <Label
                          key={opt.value}
                          htmlFor={`${q.id}-${opt.value}`}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium has-[[data-checked]]:border-primary has-[[data-checked]]:bg-accent has-[[data-checked]]:text-primary"
                        >
                          <RadioGroupItem id={`${q.id}-${opt.value}`} value={opt.value} />
                          {opt.label}
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
            <Button variant="outline" onClick={() => router.push(`/students/${studentId}`)}>
              บันทึกร่าง
            </Button>
            <Button onClick={handleSubmit}>ประมวลผล Red Flag</Button>
          </div>
        </div>
      </div>
    </>
  );
}

