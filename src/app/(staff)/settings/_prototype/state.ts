/**
 * PROTOTYPE ONLY — สถานะร่างของหน้าตั้งค่า (ทิ้งได้)
 *
 * คำถามที่ต้นแบบนี้ตอบ: "หน้าตั้งค่าที่ให้แอดมิน (1) กำหนดช่วงเวลาทำแบบประเมิน
 * และ (2) เพิ่ม/แก้ไข/ลบกฎความประพฤติ ควรมีหน้าตาแบบไหน"
 *
 * เก็บในหน่วยความจำล้วน ไม่มีการบันทึกลงที่ใด กดรีเฟรชแล้วค่ากลับไปตั้งต้น
 */

import { useCallback, useMemo, useState } from "react";
import { DEMO_TODAY, behaviorRules as seedRules } from "@/lib/mock-data";
import type { BehaviorRule, SdqRater } from "@/lib/types";

/** ขอบเขตภาคเรียนที่ 2/2569 ใช้เป็นแกนเวลาของทุก variant */
export const TERM_START = "2569-11-01";
export const TERM_END = "2570-03-31";

export type AssessmentKind = "screening" | "red_flag" | "nine_s" | "sdq" | "eq";

export const KIND_LABEL: Record<AssessmentKind, string> = {
  screening: "คัดกรอง 6 มิติ",
  red_flag: "Red Flag",
  nine_s: "9S",
  sdq: "SDQ",
  eq: "EQ",
};

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

export const INITIAL_WINDOWS: AssessmentWindow[] = [
  {
    id: "W1",
    kind: "screening",
    label: "คัดกรองนักเรียน 6 มิติ",
    openDate: "2569-11-01",
    closeDate: "2569-11-30",
    enabled: true,
    lockAfterClose: true,
    remindDaysBefore: 7,
    raters: ["teacher"],
  },
  {
    id: "W2",
    kind: "red_flag",
    label: "ประเมิน Red Flag (กลุ่มเสี่ยง/มีปัญหา)",
    openDate: "2569-12-01",
    closeDate: "2569-12-15",
    enabled: true,
    lockAfterClose: true,
    remindDaysBefore: 3,
    raters: ["teacher"],
  },
  {
    id: "W3",
    kind: "nine_s",
    label: "ประเมิน 9S",
    openDate: "2569-12-16",
    closeDate: "2569-12-31",
    enabled: true,
    lockAfterClose: false,
    remindDaysBefore: 3,
    raters: ["teacher"],
  },
  {
    id: "W4",
    kind: "sdq",
    label: "SDQ รอบที่ 1",
    round: 1,
    openDate: "2570-01-05",
    closeDate: "2570-01-31",
    enabled: true,
    lockAfterClose: true,
    remindDaysBefore: 7,
    raters: ["teacher", "student", "parent"],
  },
  {
    id: "W5",
    kind: "sdq",
    label: "SDQ รอบที่ 2",
    round: 2,
    openDate: "2570-02-10",
    closeDate: "2570-02-28",
    enabled: true,
    lockAfterClose: true,
    remindDaysBefore: 7,
    raters: ["teacher", "student", "parent"],
  },
  {
    id: "W6",
    kind: "eq",
    label: "ประเมิน EQ ปลายภาค",
    openDate: "2570-03-01",
    closeDate: "2570-03-15",
    enabled: false,
    lockAfterClose: false,
    remindDaysBefore: 5,
    raters: ["teacher", "student"],
  },
];

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

let ruleSeq = 100;
let windowSeq = 100;

export function useSettingsPrototype() {
  const [windows, setWindows] = useState<AssessmentWindow[]>(INITIAL_WINDOWS);
  const [rules, setRules] = useState<BehaviorRule[]>(seedRules);

  const updateWindow = useCallback((id: string, patch: Partial<AssessmentWindow>) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }, []);

  const addWindow = useCallback(() => {
    const id = `W-NEW-${++windowSeq}`;
    setWindows((prev) => [
      ...prev,
      {
        id,
        kind: "sdq",
        label: "ช่วงเวลาใหม่",
        openDate: DEMO_TODAY,
        closeDate: shiftDate(DEMO_TODAY, 14),
        enabled: true,
        lockAfterClose: true,
        remindDaysBefore: 7,
        raters: ["teacher"],
      },
    ]);
    return id;
  }, []);

  const removeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const updateRule = useCallback((ruleId: string, patch: Partial<BehaviorRule>) => {
    setRules((prev) => prev.map((r) => (r.ruleId === ruleId ? { ...r, ...patch } : r)));
  }, []);

  const addRule = useCallback((severity: BehaviorRule["severity"] = "minor") => {
    const ruleId = `BR-NEW-${++ruleSeq}`;
    setRules((prev) => [
      ...prev,
      {
        ruleId,
        name: "",
        severity,
        scoreDelta: DEFAULT_DELTA[severity],
        isActive: true,
      },
    ]);
    return ruleId;
  }, []);

  const removeRule = useCallback((ruleId: string) => {
    setRules((prev) => prev.filter((r) => r.ruleId !== ruleId));
  }, []);

  const reset = useCallback(() => {
    setWindows(INITIAL_WINDOWS);
    setRules(seedRules);
  }, []);

  const dirty = useMemo(
    () =>
      JSON.stringify(windows) !== JSON.stringify(INITIAL_WINDOWS) ||
      JSON.stringify(rules) !== JSON.stringify(seedRules),
    [windows, rules]
  );

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
