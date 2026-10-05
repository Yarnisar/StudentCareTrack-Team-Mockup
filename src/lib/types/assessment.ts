/** แบบประเมินสุขภาพจิต: Red Flag, 9S, SDQ, EQ (ADR-0002) */

export type AssessmentOutcome = "normal" | "needs_care";

export interface RedFlagAssessment {
  id: string;
  studentId: string;
  termId: string;
  answers: Record<string, boolean>;
  result: AssessmentOutcome;
  /** userId ของผู้ประเมิน */
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
  /** userId ของผู้ประเมิน */
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

/** voided: ยกเลิกแล้ว (ต้องมีเหตุผล) — ใช้เมื่อผล Red Flag/9S แก้กลับเป็นปกติก่อนมีใครตอบ ไม่มีการลบจริง */
export type SdqStatus = "pending" | "submitted" | "voided";

export const SDQ_STATUS_LABEL: Record<SdqStatus, string> = {
  pending: "รอทำแบบประเมิน",
  submitted: "ส่งแล้ว",
  voided: "ยกเลิกแล้ว",
};

/** sdq_assessments — UNIQUE (studentId, termId, round, rater) ส่งแล้วแก้ไม่ได้ */
export interface SdqAssessment {
  id: string;
  studentId: string;
  termId: string;
  /** ครั้งที่ 1 (ภาคเรียนที่ 1) / ครั้งที่ 2 (ภาคเรียนที่ 2) */
  round: 1 | 2;
  rater: SdqRater;
  /**
   * userId ของผู้ประเมิน — null เมื่อยังไม่มีใครส่ง
   * (ฉบับผู้ปกครอง: ผู้ปกครองคนที่ส่งก่อนเป็นผู้ประเมิน)
   */
  raterUserId: string | null;
  /** คำตอบรายข้อ — เปิดดูได้เฉพาะฉบับที่ผลเป็นมีปัญหา และบันทึก VIEW_SENSITIVE ทุกครั้ง */
  answers: Record<number, 0 | 1 | 2>;
  totalDifficulties: number | null;
  scaleScores: Record<SdqScale, number> | null;
  /** ผลตามเกณฑ์ของฉบับนั้น (result_level) */
  level: SdqLevel | null;
  status: SdqStatus;
  /** วันเวลาที่เปิดแบบประเมิน (ส่งคำขอ) */
  requestedAt: string;
  submittedAt: string | null;
  /** เหตุผลการยกเลิก (มีเมื่อ status = voided) */
  voidReason?: string | null;
}

/**
 * ผล SDQ รวม — ผลที่รุนแรงที่สุดจากฉบับที่ส่งแล้ว คำนวณทุกครั้งที่ใช้ ไม่เก็บ
 * มีผลก็ต่อเมื่อฉบับครูส่งแล้ว และต้องแสดงเสมอว่าอิงจากกี่ฉบับ
 */
export interface CombinedSdqResult {
  studentId: string;
  termId: string;
  round: 1 | 2;
  /** null = ยังไม่มีผล (ฉบับครูยังไม่ส่ง) */
  level: SdqLevel | null;
  /** จำนวนฉบับที่ส่งแล้ว */
  basedOn: number;
  /** จำนวนฉบับทั้งชุด (ประถมไม่มีฉบับนักเรียน) */
  total: number;
  teacherSubmitted: boolean;
}

/**
 * ขั้นถัดไปของนักเรียนในภาคเรียนปัจจุบัน
 * - red_flag / nine_s: ต้องทำแบบคัดกรอง (ภาคเรียนที่ 2 เฉพาะคนที่ยังไม่เคยประเมินในปีนี้)
 * - open_sdq: ต้องทำ SDQ รอบนี้ แต่ยังไม่ได้เปิดแบบประเมิน
 * - wait_sdq_window: ต้องทำ SDQ รอบนี้ แต่ยังไม่อยู่ในช่วงดำเนินงาน sdq (เปิดแบบประเมินเมื่อถึงช่วง)
 * - sdq: เปิดแล้ว รอฉบับใดฉบับหนึ่ง
 * - done: ครบทุกฉบับของรอบนี้แล้ว
 * - not_required: ผลปกติ ไม่ต้องทำ SDQ รอบนี้
 */
export type AssessmentNextStep =
  | "red_flag"
  | "nine_s"
  | "open_sdq"
  | "wait_sdq_window"
  | "sdq"
  | "done"
  | "not_required";

export const ASSESSMENT_NEXT_STEP_LABEL: Record<AssessmentNextStep, string> = {
  red_flag: "รอทำ Red Flag",
  nine_s: "รอทำ 9S",
  open_sdq: "รอเปิด SDQ",
  wait_sdq_window: "รอเปิดช่วงทำ SDQ",
  sdq: "รอส่ง SDQ",
  done: "ครบแล้ว",
  not_required: "ไม่ต้องทำ SDQ รอบนี้",
};

/** สถานะการประเมินของนักเรียน 1 คนในภาคเรียนปัจจุบัน (คำนวณจากข้อมูลทั้งปีการศึกษา) */
export interface AssessmentPlan {
  studentId: string;
  termId: string;
  round: 1 | 2;
  /** Red Flag / 9S ล่าสุดของปีการศึกษานี้ */
  redFlag: RedFlagAssessment | undefined;
  nineS: NineSAssessment | undefined;
  /** ผล Red Flag หรือ 9S เป็นควรดูแล (null = ยังประเมินไม่ครบ) */
  needsCare: boolean | null;
  /** ผล Red Flag/9S มาจากภาคเรียนก่อน (ภาคเรียนที่ 2 ไม่ต้องทำซ้ำ) */
  carriedFromEarlierTerm: boolean;
  sdqRequired: boolean;
  /** ฉบับ SDQ ของรอบนี้ */
  sdqForms: SdqAssessment[];
  combined: CombinedSdqResult | null;
  next: AssessmentNextStep;
}

export interface EqAssessment {
  id: string;
  studentId: string;
  academicYear: number;
  rater: "teacher" | "student";
  totalScore: number;
  assessedAt: string;
}
