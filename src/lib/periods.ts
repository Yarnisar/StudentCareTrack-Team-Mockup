/**
 * ช่วงเวลาเปิด–ปิดของงานในภาคเรียน (UC4 Scenario A, UC9) ที่แอดมินตั้งในหน้าตั้งค่าระบบ
 * เก็บไว้ใน store ให้หน้าตั้งค่าและหน้าภาพรวมใช้ชุดเดียวกัน หน้าภาพรวมใช้คำนวณ "ใกล้ครบกำหนด / เกินกำหนด"
 * PROTOTYPE: ค่าตั้งต้นเป็นตัวอย่างของภาคเรียนที่ 2/2569 และยังไม่ผูกกับ termId
 * Project 2: อ่านจากการตั้งค่าของโรงเรียนแยกตามปีการศึกษาและภาคเรียน
 */

import { DEMO_TODAY } from "./mock-data";
import type { SdqRater } from "./types";

export type AssessmentKind = "screening" | "red_flag" | "nine_s" | "sdq" | "eq" | "home_visit";

export const KIND_LABEL: Record<AssessmentKind, string> = {
  screening: "คัดกรอง 6 มิติ",
  red_flag: "Red Flag",
  nine_s: "9S",
  sdq: "SDQ",
  eq: "EQ",
  home_visit: "เยี่ยมบ้าน",
};

export interface AssessmentWindow {
  id: string;
  kind: AssessmentKind;
  /** เยี่ยมบ้าน: ระยะเวลารอนักเรียนหรือผู้ปกครองยืนยันผลการเยี่ยม ค่าเริ่มต้น 3 วัน (UC4 Scenario A ข้อ 4) */
  confirmWaitDays?: number;
  label: string;
  round?: 1 | 2;
  /** วันเปิดให้ทำ (พ.ศ. yyyy-mm-dd) */
  openDate: string;
  /** วันปิดรับ */
  closeDate: string;
  enabled: boolean;
  /** ปิดรอบแล้วห้ามบันทึกย้อนหลัง */
  lockAfterClose: boolean;
  /** แจ้งเตือนล่วงหน้ากี่วันก่อนปิด */
  remindDaysBefore: number;
  /** ผู้ที่ต้องทำแบบประเมินรอบนี้ */
  raters: SdqRater[];
}

export const INITIAL_WINDOWS: AssessmentWindow[] = [
  {
    id: "W1",
    kind: "screening",
    label: "คัดกรองนักเรียน 6 มิติ",
    openDate: "2569-11-01",
    closeDate: "2569-11-30",
    enabled: true,
    lockAfterClose: true,
    remindDaysBefore: 7,
    raters: ["teacher"],
  },
  {
    id: "W2",
    kind: "red_flag",
    label: "ประเมิน Red Flag (กลุ่มเสี่ยง/มีปัญหา)",
    openDate: "2569-12-01",
    closeDate: "2569-12-15",
    enabled: true,
    lockAfterClose: true,
    remindDaysBefore: 3,
    raters: ["teacher"],
  },
  {
    id: "W3",
    kind: "nine_s",
    label: "ประเมิน 9S",
    openDate: "2569-12-16",
    closeDate: "2569-12-31",
    enabled: true,
    lockAfterClose: false,
    remindDaysBefore: 3,
    raters: ["teacher"],
  },
  {
    id: "W4",
    kind: "sdq",
    label: "SDQ รอบที่ 1",
    round: 1,
    openDate: "2570-01-05",
    closeDate: "2570-01-31",
    enabled: true,
    lockAfterClose: true,
    remindDaysBefore: 7,
    raters: ["teacher", "student", "parent"],
  },
  {
    id: "W5",
    kind: "sdq",
    label: "SDQ รอบที่ 2",
    round: 2,
    openDate: "2570-02-10",
    closeDate: "2570-02-28",
    enabled: true,
    lockAfterClose: true,
    remindDaysBefore: 7,
    raters: ["teacher", "student", "parent"],
  },
  {
    id: "W6",
    kind: "eq",
    label: "ประเมิน EQ ปลายภาค",
    openDate: "2570-03-01",
    closeDate: "2570-03-15",
    enabled: false,
    lockAfterClose: false,
    remindDaysBefore: 5,
    raters: ["teacher", "student"],
  },
  {
    id: "W7",
    kind: "home_visit",
    label: "รอบเยี่ยมบ้าน",
    confirmWaitDays: 3,
    openDate: "2569-12-01",
    closeDate: "2570-03-20",
    enabled: true,
    lockAfterClose: false,
    remindDaysBefore: 14,
    raters: ["teacher"],
  },
];

export type WindowStatus = "disabled" | "upcoming" | "open" | "closed";

export function windowStatus(w: AssessmentWindow, today: string = DEMO_TODAY): WindowStatus {
  if (!w.enabled) return "disabled";
  if (today < w.openDate) return "upcoming";
  if (today > w.closeDate) return "closed";
  return "open";
}

/**
 * ช่วงเวลาที่ใช้กับงานชนิดนี้ (เฉพาะที่เปิดใช้งาน) — ถ้ามีหลายรอบ เลือกรอบที่เปิดอยู่ก่อน ไม่งั้นเอารอบที่ปิดล่าสุด
 * ไม่มี = แอดมินยังไม่ได้ตั้งช่วงเวลา งานนั้นจึงไม่มีวันครบกำหนด
 */
export function windowFor(
  windows: AssessmentWindow[],
  kind: AssessmentKind,
  round?: 1 | 2
): AssessmentWindow | undefined {
  const candidates = windows.filter((w) => w.enabled && w.kind === kind && (round === undefined || w.round === round));
  return (
    candidates.find((w) => windowStatus(w) === "open") ??
    [...candidates].sort((a, b) => b.closeDate.localeCompare(a.closeDate))[0]
  );
}

/** บวก/ลบวันบนสตริงวันที่ พ.ศ. */
export function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y - 543, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getUTCFullYear() + 543}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** เหลือเวลาไม่เกินกี่วันจึงถือว่า "ใกล้ครบกำหนด" — PROTOTYPE: ยังไม่ได้ตกลงกับทีม */
export const NEAR_DUE_DAYS = 14;

export type DueStatus = "pending" | "near_due" | "overdue";

export const daysBetween = (from: string, to: string) =>
  Math.floor((Date.parse(to.slice(0, 10)) - Date.parse(from.slice(0, 10))) / 86_400_000);

/** สถานะของงานที่ยังไม่เสร็จ เทียบวันครบกำหนดกับวันนี้ */
export function dueStatus(dueDate: string | undefined, today = DEMO_TODAY): DueStatus {
  if (!dueDate) return "pending";
  const left = daysBetween(today, dueDate);
  if (left < 0) return "overdue";
  if (left <= NEAR_DUE_DAYS) return "near_due";
  return "pending";
}
