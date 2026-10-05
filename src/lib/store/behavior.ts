/** Behavior slice: ระเบียบความประพฤติ และบันทึกความประพฤติ */

import { useMemo, useState } from "react";
import { behaviorRecords as seedBehaviorRecords, behaviorRules as seedBehaviorRules } from "../mock-data";
import { nowThaiIso } from "../format";
import { DEFAULT_NOTIFY_GUARDIAN, type BehaviorRecord, type BehaviorRule } from "../types";
import type { PlatformSlice } from "./platform";
import { nextId } from "./ids";

export type BehaviorRuleInput = Omit<BehaviorRule, "ruleId" | "isActive" | "notifyGuardian"> & {
  notifyGuardian?: boolean;
};
export type BehaviorRulePatch = Partial<Omit<BehaviorRule, "ruleId">>;

export interface AddBehaviorRecordResult {
  record: BehaviorRecord;
  /** userId ของผู้ปกครองที่ได้รับแจ้งทันที (ว่าง = กฎนี้ไม่แจ้งผู้ปกครอง) */
  notifiedGuardians: string[];
}

export interface BehaviorSlice {
  behaviorRules: BehaviorRule[];
  behaviorRecords: BehaviorRecord[];
  ruleOf: (ruleId: string) => BehaviorRule | undefined;
  behaviorOf: (studentId: string) => BehaviorRecord[];
  behaviorScoreOf: (studentId: string) => number;
  /** ครูบันทึกเอง (ผู้บันทึก = currentUser) — แจ้งผู้ปกครองทันทีถ้ากฎตั้ง notifyGuardian */
  addBehaviorRecord: (studentId: string, ruleId: string, description: string) => AddBehaviorRecordResult;
  /** บันทึกที่ระบบสร้างให้ เช่น มาสายจากการสแกน QR (ใช้โดย checkin slice) */
  addSystemBehaviorRecord: (record: Omit<BehaviorRecord, "recordId">) => BehaviorRecord;

  /* ระเบียบความประพฤติ (แอดมิน) — ไม่มีการลบ ใช้ setBehaviorRuleActive(false) แทน */
  addBehaviorRule: (input: BehaviorRuleInput) => BehaviorRule | null;
  updateBehaviorRule: (ruleId: string, patch: BehaviorRulePatch) => void;
  setBehaviorRuleActive: (ruleId: string, isActive: boolean) => void;
}

export function useBehaviorSlice(base: PlatformSlice): BehaviorSlice {
  const [behaviorRules, setBehaviorRules] = useState<BehaviorRule[]>(seedBehaviorRules);
  const [behaviorRecords, setBehaviorRecords] = useState<BehaviorRecord[]>(seedBehaviorRecords);

  return useMemo<BehaviorSlice>(() => {
    const isAdmin = base.currentUser.role === "admin_school";
    const ruleOf = (ruleId: string) => behaviorRules.find((r) => r.ruleId === ruleId);

    const behaviorOf = (studentId: string) =>
      behaviorRecords
        .filter((b) => b.studentId === studentId)
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

    const behaviorScoreOf = (studentId: string) =>
      behaviorOf(studentId).reduce((sum, rec) => sum + (ruleOf(rec.ruleId)?.scoreDelta ?? 0), 0);

    const addBehaviorRecord: BehaviorSlice["addBehaviorRecord"] = (studentId, ruleId, description) => {
      const record: BehaviorRecord = {
        recordId: nextId("BH"),
        studentId,
        ruleId,
        description,
        occurredAt: nowThaiIso(),
        recordedBy: base.currentUser.userId,
        source: "manual",
      };
      setBehaviorRecords((prev) => [record, ...prev]);
      base.logAudit("CREATE", "behavior_records", record.recordId, { after: { studentId, ruleId } });

      // บันทึกด้วยมือมีผลทันที → แจ้งผู้ปกครองทุกคนถ้ากฎนี้ตั้งให้แจ้ง
      const notifiedGuardians = ruleOf(ruleId)?.notifyGuardian
        ? base
            .notify("behavior_confirmed", base.recipientsOf(studentId, ["guardians"]), studentId)
            .map((n) => n.recipientUserId)
        : [];
      return { record, notifiedGuardians };
    };

    const addSystemBehaviorRecord: BehaviorSlice["addSystemBehaviorRecord"] = (input) => {
      const record: BehaviorRecord = { recordId: nextId("BH"), ...input };
      setBehaviorRecords((prev) => [record, ...prev]);
      base.logAudit(
        "CREATE",
        "behavior_records",
        record.recordId,
        { after: { studentId: record.studentId, ruleId: record.ruleId, source: record.source } },
        record.recordedBy
      );
      return record;
    };

    const addBehaviorRule: BehaviorSlice["addBehaviorRule"] = (input) => {
      if (!isAdmin) return null;
      const rule: BehaviorRule = {
        ruleId: nextId("BR"),
        name: input.name,
        severity: input.severity,
        scoreDelta: input.scoreDelta,
        notifyGuardian: input.notifyGuardian ?? DEFAULT_NOTIFY_GUARDIAN[input.severity],
        isActive: true,
      };
      setBehaviorRules((prev) => [...prev, rule]);
      base.logAudit("CREATE", "behavior_rules", rule.ruleId, { after: { ...rule } });
      return rule;
    };

    const updateBehaviorRule: BehaviorSlice["updateBehaviorRule"] = (ruleId, patch) => {
      const before = ruleOf(ruleId);
      if (!isAdmin || !before) return;
      const keys = (Object.keys(patch) as (keyof BehaviorRulePatch)[]).filter(
        (k) => patch[k] !== undefined && patch[k] !== before[k]
      );
      if (keys.length === 0) return;
      const after: BehaviorRule = { ...before, ...patch, ruleId };
      setBehaviorRules((prev) => prev.map((r) => (r.ruleId === ruleId ? after : r)));
      base.logAudit("UPDATE", "behavior_rules", ruleId, {
        before: Object.fromEntries(keys.map((k) => [k, before[k]])),
        after: Object.fromEntries(keys.map((k) => [k, after[k]])),
      });
    };

    return {
      behaviorRules,
      behaviorRecords,
      ruleOf,
      behaviorOf,
      behaviorScoreOf,
      addBehaviorRecord,
      addSystemBehaviorRecord,
      addBehaviorRule,
      updateBehaviorRule,
      setBehaviorRuleActive: (ruleId, isActive) => updateBehaviorRule(ruleId, { isActive }),
    };
  }, [base, behaviorRules, behaviorRecords]);
}
