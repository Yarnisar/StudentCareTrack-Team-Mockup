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

export interface SdqAssessment {
  id: string;
  studentId: string;
  termId: string;
  round: 1 | 2;
  rater: SdqRater;
  /**
   * userId ของผู้ประเมิน — null เมื่อยังไม่มีใครส่ง
   * (ฉบับผู้ปกครอง: ผู้ปกครองคนที่ส่งก่อนเป็นผู้ประเมิน)
   */
  raterUserId: string | null;
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
