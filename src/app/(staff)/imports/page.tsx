"use client";

import { ImportWorkspace } from "@/components/imports/import-workspace";
import { PageHeader } from "@/components/layout/page-header";
import { isStandalone } from "@/lib/deployment-mode";

/** นำเข้าข้อมูลโรงเรียน (ADR-0005) — เฉพาะผู้ดูแลระบบ (กันสิทธิ์ใน lib/navigation.ts + RoleGate) โหมดเชื่อมระบบไม่มีการนำเข้า */
export default function ImportsPage() {
  return (
    <>
      <PageHeader title="นำเข้าข้อมูลโรงเรียน" subtitle={isStandalone ? "ตรวจไฟล์ก่อน แล้วจึงยืนยันเขียน" : undefined} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isStandalone ? (
          <ImportWorkspace />
        ) : (
          <p className="mx-auto max-w-4xl p-5 text-[13px] text-muted-foreground lg:p-8">
            ข้อมูลนักเรียนมาจากทีม B ในโหมดเชื่อมระบบ ไม่ต้องนำเข้า
          </p>
        )}
      </div>
    </>
  );
}
