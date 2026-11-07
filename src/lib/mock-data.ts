/**
 * ข้อมูลตัวอย่างสำหรับต้นแบบระบบ
 * ใน Project 2 ข้อมูลส่วนนี้จะถูกแทนที่ด้วยการเรียก API ของ FastAPI
 * ข้อมูลนักเรียน (students) จำลองการอ่านจากงานทะเบียนนักเรียนของโรงเรียน
 */

import {
  BehaviorRecord,
  BehaviorRule,
  CareCase,
  DcCriteria,
  DcSummary,
  EducationDocument,
  HomeVisitAppointment,
  HomeVisitRecord,
  SdqAssessment,
  Screening,
  Student,
  SubjectSubmission,
  StudentCard,
} from "./types";
import { scoreEq, type EqAnswer, type EqAssessment } from "./eq";

/**
 * วันที่อ้างอิงของต้นแบบ (ปี พ.ศ.)
 * ตรึงไว้ให้อยู่ในภาคเรียนเดียวกับข้อมูลตัวอย่าง เพื่อให้รายการที่บันทึกใหม่
 * เรียงต่อจากข้อมูลเดิมอย่างถูกต้องขณะสาธิตระบบ
 */
export const DEMO_TODAY = "2570-02-16";

/**
 * บุตรหลานที่เชื่อมกับบัญชีผู้ปกครองตัวอย่าง (UC3 ข้อ 2) และนักเรียนที่ล็อกอินใน portal
 * PROTOTYPE: การเชื่อมบัญชีจริงมาจาก IAM ของ Team B
 */
export const PORTAL_STUDENT_ID = "30125";
export const PARENT_CHILDREN: string[] = [PORTAL_STUDENT_ID];

export const CURRENT_TERM = {
  termId: "T2569-2",
  academicYear: 2569,
  semester: 2,
  label: "ภาคเรียนที่ 2 ปีการศึกษา 2569",
};

/** ภาคเรียนที่เลือกได้ในหน้าตั้งค่า (ภาคปัจจุบันและภาคถัดไป) — PROTOTYPE: ข้อมูลจริงมาจาก Team B */
export const TERMS = [
  { termId: CURRENT_TERM.termId, label: CURRENT_TERM.label },
  { termId: "T2570-1", label: "ภาคเรียนที่ 1 ปีการศึกษา 2570" },
];

export const CURRENT_TEACHER = {
  name: "ครูสมหญิง ใจดี",
  role: "ครูประจำชั้น ม.3/1",
  roomName: "ม.3/1",
};

export const SCHOOL_NAME = "โรงเรียนตัวอย่างวิทยา";

