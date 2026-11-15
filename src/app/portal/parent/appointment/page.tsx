"use client";

import { MobileShell } from "@/components/layout/mobile-shell";
import { AppointmentView } from "@/components/portal/appointment-view";
import { PORTAL_STUDENT_ID } from "@/lib/mock-data";

export default function ParentAppointmentPage() {
  return (
    <MobileShell title="นัดหมายเยี่ยมบ้าน" role="parent" back="/portal/parent">
      <AppointmentView viewer="parent" studentId={PORTAL_STUDENT_ID} />
    </MobileShell>
  );
}
