"use client";

/**
 * หน้าตั้งค่าระบบ
 *
 * PROTOTYPE: หน้านี้เปรียบเทียบ 2 แกนพร้อมกัน
 *   ?variant=A|B|C  — หน้าตาของหน้าตั้งค่า (ลูกศร ← →)
 *   ?confirm=A|B|C  — วิธีถามยืนยันก่อนสลับสวิตช์เปิด-ปิด (ลูกศร ↑ ↓)
 * แถบสลับแสดงเฉพาะตอน dev เมื่อเลือกได้แล้วให้ยุบเหลืออย่างละแบบและลบโฟลเดอร์ _prototype/ ทิ้ง
 */

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { PrototypeSwitcher } from "@/components/prototype/prototype-switcher";
import { useStore } from "@/lib/store";
import { CURRENT_TERM, SCHOOL_NAME } from "@/lib/mock-data";
import { CONFIRM_VARIANTS, ConfirmProvider, type ConfirmStyle } from "./_prototype/confirm";
import type { ImpactContext } from "./_prototype/confirm-text";
import { useSettingsPrototype, windowStatus } from "./_prototype/state";
import { VariantA, VARIANT_A_NAME } from "./_prototype/variant-a";
import { VariantB, VARIANT_B_NAME } from "./_prototype/variant-b";
import { VariantC, VARIANT_C_NAME } from "./_prototype/variant-c";

const VARIANTS = [
  { key: "A", name: VARIANT_A_NAME },
  { key: "B", name: VARIANT_B_NAME },
  { key: "C", name: VARIANT_C_NAME },
];

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const params = useSearchParams();
  const variant = params.get("variant") ?? "A";
  const confirmStyle = (params.get("confirm") ?? "A") as ConfirmStyle;

  const store = useStore();
  const proto = useSettingsPrototype();

  /** จำนวนบันทึกความประพฤติที่อ้างอิงกฎแต่ละข้อ — ใช้ตัดสินว่าลบกฎได้หรือไม่ */
  const ruleUsage = useMemo(() => {
    const map: Record<string, number> = {};
    for (const rec of store.behaviorRecords) {
      map[rec.ruleId] = (map[rec.ruleId] ?? 0) + 1;
    }
    return map;
  }, [store.behaviorRecords]);

  /** ผลกระทบจริงที่ใช้ประกอบข้อความยืนยัน */
  const impact: ImpactContext = useMemo(
    () => ({
      pendingSdq: store.sdq.filter((s) => s.status === "pending").length,
      studentCount: store.students.length,
    }),
    [store.sdq, store.students]
  );

  const openNow = proto.windows.filter((w) => windowStatus(w) === "open").length;
  const activeRules = proto.rules.filter((r) => r.isActive).length;

  return (
    <ConfirmProvider style={confirmStyle}>
      <PageHeader
        title="ตั้งค่าระบบ"
        subtitle={`${SCHOOL_NAME} · ${CURRENT_TERM.label} · เปิดให้ทำอยู่ ${openNow} รอบ · กฎที่ใช้งาน ${activeRules} จาก ${proto.rules.length} ข้อ`}
      />

      {variant === "A" && <VariantA proto={proto} ruleUsage={ruleUsage} impact={impact} />}
      {variant === "B" && <VariantB proto={proto} ruleUsage={ruleUsage} impact={impact} />}
      {variant === "C" && <VariantC proto={proto} ruleUsage={ruleUsage} impact={impact} />}

      <PrototypeSwitcher
        variants={VARIANTS}
        secondary={{
          param: "confirm",
          label: "การยืนยัน",
          variants: CONFIRM_VARIANTS,
        }}
      />
    </ConfirmProvider>
  );
}
