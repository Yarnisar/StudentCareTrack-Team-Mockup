"use client";

/** หน้าหลักของนักเรียน: ข้อมูลส่วนบุคคล ความประพฤติ และการแจ้งเตือนของตนเอง (UC3) */

import { MobileShell } from "@/components/layout/mobile-shell";
import { PersonalInfo } from "@/components/portal/personal-info";
import { PORTAL_STUDENT_ID } from "@/lib/mock-data";

export default function StudentHomePage() {
  return (
    <MobileShell title="ข้อมูลของฉัน" subtitle="ข้อมูลส่วนบุคคล ความประพฤติ และการแจ้งเตือน" role="student" brand>
      <PersonalInfo viewer="student" studentIds={[PORTAL_STUDENT_ID]} />
    </MobileShell>
  );
}
