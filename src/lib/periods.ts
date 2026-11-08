/**
 * ช่วงเวลาเปิด–ปิดของงานในภาคเรียน (UC4 Scenario A, UC9) ที่แอดมินตั้งในหน้าตั้งค่าระบบ
 * เก็บไว้ใน store ให้หน้าตั้งค่าและหน้าภาพรวมใช้ชุดเดียวกัน หน้าภาพรวมใช้คำนวณ "ใกล้ครบกำหนด / เกินกำหนด"
 * PROTOTYPE: ค่าตั้งต้นเป็นตัวอย่างของภาคเรียนที่ 2/2569 และยังไม่ผูกกับ termId
 * Project 2: อ่านจากการตั้งค่าของโรงเรียนแยกตามปีการศึกษาและภาคเรียน
 */

import { CURRENT_TERM, DEMO_TODAY } from "./mock-data";
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

/** กลุ่มเป้าหมายของรอบ (UC9 Scenario A ข้อ 5) ไม่ระบุ = ทั้งโรงเรียน */
export type WindowTarget = { type: "school" } | { type: "level"; level: number } | { type: "room"; room: string };

export const targetLabel = (t?: WindowTarget) =>
  !t || t.type === "school" ? "ทั้งโรงเรียน" : t.type === "level" ? `ม.${t.level} ทุกห้อง` : t.room || "ยังไม่เลือกห้อง";

/** กลุ่มเป้าหมายสองกลุ่มมีนักเรียนซ้อนกันหรือไม่ (ใช้กันสร้างรอบซ้ำ) */
export function targetsOverlap(a?: WindowTarget, b?: WindowTarget): boolean {
  if (!a || !b || a.type === "school" || b.type === "school") return true;
  const levelOf = (room: string) => Number(room.slice(2, 3));
  if (a.type === "level" && b.type === "level") return a.level === b.level;
  if (a.type === "room" && b.type === "room") return a.room === b.room;
  const [lv, rm] = a.type === "level" ? [a, b as { type: "room"; room: string }] : [b as { type: "level"; level: number }, a as { type: "room"; room: string }];
  return levelOf(rm.room) === lv.level;
}

/** ห้องนี้อยู่ในกลุ่มเป้าหมายของรอบหรือไม่ (ชื่อห้องรูปแบบ "ม.3/1") */
export function windowCoversRoom(w: AssessmentWindow, roomName: string): boolean {
  const t = w.target;
  if (!t || t.type === "school") return true;
  if (t.type === "room") return t.room === roomName;
  return roomName.startsWith(`ม.${t.level}/`);
}

/** หน้าที่ผู้ตอบไปทำรอบนี้ (ใช้เป็นลิงก์ในการแจ้งเตือน) */
export const KIND_HREF: Record<AssessmentKind, string> = {
  screening: "/screening",
  red_flag: "/screening",
  nine_s: "/screening",
  sdq: "/assessment",
  eq: "/assessment",
  home_visit: "/home-visits",
};

/** แจ้งว่าเปิดรอบ ภายในกี่วันหลังวันเปิด (ต้นแบบ) */
export const OPEN_NOTICE_DAYS = 7;

/** รอบนี้ควรแจ้ง "เปิดรอบ" หรือ "ใกล้ปิดรอบ" ตอนนี้หรือไม่ (UC9 Scenario A ข้อ 14, Alternate Flow-B) */
export function windowNotice(w: AssessmentWindow, today: string = DEMO_TODAY): "opened" | "closing" | null {
  if (!w.enabled || windowStatus(w, today) !== "open") return null;
  if (daysBetween(w.closeDate, today) * -1 <= w.remindDaysBefore) return "closing";
  if (daysBetween(w.openDate, today) <= OPEN_NOTICE_DAYS) return "opened";
  return null;
}

export interface AssessmentWindow {
  id: string;
  /** ภาคเรียนของรอบ ไม่ระบุ = ภาคเรียนปัจจุบัน */
  termId?: string;
  target?: WindowTarget;
  kind: AssessmentKind;
  /** เยี่ยมบ้าน: ระยะเวลารอนักเรียนหรือผู้ปกครองยืนยันผลการเยี่ยม ค่าเริ่มต้น 3 วัน (UC4 Scenario A ข้อ 4) */
  confirmWaitDays?: number;
  /** เยี่ยมบ้าน: วันปิดแก้ไขผลที่ส่งแล้ว (UC5 สถานการณ์ B ข้อ 3) */
  editCloseDate?: string;
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
    openDate: "2570-02-01",
    closeDate: "2570-03-13",
    enabled: true,
    lockAfterClose: true,
    remindDaysBefore: 7,
    raters: ["teacher"],
  },
  {
    id: "W2",
    kind: "red_flag",
    label: "ประเมิน Red Flag (กลุ่มเสี่ยง/มีปัญหา)",
    openDate: "2570-02-01",
    closeDate: "2570-03-13",
    enabled: true,
    lockAfterClose: true,
    remindDaysBefore: 3,
    raters: ["teacher"],
  },
  {
    id: "W3",
    kind: "nine_s",
    label: "ประเมิน 9S",
    openDate: "2570-02-01",
    closeDate: "2570-03-13",
    enabled: true,
    lockAfterClose: true,
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
    label: "ประเมิน EQ",
    openDate: "2570-02-10",
    closeDate: "2570-03-15",
    enabled: true,
    lockAfterClose: true,
    remindDaysBefore: 5,
    raters: ["student"], // มัธยม: นักเรียนประเมินตนเอง
  },
  {
    id: "W7",
    kind: "home_visit",
    label: "รอบเยี่ยมบ้าน",
    confirmWaitDays: 3,
    editCloseDate: "2570-03-27",
    openDate: "2569-12-01",
    closeDate: "2570-03-20",
    enabled: true,
    lockAfterClose: true,
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
  round?: 1 | 2,
  /** ระบุห้อง = เฉพาะรอบที่กลุ่มเป้าหมายครอบคลุมห้องนั้น */
  roomName?: string
): AssessmentWindow | undefined {
  const candidates = windows.filter(
    (w) =>
      w.enabled &&
      w.kind === kind &&
      (round === undefined || w.round === round) &&
      (w.termId ?? CURRENT_TERM.termId) === CURRENT_TERM.termId &&
      (roomName === undefined || windowCoversRoom(w, roomName))
  );
  return (
    candidates.find((w) => windowStatus(w) === "open") ??
    [...candidates].sort((a, b) => b.closeDate.localeCompare(a.closeDate))[0]
  );
}

/** พ้นวันปิด → แบบฟอร์มปิดรับ แก้ไขและส่งไม่ได้ (UC6 Alt-F, UC9 ไม่มีตัวเลือกให้บันทึกย้อนหลัง) */
export const isLocked = (w: AssessmentWindow, today: string = DEMO_TODAY) =>
  windowStatus(w, today) === "closed" && w.lockAfterClose;

/** ช่วงเวลาของงานชนิดนี้ที่ปิดรับแล้ว ไม่มี = ยังส่งได้ (เปิดอยู่ ส่งช้าได้ หรือยังไม่ตั้งช่วงเวลา) */
export function lockedWindowFor(windows: AssessmentWindow[], kind: AssessmentKind, round?: 1 | 2) {
  const w = windowFor(windows, kind, round);
  return w && isLocked(w) ? w : undefined;
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
