/** ข้อมูลตัวอย่าง: เอกสาร ปพ. ที่ออกแล้ว และข้อมูลอ่านอย่างเดียวจาก Team A / Team B ที่ใช้ตรวจความพร้อม */

import type { AcademicResultStatus, EducationDocument, GraduateList } from "../types";
import { generatedRoster, USER } from "./core";

const baseEducationDocuments: EducationDocument[] = [
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

/** เอกสารที่ออกแล้วของนักเรียนที่สร้างเพิ่ม (ครูประจำชั้นออก ปพ.4 / ปพ.6 ของภาคเรียนที่ 1 ให้บางคน) */
const issuedFor = generatedRoster.profiles.filter((_, i) => i % 5 === 1);
const generatedDocuments: EducationDocument[] = issuedFor.flatMap((p, i) => {
  const target = generatedRoster.students.find((s) => s.studentId === p.studentId)!.fullName;
  const date = i % 2 === 0 ? "2569-10-08" : "2569-10-09";
  return [
    {
      docId: `DOC-${String(5 + i * 2).padStart(3, "0")}`,
      docType: "ปพ.4" as const,
      studentId: p.studentId,
      roomId: "R-301",
      subjectId: null,
      termId: "T2569-1",
      target,
      generatedBy: p.teacherId,
      generatedAt: `${date}T13:${String(10 + i * 4).padStart(2, "0")}:00`,
      fileUrl: null,
    },
    {
      docId: `DOC-${String(6 + i * 2).padStart(3, "0")}`,
      docType: "ปพ.6" as const,
      studentId: p.studentId,
      roomId: "R-301",
      subjectId: null,
      termId: "T2569-1",
      target,
      generatedBy: p.teacherId,
      generatedAt: `${date}T14:${String(10 + i * 4).padStart(2, "0")}:00`,
      fileUrl: null,
    },
  ];
});

/** ใหม่สุดก่อน */
export const educationDocuments: EducationDocument[] = [...baseEducationDocuments, ...generatedDocuments].sort((a, b) =>
  b.generatedAt.localeCompare(a.generatedAt)
);

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
]).concat(
  // นักเรียนที่สร้างเพิ่ม: ผลการเรียนครบ ยกเว้น 2 คนที่ยังรอผลบางวิชาในภาคเรียนนี้
  generatedRoster.profiles.flatMap((p, i) => [
    { studentId: p.studentId, termId: "T2569-1", gradesComplete: true, attendanceComplete: true },
    { studentId: p.studentId, termId: "T2569-2", gradesComplete: i % 13 !== 6, attendanceComplete: true },
  ])
);

/** รายชื่อผู้จบการศึกษา (Team B) — ม.3 จบการศึกษาภาคบังคับ */
export const graduateLists: GraduateList[] = [{ roomId: "R-301", academicYear: 2569, confirmed: true }];
