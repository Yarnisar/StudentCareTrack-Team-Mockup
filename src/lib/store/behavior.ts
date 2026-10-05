/** Behavior slice: ระเบียบความประพฤติ และบันทึกความประพฤติ */

import { useMemo, useState } from "react";
import { behaviorRecords as seedBehaviorRecords, behaviorRules as seedBehaviorRules } from "../mock-data";
import { nowThaiIso } from "../format";
import type { BehaviorRecord, BehaviorRule } from "../types";
import type { CoreSlice } from "./core";
import { nextId } from "./ids";

export interface BehaviorSlice {
  behaviorRules: BehaviorRule[];
  behaviorRecords: BehaviorRecord[];
  ruleOf: (ruleId: string) => BehaviorRule | undefined;
  behaviorOf: (studentId: string) => BehaviorRecord[];
  behaviorScoreOf: (studentId: string) => number;
  /** ครูบันทึกเอง (ผู้บันทึก = currentUser) */
  addBehaviorRecord: (studentId: string, ruleId: string, description: string) => void;
  /** บันทึกที่ระบบสร้างให้ เช่น มาสายจากการสแกน QR (ใช้โดย checkin slice) */
  addSystemBehaviorRecord: (record: Omit<BehaviorRecord, "recordId">) => BehaviorRecord;
}

export function useBehaviorSlice(core: CoreSlice): BehaviorSlice {
  const [behaviorRules] = useState<BehaviorRule[]>(seedBehaviorRules);
  const [behaviorRecords, setBehaviorRecords] = useState<BehaviorRecord[]>(seedBehaviorRecords);

  return useMemo<BehaviorSlice>(() => {
    const ruleOf = (ruleId: string) => behaviorRules.find((r) => r.ruleId === ruleId);

    const behaviorOf = (studentId: string) =>
      behaviorRecords
        .filter((b) => b.studentId === studentId)
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

    const behaviorScoreOf = (studentId: string) =>
      behaviorOf(studentId).reduce((sum, rec) => sum + (ruleOf(rec.ruleId)?.scoreDelta ?? 0), 0);

    const addBehaviorRecord: BehaviorSlice["addBehaviorRecord"] = (studentId, ruleId, description) => {
      setBehaviorRecords((prev) => [
        {
          recordId: nextId("BH"),
          studentId,
          ruleId,
          description,
          occurredAt: nowThaiIso(),
          recordedBy: core.currentUser.userId,
          source: "manual",
        },
        ...prev,
      ]);
    };

    const addSystemBehaviorRecord: BehaviorSlice["addSystemBehaviorRecord"] = (input) => {
      const record: BehaviorRecord = { recordId: nextId("BH"), ...input };
      setBehaviorRecords((prev) => [record, ...prev]);
      return record;
    };

    return {
      behaviorRules,
      behaviorRecords,
      ruleOf,
      behaviorOf,
      behaviorScoreOf,
      addBehaviorRecord,
      addSystemBehaviorRecord,
    };
  }, [core, behaviorRules, behaviorRecords]);
}
