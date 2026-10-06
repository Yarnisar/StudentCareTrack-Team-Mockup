/**
 * รายชื่อนักเรียนที่สร้างเพิ่มให้ ม.3/1 ครบ 38 คน (ส่วนที่ไม่ใช่ 8 คนตัวอย่างหลัก)
 * pure + กำหนดผลได้: ใช้ตัวสุ่มที่ตรึง seed ไม่ใช้ Math.random และไม่อ่านนาฬิกา
 *
 * ไฟล์นี้ไม่ import อะไรจาก mock-data อื่น (core.ts เรียกใช้) — ข้อมูลรายโมดูลอยู่ใน generated-class.ts
 */

import type { Student, StudentEnrollment, StudentGuardian, User } from "../types";
import { Rng } from "./prng";

export const CLASS_TARGET_SIZE = 38;

/** บทบาทของนักเรียนแต่ละคนในภาพรวมห้อง (ใช้กำหนดว่าข้อมูลทุกโมดูลต้องเล่าเรื่องแบบไหน) */
export type Scenario =
  | "red_mental" // Red Flag ควรดูแล → case ยาวมาตั้งแต่ภาคเรียนที่ 1
  | "red_welfare" // สวัสดิภาพ "มีปัญหา" (+ 9S ควรดูแล) → ระบบเปิด case
  | "red_behavior" // พฤติกรรม "มีปัญหา" คะแนนความประพฤติต่ำ → ระบบเปิด case ยังไม่มีแผน
  | "amber_sdq_case" // 9S ควรดูแล, SDQ ครั้งที่ 2 ครบแล้วผลรวมมีปัญหา → case เปิดจาก SDQ
  | "amber_9s" // 9S ควรดูแล, SDQ ครั้งที่ 2 รอผู้ปกครอง → คำแนะนำเปิด case
  | "amber_economic_case" // เศรษฐกิจเสี่ยง ครูเปิด case เอง
  | "amber_physical" // สุขภาพกายเสี่ยง → คำแนะนำเปิด case
  | "amber_academic_case" // การเรียนเสี่ยง ครูรับคำแนะนำแล้วเปิด case
  | "amber_late" // มาสายครบเกณฑ์ (bh1) → คำแนะนำเปิด case
  | "green"
  | "green_low_score" // ผลปกติแต่คะแนนความประพฤติต่ำกว่า 60 (คำแนะนำสดจากคะแนน)
  | "green_pending_late" // มีบันทึกมาสายรอยืนยัน
  | "green_history" // เคยมี case ภาคเรียนที่ 1 ปิดแล้ว
  | "draft_9s" // คัดกรองเป็นร่าง + 9S ควรดูแล (SDQ รอบ 2 เปิดแล้วยังไม่มีใครตอบ)
  | "draft_econ"
  | "draft_acad"
  | "none_assessed" // ยังไม่ได้คัดกรอง แต่ Red Flag/9S ภาคเรียนที่ 1 ครบ
  | "none_new"; // ย้ายเข้ามาใหม่ ยังไม่เคยประเมินเลย

export type HvKind =
  | "done"
  | "done_inaccessible"
  | "draft"
  | "sched_confirmed"
  | "sched_pending"
  | "sched_reschedule"
  | "none";

export type CardKind = "active" | "reissued" | "none";
export type ConsentKind = "granted" | "declined" | "none";

export interface GenProfile {
  studentId: string;
  classNo: number;
  gender: "m" | "f";
  scenario: Scenario;
  hv: HvKind;
  card: CardKind;
  consent: ConsentKind;
  /** คะแนนความประพฤติปีการศึกษา 2569 ที่ตั้งใจให้ได้ (ก่อนผลปัดจากเกณฑ์อื่น) */
  scoreTarget: number;
  /** ไม่ได้เช็คอินวันนี้ */
  absentToday: boolean;
  /** รายได้ครัวเรือนต่ำ (สอดคล้องกับรายการคัดกรอง ec1) */
  lowIncome: boolean;
  /** มีผลเยี่ยมบ้านปีการศึกษา 2568 */
  visited2568: boolean;
  guardianUserId: string;
  guardianRelation: "บิดา" | "มารดา";
  /** ครูประจำชั้นที่รับผิดชอบเป็นหลักในข้อมูลของนักเรียนคนนี้ (U-T01 / U-T02) */
  teacherId: string;
}

