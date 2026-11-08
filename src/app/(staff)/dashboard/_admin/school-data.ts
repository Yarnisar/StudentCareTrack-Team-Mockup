/**
 * PROTOTYPE ONLY — ข้อมูลจำลองขนาดโรงเรียนจริง สำหรับภาพรวมของแอดมินเท่านั้น
 *
 * ข้อมูลตัวอย่างจริงในระบบมีนักเรียนแค่ 8 คนห้องเดียว ซึ่งน้อยเกินกว่าจะเห็นปัญหาของมุมมองทั้งโรงเรียน
 * ไฟล์นี้จึงสร้างนักเรียน ~1,500 คนตามสมมติฐานโรงเรียนขนาดกลาง สุ่มแบบมีเมล็ดคงที่ ตัวเลขจึงเท่าเดิมทุกครั้ง
 * นักเรียนไม่เชื่อมกับ store — ทำงานในหน้าอื่นแล้วตัวเลขตรงนี้ไม่เปลี่ยน (หน้าจอบอกผู้ใช้ไว้)
 * แต่วันครบกำหนดคำนวณจากช่วงเวลาในหน้าตั้งค่า (store.assessmentWindows) ชุดเดียวกับภาพรวมของครู
 * Project 2: แทนด้วย API สรุปรายห้องจาก backend
 */

import { DEMO_TODAY } from "@/lib/mock-data";
import { dueStatus, KIND_LABEL, shiftDate, windowFor, type AssessmentKind, type AssessmentWindow } from "@/lib/periods";
import type { CaseUrgency } from "@/lib/types";
import {
  PROCESS_KINDS,
  PROCESS_ORDER,
  type ProcessKey,
  type ProcessSummary,
  type Status,
} from "../_homeroom/process-status";

export const LEVELS = [1, 2, 3, 4, 5, 6];
export const ROOMS_PER_LEVEL = 8;

/** ห้องของครูประจำชั้นในข้อมูลตัวอย่าง (ชื่อครูให้ตรงกับบัญชี demo) */
const MY_ROOM = "ม.3/1";

export type Risk = "green" | "amber" | "red";

export interface ProtoStudent {
  id: string;
  name: string;
  level: number;
  room: string;
  classNo: number;
  /** ขั้นที่ทำถึงในการคัดกรอง: six = ทำ 6 มิติแล้ว เหลือ Red Flag, red_flag = Red Flag ปกติ เหลือ 9S */
  screening: "none" | "six" | "red_flag" | "done";
  risk: Risk | null;
  /** SDQ ที่ระบบเปิดให้ทำ (none = ไม่ต้องทำ) */
  sdq: "none" | "pending" | "done";
  visited: boolean;
  care: { status: "active" | "closed"; urgency: CaseUrgency; nextFollowupDate: string } | null;
  behaviorRecords: number;
  behaviorWatch: boolean;
}

export interface Room {
  room: string;
  level: number;
  teacher: string;
  total: number;
}

/** สุ่มแบบมีเมล็ด (mulberry32) เพื่อให้ผลเหมือนเดิมทุกครั้งที่เปิดหน้า */
function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = [
  "ณัฐวุฒิ", "ปาริชาต", "ธนกร", "ศิรประภา", "กิตติพงษ์", "อรอนงค์", "ชนาธิป", "พิมพ์ชนก",
  "ภาณุพงศ์", "สุพรรษา", "วรากร", "เบญจวรรณ", "อนุชา", "จิราพร", "ธีรภัทร", "กัญญา",
  "ศุภกร", "นภัสสร", "พีรพัฒน์", "ชลธิชา", "อดิศร", "วิภาวี", "ณภัทร", "รติมา",
];

const LAST_NAMES = [
  "ใจงาม", "ศรีสุข", "ทองดี", "วงศ์สว่าง", "แก้วมณี", "พันธุ์ดี", "รักเรียน", "บุญมาก",
  "สุขสันต์", "ตั้งมั่น", "เจริญพร", "อินทร์ทอง", "มีชัย", "สายทอง", "ดวงแก้ว", "พรหมมา",
];

const TEACHER_FIRST = ["สมชาย", "สมหญิง", "วราภรณ์", "ประยุทธ", "อัจฉรา", "ธนพล", "ศิริพร", "กมล"];
const TEACHER_LAST = ["ใจดี", "รอบรู้", "สอนดี", "ตั้งใจ", "พากเพียร", "มุ่งมั่น", "อบรม", "ปัญญา"];

