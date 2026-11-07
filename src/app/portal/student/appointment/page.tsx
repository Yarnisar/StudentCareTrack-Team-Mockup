"use client";

/** นักเรียนให้ข้อมูลประกอบ ยืนยันนัด และยืนยันว่าได้เยี่ยมบ้านจริง (UC4 สถานการณ์ C–E) */

import { MobileShell } from "@/components/layout/mobile-shell";
import { AppointmentView } from "@/components/portal/appointment-view";
import { PORTAL_STUDENT_ID } from "@/lib/mock-data";

export default function StudentAppointmentPage() {
  return (
    <MobileShell title="นัดหมายเยี่ยมบ้าน" role="student" brand>
      <AppointmentView viewer="student" studentId={PORTAL_STUDENT_ID} />
    </MobileShell>
  );
}
