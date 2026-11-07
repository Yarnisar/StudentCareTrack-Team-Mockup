/** ชนิดข้อมูลหลักของระบบ อ้างอิงตาม ER Diagram ในบทที่ 3 */

import type { VisitForm } from "./home-visit-form";

export type UserRole =
  | "admin_school"
  | "teacher_general"
  | "teacher_homeroom"
  | "student"
  | "parent";

export type RiskGroup = "green" | "amber" | "red";

export const RISK_LABEL: Record<RiskGroup, string> = {
  green: "ปกติ",
  amber: "เสี่ยง",
  red: "มีปัญหา",
};

/** 6 มิติการคัดกรอง ตามคู่มือ HERO OBEC CARE */
export type ScreeningDimension =
  | "academic"
  | "physical"
  | "economic"
  | "welfare"
  | "behavior"
  | "mental";

export const DIMENSION_LABEL: Record<ScreeningDimension, string> = {
  academic: "การเรียน",
  physical: "สุขภาพกาย",
  economic: "เศรษฐกิจ",
  welfare: "สวัสดิภาพและความปลอดภัย",
  behavior: "พฤติกรรม",
  mental: "สุขภาพจิต",
};

export const DIMENSION_ORDER: ScreeningDimension[] = [
  "academic",
  "physical",
  "economic",
  "welfare",
  "behavior",
  "mental",
];

export interface Student {
  studentId: string;
  fullName: string;
  citizenId: string;
  roomName: string;
  classNo: number;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  address: string;
  /** อ้างอิงจากงานทะเบียนนักเรียนของโรงเรียน — ระบบนี้อ่านอย่างเดียว */
  sourceSystem: "team_b_registry";
}

/** รายการตรวจสอบของแต่ละมิติ: ติ๊ก = พบรายการนั้น */
export interface ScreeningItem {
  id: string;
  dimension: ScreeningDimension;
  label: string;
  /** ระดับที่รายการนี้บ่งชี้เมื่อถูกติ๊ก */
  severity: "risk" | "problem";
  /** รายการที่ระบบกรอกให้จากผลแบบประเมิน ครูติ๊กเองไม่ได้ */
  derivedFrom?: "red_flag" | "nine_s";
}

export interface ScreeningResult {
  dimension: ScreeningDimension;
  group: RiskGroup;
  checkedItemIds: string[];
}

export interface Screening {
  screeningId: string;
  studentId: string;
  termId: string;
  screenedBy: string;
  screenedAt: string;
  results: ScreeningResult[];
}

export type AssessmentOutcome = "normal" | "needs_care";

export interface RedFlagAssessment {
  id: string;
  studentId: string;
  termId: string;
  answers: Record<string, boolean>;
  result: AssessmentOutcome;
  assessedBy: string;
  assessedAt: string;
}

export type NineSCluster = "adhd" | "depression" | "social";

export const NINE_S_CLUSTER_LABEL: Record<NineSCluster, string> = {
  adhd: "กลุ่มสมาธิสั้น",
  depression: "กลุ่มซึมเศร้า / วิตกกังวล",
  social: "กลุ่มถูกกลั่นแกล้ง / ปัญหาสังคม",
};

export interface NineSAssessment {
  id: string;
  studentId: string;
  termId: string;
  clusterScores: Record<NineSCluster, number>;
  clusterResults: Record<NineSCluster, AssessmentOutcome>;
  result: AssessmentOutcome;
  assessedBy: string;
  assessedAt: string;
}

export type SdqRater = "teacher" | "student" | "parent";

export const SDQ_RATER_LABEL: Record<SdqRater, string> = {
  teacher: "ครูประเมิน",
  student: "นักเรียนประเมินตนเอง",
  parent: "ผู้ปกครองประเมิน",
};

export type SdqScale =
  | "emotional"
  | "conduct"
  | "hyperactivity"
  | "peer"
  | "prosocial";

export const SDQ_SCALE_LABEL: Record<SdqScale, string> = {
  emotional: "ด้านอารมณ์",
  conduct: "ด้านความประพฤติ",
  hyperactivity: "ด้านพฤติกรรมอยู่ไม่นิ่ง",
  peer: "ด้านความสัมพันธ์กับเพื่อน",
  prosocial: "ด้านสัมพันธภาพทางสังคม",
};

export type SdqLevel = "normal" | "risk" | "problem";

