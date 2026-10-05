import { DEMO_TODAY } from "./mock-data/core";

const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

/**
 * รับสตริงวันที่แบบ "2570-02-16" หรือ "2570-02-16T07:52:00" (ปี พ.ศ.)
 * แล้วแปลงเป็นข้อความภาษาไทย
 */
export function formatThaiDate(value: string): string {
  const [datePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return value;
  return `${day} ${THAI_MONTHS_SHORT[month - 1]} ${year}`;
}

export function formatThaiTime(value: string): string {
  const timePart = value.split("T")[1];
  if (!timePart) return "";
  const [h, m] = timePart.split(":");
  return `${h}:${m} น.`;
}

export function formatThaiDateTime(value: string): string {
  const time = formatThaiTime(value);
  return time ? `${formatThaiDate(value)} · ${time}` : formatThaiDate(value);
}

/**
 * วันเวลาที่ใช้บันทึกข้อมูลในต้นแบบ
 * ใช้วันที่อ้างอิงของต้นแบบ (DEMO_TODAY) ร่วมกับเวลาจริงของเครื่อง
 * หรือเวลาที่จำลองไว้ (รูปแบบ HH:MM) สำหรับการสาธิต
 */
export function nowThaiIso(simulatedTime?: string): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = simulatedTime
    ? `${simulatedTime}:00`
    : `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return `${DEMO_TODAY}T${time}`;
}

export function initialOf(fullName: string): string {
  const stripped = fullName.replace(/^(ด\.ช\.|ด\.ญ\.|นาย|นาง|นางสาว)\s*/, "");
  return stripped.charAt(0) || "?";
}

export function formatBaht(value: number): string {
  return value.toLocaleString("th-TH");
}

/* ------------------------------------------------------------------ */
/* การคำนวณวันเวลา (ปี พ.ศ.)                                            */
/* ทุกค่ายังเป็นสตริง พ.ศ. — แปลงเป็น Date (ค.ศ., UTC) เฉพาะตอนคำนวณ     */
/* ------------------------------------------------------------------ */

const pad2 = (n: number) => String(n).padStart(2, "0");

/** แปลงสตริง พ.ศ. ("2570-02-16" หรือ "2570-02-16T07:52:00") เป็น Date แบบ UTC */
function thaiToUtc(value: string): Date {
  const [datePart, timePart = "00:00:00"] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh = 0, mm = 0, ss = 0] = timePart.split(":").map(Number);
  return new Date(Date.UTC(y - 543, m - 1, d, hh, mm, ss));
}

/** แปลง Date (UTC) กลับเป็นสตริง พ.ศ. — withTime=false คืนเฉพาะวันที่ */
function utcToThai(date: Date, withTime: boolean): string {
  const day = `${date.getUTCFullYear() + 543}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
  if (!withTime) return day;
  return `${day}T${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}:${pad2(date.getUTCSeconds())}`;
}

/** วันที่ของสตริงวันเวลา พ.ศ. ("2570-02-16T07:52:00" → "2570-02-16") */
export function thaiDateOf(value: string): string {
  return value.split("T")[0];
}

/**
 * เปรียบเทียบวันเวลา พ.ศ. 2 ค่า: < 0 ถ้า a ก่อน b, 0 ถ้าเท่ากัน, > 0 ถ้า a หลัง b
 * ค่าที่มีแค่วันที่ถือเป็นเวลา 00:00:00 ของวันนั้น
 */
export function compareThaiDate(a: string, b: string): number {
  return thaiToUtc(a).getTime() - thaiToUtc(b).getTime();
}

export function isBeforeThai(a: string, b: string): boolean {
  return compareThaiDate(a, b) < 0;
}

export function isAfterThai(a: string, b: string): boolean {
  return compareThaiDate(a, b) > 0;
}

/** อยู่ในช่วง [start, end] โดยเทียบเฉพาะวันที่ (รวมวันแรกและวันสุดท้าย) */
export function isWithinThaiDates(value: string, start: string, end: string): boolean {
  const day = thaiDateOf(value);
  return compareThaiDate(day, thaiDateOf(start)) >= 0 && compareThaiDate(day, thaiDateOf(end)) <= 0;
}

/** บวกชั่วโมง เช่น addHoursThai(createdAt, 24) สำหรับกฎ "แก้ไขได้ภายใน 24 ชั่วโมง" */
export function addHoursThai(value: string, hours: number): string {
  const d = thaiToUtc(value);
  d.setUTCHours(d.getUTCHours() + hours);
  return utcToThai(d, true);
}

/** บวกจำนวนวัน (ติดลบได้) คืนเฉพาะวันที่ */
export function addDaysThai(value: string, days: number): string {
  const d = thaiToUtc(thaiDateOf(value));
  d.setUTCDate(d.getUTCDate() + days);
  return utcToThai(d, false);
}

/** วันทำการ = จันทร์–ศุกร์ (ต้นแบบยังไม่รวมวันหยุดนักขัตฤกษ์) */
export function isBusinessDayThai(value: string): boolean {
  const dow = thaiToUtc(thaiDateOf(value)).getUTCDay();
  return dow !== 0 && dow !== 6;
}

/**
 * บวกวันทำการ คืนเฉพาะวันที่ เช่น addBusinessDaysThai("2570-02-12", 3) → "2570-02-17"
 * (ศุกร์ + 3 วันทำการ = พุธ)
 */
export function addBusinessDaysThai(value: string, days: number): string {
  let day = thaiDateOf(value);
  let remaining = days;
  while (remaining > 0) {
    day = addDaysThai(day, 1);
    if (isBusinessDayThai(day)) remaining -= 1;
  }
  return day;
}

/**
 * จำนวนวันทำการที่ผ่านไปตั้งแต่ from ถึง to (ไม่นับวันของ from นับวันของ to)
 * เช่น ศุกร์ → พุธถัดไป = 3
 */
export function businessDaysBetweenThai(from: string, to: string): number {
  let day = thaiDateOf(from);
  const end = thaiDateOf(to);
  let count = 0;
  while (compareThaiDate(day, end) < 0) {
    day = addDaysThai(day, 1);
    if (isBusinessDayThai(day)) count += 1;
  }
  return count;
}
