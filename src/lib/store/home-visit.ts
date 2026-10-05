/** Home-visit slice: นัดหมายและผลการเยี่ยมบ้าน */

import { useMemo, useState } from "react";
import { appointments as seedAppointments, homeVisitRecords as seedRecords } from "../mock-data";
import type { AppointmentStatus, HomeVisitAppointment, HomeVisitRecord } from "../types";
import type { PlatformSlice } from "./platform";

export interface HomeVisitSlice {
  appointments: HomeVisitAppointment[];
  homeVisitRecords: HomeVisitRecord[];
  setAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  saveGuardianInfo: (
    appointmentId: string,
    info: { guardianPhone: string; caretakerName: string; guardianNote: string }
  ) => void;
}

export function useHomeVisitSlice(base: PlatformSlice): HomeVisitSlice {
  const [appointments, setAppointments] = useState<HomeVisitAppointment[]>(seedAppointments);
  const [homeVisitRecords] = useState<HomeVisitRecord[]>(seedRecords);

  return useMemo<HomeVisitSlice>(() => {
    const setAppointmentStatus: HomeVisitSlice["setAppointmentStatus"] = (appointmentId, status) => {
      const existing = appointments.find((a) => a.appointmentId === appointmentId);
      if (!existing || existing.status === status) return;
      base.logAudit("UPDATE", "home_visit_appointments", appointmentId, {
        before: { status: existing.status },
        after: { status },
      });
      // ผู้ปกครองขอเปลี่ยนวันเวลา → แจ้งครูผู้นัดและครูประจำชั้น
      if (status === "reschedule_requested") {
        base.notify(
          "visit_rescheduled",
          [existing.teacherId, ...base.recipientsOf(existing.studentId, ["homeroom"])],
          existing.studentId
        );
      }
      setAppointments((prev) =>
        prev.map((a) => (a.appointmentId === appointmentId ? { ...a, status } : a))
      );
    };

    const saveGuardianInfo: HomeVisitSlice["saveGuardianInfo"] = (appointmentId, info) => {
      // ไม่เก็บค่าในรายละเอียด audit (เบอร์โทรเป็นข้อมูลอ่อนไหว) — บันทึกเฉพาะชื่อฟิลด์
      base.logAudit("UPDATE", "home_visit_appointments", appointmentId, {
        note: "ผู้ปกครองกรอกข้อมูลก่อนเยี่ยมบ้าน",
        after: { fields: Object.keys(info) },
      });
      setAppointments((prev) =>
        prev.map((a) => (a.appointmentId === appointmentId ? { ...a, ...info } : a))
      );
    };

    return { appointments, homeVisitRecords, setAppointmentStatus, saveGuardianInfo };
  }, [base, appointments, homeVisitRecords]);
}
