/** ข้อมูลตัวอย่าง: คุณลักษณะอันพึงประสงค์ (ปพ.5 / ปพ.6) */

import type { DcCriteria, DcSummary, SubjectSubmission } from "../types";
import { USER } from "./core";

export const dcCriteria: DcCriteria[] = [
  { criteriaId: 1, name: "รักชาติ ศาสน์ กษัตริย์", shortName: "รักชาติฯ" },
  { criteriaId: 2, name: "ซื่อสัตย์สุจริต", shortName: "ซื่อสัตย์" },
  { criteriaId: 3, name: "มีวินัย", shortName: "มีวินัย" },
  { criteriaId: 4, name: "ใฝ่เรียนรู้", shortName: "ใฝ่เรียนรู้" },
  { criteriaId: 5, name: "อยู่อย่างพอเพียง", shortName: "พอเพียง" },
  { criteriaId: 6, name: "มุ่งมั่นในการทำงาน", shortName: "มุ่งมั่น" },
  { criteriaId: 7, name: "รักความเป็นไทย", shortName: "รักไทย" },
  { criteriaId: 8, name: "มีจิตสาธารณะ", shortName: "จิตสาธารณะ" },
];

export const dcSummaries: DcSummary[] = [
  { studentId: "30118", levels: { 1: 3, 2: 2, 3: 1, 4: 2, 5: 3, 6: 1, 7: 2, 8: 3 } },
  { studentId: "30171", levels: { 1: 3, 2: 3, 3: 2, 4: 3, 5: 3, 6: 2, 7: 3, 8: 3 } },
  { studentId: "30125", levels: { 1: 3, 2: 3, 3: 2, 4: 2, 5: 3, 6: 1, 7: 2, 8: 3 } },
  { studentId: "30160", levels: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3 } },
  { studentId: "30131", levels: { 1: 2, 2: 2, 3: 0, 4: 1, 5: 2, 6: null, 7: 2, 8: 2 } },
  { studentId: "30140", levels: { 1: 3, 2: 3, 3: 3, 4: 2, 5: 3, 6: 2, 7: 3, 8: 3 } },
  { studentId: "30152", levels: { 1: 3, 2: 2, 3: 2, 4: 3, 5: 2, 6: 2, 7: 3, 8: null } },
  { studentId: "30183", levels: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 3, 7: 3, 8: 3 } },
];

export const subjectSubmissions: SubjectSubmission[] = [
  { subject: "ภาษาไทย", teacherId: USER.wimon, submitted: true },
  { subject: "คณิตศาสตร์", teacherId: USER.wichai, submitted: true },
  { subject: "วิทยาศาสตร์", teacherId: USER.napa, submitted: true },
  { subject: "สังคมศึกษา", teacherId: USER.prayong, submitted: true },
  { subject: "ภาษาอังกฤษ", teacherId: USER.anna, submitted: true },
  { subject: "สุขศึกษาและพลศึกษา", teacherId: USER.somchaiK, submitted: true },
  { subject: "ศิลปะ", teacherId: USER.malee, submitted: false },
  { subject: "การงานอาชีพ", teacherId: USER.arun, submitted: false },
];
