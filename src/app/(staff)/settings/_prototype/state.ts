/**
 * PROTOTYPE ONLY — สถานะร่างของหน้าตั้งค่า (ทิ้งได้)
 *
 * คำถามที่ต้นแบบนี้ตอบ: "หน้าตั้งค่าที่ให้แอดมิน (1) กำหนดช่วงเวลาทำแบบประเมิน
 * และ (2) เพิ่ม/แก้ไข/ลบกฎความประพฤติ ควรมีหน้าตาแบบไหน"
 *
 * เก็บในหน่วยความจำล้วน ไม่มีการบันทึกลงที่ใด กดรีเฟรชแล้วค่ากลับไปตั้งต้น
 * ช่วงเวลาเก็บใน store (ชนิดข้อมูลอยู่ที่ lib/periods.ts) เพื่อให้หน้าภาพรวมคำนวณวันครบกำหนดจากค่าชุดเดียวกัน
 * ส่วนกฎความประพฤติยังเป็นสถานะร่างของหน้านี้เท่านั้น
 */

import { useCallback, useMemo, useState } from "react";
import { DEMO_TODAY, behaviorRules as seedRules } from "@/lib/mock-data";
import { INITIAL_WINDOWS, shiftDate, type AssessmentWindow, type WindowStatus } from "@/lib/periods";
import { useStore } from "@/lib/store";
import type { BehaviorRule, SdqRater } from "@/lib/types";

export {
  INITIAL_WINDOWS,
  KIND_LABEL,
  shiftDate,
  windowStatus,
  type AssessmentKind,
  type AssessmentWindow,
  type WindowStatus,
} from "@/lib/periods";

/** ขอบเขตภาคเรียนที่ 2/2569 ใช้เป็นแกนเวลาของทุก variant */
export const TERM_START = "2569-11-01";
export const TERM_END = "2570-03-31";

export const RATER_LABEL: Record<SdqRater, string> = {
  teacher: "ครู",
  student: "นักเรียน",
  parent: "ผู้ปกครอง",
};

export const STATUS_META: Record<WindowStatus, { label: string; className: string }> = {
  open: { label: "เปิดให้ทำอยู่", className: "bg-risk-green-bg text-risk-green" },
  upcoming: { label: "ยังไม่ถึงรอบ", className: "bg-accent text-primary" },
  closed: { label: "ปิดรอบแล้ว", className: "bg-muted text-muted-foreground" },
  disabled: { label: "ปิดใช้งาน", className: "bg-risk-amber-bg text-risk-amber" },
};

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
  const { assessmentWindows: windows, setAssessmentWindows: setWindows } = useStore();
  const [rules, setRules] = useState<BehaviorRule[]>(seedRules);

  const updateWindow = useCallback((id: string, patch: Partial<AssessmentWindow>) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }, [setWindows]);

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
  }, [setWindows]);

  const removeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, [setWindows]);

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
  }, [setWindows]);

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
