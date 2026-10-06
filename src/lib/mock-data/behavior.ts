/** ข้อมูลตัวอย่าง: ความประพฤติ และการเช็คอิน */

import type { BehaviorRecord, BehaviorRule, CheckinLog } from "../types";
import { SYSTEM_USER_ID, USER } from "./core";
import { generatedBehaviorRecords, generatedCheckinLogs } from "./generated-class";

export const behaviorRules: BehaviorRule[] = [
  { ruleId: "BR-01", name: "มาสาย", severity: "minor", scoreDelta: -2, notifyGuardian: false, isActive: true },
  { ruleId: "BR-02", name: "แต่งกายไม่ถูกระเบียบ", severity: "minor", scoreDelta: -1, notifyGuardian: false, isActive: true },
  { ruleId: "BR-03", name: "ไม่ส่งงาน / การบ้าน", severity: "moderate", scoreDelta: -3, notifyGuardian: true, isActive: true },
  { ruleId: "BR-04", name: "ใช้โทรศัพท์ในเวลาเรียน", severity: "moderate", scoreDelta: -3, notifyGuardian: true, isActive: true },
  { ruleId: "BR-05", name: "ทะเลาะวิวาท", severity: "severe", scoreDelta: -10, notifyGuardian: true, isActive: true },
  { ruleId: "BR-06", name: "ช่วยเหลือกิจกรรมโรงเรียน", severity: "positive", scoreDelta: 5, notifyGuardian: true, isActive: true },
  { ruleId: "BR-07", name: "ช่วยเหลือครูหรือเพื่อน", severity: "positive", scoreDelta: 3, notifyGuardian: true, isActive: true },
];

/* ------------------------------------------------------------------ */
/* บันทึกความประพฤติ                                                    */
/* DEMO_TODAY = 2570-02-16 (อังคาร), pendingAutoConfirmDays = 3, ปีการศึกษา 2569 เริ่ม 2569-05-16     */
/* - 30118: มาสายเดือน ก.พ. ยืนยันแล้ว 3 + ยืนยันอัตโนมัติ 1 (02-10 → 02-15) + รอยืนยัน 2           */
/*   → ยืนยันอีก 1 รายการจะครบเกณฑ์ 5 ครั้ง (late_threshold)                                        */
/* - 30125: มาสาย 02-11 ถูกยกเว้น, 02-16 รอยืนยัน                                                  */
/* - 30131: คะแนน 62 (บันทึกปี 2568 ไม่นับ) → บันทึกผิดระดับกลางอีก 1 ครั้งจะต่ำกว่า 60                 */
/* - 30183: คะแนน 55 (ต่ำกว่าเกณฑ์อยู่แล้ว) มีบันทึกที่ถูกยกเลิก 1 รายการ                              */
/* ------------------------------------------------------------------ */

type ManualSeed = [recordId: string, studentId: string, ruleId: string, description: string, occurredAt: string, recordedBy: string];

/** บันทึกด้วยมือ: เริ่มที่ confirmed โดยผู้บันทึก ณ เวลาที่บันทึก */
function manual([recordId, studentId, ruleId, description, occurredAt, recordedBy]: ManualSeed): BehaviorRecord {
  return {
    recordId,
    studentId,
    ruleId,
    description,
    occurredAt,
    recordedBy,
    source: "manual",
    checkinLogId: null,
    status: "confirmed",
    decidedBy: recordedBy,
    decidedAt: occurredAt,
    decisionReason: null,
    voidReason: null,
    createdAt: occurredAt,
  };
}

