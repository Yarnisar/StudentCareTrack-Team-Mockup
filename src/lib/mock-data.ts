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
  NineSAssessment,
  RedFlagAssessment,
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
import type { NotificationLogEntry, StaffNotification } from "./staff-notifications";

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
  name: "ครูมาลีฮัน จันทะสะรวย",
  role: "ครูประจำชั้น ม.3/1",
  roomName: "ม.3/1",
};

export const SCHOOL_NAME = "โรงเรียนตัวอย่างวิทยา";

const baseStudents: Student[] = [
  {
    studentId: "30125",
    fullName: "ด.ญ. พิชสินีย์ เพรี่ยงพร้อม",
    citizenId: "1-1037-00481-27-1",
    roomName: "ม.3/1",
    classNo: 12,
    guardianName: "นางสาวภัคคินีย์ เพรี่ยงพร้อม",
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

/**
 * นักเรียน ม.3/1 ที่เพิ่มให้ครบ 35 คนตาม Persona ครูประจำชั้น (สร้างแบบกำหนดผลล่วงหน้า ไม่สุ่มใหม่ทุกครั้ง)
 * ผลคัดกรองรวมทั้งห้อง: มีปัญหา 3 · เสี่ยง 8 · ปกติ 16 · ยังไม่คัดกรอง 8 คน
 * คนที่คัดกรองแล้วทำ Red Flag และ 9S ผลปกติครบ จึงไม่เปิด SDQ
 */
const BASE_IDS = new Set(baseStudents.map((s) => s.studentId));
const BASE_NOS = new Set(baseStudents.map((s) => s.classNo));
const GEN_COUNT = 35 - baseStudents.length;
const GEN_IDS = Array.from({ length: 99 }, (_, i) => String(30101 + i))
  .filter((id) => !BASE_IDS.has(id))
  .filter((_, i) => i % 3 === 0)
  .slice(0, GEN_COUNT);
const GEN_NOS = Array.from({ length: 35 }, (_, i) => i + 1).filter((n) => !BASE_NOS.has(n));
const GEN_MALE = ["ณัฐพล", "ธีรภัทร", "กฤษณะ", "พีรพัฒน์", "วรากร", "ศุภชัย", "อภิวัฒน์", "สรวิชญ์", "ภัทรพล", "เจษฎา", "ธนวัฒน์", "นภัสกร", "พงศธร", "ปรเมศวร์"];
const GEN_FEMALE = ["กัญญาณัฐ", "ชนิกานต์", "ณิชา", "ธัญญาลักษณ์", "นภัสวรรณ", "ปวีณา", "พิมพ์ลดา", "รุ่งนภา", "สิริกาญจน์", "อรปรียา", "ฐิติมา", "วรัญญา", "เบญญาภา", "ศศิประภา"];
const GEN_LAST = [
  "ศรีสวัสดิ์", "แก้วมณี", "บุญมี", "ทองดี", "สุขสมบูรณ์", "วงศ์ใหญ่", "ชัยมงคล", "พูลสวัสดิ์", "เรืองศรี",
  "จันทร์เพ็ญ", "ดวงสุวรรณ", "มีสุข", "ศักดิ์สิทธิ์", "อินทร์แก้ว", "สุวรรณรัตน์", "คำแสน", "นามวงศ์", "โพธิ์ทอง",
  "เหลืองอ่อน", "ทิพย์รัตน์", "กล้าหาญ", "เพชรสุวรรณ", "ลือชา", "สมบัติทอง", "พรหมมา", "ใสสะอาด", "ภู่ทอง",
];
const GEN_MOTHER = ["สมใจ", "วันเพ็ญ", "ประไพ", "ลำดวน", "สุกัญญา", "จันทนา", "มาลี", "รัชนี", "นิภา", "บังอร"];
const GEN_FATHER = ["สมบัติ", "ประสิทธิ์", "วิทยา", "สุเทพ", "ชัยวัฒน์", "บุญเลิศ", "อนุสรณ์", "มนัส"];
const GEN_TAMBON = ["บางพลี", "บางแก้ว", "บางพลีใหญ่", "บางโฉลง", "ราชาเทวะ", "หนองปรือ"];

const genStudents: Student[] = GEN_IDS.map((studentId, i) => {
  const female = i % 2 === 1;
  const first = female ? GEN_FEMALE[(i - 1) / 2] : GEN_MALE[i / 2];
  const last = GEN_LAST[i];
  const mother = i % 3 !== 2;
  return {
    studentId,
    fullName: `${female ? "ด.ญ." : "ด.ช."} ${first} ${last}`,
    citizenId: `1-1037-00${600 + i}-${String((i * 7) % 90 + 10)}-${i % 10}`,
    roomName: "ม.3/1",
    classNo: GEN_NOS[i],
    guardianName: mother ? `นาง${GEN_MOTHER[i % GEN_MOTHER.length]} ${last}` : `นาย${GEN_FATHER[i % GEN_FATHER.length]} ${last}`,
    guardianRelation: mother ? "มารดา" : "บิดา",
    guardianPhone: `08x-xxx-${String(1000 + ((i * 937) % 9000)).padStart(4, "0")}`,
    address: `${10 + ((i * 13) % 90)}/${1 + (i % 9)} ต.${GEN_TAMBON[i % GEN_TAMBON.length]} อ.บางพลี จ.สมุทรปราการ`,
    sourceSystem: "team_b_registry",
  };
});

/** ยังไม่คัดกรอง 6 คน · ที่เหลือ 21 คน: มีปัญหา 2 · เสี่ยง 5 · ปกติ 14 */
const GEN_UNSCREENED = new Set([3, 9, 14, 19, 23, 26]);
const GEN_RED = new Set([4, 13]);
const GEN_AMBER: Record<number, [ScreeningDim, string]> = {
  1: ["academic", "ac3"],
  6: ["economic", "ec1"],
  10: ["welfare", "wf2"],
  12: ["behavior", "bh1"],
  17: ["academic", "ac2"],
};
type ScreeningDim = "academic" | "economic" | "welfare" | "behavior";
const GEN_DIMS = ["academic", "physical", "economic", "welfare", "behavior", "mental"] as const;
const genDay = (i: number) => `2570-02-${String(9 + (i % 4)).padStart(2, "0")}`;

const genScreened = genStudents.map((s, i) => ({ s, i })).filter(({ i }) => !GEN_UNSCREENED.has(i));
const genScreenings: Screening[] = genScreened.map(({ s, i }, n) => ({
  screeningId: `SC-G${String(n + 1).padStart(2, "0")}`,
  studentId: s.studentId,
  termId: CURRENT_TERM.termId,
  screenedBy: CURRENT_TEACHER.name,
  screenedAt: genDay(i),
  results: GEN_DIMS.map((dimension) => {
    if (GEN_RED.has(i) && dimension === "academic") return { dimension, group: "red" as const, checkedItemIds: ["ac1", "ac4"] };
    if (GEN_RED.has(i) && dimension === "economic") return { dimension, group: "amber" as const, checkedItemIds: ["ec1"] };
    const a = GEN_AMBER[i];
    if (a && a[0] === dimension) return { dimension, group: "amber" as const, checkedItemIds: [a[1]] };
    return { dimension, group: "green" as const, checkedItemIds: [] };
  }),
}));
const genRedFlags: RedFlagAssessment[] = genScreened.map(({ s, i }, n) => ({
  id: `RF-G${n + 1}`,
  studentId: s.studentId,
  termId: CURRENT_TERM.termId,
  answers: { rf1: false, rf2: false, rf3: false },
  result: "normal",
  assessedBy: CURRENT_TEACHER.name,
  assessedAt: `${genDay(i)}T10:30:00`,
}));
const genNineS: NineSAssessment[] = genScreened.map(({ s, i }, n) => ({
  id: `NS-G${n + 1}`,
  studentId: s.studentId,
  termId: CURRENT_TERM.termId,
  clusterScores: { adhd: 1, depression: 0, social: 1 },
  clusterResults: { adhd: "normal", depression: "normal", social: "normal" },
  result: "normal",
  assessedBy: CURRENT_TEACHER.name,
  assessedAt: `${genDay(i)}T10:50:00`,
}));
/** คนที่อยู่กลุ่มมีปัญหาคนแรกมีกรณีช่วยเหลือแล้ว คนที่สองยังไม่เปิด (ให้เห็นงานที่ครูต้องทำ) */
const genCases: CareCase[] = [
  {
    caseId: "CASE-2570-G01",
    studentId: genStudents[4].studentId,
    triggerSource: "ผลคัดกรอง 6 มิติ (การเรียน)",
    status: "active",
    openedAt: "2570-02-12",
    closedAt: null,
    careMethods: ["counseling"],
    goal: "ช่วยเหลือด้านการเรียนวิชาหลัก โดยติวเพิ่มเติมสัปดาห์ละ 1 ครั้งและติดตามการส่งงาน",
    targetDate: "2570-03-31",
    urgency: "normal",
    nextFollowupDate: "2570-02-27",
    followups: [],
  },
];
/** เยี่ยมบ้านแล้ว 13 คน · นัดรอผู้ปกครองยืนยัน 2 คน · ยืนยันแล้ว 2 คน · ที่เหลือยังไม่ได้นัด */
const GEN_VISITED = new Set([0, 2, 5, 6, 8, 10, 12, 13, 15, 17, 20, 21, 24]);
const GEN_PENDING_VISIT = new Set([1, 4]);
const GEN_CONFIRMED_VISIT = new Set([7, 11]);
const genAppointments: HomeVisitAppointment[] = genStudents.flatMap((s, i): HomeVisitAppointment[] => {
  const base = { appointmentId: `HV-G${String(i + 1).padStart(2, "0")}`, studentId: s.studentId, teacherName: CURRENT_TEACHER.name, guardianPhone: s.guardianPhone };
  if (GEN_VISITED.has(i)) return [{ ...base, proposedDate: `2569-11-${String(3 + (i % 20)).padStart(2, "0")}T15:30:00`, status: "completed" }];
  if (GEN_PENDING_VISIT.has(i)) return [{ ...base, proposedDate: "2570-02-24T15:30:00", status: "pending" }];
  if (GEN_CONFIRMED_VISIT.has(i)) return [{ ...base, proposedDate: "2570-02-19T16:00:00", status: "confirmed" }];
  return [];
});
const genVisitRecords: HomeVisitRecord[] = genStudents.flatMap((s, i): HomeVisitRecord[] =>
  GEN_VISITED.has(i)
    ? [
        {
          recordId: `HVR-G${String(i + 1).padStart(2, "0")}`,
          appointmentId: `HV-G${String(i + 1).padStart(2, "0")}`,
          studentId: s.studentId,
          householdMembers: [
            { memberId: "M1", relation: s.guardianRelation, age: 38 + (i % 12), occupation: "รับจ้างทั่วไป", monthlyIncome: 9000 + (i % 5) * 2500 },
            { memberId: "M2", relation: "นักเรียน", age: 14, occupation: "-", monthlyIncome: 0 },
          ],
          riskFindings: [],
          informantName: s.guardianName,
          informantRelation: s.guardianRelation,
          photoLabels: ["ภาพภายนอกบ้าน"],
          signedBy: CURRENT_TEACHER.name,
          signedAt: `2569-11-${String(3 + (i % 20)).padStart(2, "0")}`,
        },
      ]
    : []
);
/** EQ: ทำแล้ว 6 คน · เลือกไม่ทำ 3 คน · ที่เหลือยังไม่ได้ทำ */
const genEqKind = (i: number): "done" | "declined" | "pending" => (i % 5 === 1 ? "done" : i % 9 === 4 ? "declined" : "pending");
const genBehavior: BehaviorRecord[] = [
  [0, "BR-06", "ช่วยจัดบอร์ดหน้าห้อง", "2570-01-20T14:00:00"],
  [2, "BR-01", "มาถึงโรงเรียนหลังเวลาเข้าแถว", "2570-01-27T07:50:00"],
  [5, "BR-07", "ช่วยครูถือหนังสือไปห้องสมุด", "2570-02-03T10:10:00"],
  [8, "BR-03", "ไม่ส่งงานวิชาสังคมศึกษา", "2570-02-04T09:00:00"],
  [11, "BR-06", "ช่วยกิจกรรมจิตอาสาวันเด็ก", "2570-01-13T13:30:00"],
  [15, "BR-02", "แต่งกายไม่ถูกระเบียบ (ไม่ใส่เสื้อพละ)", "2570-02-05T08:20:00"],
  [18, "BR-07", "ช่วยเพื่อนติวเลข", "2570-02-09T12:30:00"],
  [22, "BR-01", "มาถึงโรงเรียนหลังเวลาเข้าแถว", "2570-02-11T07:55:00"],
].map(([i, ruleId, description, occurredAt], n) => ({
  recordId: `BH-G${n + 1}`,
  studentId: genStudents[i as number].studentId,
  ruleId: ruleId as string,
  description: description as string,
  occurredAt: occurredAt as string,
  recordedByName: CURRENT_TEACHER.name,
  source: "manual" as const,
}));
const genCards: StudentCard[] = genStudents.map((s, i) => ({
  cardId: `CARD-G${i + 1}`,
  code: `${s.studentId}-1`,
  studentId: s.studentId,
  type: "new",
  issuedAt: "2569-05-20",
  expiresAt: "2570-03-31",
  status: "active",
  physical: "handed",
}));

export const students: Student[] = [...baseStudents, ...genStudents];

/**
 * นักเรียนห้องอื่นที่ครูในตัวอย่างสอน (ม.3/2) และห้องที่ไม่ได้สอน (ม.1/3) ใช้สาธิตขอบเขตตามการมอบหมาย (UC8 ข้อ 6, Alt-B)
 * ไม่อยู่ในรายชื่อห้องของครูประจำชั้น จึงไม่ปรากฏในภาพรวม คัดกรอง หรือหน้าข้อมูลรายคน
 */
export const otherStudents: Student[] = [
  {
    studentId: "30201",
    fullName: "ด.ช. ชยพล รักดี",
    citizenId: "1-1037-0030201-00-0",
    roomName: "ม.3/2",
    classNo: 3,
    guardianName: "นางสมใจ รักดี",
    guardianRelation: "มารดา",
    guardianPhone: "08x-xxx-0201",
    address: "-",
    sourceSystem: "team_b_registry",
  },
  {
    studentId: "30207",
    fullName: "ด.ญ. กมลชนก ศรีงาม",
    citizenId: "1-1037-0030207-00-0",
    roomName: "ม.3/2",
    classNo: 9,
    guardianName: "นางวิไล ศรีงาม",
    guardianRelation: "มารดา",
    guardianPhone: "08x-xxx-0207",
    address: "-",
    sourceSystem: "team_b_registry",
  },
  {
    studentId: "30214",
    fullName: "ด.ช. ปวริศ มั่นคง",
    citizenId: "1-1037-0030214-00-0",
    roomName: "ม.3/2",
    classNo: 15,
    guardianName: "นางพรทิพย์ มั่นคง",
    guardianRelation: "มารดา",
    guardianPhone: "08x-xxx-0214",
    address: "-",
    sourceSystem: "team_b_registry",
  },
  {
    studentId: "10322",
    fullName: "ด.ญ. ธิดารัตน์ แสงทอง",
    citizenId: "1-1037-0010322-00-0",
    roomName: "ม.1/3",
    classNo: 4,
    guardianName: "นางอรุณี แสงทอง",
    guardianRelation: "มารดา",
    guardianPhone: "08x-xxx-0322",
    address: "-",
    sourceSystem: "team_b_registry",
  },
];

/**
 * ผล Red Flag / 9S ของภาคเรียนปัจจุบัน (ตัวอย่างให้เห็นทุกสถานะของมิติสุขภาพจิต)
 * - 30118: Red Flag ควรดูแล (ตรงกับ SDQ 3 ฝ่ายและ case ที่มีอยู่)
 * - 30152, 30160: Red Flag และ 9S ปกติ → ไม่ต้องดูแลเพิ่ม
 * - 30125: Red Flag ปกติ เหลือ 9S · 30131, 30140: ยังไม่ทำ Red Flag
 */
const rfAnswers = (yes: string[]) => ({ rf1: yes.includes("rf1"), rf2: yes.includes("rf2"), rf3: yes.includes("rf3") });
export const redFlagSeeds: RedFlagAssessment[] = [
  ...genRedFlags,
  { id: "RF-S1", studentId: "30118", termId: "T2569-2", answers: rfAnswers(["rf2"]), result: "needs_care", assessedBy: CURRENT_TEACHER.name, assessedAt: "2570-02-12T10:40:00" },
  { id: "RF-S2", studentId: "30125", termId: "T2569-2", answers: rfAnswers([]), result: "normal", assessedBy: CURRENT_TEACHER.name, assessedAt: "2570-02-12T10:20:00" },
  { id: "RF-S3", studentId: "30152", termId: "T2569-2", answers: rfAnswers([]), result: "normal", assessedBy: CURRENT_TEACHER.name, assessedAt: "2570-02-10T14:05:00" },
  { id: "RF-S4", studentId: "30160", termId: "T2569-2", answers: rfAnswers([]), result: "normal", assessedBy: CURRENT_TEACHER.name, assessedAt: "2570-02-10T14:30:00" },
];

const nineSNormal = (id: string, studentId: string, at: string): NineSAssessment => ({
  id,
  studentId,
  termId: "T2569-2",
  clusterScores: { adhd: 1, depression: 0, social: 1 },
  clusterResults: { adhd: "normal", depression: "normal", social: "normal" },
  result: "normal",
  assessedBy: CURRENT_TEACHER.name,
  assessedAt: at,
});
export const nineSSeeds: NineSAssessment[] = [
  ...genNineS,
  nineSNormal("NS-S1", "30152", "2570-02-10T14:15:00"),
  nineSNormal("NS-S2", "30160", "2570-02-10T14:40:00"),
];

export const screenings: Screening[] = [
  ...genScreenings,
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
  // ---- ภาคเรียนที่ 1 ปีการศึกษา 2569 (ประวัติย้อนหลัง) ----
  {
    screeningId: "SC-P01",
    studentId: "30125",
    termId: "T2569-1",
    screenedBy: CURRENT_TEACHER.name,
    screenedAt: "2569-08-20",
    results: [
      { dimension: "academic", group: "green", checkedItemIds: [] },
      { dimension: "physical", group: "green", checkedItemIds: [] },
      { dimension: "economic", group: "green", checkedItemIds: [] },
      { dimension: "welfare", group: "green", checkedItemIds: [] },
      { dimension: "behavior", group: "green", checkedItemIds: [] },
      { dimension: "mental", group: "green", checkedItemIds: [] },
    ],
  },
  {
    screeningId: "SC-P02",
    studentId: "30118",
    termId: "T2569-1",
    screenedBy: CURRENT_TEACHER.name,
    screenedAt: "2569-08-20",
    results: [
      { dimension: "academic", group: "amber", checkedItemIds: [] },
      { dimension: "physical", group: "green", checkedItemIds: [] },
      { dimension: "economic", group: "green", checkedItemIds: [] },
      { dimension: "welfare", group: "green", checkedItemIds: [] },
      { dimension: "behavior", group: "green", checkedItemIds: [] },
      { dimension: "mental", group: "amber", checkedItemIds: [] },
    ],
  },
  {
    screeningId: "SC-P03",
    studentId: "30140",
    termId: "T2569-1",
    screenedBy: CURRENT_TEACHER.name,
    screenedAt: "2569-08-21",
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

/** SDQ รอบ 1 (ม.ค.) และรอบ 2 (ก.พ.) ตามช่วงเวลาในหน้าตั้งค่า ด.ญ. พิชสินีย์ มีผลรอบ 1 ครบแล้ว ใช้ดูประวัติ */
export const sdqAssessments: SdqAssessment[] = [
  {
    id: "SDQ-R1-1",
    studentId: "30125",
    termId: CURRENT_TERM.termId,
    round: 1,
    rater: "teacher",
    raterName: CURRENT_TEACHER.name,
    answers: {},
    totalDifficulties: 12,
    scaleScores: { emotional: 4, conduct: 2, hyperactivity: 3, peer: 3, prosocial: 8 },
    level: "normal",
    status: "completed",
    assessedAt: "2570-01-15",
  },
  {
    id: "SDQ-R1-2",
    studentId: "30125",
    termId: CURRENT_TERM.termId,
    round: 1,
    rater: "student",
    raterName: "ด.ญ. พิชสินีย์ เพรี่ยงพร้อม",
    answers: {},
    totalDifficulties: 11,
    scaleScores: { emotional: 4, conduct: 2, hyperactivity: 3, peer: 2, prosocial: 8 },
    level: "normal",
    status: "completed",
    assessedAt: "2570-01-16",
  },
  {
    id: "SDQ-R1-3",
    studentId: "30125",
    termId: CURRENT_TERM.termId,
    round: 1,
    rater: "parent",
    raterName: "นางสาวภัคคินีย์ เพรี่ยงพร้อม",
    answers: {},
    totalDifficulties: 14,
    scaleScores: { emotional: 5, conduct: 3, hyperactivity: 3, peer: 3, prosocial: 7 },
    level: "normal",
    status: "completed",
    assessedAt: "2570-01-20",
  },
  {
    id: "SDQ-001",
    studentId: "30125",
    termId: CURRENT_TERM.termId,
    round: 2,
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
    round: 2,
    rater: "student",
    raterName: "ด.ญ. พิชสินีย์ เพรี่ยงพร้อม",
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
    round: 2,
    rater: "parent",
    raterName: "นางสาวภัคคินีย์ เพรี่ยงพร้อม",
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
    round: 2,
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
    round: 2,
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
    round: 2,
    rater: "parent",
    raterName: "ผู้ปกครองของ ด.ช. ภูมิ",
    answers: {},
    totalDifficulties: 17,
    scaleScores: { emotional: 4, conduct: 4, hyperactivity: 6, peer: 3, prosocial: 6 },
    level: "risk",
    status: "completed",
    assessedAt: "2570-02-15",
  },
  // ---- ภาคเรียนที่ 1 ปีการศึกษา 2569 (ประวัติย้อนหลัง) ----
  {
    id: "SDQ-P1",
    studentId: "30125",
    termId: "T2569-1",
    round: 1,
    rater: "teacher",
    raterName: CURRENT_TEACHER.name,
    answers: {},
    totalDifficulties: 8,
    scaleScores: { emotional: 2, conduct: 2, hyperactivity: 2, peer: 1, prosocial: 7 },
    level: "normal",
    status: "completed",
    assessedAt: "2569-09-10",
  },
  {
    id: "SDQ-P2",
    studentId: "30125",
    termId: "T2569-1",
    round: 1,
    rater: "student",
    raterName: "ด.ญ. พิชสินีย์ เพรี่ยงพร้อม",
    answers: {},
    totalDifficulties: 7,
    scaleScores: { emotional: 2, conduct: 1, hyperactivity: 2, peer: 1, prosocial: 7 },
    level: "normal",
    status: "completed",
    assessedAt: "2569-09-11",
  },
  {
    id: "SDQ-P3",
    studentId: "30125",
    termId: "T2569-1",
    round: 1,
    rater: "parent",
    raterName: "นางสาวภัคคินีย์ เพรี่ยงพร้อม",
    answers: {},
    totalDifficulties: 9,
    scaleScores: { emotional: 2, conduct: 2, hyperactivity: 2, peer: 2, prosocial: 7 },
    level: "normal",
    status: "completed",
    assessedAt: "2569-09-14",
  },
  {
    id: "SDQ-P4",
    studentId: "30118",
    termId: "T2569-1",
    round: 1,
    rater: "teacher",
    raterName: CURRENT_TEACHER.name,
    answers: {},
    totalDifficulties: 15,
    scaleScores: { emotional: 4, conduct: 3, hyperactivity: 4, peer: 3, prosocial: 7 },
    level: "risk",
    status: "completed",
    assessedAt: "2569-09-10",
  },
  {
    id: "SDQ-P5",
    studentId: "30118",
    termId: "T2569-1",
    round: 1,
    rater: "student",
    raterName: "ด.ช. ภูมิ ตั้งใจเรียน",
    answers: {},
    totalDifficulties: 14,
    scaleScores: { emotional: 4, conduct: 3, hyperactivity: 4, peer: 2, prosocial: 7 },
    level: "normal",
    status: "completed",
    assessedAt: "2569-09-11",
  },
  {
    id: "SDQ-P6",
    studentId: "30118",
    termId: "T2569-1",
    round: 1,
    rater: "parent",
    raterName: "ผู้ปกครองของ ด.ช. ภูมิ",
    answers: {},
    totalDifficulties: 15,
    scaleScores: { emotional: 4, conduct: 3, hyperactivity: 4, peer: 3, prosocial: 7 },
    level: "risk",
    status: "completed",
    assessedAt: "2569-09-15",
  },
];

/**
 * EQ ภาคเรียนนี้: นักเรียนมัธยมประเมินตนเองทุกคน (UC10 Pre-condition 2)
 * ด.ญ. พิชสินีย์ (นักเรียนในพอร์ทัล) ยังไม่ได้ทำ ใช้ทดลองทำ EQ หรือเลือกไม่ทำ
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
export const eqAssessments: EqAssessment[] = students.map((st, idx) =>
  st.studentId === "30131"
    ? eqDone("30131", [3, 4, 3, 3, 2, 2, 3, 3, 2, 3, 1, 2], "2570-02-14")
    : st.studentId === "30140"
      ? eqDone("30140", [4, 3, 4, 4, 3, 4, 3, 4, 4, 3, 3, 4], "2570-02-12")
      : st.studentId === "30171"
        ? { id: "EQ-30171", studentId: "30171", termId: CURRENT_TERM.termId, status: "declined", answers: {}, scores: null, levels: null, assessedAt: "2570-02-13" }
        : idx >= baseStudents.length && genEqKind(idx - baseStudents.length) === "done"
          ? eqDone(st.studentId, [3, 3, 4, 3, 2, 3, 3, 4, 3, 3, 2, 3], "2570-02-13")
          : idx >= baseStudents.length && genEqKind(idx - baseStudents.length) === "declined"
            ? { id: `EQ-${st.studentId}`, studentId: st.studentId, termId: CURRENT_TERM.termId, status: "declined", answers: {}, scores: null, levels: null, assessedAt: "2570-02-13" }
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
 * ด.ญ. พิชสินีย์ เคยทำบัตรหายแล้วออกบัตรทดแทน บัตรเดิม (30125-1) จึงถูกยกเลิก ใช้สาธิตการสแกนบัตรที่ยกเลิกแล้ว
 */
export const studentCards: StudentCard[] = [
  ...genCards,
  { cardId: "CARD-0", code: "30125-1", studentId: "30125", type: "new", issuedAt: "2569-05-20", expiresAt: ACADEMIC_YEAR_END, status: "cancelled", physical: "handed" },
  { cardId: "CARD-1", code: "30125-2", studentId: "30125", type: "replacement", reason: "บัตรหาย", issuedAt: "2569-11-10", expiresAt: ACADEMIC_YEAR_END, status: "active", physical: "handed" },
  ...["30118", "30131", "30140", "30152", "30160", "30171"].map(
    (id, i): StudentCard => ({ cardId: `CARD-${i + 2}`, code: `${id}-1`, studentId: id, type: "new", issuedAt: "2569-05-20", expiresAt: ACADEMIC_YEAR_END, status: "active", physical: "handed" })
  ),
  // ห้องอื่น: ม.3/2 (ครูทั้งสองคนสอน) และ ม.1/3 (ไม่ได้สอน สแกนแล้วบันทึกไม่ได้)
  ...["30201", "10322"].map(
    (id, i): StudentCard => ({ cardId: `CARD-O${i}`, code: `${id}-1`, studentId: id, type: "new", issuedAt: "2569-05-20", expiresAt: ACADEMIC_YEAR_END, status: "active", physical: "handed" })
  ),
];

export const behaviorRecords: BehaviorRecord[] = [
  ...genBehavior,
  // ---- ภาคเรียนที่ 1 ปีการศึกษา 2569 (ประวัติย้อนหลัง): คะแนนปลายภาคเต็ม 100 ทุกคน ----
  { recordId: "BH-P1", studentId: "30125", ruleId: "BR-06", description: "ช่วยจัดนิทรรศการวิทยาศาสตร์", occurredAt: "2569-07-22T13:30:00", recordedByName: "ครูมาลีฮัน จันทะสะรวย", source: "manual" },
  { recordId: "BH-P2", studentId: "30118", ruleId: "BR-01", description: "มาถึงโรงเรียนหลังเวลาเข้าแถว", occurredAt: "2569-07-14T07:55:00", recordedByName: "ครูมาลีฮัน จันทะสะรวย", source: "manual" },
  { recordId: "BH-P3", studentId: "30118", ruleId: "BR-07", description: "ช่วยครูยกอุปกรณ์การเรียน", occurredAt: "2569-08-25T10:15:00", recordedByName: "ครูมาลีฮัน จันทะสะรวย", source: "manual" },
  { recordId: "BH-P4", studentId: "30140", ruleId: "BR-03", description: "ไม่ส่งการบ้านวิชาภาษาไทย", occurredAt: "2569-09-03T09:00:00", recordedByName: "ครูมาลีฮัน จันทะสะรวย", source: "manual" },
  { recordId: "BH-P5", studentId: "30140", ruleId: "BR-06", description: "ช่วยจัดสถานที่กิจกรรมวันไหว้ครู", occurredAt: "2569-09-18T14:00:00", recordedByName: "ครูมาลีฮัน จันทะสะรวย", source: "manual" },
  // ด.ญ. ชลิดา: เคยเฝ้าระวังระดับ 2 (คะแนน 60) แล้วคะแนนกลับเข้าเกณฑ์วันที่ 7 ก.พ. รอครูที่ปรึกษายืนยันถอนสถานะ และเลยกำหนดยืนยันแล้ว
  { recordId: "BH-W1", studentId: "30160", ruleId: "BR-05", description: "ทะเลาะวิวาทกับเพื่อนในห้อง", occurredAt: "2570-02-01T09:10:00", recordedByName: "ครูมาลีฮัน จันทะสะรวย", source: "manual" },
  { recordId: "BH-W2", studentId: "30160", ruleId: "BR-05", description: "ทะเลาะวิวาทซ้ำหลังเลิกเรียน", occurredAt: "2570-02-02T13:20:00", recordedByName: "ครูมาลีฮัน จันทะสะรวย", source: "manual" },
  { recordId: "BH-W3", studentId: "30160", ruleId: "BR-04", description: "ใช้โทรศัพท์ระหว่างเรียนวิชาคณิตศาสตร์", occurredAt: "2570-02-03T10:05:00", recordedByName: "ครูมาลีฮัน จันทะสะรวย", source: "manual" },
  { recordId: "BH-W4", studentId: "30160", ruleId: "BR-06", description: "ช่วยจัดงานกีฬาสี", occurredAt: "2570-02-05T14:00:00", recordedByName: "ครูมาลีฮัน จันทะสะรวย", source: "manual" },
  { recordId: "BH-W5", studentId: "30160", ruleId: "BR-06", description: "ช่วยจัดห้องสมุด", occurredAt: "2570-02-06T14:30:00", recordedByName: "ครูมาลีฮัน จันทะสะรวย", source: "manual" },
  { recordId: "BH-W6", studentId: "30160", ruleId: "BR-06", description: "ช่วยกิจกรรมจิตอาสา", occurredAt: "2570-02-07T15:00:00", recordedByName: "ครูมาลีฮัน จันทะสะรวย", source: "manual" },
  // ด.ญ. ปาริชาติ: ทะเลาะวิวาท 2 ครั้ง คะแนนลงถึง 70 แล้วได้คะแนนบวกกลับมา 80 ยังอยู่ในสถานะเฝ้าระวังระดับ 1
  { recordId: "BH-W7", studentId: "30140", ruleId: "BR-05", description: "ทะเลาะวิวาทกับเพื่อนต่างห้อง", occurredAt: "2570-02-10T09:30:00", recordedByName: "ครูมาลีฮัน จันทะสะรวย", source: "manual" },
  { recordId: "BH-W8", studentId: "30140", ruleId: "BR-05", description: "ทะเลาะวิวาทซ้ำ", occurredAt: "2570-02-12T10:30:00", recordedByName: "ครูมาลีฮัน จันทะสะรวย", source: "manual" },
  // ห้องที่สอน (ม.3/2): ครูประจำชั้น ม.3/1 บันทึกในฐานะครูผู้สอน และครูผู้สอนวิทยาศาสตร์บันทึกอีกรายการ
  {
    recordId: "BH-O1",
    studentId: "30201",
    ruleId: "BR-04",
    description: "ใช้โทรศัพท์ระหว่างเรียนสังคมศึกษา",
    occurredAt: "2570-02-14T10:40:00",
    recordedByName: "ครูมาลีฮัน จันทะสะรวย",
    source: "manual",
  },
  {
    recordId: "BH-O2",
    studentId: "30207",
    ruleId: "BR-07",
    description: "ช่วยเพื่อนทำการทดลองวิทยาศาสตร์",
    occurredAt: "2570-02-15T14:10:00",
    recordedByName: "ครูมานพ สอนดี",
    source: "manual",
  },
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
    recordedByName: "ครูมานพ สอนดี",
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
  ...genAppointments,
  // พิชสินีย์ (30125) ไม่มีนัดค้างอยู่โดยตั้งใจ เพื่อให้สร้างนัดใหม่สดในเดโมได้
  // (ประวัติกรณี CASE-2570-014 ระบุว่าครูจะนัดเยี่ยมบ้านวันที่ 18 ก.พ.)
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
  ...genVisitRecords,
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
  ...genCases,
  {
    caseId: "CASE-2570-014",
    studentId: "30125",
    triggerSource: "ผลคัดกรอง 6 มิติ (เศรษฐกิจ / สุขภาพจิต)",
    status: "active",
    openedAt: "2570-02-01",
    closedAt: null,
    careMethods: ["behavior_adjust", "life_skills", "counseling"],
    goal:
      "ลดความกังวลด้านการเรียนและเศรษฐกิจ โดยประสานทุนการศึกษาจากโรงเรียน และให้คำปรึกษาต่อเนื่องสัปดาห์ละ 1 ครั้ง จนถึงสิ้นภาคเรียน",
    targetDate: "2570-03-31",
    urgency: "urgent",
    nextFollowupDate: "2570-02-25",
    followups: [
      {
        followupId: "FU-003",
        actionTaken: "โทรพูดคุยกับผู้ปกครองและประสานทุนการศึกษา",
        result:
          "ผู้ปกครองแจ้งว่ารายได้ครัวเรือนไม่แน่นอน และขอความช่วยเหลือด้านทุนการศึกษา ครูแจ้งฝ่ายกิจการนักเรียนแล้ว และนัดเยี่ยมบ้านวันที่ 18 ก.พ. เพื่อประเมินความจำเป็น",
        followupDate: "2570-02-14",
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
    careMethods: ["counseling", "guidance_teacher"],
    goal: "ส่งต่อครูแนะแนวเพื่อประเมินเชิงลึกด้านสุขภาพจิต และติดตามพฤติกรรมการมาสาย",
    targetDate: "2570-03-15",
    urgency: "urgent",
    nextFollowupDate: "2570-02-18",
    followups: [
      {
        followupId: "FU-010",
        actionTaken: "ส่งต่อครูแนะแนว",
        result: "ครูแนะแนวรับเรื่องแล้ว นัดพบนักเรียนสัปดาห์หน้า",
        followupDate: "2570-02-14",
        recordedByName: CURRENT_TEACHER.name,
        nextFollowupDate: "2570-02-18",
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
  { docId: "DOC-003", docType: "ปพ.7", target: "ด.ช. ธนากร รักเรียน", generatedByName: "ผู้ดูแลระบบ", generatedAt: "2570-02-10" },
  { docId: "DOC-004", docType: "ปพ.5", target: "รายวิชาคณิตศาสตร์", generatedByName: "ผู้ดูแลระบบ", generatedAt: "2570-02-02" },
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
export const CLASS_SIZE = students.length;

/**
 * การแจ้งเตือนเริ่มต้นของกระดิ่ง (รายการที่สร้างตอนเกิดเหตุ ข้อมูลตัวอย่างไม่เคยผ่านตอนนั้น จึงใส่ไว้ให้ตรงกับบันทึกด้านบน)
 * ส่วนรายการตามเวลา (รอยืนยันถอน / เลยกำหนด) คำนวณจากข้อมูลเอง ไม่ต้องมี seed
 */
export const staffNotificationSeeds: StaffNotification[] = [
  {
    id: "NT-SEED-1",
    kind: "watch_raised",
    title: "ด.ญ. ปาริชาติ ใฝ่ดี เข้าสถานะเฝ้าระวัง",
    body: "ระดับ 1 · คะแนนคงเหลือ 70 · บันทึกโดยครูมาลีฮัน จันทะสะรวย",
    href: "/students/30140",
    at: "2570-02-12T10:30:00",
    to: { homeroomOf: "ม.3/1" },
  },
];

export const notificationLogSeeds: NotificationLogEntry[] = [
  { id: "NL-SEED-1", at: "2570-02-12T10:30:00", channel: "ในระบบ", to: "ครูที่ปรึกษา, ครูที่บันทึก, นักเรียน, ผู้ปกครอง", text: "นักเรียนห้อง ม.3/1 เข้าสถานะเฝ้าระวังระดับ 1" },
  { id: "NL-SEED-2", at: "2570-02-12T10:30:00", channel: "อีเมล (จำลอง)", to: "ผู้ปกครอง", text: "นักเรียนห้อง ม.3/1 เข้าสถานะเฝ้าระวังระดับ 1" },
];