/** คำทางการ ใช้เฉพาะฝั่งครูและแอดมิน */
export const SDQ_LEVEL_LABEL: Record<SdqLevel, string> = {
  normal: "ปกติ",
  risk: "เสี่ยง",
  problem: "มีปัญหา",
};

/**
 * คำที่แสดงใน portal ผู้ปกครอง — ไม่แสดงคะแนนดิบและไม่แยกระดับเสี่ยง/มีปัญหา
 * การคัดกรองเป็นสัญญาณให้ติดตาม ไม่ใช่การตัดสินนักเรียน (รายงาน 2.1.1, 2.1.3)
 */
export const SDQ_PORTAL_LABEL: Record<SdqLevel, string> = {
  normal: "อยู่ในเกณฑ์ปกติ",
  risk: "ครูจะติดตามดูแลเพิ่มเติม",
  problem: "ครูจะติดตามดูแลเพิ่มเติม",
};

export interface SdqAssessment {
  id: string;
  studentId: string;
  termId: string;
  round: 1 | 2;
  rater: SdqRater;
  raterName: string;
  answers: Record<number, 0 | 1 | 2>;
  totalDifficulties: number | null;
  scaleScores: Record<SdqScale, number> | null;
  level: SdqLevel | null;
  status: "pending" | "completed";
  assessedAt: string | null;
}

export interface EqAssessment {
  id: string;
  studentId: string;
  academicYear: number;
  rater: "teacher" | "student";
  totalScore: number;
  assessedAt: string;
}

/** บทบาทที่บันทึกกฎได้ (UC7 Scenario B ข้อ 9) */
export type RuleRecorder = "teacher" | "discipline_head" | "executive";

export interface BehaviorRule {
  ruleId: string;
  name: string;
  /** ชนิดและระดับการดำเนินการ ดู lib/behavior-rules.ts (refer = ส่งต่อ ไม่มีคะแนน) */
  severity: "minor" | "moderate" | "severe" | "positive" | "refer";
  scoreDelta: number;
  isActive: boolean;
  recordableBy: RuleRecorder[];
  /** ยกเลิกกฎพร้อมเหตุผล: รายการเดิมไม่นับคะแนนแต่ยังอยู่ในประวัติ (UC7 Scenario C) */
  cancelled?: { reason: string; at: string };
}

export interface BehaviorRecord {
  recordId: string;
  studentId: string;
  ruleId: string;
  description: string;
  occurredAt: string;
  recordedByName: string;
  /** card_scan = เลือกนักเรียนจากการสแกนบัตร (UC8 ข้อ 2) */
  source: "manual" | "card_scan";
  /** รูปหลักฐาน (data URL ที่ย่อแล้ว) — PROTOTYPE: Project 2 เก็บไฟล์บน server แล้วเก็บแค่ลิงก์ */
  evidence?: string[];
}

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "reschedule_requested"
  /** ครูบันทึกผลแล้ว รอนักเรียนหรือผู้ปกครองยืนยันว่าได้เยี่ยมจริง (UC4 Scenario E) */
  | "awaiting_visit_confirmation"
  /** มีผู้ยืนยันแล้ว ระบบปิดงานเมื่อครบกำหนด ระหว่างนั้นอีกฝ่ายยังแจ้งว่าไม่ได้เยี่ยมได้ (ข้อเสนอแก้ Scenario E ข้อ 6) */
  | "visit_confirmed"
  /** นักเรียนหรือผู้ปกครองแจ้งว่าไม่ได้เยี่ยมจริง ครูต้องตรวจสอบและนัดใหม่ (Alt-E) */
  | "visit_disputed"
  /** ครบระยะเวลาโดยไม่มีผู้ตอบ ระบบปิดงานเอง (Alt-F) */
  | "completed_no_response"
  | "completed"
  | "cancelled";

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "รอการยืนยัน",
  confirmed: "ยืนยันแล้ว",
  reschedule_requested: "ขอเปลี่ยนวันเวลา",
  awaiting_visit_confirmation: "รอยืนยันว่าได้เยี่ยมจริง",
  visit_confirmed: "ยืนยันแล้ว รอครบกำหนด",
  visit_disputed: "แจ้งว่าไม่ได้เยี่ยมจริง",
  completed_no_response: "ยืนยันโดยไม่มีผู้ตอบกลับ",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

export interface HouseholdMember {
  memberId: string;
  relation: string;
  age: number;
  occupation: string;
  monthlyIncome: number;
}

