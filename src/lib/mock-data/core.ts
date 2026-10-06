/**
 * ข้อมูลอ้างอิงตัวอย่าง: ภาคเรียน บุคลากร ผู้ใช้ ห้องเรียน นักเรียน ผู้ปกครอง
 * จำลองการอ่านจากตารางของ Team A / Team B (ADR-0001) — ระบบนี้อ่านอย่างเดียว
 */

import { generateRoster } from "./generated-roster";
import type {
  AcademicTerm,
  Classroom,
  ClassroomHomeroom,
  Staff,
  Student,
  StudentEnrollment,
  StudentGuardian,
  User,
} from "../types";

/**
 * วันที่อ้างอิงของต้นแบบ (ปี พ.ศ.)
 * ตรึงไว้ให้อยู่ในภาคเรียนเดียวกับข้อมูลตัวอย่าง เพื่อให้รายการที่บันทึกใหม่
 * เรียงต่อจากข้อมูลเดิมอย่างถูกต้องขณะสาธิตระบบ
 */
export const DEMO_TODAY = "2570-02-16";

export const SCHOOL_NAME = "โรงเรียนตัวอย่างวิทยา";

export const academicTerms: AcademicTerm[] = [
  {
    termId: "T2568-2",
    academicYear: 2568,
    semester: 2,
    startDate: "2568-11-01",
    endDate: "2569-03-31",
    label: "ภาคเรียนที่ 2 ปีการศึกษา 2568",
  },
  {
    termId: "T2569-1",
    academicYear: 2569,
    semester: 1,
    startDate: "2569-05-16",
    endDate: "2569-10-10",
    label: "ภาคเรียนที่ 1 ปีการศึกษา 2569",
  },
  {
    termId: "T2569-2",
    academicYear: 2569,
    semester: 2,
    startDate: "2569-11-01",
    endDate: "2570-03-31",
    label: "ภาคเรียนที่ 2 ปีการศึกษา 2569",
  },
];

export const CURRENT_TERM = academicTerms[2];
export const PREVIOUS_TERM = academicTerms[1];

/** ผู้บันทึกเมื่อระบบสร้างรายการให้เอง (เช่น มาสายจากการสแกน QR) */
export const SYSTEM_USER_ID = "system";

/** userId ของผู้ใช้ตัวอย่างที่อ้างถึงบ่อย */
export const USER = {
  /** ครูประจำชั้น ม.3/1 คนที่ 1 */
  somying: "U-T01",
  /** ครูประจำชั้น ม.3/1 คนที่ 2 (ไม่มีอีเมล) */
  theerapong: "U-T02",
  /** ครูประจำชั้น ม.3/2 ปี 2569 — เคยเป็นครูประจำชั้น ม.2/1 ปี 2568 */
  prapa: "U-T03",
  /** ครูทั่วไป (คณิตศาสตร์) — เคยเป็นครูประจำชั้น ม.2/1 ปี 2568 */
  wichai: "U-T04",
  wimon: "U-T05",
  napa: "U-T06",
  prayong: "U-T07",
  anna: "U-T08",
  somchaiK: "U-T09",
  malee: "U-T10",
  arun: "U-T11",
  janpen: "U-T12",
  admin: "U-A01",
  director: "U-A02",
  /** ผู้ปกครองของ 30125 (มารดา) */
  ratana: "U-G01",
  /** ผู้ปกครองของ 30125 (บิดา) */
  ekachai: "U-G02",
  /** ผู้ปกครองของ 30131 และ 30183 */
  pimjai: "U-G04",
} as const;

/** ผู้ใช้เริ่มต้นเมื่อเปิดต้นแบบ */
export const DEFAULT_USER_ID = USER.somying;

