/** คุณลักษณะอันพึงประสงค์ 8 ประการ ตามหลักสูตรแกนกลางฯ 2551 (ปพ.5 → ปพ.6) */

/** dc_criteria */
export interface DcCriteria {
  criteriaId: number;
  name: string;
  shortName: string;
  description: string;
}

/** dc_indicators — ตัวชี้วัดของแต่ละคุณลักษณะ */
export interface DcIndicator {
  indicatorId: string;
  criteriaId: number;
  /** เลขข้อตัวชี้วัด เช่น "1.2" */
  code: string;
  description: string;
  /** ช่วงชั้นที่ใช้ (ป.1-3/ป.4-6/ม.1-3/ม.4-6) */
  gradeRange: string;
}

/** ระดับคุณภาพ 0 = ไม่ผ่าน, 1 = ผ่าน, 2 = ดี, 3 = ดีเยี่ยม */
export type DcLevel = 0 | 1 | 2 | 3;

export const DC_LEVELS: DcLevel[] = [3, 2, 1, 0];

export const DC_LEVEL_LABEL: Record<DcLevel, string> = {
  0: "ไม่ผ่าน",
  1: "ผ่าน",
  2: "ดี",
  3: "ดีเยี่ยม",
};

/** subjects (Team A) — ระบบนี้อ่านอย่างเดียว */
export interface Subject {
  subjectId: string;
  /** รหัสวิชา เช่น ค23102 */
  subjectCode: string;
  name: string;
}

/**
 * รายวิชาที่ครูประจำวิชาสอนห้องหนึ่งในภาคเรียนหนึ่ง (Team A) — อ่านอย่างเดียว
 * ใช้หาว่าใครต้องให้คะแนน ปพ.5 ของห้องใด
 */
export interface SubjectTeaching {
  teachingId: string;
  subjectId: string;
  roomId: string;
  termId: string;
  /** userId ของครูประจำวิชา */
  teacherId: string;
}

/** dc_scores (ปพ.5) — UNIQUE (studentId, indicatorId, subjectId, termId) */
export interface DcScore {
  scoreId: string;
  studentId: string;
  indicatorId: string;
  subjectId: string;
  /** userId ของครูประจำวิชาที่ให้คะแนน */
  subjectTeacherId: string;
  termId: string;
  level: DcLevel;
  updatedAt: string;
}

/** dc_summary (ปพ.6) — 1 แถวต่อ (นักเรียน, คุณลักษณะ, ภาคเรียน) */
export interface DcSummaryRow {
  summaryId: string;
  studentId: string;
  criteriaId: number;
  termId: string;
  /** ค่าฐานนิยมจาก dc_scores ที่ระบบเสนอ (null = ยังไม่มีคะแนนเลย) */
  suggestedLevel: DcLevel | null;
  /** ระดับที่ครูประจำชั้นสรุป */
  level: DcLevel;
  /** บังคับเมื่อ level ≠ suggestedLevel */
  adjustReason: string | null;
  /** subjectId ของรายวิชาที่ยังไม่ส่งคะแนนตอนสรุป */
  missingSubjects: string[];
  summarizedBy: string;
  summarizedAt: string;
}

/** มุมมองสรุปคุณลักษณะของนักเรียน 1 คนใน 1 ภาคเรียน (รวม dc_summary ทั้ง 8 แถว) สำหรับแสดงผล */
export interface DcSummary {
  studentId: string;
  termId: string;
  levels: Record<number, DcLevel | null>;
  /** ชื่อรายวิชาที่ยังไม่ส่งคะแนนตอนสรุป */
  missingSubjects: string[];
  summarizedBy: string | null;
  summarizedAt: string | null;
}

/** สถานะการส่งคะแนน ปพ.5 ของรายวิชาหนึ่งในห้องหนึ่ง (คำนวณจาก dc_scores) */
export interface SubjectSubmission {
  teachingId: string;
  subjectId: string;
  /** ชื่อรายวิชา */
  subject: string;
  /** userId ของครูประจำวิชา */
  teacherId: string;
  roomId: string;
  /** จำนวนช่องที่ให้คะแนนแล้ว / ทั้งหมด (นักเรียน × ตัวชี้วัด) */
  filled: number;
  total: number;
  /** ส่งครบ = ให้คะแนนครบทุกนักเรียนทุกตัวชี้วัด */
  submitted: boolean;
}

/** กำหนดส่งคะแนน ปพ.5 ของภาคเรียน — มาจากงานวิชาการ (Team A) */
export interface DcSubmissionDeadline {
  termId: string;
  /** วันสุดท้ายที่ส่งได้ (พ.ศ. YYYY-MM-DD) */
  date: string;
  source: "team_a_academic";
}

/** การแก้ระดับจากค่าที่ระบบเสนอ (ใช้ตอนสรุป) */
export interface DcLevelOverride {
  level: DcLevel;
  reason: string;
}
