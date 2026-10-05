/**
 * PROTOTYPE ONLY — สถานะร่างของหน้าตั้งค่า (ทิ้งได้)
 *
 * คำถามที่ต้นแบบนี้ตอบ: "หน้าตั้งค่าที่ให้แอดมิน (1) กำหนดช่วงเวลาทำแบบประเมิน
 * และ (2) เพิ่ม/แก้ไข/ลบกฎความประพฤติ ควรมีหน้าตาแบบไหน"
 *
 * อ่าน/เขียนสโตร์โดยตรง (useStore: operatingWindows, behaviorRules) — แก้แล้วมีผลทุกหน้าทันที
 * และบันทึก audit log ทุกครั้ง ช่วงดำเนินงานมีได้ 1 ช่วงต่อกิจกรรมต่อภาคเรียน และล็อกหลังปิดเสมอ
 * ดังนั้นสวิตช์ "เปิดใช้งาน" / "ล็อกหลังปิด" และปุ่มลบช่วงเวลาในต้นแบบไม่มีผล
 * การลบกฎ = ยกเลิกการใช้งาน (ไม่ลบจริง)
 */

import { DEMO_TODAY } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import {
  OPERATING_ACTIVITIES,
  OPERATING_ACTIVITY_LABEL,
  type BehaviorRule,
  type OperatingActivity,
  type OperatingWindow,
  type SdqRater,
} from "@/lib/types";

/** ขอบเขตภาคเรียนที่ 2/2569 ใช้เป็นแกนเวลาของทุก variant */
export const TERM_START = "2569-11-01";
export const TERM_END = "2570-03-31";

export type AssessmentKind = OperatingActivity;

export const KIND_LABEL: Record<AssessmentKind, string> = OPERATING_ACTIVITY_LABEL;

export interface AssessmentWindow {
  id: string;
  kind: AssessmentKind;
  label: string;
  round?: 1 | 2;
  /** วันเปิดให้ทำ (พ.ศ. yyyy-mm-dd) */
  openDate: string;
  /** วันปิดรับ */
  closeDate: string;
  enabled: boolean;
  /** ปิดรอบแล้วห้ามบันทึกย้อนหลัง */
  lockAfterClose: boolean;
  /** แจ้งเตือนล่วงหน้ากี่วันก่อนปิด */
  remindDaysBefore: number;
  /** ผู้ที่ต้องทำแบบประเมินรอบนี้ */
  raters: SdqRater[];
}

export const RATER_LABEL: Record<SdqRater, string> = {
  teacher: "ครู",
  student: "นักเรียน",
  parent: "ผู้ปกครอง",
};

/** ค่าเริ่มต้นจากข้อมูลตัวอย่างในสโตร์ (คงชื่อไว้ให้ไฟล์ต้นแบบอื่นคอมไพล์ได้) */
function toProtoWindow(w: OperatingWindow): AssessmentWindow {
  return {
    id: w.windowId,
    kind: w.activity,
    label: OPERATING_ACTIVITY_LABEL[w.activity],
    openDate: w.opensAt,
    closeDate: w.closesAt,
    enabled: true,
    lockAfterClose: true,
    remindDaysBefore: w.remindDaysBefore,
    raters: w.activity === "sdq" ? ["teacher", "student", "parent"] : ["teacher"],
  };
}

export type WindowStatus = "disabled" | "upcoming" | "open" | "closed";

export const STATUS_META: Record<WindowStatus, { label: string; className: string }> = {
  open: { label: "เปิดให้ทำอยู่", className: "bg-risk-green-bg text-risk-green" },
  upcoming: { label: "ยังไม่ถึงรอบ", className: "bg-accent text-primary" },
  closed: { label: "ปิดรอบแล้ว", className: "bg-muted text-muted-foreground" },
  disabled: { label: "ปิดใช้งาน", className: "bg-risk-amber-bg text-risk-amber" },
};

export function windowStatus(w: AssessmentWindow, today: string = DEMO_TODAY): WindowStatus {
  if (!w.enabled) return "disabled";
  if (today < w.openDate) return "upcoming";
  if (today > w.closeDate) return "closed";
  return "open";
}

