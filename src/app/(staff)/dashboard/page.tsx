"use client";

/**
 * หน้าภาพรวม
 *
 * PROTOTYPE: หน้านี้กำลังโฮสต์แบบร่าง 3 แบบของ "ภาพรวมสำหรับแอดมินโรงเรียน"
 * พร้อมทดสอบการแบ่งหน้าเมื่อข้อมูลมีหลักพันแถว (?variant=A|B|C จากแถบลอยด้านล่าง)
 * ปุ่มสลับขอบเขตด้านบนใช้เทียบว่าแอดมินเห็นมากกว่าครูประจำชั้นแค่ไหน
 * ข้อมูลที่ใช้เป็นข้อมูลจำลองในหน่วยความจำ (~1,500 คน) ไม่เกี่ยวกับข้อมูลตัวอย่างเดิม
 * เมื่อเลือกแบบได้แล้วให้ยุบเหลือแบบเดียวและลบโฟลเดอร์ _prototype/ ทิ้ง
 */

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Building2, User } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PrototypeSwitcher } from "@/components/prototype/prototype-switcher";
import { CURRENT_TERM } from "@/lib/mock-data";
import { MY_ROOM, SCOPE_LABEL, totalsOf, type Scope } from "./_prototype/school-data";
import { VariantA, VARIANT_A_NAME } from "./_prototype/variant-a";
import { VariantB, VARIANT_B_NAME } from "./_prototype/variant-b";
import { VariantC, VARIANT_C_NAME } from "./_prototype/variant-c";

const VARIANTS = [
  { key: "A", name: VARIANT_A_NAME },
  { key: "B", name: VARIANT_B_NAME },
  { key: "C", name: VARIANT_C_NAME },
];

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const params = useSearchParams();
  const variant = params.get("variant") ?? "A";
  const [scope, setScope] = useState<Scope>("school");

  const totals = totalsOf(scope);

  return (
    <>
      <PageHeader
        title="ภาพรวมการดูแลช่วยเหลือนักเรียน"
        subtitle={`${CURRENT_TERM.label} · ${SCOPE_LABEL[scope]} · ${totals.total.toLocaleString("th-TH")} คน`}
      />

      <div className="flex items-center gap-2 border-b border-border bg-surface px-8 py-2.5">
        <span className="text-[12.5px] text-muted-foreground">ขอบเขตข้อมูลที่เห็น:</span>
        {(
          [
            { key: "school" as Scope, label: "ทั้งโรงเรียน (แอดมิน)", icon: Building2 },
            { key: "room" as Scope, label: `เฉพาะ ${MY_ROOM} (ครูประจำชั้น)`, icon: User },
          ]
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setScope(key)}
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] transition-colors ${
              scope === key
                ? "border-primary bg-accent font-semibold text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {variant === "A" && <VariantA scope={scope} />}
      {variant === "B" && <VariantB scope={scope} />}
      {variant === "C" && <VariantC scope={scope} />}

      <PrototypeSwitcher variants={VARIANTS} />
    </>
  );
}
