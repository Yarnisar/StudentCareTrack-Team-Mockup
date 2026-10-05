/**
 * ตรรกะความประพฤติแบบ pure function (ไม่มี state) — slice ใน lib/store/behavior.ts เรียกใช้
 * และ ticket อื่นใช้ซ้ำได้ (เช่น รายการพบอัตโนมัติ bh1 ของการคัดกรอง)
 *
 * CONTEXT.md / data_dictionary.md:
 * - คะแนน = 100 + Σ score_delta ของบันทึก confirmed ในปีการศึกษานั้น (เริ่มวันเปิดภาคเรียนที่ 1) สูงสุด 100
 * - pending ที่ไม่มีใครตัดสินครบ N วันทำการ → ระบบยืนยันให้เอง (คำนวณตอนอ่าน ไม่มีงานเบื้องหลัง)
 * - การนับ "มาสาย" นับเฉพาะ confirmed
 */

import { academicTerms } from "./mock-data";
import { addBusinessDaysThai, compareThaiDate, thaiDateOf } from "./format";
import { BEHAVIOR_SCORE_BASE, LATE_RULE_ID, type BehaviorRecord, type BehaviorRule } from "./types";

/** เวลาที่บันทึก pending จะถูกยืนยันอัตโนมัติ (วันทำการที่ N หลัง createdAt เวลาเดียวกัน) */
export function autoConfirmAt(record: Pick<BehaviorRecord, "createdAt">, pendingAutoConfirmDays: number): string {
  const time = record.createdAt.split("T")[1] ?? "00:00:00";
  return `${addBusinessDaysThai(record.createdAt, pendingAutoConfirmDays)}T${time}`;
}

/**
 * สถานะจริง ณ เวลา now: pending ที่เลยกำหนดกลายเป็น confirmed (decidedBy = null = ระบบยืนยันอัตโนมัติ)
 * คืน object เดิมถ้าไม่มีอะไรเปลี่ยน
 */
export function resolveBehaviorRecord(
  record: BehaviorRecord,
  now: string,
  pendingAutoConfirmDays: number
): BehaviorRecord {
  if (record.status !== "pending") return record;
  const due = autoConfirmAt(record, pendingAutoConfirmDays);
  if (compareThaiDate(now, due) < 0) return record;
  return { ...record, status: "confirmed", decidedBy: null, decidedAt: due };
}

/** บันทึกนี้ถูกระบบยืนยันอัตโนมัติ (ไม่มีครูกด) */
export const isAutoConfirmed = (record: BehaviorRecord) =>
  record.status === "confirmed" && record.decidedBy === null;

/** ช่วงของปีการศึกษา: [วันเปิดภาคเรียนที่ 1, วันเปิดภาคเรียนที่ 1 ของปีถัดไป) — end = null ถ้ายังไม่กำหนด */
export function academicYearRange(academicYear: number): { start: string; end: string | null } {
  const sem1 = (year: number) =>
    academicTerms.find((t) => t.academicYear === year && t.semester === 1)?.startDate ?? null;
  return { start: sem1(academicYear) ?? `${academicYear}-05-16`, end: sem1(academicYear + 1) };
}

export function isInAcademicYear(value: string, academicYear: number): boolean {
  const { start, end } = academicYearRange(academicYear);
  return compareThaiDate(value, start) >= 0 && (end === null || compareThaiDate(value, end) < 0);
}

/**
 * คะแนนความประพฤติของนักเรียนในปีการศึกษา (records ต้องผ่าน resolveBehaviorRecord แล้ว)
 * = min(100, 100 + Σ scoreDelta ของ confirmed)
 */
export function computeBehaviorScore(
  records: BehaviorRecord[],
  ruleOf: (ruleId: string) => BehaviorRule | undefined,
  studentId: string,
  academicYear: number
): number {
  const sum = records
    .filter(
      (r) => r.studentId === studentId && r.status === "confirmed" && isInAcademicYear(r.occurredAt, academicYear)
    )
    .reduce((acc, r) => acc + (ruleOf(r.ruleId)?.scoreDelta ?? 0), 0);
  return Math.min(BEHAVIOR_SCORE_BASE, BEHAVIOR_SCORE_BASE + sum);
}

/** บันทึก "มาสาย" (ตามกฎ LATE_RULE_ID) */
export const isLateRecord = (record: Pick<BehaviorRecord, "ruleId">) => record.ruleId === LATE_RULE_ID;

/**
 * จำนวนครั้งที่มาสายแบบ confirmed ของนักเรียนในเดือน ("2570-02") — records ต้องผ่าน resolve แล้ว
 * pending / excused / voided ไม่นับ
 */
export function countConfirmedLate(records: BehaviorRecord[], studentId: string, month: string): number {
  return records.filter(
    (r) =>
      r.studentId === studentId &&
      r.status === "confirmed" &&
      isLateRecord(r) &&
      thaiDateOf(r.occurredAt).startsWith(month)
  ).length;
}

/** "2570-02-16T07:52:00" → "2570-02" */
export const monthOf = (value: string) => value.slice(0, 7);
