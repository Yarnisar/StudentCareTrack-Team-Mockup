import { DEMO_TODAY } from "./mock-data";

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

/** ซ่อนเลขบัตรประชาชนทุกหลัก คงรูปแบบและตัวขีดไว้ (ข้อ 2.1.10) เช่น 1-1037-00123-45-6 → x-xxxx-xxxxx-xx-x */
export function maskCitizenId(value: string): string {
  return value.replace(/\d/g, "x");
}

export function formatBaht(value: number): string {
  return value.toLocaleString("th-TH");
}