export const staff: Staff[] = [
  { staffId: "S-01", fullName: "ครูสมหญิง ใจดี", position: "ครู" },
  { staffId: "S-02", fullName: "ครูธีรพงษ์ ศรีสุข", position: "ครู" },
  { staffId: "S-03", fullName: "ครูประภา วงศ์ดี", position: "ครู" },
  { staffId: "S-04", fullName: "ครูวิชัย มานะ", position: "ครู" },
  { staffId: "S-05", fullName: "ครูวิมล อักษรดี", position: "ครู" },
  { staffId: "S-06", fullName: "ครูนภา วิจัย", position: "ครู" },
  { staffId: "S-07", fullName: "ครูประยงค์ รอบรู้", position: "ครู" },
  { staffId: "S-08", fullName: "ครูแอนนา สมิธ", position: "ครู" },
  { staffId: "S-09", fullName: "ครูสมชาย แข็งแรง", position: "ครู" },
  { staffId: "S-10", fullName: "ครูมาลี วาดเขียน", position: "ครู" },
  { staffId: "S-11", fullName: "ครูอรุณ ประดิษฐ์", position: "ครู" },
  { staffId: "S-12", fullName: "ครูจันทร์เพ็ญ แสงทอง", position: "ครู" },
  { staffId: "S-A1", fullName: "นางสาวกนกพร ธุรการ", position: "แอดมิน" },
  { staffId: "S-A2", fullName: "นายประวิทย์ บริหารดี", position: "ผู้บริหาร" },
];

export const classrooms: Classroom[] = [
  { roomId: "R-301", gradeLevel: "ม.3", roomName: "ม.3/1" },
  { roomId: "R-302", gradeLevel: "ม.3", roomName: "ม.3/2" },
  { roomId: "R-201", gradeLevel: "ม.2", roomName: "ม.2/1" },
];

/** ครูประจำชั้นห้องละ 2 คนต่อปีการศึกษา (รวมปีก่อนหน้า เพื่อสาธิตกฎหลังเลื่อนชั้น) */
export const classroomHomerooms: ClassroomHomeroom[] = [
  { roomId: "R-301", staffId: "S-01", academicYear: 2569 },
  { roomId: "R-301", staffId: "S-02", academicYear: 2569 },
  { roomId: "R-302", staffId: "S-03", academicYear: 2569 },
  { roomId: "R-302", staffId: "S-12", academicYear: 2569 },
  { roomId: "R-201", staffId: "S-03", academicYear: 2568 },
  { roomId: "R-201", staffId: "S-04", academicYear: 2568 },
];

const staffUser = (
  userId: string,
  staffId: string,
  username: string,
  role: User["role"],
  title: string,
  email: string | null
): User => ({
  userId,
  username,
  role,
  refId: staffId,
  name: staff.find((s) => s.staffId === staffId)?.fullName ?? staffId,
  title,
  email,
  isActive: true,
});

/** นักเรียนตัวอย่าง 8 คนที่เขียนมือ — ใช้เป็นกรณีสาธิตที่มีชื่อ (30125, 30118, 30131, 30140, 30152, 30160, 30171, 30183) */
const baseStudents: Student[] = [
  {
    studentId: "30125",
    fullName: "ด.ญ. แพรวา สายใจ",
    citizenId: "1-1037-xxxxx-xx-1",
    roomId: "R-301",
    roomName: "ม.3/1",
    gradeLevel: "ม.3",
    classNo: 12,
    status: "studying",
    address: "45/2 ต.บางพลี อ.เมือง จ.สมุทรปราการ",
    sourceSystem: "team_b_registry",
  },
  {
    studentId: "30118",
    fullName: "ด.ช. ภูมิ ตั้งใจเรียน",
    citizenId: "1-1037-xxxxx-xx-2",
    roomId: "R-301",
    roomName: "ม.3/1",
    gradeLevel: "ม.3",
    classNo: 5,
    status: "studying",
    address: "112 ต.บางพลี อ.เมือง จ.สมุทรปราการ",
    sourceSystem: "team_b_registry",
  },
  {
    studentId: "30131",
    fullName: "ด.ช. อนันต์ มุ่งมั่น",
    citizenId: "1-1037-xxxxx-xx-3",
    roomId: "R-301",
    roomName: "ม.3/1",
    gradeLevel: "ม.3",
    classNo: 18,
    status: "studying",
    address: "8/15 ต.บางแก้ว อ.บางพลี จ.สมุทรปราการ",
    sourceSystem: "team_b_registry",
  },
  {
    studentId: "30140",
    fullName: "ด.ญ. ปาริชาติ ใฝ่ดี",
    citizenId: "1-1037-xxxxx-xx-4",
    roomId: "R-301",
    roomName: "ม.3/1",
    gradeLevel: "ม.3",
    classNo: 22,
    status: "studying",
    address: "77 ต.บางพลีใหญ่ อ.บางพลี จ.สมุทรปราการ",
    sourceSystem: "team_b_registry",
  },
  {
    studentId: "30152",
    fullName: "ด.ช. กิตติ ขยันดี",
    citizenId: "1-1037-xxxxx-xx-5",
    roomId: "R-301",
    roomName: "ม.3/1",
    gradeLevel: "ม.3",
    classNo: 30,
    status: "studying",
    address: "23/4 ต.บางพลี อ.เมือง จ.สมุทรปราการ",
    sourceSystem: "team_b_registry",
  },
  {
    studentId: "30160",
    fullName: "ด.ญ. ชลิดา พากเพียร",
    citizenId: "1-1037-xxxxx-xx-6",
    roomId: "R-301",
    roomName: "ม.3/1",
    gradeLevel: "ม.3",
    classNo: 15,
    status: "studying",
    address: "9 ต.บางโฉลง อ.บางพลี จ.สมุทรปราการ",
    sourceSystem: "team_b_registry",
  },
  {
    studentId: "30171",
    fullName: "ด.ช. ธนากร รักเรียน",
    citizenId: "1-1037-xxxxx-xx-7",
    roomId: "R-301",
    roomName: "ม.3/1",
    gradeLevel: "ม.3",
    classNo: 8,
    status: "studying",
    address: "56 ต.ราชาเทวะ อ.บางพลี จ.สมุทรปราการ",
    sourceSystem: "team_b_registry",
  },
  {
    // พี่น้องกับ 30131 — ผู้ปกครองคนเดียวกันเชื่อมกับนักเรียน 2 คน
    studentId: "30183",
    fullName: "ด.ญ. มณีรัตน์ มุ่งมั่น",
    citizenId: "1-1037-xxxxx-xx-8",
    roomId: "R-301",
    roomName: "ม.3/1",
    gradeLevel: "ม.3",
    classNo: 25,
    status: "studying",
    address: "8/15 ต.บางแก้ว อ.บางพลี จ.สมุทรปราการ",
    sourceSystem: "team_b_registry",
  },
];

