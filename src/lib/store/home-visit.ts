/** Home-visit slice: นัดหมายและผลการเยี่ยมบ้าน */

import { useMemo, useState } from "react";
import { appointments as seedAppointments, homeVisitRecords as seedRecords } from "../mock-data";
import type { AppointmentStatus, HomeVisitAppointment, HomeVisitRecord } from "../types";
import type { CoreSlice } from "./core";

export interface HomeVisitSlice {
  appointments: HomeVisitAppointment[];
  homeVisitRecords: HomeVisitRecord[];
  setAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  saveGuardianInfo: (
    appointmentId: string,
    info: { guardianPhone: string; caretakerName: string; guardianNote: string }
  ) => void;
}

export function useHomeVisitSlice(core: CoreSlice): HomeVisitSlice {
  const [appointments, setAppointments] = useState<HomeVisitAppointment[]>(seedAppointments);
  const [homeVisitRecords] = useState<HomeVisitRecord[]>(seedRecords);

  return useMemo<HomeVisitSlice>(() => {
    void core;
    const setAppointmentStatus: HomeVisitSlice["setAppointmentStatus"] = (appointmentId, status) => {
      setAppointments((prev) =>
        prev.map((a) => (a.appointmentId === appointmentId ? { ...a, status } : a))
      );
    };

    const saveGuardianInfo: HomeVisitSlice["saveGuardianInfo"] = (appointmentId, info) => {
      setAppointments((prev) =>
        prev.map((a) => (a.appointmentId === appointmentId ? { ...a, ...info } : a))
      );
    };

    return { appointments, homeVisitRecords, setAppointmentStatus, saveGuardianInfo };
  }, [core, appointments, homeVisitRecords]);
}
