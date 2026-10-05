/** ความประพฤติ และการเช็คอินด้วยบัตร QR */

export interface BehaviorRule {
  ruleId: string;
  name: string;
  severity: "minor" | "moderate" | "severe" | "positive";
  scoreDelta: number;
  isActive: boolean;
}

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
