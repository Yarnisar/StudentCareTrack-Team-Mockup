/** ข้อมูลตัวอย่าง: เอกสาร ปพ. ที่ออกแล้ว และข้อมูลอ่านอย่างเดียวจาก Team A / Team B ที่ใช้ตรวจความพร้อม */

import type { AcademicResultStatus, EducationDocument, GraduateList } from "../types";
import { USER } from "./core";

export const educationDocuments: EducationDocument[] = [
  {
    docId: "DOC-004",
    docType: "ปพ.7",
    studentId: "30131",
    roomId: "R-301",
    subjectId: null,
    termId: "T2569-2",
    target: "ด.ช. อนันต์ มุ่งมั่น",
    generatedBy: USER.admin,
    generatedAt: "2570-02-10T10:15:00",
    fileUrl: null,
  },
  {
    docId: "DOC-003",
    docType: "ปพ.6",
    studentId: "30125",
    roomId: "R-301",
    subjectId: null,
    termId: "T2569-1",
    target: "ด.ญ. แพรวา สายใจ",
    generatedBy: USER.somying,
    generatedAt: "2569-10-08T14:00:00",
    fileUrl: null,
  },
  {
    docId: "DOC-002",
    docType: "ปพ.4",
    studentId: "30118",
    roomId: "R-301",
    subjectId: null,
    termId: "T2569-1",
    target: "ด.ช. ภูมิ ตั้งใจเรียน",
    generatedBy: USER.somying,
    generatedAt: "2569-10-08T13:30:00",
    fileUrl: null,
  },
  {
    docId: "DOC-001",
    docType: "ปพ.5",
    studentId: null,
    roomId: "R-301",
    subjectId: "SUB-MA",
    termId: "T2569-1",
    target: "คณิตศาสตร์ ม.3/1",
    generatedBy: USER.wichai,
    generatedAt: "2569-10-01T16:00:00",
    fileUrl: null,
  },
];

/**
 * สถานะผลการเรียนจากงานวิชาการ (Team A) — จำลองแบบอ่านอย่างเดียว
 * 30131 ยังรอผลการเรียนบางวิชา จึงยังออก ปพ.6 / ปพ.7 ไม่ได้
 */
export const academicResultStatuses: AcademicResultStatus[] = [
  "30118",
  "30125",
  "30131",
  "30140",
  "30152",
  "30160",
  "30171",
  "30183",
].flatMap((studentId) => [
  { studentId, termId: "T2569-1", gradesComplete: true, attendanceComplete: true },
  { studentId, termId: "T2569-2", gradesComplete: studentId !== "30131", attendanceComplete: true },
]);

/** รายชื่อผู้จบการศึกษา (Team B) — ม.3 จบการศึกษาภาคบังคับ */
export const graduateLists: GraduateList[] = [{ roomId: "R-301", academicYear: 2569, confirmed: true }];
