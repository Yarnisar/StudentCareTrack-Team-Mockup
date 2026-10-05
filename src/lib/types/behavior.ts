/** ความประพฤติ และการเช็คอินด้วยบัตร QR */

export interface BehaviorRule {
  ruleId: string;
  name: string;
  severity: "minor" | "moderate" | "severe" | "positive";
  scoreDelta: number;
  /** แจ้งผู้ปกครองทันทีเมื่อยืนยัน (ค่าเริ่มต้น true สำหรับ moderate / severe / positive) */
  notifyGuardian: boolean;
  /** false = ยกเลิกการใช้งาน (ไม่ลบจริง เพราะบันทึกเดิมอ้างอิงอยู่) */
  isActive: boolean;
}

/** ป้ายระดับตามข้อกำหนด (น้อย / กลาง / มาก / ความดี) — ใช้ที่เดียวทั้งระบบ */
export const BEHAVIOR_SEVERITY_LABEL: Record<BehaviorRule["severity"], string> = {
  minor: "น้อย",
  moderate: "กลาง",
  severe: "มาก",
  positive: "ความดี",
};

/** ruleId ของกฎ "มาสาย" ที่ระบบใช้สร้างบันทึกจากการสแกน QR และใช้นับการมาสาย */
export const LATE_RULE_ID = "BR-01";

/** คะแนนตั้งต้นและเพดานคะแนนความประพฤติของทุกปีการศึกษา */
export const BEHAVIOR_SCORE_BASE = 100;

/**
 * สถานะบันทึกความประพฤติ
 * - pending: ระบบสร้างจาก QR รอครูยืนยัน — ยังไม่มีผลกับคะแนน ผู้ปกครองไม่เห็น ยังไม่นับเป็นการมาสาย
 * - confirmed: มีผล (บันทึกด้วยมือเริ่มที่สถานะนี้ / pending ครบ N วันทำการยืนยันอัตโนมัติ)
 * - excused: ครูยกเว้น (ต้องมีเหตุผล)
 * - voided: ยกเลิกแล้ว (ต้องมีเหตุผล) — ไม่มีการลบจริง
 */
export type BehaviorRecordStatus = "pending" | "confirmed" | "excused" | "voided";

export const BEHAVIOR_STATUS_LABEL: Record<BehaviorRecordStatus, string> = {
  pending: "รอยืนยัน",
  confirmed: "ยืนยันแล้ว",
  excused: "ยกเว้น",
  voided: "ยกเลิกแล้ว",
};

/** ค่าเริ่มต้นของ notifyGuardian ตามระดับ: กลาง / มาก / ความดี แจ้งทันที */
export const DEFAULT_NOTIFY_GUARDIAN: Record<BehaviorRule["severity"], boolean> = {
  minor: false,
  moderate: true,
  severe: true,
  positive: true,
};

export interface BehaviorRecord {
  recordId: string;
  studentId: string;
  ruleId: string;
  description: string;
  occurredAt: string;
  /** userId ของผู้บันทึก (SYSTEM_USER_ID เมื่อระบบสร้างให้) */
  recordedBy: string;
  source: "manual" | "qr_checkin";
  /** log การสแกนที่ทำให้เกิดบันทึกนี้ (เฉพาะ source = qr_checkin) */
  checkinLogId: string | null;
  /**
   * สถานะ ค่าที่ได้จาก useStore() ผ่านการตัดสินอัตโนมัติแล้ว: pending ที่ครบ
   * schoolSettings.pendingAutoConfirmDays วันทำการจะเป็น confirmed (decidedBy = null)
   */
  status: BehaviorRecordStatus;
  /** userId ของครูที่ยืนยัน/ยกเว้น (null = ยังไม่ตัดสิน หรือระบบยืนยันอัตโนมัติ) */
  decidedBy: string | null;
  decidedAt: string | null;
  /** เหตุผลการยกเว้น (บังคับเมื่อ excused) */
  decisionReason: string | null;
  /** เหตุผลการยกเลิก (บังคับเมื่อ voided) */
  voidReason: string | null;
  /** เวลาที่บันทึก — ผู้บันทึกแก้ได้ภายใน 24 ชั่วโมงหลังจากนี้ หลังจากนั้นทำได้แค่ยกเลิก */
  createdAt: string;
}

/** บันทึกที่ผู้ปกครองเห็น: เฉพาะ confirmed และไม่มีชื่อผู้บันทึก */
export type GuardianBehaviorRecord = Omit<
  BehaviorRecord,
  "recordedBy" | "decidedBy" | "decisionReason" | "voidReason" | "checkinLogId"
>;

export interface CheckinLog {
  logId: string;
  studentId: string;
  /** วันที่เช็คอิน (UNIQUE ต่อ studentId — วันละ 1 ครั้ง) */
  checkinDate: string;
  scannedAt: string;
  /** checkin_type = late (เช็คอินตั้งแต่ school_start_time + 1 นาที) */
  isLate: boolean;
  /** userId ของผู้สแกน */
  scannedBy: string;
}
