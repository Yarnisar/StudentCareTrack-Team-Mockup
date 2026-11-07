"use client";

/**
 * แบบประเมิน EQ ฉบับนักเรียนประเมินตนเอง (UC10) บันทึกร่างอัตโนมัติ (Alt-C) และพาไปข้อที่ยังไม่ได้ตอบ (Alt-D)
 * ไม่แสดงคะแนนระหว่างทำ ผลเปิดให้นักเรียนเห็นหลังครูที่ปรึกษาตรวจแล้วเท่านั้น
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { EQ_CHOICES, EQ_DOMAIN_LABEL, EQ_QUESTIONS, type EqAnswer } from "@/lib/eq";
import { draftKey } from "@/lib/store";
import { AutosaveStatus } from "./autosave-status";
import { MissingNote, MissingSummary, QuestionNumber, questionShellClass, useMissingAnswers } from "./missing-answers";
import { useDraft } from "./use-draft";

export function EqForm({
  studentId,
  initial,
  submitLabel = "ส่งแบบประเมิน",
  onSubmit,
  onCancel,
}: {
  studentId: string;
  /** แก้คำตอบที่ส่งแล้ว: เริ่มจากคำตอบเดิม */
  initial?: Record<number, EqAnswer>;
  submitLabel?: string;
  onSubmit: (answers: Record<number, EqAnswer>) => void;
  onCancel?: () => void;
}) {
  const draft = useDraft<Record<number, EqAnswer>>(draftKey("eq", studentId), () => initial ?? {});
  const answers = draft.value;
  const missing = useMissingAnswers();
  const answered = EQ_QUESTIONS.filter((q) => answers[q.no] !== undefined).length;
  const missingAll = EQ_QUESTIONS.filter((q) => answers[q.no] === undefined);

  const answer = (no: number, value: EqAnswer) => {
    draft.update((prev) => ({ ...prev, [no]: value }));
    missing.resolve(`q${no}`);
  };

  const submit = () => {
    if (missingAll.length > 0) {
      missing.report(missingAll.map((q) => ({ key: `q${q.no}`, label: `ข้อ ${q.no}` })));
      return;
    }
    onSubmit(answers);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">ความคืบหน้า</span>
            <span className="font-semibold text-primary">
              {answered} / {EQ_QUESTIONS.length} ข้อ
            </span>
          </div>
          <Progress value={(answered / EQ_QUESTIONS.length) * 100} />
          <div className="mt-2">
            <AutosaveStatus restored={draft.restored} savedAt={draft.savedAt} />
          </div>
        </CardContent>
      </Card>

      <MissingSummary missing={missing.missing} onJump={missing.jumpTo} />

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {EQ_QUESTIONS.map((q) => {
            const done = answers[q.no] !== undefined;
            const flagged = missing.isMissing(`q${q.no}`) && !done;
            return (
              <div key={q.no} ref={missing.registerNode(`q${q.no}`)} className={`p-4 ${questionShellClass(flagged)}`}>
                <div className="mb-3 flex gap-3">
                  <QuestionNumber no={q.no} answered={done} missing={flagged} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11.5px] font-semibold text-muted-foreground">ด้าน{EQ_DOMAIN_LABEL[q.domain]}</div>
                    <p className="text-[15px] leading-relaxed">{q.text}</p>
                    <MissingNote show={flagged} />
                  </div>
                </div>
                <RadioGroup
                  value={answers[q.no]?.toString() ?? ""}
                  onValueChange={(v) => answer(q.no, Number(v) as EqAnswer)}
                  className="grid grid-cols-2 gap-2"
                >
                  {EQ_CHOICES.map((c) => (
                    <Label
                      key={c.value}
                      htmlFor={`eq${q.no}-${c.value}`}
                      className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 text-[14px] font-medium has-[[data-checked]]:border-primary has-[[data-checked]]:bg-accent has-[[data-checked]]:text-primary"
                    >
                      <RadioGroupItem id={`eq${q.no}-${c.value}`} value={c.value.toString()} />
                      {c.label}
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex gap-2.5 pb-2">
        {onCancel && (
          <Button variant="outline" className="h-12 flex-1" onClick={onCancel}>
            ยกเลิก
          </Button>
        )}
        <Button className="h-12 flex-1" onClick={submit}>
          {submitLabel}
        </Button>
      </div>
      <p className="pb-6 text-center text-[12px] text-muted-foreground">
        คำตอบเป็นความลับ ครูประจำชั้นจะเห็นผลสรุปเพื่อใช้ดูแลช่วยเหลือ · คำถามชุดนี้เป็นตัวอย่างในต้นแบบ
      </p>
    </div>
  );
}