export const students: Student[] = [
  {
    studentId: "30125",
    fullName: "ด.ญ. แพรวา สายใจ",
    citizenId: "1-1037-00481-27-1",
    roomName: "ม.3/1",
    classNo: 12,
    guardianName: "นางสาวรัตนา สายใจ",
    guardianRelation: "มารดา",
    guardianPhone: "08x-xxx-4471",
    address: "45/2 ต.บางพลี อ.เมือง จ.สมุทรปราการ",
    sourceSystem: "team_b_registry",
  },
  {
    studentId: "30118",
    fullName: "ด.ช. ภูมิ ตั้งใจเรียน",
    citizenId: "1-1037-00493-61-2",
    roomName: "ม.3/1",
    classNo: 5,
    guardianName: "นายสมชาย ตั้งใจเรียน",
    guardianRelation: "บิดา",
    guardianPhone: "08x-xxx-1182",
    address: "112 ต.บางพลี อ.เมือง จ.สมุทรปราการ",
    sourceSystem: "team_b_registry",
  },
  {
    studentId: "30131",
    fullName: "ด.ช. อนันต์ มุ่งมั่น",
    citizenId: "1-1037-00507-35-3",
    roomName: "ม.3/1",
    classNo: 18,
    guardianName: "นางพิมพ์ใจ มุ่งมั่น",
    guardianRelation: "มารดา",
    guardianPhone: "08x-xxx-9930",
    address: "8/15 ต.บางแก้ว อ.บางพลี จ.สมุทรปราการ",
    sourceSystem: "team_b_registry",
  },
  {
    studentId: "30140",
    fullName: "ด.ญ. ปาริชาติ ใฝ่ดี",
    citizenId: "1-1037-00512-84-4",
    roomName: "ม.3/1",
    classNo: 22,
    guardianName: "นายวิรัตน์ ใฝ่ดี",
    guardianRelation: "บิดา",
    guardianPhone: "08x-xxx-2245",
    address: "77 ต.บางพลีใหญ่ อ.บางพลี จ.สมุทรปราการ",
    sourceSystem: "team_b_registry",
  },
  {
    studentId: "30152",
    fullName: "ด.ช. กิตติ ขยันดี",
    citizenId: "1-1037-00526-19-5",
    roomName: "ม.3/1",
    classNo: 30,
    guardianName: "นางสมศรี ขยันดี",
    guardianRelation: "มารดา",
    guardianPhone: "08x-xxx-6621",
    address: "23/4 ต.บางพลี อ.เมือง จ.สมุทรปราการ",
    sourceSystem: "team_b_registry",
  },
  {
    studentId: "30160",
    fullName: "ด.ญ. ชลิดา พากเพียร",
    citizenId: "1-1037-00538-72-6",
    roomName: "ม.3/1",
    classNo: 15,
    guardianName: "นางอรทัย พากเพียร",
    guardianRelation: "มารดา",
    guardianPhone: "08x-xxx-3312",
    address: "9 ต.บางโฉลง อ.บางพลี จ.สมุทรปราการ",
    sourceSystem: "team_b_registry",
  },
  {
    studentId: "30171",
    fullName: "ด.ช. ธนากร รักเรียน",
    citizenId: "1-1037-00549-06-7",
    roomName: "ม.3/1",
    classNo: 8,
    guardianName: "นายประเสริฐ รักเรียน",
    guardianRelation: "บิดา",
    guardianPhone: "08x-xxx-7788",
    address: "56 ต.ราชาเทวะ อ.บางพลี จ.สมุทรปราการ",
    sourceSystem: "team_b_registry",
  },
  {
    studentId: "30183",
    fullName: "ด.ญ. มณีรัตน์ ตั้งมั่น",
    citizenId: "1-1037-00553-48-8",
    roomName: "ม.3/1",
    classNo: 25,
    guardianName: "นางกาญจนา ตั้งมั่น",
    guardianRelation: "มารดา",
    guardianPhone: "08x-xxx-5504",
    address: "31 ต.บางพลี อ.เมือง จ.สมุทรปราการ",
    sourceSystem: "team_b_registry",
    hasPhoto: false,
  },
];

