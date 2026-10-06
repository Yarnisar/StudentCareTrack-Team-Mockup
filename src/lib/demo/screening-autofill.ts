/**
 * ชุดรายการตัวอย่างสำหรับปุ่ม "กรอกอัตโนมัติ" ของแบบคัดกรอง
 * ดึง id จาก SCREENING_ITEMS ตามระดับ/มิติ และไม่เลือกรายการที่ระบบกำหนดเอง (derived)
 */

import { SCREENING_ITEMS } from "@/lib/rules";
import type { ScreeningDimension } from "@/lib/types";

export type ScreeningDemoTarget = "normal" | "risk" | "problem";

function manualIds(dimension: ScreeningDimension, severity: "risk" | "problem"): string[] {
  return SCREENING_ITEMS.filter(
    (i) => i.dimension === dimension && i.severity === severity && !i.derived
  ).map((i) => i.id);
}

/** รายการที่ติ๊กเองได้ของแต่ละแบบ: ปกติ = ไม่ติ๊ก / เสี่ยง = เกณฑ์เสี่ยงในมิติการเรียนและเศรษฐกิจ / มีปัญหา = เสี่ยงในมิติเรียน + เกณฑ์มีปัญหา 1 ข้อในมิติสวัสดิภาพ */
export function screeningItemIdsFor(target: ScreeningDemoTarget): string[] {
  if (target === "normal") return [];
  const risk = [...manualIds("academic", "risk"), ...manualIds("economic", "risk")];
  if (target === "risk") return risk;
  return [...manualIds("academic", "risk").slice(0, 1), ...manualIds("welfare", "problem").slice(0, 1)];
}
