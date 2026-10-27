/**
 * ช่วงเวลาเปิด–ปิดของแต่ละกระบวนการในภาคเรียน (UC8)
 * PROTOTYPE: ค่าตัวอย่างจนกว่าจะมีหน้าตั้งค่าช่วงเวลา หน้าภาพรวมใช้คำนวณ "ใกล้ครบกำหนด / เกินกำหนด"
 * Project 2: อ่านจากการตั้งค่าของโรงเรียนในแต่ละภาคเรียน
 */

import { DEMO_TODAY } from "./mock-data";

/** กระบวนการที่มีรอบกำหนด (การติดตามช่วยเหลือใช้วันเป้าหมายของแต่ละ case, ความประพฤติไม่มีรอบ) */
export type PeriodProcess = "screening" | "assessment" | "home_visit";

export interface ProcessPeriod {
  opensAt: string;
  closesAt: string;
}

export const PROCESS_PERIODS: Record<string, Record<PeriodProcess, ProcessPeriod>> = {
  "T2569-2": {
    screening: { opensAt: "2569-11-01", closesAt: "2570-02-28" },
    assessment: { opensAt: "2569-11-15", closesAt: "2570-02-13" },
    home_visit: { opensAt: "2569-12-01", closesAt: "2570-03-20" },
  },
};

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
