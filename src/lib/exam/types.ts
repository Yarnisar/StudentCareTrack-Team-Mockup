/**
 * ห้องสอบและผังที่นั่ง (ADR-0004) — exam_rooms / exam_sessions / exam_seats
 * ทีม C เก็บเฉพาะผังที่นั่ง ตารางสอบเป็นของทีม A; นักเรียนอ้างอิงด้วย studentId เท่านั้น
 */

export type ExamCell = "desk" | "aisle";

export const EXAM_MAX_SIDE = 20;

/** exam_rooms — ไม่ลบ ใช้ isActive = false */
export interface ExamRoom {
  examRoomId: string;
  name: string;
  rowCount: number;
  colCount: number;
  /** layout[แถว][คอลัมน์] — แถวแรกคือแถวหน้าห้อง */
  layout: ExamCell[][];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export type ExamMethod = "by_student_code" | "random";
export type ExamSessionStatus = "draft" | "published" | "voided";

export const EXAM_METHOD_LABEL: Record<ExamMethod, string> = {
  by_student_code: "เรียงตามรหัส",
  random: "สุ่ม",
};

export const EXAM_STATUS_LABEL: Record<ExamSessionStatus, string> = {
  draft: "ฉบับร่าง",
  published: "เผยแพร่แล้ว",
  voided: "ยกเลิกแล้ว",
};

/** exam_sessions */
export interface ExamSession {
  sessionId: string;
  termId: string;
  title: string;
  /** พ.ศ. yyyy-mm-dd (ไม่บังคับ) */
  examDate: string | null;
  examTime: string | null;
  /** กลุ่มนักเรียนที่สอบ = ชื่อห้องเรียน (roomName) ของนักเรียน */
  studentScope: string[];
  /** ห้องสอบที่ใช้ ตามลำดับที่เลือก (ใช้เติมที่นั่งตามลำดับนี้) */
  examRoomIds: string[];
  method: ExamMethod;
  /** ค่าสุ่มของผัง (เฉพาะ random) */
  seed: number | null;
  status: ExamSessionStatus;
  voidReason: string | null;
  createdBy: string;
  createdAt: string;
}

/** exam_seats — studentId = null คือโต๊ะว่าง */
export interface ExamSeat {
  seatId: string;
  sessionId: string;
  examRoomId: string;
  seatNo: number;
  /** เริ่มที่ 1 (1 = แถวหน้า) */
  rowNo: number;
  colNo: number;
  studentId: string | null;
}
