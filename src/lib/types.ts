/** ชนิดข้อมูลหลักของระบบ อ้างอิงตาม ER Diagram ในบทที่ 3 */

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

export const SDQ_LEVEL_LABEL: Record<SdqLevel, string> = {
  normal: "ปกติ",
  risk: "เสี่ยง",
  problem: "มีปัญหา",
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
  recordedByName: string;
  source: "manual" | "qr_checkin";
}

export interface CheckinLog {
  logId: string;
  studentId: string;
  scannedAt: string;
  isLate: boolean;
  scannedByName: string;
}

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "reschedule_requested"
  | "completed"
  | "cancelled";

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "รอการยืนยัน",
  confirmed: "ยืนยันแล้ว",
  reschedule_requested: "ขอเปลี่ยนวันเวลา",
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
  caretakerName?: string;
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
  signedBy: string;
  signedAt: string;
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
}

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
  followups: CareFollowup[];
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
}
