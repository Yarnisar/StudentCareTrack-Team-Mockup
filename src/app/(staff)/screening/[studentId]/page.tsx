"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, Info } from "lucide-react";
import { WindowLocked } from "@/components/shared/window-locked";
import { lockedWindowFor } from "@/lib/periods";
import { PageHeader } from "@/components/layout/page-header";
import { RiskBadge } from "@/components/shared/risk-badge";
import { AutosaveStatus } from "@/components/assessment/autosave-status";
import { MissingNote, useMissingAnswers } from "@/components/assessment/missing-answers";
import { useDraft } from "@/components/assessment/use-draft";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CURRENT_TEACHER, CURRENT_TERM } from "@/lib/mock-data";
import { classifyDimension, overallRisk, SCREENING_ITEMS } from "@/lib/rules";
import { draftKey, useStore } from "@/lib/store";
import { DIMENSION_LABEL, DIMENSION_ORDER, ScreeningDimension } from "@/lib/types";

/** รายการที่ครูติ๊กเองได้ (ไม่รวมรายการที่ระบบกรอกจากผลแบบประเมิน) */
const teacherItemIds = (dimension: ScreeningDimension) =>
  SCREENING_ITEMS.filter((i) => i.dimension === dimension && !i.derivedFrom).map((i) => i.id);

/** เหตุผลที่ไม่เปิด case สำหรับกลุ่มเสี่ยง (UC6 Alt-G) เลือกแทนการพิมพ์ — PROTOTYPE: รายการเป็นข้อเสนอ */
const SKIP_REASONS = [
  "ติดตามในชั้นเรียนก่อน",
  "ทราบสาเหตุแล้ว แก้ไขได้ในครอบครัว",
  "ได้รับความช่วยเหลือจากหน่วยงานอื่นอยู่แล้ว",
];

/** ผลหลังบันทึก: มิติที่มีปัญหาเปิด case อัตโนมัติ มิติที่เสี่ยงให้ครูเลือก (UC6 ข้อ 13–15) */
interface Outcome {
  red: string[];
  amber: string[];
  caseLinked: boolean;
}

interface ScreeningDraft {
  checked: string[];
  /** มิติที่ครูยืนยันว่าตรวจแล้วไม่พบรายการใด — แยก "ไม่พบ" ออกจาก "ยังไม่ได้ตรวจ" */
  noneFound: ScreeningDimension[];
}

