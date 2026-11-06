/**
 * PROTOTYPE ONLY — สถานะร่างของหน้าตั้งค่า (ทิ้งได้)
 *
 * สถานะของหน้าตั้งค่า: ช่วงเวลาทำแบบประเมิน และการเพิ่ม/แก้ไข/ลบกฎความประพฤติ
 *
 * เก็บในหน่วยความจำล้วน ไม่มีการบันทึกลงที่ใด กดรีเฟรชแล้วค่ากลับไปตั้งต้น
 * ช่วงเวลาเก็บใน store (ชนิดข้อมูลอยู่ที่ lib/periods.ts) เพื่อให้หน้าภาพรวมคำนวณวันครบกำหนดจากค่าชุดเดียวกัน
 * กฎความประพฤติก็เก็บใน store ตัวบันทึกพฤติกรรมจึงเห็นกฎที่แอดมินแก้ทันที
 */

import { useCallback, useMemo } from "react";
import { DEMO_TODAY, behaviorRules as seedRules } from "@/lib/mock-data";
import { DEFAULT_DELTA, ruleKind } from "@/lib/behavior-rules";
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

export const RATER_LABEL: Record<SdqRater, string> = {
  teacher: "ครู",
  student: "นักเรียน",
  parent: "ผู้ปกครอง",
};

export const STATUS_META: Record<WindowStatus, { label: string; className: string }> = {
  open: { label: "เปิดให้ทำอยู่", className: "bg-accent text-primary" },
  upcoming: { label: "ยังไม่ถึงรอบ", className: "bg-muted text-foreground" },
  closed: { label: "ปิดรอบแล้ว", className: "bg-muted text-muted-foreground" },
  disabled: { label: "ปิดใช้งาน", className: "border border-dashed border-border text-muted-foreground" },
};

let ruleSeq = 100;
let windowSeq = 100;

export function useSettingsPrototype() {
  const {
    assessmentWindows: windows,
    setAssessmentWindows: setWindows,
    behaviorRules: rules,
    setBehaviorRules: setRules,
  } = useStore();

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
    setRules((prev) =>
      prev.map((r) => {
        if (r.ruleId !== ruleId) return r;
        const next = { ...r, ...patch };
        // เปลี่ยนชนิดกฎแล้วใช้คะแนนตั้งต้นของชนิดใหม่ กฎส่งต่อไม่มีคะแนนเสมอ (ข้อ 7)
        if (patch.severity && ruleKind(next) !== ruleKind(r)) next.scoreDelta = DEFAULT_DELTA[next.severity];
        if (ruleKind(next) === "refer") next.scoreDelta = 0;
        // ตัดคะแนนต้องติดลบ เพิ่มคะแนนต้องเป็นบวก
        if (ruleKind(next) === "deduct") next.scoreDelta = Math.min(-1, next.scoreDelta);
        if (ruleKind(next) === "add") next.scoreDelta = Math.max(1, next.scoreDelta);
        return next;
      })
    );
  }, [setRules]);

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
        recordableBy: ["teacher"],
      },
    ]);
    return ruleId;
  }, [setRules]);

  /** ยกเลิกกฎพร้อมเหตุผล ย้อนกลับไม่ได้ (UC7 Scenario C) */
  const cancelRule = useCallback((ruleId: string, reason: string) => {
    setRules((prev) =>
      prev.map((r) =>
        r.ruleId === ruleId ? { ...r, isActive: false, cancelled: { reason, at: DEMO_TODAY } } : r
      )
    );
  }, [setRules]);

  const removeRule = useCallback((ruleId: string) => {
    setRules((prev) => prev.filter((r) => r.ruleId !== ruleId));
  }, [setRules]);

  const reset = useCallback(() => {
    setWindows(INITIAL_WINDOWS);
    setRules(seedRules);
  }, [setWindows, setRules]);

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
    cancelRule,
    removeRule,
    reset,
  };
}

export type SettingsPrototype = ReturnType<typeof useSettingsPrototype>;