export const screenings: Screening[] = [
  {
    screeningId: "SC-001",
    studentId: "30125",
    termId: CURRENT_TERM.termId,
    screenedBy: CURRENT_TEACHER.name,
    screenedAt: "2570-02-12",
    results: [
      { dimension: "academic", group: "green", checkedItemIds: [] },
      { dimension: "physical", group: "green", checkedItemIds: [] },
      { dimension: "economic", group: "amber", checkedItemIds: ["ec1", "ec2"] },
      { dimension: "welfare", group: "green", checkedItemIds: [] },
      { dimension: "behavior", group: "green", checkedItemIds: [] },
      { dimension: "mental", group: "amber", checkedItemIds: ["mt1", "mt3"] },
    ],
  },
  {
    screeningId: "SC-002",
    studentId: "30118",
    termId: CURRENT_TERM.termId,
    screenedBy: CURRENT_TEACHER.name,
    screenedAt: "2570-02-12",
    results: [
      { dimension: "academic", group: "amber", checkedItemIds: ["ac3"] },
      { dimension: "physical", group: "green", checkedItemIds: [] },
      { dimension: "economic", group: "green", checkedItemIds: [] },
      { dimension: "welfare", group: "green", checkedItemIds: [] },
      { dimension: "behavior", group: "amber", checkedItemIds: ["bh1", "bh2"] },
      { dimension: "mental", group: "red", checkedItemIds: ["mt2", "mt4"] },
    ],
  },
  {
    screeningId: "SC-003",
    studentId: "30131",
    termId: CURRENT_TERM.termId,
    screenedBy: CURRENT_TEACHER.name,
    screenedAt: "2570-02-11",
    results: [
      { dimension: "academic", group: "red", checkedItemIds: ["ac1", "ac4"] },
      { dimension: "physical", group: "green", checkedItemIds: [] },
      { dimension: "economic", group: "amber", checkedItemIds: ["ec1"] },
      { dimension: "welfare", group: "green", checkedItemIds: [] },
      { dimension: "behavior", group: "amber", checkedItemIds: ["bh1"] },
      { dimension: "mental", group: "green", checkedItemIds: [] },
    ],
  },
  {
    screeningId: "SC-004",
    studentId: "30140",
    termId: CURRENT_TERM.termId,
    screenedBy: CURRENT_TEACHER.name,
    screenedAt: "2570-02-11",
    results: [
      { dimension: "academic", group: "green", checkedItemIds: [] },
      { dimension: "physical", group: "green", checkedItemIds: [] },
      { dimension: "economic", group: "green", checkedItemIds: [] },
      { dimension: "welfare", group: "amber", checkedItemIds: ["wf2"] },
      { dimension: "behavior", group: "green", checkedItemIds: [] },
      { dimension: "mental", group: "green", checkedItemIds: [] },
    ],
  },
  {
    screeningId: "SC-005",
    studentId: "30152",
    termId: CURRENT_TERM.termId,
    screenedBy: CURRENT_TEACHER.name,
    screenedAt: "2570-02-10",
    results: [
      { dimension: "academic", group: "green", checkedItemIds: [] },
      { dimension: "physical", group: "green", checkedItemIds: [] },
      { dimension: "economic", group: "green", checkedItemIds: [] },
      { dimension: "welfare", group: "green", checkedItemIds: [] },
      { dimension: "behavior", group: "green", checkedItemIds: [] },
      { dimension: "mental", group: "amber", checkedItemIds: ["mt3"] },
    ],
  },
  {
    screeningId: "SC-006",
    studentId: "30160",
    termId: CURRENT_TERM.termId,
    screenedBy: CURRENT_TEACHER.name,
    screenedAt: "2570-02-10",
    results: [
      { dimension: "academic", group: "green", checkedItemIds: [] },
      { dimension: "physical", group: "green", checkedItemIds: [] },
      { dimension: "economic", group: "green", checkedItemIds: [] },
      { dimension: "welfare", group: "green", checkedItemIds: [] },
      { dimension: "behavior", group: "green", checkedItemIds: [] },
      { dimension: "mental", group: "green", checkedItemIds: [] },
    ],
  },
];

