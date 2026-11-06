"use client";

/** ผู้ปกครองดูข้อมูลส่วนบุคคล ความประพฤติ และการแจ้งเตือนของบุตรหลานที่เชื่อมบัญชี (UC3) */

import { MobileShell } from "@/components/layout/mobile-shell";
import { PersonalInfo } from "@/components/portal/personal-info";
import { PARENT_CHILDREN } from "@/lib/mock-data";

export default function ParentChildPage() {
  return (
    <MobileShell title="ข้อมูลบุตรหลาน" subtitle="ข้อมูลส่วนบุคคล ความประพฤติ และการแจ้งเตือน" role="parent" back="/portal/parent">
      <PersonalInfo viewer="parent" studentIds={PARENT_CHILDREN} />
    </MobileShell>
  );
}
