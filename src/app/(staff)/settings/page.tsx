"use client";

/**
 * หน้าตั้งค่าระบบ (ผู้ดูแลระบบ)
 * แบ่งเป็นแท็บตามเรื่อง (?tab=windows|rules|score|audit) รายการเป็นแถวสรุป กดแล้วแก้ในแผงด้านข้าง
 * รวมแบบร่าง A, B, C เดิมเหลือแบบเดียว เพราะหน้ายาวต้องเลื่อนมากและเข้าถึงเรื่องที่จะแก้ได้ช้า
 *
 * วิธีถามยืนยันก่อนสลับสวิตช์ใช้แบบ A (กล่องกลางจอ) ลิงก์ที่ใส่ ?confirm=B|C ยังใช้ทดลองแบบอื่นได้ แต่ไม่มีแผงสลับบนหน้าจอแล้ว
 */

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { useStore } from "@/lib/store";
import { CURRENT_TERM, SCHOOL_NAME } from "@/lib/mock-data";
import { ConfirmProvider, type ConfirmStyle } from "./_prototype/confirm";
import type { ImpactContext } from "./_prototype/confirm-text";
import { useSettingsPrototype, windowStatus } from "./_prototype/state";
import { SettingsWorkspace } from "./_prototype/workspace";

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const params = useSearchParams();
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
  const activeRules = store.behaviorRules.filter((r) => r.isActive).length;

  return (
    <ConfirmProvider style={confirmStyle}>
      <PageHeader
        title="ตั้งค่าระบบ"
        subtitle={`${SCHOOL_NAME} · ${CURRENT_TERM.label} · เปิดให้ทำอยู่ ${openNow} รอบ · กฎที่ใช้งาน ${activeRules} จาก ${store.behaviorRules.length} ข้อ`}
      />

      <SettingsWorkspace proto={proto} ruleUsage={ruleUsage} impact={impact} />
    </ConfirmProvider>
  );
}