export const sdqAssessments: SdqAssessment[] = [
  {
    id: "SDQ-001",
    studentId: "30125",
    termId: CURRENT_TERM.termId,
    round: 1,
    rater: "teacher",
    raterName: CURRENT_TEACHER.name,
    answers: {},
    totalDifficulties: 16,
    scaleScores: { emotional: 6, conduct: 3, hyperactivity: 4, peer: 3, prosocial: 7 },
    level: "risk",
    status: "completed",
    assessedAt: "2570-02-13",
  },
  {
    id: "SDQ-002",
    studentId: "30125",
    termId: CURRENT_TERM.termId,
    round: 1,
    rater: "student",
    raterName: "ด.ญ. แพรวา สายใจ",
    answers: {},
    totalDifficulties: 13,
    scaleScores: { emotional: 5, conduct: 2, hyperactivity: 4, peer: 2, prosocial: 8 },
    level: "normal",
    status: "completed",
    assessedAt: "2570-02-14",
  },
  {
    id: "SDQ-003",
    studentId: "30125",
    termId: CURRENT_TERM.termId,
    round: 1,
    rater: "parent",
    raterName: "นางสาวรัตนา สายใจ",
    answers: {},
    totalDifficulties: null,
    scaleScores: null,
    level: null,
    status: "pending",
    assessedAt: null,
  },
  {
    id: "SDQ-004",
    studentId: "30118",
    termId: CURRENT_TERM.termId,
    round: 1,
    rater: "teacher",
    raterName: CURRENT_TEACHER.name,
    answers: {},
    totalDifficulties: 21,
    scaleScores: { emotional: 5, conduct: 6, hyperactivity: 7, peer: 3, prosocial: 5 },
    level: "problem",
    status: "completed",
    assessedAt: "2570-02-13",
  },
  // ด.ช. ภูมิ: ตอบครบ 3 ฉบับแล้ว รอครูที่ปรึกษาตรวจผล (UC10 สถานการณ์ B)
  {
    id: "SDQ-005",
    studentId: "30118",
    termId: CURRENT_TERM.termId,
    round: 1,
    rater: "student",
    raterName: "ด.ช. ภูมิ ตั้งใจเรียน",
    answers: {},
    totalDifficulties: 18,
    scaleScores: { emotional: 4, conduct: 5, hyperactivity: 6, peer: 3, prosocial: 6 },
    level: "risk",
    status: "completed",
    assessedAt: "2570-02-14",
  },
  {
    id: "SDQ-006",
    studentId: "30118",
    termId: CURRENT_TERM.termId,
    round: 1,
    rater: "parent",
    raterName: "ผู้ปกครองของ ด.ช. ภูมิ",
    answers: {},
    totalDifficulties: 17,
    scaleScores: { emotional: 4, conduct: 4, hyperactivity: 6, peer: 3, prosocial: 6 },
    level: "risk",
    status: "completed",
    assessedAt: "2570-02-15",
  },
];

/**
 * EQ ภาคเรียนนี้: นักเรียนมัธยมประเมินตนเองทุกคน (UC10 Pre-condition 2)
 * ด.ญ. แพรวา (นักเรียนในพอร์ทัล) ยังไม่ได้ทำ ใช้ทดลองทำ EQ หรือเลือกไม่ทำ
 */
const eqAnswers = (values: number[]) =>
  Object.fromEntries(values.map((v, i) => [i + 1, v])) as Record<number, EqAnswer>;
const eqDone = (studentId: string, values: number[], at: string): EqAssessment => ({
  id: `EQ-${studentId}`,
  studentId,
  termId: CURRENT_TERM.termId,
  status: "completed",
  answers: eqAnswers(values),
  ...scoreEq(eqAnswers(values)),
  assessedAt: at,
});
export const eqAssessments: EqAssessment[] = students.map((st) =>
  st.studentId === "30131"
    ? eqDone("30131", [3, 4, 3, 3, 2, 2, 3, 3, 2, 3, 1, 2], "2570-02-14")
    : st.studentId === "30140"
      ? eqDone("30140", [4, 3, 4, 4, 3, 4, 3, 4, 4, 3, 3, 4], "2570-02-12")
      : st.studentId === "30171"
        ? { id: "EQ-30171", studentId: "30171", termId: CURRENT_TERM.termId, status: "declined", answers: {}, scores: null, levels: null, assessedAt: "2570-02-13" }
        : { id: `EQ-${st.studentId}`, studentId: st.studentId, termId: CURRENT_TERM.termId, status: "pending", answers: {}, scores: null, levels: null, assessedAt: null }
);

/**
 * กฎตัวอย่าง คะแนนอิงระดับการดำเนินการในภาคผนวก ข (ว่ากล่าวตักเตือน 5, ทำทัณฑ์บน 10–15, ทำกิจกรรม 20)
 * กฎส่งต่อไม่มีคะแนน (UC7 Scenario B ข้อ 7) และบางกฎบันทึกได้เฉพาะหัวหน้างานปกครอง (ข้อ 9)
 */
