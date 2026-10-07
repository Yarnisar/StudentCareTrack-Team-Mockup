/**
 * คำนวณวันที่ของช่วงดำเนินงาน (ใช้ร่วมกันระหว่างไทม์ไลน์และการ์ดกิจกรรม)
 * วันที่ทั้งหมดเป็น พ.ศ. yyyy-mm-dd — แปลงเป็น ค.ศ. เฉพาะในฟังก์ชันของ lib/format
 */

import { addDaysThai, compareThaiDate, formatThaiDate, thaiDateOf } from "@/lib/format";
import {
  OPERATING_ACTIVITIES,
  OPERATING_ACTIVITY_LABEL,
  type AcademicTerm,
  type OperatingActivity,
  type OperatingWindow,
  type WindowStatus,
} from "@/lib/types";

const DAY_MS = 86_400_000;

/** จำนวนวันจาก a ถึง b (ติดลบถ้า b ก่อน a) */
export function daysBetween(a: string, b: string): number {
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

/** สัดส่วน 0–1 ของวันที่บนแกนภาคเรียน (นับวันสิ้นภาคเรียนทั้งวัน) */
export function termPosition(term: AcademicTerm, date: string): number {
  const span = daysBetween(term.startDate, term.endDate) + 1;
  return daysBetween(term.startDate, date) / span;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** ตำแหน่งแถบ: ซ้าย/กว้างเป็นสัดส่วน (วันปิดนับรวมทั้งวัน) */
export function barSpan(term: AcademicTerm, w: OperatingWindow): { left: number; width: number } {
  const left = clamp01(termPosition(term, w.opensAt));
  const right = clamp01(termPosition(term, addDaysThai(w.closesAt, 1)));
  return { left, width: Math.max(0.012, right - left) };
}

/** วันที่เริ่มแจ้งเตือนล่วงหน้า */
export function remindDateOf(w: OperatingWindow): string {
  return addDaysThai(w.closesAt, -w.remindDaysBefore);
}

/** วันที่ 1 ของแต่ละเดือนในภาคเรียน พร้อมป้าย เช่น "ก.พ. 70" */
export function monthTicks(term: AcademicTerm): { key: string; label: string; pos: number }[] {
  const [sy, sm] = term.startDate.split("-").map(Number);
  const [ey, em] = term.endDate.split("-").map(Number);
  const ticks: { key: string; label: string; pos: number }[] = [];
  let y = sy;
  let m = sm;
  while (y < ey || (y === ey && m <= em)) {
    const first = `${y}-${String(m).padStart(2, "0")}-01`;
    const [, mon, year] = formatThaiDate(first).split(" ");
    ticks.push({
      key: first,
      label: `${mon} ${year.slice(-2)}`,
      pos: clamp01(termPosition(term, first)),
    });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return ticks;
}

/** วันปิดของสองกิจกรรมห่างกันไม่เกินเท่านี้ ถือว่าครูต้องปิดงานชนกัน */
export const CLOSE_CLASH_DAYS = 3;

/** คำเตือนต่อกิจกรรม: วันที่อยู่นอกภาคเรียน / วันปิดใกล้กับกิจกรรมอื่น (ที่ยังไม่ปิด) */
export function windowWarnings(
  term: AcademicTerm,
  windows: Partial<Record<OperatingActivity, OperatingWindow>>,
  today: string
): Partial<Record<OperatingActivity, string[]>> {
  const out: Partial<Record<OperatingActivity, string[]>> = {};
  const add = (a: OperatingActivity, msg: string) => {
    (out[a] ??= []).push(msg);
  };
  for (const a of OPERATING_ACTIVITIES) {
    const w = windows[a];
    if (!w) continue;
    if (compareThaiDate(w.closesAt, term.endDate) > 0) {
      add(a, `วันปิดรับ ${formatThaiDate(w.closesAt)} เลยวันสิ้นภาคเรียน (${formatThaiDate(term.endDate)})`);
    }
    if (compareThaiDate(w.opensAt, term.startDate) < 0) {
      add(a, `วันเปิด ${formatThaiDate(w.opensAt)} อยู่ก่อนวันเริ่มภาคเรียน (${formatThaiDate(term.startDate)})`);
    }
  }
  for (let i = 0; i < OPERATING_ACTIVITIES.length; i++) {
    for (let j = i + 1; j < OPERATING_ACTIVITIES.length; j++) {
      const a = OPERATING_ACTIVITIES[i];
      const b = OPERATING_ACTIVITIES[j];
      const wa = windows[a];
      const wb = windows[b];
      if (!wa || !wb) continue;
      if (compareThaiDate(wa.closesAt, today) < 0 || compareThaiDate(wb.closesAt, today) < 0) continue;
      if (Math.abs(daysBetween(wa.closesAt, wb.closesAt)) <= CLOSE_CLASH_DAYS) {
        add(a, `ปิดรับใกล้กับ "${OPERATING_ACTIVITY_LABEL[b]}" (ห่างกันไม่เกิน ${CLOSE_CLASH_DAYS} วัน) ครูต้องส่งงานพร้อมกัน`);
        add(b, `ปิดรับใกล้กับ "${OPERATING_ACTIVITY_LABEL[a]}" (ห่างกันไม่เกิน ${CLOSE_CLASH_DAYS} วัน) ครูต้องส่งงานพร้อมกัน`);
      }
    }
  }
  return out;
}

/** ข้อความระยะเวลา: "เหลืออีก N วัน" / "ปิดมาแล้ว N วัน" / "เปิดในอีก N วัน" */
export function countdownText(w: OperatingWindow | undefined, today: string): string {
  if (!w) return "ยังไม่ได้กำหนดช่วงเวลา";
  if (compareThaiDate(today, w.opensAt) < 0) return `เปิดในอีก ${daysBetween(today, w.opensAt)} วัน`;
  if (compareThaiDate(today, w.closesAt) > 0) return `ปิดมาแล้ว ${daysBetween(w.closesAt, today)} วัน`;
  const left = daysBetween(today, w.closesAt);
  return left === 0 ? "ปิดรับวันนี้ (วันสุดท้าย)" : `เหลืออีก ${left} วัน`;
}

/** ร้อยละของช่วงที่ผ่านไปแล้ว (รวมวันนี้) */
export function elapsedPercent(w: OperatingWindow, today: string): number {
  const total = daysBetween(w.opensAt, w.closesAt) + 1;
  const done = daysBetween(w.opensAt, today) + 1;
  return Math.round(clamp01(done / total) * 100);
}
