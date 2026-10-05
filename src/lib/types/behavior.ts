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
}

export interface CheckinLog {
  logId: string;
  studentId: string;
  scannedAt: string;
  isLate: boolean;
  /** userId ของผู้สแกน */
  scannedBy: string;
}
