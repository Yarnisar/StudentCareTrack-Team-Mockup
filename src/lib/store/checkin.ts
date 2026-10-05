/** Check-in slice: การสแกนบัตร QR (มาสาย → บันทึกความประพฤติผ่าน behavior slice) */

import { useMemo, useState } from "react";
import { checkinLogs as seedCheckins, SYSTEM_USER_ID } from "../mock-data";
import { isLateArrival, LATE_ALERT_THRESHOLD } from "../rules";
import { nowThaiIso } from "../format";
import type { CheckinLog, Student } from "../types";
import type { BehaviorSlice } from "./behavior";
import type { CoreSlice } from "./core";
import { nextId } from "./ids";

export interface CheckinOutcome {
  student: Student;
  log: CheckinLog;
  isLate: boolean;
  lateCountThisMonth: number;
  exceededThreshold: boolean;
}

export interface CheckinSlice {
  checkins: CheckinLog[];
  checkIn: (studentId: string, simulatedTime?: string) => CheckinOutcome | null;
}

export function useCheckinSlice(core: CoreSlice, behavior: BehaviorSlice): CheckinSlice {
  const [checkins, setCheckins] = useState<CheckinLog[]>(seedCheckins);

  return useMemo<CheckinSlice>(() => {
    const checkIn: CheckinSlice["checkIn"] = (studentId, simulatedTime) => {
      const student = core.getStudent(studentId);
      if (!student) return null;

      const now = new Date();
      // ต้นแบบ: อนุญาตให้จำลองเวลาสแกน (HH:MM) เพื่อสาธิตเงื่อนไขการมาสายได้ทุกช่วงเวลา
      if (simulatedTime) {
        const [h, m] = simulatedTime.split(":").map(Number);
        now.setHours(h, m, 0, 0);
      }
      const late = isLateArrival(now);
      const pad = (n: number) => String(n).padStart(2, "0");
      const stamp = nowThaiIso(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
      const log: CheckinLog = {
        logId: nextId("CI"),
        studentId,
        scannedAt: stamp,
        isLate: late,
        scannedBy: core.currentUser.userId,
      };

      const month = stamp.slice(0, 7);
      const lateCountThisMonth =
        checkins.filter((c) => c.studentId === studentId && c.isLate && c.scannedAt.startsWith(month))
          .length + (late ? 1 : 0);

      setCheckins((prev) => [log, ...prev]);

      // มาสาย -> สร้างบันทึกความประพฤติอัตโนมัติ (เชื่อมกับโมดูลความประพฤติ)
      if (late) {
        behavior.addSystemBehaviorRecord({
          studentId,
          ruleId: "BR-01",
          description: `บันทึกอัตโนมัติจากการสแกน QR เวลา ${stamp.split("T")[1].slice(0, 5)} น.`,
          occurredAt: stamp,
          recordedBy: SYSTEM_USER_ID,
          source: "qr_checkin",
        });
      }

      return {
        student,
        log,
        isLate: late,
        lateCountThisMonth,
        exceededThreshold: late && lateCountThisMonth >= LATE_ALERT_THRESHOLD,
      };
    };

    return { checkins, checkIn };
  }, [core, behavior, checkins]);
}
