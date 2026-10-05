/** คุณลักษณะอันพึงประสงค์ 8 ประการ ตามหลักสูตรแกนกลางฯ 2551 (ปพ.5 → ปพ.6) */

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
  /** userId ของครูประจำวิชา */
  teacherId: string;
  submitted: boolean;
}
