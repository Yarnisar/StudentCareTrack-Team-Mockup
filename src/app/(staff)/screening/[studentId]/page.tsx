"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Info, X } from "lucide-react";
import { cn } from "cn";
import { PageHeader } from "@/components/layout/page-header";
import { RiskBadge } from "@/components/shared/risk-badge";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { CURRENT_TERM } from "@/lib/mock-data";
import { classifyDimension, overallRisk, SCREENING_ITEMS } from "@/lib/rules";
import { useStore } from "@/lib/store";
import { DIMENSION_LABEL, DIMENSION_ORDER, ScreeningDimension } from "@/lib/types";

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

  const [checked, setChecked] = useState<string[]>(
    () => previous?.results.flatMap((r) => r.checkedItemIds) ?? []
  );

  const toggle = (id: string) =>
    setChecked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const idsOf = (dimension: ScreeningDimension) =>
    SCREENING_ITEMS.filter((i) => i.dimension === dimension).map((i) => i.id);
  const selectedIn = (dimension: ScreeningDimension) =>
    idsOf(dimension).filter((id) => checked.includes(id)).length;
  const clearDimension = (dimension: ScreeningDimension) => {
    const ids = idsOf(dimension);
    setChecked((prev) => prev.filter((id) => !ids.includes(id)));
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
    const byDimension = Object.fromEntries(
      DIMENSION_ORDER.map((d) => [
        d,
        checked.filter((id) => SCREENING_ITEMS.find((i) => i.id === id)?.dimension === d),
      ])
    ) as Record<ScreeningDimension, string[]>;

    store.saveScreening(studentId, byDimension);

    // มิติสุขภาพจิตหรือพฤติกรรมเข้าเกณฑ์ -> เข้าสู่ขั้นตอนประเมิน Red Flag ต่อ
    if (groups.mental !== "green" || groups.behavior !== "green") {
      router.push(`/assessment/red-flag/${studentId}`);
    } else {
      router.push(`/students/${studentId}`);
    }
  };

  return (
    <>
      <PageHeader
        title="คัดกรองนักเรียน"
        subtitle={`ประเมินความเสี่ยง 6 มิติ · ${CURRENT_TERM.label}`}
      />

      <div className="flex-1 overflow-y-auto p-8">
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
                ผู้คัดกรอง: {store.currentUser.name}
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
            พบเกณฑ์เสี่ยง = <b>เสี่ยง</b> · พบเกณฑ์มีปัญหา = <b>มีปัญหา</b> — ผลคำนวณทันที
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {DIMENSION_ORDER.map((dimension) => {
            const items = SCREENING_ITEMS.filter((i) => i.dimension === dimension);
            return (
              <Card key={dimension}>
                <CardContent className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-[15px] font-bold">{DIMENSION_LABEL[dimension]}</h3>
                    <RiskBadge group={groups[dimension]} short />
                  </div>

                  <div className="space-y-2">
                    {items.map((item) => {
                      const active = checked.includes(item.id);
                      const problem = item.severity === "problem";
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="checkbox"
                          aria-checked={active}
                          onClick={() => toggle(item.id)}
                          className={cn(
                            "flex min-h-12 w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-[14px] leading-snug transition-colors",
                            "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                            active
                              ? problem
                                ? "border-risk-red/50 bg-risk-red-bg font-semibold"
                                : "border-risk-amber/50 bg-risk-amber-bg font-semibold"
                              : "border-border bg-card hover:border-primary/40 hover:bg-muted/60"
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
                          <span className="flex-1">{item.label}</span>
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
                      {selectedIn(dimension) === 0
                        ? "ยังไม่พบรายการ"
                        : `พบ ${selectedIn(dimension)} รายการ`}
                    </span>
                    {selectedIn(dimension) > 0 && (
                      <button
                        type="button"
                        onClick={() => clearDimension(dimension)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium hover:bg-muted hover:text-foreground"
                      >
                        <X className="size-3.5" /> ล้างมิตินี้
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between pb-4">
          <p className="text-[13px] text-muted-foreground">
            {groups.mental !== "green" || groups.behavior !== "green"
              ? "มิติสุขภาพจิตหรือพฤติกรรมเข้าเกณฑ์ — ระบบจะพาไปทำแบบคัดกรอง Red Flag ต่อหลังบันทึก"
              : "ไม่พบความเสี่ยงด้านสุขภาพจิตและพฤติกรรม — บันทึกผลแล้วกลับสู่หน้าข้อมูลนักเรียน"}
          </p>
          <div className="flex gap-3">
            <LinkButton variant="outline" href="/screening">
              ยกเลิก
            </LinkButton>
            <Button onClick={handleSave}>บันทึกผลคัดกรอง</Button>
          </div>
        </div>
      </div>
    </>
  );
}
