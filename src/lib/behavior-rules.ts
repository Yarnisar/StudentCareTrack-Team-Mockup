/**
 * ชนิดของกฎความประพฤติตามรายงาน UC7 Scenario B
 * - ข้อ 7: ชนิดของกฎ ได้แก่ ตัดคะแนน เพิ่มคะแนน หรือส่งต่อ (กฎส่งต่อไม่มีคะแนน ใช้กับพฤติกรรมร้ายแรงที่ต้องส่งต่อ)
 * - ข้อ 8: กฎตัดคะแนนมีระดับการดำเนินการ อิงตัวอย่างระเบียบในภาคผนวก ข
 *   (ว่ากล่าวตักเตือน / ทำทัณฑ์บน / ทำกิจกรรมปรับเปลี่ยนพฤติกรรม)
 * - ข้อ 9: บทบาทที่บันทึกกฎนี้ได้ (UC8 ข้อ 6, Alt-B ข้อ 5)
 * ฟิลด์ severity เก็บชนิดและระดับไว้ในค่าเดียว: minor/moderate/severe = ตัดคะแนนตามระดับ, positive = เพิ่มคะแนน, refer = ส่งต่อ
 */

import type { BehaviorRule, RuleRecorder } from "./types";

export type RuleKind = "deduct" | "add" | "refer";

export const RULE_LEVEL_ORDER: BehaviorRule["severity"][] = ["minor", "moderate", "severe", "positive", "refer"];

/** ชื่อระดับการดำเนินการ (ตัดคะแนน) หรือชนิดกฎ (เพิ่มคะแนน / ส่งต่อ) */
export const RULE_LEVEL_LABEL: Record<BehaviorRule["severity"], string> = {
  minor: "ว่ากล่าวตักเตือน",
  moderate: "ทำทัณฑ์บน",
  severe: "ทำกิจกรรมปรับเปลี่ยนพฤติกรรม",
  positive: "เพิ่มคะแนน",
  refer: "ส่งต่อ",
};

export const RULE_KIND_LABEL: Record<RuleKind, string> = {
  deduct: "ตัดคะแนน",
  add: "เพิ่มคะแนน",
  refer: "ส่งต่อ (ไม่มีคะแนน)",
};

/** คะแนนตั้งต้นเมื่อเพิ่มกฎหรือเปลี่ยนระดับ อิงภาคผนวก ข (ว่ากล่าว 5, ทัณฑ์บน 10–15, กิจกรรม 20) */
export const DEFAULT_DELTA: Record<BehaviorRule["severity"], number> = {
  minor: -5,
  moderate: -10,
  severe: -20,
  positive: 5,
  refer: 0,
};

export function ruleKind(rule: Pick<BehaviorRule, "severity">): RuleKind {
  if (rule.severity === "refer") return "refer";
  if (rule.severity === "positive") return "add";
  return "deduct";
}

/** ข้อความคะแนนของกฎ เช่น -5, +10 หรือ "ส่งต่อ" */
export function ruleScoreText(rule: Pick<BehaviorRule, "severity" | "scoreDelta" | "cancelled">): string {
  if (rule.cancelled) return "ไม่นับ";
  if (ruleKind(rule) === "refer") return "ส่งต่อ";
  return rule.scoreDelta > 0 ? `+${rule.scoreDelta}` : String(rule.scoreDelta);
}

export const RECORDER_ORDER: RuleRecorder[] = ["teacher", "discipline_head", "executive"];

export const RECORDER_LABEL: Record<RuleRecorder, string> = {
  teacher: "ครูทุกคน",
  discipline_head: "หัวหน้างานปกครอง",
  executive: "ผู้บริหาร",
};

/**
 * ครูในต้นแบบ (ครูประจำชั้น / ครูผู้สอน) นับเป็น "ครูทุกคน"
 * PROTOTYPE: ยังไม่มีบัญชีหัวหน้างานปกครองและผู้บริหาร บทบาทจริงมาจาก IAM ของ Team B
 */
export function canRecordRule(rule: Pick<BehaviorRule, "recordableBy">, as: RuleRecorder = "teacher"): boolean {
  if (rule.recordableBy.includes(as)) return true;
  // หัวหน้างานและผู้บริหารเป็นครูด้วย จึงบันทึกกฎของครูทุกคนได้
  return as !== "teacher" && rule.recordableBy.includes("teacher");
}

export function recordersText(rule: Pick<BehaviorRule, "recordableBy">): string {
  return RECORDER_ORDER.filter((r) => rule.recordableBy.includes(r))
    .map((r) => RECORDER_LABEL[r])
    .join(", ");
}