export interface GeneratedRoster {
  students: Student[];
  users: User[];
  guardians: StudentGuardian[];
  enrollments: StudentEnrollment[];
  profiles: GenProfile[];
}

const FEMALE_NAMES = [
  "ณัฐธิดา", "กัญญารัตน์", "พิมพ์ชนก", "สุพิชชา", "ปวีณา", "ธนพร", "อรอนงค์", "ชนิกานต์", "วริศรา", "ศิริพร",
  "นภัสสร", "จิรัชญา", "เบญญาภา", "รุ่งนภา", "อาทิตยา", "ลลิตา", "สุดารัตน์", "พัชราภา", "ธัญญารัตน์", "กมลชนก",
];
const MALE_NAMES = [
  "ศุภณัฐ", "ภูริภัทร", "ณัฐพงษ์", "วรากร", "สิรวิชญ์", "ธีรภัทร", "พงศกร", "ชยพล", "นพดล", "คณิน",
  "อภิวัฒน์", "เตชินท์", "พีรพัฒน์", "วัชรพล", "ปิยะพงษ์", "รัฐภูมิ", "ศักดิ์สิทธิ์", "อนุชา", "ก้องภพ", "กฤษฎา",
];
const SURNAMES = [
  "แก้วมณี", "ศรีสวัสดิ์", "บุญมี", "ทองดี", "สุขประเสริฐ", "วงศ์ใหญ่", "พรมมา", "เพชรรัตน์", "ชัยชนะ", "อินทร์แก้ว",
  "สมบูรณ์", "นามวงศ์", "คงเจริญ", "ปัญญาดี", "รุ่งเรือง", "มีสุข", "ยิ้มแย้ม", "โพธิ์ทอง", "ลาภเจริญ", "ใจเย็น",
  "เกตุแก้ว", "ดวงดี", "ศรีทอง", "หอมจันทร์", "กลิ่นเกษร", "สายทอง", "บัวผัน", "ทรัพย์สิน", "เจริญผล", "พึ่งบุญ",
];
const MOTHER_NAMES = [
  "สุนิสา", "วันเพ็ญ", "อรุณี", "กาญจนา", "ศิริลักษณ์", "จินตนา", "พรทิพย์", "สมคิด", "นงลักษณ์", "ลัดดา",
  "เบญจา", "ปราณี", "รัชนี", "สุกัญญา", "อัมพร", "ชุติมา", "วิภา", "มะลิ", "จันทนา", "ขวัญใจ",
];
const FATHER_NAMES = [
  "สมพงษ์", "วิชัย", "ประสิทธิ์", "สุรชัย", "บุญเลิศ", "ธวัช", "สมบัติ", "ชาตรี", "วีระ", "นิพนธ์",
  "เกษม", "ไพโรจน์", "ทวีศักดิ์", "อดิศักดิ์", "มนัส", "สุเทพ", "บุญช่วย", "สมนึก", "เฉลิม", "ปรีชา",
];
const TAMBON = ["บางพลี", "บางพลีใหญ่", "บางแก้ว", "บางโฉลง", "ราชาเทวะ", "หนองปรือ"];

/** ลำดับตายตัวของบทบาททั้ง 30 คน (สลับตำแหน่งด้วยตัวสุ่ม) — สัดส่วนผลคัดกรองของห้องมาจากตรงนี้ */
const SCENARIO_DECK: Scenario[] = [
  "red_mental", "red_welfare", "red_behavior",
  "amber_sdq_case", "amber_9s", "amber_economic_case", "amber_physical", "amber_academic_case", "amber_late",
  "green_low_score", "green_pending_late", "green_pending_late", "green_pending_late",
  "green_history", "green_history", "green_history",
  "green", "green", "green", "green", "green", "green", "green", "green", "green",
  "draft_9s", "draft_econ", "draft_acad",
  "none_assessed", "none_new",
];