export const behaviorRules: BehaviorRule[] = [
  { ruleId: "BR-01", name: "มาสาย", severity: "minor", scoreDelta: -5, isActive: true, recordableBy: ["teacher"] },
  { ruleId: "BR-02", name: "แต่งกายไม่ถูกระเบียบ", severity: "minor", scoreDelta: -5, isActive: true, recordableBy: ["teacher"] },
  { ruleId: "BR-03", name: "ไม่ส่งงาน / การบ้าน", severity: "minor", scoreDelta: -5, isActive: true, recordableBy: ["teacher"] },
  { ruleId: "BR-04", name: "ใช้โทรศัพท์ในเวลาเรียน", severity: "moderate", scoreDelta: -10, isActive: true, recordableBy: ["teacher"] },
  { ruleId: "BR-05", name: "ทะเลาะวิวาท", severity: "moderate", scoreDelta: -15, isActive: true, recordableBy: ["teacher"] },
  { ruleId: "BR-06", name: "ช่วยเหลือกิจกรรมโรงเรียน", severity: "positive", scoreDelta: 10, isActive: true, recordableBy: ["teacher"] },
  { ruleId: "BR-07", name: "ช่วยเหลือครูหรือเพื่อน", severity: "positive", scoreDelta: 5, isActive: true, recordableBy: ["teacher"] },
  { ruleId: "BR-08", name: "ไม่ร่วมกิจกรรมที่โรงเรียนกำหนด", severity: "severe", scoreDelta: -20, isActive: true, recordableBy: ["discipline_head", "executive"] },
  { ruleId: "BR-09", name: "พกพาอาวุธหรือสิ่งที่ใช้เป็นอาวุธ", severity: "refer", scoreDelta: 0, isActive: true, recordableBy: ["teacher"] },
  { ruleId: "BR-10", name: "ทะเลาะวิวาทโดยใช้อาวุธ", severity: "refer", scoreDelta: 0, isActive: true, recordableBy: ["discipline_head", "executive"] },
];

/** วันสิ้นปีการศึกษา ใช้เป็นวันหมดอายุตั้งต้นของบัตร (UC14 ข้อ 3) */
export const ACADEMIC_YEAR_END = "2570-03-31";

/**
 * บัตรตัวอย่าง: ทุกคนมีบัตรที่ใช้งานอยู่ ยกเว้นคนที่ยังไม่มีรูป
 * ด.ญ. แพรวา เคยทำบัตรหายแล้วออกบัตรทดแทน บัตรเดิม (30125-1) จึงถูกยกเลิก ใช้สาธิตการสแกนบัตรที่ยกเลิกแล้ว
 */
export const studentCards: StudentCard[] = [
  { cardId: "CARD-0", code: "30125-1", studentId: "30125", type: "new", issuedAt: "2569-05-20", expiresAt: ACADEMIC_YEAR_END, status: "cancelled", physical: "handed" },
  { cardId: "CARD-1", code: "30125-2", studentId: "30125", type: "replacement", reason: "บัตรหาย", issuedAt: "2569-11-10", expiresAt: ACADEMIC_YEAR_END, status: "active", physical: "handed" },
  ...["30118", "30131", "30140", "30152", "30160", "30171"].map(
    (id, i): StudentCard => ({ cardId: `CARD-${i + 2}`, code: `${id}-1`, studentId: id, type: "new", issuedAt: "2569-05-20", expiresAt: ACADEMIC_YEAR_END, status: "active", physical: "handed" })
  ),
];

