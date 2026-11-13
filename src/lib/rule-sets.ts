/**
 * ชุดกฎความประพฤติแบบมีเวอร์ชัน (UC7 สถานการณ์ A, E และ Alt-A, C, D)
 * - กฎที่ครูใช้อยู่คือ "ชุดที่ใช้งานอยู่" แอดมินแก้ได้เฉพาะผ่านฉบับร่าง และเฉพาะในช่วงที่แก้กฎได้ (ช่วงปิดเทอม)
 * - เผยแพร่พร้อมวันเริ่มใช้ กฎเดิมใช้ต่อจนถึงวันเริ่มใช้ รายการที่เกิดก่อนวันเริ่มใช้ไม่ถูกเปลี่ยนคะแนน
 * PROTOTYPE: ช่วงปิดเทอมเป็นค่าตัวอย่าง Project 2 อ่านปฏิทินการศึกษาจากระบบทะเบียนของ Team B
 */

import { RULE_LEVEL_LABEL, recordersText } from "./behavior-rules";
import { WATCH_NOTIFY_LABEL, type BehaviorScoreConfig } from "./behavior-score";
import type { BehaviorRule } from "./types";

export interface RuleSetVersion {
  versionId: string;
  /** ฉบับที่ 1, 2, 3 … */
  number: number;
  effectiveFrom: string;
  rules: BehaviorRule[];
  /** ค่าตั้งต้นคะแนนและเกณฑ์เฝ้าระวังของฉบับนี้ (Scenario D) */
  config: BehaviorScoreConfig;
  publishedAt: string;
  publishedBy: string;
  reason: string;
}

/** ช่วงเวลาที่แอดมินแก้กฎได้ (UC7 สถานการณ์ A) */
export interface RuleEditWindow {
  open: string;
  close: string;
}

export interface SchoolBreak {
  label: string;
  start: string;
  end: string;
}

/** PROTOTYPE: ช่วงปิดเทอมตัวอย่างของปีการศึกษา (ปฏิทินจริงมาจากระบบทะเบียน) */
export function schoolBreaks(academicYear: number): SchoolBreak[] {
  return [
    { label: `ปิดเทอมภาคเรียนที่ 1/${academicYear}`, start: `${academicYear}-10-01`, end: `${academicYear}-10-31` },
    { label: `ปิดเทอมภาคเรียนที่ 2/${academicYear}`, start: `${academicYear + 1}-04-01`, end: `${academicYear + 1}-04-30` },
  ];
}

export const INITIAL_RULE_EDIT_WINDOW: RuleEditWindow = { open: "2570-04-01", close: "2570-04-30" };

/** ข้อความผิดพลาดของช่วงที่แก้กฎได้ (Alt-B) ว่างเมื่อถูกต้อง */
export function ruleEditWindowError(win: RuleEditWindow, academicYear: number): string {
  if (!win.open || !win.close) return "ระบุวันเริ่มและวันสิ้นสุด";
  if (win.open > win.close) return "วันเริ่มต้องไม่หลังวันสิ้นสุด";
  const inBreak = [...schoolBreaks(academicYear - 1), ...schoolBreaks(academicYear)].some(
    (b) => win.open >= b.start && win.close <= b.end
  );
  return inBreak ? "" : "ช่วงเวลาต้องอยู่ภายในช่วงปิดเทอมเดียวกัน";
}

export interface RuleDiff {
  ruleId: string;
  kind: "added" | "edited" | "cancelled" | "removed";
  summary: string;
  changes: { label: string; from: string; to: string }[];
}

const FIELDS: { key: keyof BehaviorRule; label: string; fmt: (r: BehaviorRule) => string }[] = [
  { key: "name", label: "ชื่อ", fmt: (r) => r.name },
  { key: "scoreDelta", label: "คะแนน", fmt: (r) => String(r.scoreDelta) },
  { key: "severity", label: "ระดับ", fmt: (r) => RULE_LEVEL_LABEL[r.severity] },
  { key: "recordableBy", label: "ผู้บันทึกได้", fmt: (r) => recordersText(r) },
];

/** เทียบกฎที่ใช้อยู่กับฉบับร่าง ใช้แสดงผลกระทบก่อนเผยแพร่และบันทึกประวัติ */
export function diffRules(before: BehaviorRule[], after: BehaviorRule[]): RuleDiff[] {
  const out: RuleDiff[] = [];
  for (const a of after) {
    const b = before.find((r) => r.ruleId === a.ruleId);
    if (!b) {
      if (a.name.trim() === "") continue;
      out.push({ ruleId: a.ruleId, kind: "added", summary: `เพิ่มกฎ "${a.name}"`, changes: [{ label: "ชื่อ", from: "", to: a.name }] });
      continue;
    }
    if (a.cancelled && !b.cancelled) {
      out.push({
        ruleId: a.ruleId,
        kind: "cancelled",
        summary: `ยกเลิกกฎ "${b.name}"`,
        changes: [{ label: "สถานะ", from: "ใช้งาน", to: `ยกเลิก · ${a.cancelled.reason}` }],
      });
      continue;
    }
    const changes = FIELDS.filter((f) => JSON.stringify(a[f.key]) !== JSON.stringify(b[f.key])).map((f) => ({
      label: f.label,
      from: f.fmt(b),
      to: f.fmt(a),
    }));
    if (changes.length > 0) out.push({ ruleId: a.ruleId, kind: "edited", summary: `แก้กฎ "${b.name}"`, changes });
  }
  for (const b of before) {
    if (!after.some((r) => r.ruleId === b.ruleId))
      out.push({ ruleId: b.ruleId, kind: "removed", summary: `ลบกฎ "${b.name}"`, changes: [{ label: "สถานะ", from: "ใช้งาน", to: "ลบ" }] });
  }
  return out;
}

/** เทียบค่าตั้งต้นคะแนนที่ใช้อยู่กับฉบับร่าง (Scenario D) */
export function diffConfig(before: BehaviorScoreConfig, after: BehaviorScoreConfig): { label: string; from: string; to: string }[] {
  const out: { label: string; from: string; to: string }[] = [];
  const add = (label: string, a: string | number, b: string | number) => {
    if (String(a) !== String(b)) out.push({ label, from: String(a), to: String(b) });
  };
  const ceil = (c: BehaviorScoreConfig) => (c.ceiling === null ? "ไม่จำกัด" : c.ceiling);
  add("คะแนนเริ่มต้น", before.startScore, after.startScore);
  add("เพดานคะแนน", ceil(before), ceil(after));
  add("คะแนนต่ำสุด", before.minScore, after.minScore);
  add("บันทึกย้อนหลังได้ (วัน)", before.backdateDays, after.backdateDays);
  add("แก้ไขรายการได้ (วัน)", before.editDays, after.editDays);
  add("รอยืนยันถอนสถานะ (วัน)", before.withdrawalWaitDays, after.withdrawalWaitDays);
  const levels = (c: BehaviorScoreConfig) =>
    c.watchLevels.map((l, i) => `ระดับ ${i + 1}: ≤${l.atOrBelow}${l.notify.length ? ` (แจ้ง ${l.notify.map((n) => WATCH_NOTIFY_LABEL[n]).join(", ")})` : ""}`).join(" · ");
  add("เกณฑ์เฝ้าระวัง", levels(before), levels(after));
  return out;
}