/** เยี่ยมบ้านประจำปี: ส่วนใหญ่เสร็จแล้ว (รวมเข้าบ้านไม่ได้ 2 คน) ที่เหลือนัดแล้ว/ร่าง/ยังไม่นัด */
const HV_DECK: HvKind[] = [
  ...Array<HvKind>(18).fill("done"),
  "done_inaccessible", "done_inaccessible",
  "draft",
  "sched_confirmed", "sched_confirmed", "sched_confirmed",
  "sched_pending", "sched_pending", "sched_reschedule",
  "none", "none", "none",
];

const CONSENT_DECK: ConsentKind[] = [
  ...Array<ConsentKind>(23).fill("granted"),
  "declined", "declined",
  "none", "none", "none", "none", "none",
];

const CARD_DECK: CardKind[] = [...Array<CardKind>(28).fill("active"), "reissued", "none"];

const SCORE_POOL = [
  100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 98, 97, 96, 95, 95, 92, 90, 88, 85, 84, 82, 80, 78, 76, 72, 70,
  100, 100, 94, 90,
];

/** ปีการศึกษาที่เริ่ม/จบของข้อมูลห้อง */
const ROOM = { roomId: "R-301", roomName: "ม.3/1", gradeLevel: "ม.3" } as const;

export function generateRoster(baseStudents: Student[]): GeneratedRoster {
  const rng = new Rng(0x5c7a2024);
  const usedIds = new Set(baseStudents.map((s) => s.studentId));
  const usedNos = new Set(baseStudents.map((s) => s.classNo));
  const needed = CLASS_TARGET_SIZE - baseStudents.length;

  const classNos: number[] = [];
  for (let n = 1; n <= CLASS_TARGET_SIZE; n++) if (!usedNos.has(n)) classNos.push(n);
  const ids: string[] = [];
  for (let n = 30101; ids.length < needed; n++) if (!usedIds.has(String(n))) ids.push(String(n));

  const genders = rng.shuffle<"m" | "f">([...Array(Math.ceil(needed / 2)).fill("f"), ...Array(Math.floor(needed / 2)).fill("m")]);
  const scenarios = rng.shuffle(SCENARIO_DECK).slice(0, needed);
  const hvs = rng.shuffle(HV_DECK);
  const consents = rng.shuffle(CONSENT_DECK);
  const cards = rng.shuffle(CARD_DECK);
  const scores = rng.shuffle(SCORE_POOL);
  const femaleNames = rng.shuffle(FEMALE_NAMES);
  const maleNames = rng.shuffle(MALE_NAMES);
  const surnames = rng.shuffle(SURNAMES);
  const motherNames = rng.shuffle(MOTHER_NAMES);
  const fatherNames = rng.shuffle(FATHER_NAMES);

  // พี่น้องที่เรียนห้องเดียวกัน (ผู้ปกครองคนเดียวกันเชื่อมกับนักเรียน 2 คน): คู่ (0,1) (2,3) (4,5) ตามลำดับเลขที่
  const siblingOf = new Map<number, number>([[1, 0], [3, 2], [5, 4]]);

  let femaleIdx = 0;
  let maleIdx = 0;
  let motherIdx = 0;
  let fatherIdx = 0;
  let guardianSeq = 8; // U-G01..U-G08 ใช้แล้ว
  const students: Student[] = [];
  const users: User[] = [];
  const guardians: StudentGuardian[] = [];
  const enrollments: StudentEnrollment[] = [];
  const profiles: GenProfile[] = [];
  const surnameOf: string[] = [];
  const guardianOf: string[] = [];
  const relationOf: ("บิดา" | "มารดา")[] = [];
  const addressOf: string[] = [];

  for (let i = 0; i < needed; i++) {
    const studentId = ids[i];
    const classNo = classNos[i];
    const gender = genders[i];
    const sibling = siblingOf.get(i);
    const first = gender === "f" ? femaleNames[femaleIdx++] : maleNames[maleIdx++];
    const surname = sibling !== undefined ? surnameOf[sibling] : surnames[i];
    surnameOf[i] = surname;
    const address =
      sibling !== undefined
        ? addressOf[sibling]
        : `${rng.int(1, 199)}${rng.chance(0.4) ? `/${rng.int(1, 30)}` : ""} ต.${rng.pick(TAMBON)} อ.บางพลี จ.สมุทรปราการ`;
    addressOf[i] = address;

    students.push({
      studentId,
      fullName: `${gender === "f" ? "ด.ญ." : "ด.ช."} ${first} ${surname}`,
      citizenId: `1-1037-xxxxx-xx-${rng.int(0, 9)}`,
      roomId: ROOM.roomId,
      roomName: ROOM.roomName,
      gradeLevel: ROOM.gradeLevel,
      classNo,
      status: "studying",
      address,
      sourceSystem: "team_b_registry",
    });

    users.push({
      userId: `U-S${studentId}`,
      username: studentId,
      role: "student",
      refId: studentId,
      name: students[i].fullName,
      title: `นักเรียน ${ROOM.roomName}`,
      email: null,
      isActive: true,
    });

    // ผู้ปกครอง: พี่น้องใช้บัญชีเดียวกัน
    let guardianUserId: string;
    let relation: "บิดา" | "มารดา";
    if (sibling !== undefined) {
      guardianUserId = guardianOf[sibling];
      relation = relationOf[sibling];
    } else {
      relation = rng.chance(0.6) ? "มารดา" : "บิดา";
      guardianUserId = `U-G${String(++guardianSeq).padStart(2, "0")}`;
      const name =
        relation === "มารดา"
          ? `${rng.chance(0.5) ? "นาง" : "นางสาว"}${motherNames[motherIdx++]} ${surname}`
          : `นาย${fatherNames[fatherIdx++]} ${surname}`;
      users.push({
        userId: guardianUserId,
        username: `parent${studentId}`,
        role: "parent",
        refId: null,
        name,
        title: "ผู้ปกครอง",
        email: rng.chance(0.25) ? `parent${studentId}@mail.example` : null,
        phone: `08x-xxx-${String(rng.int(1000, 9999))}`,
        isActive: true,
      });
    }
    guardianOf[i] = guardianUserId;
    relationOf[i] = relation;
    guardians.push({ studentId, guardianUserId, relation });

    const scenario = scenarios[i];
    // นักเรียนย้ายเข้าใหม่ไม่มีประวัติห้อง ม.2/1 ของปี 2568
    if (scenario !== "none_new") enrollments.push({ studentId, roomId: "R-201", academicYear: 2568 });
    enrollments.push({ studentId, roomId: ROOM.roomId, academicYear: 2569 });

    const scoreTarget =
      scenario === "green_low_score" ? 57 : scenario === "red_behavior" ? 68 : scenario === "amber_late" ? 74 : scores[i];
    profiles.push({
      studentId,
      classNo,
      gender,
      scenario,
      hv: hvs[i],
      card: cards[i],
      consent: scenario === "red_mental" ? "granted" : consents[i],
      scoreTarget,
      absentToday: false,
      lowIncome: scenario === "amber_economic_case" || scenario === "draft_econ" || rng.chance(0.08),
      visited2568: scenario !== "none_new" && rng.chance(0.2),
      guardianUserId,
      guardianRelation: relation,
      teacherId: i % 2 === 0 ? "U-T01" : "U-T02",
    });
  }

  // พี่น้องอยู่ครัวเรือนเดียวกัน: รายได้และคำตอบความยินยอมของผู้ปกครองเหมือนกัน
  for (const [i, sibling] of siblingOf) {
    const low = profiles[i].lowIncome || profiles[sibling].lowIncome;
    profiles[i].lowIncome = low;
    profiles[sibling].lowIncome = low;
    if (profiles[i].scenario !== "red_mental") profiles[i].consent = profiles[sibling].consent;
  }

  // ไม่มาโรงเรียนวันนี้ 5 คน (ไม่ใช่คนที่มีบันทึกมาสายวันนี้)
  const absentCandidates = profiles.filter((p) => p.scenario !== "green_pending_late");
  for (const p of rng.shuffle(absentCandidates).slice(0, 5)) p.absentToday = true;

  return { students, users, guardians, enrollments, profiles };
}
