/**
 * กฎจำแนกเหตุเปิด case (CONTEXT.md: เหตุเปิด case) — pure function
 *
 * - ผลรายมิติที่ระบบคำนวณ "มีปัญหา", Red Flag ควรดูแล, ผล SDQ รวม "มีปัญหา" → auto (ระบบเปิด case ให้)
 * - "เสี่ยง" หรือคะแนนความประพฤติต่ำกว่า behavior_alert_score → suggest (ระบบแค่แนะนำ)
 * - "ปกติ" → ไม่มีเหตุ (null)
 *
 * ผู้เรียก (บันทึกคัดกรอง / Red Flag / SDQ) ใช้ผลที่ได้ส่งต่อให้ store.raiseTrigger(...)
 */

import type { RiskGroup, TriggerMode } from "./types";

/** ผลคัดกรองรายมิติ (ใช้ผลที่ระบบคำนวณ ไม่ใช่ผลที่ครูเลือก) หรือผล SDQ รวม */
export function triggerModeForGroup(group: RiskGroup | null | undefined): TriggerMode | null {
  if (group === "red") return "auto";
  if (group === "amber") return "suggest";
  return null;
}

/** ผลคัดกรองทั้งฉบับ: ใช้มิติที่หนักที่สุด (มีปัญหา > เสี่ยง) */
export function triggerModeForGroups(groups: (RiskGroup | null | undefined)[]): TriggerMode | null {
  if (groups.includes("red")) return "auto";
  if (groups.includes("amber")) return "suggest";
  return null;
}

/** Red Flag: ควรดูแล → auto */
export function triggerModeForRedFlag(needsCare: boolean): TriggerMode | null {
  return needsCare ? "auto" : null;
}

/** คะแนนความประพฤติต่ำกว่าเกณฑ์ → suggest */
export function isBehaviorScoreLow(score: number, behaviorAlertScore: number): boolean {
  return score < behaviorAlertScore;
}