export interface HomeVisitAppointment {
  appointmentId: string;
  studentId: string;
  teacherName: string;
  proposedDate: string;
  status: AppointmentStatus;
  guardianNote?: string;
  guardianPhone?: string;
  /** ผู้ดูแลเมื่อผู้ปกครองไม่อยู่บ้าน: ความสัมพันธ์ (เลือกจากรายการ) และชื่อ (ไม่บังคับ) */
  caretakerRelation?: string;
  caretakerName?: string;
  /** ช่วงเวลาที่สะดวกที่นักเรียนหรือผู้ปกครองให้ไว้ (UC4 Scenario C) */
  convenientTime?: string;
  /** ผู้ยืนยันนัด: ชื่อผู้ใช้ หรือ "ระบบ" เมื่อถึงวันนัดโดยไม่มีผู้ยืนยัน (Scenario D, Alt-D) */
  confirmedBy?: string;
  /** คำขอเปลี่ยนวันที่รอครูพิจารณา วันนัดเดิมยังมีผลระหว่างรอ (Alt-C) */
  reschedule?: { date: string; reason: string; by: string };
  /** วันสุดท้ายที่ยืนยันว่าได้เยี่ยมจริงได้ (Scenario E ข้อ 5) */
  visitConfirmDeadline?: string;
  /** ผู้ยืนยันว่าได้เยี่ยมจริง หรือผู้แจ้งว่าไม่ได้เยี่ยม */
  visitRespondedBy?: string;
}

export interface HomeVisitRecord {
  recordId: string;
  appointmentId: string;
  studentId: string;
  householdMembers: HouseholdMember[];
  riskFindings: string[];
  informantName: string;
  informantRelation: string;
  photoLabels: string[];
  /** รูปตามลำดับของ photoLabels (ต้นแบบ: data URL · Project 2: ลิงก์ไฟล์บน server) */
  photos?: string[];
  /** เหตุผลกรณีใช้ภาพนักเรียนคู่ป้ายโรงเรียนแทนรูปบ้าน */
  photoReason?: string;
  signedBy: string;
  signedAt: string;
  /** คำตอบทั้งแบบฟอร์ม (ข้อมูลตัวอย่างเดิมไม่มี) */
  form?: VisitForm;
}

/** 4 ประเภทการช่วยเหลือ ตามแนวทาง HERO OBEC CARE */
export type SupportType = "promote" | "prevent" | "refer_internal" | "refer_external";

export const SUPPORT_TYPE_LABEL: Record<SupportType, string> = {
  promote: "ส่งเสริมพัฒนา",
  prevent: "ป้องกันแก้ไข",
  refer_internal: "ส่งต่อภายใน",
  refer_external: "ส่งต่อภายนอก",
};

/** 5 วิธีการดูแล */
export type CareMethod =
  | "behavior_adjust"
  | "life_skills"
  | "counseling"
  | "guidance_teacher"
  | "school_psychologist";

export const CARE_METHOD_LABEL: Record<CareMethod, string> = {
  behavior_adjust: "ปรับพฤติกรรม",
  life_skills: "พัฒนาทักษะชีวิต",
  counseling: "ให้คำปรึกษาเด็ก / ผู้ปกครอง",
  guidance_teacher: "ปรึกษาครูแนะแนว",
  school_psychologist: "ปรึกษานักจิตวิทยาโรงเรียน",
};

export interface CareFollowup {
  followupId: string;
  actionTaken: string;
  result: string;
  followupDate: string;
  recordedByName: string;
  /** วันติดตามครั้งถัดไปที่กำหนดตอนบันทึกครั้งนี้ (UC11 ข้อ 14) */
  nextFollowupDate?: string;
}

/** ระดับความเร่งด่วนของ case (รายงาน 2.1.7 ข้อ 2) — PROTOTYPE: จำนวนระดับยังไม่ได้ตกลงกับทีม */
export type CaseUrgency = "high" | "medium" | "low";

export const CASE_URGENCY_LABEL: Record<CaseUrgency, string> = {
  high: "เร่งด่วนมาก",
  medium: "เร่งด่วน",
  low: "ปกติ",
};

