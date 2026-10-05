/**
 * Behavior slice: ระเบียบความประพฤติ และบันทึกความประพฤติ
 *
 * - บันทึกด้วยมือเริ่มที่ confirmed ส่วนบันทึกจาก QR เริ่มที่ pending
 * - pending ครบ schoolSettings.pendingAutoConfirmDays วันทำการ → confirmed อัตโนมัติ
 *   คำนวณตอนอ่าน (behaviorRecords ที่ได้จาก slice นี้ผ่านการตัดสินแล้วเสมอ)
 * - ผู้บันทึกแก้ได้ภายใน 24 ชม. หลัง createdAt หลังจากนั้นทำได้แค่ยกเลิก (void พร้อมเหตุผล) ไม่มีการลบ
 * - คะแนน = 100 + Σ confirmed ในปีการศึกษา สูงสุด 100 (lib/behavior.ts)
 */

import { useMemo, useRef, useState } from "react";
import { behaviorRecords as seedBehaviorRecords, behaviorRules as seedBehaviorRules } from "../mock-data";
import { addDaysThai, addHoursThai, compareThaiDate, nowThaiIso, thaiDateOf } from "../format";
import {
  autoConfirmAt,
  computeBehaviorScore,
  countConfirmedLate,
  isLateRecord,
  monthOf,
  resolveBehaviorRecord,
} from "../behavior";
import {
  DEFAULT_NOTIFY_GUARDIAN,
  type BehaviorRecord,
  type BehaviorRule,
  type GuardianBehaviorRecord,
  type Notification,
} from "../types";
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
  /** บันทึกนี้ทำให้คะแนนต่ำกว่า behaviorAlertScore (แจ้งครูประจำชั้นแล้ว) */
  scoreBecameLow: boolean;
}

export type BehaviorActionResult = { ok: true; record: BehaviorRecord } | { ok: false; error: string };

export type BehaviorRecordPatch = Partial<Pick<BehaviorRecord, "ruleId" | "description">>;

/** เหตุการณ์ "คะแนนความประพฤติต่ำกว่าเกณฑ์" — ส่งเมื่อคะแนนข้ามจาก ≥ เกณฑ์ ไปเป็น < เกณฑ์ */
export interface BehaviorScoreLowEvent {
  studentId: string;
  score: number;
  /** บันทึกที่ทำให้คะแนนข้ามเกณฑ์ (ใช้เป็น source_ref_id ของ care_case_triggers source = behavior) */
  recordId: string;
  detectedAt: string;
}

export interface BehaviorSlice {
  behaviorRules: BehaviorRule[];
  /** ทุกบันทึก (ทุกสถานะ) ผ่านการยืนยันอัตโนมัติแล้ว ใหม่สุดก่อน (occurredAt) */
  behaviorRecords: BehaviorRecord[];
  ruleOf: (ruleId: string) => BehaviorRule | undefined;
  /** บันทึกของนักเรียน ใหม่สุดก่อน — ค่าเริ่มต้นไม่รวม voided (สำหรับครู) */
  behaviorOf: (studentId: string, opts?: { includeVoided?: boolean }) => BehaviorRecord[];
  /** สำหรับผู้ปกครอง: เฉพาะ confirmed และไม่มีชื่อผู้บันทึก */
  guardianBehaviorOf: (studentId: string) => GuardianBehaviorRecord[];
  /** 100 + Σ confirmed ในปีการศึกษา (ค่าเริ่มต้น = ปีปัจจุบัน) สูงสุด 100 */
  behaviorScoreOf: (studentId: string, academicYear?: number) => number;
  /** คะแนนปีปัจจุบันต่ำกว่า schoolSettings.behaviorAlertScore */
  isBehaviorScoreLow: (studentId: string) => boolean;
  /** นักเรียนที่กำลังศึกษาและคะแนนปีปัจจุบันต่ำกว่าเกณฑ์ → ระบบแนะนำให้เปิด care case (ไม่เปิดเอง) */
  behaviorScoreLowStudents: { studentId: string; score: number }[];
  /**
   * จำนวนครั้งที่มาสายแบบ confirmed ในเดือน (ค่าเริ่มต้น = เดือนปัจจุบันของ DEMO_TODAY)
   * month รูปแบบ "2570-02" — ใช้กับรายการพบอัตโนมัติ bh1 และเกณฑ์ late_threshold
   */
  confirmedLateCountOf: (studentId: string, month?: string) => number;

