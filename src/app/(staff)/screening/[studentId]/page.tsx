"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Info, Lock, Sparkles, X } from "lucide-react";
import { cn } from "cn";
import { PageHeader } from "@/components/layout/page-header";
import { RiskBadge } from "@/components/shared/risk-badge";
import { WindowNotice } from "@/components/shared/window-notice";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { adjustmentOptions, overallRisk, SCREENING_ITEMS, screeningItemLabel } from "@/lib/rules";
import { useStore, type ScreeningInputs } from "@/lib/store";
import {
  DIMENSION_LABEL,
  DIMENSION_ORDER,
  RISK_LABEL,
  type RiskGroup,
  type ScreeningDimension,
  type ScreeningItem,
} from "@/lib/types";

type Adjust = Partial<Record<ScreeningDimension, { to: RiskGroup | null; reason: string }>>;

export default function ScreeningFormPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const router = useRouter();
  const store = useStore();
  const student = store.getStudent(studentId);
  const existing = store.screeningOf(studentId);
  const blocked = store.screeningEditBlockReason(studentId);
  const readOnly = blocked !== null;

  const [checked, setChecked] = useState<string[]>(
    () => existing?.results.flatMap((r) => r.checkedItemIds) ?? []
  );
  const [adjust, setAdjust] = useState<Adjust>(() =>
    Object.fromEntries(
      (existing?.results ?? [])
        .filter((r) => r.teacherGroup)
        .map((r) => [r.dimension, { to: r.teacherGroup, reason: r.adjustReason ?? "" }])
    )
  );
  const [error, setError] = useState<string | null>(null);

  const facts = store.derivedFactsOf(studentId);
  const plan = store.assessmentPlanOf(studentId);

  const inputs = Object.fromEntries(
    DIMENSION_ORDER.map((d) => [
      d,
      {
        checkedItemIds: checked.filter((id) => SCREENING_ITEMS.find((i) => i.id === id)?.dimension === d),
        teacherGroup: adjust[d]?.to ?? null,
        adjustReason: adjust[d]?.reason ?? null,
      },
    ])
  ) as ScreeningInputs;
  const results = store.previewScreening(studentId, inputs);
  const resultOf = (d: ScreeningDimension) => results.find((r) => r.dimension === d)!;
  const overall = overallRisk(results.map((r) => r.group));
  const flaggedCount = results.filter((r) => r.group === "amber" || r.group === "red").length;

  if (!student) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">ไม่พบข้อมูลนักเรียน</p>
      </div>
    );
  }

  const toggle = (item: ScreeningItem) => {
    if (readOnly || item.derived) return;
    setChecked((prev) => (prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev, item.id]));
  };
  const manualIdsOf = (d: ScreeningDimension) =>
    SCREENING_ITEMS.filter((i) => i.dimension === d && !i.derived).map((i) => i.id);
  const clearDimension = (d: ScreeningDimension) => {
    const ids = manualIdsOf(d);
    setChecked((prev) => prev.filter((id) => !ids.includes(id)));
  };
  const setAdjustFor = (d: ScreeningDimension, patch: { to?: RiskGroup | null; reason?: string }) =>
    setAdjust((prev) => ({ ...prev, [d]: { to: prev[d]?.to ?? null, reason: prev[d]?.reason ?? "", ...patch } }));

  const derivedNote = (item: ScreeningItem): string => {
    if (item.derived === "late_count")
      return `มาสาย (ยืนยันแล้ว) เดือนนี้ ${facts.confirmedLateCount} ครั้ง · เกณฑ์ ${facts.lateAlertThreshold} ครั้ง`;
    const rec = item.derived === "red_flag" ? plan.redFlag : plan.nineS;
    if (!rec) return "ยังไม่ได้ประเมิน";
    const termNote = rec.termId === store.currentTerm.termId ? "ภาคเรียนนี้" : "ภาคเรียนที่ 1";
    return `ผลประเมิน${termNote}: ${rec.result === "needs_care" ? "ควรดูแล" : "ปกติ"}`;
  };

  const handleSave = () => {
    // เหตุผลว่างเมื่อเลือกปรับผล → ยังบันทึกไม่ได้
    const res = store.saveScreening(studentId, inputs);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(`/screening/${studentId}/result`);
  };

  const mentalPending = resultOf("mental").computedGroup === "pending";
  const assessmentHref =
    plan.next === "red_flag" ? `/assessment/red-flag/${studentId}` : `/assessment/nine-s/${studentId}`;

  return (
    <>
      <PageHeader
        title="คัดกรองนักเรียน"
        subtitle={`คัดกรอง 6 มิติ · ${store.currentTerm.label}`}
      />

      <div className="flex-1 overflow-y-auto p-8">
        <Link
          href="/screening"
          className="mb-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> กลับไปรายชื่อนักเรียน
        </Link>

        <WindowNotice activity="screening" className="mb-4" />

        {readOnly && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted px-4 py-3 text-[13px] text-muted-foreground">
            <Lock className="size-4 shrink-0" />
            <span className="flex-1">{blocked}</span>
            {existing && (
              <LinkButton size="sm" variant="outline" href={`/screening/${studentId}/result`}>
                ดูผลการคัดกรอง
              </LinkButton>
            )}
          </div>
        )}

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
                ผู้คัดกรอง: {store.currentUser.name}
                {existing?.status === "certified" &&
                  !readOnly &&
                  " · รับรองข้อมูลแล้ว — ถ้าบันทึกการแก้ไข ต้องรับรองข้อมูลใหม่"}
              </div>
            </div>
            <div className="text-right">
              <div className="mb-1.5 text-[12.5px] text-muted-foreground">ผลรวมปัจจุบัน</div>
              <RiskBadge group={overall} />
              <div className="mt-1 text-[11.5px] text-muted-foreground">
                {flaggedCount === 0 ? "ไม่พบมิติที่เข้าเกณฑ์" : `พบ ${flaggedCount} จาก 6 มิติ`}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-accent px-4 py-3">
          <Info className="size-5 shrink-0 text-primary" />
          <p className="text-[13.5px] text-accent-foreground">
            แตะที่รายการที่พบในนักเรียน (แตะซ้ำเพื่อยกเลิก) · ไม่พบรายการใด = <b>ปกติ</b> ·
            พบเกณฑ์เสี่ยง = <b>เสี่ยง</b> · พบเกณฑ์มีปัญหา = <b>มีปัญหา</b> — ผลคำนวณทันที ·
            รายการที่มีป้าย <b>ระบบกำหนด</b> มาจากข้อมูลอื่น ติ๊กเองไม่ได้
          </p>
        </div>

        {mentalPending && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-[13px]">
            <Sparkles className="size-4 shrink-0 text-primary" />
            <span className="flex-1">
              มิติสุขภาพจิต<b>รอผลประเมิน</b> — ต้องมีผลแบบคัดกรอง Red Flag
              {plan.redFlag ? " และ 9S" : ""} ของปีการศึกษานี้ก่อน
            </span>
            {(plan.next === "red_flag" || plan.next === "nine_s") && (
              <LinkButton size="sm" variant="outline" href={assessmentHref}>
                {plan.next === "red_flag" ? "ทำแบบคัดกรอง Red Flag" : "ทำแบบประเมิน 9S"}
              </LinkButton>
            )}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-2">
          {DIMENSION_ORDER.map((dimension) => {
            const items = SCREENING_ITEMS.filter((i) => i.dimension === dimension);
            const result = resultOf(dimension);
            const options = adjustmentOptions(result.computedGroup);
            const adj = adjust[dimension];
            const selectedAdjust = adj?.to && options.includes(adj.to) ? adj.to : null;
            const manualSelected = result.checkedItemIds.length;
            return (
              <Card key={dimension}>
                <CardContent className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-[15px] font-bold">{DIMENSION_LABEL[dimension]}</h3>
                    <RiskBadge group={result.group} />
                  </div>

                  <div className="space-y-2">
                    {items.map((item) => {
                      const derived = !!item.derived;
                      const active = derived
                        ? result.derivedItemIds.includes(item.id)
                        : checked.includes(item.id);
                      const problem = item.severity === "problem";
                      const disabled = readOnly || derived;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="checkbox"
                          aria-checked={active}
                          aria-disabled={disabled}
                          onClick={() => toggle(item)}
                          className={cn(
                            "flex min-h-12 w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-[14px] leading-snug transition-colors",
                            "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                            disabled && "cursor-default",
                            active
                              ? problem
                                ? "border-risk-red/50 bg-risk-red-bg font-semibold"
                                : "border-risk-amber/50 bg-risk-amber-bg font-semibold"
                              : derived
                                ? "border-dashed border-border bg-surface"
                                : cn("border-border bg-card", !readOnly && "hover:border-primary/40 hover:bg-muted/60")
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-6 shrink-0 items-center justify-center rounded-md border-2",
                              active
                                ? problem
                                  ? "border-risk-red bg-risk-red"
                                  : "border-risk-amber bg-risk-amber"
                                : "border-input bg-card"
                            )}
                          >
                            {active && <Check className="size-4 text-white" strokeWidth={3} />}
                          </span>
                          <span className="flex-1">
                            {screeningItemLabel(item, { lateAlertThreshold: facts.lateAlertThreshold })}
                            {derived && (
                              <span className="mt-0.5 block text-[11.5px] font-normal text-muted-foreground">
                                {derivedNote(item)}
                              </span>
                            )}
                          </span>
                          {derived && (
                            <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11.5px] font-semibold text-muted-foreground">
                              ระบบกำหนด
                            </span>
                          )}
                          <span
                            className={cn(
                              "shrink-0 rounded-md px-2 py-0.5 text-[11.5px] font-semibold",
                              problem
                                ? "bg-risk-red-bg text-risk-red"
                                : "bg-risk-amber-bg text-risk-amber"
                            )}
                          >
                            {problem ? "เกณฑ์มีปัญหา" : "เกณฑ์เสี่ยง"}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[12.5px] text-muted-foreground">
                    <span>
                      {manualSelected + result.derivedItemIds.length === 0
                        ? "ยังไม่พบรายการ"
                        : `พบ ${manualSelected + result.derivedItemIds.length} รายการ`}
                    </span>
                    {manualSelected > 0 && !readOnly && (
                      <button
                        type="button"
                        onClick={() => clearDimension(dimension)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium hover:bg-muted hover:text-foreground"
                      >
                        <X className="size-3.5" /> ล้างมิตินี้
                      </button>
                    )}
                  </div>

                  {/* ผลที่ครูเลือก: ต่างจากผลที่คำนวณได้ไม่เกิน 1 ระดับ ต้องมีเหตุผล */}
                  {options.length > 0 && (
                    <div className="mt-3 border-t border-border pt-3">
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-[12.5px]">
                        <span className="text-muted-foreground">ผลที่ระบบคำนวณ</span>
                        <RiskBadge group={result.computedGroup} />
                        <span className="ml-auto text-muted-foreground">ผลที่ครูเลือก:</span>
                        {[null, ...options].map((opt) => {
                          const on = selectedAdjust === opt;
                          return (
                            <button
                              key={opt ?? "computed"}
                              type="button"
                              disabled={readOnly}
                              onClick={() => setAdjustFor(dimension, { to: opt })}
                              className={cn(
                                "rounded-lg border px-2.5 py-1 font-medium",
                                on ? "border-primary bg-accent text-primary" : "border-border hover:bg-muted",
                                readOnly && "cursor-default opacity-70"
                              )}
                            >
                              {opt ? RISK_LABEL[opt] : "ตามที่คำนวณ"}
                            </button>
                          );
                        })}
                      </div>
                      {selectedAdjust && (
                        <Textarea
                          value={adj?.reason ?? ""}
                          disabled={readOnly}
                          onChange={(e) => setAdjustFor(dimension, { reason: e.target.value })}
                          placeholder="เหตุผลที่ปรับผล (จำเป็น)"
                          aria-invalid={!adj?.reason.trim()}
                          className="text-[13px]"
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!readOnly && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pb-4">
            <p className="text-[13px] text-muted-foreground">
              {error ? (
                <span className="text-risk-red">{error}</span>
              ) : (
                "บันทึกเป็นร่างก่อน แล้วครูประจำชั้นรับรองข้อมูลในหน้าถัดไป — การเปิด case อัตโนมัติใช้ผลที่ระบบคำนวณ"
              )}
            </p>
            <div className="flex gap-3">
              <LinkButton variant="outline" href="/screening">
                ยกเลิก
              </LinkButton>
              <Button onClick={handleSave}>บันทึกผลคัดกรอง</Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
