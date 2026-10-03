"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Info } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { RiskBadge } from "@/components/shared/risk-badge";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CURRENT_TEACHER, CURRENT_TERM } from "@/lib/mock-data";
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
                ผู้คัดกรอง: {CURRENT_TEACHER.name}
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
            เกณฑ์จัดกลุ่ม: ไม่พบรายการใด = <b>เขียว (ปกติ)</b> · พบรายการเกณฑ์เสี่ยง ={" "}
            <b>เหลือง</b> · พบรายการเกณฑ์มีปัญหา = <b>แดง</b> — ผลจะคำนวณทันทีเมื่อเลือกรายการ
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

                  <div className="space-y-1">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 py-1.5">
                        <Checkbox
                          id={item.id}
                          checked={checked.includes(item.id)}
                          onCheckedChange={() => toggle(item.id)}
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor={item.id}
                          className="text-[13.5px] leading-relaxed font-normal"
                        >
                          {item.label}
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