  /** ทุกบันทึก pending (ยังไม่ถึงกำหนดยืนยันอัตโนมัติ) */
  pendingBehaviorRecords: BehaviorRecord[];
  /** pending ที่ currentUser ตัดสินได้ (ครูประจำชั้นของนักเรียน / แอดมิน) เก่าสุดก่อน */
  myPendingBehaviorRecords: BehaviorRecord[];
  /** เวลาที่ pending จะถูกยืนยันอัตโนมัติ (null ถ้าไม่ใช่ pending) */
  autoConfirmAtOf: (record: BehaviorRecord) => string | null;
  /** เวลาสุดท้ายที่ผู้บันทึกแก้ไขได้ (createdAt + 24 ชม.) */
  editableUntilOf: (record: BehaviorRecord) => string;

  canEditBehaviorRecord: (record: BehaviorRecord) => boolean;
  canVoidBehaviorRecord: (record: BehaviorRecord) => boolean;
  canDecideBehaviorRecord: (record: BehaviorRecord) => boolean;

  /** ครูบันทึกเอง (ผู้บันทึก = currentUser, confirmed ทันที) — แจ้งผู้ปกครองทันทีถ้ากฎตั้ง notifyGuardian */
  addBehaviorRecord: (studentId: string, ruleId: string, description: string) => AddBehaviorRecordResult;
  /** บันทึกที่ระบบสร้างให้ เช่น มาสายจากการสแกน QR (ใช้โดย checkin slice) — เริ่มที่ pending */
  addSystemBehaviorRecord: (
    record: Pick<BehaviorRecord, "studentId" | "ruleId" | "description" | "occurredAt" | "recordedBy" | "source" | "checkinLogId">
  ) => BehaviorRecord;
  /** ผู้บันทึกแก้ประเภท/รายละเอียดได้ภายใน 24 ชม. */
  editBehaviorRecord: (recordId: string, patch: BehaviorRecordPatch) => BehaviorActionResult;
  /** ยกเลิกบันทึกที่ confirmed (ต้องมีเหตุผล) — ผู้บันทึก ครูประจำชั้น หรือแอดมิน */
  voidBehaviorRecord: (recordId: string, reason: string) => BehaviorActionResult;
  /** ยืนยันบันทึก pending (ครูประจำชั้น / แอดมิน) */
  confirmBehaviorRecord: (recordId: string) => BehaviorActionResult;
  /** ยกเว้นบันทึก pending (ต้องมีเหตุผล) */
  excuseBehaviorRecord: (recordId: string, reason: string) => BehaviorActionResult;

  /**
   * งานประจำ (ต้นแบบไม่มีงานเบื้องหลัง เรียกจากปุ่มสาธิต):
   * pending_late_digest → ครูประจำชั้นที่มีบันทึกมาสายรอยืนยัน (วันละครั้งต่อคน)
   */
  sendPendingLateDigest: () => Notification[];
  /** late_weekly_digest → ผู้ปกครองของนักเรียนที่มาสาย (confirmed) ใน 7 วันล่าสุด (สัปดาห์ละครั้ง) */
  sendLateWeeklyDigest: () => Notification[];
  /**
   * ฟังเหตุการณ์คะแนนต่ำกว่าเกณฑ์ (สำหรับ care slice: เพิ่มเหตุเข้า case ที่เปิดอยู่ / แนะนำเปิด case)
   * เรียกใน useEffect แล้วคืนค่า unsubscribe — listener ถูกเรียกจากใน mutation (ไม่ใช่ตอน render)
   */
  onBehaviorScoreLow: (listener: (event: BehaviorScoreLowEvent) => void) => () => void;