/** แปลงวันที่ พ.ศ. เป็นสัดส่วน 0–1 บนแกนเวลาภาคเรียน */
export function termFraction(date: string): number {
  const toMs = (d: string) => {
    const [y, m, day] = d.split("-").map(Number);
    return Date.UTC(y - 543, m - 1, day);
  };
  const start = toMs(TERM_START);
  const end = toMs(TERM_END);
  return Math.min(1, Math.max(0, (toMs(date) - start) / (end - start)));
}

/** บวก/ลบวันบนสตริงวันที่ พ.ศ. */
export function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y - 543, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getUTCFullYear() + 543}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** คู่ของช่วงเวลาที่ทับซ้อนกัน — ใช้เตือนแอดมินว่าครูจะมีงานชนกัน */
export function overlappingPairs(windows: AssessmentWindow[]): [string, string][] {
  const active = windows.filter((w) => w.enabled);
  const pairs: [string, string][] = [];
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      if (a.openDate <= b.closeDate && b.openDate <= a.closeDate) pairs.push([a.id, b.id]);
    }
  }
  return pairs;
}

export const SEVERITY_ORDER: BehaviorRule["severity"][] = [
  "minor",
  "moderate",
  "severe",
  "positive",
];

export const SEVERITY_LABEL: Record<BehaviorRule["severity"], string> = {
  minor: "เล็กน้อย",
  moderate: "ปานกลาง",
  severe: "ร้ายแรง",
  positive: "คะแนนบวก",
};

export const DEFAULT_DELTA: Record<BehaviorRule["severity"], number> = {
  minor: -1,
  moderate: -3,
  severe: -10,
  positive: 3,
};

export function useSettingsPrototype() {
  const store = useStore();
  const termId = store.currentTerm.termId;

  const windows = store.operatingWindows
    .filter((w) => w.termId === termId)
    .sort((a, b) => a.opensAt.localeCompare(b.opensAt))
    .map(toProtoWindow);
  const rules = store.behaviorRules;

  /** เฉพาะวันเปิด/วันปิด/แจ้งล่วงหน้าที่มีในตาราง operating_windows ฟิลด์อื่นของต้นแบบไม่มีผล */
  const updateWindow = (id: string, patch: Partial<AssessmentWindow>) => {
    const w = store.operatingWindows.find((x) => x.windowId === id);
    if (!w) return;
    if (patch.openDate === undefined && patch.closeDate === undefined && patch.remindDaysBefore === undefined)
      return;
    store.saveOperatingWindow(
      w.activity,
      {
        opensAt: patch.openDate ?? w.opensAt,
        closesAt: patch.closeDate ?? w.closesAt,
        remindDaysBefore: patch.remindDaysBefore ?? w.remindDaysBefore,
      },
      w.termId
    );
  };

  /** เพิ่มช่วงของกิจกรรมที่ยังไม่มีในภาคเรียนนี้ (1 ช่วงต่อกิจกรรม) */
  const addWindow = () => {
    const missing = OPERATING_ACTIVITIES.find((a) => !store.windowOf(a, termId));
    if (!missing) return windows[0]?.id ?? "";
    const result = store.saveOperatingWindow(missing, {
      opensAt: DEMO_TODAY,
      closesAt: shiftDate(DEMO_TODAY, 14),
      remindDaysBefore: 7,
    });
    return result.ok ? result.window.windowId : "";
  };

  /** ไม่มีการลบช่วงดำเนินงาน (ข้อมูลไม่ถูกลบจริง) */
  const removeWindow = (id: string) => {
    void id;
  };

  const updateRule = (ruleId: string, patch: Partial<BehaviorRule>) => store.updateBehaviorRule(ruleId, patch);

  const addRule = (severity: BehaviorRule["severity"] = "minor") =>
    store.addBehaviorRule({ name: "", severity, scoreDelta: DEFAULT_DELTA[severity] })?.ruleId ?? "";

  /** ไม่ลบจริง — ยกเลิกการใช้งาน เพราะบันทึกเดิมอ้างอิงกฎอยู่ */
  const removeRule = (ruleId: string) => store.setBehaviorRuleActive(ruleId, false);

  /** บันทึกลงสโตร์ทันทีทุกครั้งที่แก้ จึงไม่มีสถานะ "ยังไม่ได้บันทึก" */
  const dirty = false;
  const reset = () => {};

  return {
    windows,
    rules,
    dirty,
    updateWindow,
    addWindow,
    removeWindow,
    updateRule,
    addRule,
    removeRule,
    reset,
  };
}

export type SettingsPrototype = ReturnType<typeof useSettingsPrototype>;
