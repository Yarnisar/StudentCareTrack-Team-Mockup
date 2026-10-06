"use client";

import { useMemo, useState } from "react";
import { sdqAnswersFor } from "@/lib/demo/assessment-autofill";
import { InlineAutofill } from "@/components/demo/inline-autofill";
import { useDemoPageTool } from "@/lib/demo/page-tools";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SDQ_CHOICES, SDQ_QUESTIONS, scoreSdq } from "@/lib/rules";
import { SDQ_LEVEL_LABEL, SDQ_SCALE_LABEL, SdqRater, SdqScale } from "@/lib/types";
import {
  MissingNote,
  MissingSummary,
  QuestionNumber,
  questionShellClass,
  useMissingAnswers,
  type MissingItem,
} from "./missing-answers";

const PAGE_SIZE = 5;

const pageOf = (no: number) => Math.floor((no - 1) / PAGE_SIZE);
const missingItem = (no: number): MissingItem => ({
  key: `q${no}`,
  label: `ข้อ ${no}`,
  page: pageOf(no),
});

type AutofillTarget = "normal" | "risk" | "problem";

/**
 * เครื่องมือสาธิต: กรอกคำตอบอัตโนมัติ — แสดงเฉพาะเมื่อแบบประเมินแก้ไขได้
 * ฉบับนักเรียนใช้ชื่อกลาง ๆ ไม่บอกระดับผล (นักเรียนไม่เห็นผลของตัวเอง)
 */
function SdqAutofillTools({ neutral, onFill }: { neutral: boolean; onFill: (target: AutofillTarget) => void }) {
  useDemoPageTool(
    neutral ? "กรอกอัตโนมัติ · ชุดคำตอบ 1" : "กรอกอัตโนมัติ · ปกติ",
    () => onFill("normal"),
    neutral ? "ตอบครบ 25 ข้อ" : "ตอบครบ 25 ข้อ ผลอยู่ในเกณฑ์ปกติ"
  );
  useDemoPageTool(
    neutral ? "กรอกอัตโนมัติ · ชุดคำตอบ 2" : "กรอกอัตโนมัติ · เสี่ยง",
    () => onFill("risk"),
    neutral ? "ตอบครบ 25 ข้อ" : "ตอบครบ 25 ข้อ ผลอยู่ในเกณฑ์เสี่ยง"
  );
  useDemoPageTool(
    neutral ? "กรอกอัตโนมัติ · ชุดคำตอบ 3" : "กรอกอัตโนมัติ · มีปัญหา",
    () => onFill("problem"),
    neutral ? "ตอบครบ 25 ข้อ" : "ตอบครบ 25 ข้อ ผลอยู่ในเกณฑ์มีปัญหา"
  );
  return null;
}

/**
 * แบบประเมิน SDQ 25 ข้อ
 * - readOnly + initialAnswers: แสดงฉบับที่ส่งแล้ว (เช่น ผู้ปกครองคนอื่นเห็นฉบับที่ส่งก่อน) แก้ไม่ได้
 * - แปลผลเบื้องต้นแสดงเฉพาะฉบับครู (นักเรียนไม่เห็นผลของตัวเอง ผู้ปกครองเห็นเฉพาะผลรวม)
 */