export const behaviorRecords: BehaviorRecord[] = [
  {
    recordId: "BH-001",
    studentId: "30118",
    ruleId: "BR-01",
    description: "มาถึงโรงเรียน 07:52 น. หลังเวลาเข้าแถว",
    occurredAt: "2570-02-16T07:52:00",
    recordedByName: CURRENT_TEACHER.name,
    source: "card_scan",
  },
  {
    recordId: "BH-002",
    studentId: "30125",
    ruleId: "BR-01",
    description: "มาถึงโรงเรียน 07:55 น. หลังเวลาเข้าแถว",
    occurredAt: "2570-02-16T07:55:00",
    recordedByName: CURRENT_TEACHER.name,
    source: "card_scan",
  },
  {
    recordId: "BH-003",
    studentId: "30131",
    ruleId: "BR-03",
    description: "ไม่ส่งการบ้านวิชาคณิตศาสตร์ ครั้งที่ 3 ในเดือนนี้",
    occurredAt: "2570-02-15T13:20:00",
    recordedByName: "ครูวิชัย มานะ (ครูประจำวิชา)",
    source: "manual",
  },
  {
    recordId: "BH-004",
    studentId: "30140",
    ruleId: "BR-06",
    description: "ช่วยจัดสถานที่กิจกรรมวันวิชาการ",
    occurredAt: "2570-02-15T10:05:00",
    recordedByName: CURRENT_TEACHER.name,
    source: "manual",
  },
  {
    recordId: "BH-005",
    studentId: "30118",
    ruleId: "BR-02",
    description: "ไม่สวมเสื้อนักเรียนตามระเบียบ",
    occurredAt: "2570-02-14T08:10:00",
    recordedByName: "ครูเวรประจำวัน",
    source: "manual",
  },
  {
    recordId: "BH-006",
    studentId: "30152",
    ruleId: "BR-07",
    description: "ช่วยครูจัดห้องเรียนหลังเลิกเรียน",
    occurredAt: "2570-02-13T15:40:00",
    recordedByName: CURRENT_TEACHER.name,
    source: "manual",
  },
];

export const appointments: HomeVisitAppointment[] = [
  {
    appointmentId: "HV-001",
    studentId: "30125",
    teacherName: CURRENT_TEACHER.name,
    proposedDate: "2570-02-18T15:30:00",
    status: "confirmed",
    guardianPhone: "08x-xxx-4471",
    caretakerRelation: "ยาย",
    caretakerName: "นางบุญมา สายใจ",
    guardianNote: "อยากขอคำแนะนำเรื่องทุนการศึกษา และการดูแลเรื่องการใช้โทรศัพท์ของลูก",
  },
  {
    appointmentId: "HV-002",
    studentId: "30131",
    teacherName: CURRENT_TEACHER.name,
    proposedDate: "2570-02-20T16:00:00",
    status: "pending",
  },
  {
    appointmentId: "HV-003",
    studentId: "30118",
    teacherName: CURRENT_TEACHER.name,
    proposedDate: "2570-02-08T15:00:00",
    status: "awaiting_visit_confirmation",
    confirmedBy: "นายสมชาย ตั้งใจเรียน",
    visitConfirmDeadline: "2570-02-11",
  },
  {
    // การเยี่ยมบ้านรอบติดตามผล — ใช้สาธิตการดึงข้อมูลจากการเยี่ยมบ้านครั้งก่อนมากรอกอัตโนมัติ
    appointmentId: "HV-004",
    studentId: "30118",
    teacherName: CURRENT_TEACHER.name,
    proposedDate: "2570-02-21T15:30:00",
    status: "confirmed",
    guardianPhone: "08x-xxx-1182",
  },
];

export const homeVisitRecords: HomeVisitRecord[] = [
  {
    recordId: "HVR-001",
    appointmentId: "HV-003",
    studentId: "30118",
    householdMembers: [
      { memberId: "M1", relation: "บิดา", age: 47, occupation: "รับจ้างทั่วไป", monthlyIncome: 9000 },
      { memberId: "M2", relation: "มารดา", age: 44, occupation: "แม่บ้าน", monthlyIncome: 0 },
      { memberId: "M3", relation: "นักเรียน", age: 15, occupation: "-", monthlyIncome: 0 },
    ],
    riskFindings: ["ผู้ปกครองทำงานต่างจังหวัดเป็นช่วง ๆ", "นักเรียนใช้เวลากับเกมมากกว่า 4 ชั่วโมงต่อวัน"],
    informantName: "นายสมชาย ตั้งใจเรียน",
    informantRelation: "บิดา",
    photoLabels: ["ภาพภายนอกบ้าน", "ภาพภายในบ้าน"],
    signedBy: CURRENT_TEACHER.name,
    signedAt: "2570-02-08",
  },
];