  /* ระเบียบความประพฤติ (แอดมิน) — ไม่มีการลบ ใช้ setBehaviorRuleActive(false) แทน */
  addBehaviorRule: (input: BehaviorRuleInput) => BehaviorRule | null;
  updateBehaviorRule: (ruleId: string, patch: BehaviorRulePatch) => void;
  setBehaviorRuleActive: (ruleId: string, isActive: boolean) => void;
}

const byOccurredDesc = (a: BehaviorRecord, b: BehaviorRecord) => b.occurredAt.localeCompare(a.occurredAt);

export function useBehaviorSlice(base: PlatformSlice): BehaviorSlice {
  const [behaviorRules, setBehaviorRules] = useState<BehaviorRule[]>(seedBehaviorRules);
  const [rawRecords, setRawRecords] = useState<BehaviorRecord[]>(seedBehaviorRecords);
  const scoreLowListeners = useRef(new Set<(event: BehaviorScoreLowEvent) => void>());

  return useMemo<BehaviorSlice>(() => {
    const me = base.currentUser.userId;
    const isAdmin = base.currentUser.role === "admin_school";
    const isStaff = isAdmin || base.currentUser.role === "teacher_homeroom" || base.currentUser.role === "teacher_general";
    const { pendingAutoConfirmDays, behaviorAlertScore, lateAlertThreshold } = base.schoolSettings;
    const year = base.currentTerm.academicYear;
    const now = nowThaiIso();

    const ruleOf = (ruleId: string) => behaviorRules.find((r) => r.ruleId === ruleId);
    const resolveAll = (list: BehaviorRecord[], at: string) =>
      list.map((r) => resolveBehaviorRecord(r, at, pendingAutoConfirmDays));

    const behaviorRecords = resolveAll(rawRecords, now).sort(byOccurredDesc);
    const findRecord = (recordId: string) => behaviorRecords.find((r) => r.recordId === recordId);

    const behaviorOf: BehaviorSlice["behaviorOf"] = (studentId, opts) =>
      behaviorRecords.filter(
        (r) => r.studentId === studentId && (opts?.includeVoided || r.status !== "voided")
      );

    const guardianBehaviorOf: BehaviorSlice["guardianBehaviorOf"] = (studentId) =>
      behaviorRecords
        .filter((r) => r.studentId === studentId && r.status === "confirmed")
        .map((r) => ({
          recordId: r.recordId,
          studentId: r.studentId,
          ruleId: r.ruleId,
          description: r.description,
          occurredAt: r.occurredAt,
          source: r.source,
          status: r.status,
          decidedAt: r.decidedAt,
          createdAt: r.createdAt,
        }));

    const behaviorScoreOf: BehaviorSlice["behaviorScoreOf"] = (studentId, academicYear = year) =>
      computeBehaviorScore(behaviorRecords, ruleOf, studentId, academicYear);

    const confirmedLateCountOf: BehaviorSlice["confirmedLateCountOf"] = (studentId, month = monthOf(now)) =>
      countConfirmedLate(behaviorRecords, studentId, month);

    const behaviorScoreLowStudents = base.students
      .filter((s) => s.status === "studying")
      .map((s) => ({ studentId: s.studentId, score: behaviorScoreOf(s.studentId) }))
      .filter((s) => s.score < behaviorAlertScore);

    const pendingBehaviorRecords = behaviorRecords.filter((r) => r.status === "pending");

    const canDecideBehaviorRecord = (record: BehaviorRecord) =>
      record.status === "pending" && (isAdmin || base.isHomeroomOf(record.studentId));

    const myPendingBehaviorRecords = pendingBehaviorRecords
      .filter(canDecideBehaviorRecord)
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

    const editableUntilOf = (record: BehaviorRecord) => addHoursThai(record.createdAt, 24);

    const canEditBehaviorRecord = (record: BehaviorRecord) =>
      record.source === "manual" &&
      record.status === "confirmed" &&
      record.recordedBy === me &&
      compareThaiDate(now, editableUntilOf(record)) < 0;

    const canVoidBehaviorRecord = (record: BehaviorRecord) =>
      record.status === "confirmed" &&
      (record.recordedBy === me || isAdmin || base.isHomeroomOf(record.studentId));

    /* ---------------------------------------------------------------- */
    /* ผลต่อเนื่องหลังบันทึกเปลี่ยน: คะแนนต่ำกว่าเกณฑ์ / มาสายครบเกณฑ์            */
    /* ---------------------------------------------------------------- */

    /** prev/next = รายการดิบทั้งหมดก่อน/หลังการเปลี่ยน */
    const afterChange = (record: BehaviorRecord, prev: BehaviorRecord[], next: BehaviorRecord[]) => {
      const at = nowThaiIso();
      const prevResolved = resolveAll(prev, at);
      const nextResolved = resolveAll(next, at);
      const { studentId } = record;

      const before = computeBehaviorScore(prevResolved, ruleOf, studentId, year);
      const after = computeBehaviorScore(nextResolved, ruleOf, studentId, year);
      const scoreBecameLow = before >= behaviorAlertScore && after < behaviorAlertScore;
      if (scoreBecameLow) {
        base.notify("behavior_score_low", base.recipientsOf(studentId, ["homeroom"]), studentId);
        const event: BehaviorScoreLowEvent = { studentId, score: after, recordId: record.recordId, detectedAt: at };
        scoreLowListeners.current.forEach((listener) => listener(event));
      }

      // มาสายครบเกณฑ์ของเดือน (นับเฉพาะ confirmed) — แจ้งครูประจำชั้นครั้งเดียวต่อเดือน
      const month = monthOf(at);
      if (isLateRecord(record) && monthOf(record.occurredAt) === month) {
        const count = countConfirmedLate(nextResolved, studentId, month);
        const alreadySent = base.notifications.some(
          (n) => n.eventType === "late_threshold" && n.studentId === studentId && monthOf(n.createdAt) === month
        );
        if (count >= lateAlertThreshold && !alreadySent) {
          base.notify("late_threshold", base.recipientsOf(studentId, ["homeroom"]), studentId, { count });
        }
      }
      return { scoreBecameLow };
    };

    /** แทนที่บันทึก 1 รายการในรายการดิบ (บันทึกที่ยืนยันอัตโนมัติแล้วถูกเขียนลงไปด้วย) */
    const replace = (updated: BehaviorRecord) => {
      const next = rawRecords.map((r) => (r.recordId === updated.recordId ? updated : r));
      setRawRecords(next);
      return next;
    };

    const notifyGuardiansIfRuleSays = (record: BehaviorRecord) =>
      ruleOf(record.ruleId)?.notifyGuardian && !isLateRecord(record)
        ? base
            .notify("behavior_confirmed", base.recipientsOf(record.studentId, ["guardians"]), record.studentId)
            .map((n) => n.recipientUserId)
        : [];

    /* ---------------------------------------------------------------- */
    /* mutations                                                         */
    /* ---------------------------------------------------------------- */

    const addBehaviorRecord: BehaviorSlice["addBehaviorRecord"] = (studentId, ruleId, description) => {
      const at = nowThaiIso();
      const record: BehaviorRecord = {
        recordId: nextId("BH"),
        studentId,
        ruleId,
        description,
        occurredAt: at,
        recordedBy: me,
        source: "manual",
        checkinLogId: null,
        status: "confirmed",
        decidedBy: me,
        decidedAt: at,
        decisionReason: null,
        voidReason: null,
        createdAt: at,
      };
      const next = [record, ...rawRecords];
      setRawRecords(next);
      base.logAudit("CREATE", "behavior_records", record.recordId, {
        after: { studentId, ruleId, status: record.status },
      });

      // บันทึกด้วยมือมีผลทันที → แจ้งผู้ปกครองทุกคนถ้ากฎนี้ตั้งให้แจ้ง (มาสายส่งเป็นสรุปรายสัปดาห์)
      const notifiedGuardians = notifyGuardiansIfRuleSays(record);
      const { scoreBecameLow } = afterChange(record, rawRecords, next);
      return { record, notifiedGuardians, scoreBecameLow };
    };

    const addSystemBehaviorRecord: BehaviorSlice["addSystemBehaviorRecord"] = (input) => {
      const record: BehaviorRecord = {
        recordId: nextId("BH"),
        ...input,
        status: "pending",
        decidedBy: null,
        decidedAt: null,
        decisionReason: null,
        voidReason: null,
        createdAt: input.occurredAt,
      };
      setRawRecords((prev) => [record, ...prev]);
      base.logAudit(
        "CREATE",
        "behavior_records",
        record.recordId,
        { after: { studentId: record.studentId, ruleId: record.ruleId, source: record.source, status: record.status } },
        record.recordedBy
      );
      return record;
    };

    const editBehaviorRecord: BehaviorSlice["editBehaviorRecord"] = (recordId, patch) => {
      const current = findRecord(recordId);
      if (!current) return { ok: false, error: "ไม่พบบันทึก" };
      if (!canEditBehaviorRecord(current))
        return { ok: false, error: "แก้ไขได้เฉพาะผู้บันทึกภายใน 24 ชั่วโมง — หลังจากนั้นทำได้แค่ยกเลิก" };
      if (patch.ruleId !== undefined && !ruleOf(patch.ruleId)?.isActive)
        return { ok: false, error: "ประเภทพฤติกรรมนี้ถูกยกเลิกการใช้งานแล้ว" };
      const keys = (Object.keys(patch) as (keyof BehaviorRecordPatch)[]).filter(
        (k) => patch[k] !== undefined && patch[k] !== current[k]
      );
      if (keys.length === 0) return { ok: true, record: current };
      const updated: BehaviorRecord = { ...current, ...patch };
      const next = replace(updated);
      base.logAudit("UPDATE", "behavior_records", recordId, {
        before: Object.fromEntries(keys.map((k) => [k, current[k]])),
        after: Object.fromEntries(keys.map((k) => [k, updated[k]])),
      });
      afterChange(updated, rawRecords, next);
      return { ok: true, record: updated };
    };

    const voidBehaviorRecord: BehaviorSlice["voidBehaviorRecord"] = (recordId, reason) => {
      const current = findRecord(recordId);
      const why = reason.trim();
      if (!current) return { ok: false, error: "ไม่พบบันทึก" };
      if (!why) return { ok: false, error: "ต้องระบุเหตุผลการยกเลิก" };
      if (!canVoidBehaviorRecord(current)) return { ok: false, error: "ไม่มีสิทธิ์ยกเลิกบันทึกนี้" };
      const updated: BehaviorRecord = { ...current, status: "voided", voidReason: why };
      const next = replace(updated);
      base.logAudit("VOID", "behavior_records", recordId, {
        before: { status: current.status },
        after: { status: "voided" },
        reason: why,
      });
      afterChange(updated, rawRecords, next);
      return { ok: true, record: updated };
    };

    const decide = (recordId: string, status: "confirmed" | "excused", reason: string | null): BehaviorActionResult => {
      const current = findRecord(recordId);
      if (!current) return { ok: false, error: "ไม่พบบันทึก" };
      if (current.status !== "pending")
        return { ok: false, error: "บันทึกนี้ได้รับการตัดสินแล้ว (หรือระบบยืนยันอัตโนมัติแล้ว)" };
      if (!canDecideBehaviorRecord(current))
        return { ok: false, error: "ยืนยัน/ยกเว้นได้เฉพาะครูประจำชั้นของนักเรียนหรือแอดมิน" };
      const at = nowThaiIso();
      const updated: BehaviorRecord = { ...current, status, decidedBy: me, decidedAt: at, decisionReason: reason };
      const next = replace(updated);
      base.logAudit("UPDATE", "behavior_records", recordId, {
        before: { status: "pending" },
        after: { status },
        ...(reason ? { reason } : {}),
      });
      if (status === "confirmed") notifyGuardiansIfRuleSays(updated);
      afterChange(updated, rawRecords, next);
      return { ok: true, record: updated };
    };

    const excuseBehaviorRecord: BehaviorSlice["excuseBehaviorRecord"] = (recordId, reason) => {
      const why = reason.trim();
      if (!why) return { ok: false, error: "ต้องระบุเหตุผลการยกเว้น" };
      return decide(recordId, "excused", why);
    };

    /* ---------------------------------------------------------------- */
    /* สรุปการแจ้งเตือน                                                    */
    /* ---------------------------------------------------------------- */

    const sendPendingLateDigest = () => {
      const today = thaiDateOf(nowThaiIso());
      const counts = new Map<string, number>();
      for (const rec of pendingBehaviorRecords.filter(isLateRecord)) {
        for (const teacher of base.homeroomTeachersOf(rec.studentId)) {
          counts.set(teacher.userId, (counts.get(teacher.userId) ?? 0) + 1);
        }
      }
      return [...counts].flatMap(([userId, count]) => {
        const sentToday = base.notifications.some(
          (n) => n.eventType === "pending_late_digest" && n.recipientUserId === userId && thaiDateOf(n.createdAt) === today
        );
        return sentToday ? [] : base.notify("pending_late_digest", [userId], null, { count });
      });
    };

    const sendLateWeeklyDigest = () => {
      const at = nowThaiIso();
      const since = addDaysThai(at, -7);
      const counts = new Map<string, number>();
      for (const rec of behaviorRecords) {
        if (rec.status === "confirmed" && isLateRecord(rec) && compareThaiDate(thaiDateOf(rec.occurredAt), since) > 0) {
          counts.set(rec.studentId, (counts.get(rec.studentId) ?? 0) + 1);
        }
      }
      return [...counts].flatMap(([studentId, count]) => {
        const recipients = base.recipientsOf(studentId, ["guardians"]).filter(
          (userId) =>
            !base.notifications.some(
              (n) =>
                n.eventType === "late_weekly_digest" &&
                n.recipientUserId === userId &&
                n.studentId === studentId &&
                compareThaiDate(thaiDateOf(n.createdAt), since) > 0
            )
        );
        return recipients.length > 0 ? base.notify("late_weekly_digest", recipients, studentId, { count }) : [];
      });
    };

    const onBehaviorScoreLow: BehaviorSlice["onBehaviorScoreLow"] = (listener) => {
      const set = scoreLowListeners.current;
      set.add(listener);
      return () => {
        set.delete(listener);
      };
    };

    /* ---------------------------------------------------------------- */
    /* ระเบียบความประพฤติ                                                 */
    /* ---------------------------------------------------------------- */

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
      guardianBehaviorOf,
      behaviorScoreOf,
      isBehaviorScoreLow: (studentId) => behaviorScoreOf(studentId) < behaviorAlertScore,
      behaviorScoreLowStudents,
      confirmedLateCountOf,
      pendingBehaviorRecords,
      myPendingBehaviorRecords: isStaff ? myPendingBehaviorRecords : [],
      autoConfirmAtOf: (record) => (record.status === "pending" ? autoConfirmAt(record, pendingAutoConfirmDays) : null),
      editableUntilOf,
      canEditBehaviorRecord,
      canVoidBehaviorRecord,
      canDecideBehaviorRecord,
      addBehaviorRecord,
      addSystemBehaviorRecord,
      editBehaviorRecord,
      voidBehaviorRecord,
      confirmBehaviorRecord: (recordId) => decide(recordId, "confirmed", null),
      excuseBehaviorRecord,
      sendPendingLateDigest,
      sendLateWeeklyDigest,
      onBehaviorScoreLow,
      addBehaviorRule,
      updateBehaviorRule,
      setBehaviorRuleActive: (ruleId, isActive) => updateBehaviorRule(ruleId, { isActive }),
    };
  }, [base, behaviorRules, rawRecords]);
}