export function SdqForm({
  rater,
  onSubmit,
  layout = "desktop",
  readOnly = false,
  initialAnswers,
  submitLabel = "บันทึกผลการประเมิน",
  inlineAutofill = true,
}: {
  rater: SdqRater;
  onSubmit: (answers: Record<number, 0 | 1 | 2>) => void;
  layout?: "desktop" | "mobile";
  readOnly?: boolean;
  initialAnswers?: Record<number, 0 | 1 | 2>;
  submitLabel?: string;
  /** false = หน้าที่เรียกใช้วางปุ่มกรอกอัตโนมัติ (<InlineAutofill />) เองในตำแหน่งที่เห็นก่อน */
  inlineAutofill?: boolean;
}) {
  const [answers, setAnswers] = useState<Record<number, 0 | 1 | 2>>(() => initialAnswers ?? {});
  const [page, setPage] = useState(0);
  const missing = useMissingAnswers(setPage);

  const autofill = (target: AutofillTarget) => {
    setAnswers(sdqAnswersFor(target));
    missing.reset();
  };

  const answeredCount = Object.keys(answers).length;
  const complete = answeredCount === SDQ_QUESTIONS.length;
  const preview = useMemo(() => scoreSdq(answers, rater), [answers, rater]);
  const showPreview = rater === "teacher" && !readOnly;

  const totalPages = Math.ceil(SDQ_QUESTIONS.length / PAGE_SIZE);
  const questions = SDQ_QUESTIONS.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const missingOnPage = questions.filter((q) => answers[q.no] === undefined).map((q) => q.no);
  const missingAll = SDQ_QUESTIONS.filter((q) => answers[q.no] === undefined).map((q) => q.no);

  const mobile = layout === "mobile";

  const answer = (no: number, value: 0 | 1 | 2) => {
    if (readOnly) return;
    setAnswers((prev) => ({ ...prev, [no]: value }));
    missing.resolve(`q${no}`);
  };

  const handleNext = () => {
    if (missingOnPage.length > 0) {
      missing.report(missingOnPage.map(missingItem));
      return;
    }
    missing.reset();
    setPage((p) => p + 1);
  };

  const handleSubmit = () => {
    if (missingAll.length > 0) {
      missing.report(missingAll.map(missingItem));
      return;
    }
    onSubmit(answers);
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <>
          <SdqAutofillTools neutral={rater === "student"} onFill={autofill} />
          {inlineAutofill && <InlineAutofill className="mb-0" />}
        </>
      )}
      <Card>
        <CardContent className={mobile ? "p-4" : "p-5"}>
          <div className="mb-2 flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">ความคืบหน้า</span>
            <span className="font-semibold text-primary">
              {answeredCount} / {SDQ_QUESTIONS.length} ข้อ
            </span>
          </div>
          {/* แถบธรรมดาแทน Progress ของ Base UI ซึ่งแทรก <span>x</span> ซ่อนไว้ และหลุดออกมาให้เห็นบนมือถือ */}
          <div
            role="progressbar"
            aria-label="ความคืบหน้า"
            aria-valuemin={0}
            aria-valuemax={SDQ_QUESTIONS.length}
            aria-valuenow={answeredCount}
            className="h-1 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(answeredCount / SDQ_QUESTIONS.length) * 100}%` }}
            />
          </div>
          {!mobile && complete && showPreview && (
            <div className="mt-4 grid grid-cols-5 gap-2">
              {(Object.keys(SDQ_SCALE_LABEL) as SdqScale[]).map((scale) => (
                <div key={scale} className="rounded-lg bg-surface p-2.5 text-center">
                  <div className="text-[11px] text-muted-foreground">{SDQ_SCALE_LABEL[scale]}</div>
                  <div className="mt-0.5 text-lg font-bold">{preview.scaleScores[scale]}</div>
                </div>
              ))}
            </div>
          )}
          {complete && showPreview && (
            <p className="mt-3 text-[12.5px] text-muted-foreground">
              คะแนนรวมพฤติกรรมที่เป็นปัญหา{" "}
              <b className="text-foreground">{preview.totalDifficulties}</b> คะแนน · แปลผลเบื้องต้น:{" "}
              <b className="text-foreground">{SDQ_LEVEL_LABEL[preview.level]}</b>
            </p>
          )}
        </CardContent>
      </Card>

      <MissingSummary missing={missing.missing} onJump={missing.jumpTo} />

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {questions.map((q) => {
            const answered = answers[q.no] !== undefined;
            const flagged = missing.isMissing(`q${q.no}`) && !answered;
            return (
              <div
                key={q.no}
                ref={missing.registerNode(`q${q.no}`)}
                className={`${mobile ? "p-4" : "p-5"} ${questionShellClass(flagged)}`}
              >
                <div className="mb-3 flex gap-3">
                  <QuestionNumber no={q.no} answered={answered} missing={flagged} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] leading-relaxed">{q.text}</p>
                    <MissingNote show={flagged} />
                  </div>
                </div>

                <RadioGroup
                  value={answers[q.no]?.toString() ?? ""}
                  onValueChange={(v) => answer(q.no, Number(v) as 0 | 1 | 2)}
                  disabled={readOnly}
                  className={mobile ? "space-y-2" : "ml-9 flex flex-wrap gap-2.5"}
                >
                  {SDQ_CHOICES.map((choice) => (
                    <Label
                      key={choice.value}
                      htmlFor={`q${q.no}-${choice.value}`}
                      className={
                        mobile
                          ? "flex min-h-13 cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3 text-[15px] font-medium has-[[data-checked]]:border-primary has-[[data-checked]]:bg-accent has-[[data-checked]]:text-primary"
                          : "flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium has-[[data-checked]]:border-primary has-[[data-checked]]:bg-accent has-[[data-checked]]:text-primary"
                      }
                    >
                      <RadioGroupItem
                        id={`q${q.no}-${choice.value}`}
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

      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <span className="text-[13px] text-muted-foreground">
          หน้า {page + 1} จาก {totalPages}
          {!readOnly && missingAll.length > 0 && (
            <span className="ml-2 text-risk-red">· ยังไม่ได้ตอบ {missingAll.length} ข้อ</span>
          )}
        </span>
        <div className="flex items-center gap-3">
          {page > 0 && (
            <Button variant="outline" onClick={() => setPage((p) => p - 1)}>
              ย้อนกลับ
            </Button>
          )}
          {!readOnly && missingOnPage.length > 0 && page < totalPages - 1 && (
            <button
              type="button"
              onClick={() => {
                missing.reset();
                setPage((p) => p + 1);
              }}
              className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              ข้ามไปก่อน
            </button>
          )}
          {page < totalPages - 1 ? (
            <Button onClick={readOnly ? () => setPage((p) => p + 1) : handleNext}>
              ข้อถัดไป <ArrowRight className="size-4" />
            </Button>
          ) : (
            !readOnly && <Button onClick={handleSubmit}>{submitLabel}</Button>
          )}
        </div>
      </div>

      <p className="pb-6 text-center text-[12px] text-muted-foreground">
        {rater === "student"
          ? "คำตอบของนักเรียนเป็นความลับ ครูจะเห็นเฉพาะผลสรุปเพื่อใช้ในการดูแลช่วยเหลือ"
          : "ผลการประเมินใช้เพื่อการดูแลช่วยเหลือ ไม่มีผลต่อคะแนนหรือผลการเรียนของนักเรียน"}
      </p>
    </div>
  );
}
