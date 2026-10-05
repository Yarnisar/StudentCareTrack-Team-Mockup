/** Check-in slice: การสแกนบัตร QR (มาสาย → บันทึกความประพฤติผ่าน behavior slice) */

import { useMemo, useState } from "react";
import { checkinLogs as seedCheckins, SYSTEM_USER_ID } from "../mock-data";
import { isLateArrival } from "../rules";
import { nowThaiIso } from "../format";
import type { CheckinLog, Student } from "../types";
import type { BehaviorSlice } from "./behavior";
import type { PlatformSlice } from "./platform";
import { nextId } from "./ids";

export interface CheckinOutcome {
  student: Student;
  log: CheckinLog;
  isLate: boolean;
  lateCountThisMonth: number;
  exceededThreshold: boolean;
  /** userId ของครูประจำชั้นที่ได้รับแจ้ง late_threshold จากการสแกนครั้งนี้ */
  notifiedHomeroom: string[];
}

export interface CheckinSlice {
  checkins: CheckinLog[];
  checkIn: (studentId: string, simulatedTime?: string) => CheckinOutcome | null;
}

export function useCheckinSlice(base: PlatformSlice, behavior: BehaviorSlice): CheckinSlice {
  const [checkins, setCheckins] = useState<CheckinLog[]>(seedCheckins);

  return useMemo<CheckinSlice>(() => {
    const checkIn: CheckinSlice["checkIn"] = (studentId, simulatedTime) => {
      const student = base.getStudent(studentId);
      if (!student) return null;

      const now = new Date();
      // ต้นแบบ: อนุญาตให้จำลองเวลาสแกน (HH:MM) เพื่อสาธิตเงื่อนไขการมาสายได้ทุกช่วงเวลา
      if (simulatedTime) {
        const [h, m] = simulatedTime.split(":").map(Number);
        now.setHours(h, m, 0, 0);
      }
      const late = isLateArrival(now, base.schoolSettings.schoolStartTime);
      const pad = (n: number) => String(n).padStart(2, "0");
      const stamp = nowThaiIso(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
      const log: CheckinLog = {
        logId: nextId("CI"),
        studentId,
        scannedAt: stamp,
        isLate: late,
        scannedBy: base.currentUser.userId,
      };

      const month = stamp.slice(0, 7);
      const lateCountThisMonth =
        checkins.filter((c) => c.studentId === studentId && c.isLate && c.scannedAt.startsWith(month))
          .length + (late ? 1 : 0);

      setCheckins((prev) => [log, ...prev]);
      base.logAudit("CREATE", "checkin_logs", log.logId, { after: { studentId, isLate: late } });

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

      const threshold = base.schoolSettings.lateAlertThreshold;
      const exceededThreshold = late && lateCountThisMonth >= threshold;
      // แจ้งครูประจำชั้นทั้ง 2 คนครั้งเดียวเมื่อครบเกณฑ์ของเดือน
      const notifiedHomeroom =
        late && lateCountThisMonth === threshold
          ? base
              .notify("late_threshold", base.recipientsOf(studentId, ["homeroom"]), studentId, {
                count: lateCountThisMonth,
              })
              .map((n) => n.recipientUserId)
          : [];

      return {
        student,
        log,
        isLate: late,
        lateCountThisMonth,
        exceededThreshold,
        notifiedHomeroom,
      };
    };

    return { checkins, checkIn };
  }, [base, behavior, checkins]);
}
