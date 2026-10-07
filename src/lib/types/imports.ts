/** import_jobs (ADR-0005, โหมดเดี่ยว) — ประวัติการนำเข้า ไม่ลบ เก็บเฉพาะจำนวน ไม่เก็บข้อมูลรายบุคคล */

export type ImportKind = "students" | "classrooms" | "guardians" | "staff" | "terms";

export const IMPORT_KINDS: ImportKind[] = ["students", "classrooms", "guardians", "staff", "terms"];

export const IMPORT_KIND_LABEL: Record<ImportKind, string> = {
  students: "นักเรียน",
  classrooms: "ห้องเรียน",
  guardians: "ผู้ปกครอง",
  staff: "ครู",
  terms: "ภาคเรียน",
};

export interface ImportJob {
  jobId: string;
  kind: ImportKind;
  filename: string;
  uploadedBy: string;
  uploadedAt: string;
  /** ต้นแบบบันทึกเฉพาะงานที่ยืนยันแล้ว (ตรวจอย่างเดียวไม่เขียนอะไร) */
  status: "committed";
  totalRows: number;
  validRows: number;
  invalidRows: number;
  createdRows: number;
  updatedRows: number;
  /** แถวที่ผ่านแต่ข้อมูลเหมือนเดิม จึงไม่เขียน */
  unchangedRows: number;
  committedBy: string;
  committedAt: string;
}
