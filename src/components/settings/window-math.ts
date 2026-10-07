/**
 * คำนวณตำแหน่งของช่วงดำเนินงานบนแกนภาคเรียน
 * วันที่ทั้งหมดเป็น พ.ศ. yyyy-mm-dd — แปลงเป็น ค.ศ. เฉพาะในฟังก์ชันของ lib/format
 */

import { addDaysThai, compareThaiDate, thaiDateOf } from "@/lib/format";
import type { AcademicTerm, OperatingWindow, WindowStatus } from "@/lib/types";

const DAY_MS = 86_400_000;

/** จำนวนวันจาก a ถึง b (ติดลบถ้า b ก่อน a) */
function daysBetween(a: string, b: string): number {
  return Math.round(compareThaiDate(thaiDateOf(b), thaiDateOf(a)) / DAY_MS);
}

/** สถานะที่แสดงให้แอดมิน — แยก "ใกล้ปิด" ออกจาก "เปิดอยู่" */
export type WindowPhase = "none" | "upcoming" | "open" | "closing" | "closed";

export function phaseOf(status: WindowStatus, closingSoon: boolean): WindowPhase {
  return status === "open" && closingSoon ? "closing" : status;
}

export const PHASE_LABEL: Record<WindowPhase, string> = {
  none: "ยังไม่กำหนด",
  upcoming: "ยังไม่เปิด",
  open: "เปิดอยู่",
  closing: "ใกล้ปิด",
  closed: "ปิดแล้ว",
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** สัดส่วน 0–1 ของวันที่บนแกนภาคเรียน (นับวันสิ้นภาคเรียนทั้งวัน) */
function termPosition(term: AcademicTerm, date: string): number {
  const span = daysBetween(term.startDate, term.endDate) + 1;
  return daysBetween(term.startDate, date) / span;
}

/** ตำแหน่งแถบของช่วงและเครื่องหมายวันนี้ เป็นร้อยละของภาคเรียน (วันปิดนับรวมทั้งวัน) */
export function termBar(
  term: AcademicTerm,
  w: OperatingWindow,
  today: string
): { left: number; width: number; today: number } {
  const left = clamp01(termPosition(term, w.opensAt));
  const right = clamp01(termPosition(term, addDaysThai(w.closesAt, 1)));
  return {
    left: left * 100,
    width: Math.max(1.2, (right - left) * 100),
    today: clamp01(termPosition(term, today)) * 100,
  };
}