/**
 * นักเรียนที่สร้างเพิ่มให้ ม.3/1 ครบ 38 คน (กำหนดผลได้ — ดู generated-roster.ts)
 * เอาต์พุตเหมือนเดิมทุกครั้งที่โหลด
 */
export const generatedRoster = generateRoster(baseStudents);

/** นักเรียนทั้งห้อง: 8 คนตัวอย่างหลักก่อน แล้วตามด้วยส่วนที่สร้างเพิ่ม */
export const students: Student[] = [...baseStudents, ...generatedRoster.students];

/** ห้องเรียนรายปี: ปี 2568 อยู่ ม.2/1 แล้วเลื่อนชั้นเป็น ม.3/1 ในปี 2569 */
export const studentEnrollments: StudentEnrollment[] = [
  ...baseStudents.flatMap((s) => [
    { studentId: s.studentId, roomId: "R-201", academicYear: 2568 },
    { studentId: s.studentId, roomId: s.roomId, academicYear: 2569 },
  ]),
  ...generatedRoster.enrollments,
];

const guardianUser = (
  userId: string,
  username: string,
  name: string,
  phone: string,
  email: string | null
): User => ({ userId, username, role: "parent", refId: null, name, title: "ผู้ปกครอง", email, phone, isActive: true });

export const users: User[] = [
  staffUser(USER.somying, "S-01", "somying.j", "teacher_homeroom", "ครูประจำชั้น ม.3/1", "somying.j@school.example"),
  staffUser(USER.theerapong, "S-02", "theerapong.s", "teacher_homeroom", "ครูประจำชั้น ม.3/1", null),
  staffUser(USER.prapa, "S-03", "prapa.w", "teacher_homeroom", "ครูประจำชั้น ม.3/2", "prapa.w@school.example"),
  staffUser(USER.wichai, "S-04", "wichai.m", "teacher_general", "ครูประจำวิชาคณิตศาสตร์", "wichai.m@school.example"),
  staffUser(USER.wimon, "S-05", "wimon.a", "teacher_general", "ครูประจำวิชาภาษาไทย", null),
  staffUser(USER.napa, "S-06", "napa.w", "teacher_general", "ครูประจำวิชาวิทยาศาสตร์", null),
  staffUser(USER.prayong, "S-07", "prayong.r", "teacher_general", "ครูประจำวิชาสังคมศึกษา", null),
  staffUser(USER.anna, "S-08", "anna.s", "teacher_general", "ครูประจำวิชาภาษาอังกฤษ", null),
  staffUser(USER.somchaiK, "S-09", "somchai.k", "teacher_general", "ครูประจำวิชาสุขศึกษาและพลศึกษา", null),
  staffUser(USER.malee, "S-10", "malee.w", "teacher_general", "ครูประจำวิชาศิลปะ", null),
  staffUser(USER.arun, "S-11", "arun.p", "teacher_general", "ครูประจำวิชาการงานอาชีพ", null),
  staffUser(USER.janpen, "S-12", "janpen.s", "teacher_homeroom", "ครูประจำชั้น ม.3/2", null),
  staffUser(USER.admin, "S-A1", "admin", "admin_school", "แอดมินโรงเรียน", "admin@school.example"),
  staffUser(USER.director, "S-A2", "director", "admin_school", "ผู้อำนวยการ", "director@school.example"),
  ...baseStudents.map<User>((s) => ({
    userId: `U-S${s.studentId}`,
    username: s.studentId,
    role: "student",
    refId: s.studentId,
    name: s.fullName,
    title: `นักเรียน ${s.roomName}`,
    email: null,
    isActive: true,
  })),
  guardianUser(USER.ratana, "ratana.s", "นางสาวรัตนา สายใจ", "08x-xxx-4471", "ratana.s@mail.example"),
  guardianUser(USER.ekachai, "ekachai.s", "นายเอกชัย สายใจ", "08x-xxx-4472", null),
  guardianUser("U-G03", "somchai.t", "นายสมชาย ตั้งใจเรียน", "08x-xxx-1182", null),
  guardianUser(USER.pimjai, "pimjai.m", "นางพิมพ์ใจ มุ่งมั่น", "08x-xxx-9930", "pimjai.m@mail.example"),
  guardianUser("U-G05", "wirat.f", "นายวิรัตน์ ใฝ่ดี", "08x-xxx-2245", null),
  guardianUser("U-G06", "somsri.k", "นางสมศรี ขยันดี", "08x-xxx-6621", null),
  guardianUser("U-G07", "orathai.p", "นางอรทัย พากเพียร", "08x-xxx-3312", null),
  guardianUser("U-G08", "prasert.r", "นายประเสริฐ รักเรียน", "08x-xxx-7788", null),
  ...generatedRoster.users,
];

