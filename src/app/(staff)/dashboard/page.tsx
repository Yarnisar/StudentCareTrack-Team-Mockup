"use client";

/**
 * หน้าภาพรวม
 *
 * PROTOTYPE: หน้านี้กำลังโฮสต์แบบร่าง 3 แบบของ "ภาพรวมสำหรับแอดมินโรงเรียน"
 * พร้อมทดสอบการแบ่งหน้าเมื่อข้อมูลมีหลักพันแถว (?variant=A|B|C จากแถบลอยด้านล่าง)
 * ขอบเขตข้อมูลมาจากบทบาท: แอดมินเห็นทั้งโรงเรียน ครูประจำชั้นเห็นเฉพาะห้องตัวเอง
 * (เทียบสองมุมมองได้จากแถบสลับบทบาท DEMO มุมขวาล่าง)
 * ข้อมูลที่ใช้เป็นข้อมูลจำลองในหน่วยความจำ (~1,500 คน) ไม่เกี่ยวกับข้อมูลตัวอย่างเดิม
 * เมื่อเลือกแบบได้แล้วให้ยุบเหลือแบบเดียวและลบโฟลเดอร์ _prototype/ ทิ้ง
 */

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { PrototypeSwitcher } from "@/components/prototype/prototype-switcher";
import { CURRENT_TERM } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { SCOPE_LABEL, totalsOf, type Scope } from "./_prototype/school-data";
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
  const { role } = useStore();
  const scope: Scope = role === "admin" ? "school" : "room";

  const totals = totalsOf(scope);

  return (
    <>
      <PageHeader
        title="ภาพรวมการดูแลช่วยเหลือนักเรียน"
        subtitle={`${CURRENT_TERM.label} · ${SCOPE_LABEL[scope]} · ${totals.total.toLocaleString("th-TH")} คน`}
      />

      {variant === "A" && <VariantA scope={scope} />}
      {variant === "B" && <VariantB scope={scope} />}
      {variant === "C" && <VariantC scope={scope} />}

      <PrototypeSwitcher variants={VARIANTS} />
    </>
  );
}
