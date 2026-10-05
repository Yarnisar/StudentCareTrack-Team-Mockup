/** เอกสารประเมินผลทางการศึกษา (ปพ.) */

export type DocumentType = "ปพ.3" | "ปพ.4" | "ปพ.5" | "ปพ.6" | "ปพ.7";

/**
 * ชื่อเอกสาร — ต้องตรวจชื่อเต็มกับระเบียบการวัดและประเมินผลของหลักสูตรแกนกลางฯ 2551 อีกครั้ง
 * (data_dictionary: "ชื่อเต็มและองค์ประกอบของแต่ละ ปพ. ต้องตรวจ...")
 */
export const DOCUMENT_NAME: Record<DocumentType, string> = {
  "ปพ.3": "แบบรายงานผู้สำเร็จการศึกษา",
  "ปพ.4": "แบบแสดงผลการประเมินคุณลักษณะอันพึงประสงค์",
  "ปพ.5": "แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน",
  "ปพ.6": "แบบรายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล",
  "ปพ.7": "ใบรับรองผลการศึกษา",
};

/** เอกสารที่มีข้อมูลผลการเรียนจาก Team A → แสดงป้าย "ข้อมูลผลการเรียนจากงานวิชาการ" */
export const DOCUMENT_HAS_GRADES: Record<DocumentType, boolean> = {
  "ปพ.3": true,
  "ปพ.4": false,
  "ปพ.5": true,
  "ปพ.6": true,
  "ปพ.7": true,
};

/** ขอบเขตของเอกสาร: รายคน / ทั้งห้อง / รายวิชาของห้อง */
export type DocumentScope =
  | { kind: "student"; studentId: string }
  | { kind: "room"; roomId: string }
  | { kind: "teaching"; teachingId: string };

export const DOCUMENT_SCOPE_KIND: Record<DocumentType, DocumentScope["kind"]> = {
  "ปพ.3": "room",
  "ปพ.4": "student",
  "ปพ.5": "teaching",
  "ปพ.6": "student",
  "ปพ.7": "student",
};

/** education_documents */
export interface EducationDocument {
  docId: string;
  docType: DocumentType;
  /** null สำหรับเอกสารระดับห้อง/รายวิชา (ปพ.3, ปพ.5) */
  studentId: string | null;
  /** ห้องของเอกสาร (ข้อมูลประกอบในต้นแบบ ไม่มีใน data dictionary) */
  roomId: string | null;
  /** รายวิชาของ ปพ.5 (ข้อมูลประกอบในต้นแบบ) */
  subjectId: string | null;
  termId: string;
  /** ข้อความแสดงผล เช่น ชื่อนักเรียน หรือ "ทั้งห้อง ม.3/1" */
  target: string;
  /** userId ของผู้ออกเอกสาร */
  generatedBy: string;
  generatedAt: string;
  /** ที่อยู่ไฟล์ PDF (ต้นแบบยังไม่สร้างไฟล์จริง) */
  fileUrl: string | null;
}

/** แหล่งข้อมูลของเงื่อนไขก่อนออกเอกสาร */
export type DocumentCheckSource = "team_c" | "team_a" | "team_b";

export interface DocumentCheck {
  label: string;
  ok: boolean;
  source: DocumentCheckSource;
  /** รายละเอียดเมื่อยังไม่ผ่าน */
  detail?: string;
}

/**
 * สรุปผลการเรียนรายภาคเรียน (Team A) — อ่านอย่างเดียว ใช้ตรวจความพร้อมของ ปพ.3/5/6/7
 * ต้นแบบจำลองไว้เท่านั้น โครงสร้างจริงขึ้นกับการออกแบบของ Team A
 */
export interface AcademicResultStatus {
  studentId: string;
  termId: string;
  /** งานวิชาการบันทึกผลการเรียนครบทุกรายวิชาแล้ว */
  gradesComplete: boolean;
  /** บันทึกเวลาเรียนครบแล้ว */
  attendanceComplete: boolean;
}

/** รายชื่อผู้จบการศึกษา (Team B) — อ่านอย่างเดียว */
export interface GraduateList {
  roomId: string;
  academicYear: number;
  /** งานทะเบียนยืนยันรายชื่อผู้มีสิทธิ์จบแล้ว */
  confirmed: boolean;
}