/** บันทึกมาสายจาก QR: เริ่มที่ pending (decision ระบุเมื่อครูตัดสินแล้ว) */
function late(
  recordId: string,
  studentId: string,
  checkinLogId: string,
  scannedAt: string,
  decision?: { status: "confirmed" | "excused"; by: string; at: string; reason?: string }
): BehaviorRecord {
  return {
    recordId,
    studentId,
    ruleId: "BR-01",
    description: `บันทึกอัตโนมัติจากการสแกน QR เวลา ${scannedAt.slice(11, 16)} น.`,
    occurredAt: scannedAt,
    recordedBy: SYSTEM_USER_ID,
    source: "qr_checkin",
    checkinLogId,
    status: decision?.status ?? "pending",
    decidedBy: decision?.by ?? null,
    decidedAt: decision?.at ?? null,
    decisionReason: decision?.reason ?? null,
    voidReason: null,
    createdAt: scannedAt,
  };
}

const baseBehaviorRecords: BehaviorRecord[] = [
  // วันนี้ — รอยืนยัน
  late("BH-001", "30118", "CI-001", "2570-02-16T07:52:00"),
  late("BH-002", "30125", "CI-002", "2570-02-16T07:55:00"),
  late("BH-007", "30171", "CI-003", "2570-02-16T07:58:00"),
  manual(["BH-003", "30131", "BR-03", "ไม่ส่งการบ้านวิชาคณิตศาสตร์ ครั้งที่ 3 ในเดือนนี้", "2570-02-15T13:20:00", USER.wichai]),
  manual(["BH-004", "30140", "BR-06", "ช่วยจัดสถานที่กิจกรรมวันวิชาการ", "2570-02-15T10:05:00", USER.somying]),
  manual(["BH-005", "30118", "BR-02", "ไม่สวมเสื้อนักเรียนตามระเบียบ", "2570-02-14T08:10:00", USER.somchaiK]),
  manual(["BH-006", "30152", "BR-07", "ช่วยครูจัดห้องเรียนหลังเลิกเรียน", "2570-02-13T15:40:00", USER.somying]),

  // 30118 มาสายเดือน ก.พ.
  late("BH-008", "30118", "CI-011", "2570-02-12T07:49:00"), // ศุกร์ → ยืนยันอัตโนมัติ พุธ 02-17
  late("BH-009", "30118", "CI-010", "2570-02-10T07:41:00"), // พุธ → ยืนยันอัตโนมัติแล้ว จันทร์ 02-15
  late("BH-010", "30118", "CI-008", "2570-02-09T07:46:00", { status: "confirmed", by: USER.somying, at: "2570-02-09T09:00:00" }),
  late("BH-011", "30118", "CI-007", "2570-02-04T07:38:00", { status: "confirmed", by: USER.theerapong, at: "2570-02-04T08:30:00" }),
  late("BH-012", "30118", "CI-006", "2570-02-02T07:51:00", { status: "confirmed", by: USER.somying, at: "2570-02-02T08:45:00" }),
  // 30125 มาสายแต่ได้รับการยกเว้น
  late("BH-013", "30125", "CI-009", "2570-02-11T07:44:00", {
    status: "excused",
    by: USER.somying,
    at: "2570-02-11T08:20:00",
    reason: "ผู้ปกครองแจ้งว่ารถโดยสารประจำทางขัดข้อง",
  }),

  // 30131 — คะแนน 62
  manual(["BH-014", "30131", "BR-05", "ทะเลาะวิวาทกับเพื่อนต่างห้องช่วงพักกลางวัน", "2569-07-08T12:15:00", USER.wichai]),
  manual(["BH-015", "30131", "BR-05", "ทะเลาะวิวาทหน้าโรงอาหาร", "2569-09-14T12:30:00", USER.somying]),
  manual(["BH-016", "30131", "BR-03", "ไม่ส่งงานวิชาภาษาไทย", "2569-12-03T14:00:00", USER.napa]),
  manual(["BH-017", "30131", "BR-04", "ใช้โทรศัพท์ระหว่างเรียนวิชาวิทยาศาสตร์", "2570-01-12T10:40:00", USER.wimon]),
  manual(["BH-018", "30131", "BR-03", "ไม่ส่งการบ้านวิชาคณิตศาสตร์", "2570-01-20T13:10:00", USER.wichai]),
  manual(["BH-019", "30131", "BR-04", "ใช้โทรศัพท์ระหว่างเรียนวิชาสังคมศึกษา", "2570-02-05T11:20:00", USER.prayong]),
  manual(["BH-020", "30131", "BR-03", "ไม่ส่งการบ้านวิชาคณิตศาสตร์ ครั้งที่ 2", "2570-02-09T13:15:00", USER.wichai]),
  // ปีการศึกษา 2568 — ไม่นับในคะแนนปีนี้ (คะแนนเริ่ม 100 ใหม่ทุกปีการศึกษา)
  manual(["BH-021", "30131", "BR-05", "ทะเลาะวิวาทในห้องเรียน", "2569-02-10T09:30:00", USER.prapa]),

  // 30183 — คะแนน 55 (ต่ำกว่าเกณฑ์)
  manual(["BH-022", "30183", "BR-05", "ทะเลาะวิวาทกับเพื่อนในห้อง", "2569-06-20T10:10:00", USER.somying]),
  manual(["BH-023", "30183", "BR-05", "ทะเลาะวิวาทนอกห้องเรียน", "2569-08-25T12:20:00", USER.theerapong]),
  manual(["BH-024", "30183", "BR-05", "ทะเลาะวิวาทช่วงเลิกเรียน", "2569-11-18T15:45:00", USER.somying]),
  manual(["BH-025", "30183", "BR-03", "ไม่ส่งงานวิชาภาษาอังกฤษ", "2569-12-10T14:30:00", USER.anna]),
  manual(["BH-026", "30183", "BR-04", "ใช้โทรศัพท์ระหว่างเรียน", "2570-01-08T09:50:00", USER.wichai]),
  manual(["BH-027", "30183", "BR-03", "ไม่ส่งการบ้านวิชาคณิตศาสตร์", "2570-01-22T13:00:00", USER.wichai]),
  manual(["BH-028", "30183", "BR-04", "ใช้โทรศัพท์ระหว่างเรียน", "2570-02-03T10:15:00", USER.malee]),
  manual(["BH-029", "30183", "BR-03", "ไม่ส่งงานวิชาวิทยาศาสตร์", "2570-02-10T14:20:00", USER.wimon]),
  {
    ...manual(["BH-030", "30183", "BR-05", "ทะเลาะวิวาท (บันทึกผิดคน)", "2570-02-11T12:40:00", USER.somchaiK]),
    status: "voided",
    voidReason: "บันทึกผิดคน เหตุการณ์นี้เป็นของนักเรียนห้องอื่น",
  },
];