export const careCases: CareCase[] = [
  {
    caseId: "CASE-2570-014",
    studentId: "30125",
    triggerSource: "ผลคัดกรอง 6 มิติ (เศรษฐกิจ / สุขภาพจิต)",
    status: "active",
    openedAt: "2570-02-01",
    closedAt: null,
    supportType: "prevent",
    careMethods: ["behavior_adjust", "life_skills", "counseling"],
    goal:
      "ลดความกังวลด้านการเรียนและเศรษฐกิจ โดยประสานทุนการศึกษาจากโรงเรียน และให้คำปรึกษาต่อเนื่องสัปดาห์ละ 1 ครั้ง จนถึงสิ้นภาคเรียน",
    targetDate: "2570-03-31",
    urgency: "medium",
    nextFollowupDate: "2570-02-25",
    followups: [
      {
        followupId: "FU-003",
        actionTaken: "เยี่ยมบ้านนักเรียน",
        result:
          "พบว่ารายได้ครัวเรือนต่ำกว่าเกณฑ์ และนักเรียนใช้เวลากับเกมมาก ผู้ปกครองขอความช่วยเหลือด้านทุนการศึกษา",
        followupDate: "2570-02-18",
        recordedByName: CURRENT_TEACHER.name,
        nextFollowupDate: "2570-02-25",
      },
      {
        followupId: "FU-002",
        actionTaken: "ให้คำปรึกษารายบุคคล ครั้งที่ 2",
        result: "นักเรียนเริ่มเปิดใจมากขึ้น พูดคุยเรื่องความกังวลเรื่องการเรียนและค่าใช้จ่ายที่บ้าน",
        followupDate: "2570-02-12",
        recordedByName: CURRENT_TEACHER.name,
      },
      {
        followupId: "FU-001",
        actionTaken: "ให้คำปรึกษารายบุคคล ครั้งที่ 1",
        result: "ประเมินสภาพปัญหาเบื้องต้น นักเรียนมีความกังวลเรื่องฐานะทางบ้าน",
        followupDate: "2570-02-05",
        recordedByName: CURRENT_TEACHER.name,
      },
    ],
  },
  {
    caseId: "CASE-2570-015",
    studentId: "30118",
    triggerSource: "ผลแบบคัดกรอง Red Flag",
    status: "active",
    openedAt: "2570-02-13",
    closedAt: null,
    supportType: "refer_internal",
    careMethods: ["counseling", "guidance_teacher"],
    goal: "ส่งต่อครูแนะแนวเพื่อประเมินเชิงลึกด้านสุขภาพจิต และติดตามพฤติกรรมการมาสาย",
    targetDate: "2570-03-15",
    urgency: "high",
    nextFollowupDate: "2570-02-21",
    followups: [
      {
        followupId: "FU-010",
        actionTaken: "ส่งต่อครูแนะแนว",
        result: "ครูแนะแนวรับเรื่องแล้ว นัดพบนักเรียนสัปดาห์หน้า",
        followupDate: "2570-02-14",
        recordedByName: CURRENT_TEACHER.name,
        nextFollowupDate: "2570-02-21",
      },
    ],
  },
];

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
  { subject: "ภาษาไทย", teacherName: "ครูวิมล อักษรดี", submitted: true },
  { subject: "คณิตศาสตร์", teacherName: "ครูวิชัย มานะ", submitted: true },
  { subject: "วิทยาศาสตร์", teacherName: "ครูนภา วิจัย", submitted: true },
  { subject: "สังคมศึกษา", teacherName: "ครูประยงค์ รอบรู้", submitted: true },
  { subject: "ภาษาอังกฤษ", teacherName: "ครูแอนนา สมิธ", submitted: true },
  { subject: "สุขศึกษาและพลศึกษา", teacherName: "ครูสมชาย แข็งแรง", submitted: true },
  { subject: "ศิลปะ", teacherName: "ครูมาลี วาดเขียน", submitted: false },
  { subject: "การงานอาชีพ", teacherName: "ครูอรุณ ประดิษฐ์", submitted: false },
];

