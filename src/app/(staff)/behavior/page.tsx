"use client";

/**
 * หน้าการจัดการความประพฤติ
 *
 * PROTOTYPE: หน้านี้กำลังโฮสต์แบบร่าง 3 แบบของการจัดวางรายการบันทึก
 * เพื่อตอบคำถามว่า "จัดวางอย่างไรให้ชื่อพฤติกรรมและรายละเอียดเหตุการณ์ไม่ถูกตัด"
 * สลับด้วย ?variant=A|B|C จากแถบลอยด้านล่าง (แสดงเฉพาะตอน dev)
 * เมื่อเลือกแบบได้แล้ว ให้ยุบเหลือแบบเดียวและลบโฟลเดอร์ _prototype/ ทิ้ง
 */

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { PrototypeSwitcher } from "@/components/prototype/prototype-switcher";
import { CURRENT_TERM } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { useBehaviorForm } from "./_prototype/shared";
import { VariantA, VARIANT_A_NAME } from "./_prototype/variant-a";
import { VariantB, VARIANT_B_NAME } from "./_prototype/variant-b";
import { VariantC, VARIANT_C_NAME } from "./_prototype/variant-c";

const VARIANTS = [
  { key: "A", name: VARIANT_A_NAME },
  { key: "B", name: VARIANT_B_NAME },
  { key: "C", name: VARIANT_C_NAME },
];

export default function BehaviorPage() {
  return (
    <Suspense fallback={null}>
      <BehaviorContent />
    </Suspense>
  );
}

function BehaviorContent() {
  const params = useSearchParams();
  const variant = params.get("variant") ?? "A";

  const store = useStore();
  const form = useBehaviorForm();

  const records = useMemo(
    () => [...store.behaviorRecords].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
    [store.behaviorRecords]
  );

  return (
    <>
      <PageHeader
        title="การจัดการความประพฤติ"
        subtitle={`บันทึกและติดตามพฤติกรรมนักเรียน · ${CURRENT_TERM.label}`}
      />

      {variant === "A" && <VariantA records={records} form={form} />}
      {variant === "B" && <VariantB records={records} form={form} />}
      {variant === "C" && <VariantC records={records} form={form} />}

      <PrototypeSwitcher variants={VARIANTS} />
    </>
  );
}