function scan(logId: string, studentId: string, scannedAt: string, isLate: boolean): CheckinLog {
  return { logId, studentId, checkinDate: scannedAt.slice(0, 10), scannedAt, isLate, scannedBy: USER.somying };
}

const baseCheckinLogs: CheckinLog[] = [
  scan("CI-001", "30118", "2570-02-16T07:52:00", true),
  scan("CI-002", "30125", "2570-02-16T07:55:00", true),
  scan("CI-003", "30171", "2570-02-16T07:58:00", true),
  scan("CI-004", "30160", "2570-02-16T07:28:00", false),
  scan("CI-005", "30152", "2570-02-16T07:22:00", false),
  scan("CI-011", "30118", "2570-02-12T07:49:00", true),
  scan("CI-009", "30125", "2570-02-11T07:44:00", true),
  scan("CI-010", "30118", "2570-02-10T07:41:00", true),
  scan("CI-008", "30118", "2570-02-09T07:46:00", true),
  scan("CI-007", "30118", "2570-02-04T07:38:00", true),
  scan("CI-006", "30118", "2570-02-02T07:51:00", true),
];

/** 8 คนตัวอย่างหลัก + นักเรียนที่สร้างเพิ่ม (ดู generated-class.ts) */
export const behaviorRecords: BehaviorRecord[] = [...baseBehaviorRecords, ...generatedBehaviorRecords];
export const checkinLogs: CheckinLog[] = [...baseCheckinLogs, ...generatedCheckinLogs];