export interface CareCase {
  caseId: string;
  studentId: string;
  triggerSource: string;
  status: "active" | "closed";
  openedAt: string;
  closedAt: string | null;
  supportType: SupportType;
  careMethods: CareMethod[];
  goal: string;
  targetDate: string;
  urgency: CaseUrgency;
  /** วันติดตามครั้งถัดไป ("" = ยังไม่กำหนด) ใช้คำนวณใกล้ครบกำหนด / เกินกำหนดในหน้าภาพรวม */
  nextFollowupDate: string;
  followups: CareFollowup[];
  /** ผลสรุปเมื่อปิด case (UC11 Scenario C) */
  closingSummary?: string;
  /** เอกสารส่งต่อที่ครูส่งให้แอดมินเก็บรักษา (UC11 Scenario D) */
  referral?: Referral;
}

/** case ที่ระบบเปิดให้จากผลคัดกรองแต่ครูยังไม่วางแผน ความเร่งด่วนยังไม่มีผล (UC11 ข้อ 5) */
export function caseUrgencyText(c: Pick<CareCase, "goal" | "urgency">): string {
  return c.goal === "" ? "ยังไม่วางแผน" : CASE_URGENCY_LABEL[c.urgency];
}

export type ReferralStatus = "awaiting_admin" | "stored" | "forwarded";

export const REFERRAL_STATUS_LABEL: Record<ReferralStatus, string> = {
  awaiting_admin: "รอแอดมินรับเก็บรักษา",
  stored: "รับเก็บรักษาแล้ว",
  forwarded: "ส่งต่อแล้ว",
};

/** แอดมินเห็นเฉพาะเลขเอกสาร ผู้ส่ง วันที่ และสถานะ ไม่เห็นชื่อนักเรียนหรือเนื้อหา (ตาราง 3.4) */
export interface Referral {
  referralId: string;
  preparedAt: string;
  sentByName: string;
  status: ReferralStatus;
  statusAt: string;
}

/** คุณลักษณะอันพึงประสงค์ 8 ประการ ตามหลักสูตรแกนกลางฯ 2551 */
export interface DcCriteria {
  criteriaId: number;
  name: string;
  shortName: string;
}

/** ระดับคุณภาพ 0 = ไม่ผ่าน, 1 = ผ่าน, 2 = ดี, 3 = ดีเยี่ยม */
export type DcLevel = 0 | 1 | 2 | 3;

export const DC_LEVEL_LABEL: Record<DcLevel, string> = {
  0: "ไม่ผ่าน",
  1: "ผ่าน",
  2: "ดี",
  3: "ดีเยี่ยม",
};

/**
 * ผลประเมินคุณลักษณะอันพึงประสงค์ 8 ข้อโดยครูที่ปรึกษา (UC13)
 * ประเมินซ้ำเก็บเป็นรอบใหม่ แยกจากผลเดิม (ข้อ 9)
 */
export interface DcAssessment {
  id: string;
  studentId: string;
  round: number;
  levels: Record<number, DcLevel | null>;
  note: string;
  status: "draft" | "submitted";
  assessedAt: string;
  assessedBy: string;
}

export interface DcSummary {
  studentId: string;
  levels: Record<number, DcLevel | null>;
}

export interface SubjectSubmission {
  subject: string;
  teacherName: string;
  submitted: boolean;
}

export type DocumentType = "ปพ.3" | "ปพ.4" | "ปพ.5" | "ปพ.6" | "ปพ.7";

export interface EducationDocument {
  docId: string;
  docType: DocumentType;
  target: string;
  generatedByName: string;
  generatedAt: string;
  /** ฉบับที่ ออกใหม่แล้วเก็บฉบับเดิมไว้ (UC15 Scenario A ข้อ 10) */
  version?: number;
}

/** ครูขอจัดทำ ปพ.7 แล้วแอดมินจัดทำและส่งกลับ (UC15 Scenario B) */
export interface DocumentRequest {
  requestId: string;
  docType: "ปพ.7";
  studentId: string;
  requestedByName: string;
  requestedAt: string;
  status: "pending" | "done";
  docId?: string;
}

/**
 * บันทึกการเปิดดูข้อมูลส่วนบุคคลที่ซ่อนไว้ (ข้อ 2.1.10)
 * PROTOTYPE: เก็บในหน่วยความจำ · Project 2 ต้องเขียนที่ backend ให้แก้หรือลบไม่ได้
 */
export interface AccessLog {
  logId: string;
  studentId: string;
  field: "citizen_id";
  actorName: string;
  actorRole: string;
  at: string;
}
