"use client";

/**
 * หน้าตั้งค่าระบบ (แอดมินโรงเรียน — RoleGate กันไว้ที่ layout)
 *
 * รูปแบบ: พื้นที่ทำงานแบบแท็บ + ตาราง + แผงแก้ไขด้านขวา
 * การยืนยัน: แก้ช่วงดำเนินงาน/ตั้งค่าโรงเรียน = ยืนยันในที่ · ปิดใช้งานกฎความประพฤติ = กล่องกลางจอ
 * ทุกการแก้ไขเขียนลงสโตร์ทันทีพร้อม audit log และมีผลกับทุกหน้า
 */

import { useMemo, useState } from "react";
import { CalendarClock, Gavel, History, UserCog } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AuditLogList, useAuditEntries } from "@/components/settings/audit-log";
import { BehaviorRulesPanel } from "@/components/settings/behavior-rules-panel";
import type { ImpactContext } from "@/components/settings/confirm-text";
import { OperatingWindowsPanel } from "@/components/settings/operating-windows-panel";
import { TeachersPanel } from "@/components/settings/teachers-panel";
import { SchoolSettingsCard } from "@/components/settings/school-settings-card";
import { nowThaiIso, thaiDateOf } from "@/lib/format";
import { CURRENT_TERM, SCHOOL_NAME } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { OPERATING_ACTIVITIES } from "@/lib/types";

type Tab = "windows" | "rules" | "teachers" | "audit";

export default function SettingsPage() {
  const store = useStore();
  const [tab, setTab] = useState<Tab>("windows");
  const entries = useAuditEntries();

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

  const openNow = OPERATING_ACTIVITIES.filter((a) => store.windowStatusOf(a) === "open").length;
  const activeRules = store.behaviorRules.filter((r) => r.isActive).length;

  const tabs: { key: Tab; label: string; icon: typeof CalendarClock; count: number }[] = [
    { key: "windows", label: "ช่วงดำเนินงาน", icon: CalendarClock, count: OPERATING_ACTIVITIES.length },
    { key: "rules", label: "กฎความประพฤติ", icon: Gavel, count: store.behaviorRules.length },
    {
      key: "teachers",
      label: "ครูและสิทธิ์",
      icon: UserCog,
      count: store.users.filter((u) => u.role === "teacher_general" || u.role === "teacher_homeroom").length,
    },
    { key: "audit", label: "ประวัติการใช้งาน", icon: History, count: entries.length },
  ];

  return (
    <>
      <PageHeader
        title="ตั้งค่าระบบ"
        subtitle={`${SCHOOL_NAME} · ${CURRENT_TERM.label} · อยู่ในช่วงดำเนินงาน ${openNow} กิจกรรม · กฎที่ใช้งาน ${activeRules} จาก ${store.behaviorRules.length} ข้อ`}
      />

      <SchoolSettingsCard impact={impact} />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <nav className="w-56 shrink-0 space-y-1 border-r border-border bg-surface p-4">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => setTab(t.key)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13.5px] ${
                  active
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="size-4" />
                <span className="flex-1">{t.label}</span>
                <span className={`text-[11.5px] ${active ? "opacity-80" : ""}`}>{t.count}</span>
              </button>
            );
          })}
        </nav>

        {tab === "windows" && <OperatingWindowsPanel impact={impact} />}
        {tab === "rules" && <BehaviorRulesPanel ruleUsage={ruleUsage} />}
        {tab === "teachers" && <TeachersPanel />}
        {tab === "audit" && (
          <div className="min-w-0 flex-1 overflow-y-auto p-6">
            <h2 className="text-[15.5px] font-bold">ประวัติการใช้งาน (Audit Log)</h2>
            <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
              บันทึกทุกการกระทำที่เปลี่ยนแปลงข้อมูล พร้อมผู้กระทำและเวลา — เพิ่มได้อย่างเดียว ลบไม่ได้
            </p>
            <AuditLogList entries={entries} />
          </div>
        )}
      </div>
    </>
  );
}
