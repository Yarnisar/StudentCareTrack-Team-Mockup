"use client";

/**
 * หน้าตั้งค่าระบบ (แอดมินโรงเรียน — RoleGate กันไว้ที่ layout)
 *
 * คอลัมน์เดียวเรียงการ์ด: ตั้งค่าโรงเรียน → ช่วงดำเนินงาน → กฎความประพฤติ → ครูและสิทธิ์ → ประวัติการใช้งาน
 * การยืนยัน: แก้ช่วงดำเนินงาน/ตั้งค่าโรงเรียน/มอบหมายครู = ยืนยันในที่ · ปิดใช้งานกฎความประพฤติ = กล่องกลางจอ
 * ทุกการแก้ไขเขียนลงสโตร์ทันทีพร้อม audit log และมีผลกับทุกหน้า
 */

import { useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { AuditLogSection } from "@/components/settings/audit-log";
import { BehaviorRulesSection } from "@/components/settings/behavior-rules-panel";
import type { ImpactContext } from "@/components/settings/confirm-text";
import { OperatingWindowsSection } from "@/components/settings/operating-windows";
import { SchoolSettingsCard } from "@/components/settings/school-settings-card";
import { TeachersSection } from "@/components/settings/teachers-panel";
import { nowThaiIso, thaiDateOf } from "@/lib/format";
import { DEPLOYMENT_MODE, DEPLOYMENT_MODE_LABEL } from "@/lib/deployment-mode";
import { CURRENT_TERM, SCHOOL_NAME } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

export default function SettingsPage() {
  const store = useStore();

  /** จำนวนบันทึกความประพฤติที่อ้างอิงกฎแต่ละข้อ — ประกอบการตัดสินใจปิดใช้งาน (ไม่มีการลบกฎ) */
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
      today: thaiDateOf(nowThaiIso()),
    }),
    [store.sdq, store.students]
  );

  return (
    <>
      <PageHeader title="ตั้งค่าระบบ" subtitle={`${SCHOOL_NAME} · ${CURRENT_TERM.label}`} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-5 p-5 lg:p-8">
          <p className="text-[12px] text-muted-foreground">โหมดข้อมูล: {DEPLOYMENT_MODE_LABEL[DEPLOYMENT_MODE]}</p>
          <SchoolSettingsCard impact={impact} />
          <OperatingWindowsSection impact={impact} />
          <BehaviorRulesSection ruleUsage={ruleUsage} />
          <TeachersSection />
          <AuditLogSection />
        </div>
      </div>
    </>
  );
}