function buildSchool() {
  const rnd = seeded(2569);
  const pick = <T,>(list: T[]) => list[Math.floor(rnd() * list.length)];
  const students: ProtoStudent[] = [];
  const rooms: Room[] = [];
  let running = 0;

  for (const level of LEVELS) {
    for (let r = 1; r <= ROOMS_PER_LEVEL; r++) {
      const room = `ม.${level}/${r}`;
      const total = 28 + Math.floor(rnd() * 8); // 28–35 คนต่อห้อง
      const teacher = room === MY_ROOM ? "ครูสมหญิง ใจดี" : `ครู${pick(TEACHER_FIRST)} ${pick(TEACHER_LAST)}`;
      rooms.push({ room, level, teacher, total });

      // ความคืบหน้าของแต่ละห้องไม่เท่ากัน บางห้องแทบยังไม่เริ่ม
      const pace = rnd() < 0.12 ? rnd() * 0.35 : 0.65 + rnd() * 0.35;

      for (let n = 1; n <= total; n++) {
        running += 1;
        const roll = rnd();
        const screening: ProtoStudent["screening"] =
          roll < pace ? "done" : roll < pace + (1 - pace) * 0.3 ? "red_flag" : roll < pace + (1 - pace) * 0.55 ? "six" : "none";

        let risk: Risk | null = null;
        if (screening !== "none") {
          const r2 = rnd();
          risk = r2 < 0.74 ? "green" : r2 < 0.92 ? "amber" : "red";
        }

        const needsSdq = screening === "done" && risk !== "green" && risk !== null;
        const sdq: ProtoStudent["sdq"] = !needsSdq ? "none" : rnd() < pace * 0.8 ? "done" : "pending";

        let care: ProtoStudent["care"] = null;
        const caseRoll = rnd();
        if ((risk === "red" && caseRoll < 0.7) || (risk === "amber" && caseRoll < 0.15)) {
          care = {
            status: rnd() < 0.15 ? "closed" : "active",
            urgency: risk === "red" ? "urgent" : rnd() < 0.5 ? "urgent" : "normal",
            nextFollowupDate: shiftDate(DEMO_TODAY, Math.floor(rnd() * 45) - 12),
          };
        }

        const behaviorRecords = Math.floor(rnd() * rnd() * 6);
        students.push({
          id: String(30000 + running),
          name: `${rnd() < 0.5 ? "ด.ช." : "ด.ญ."} ${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
          level,
          room,
          classNo: n,
          screening,
          risk,
          sdq,
          visited: rnd() < 0.1 + pace * 0.55,
          care,
          behaviorRecords,
          behaviorWatch: behaviorRecords >= 4 && rnd() < 0.5,
        });
      }
    }
  }

  return { students, rooms };
}

const SCHOOL = buildSchool();

export const allStudents = SCHOOL.students;
export const allRooms = SCHOOL.rooms;

export interface AdminItem {
  student: ProtoStudent;
  process: ProcessKey;
  status: Status;
  detail: string;
  due?: string;
}

const SCREENING_STEP: Record<Exclude<ProtoStudent["screening"], "done">, { kind: AssessmentKind; detail: string }> = {
  none: { kind: "screening", detail: "ยังไม่ได้คัดกรอง" },
  six: { kind: "red_flag", detail: "เหลือ Red Flag" },
  red_flag: { kind: "nine_s", detail: "เหลือ 9S" },
};

/** แปลงสถานะของนักเรียนจำลองเป็นรายการงาน เหมือน processStatus() ของครูประจำชั้น */
export function adminItems(students: ProtoStudent[], windows: AssessmentWindow[]): AdminItem[] {
  const items: AdminItem[] = [];
  const open = (student: ProtoStudent, process: ProcessKey, kind: AssessmentKind, detail: string) => {
    const due = windowFor(windows, kind)?.closeDate;
    items.push({ student, process, status: dueStatus(due), detail, due });
  };

  for (const s of students) {
    if (s.screening === "done") items.push({ student: s, process: "screening", status: "done", detail: "คัดกรองครบ" });
    else open(s, "screening", SCREENING_STEP[s.screening].kind, SCREENING_STEP[s.screening].detail);

    if (s.sdq === "done") items.push({ student: s, process: "assessment", status: "done", detail: "SDQ ครบ" });
    else if (s.sdq === "pending") open(s, "assessment", "sdq", "SDQ ยังไม่ครบ");

    if (s.visited) items.push({ student: s, process: "home_visit", status: "done", detail: "เยี่ยมบ้านแล้ว" });
    else open(s, "home_visit", "home_visit", "ยังไม่ได้เยี่ยมบ้าน");

    if (s.care?.status === "closed") {
      items.push({ student: s, process: "care", status: "done", detail: "ปิดกรณีแล้ว" });
    } else if (s.care) {
      items.push({
        student: s,
        process: "care",
        status: dueStatus(s.care.nextFollowupDate),
        detail: "กรณีกำลังดำเนินการ",
        due: s.care.nextFollowupDate,
      });
    } else if (s.risk === "red") {
      items.push({ student: s, process: "care", status: "pending", detail: "กลุ่มมีปัญหายังไม่มีกรณี" });
    }

    if (s.behaviorWatch) {
      items.push({ student: s, process: "behavior", status: "watch", detail: "ถึงเกณฑ์เฝ้าระวัง" });
    }
  }
  return items;
}

/** สรุป 5 กระบวนการในรูปแบบเดียวกับภาพรวมของครู ตารางจึงใช้ส่วนแสดงผลชุดเดียวกัน */
export function adminSummaries(
  items: AdminItem[],
  students: ProtoStudent[],
  windows: AssessmentWindow[]
): ProcessSummary[] {
  return PROCESS_ORDER.map((process) => {
    const own = items.filter((i) => i.process === process);
    const counts = { done: 0, pending: 0, near_due: 0, overdue: 0, watch: 0 };
    for (const i of own) counts[i.status]++;
    return {
      process,
      closes: windows
        .filter((w) => w.enabled && (PROCESS_KINDS[process] ?? []).includes(w.kind))
        .map((w) => ({
          id: w.id,
          label: KIND_LABEL[w.kind] + (w.round ? ` รอบ ${w.round}` : ""),
          date: w.closeDate,
          locked: w.lockAfterClose,
        })),
      actionable: 0,
      waiting: 0,
      counts,
      total: process === "behavior" ? students.length : own.length,
      unit: process === "care" ? "รายการ" : "คน",
      recorded: process === "behavior" ? students.reduce((sum, s) => sum + s.behaviorRecords, 0) : undefined,
    };
  });
}

export function riskCounts(students: ProtoStudent[]) {
  return {
    green: students.filter((s) => s.risk === "green").length,
    amber: students.filter((s) => s.risk === "amber").length,
    red: students.filter((s) => s.risk === "red").length,
  };
}
