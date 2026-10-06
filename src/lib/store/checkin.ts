/** Check-in slice: การสแกนบัตร QR วันละ 1 ครั้ง (มาสาย → บันทึกความประพฤติ pending ผ่าน behavior slice) */

import { useMemo, useState } from "react";
import { checkinLogs as seedCheckins, SYSTEM_USER_ID } from "../mock-data";
import { isLateArrival } from "../rules";
import { formatThaiTime, nowThaiIso, thaiDateOf } from "../format";
import { LATE_RULE_ID, type BehaviorRecord, type CheckinLog, type Student } from "../types";
import type { BehaviorSlice } from "./behavior";
import type { PlatformSlice } from "./platform";
import { nextId } from "./ids";

export interface CheckinOutcome {
  student: Student;
  /** log ของวันนี้ (ถ้าสแกนซ้ำ = log เดิม ไม่มีแถวใหม่) */
  log: CheckinLog;
  /** สแกนซ้ำในวันเดียวกัน → ระบบแจ้ง "เช็คอินแล้ว" และไม่สร้างแถวใหม่ */
  alreadyCheckedIn: boolean;
  isLate: boolean;
  /** บันทึกความประพฤติ "มาสาย" ที่สร้างจากการสแกนครั้งนี้ (status = pending) */
  pendingRecord: BehaviorRecord | null;
  /** มาสายแบบ confirmed ของเดือนนี้ (บันทึกรอยืนยันยังไม่นับ) */
  lateCountThisMonth: number;
  /** confirmed ของเดือนนี้ถึงเกณฑ์ schoolSettings.lateAlertThreshold แล้ว */
  exceededThreshold: boolean;
  /**
   * userId ของครูประจำชั้นที่ได้รับแจ้ง late_threshold จากการสแกนครั้งนี้ — ปกติว่าง เพราะบันทึกจาก QR
   * เริ่มที่ pending จึงยังไม่นับ (แจ้งเมื่อครูยืนยันจนครบเกณฑ์ ดู behavior slice)
   */
  notifiedHomeroom: string[];
}

export interface CheckinSlice {
  checkins: CheckinLog[];
  /** log ของวันที่ (ค่าเริ่มต้น = วันนี้ของ DEMO_TODAY) ใหม่สุดก่อน */
  checkinsOn: (date?: string) => CheckinLog[];
  checkinOf: (studentId: string, date?: string) => CheckinLog | undefined;
  /** cardId = บัตรที่ถูกสแกน (ไม่ส่ง = ครูบันทึกเอง) */
  checkIn: (studentId: string, simulatedTime?: string, cardId?: string) => CheckinOutcome | null;
}

export function useCheckinSlice(base: PlatformSlice, behavior: BehaviorSlice): CheckinSlice {
  const [checkins, setCheckins] = useState<CheckinLog[]>(seedCheckins);

  return useMemo<CheckinSlice>(() => {
    const today = thaiDateOf(nowThaiIso());
    const sorted = [...checkins].sort((a, b) => b.scannedAt.localeCompare(a.scannedAt));
    const checkinsOn = (date = today) => sorted.filter((c) => c.checkinDate === date);
    const checkinOf = (studentId: string, date = today) =>
      checkins.find((c) => c.studentId === studentId && c.checkinDate === date);

    const checkIn: CheckinSlice["checkIn"] = (studentId, simulatedTime, cardId) => {
      const student = base.getStudent(studentId);
      if (!student) return null;

      const lateCountThisMonth = behavior.confirmedLateCountOf(studentId);
      const threshold = base.schoolSettings.lateAlertThreshold;

      // UNIQUE (student_id, checkin_date): สแกนซ้ำ → แจ้งว่าเช็คอินแล้ว ไม่สร้างแถวใหม่
      const existing = checkinOf(studentId);
      if (existing) {
        return {
          student,
          log: existing,
          alreadyCheckedIn: true,
          isLate: existing.isLate,
          pendingRecord: null,
          lateCountThisMonth,
          exceededThreshold: lateCountThisMonth >= threshold,
          notifiedHomeroom: [],
        };
      }

      // ต้นแบบ: อนุญาตให้จำลองเวลาสแกน (HH:MM) เพื่อสาธิตเงื่อนไขการมาสายได้ทุกช่วงเวลา
      const stamp = nowThaiIso(simulatedTime);
      const late = isLateArrival(stamp, base.schoolSettings.schoolStartTime);
      const log: CheckinLog = {
        logId: nextId("CI"),
        studentId,
        checkinDate: thaiDateOf(stamp),
        scannedAt: stamp,
        isLate: late,
        scannedBy: base.currentUser.userId,
        cardId: cardId ?? null,
      };

      setCheckins((prev) => [log, ...prev]);
      base.logAudit("CREATE", "checkin_logs", log.logId, {
        after: { studentId, isLate: late, cardId: cardId ?? null },
      });

      // มาสาย -> สร้างบันทึกความประพฤติรอครูยืนยัน (pending ยังไม่มีผลกับคะแนนและยังไม่นับเป็นการมาสาย)
      const pendingRecord = late
        ? behavior.addSystemBehaviorRecord({
            studentId,
            ruleId: LATE_RULE_ID,
            description: `บันทึกอัตโนมัติจากการสแกน QR เวลา ${formatThaiTime(stamp)}`,
            occurredAt: stamp,
            recordedBy: SYSTEM_USER_ID,
            source: "qr_checkin",
            checkinLogId: log.logId,
          })
        : null;

      return {
        student,
        log,
        alreadyCheckedIn: false,
        isLate: late,
        pendingRecord,
        lateCountThisMonth,
        exceededThreshold: lateCountThisMonth >= threshold,
        notifiedHomeroom: [],
      };
    };

    return { checkins: sorted, checkinsOn, checkinOf, checkIn };
  }, [base, behavior, checkins]);
}