/** userId ของบัญชีนักเรียน */
export const studentUserId = (studentId: string) => `U-S${studentId}`;

export const studentGuardians: StudentGuardian[] = [
  { studentId: "30125", guardianUserId: USER.ratana, relation: "มารดา" },
  { studentId: "30125", guardianUserId: USER.ekachai, relation: "บิดา" },
  { studentId: "30118", guardianUserId: "U-G03", relation: "บิดา" },
  { studentId: "30131", guardianUserId: USER.pimjai, relation: "มารดา" },
  { studentId: "30183", guardianUserId: USER.pimjai, relation: "มารดา" },
  { studentId: "30140", guardianUserId: "U-G05", relation: "บิดา" },
  { studentId: "30152", guardianUserId: "U-G06", relation: "มารดา" },
  { studentId: "30160", guardianUserId: "U-G07", relation: "มารดา" },
  { studentId: "30171", guardianUserId: "U-G08", relation: "บิดา" },
  ...generatedRoster.guardians,
];

/** ผู้ใช้ที่แสดงในตัวเลือกบทบาท (หน้า login และท้าย sidebar) พร้อมคำอธิบายสิ่งที่ใช้สาธิต */
export const DEMO_USERS: { userId: string; note: string }[] = [
  { userId: USER.somying, note: "ครูประจำชั้น ม.3/1" },
  { userId: USER.theerapong, note: "ครูประจำชั้น ม.3/1 คนที่ 2 (ไม่มีอีเมล)" },
  { userId: USER.wichai, note: "ครูทั่วไป · เคยเป็นครูประจำชั้นของห้องนี้ปีก่อน" },
  { userId: USER.prapa, note: "ครูประจำชั้น ม.3/2 · เคยเป็นครูประจำชั้นของห้องนี้ปีก่อน" },
  { userId: USER.admin, note: "แอดมินโรงเรียน" },
  { userId: USER.director, note: "ผู้บริหาร (สิทธิ์เท่าแอดมิน)" },
  { userId: studentUserId("30125"), note: "นักเรียน ม.3/1" },
  { userId: USER.ratana, note: "ผู้ปกครองของ ด.ญ. แพรวา" },
  { userId: USER.pimjai, note: "ผู้ปกครองของนักเรียน 2 คน" },
];
