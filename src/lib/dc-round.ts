/**
 * รอบประเมินคุณลักษณะอันพึงประสงค์ของแต่ละภาคเรียน (UC12)
 * ผู้ดูแลระบบกำหนดเกณฑ์พิจารณารายข้อ วิธีสรุปผลรวม และวันปิดส่งผล แล้วเปิดใช้ให้ครูที่ปรึกษาประเมิน (UC13)
 * ระดับผลใช้ ดีเยี่ยม / ดี / ผ่าน / ไม่ผ่าน ตามหลักสูตรแกนกลาง 2551 (ข้อ 3)
 */

import type { DcLevel } from "./types";

export type DcSummaryMethod = "min" | "mode" | "average";

export const DC_SUMMARY_METHOD_LABEL: Record<DcSummaryMethod, string> = {
  min: "ใช้ระดับที่ต่ำที่สุดของทุกข้อ",
  mode: "ใช้ระดับที่พบมากที่สุด (ฐานนิยม)",
  average: "ใช้ค่าเฉลี่ยปัดเศษ",
};

export interface DcRound {
  termId: string;
  termLabel: string;
  /** เกณฑ์พิจารณาของแต่ละข้อ (criteriaId -> ข้อความ) */
  criteria: Record<number, string>;
  method: DcSummaryMethod;
  /** วันปิดส่งผล (พ.ศ. yyyy-mm-dd) */
  deadline: string;
  status: "draft" | "open";
  /** ประวัติการเลื่อนวันปิดส่งผลหลังรอบมีผลแล้ว (ข้อเสนอแก้ Scenario B ข้อ 4 และ Alt-A) */
  deadlineChanges?: { from: string; to: string; reason: string; at: string }[];
}

/**
 * ค่าตั้งต้นของเกณฑ์ เรียบเรียงจากตัวชี้วัดคุณลักษณะอันพึงประสงค์ในหลักสูตรแกนกลาง 2551 [13]
 * PROTOTYPE: โรงเรียนปรับข้อความได้
 */
export const DEFAULT_DC_CRITERIA: Record<number, string> = {
  1: "ยืนตรงเคารพธงชาติ ร้องเพลงชาติ เข้าร่วมกิจกรรมทางศาสนาและวันสำคัญของชาติ",
  2: "ประพฤติตรงตามความเป็นจริงทั้งกาย วาจา ใจ ไม่ลอกงาน ไม่นำของผู้อื่นมาเป็นของตน",
  3: "ปฏิบัติตามข้อตกลงและระเบียบของโรงเรียน ตรงต่อเวลา",
  4: "ตั้งใจเรียน เข้าร่วมกิจกรรมการเรียนรู้ และแสวงหาความรู้จากแหล่งต่าง ๆ",
  5: "ใช้ทรัพย์สินและสิ่งของอย่างประหยัดคุ้มค่า วางแผนการใช้จ่าย",
  6: "ตั้งใจและรับผิดชอบในงานที่ได้รับมอบหมาย ทำงานจนสำเร็จ",
  7: "ใช้ภาษาไทยถูกต้อง มีสัมมาคารวะ ร่วมสืบสานวัฒนธรรมไทย",
  8: "ช่วยเหลือผู้อื่นโดยไม่หวังผลตอบแทน ร่วมกิจกรรมที่เป็นประโยชน์ต่อส่วนรวม",
};

/** สรุปผลรวมตามวิธีของรอบ: ทุกวิธีถือว่าไม่ผ่านถ้ามีข้อใดไม่ผ่าน (ต้องผ่านทุกด้าน, 2.1.6) */
export function summarizeDc(values: (DcLevel | null | undefined)[], method: DcSummaryMethod): DcLevel | null {
  if (values.length === 0 || values.some((v) => v == null)) return null;
  const levels = values as DcLevel[];
  if (levels.includes(0)) return 0;
  if (method === "min") return Math.min(...levels) as DcLevel;
  if (method === "average") return Math.round(levels.reduce<number>((a, b) => a + b, 0) / levels.length) as DcLevel;
  // ฐานนิยม: เท่ากันให้ใช้ระดับที่ต่ำกว่า
  const count = new Map<DcLevel, number>();
  for (const l of levels) count.set(l, (count.get(l) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
}

/** ตรวจข้อมูลก่อนบันทึก (Alt-B) คืนข้อความที่ต้องแก้ */
export function validateDcRound(r: DcRound, today: string, criteriaIds: number[]): string[] {
  const errors: string[] = [];
  const empty = criteriaIds.filter((id) => !r.criteria[id]?.trim());
  if (empty.length > 0) errors.push(`ยังไม่ได้กำหนดเกณฑ์ข้อ ${empty.join(", ")}`);
  if (!r.deadline) errors.push("ยังไม่ได้กำหนดวันปิดส่งผล");
  else if (r.deadline <= today) errors.push("วันปิดส่งผลต้องหลังวันนี้");
  return errors;
}
