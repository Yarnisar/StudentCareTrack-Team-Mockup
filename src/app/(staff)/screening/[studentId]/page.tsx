"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Info } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { RiskBadge } from "@/components/shared/risk-badge";
import { AutosaveStatus } from "@/components/assessment/autosave-status";
import { MissingNote, useMissingAnswers } from "@/components/assessment/missing-answers";
import { useDraft } from "@/components/assessment/use-draft";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CURRENT_TEACHER, CURRENT_TERM } from "@/lib/mock-data";
import { classifyDimension, overallRisk, SCREENING_ITEMS } from "@/lib/rules";
import { draftKey, useStore } from "@/lib/store";
import { DIMENSION_LABEL, DIMENSION_ORDER, ScreeningDimension } from "@/lib/types";

/** รายการที่ครูติ๊กเองได้ (ไม่รวมรายการที่ระบบกรอกจากผลแบบประเมิน) */
const teacherItemIds = (dimension: ScreeningDimension) =>
  SCREENING_ITEMS.filter((i) => i.dimension === dimension && !i.derivedFrom).map((i) => i.id);

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

    store.saveScreening(studentId, byDimension);

    // Red Flag เป็นส่วนหนึ่งของมิติสุขภาพจิต ต้องทำทุกคน (ตาราง 3.6 ข้อ 6)
    router.push(`/assessment/red-flag/${studentId}`);
  };

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
    </>
  );
}