export default function ScreeningFormPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const router = useRouter();
  const store = useStore();
  const student = store.getStudent(studentId);
  const previous = store.latestScreening(studentId);

  // คัดกรองซ้ำ: ทุกมิติของรอบก่อนถือว่าตรวจแล้ว มิติที่ไม่มีรายการถือว่า "ไม่พบ"
  const draft = useDraft<ScreeningDraft>(draftKey("screening", studentId), () => {
    const checked = previous?.results.flatMap((r) => r.checkedItemIds) ?? [];
    return {
      checked,
      noneFound: previous
        ? DIMENSION_ORDER.filter((d) => !teacherItemIds(d).some((id) => checked.includes(id)))
        : [],
    };
  });
  const { checked, noneFound } = draft.value;
  const missing = useMissingAnswers();
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const isReviewed = (d: ScreeningDimension) =>
    noneFound.includes(d) || teacherItemIds(d).some((id) => checked.includes(id));
  const unreviewed = DIMENSION_ORDER.filter((d) => !isReviewed(d));

  const toggleItem = (id: string, dimension: ScreeningDimension) => {
    draft.update((prev) => ({
      checked: prev.checked.includes(id)
        ? prev.checked.filter((x) => x !== id)
        : [...prev.checked, id],
      noneFound: prev.noneFound.filter((d) => d !== dimension),
    }));
    missing.resolve(dimension);
  };

  const toggleNoneFound = (dimension: ScreeningDimension) => {
    const own = teacherItemIds(dimension);
    draft.update((prev) =>
      prev.noneFound.includes(dimension)
        ? { ...prev, noneFound: prev.noneFound.filter((d) => d !== dimension) }
        : {
            checked: prev.checked.filter((id) => !own.includes(id)),
            noneFound: [...prev.noneFound, dimension],
          }
    );
    missing.resolve(dimension);
  };

  /** จัดกลุ่มรายมิติแบบเรียลไทม์ตามรายการที่ติ๊ก */
  const groups = useMemo(
    () =>
      Object.fromEntries(
        DIMENSION_ORDER.map((d) => [d, classifyDimension(d, checked)])
      ) as Record<ScreeningDimension, ReturnType<typeof classifyDimension>>,
    [checked]
  );

  const overall = overallRisk(Object.values(groups));
  const flaggedCount = Object.values(groups).filter((g) => g !== "green").length;

  if (!student) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">ไม่พบข้อมูลนักเรียน</p>
      </div>
    );
  }

  // ปิดรับแล้ว (UC9): ส่งเพิ่มไม่ได้จนกว่าแอดมินจะขยายช่วงเวลา
  const locked = lockedWindowFor(store.assessmentWindows, "screening");
  if (locked) {
    return (
      <>
        <PageHeader title="คัดกรองนักเรียน" subtitle={CURRENT_TERM.label} />
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="mx-auto max-w-3xl">
            <WindowLocked window={locked} backHref="/screening" backLabel="กลับไปรายชื่อนักเรียน" />
          </div>
        </div>
      </>
    );
  }

  const handleSave = () => {
    if (unreviewed.length > 0) {
      missing.report(unreviewed.map((d) => ({ key: d, label: DIMENSION_LABEL[d] })));
      return;
    }

    const byDimension = Object.fromEntries(
      DIMENSION_ORDER.map((d) => [
        d,
        checked.filter((id) => SCREENING_ITEMS.find((i) => i.id === id)?.dimension === d),
      ])
    ) as Record<ScreeningDimension, string[]>;

    const hadCase = store.caseOf(studentId)?.status === "active";
    const saved = store.saveScreening(studentId, byDimension);
    const red = saved.results.filter((r) => r.group === "red").map((r) => DIMENSION_LABEL[r.dimension]);
    const amber = saved.results.filter((r) => r.group === "amber").map((r) => DIMENSION_LABEL[r.dimension]);
    if (red.length === 0 && amber.length === 0) goRedFlag();
    else setOutcome({ red, amber, caseLinked: hadCase });
  };

  // Red Flag เป็นส่วนหนึ่งของมิติสุขภาพจิต ต้องทำทุกคน (สถานการณ์ B)
  const goRedFlag = () => router.push(`/assessment/red-flag/${studentId}`);

  return (
    <>
      <PageHeader
        title="คัดกรองนักเรียน"
        subtitle={`ประเมินความเสี่ยง 6 มิติ · ${CURRENT_TERM.label}`}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <Link
          href="/screening"
          className="mb-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> กลับไปรายชื่อนักเรียน
        </Link>

        <Card className="mb-4">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-14 items-center justify-center rounded-xl bg-muted text-lg font-bold text-muted-foreground">
              {student.fullName.replace(/^(ด\.ช\.|ด\.ญ\.)\s*/, "").charAt(0)}
            </div>
            <div className="flex-1">
              <div className="text-lg font-bold">
                {student.fullName} · {student.roomName} เลขที่ {student.classNo}
              </div>
              <div className="mt-0.5 text-[13px] text-muted-foreground">
                ผู้คัดกรอง: {CURRENT_TEACHER.name}
              </div>
            </div>
            <div className="text-right">
              <div className="mb-1.5 text-[12.5px] text-muted-foreground">
                ตรวจแล้ว {DIMENSION_ORDER.length - unreviewed.length} จาก {DIMENSION_ORDER.length} มิติ
              </div>
              {unreviewed.length === 0 ? (
                <>
                  <RiskBadge group={overall} />
                  <div className="mt-1 text-[11.5px] text-muted-foreground">
                    {flaggedCount === 0 ? "ไม่พบมิติที่เข้าเกณฑ์" : `พบ ${flaggedCount} จาก 6 มิติ`}
                  </div>
                </>
              ) : (
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  ยังตรวจไม่ครบ
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-accent px-4 py-3">
          <Info className="size-5 shrink-0 text-primary" />
          <p className="text-[13.5px] text-accent-foreground">
            ทุกมิติต้องติ๊กรายการที่พบ หรือเลือก <b>ไม่พบรายการใดในมิตินี้</b> · พบรายการเกณฑ์เสี่ยง ={" "}
            <b>เหลือง</b> · พบรายการเกณฑ์มีปัญหา = <b>แดง</b>
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {DIMENSION_ORDER.map((dimension) => {
            const items = SCREENING_ITEMS.filter((i) => i.dimension === dimension);
            const reviewed = isReviewed(dimension);
            const flagged = missing.isMissing(dimension) && !reviewed;
            return (
              <div key={dimension} ref={missing.registerNode(dimension)}>
                {/* ระดับการ์ด: ใช้ ring ซึ่งโค้งตามมุมการ์ด แทนแถบซ้ายของระดับข้อคำถาม */}
                <Card className={flagged ? "ring-2 ring-destructive/50" : undefined}>
                  <CardContent className="p-5">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-[15px] font-bold">{DIMENSION_LABEL[dimension]}</h3>
                      {reviewed ? (
                        <RiskBadge group={groups[dimension]} short />
                      ) : (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                          ยังไม่ได้ตรวจ
                        </span>
                      )}
                    </div>
                    <MissingNote show={flagged} />

                    <div className="space-y-1">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 py-1.5">
                          <Checkbox
                            id={item.id}
                            checked={checked.includes(item.id)}
                            onCheckedChange={() => toggleItem(item.id, dimension)}
                            disabled={!!item.derivedFrom}
                            className="mt-0.5"
                          />
                          <Label
                            htmlFor={item.id}
                            className="text-[13.5px] leading-relaxed font-normal"
                          >
                            {item.label}
                            {item.derivedFrom && (
                              <span className="ml-1.5 text-[11.5px] text-muted-foreground">
                                (ระบบกรอกจากผล{item.derivedFrom === "red_flag" ? " Red Flag" : " 9S"})
                              </span>
                            )}
                            <span
                              className={
                                item.severity === "problem"
                                  ? "ml-1.5 rounded bg-risk-red-bg px-1.5 py-0.5 text-[10.5px] font-semibold text-risk-red"
                                  : "ml-1.5 rounded bg-risk-amber-bg px-1.5 py-0.5 text-[10.5px] font-semibold text-risk-amber"
                              }
                            >
                              {item.severity === "problem" ? "เกณฑ์มีปัญหา" : "เกณฑ์เสี่ยง"}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 flex items-center gap-3 border-t border-border pt-3">
                      <Checkbox
                        id={`none-${dimension}`}
                        checked={noneFound.includes(dimension)}
                        onCheckedChange={() => toggleNoneFound(dimension)}
                      />
                      <Label
                        htmlFor={`none-${dimension}`}
                        className="text-[13.5px] font-medium text-muted-foreground"
                      >
                        ไม่พบรายการใดในมิตินี้
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pb-4">
          <div className="flex flex-col gap-0.5">
            <AutosaveStatus restored={draft.restored} savedAt={draft.savedAt} />
            <p className="text-[13px] text-muted-foreground">
              {unreviewed.length > 0 ? (
                <span className="text-destructive">ยังไม่ได้ตรวจ {unreviewed.length} มิติ</span>
              ) : (
                "หลังบันทึก ระบบจะพาไปทำแบบคัดกรอง Red Flag ต่อ เพื่อคัดกรองมิติสุขภาพจิตให้ครบ"
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push("/screening")}>
              ออกและทำต่อภายหลัง
            </Button>
            <Button onClick={handleSave}>บันทึกผลคัดกรอง</Button>
          </div>
        </div>
      </div>

      {outcome && (
        <ScreeningOutcome
          outcome={outcome}
          studentName={student.fullName}
          onOpenCase={() => {
            store.openOrLinkCase(studentId, `ผลคัดกรอง 6 มิติ: ${outcome.amber.join(" / ")} เสี่ยง`);
            goRedFlag();
          }}
          onSkip={(reason) => {
            store.setScreeningWatch(studentId, reason);
            goRedFlag();
          }}
          onContinue={goRedFlag}
        />
      )}
    </>
  );
}

function ScreeningOutcome({
  outcome,
  studentName,
  onOpenCase,
  onSkip,
  onContinue,
}: {
  outcome: Outcome;
  studentName: string;
  onOpenCase: () => void;
  onSkip: (reason: string) => void;
  onContinue: () => void;
}) {
  const [skipping, setSkipping] = useState(false);
  const [reason, setReason] = useState("");
  const [other, setOther] = useState("");
  const finalReason = reason === "อื่น ๆ" ? other.trim() : reason;
  const hasRed = outcome.red.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 sm:items-center" role="dialog" aria-modal="true" aria-label="ผลการคัดกรอง">
      <div className="w-full max-w-lg rounded-t-2xl bg-card p-6 shadow-lg sm:rounded-2xl">
        <h2 className="text-[16px] font-bold">บันทึกผลคัดกรองแล้ว · {studentName}</h2>
        <div className="mt-3 space-y-1.5 text-[13.5px]">
          {hasRed && (
            <p>
              <span className="font-semibold text-risk-red">กลุ่มมีปัญหา:</span> {outcome.red.join(", ")}
            </p>
          )}
          {outcome.amber.length > 0 && (
            <p>
              <span className="font-semibold text-risk-amber">กลุ่มเสี่ยง:</span> {outcome.amber.join(", ")}
            </p>
          )}
        </div>

        {hasRed ? (
          <>
            <p className="mt-4 flex gap-2 rounded-lg bg-surface px-3 py-2.5 text-[13px]">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              {outcome.caseLinked
                ? "ระบบเชื่อมผลนี้กับ case ติดตามช่วยเหลือที่เปิดอยู่แล้ว"
                : "ระบบเปิด case ติดตามช่วยเหลือให้แล้ว วางแผนช่วยเหลือได้ที่หน้าติดตามช่วยเหลือ"}
            </p>
            <Button className="mt-5 w-full" onClick={onContinue}>
              ทำแบบคัดกรอง Red Flag ต่อ
            </Button>
          </>
        ) : !skipping ? (
          <>
            <p className="mt-4 text-[13.5px]">จะเปิด case ติดตามช่วยเหลือให้นักเรียนคนนี้ไหม</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={() => setSkipping(true)}>
                ไม่เปิด case
              </Button>
              <Button onClick={onOpenCase}>{outcome.caseLinked ? "เชื่อมกับ case ที่เปิดอยู่" : "เปิด case"}</Button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-4 text-[13.5px] font-semibold">เหตุผลที่ไม่เปิด case</p>
            <p className="text-[12px] text-muted-foreground">นักเรียนจะอยู่ในสถานะ “เฝ้าดูผลคัดกรอง” และเก็บเหตุผลไว้ในประวัติ</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[...SKIP_REASONS, "อื่น ๆ"].map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={reason === r}
                  onClick={() => setReason(r)}
                  className={
                    reason === r
                      ? "rounded-lg border border-primary bg-accent px-3 py-1.5 text-[13px] font-semibold text-primary"
                      : "rounded-lg border border-border px-3 py-1.5 text-[13px] hover:bg-muted"
                  }
                >
                  {r}
                </button>
              ))}
            </div>
            {reason === "อื่น ๆ" && (
              <Input
                aria-label="เหตุผลอื่น"
                value={other}
                onChange={(e) => setOther(e.target.value)}
                placeholder="ระบุเหตุผลสั้น ๆ"
                className="mt-2"
              />
            )}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={() => setSkipping(false)}>
                ย้อนกลับ
              </Button>
              <Button disabled={finalReason === ""} onClick={() => onSkip(finalReason)}>
                บันทึกแล้วทำ Red Flag ต่อ
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
