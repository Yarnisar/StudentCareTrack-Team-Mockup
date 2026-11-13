"use client";

/** หน้าหลักของนักเรียน: ความประพฤติและการแจ้งเตือนของตนเอง (UC3) ข้อมูลทะเบียนอยู่ที่หน้าโปรไฟล์ */

import { MobileShell } from "@/components/layout/mobile-shell";
import { PersonalInfo } from "@/components/portal/personal-info";
import { PORTAL_STUDENT_ID } from "@/lib/mock-data";

export default function StudentHomePage() {
  return (
    <MobileShell title="หน้าหลัก" role="student" brand>
      <PersonalInfo viewer="student" studentIds={[PORTAL_STUDENT_ID]} hideInfo />
    </MobileShell>
  );
}
