/**
 * การแสดงผลคัดกรอง (UC6): 5 มิติแรกจัดกลุ่ม เขียว/เหลือง/แดง ส่วนมิติที่ 6 สุขภาพจิตไม่ใช้สี
 * บันทึกเป็น "ควรดูแล" หรือ "ไม่ต้องดูแลเพิ่ม" จากผล Red Flag และ 9S และมีสถานะ "รอประเมินสุขภาพจิต" ระหว่างทำ
 */

import type { ScreeningResult } from "./types";

export type MentalStatus = "pending" | "needs_care" | "no_more_care";

export const MENTAL_STATUS_LABEL: Record<MentalStatus, string> = {
  pending: "รอประเมินสุขภาพจิต",
  needs_care: "ควรดูแล",
  no_more_care: "ไม่ต้องดูแลเพิ่ม",
};

/** ผลที่จัดกลุ่มด้วยสี = 5 มิติแรก (ไม่รวมสุขภาพจิต) */
export const colorResults = (results: ScreeningResult[]) => results.filter((r) => r.dimension !== "mental");
