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
import { CURRENT_TERM, DEMO_TODAY, behaviorRules as seedRules } from "@/lib/mock-data";
import { DEFAULT_DELTA, RULE_LEVEL_LABEL, recordersText, ruleKind } from "@/lib/behavior-rules";
import { INITIAL_WINDOWS, shiftDate, type AssessmentWindow, type WindowStatus } from "@/lib/periods";
import { useStore } from "@/lib/store";
import { termInfo } from "@/lib/terms";
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
    logChange,
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
        // รอบใหม่เริ่มที่ภาคเรียนถัดไป ยังไม่มีผู้ตอบ จึงแก้ชนิดแบบประเมินได้
        kind: "screening",
        termId: termInfo(CURRENT_TERM.academicYear + 1, 1).termId,
        target: { type: "school" },
        label: "คัดกรอง 6 มิติ",
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
    // บันทึกประวัติ: เทียบค่าเดิมกับค่าใหม่ (พิมพ์ต่อเนื่องรวมเป็นรายการเดียว) กฎที่ยังไม่ตั้งชื่อถือว่ากำลังสร้าง ยังไม่บันทึก
    const old = rules.find((r) => r.ruleId === ruleId);
    if (old && old.name.trim() !== "") {
      const fmt: Record<string, (r: BehaviorRule) => string> = {
        name: (r) => r.name,
        scoreDelta: (r) => String(r.scoreDelta),
        severity: (r) => RULE_LEVEL_LABEL[r.severity],
        isActive: (r) => (r.isActive ? "ใช้งาน" : "ปิดใช้งาน"),
        recordableBy: (r) => recordersText(r),
      };
      const labels: Record<string, string> = { name: "ชื่อ", scoreDelta: "คะแนน", severity: "ระดับ", isActive: "สถานะ", recordableBy: "ผู้บันทึกได้" };
      const changes = Object.keys(fmt)
        .filter((k) => k in patch)
        .map((k) => ({ label: labels[k], from: fmt[k](old), to: fmt[k]({ ...old, ...patch }) }))
        .filter((c) => c.from !== c.to);
      if (changes.length > 0) logChange("rule", ruleId, `แก้กฎ "${old.name}"`, changes, true);
    }
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
  }, [setRules, rules, logChange]);

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
    const old = rules.find((r) => r.ruleId === ruleId);
    if (old) logChange("rule", ruleId, `ยกเลิกกฎ "${old.name}"`, [{ label: "สถานะ", from: "ใช้งาน", to: `ยกเลิก · ${reason}` }]);
    setRules((prev) =>
      prev.map((r) =>
        r.ruleId === ruleId ? { ...r, isActive: false, cancelled: { reason, at: DEMO_TODAY } } : r
      )
    );
  }, [setRules, rules, logChange]);

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
