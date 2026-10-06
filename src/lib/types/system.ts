/**
 * ตารางระดับระบบของ Team C: audit log, การแจ้งเตือน, ตั้งค่าโรงเรียน, ช่วงดำเนินงาน, ความยินยอมของผู้ปกครอง
 * (data_dictionary.md — Module: ระบบ / ภาพรวม)
 */

/* ------------------------------------------------------------------ */
/* audit_logs                                                          */
/* ------------------------------------------------------------------ */

export type AuditAction = "CREATE" | "UPDATE" | "VOID" | "UNLOCK" | "VIEW_SENSITIVE";

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  CREATE: "สร้าง",
  UPDATE: "แก้ไข",
  VOID: "ยกเลิก",
  UNLOCK: "ปลดล็อก",
  VIEW_SENSITIVE: "เปิดดูข้อมูลอ่อนไหว",
};

/** รายละเอียดของ audit (JSONB): ค่าก่อน/หลังการเปลี่ยนแปลง หรือเหตุผล */
export interface AuditDetail {
  before?: unknown;
  after?: unknown;
  reason?: string;
  /** คำอธิบายสั้นสำหรับแสดงในรายการ (ห้ามมีข้อมูลอ่อนไหว) */
  note?: string;
}

/** append-only: ไม่มี API แก้หรือลบ */
export interface AuditLog {
  logId: string;
  /** ผู้กระทำ (SYSTEM_USER_ID เมื่อระบบทำเอง) */
  userId: string;
  action: AuditAction;
  /** ชื่อตาราง เช่น "behavior_records" */
  entityType: string;
  entityId: string;
  detail: AuditDetail | null;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* operating_windows / school_settings                                 */
/* ------------------------------------------------------------------ */

export type OperatingActivity = "screening" | "home_visit" | "sdq" | "care_record";

export const OPERATING_ACTIVITIES: OperatingActivity[] = ["screening", "home_visit", "sdq", "care_record"];

export const OPERATING_ACTIVITY_LABEL: Record<OperatingActivity, string> = {
  screening: "คัดกรองนักเรียน",
  home_visit: "เยี่ยมบ้าน",
  sdq: "ประเมิน SDQ",
  care_record: "บันทึกการช่วยเหลือ",
};

/** UNIQUE (termId, activity) — หลังวันปิดระบบล็อกเสมอ ดูได้แต่บันทึกไม่ได้ */
export interface OperatingWindow {
  windowId: string;
  termId: string;
  activity: OperatingActivity;
  /** วันเปิด (พ.ศ. yyyy-mm-dd) */
  opensAt: string;
  /** วันปิด (รวมวันนี้ หลังจากนี้ล็อก) */
  closesAt: string;
  /** แจ้งเตือนครูที่ยังทำไม่ครบล่วงหน้ากี่วัน */
  remindDaysBefore: number;
  updatedBy: string;
}

export type WindowStatus = "none" | "upcoming" | "open" | "closed";

export const WINDOW_STATUS_LABEL: Record<WindowStatus, string> = {
  none: "ยังไม่กำหนดช่วงดำเนินงาน",
  upcoming: "ยังไม่ถึงช่วงดำเนินงาน",
  open: "อยู่ในช่วงดำเนินงาน",
  closed: "ปิดช่วงดำเนินงานแล้ว",
};

/** school_settings (มีแถวเดียว) */
export interface SchoolSettings {
  /** เวลาเข้าเรียน "HH:MM" — มาสาย = เช็คอินตั้งแต่เวลานี้ + 1 นาที */
  schoolStartTime: string;
  /** จำนวนครั้งที่มาสายต่อเดือนที่ต้องแจ้งเตือน */
  lateAlertThreshold: number;
  /** คะแนนความประพฤติที่ต่ำกว่านี้ให้แนะนำเปิด case */
  behaviorAlertScore: number;
  /** บันทึกรอยืนยันจะยืนยันอัตโนมัติเมื่อครบกี่วันทำการ */
  pendingAutoConfirmDays: number;
  /** ให้นักเรียนที่ปกติในภาคเรียนที่ 1 ทำ SDQ ครั้งที่ 2 ด้วยหรือไม่ */
  sdq2ForNormalStudents: boolean;
  updatedBy: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* notifications / notification_settings                               */
/* ------------------------------------------------------------------ */

export type NotificationEventType =
  | "case_opened"
  | "case_trigger_added"
  | "pending_late_digest"
  | "late_threshold"
  | "behavior_score_low"
  | "window_closing"
  | "sdq_requested"
  | "visit_scheduled"
  | "visit_rescheduled"
  | "behavior_confirmed"
  | "late_weekly_digest"
  | "dc_scores_requested"
  | "referral_signature_requested"
  | "referral_signed"
  | "referral_approval_requested"
  | "referral_approved"
  | "referral_declined"
  | "referral_sent";

/**
 * ค่าที่แม่แบบข้อความรับได้ — มีเฉพาะตัวเลข วันที่ และชื่อกิจกรรม/รายวิชา
 * ผู้เรียกใส่ข้อความอิสระไม่ได้ จึงไม่มีทางหลุดข้อมูลอ่อนไหวเข้าไปในข้อความ
 */
export interface NotificationParams {
  count?: number;
  /** วันที่ พ.ศ. (yyyy-mm-dd หรือ yyyy-mm-ddTHH:MM:SS) */
  date?: string;
  activity?: OperatingActivity;
  /** ชื่อรายวิชา (สำหรับ dc_scores_requested) */
  subjectName?: string;
}

export interface Notification {
  notificationId: string;
  recipientUserId: string;
  eventType: NotificationEventType;
  /** null สำหรับเรื่องระดับห้อง/โรงเรียน */
  studentId: string | null;
  /** ห้ามมีข้อมูลอ่อนไหว — สร้างจากแม่แบบเท่านั้น */
  message: string;
  linkPath: string;
  createdAt: string;
  readAt: string | null;
  /** null = ไม่ได้ส่งอีเมล (ไม่มีอีเมล หรือปิดรับ) */
  emailedAt: string | null;
}

export interface NotificationSetting {
  userId: string;
  /** การแจ้งเตือนในระบบปิดไม่ได้ ปิดได้เฉพาะอีเมล */
  emailEnabled: boolean;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* guardian_consents                                                   */
/* ------------------------------------------------------------------ */

/** UNIQUE (studentId, academicYear) — ไม่มีแถว = ยังไม่ได้ความยินยอม (คัดกรองได้ แต่ส่งต่อภายนอกไม่ได้) */
export interface GuardianConsent {
  consentId: string;
  studentId: string;
  /** ผู้ปกครองที่ตอบ (คนใดก็ได้ของนักเรียนคนนั้น) */
  guardianUserId: string;
  academicYear: number;
  granted: boolean;
  respondedAt: string;
}