export const educationDocuments: EducationDocument[] = [
  { docId: "DOC-001", docType: "ปพ.6", target: "ด.ญ. ชลิดา พากเพียร", generatedByName: CURRENT_TEACHER.name, generatedAt: "2570-02-16" },
  { docId: "DOC-002", docType: "ปพ.4", target: "ด.ญ. ปาริชาติ ใฝ่ดี", generatedByName: CURRENT_TEACHER.name, generatedAt: "2570-02-14" },
  { docId: "DOC-003", docType: "ปพ.7", target: "ด.ช. ธนากร รักเรียน", generatedByName: "แอดมินโรงเรียน", generatedAt: "2570-02-10" },
  { docId: "DOC-004", docType: "ปพ.5", target: "รายวิชาคณิตศาสตร์", generatedByName: "แอดมินโรงเรียน", generatedAt: "2570-02-02" },
];


/**
 * ข้อมูลแบบบันทึกการเยี่ยมบ้านครั้งก่อนของนักเรียนแต่ละคน
 * ใช้สาธิตการดึงข้อมูลเดิมมากรอกอัตโนมัติ เพื่อลดการกรอกซ้ำของครู
 */
export interface PreviousVisitForm {
  visitedAt: string;
  householdMembers: {
    id: string;
    relation: string;
    age: number;
    disability: boolean;
    income: { wage: number; agriculture: number; business: number; welfare: number; other: number };
  }[];
  dependencies: string[];
  housingType: string;
  housingConditions: string[];
  vehicles: string[];
  farmland: string;
  hoursTogether: string;
  caretakerWhenAway: string;
  travelKm: string;
  travelHours: string;
  travelMinutes: string;
  travelMode: string;
  duties: string[];
  internet: string;
}

export const previousVisitForms: Record<string, PreviousVisitForm> = {
  "30118": {
    visitedAt: "2570-02-08",
    householdMembers: [
      {
        id: "pm1",
        relation: "บิดา",
        age: 47,
        disability: false,
        income: { wage: 9000, agriculture: 0, business: 0, welfare: 0, other: 0 },
      },
      {
        id: "pm2",
        relation: "มารดา",
        age: 44,
        disability: false,
        income: { wage: 0, agriculture: 0, business: 2500, welfare: 0, other: 0 },
      },
      {
        id: "pm3",
        relation: "นักเรียน",
        age: 15,
        disability: false,
        income: { wage: 0, agriculture: 0, business: 0, welfare: 0, other: 0 },
      },
      {
        id: "pm4",
        relation: "ยาย",
        age: 71,
        disability: false,
        income: { wage: 0, agriculture: 0, business: 0, welfare: 600, other: 0 },
      },
    ],
    dependencies: ["dep_elderly"],
    housingType: "own",
    housingConditions: [],
    vehicles: ["motorcycle"],
    farmland: "no_land",
    hoursTogether: "4",
    caretakerWhenAway: "relative",
    travelKm: "3.5",
    travelHours: "0",
    travelMinutes: "25",
    travelMode: "motorcycle",
    duties: ["housework", "care_sick"],
    internet: "can_access",
  },
};

/** จำนวนนักเรียนทั้งห้องตามทะเบียน (ใช้แสดงในสถิติภาพรวม) */
export const CLASS_SIZE = 38;
