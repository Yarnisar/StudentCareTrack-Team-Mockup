/**
 * Care slice: care case เหตุเปิด case แผนช่วยเหลือ การติดตามผล เอกสารส่งต่อภายนอก
 *
 * กฎ (CONTEXT.md / data_dictionary.md):
 * - case ผูกกับนักเรียน มี case เปิดอยู่ได้ครั้งละ 1 case ต่อนักเรียน ครูประจำชั้นทั้ง 2 คนดำเนินการได้เท่ากัน
 * - raiseTrigger(...) เป็นทางเดียวที่โมดูลอื่นใช้ส่งเหตุเข้ามา: auto → เปิด case ให้, suggest → แนะนำ
 *   ถ้ามี case เปิดอยู่แล้ว เหตุใหม่ (ทั้ง auto และ suggest) เพิ่มเข้า case เดิม
 * - คำแนะนำจากคะแนนความประพฤติต่ำกว่าเกณฑ์คำนวณสดจาก behavior slice (ไม่ต้องให้โมดูลความประพฤติเรียก)
 * - ติดตามผลบันทึกได้ในช่วงดำเนินงาน care_record เท่านั้น และต้องผูกกับแผน
 * - ปิดแบบ resolved ได้เมื่อมีการติดตามผล ≥ 1 ครั้ง ส่วน transferred/graduated ระบบปิดให้เมื่อสถานะนักเรียนเปลี่ยน
 * - เอกสารส่งต่อภายนอกสร้างได้เมื่อผู้ปกครองยินยอมในปีนั้น และไม่ทำให้ case ปิด
 */

import { useMemo, useState } from "react";
import { careCases as seedCareCases, caseSuggestions as seedSuggestions, SYSTEM_USER_ID } from "../mock-data";
import { nowThaiIso } from "../format";
import { isBehaviorScoreLow } from "../care-rules";
import {
  CARE_METHODS_MAX,
  CARE_METHODS_MIN,
  type CareCase,
  type CareCaseTrigger,
  type CareFollowup,
  type CareMethod,
  type CarePlan,
  type CaseSuggestion,
  type CaseTriggerSource,
  type ReferralDocument,
  type StudentStatus,
  type SupportType,
  type TriggerMode,
} from "../types";
import type { BehaviorSlice } from "./behavior";
import type { PlatformSlice } from "./platform";
import { nextId } from "./ids";

/** ที่มาที่ระบบส่งเข้ามาได้ (manual ใช้ openCase) */
export type SystemTriggerSource = Exclude<CaseTriggerSource, "manual">;

export interface RaiseTriggerOptions {
  /** สรุปสั้นแสดงในหน้า case (ไม่ส่งไปในการแจ้งเตือน) เช่น "ผลคัดกรองมีปัญหา มิติการเรียน" */
  summary?: string;
  /** ค่าเริ่มต้น = ตอนนี้ */
  detectedAt?: string;
}

export type RaiseTriggerResult =
  | { kind: "opened"; careCase: CareCase; trigger: CareCaseTrigger }
  | { kind: "appended"; careCase: CareCase; trigger: CareCaseTrigger }
  | { kind: "suggested"; suggestion: CaseSuggestion }
  | { kind: "ignored"; reason: "duplicate" | "not_studying" | "unknown_student" };

export interface CarePlanInput {
  supportType: SupportType;
  /** 1–5 วิธี */
  careMethods: CareMethod[];
  goal: string;
  targetDate: string;
  /** เหตุที่แผนนี้รองรับ (ต้องอยู่ใน case เดียวกัน) */
  triggerIds?: string[];
}

export interface OpenCaseInput {
  /** manual = ครูเปิดเอง, behavior = เปิดจากคำแนะนำคะแนนความประพฤติ */
  source: "manual" | "behavior";
  sourceRefId?: string | null;
  summary?: string;
  /** จัดทำแผนแรกพร้อมเปิด case (ไม่บังคับ) — เหตุแรกผูกกับแผนนี้ให้อัตโนมัติ */
  plan?: Omit<CarePlanInput, "triggerIds">;
}

export type CareResult<T> = ({ ok: true } & T) | { ok: false; error: string };

/** เหตุผลที่ปุ่มใช้ไม่ได้ (null = ทำได้) สำหรับแสดงใต้ปุ่มที่ถูก disable */
export type BlockReason = string | null;

export interface CareSlice {
  careCases: CareCase[];
  /** case ที่เปิดอยู่ของนักเรียน (มีได้ไม่เกิน 1) */
  activeCaseOf: (studentId: string) => CareCase | undefined;
  /** case ที่เปิดอยู่ ถ้าไม่มีคืน case ล่าสุดที่ปิดแล้ว */
  caseOf: (studentId: string) => CareCase | undefined;
  casesOf: (studentId: string) => CareCase[];
  getCase: (caseId: string) => CareCase | undefined;

  /**
   * ส่งเหตุเปิด case จากโมดูลอื่น (คัดกรอง / Red Flag / SDQ / ความประพฤติ)
   * - มี case เปิดอยู่ → เพิ่มเหตุเข้า case เดิม (แจ้ง case_trigger_added)
   * - ไม่มี case + auto → ระบบเปิด case (openedBy = null, แจ้ง case_opened)
   * - ไม่มี case + suggest → เก็บเป็นคำแนะนำ (ครูเป็นผู้เปิด)
   * - source+sourceRefId เดิมที่มีอยู่แล้ว → ignored (เรียกซ้ำได้อย่างปลอดภัย)
   * ไม่ตรวจสิทธิ์ผู้ใช้และช่วงดำเนินงาน — ผู้เรียกตรวจของตัวเองก่อนบันทึก record ต้นเหตุ
   */
  raiseTrigger: (
    studentId: string,
    source: SystemTriggerSource,
    sourceRefId: string | null,
    mode: TriggerMode,
    options?: RaiseTriggerOptions
  ) => RaiseTriggerResult;

  /** คำแนะนำที่ยังรอครูตัดสินใจของนักเรียน (รวมคำแนะนำจากคะแนนความประพฤติ) */
  pendingSuggestionsOf: (studentId: string) => CaseSuggestion[];
  /** คำแนะนำที่รอทั้งหมดของนักเรียนที่ผู้ใช้ปัจจุบันเห็นข้อมูลอ่อนไหวได้ */
  pendingSuggestions: CaseSuggestion[];
  /** ครูรับคำแนะนำ: ถ้ายังไม่มี case → เปิด case (source = behavior หรือ manual) ถ้ามีแล้ว → เพิ่มเหตุ */
  acceptSuggestion: (suggestionId: string, plan?: OpenCaseInput["plan"]) => CareResult<{ careCase: CareCase }>;
  dismissSuggestion: (suggestionId: string) => void;

  canManageCase: (studentId: string) => boolean;
  /** ครูประจำชั้นเปิด case เอง */
  openCase: (studentId: string, input: OpenCaseInput) => CareResult<{ careCase: CareCase }>;
  /** เพิ่มเหตุที่ครูพบเองเข้า case ที่เปิดอยู่ */
  addManualTrigger: (caseId: string, summary: string) => CareResult<{ trigger: CareCaseTrigger }>;

  addPlan: (caseId: string, input: CarePlanInput) => CareResult<{ plan: CarePlan }>;
  assignTriggerToPlan: (triggerId: string, planId: string) => CareResult<object>;

  followupBlockReason: (caseId: string) => BlockReason;
  addFollowup: (
    caseId: string,
    planId: string,
    actionTaken: string,
    result: string
  ) => CareResult<{ followup: CareFollowup }>;

  closeBlockReason: (caseId: string) => BlockReason;
  /** ครูประจำชั้นปิด case (close_reason = resolved) */
  closeCase: (caseId: string) => CareResult<object>;
  /**
   * งานทะเบียน (Team B) เปลี่ยนสถานะนักเรียนเป็นจบการศึกษา/ย้ายออก → ระบบปิด case ที่เปิดอยู่
   * (closedBy = null, closeReason = สถานะใหม่) ต้นแบบไม่มีหน้าจอเปลี่ยนสถานะ — ใช้สาธิตผล
   */
  applyStudentStatusChange: (studentId: string, status: StudentStatus) => CareCase | null;

  referralBlockReason: (caseId: string) => BlockReason;
  createReferral: (
    caseId: string,
    externalAgency: string,
    content: string
  ) => CareResult<{ referral: ReferralDocument }>;
}

const BEHAVIOR_SUGGESTION_PREFIX = "SUG-BH-";
const today = () => nowThaiIso().split("T")[0];

export function useCareSlice(base: PlatformSlice, behavior: BehaviorSlice): CareSlice {
  const [careCases, setCareCases] = useState<CareCase[]>(seedCareCases);
  const [suggestions, setSuggestions] = useState<CaseSuggestion[]>(seedSuggestions);
  /** คำแนะนำจากคะแนนความประพฤติที่ครูปิดไปแล้ว: `${studentId}:${score}` (คะแนนเปลี่ยน → แนะนำใหม่) */
  const [dismissedBehavior, setDismissedBehavior] = useState<string[]>([]);

  return useMemo<CareSlice>(() => {
    // สำเนาล่าสุดภายใน closure นี้ — การเรียกหลายครั้งในเหตุการณ์เดียว (เช่น บันทึกคัดกรองแล้วส่ง 2 เหตุ)
    // จะเห็นผลของครั้งก่อนทันที ไม่ต้องรอ re-render (ป้องกันเปิด case ซ้ำ)
    const working = { cases: careCases, sugs: suggestions };
    const commitCases = (next: CareCase[]) => {
      working.cases = next;
      setCareCases(next);
    };
    const commitSuggestions = (next: CaseSuggestion[]) => {
      working.sugs = next;
      setSuggestions(next);
    };
    const activeCaseOf = (studentId: string) =>
      working.cases.find((c) => c.studentId === studentId && c.status === "active");
    const casesOf = (studentId: string) => working.cases.filter((c) => c.studentId === studentId);
    const caseOf = (studentId: string) => activeCaseOf(studentId) ?? casesOf(studentId)[0];
    const getCase = (caseId: string) => working.cases.find((c) => c.caseId === caseId);

    const homeroomIds = (studentId: string) => base.recipientsOf(studentId, ["homeroom"]);
    const othersInHomeroom = (studentId: string) =>
      homeroomIds(studentId).filter((id) => id !== base.currentUser.userId);

    const updateCase = (caseId: string, fn: (c: CareCase) => CareCase) =>
      commitCases(working.cases.map((c) => (c.caseId === caseId ? fn(c) : c)));

    /* -------------------------- คำแนะนำ -------------------------- */

    const behaviorSuggestionOf = (studentId: string): CaseSuggestion | null => {
      const student = base.getStudent(studentId);
      if (!student || student.status !== "studying") return null;
      const score = behavior.behaviorScoreOf(studentId);
      if (!isBehaviorScoreLow(score, base.schoolSettings.behaviorAlertScore)) return null;
      if (dismissedBehavior.includes(`${studentId}:${score}`)) return null;
      // ถ้า case ที่เปิดอยู่มีเหตุจากความประพฤติแล้ว ไม่ต้องแนะนำซ้ำ
      if (activeCaseOf(studentId)?.triggers.some((t) => t.source === "behavior")) return null;
      return {
        suggestionId: `${BEHAVIOR_SUGGESTION_PREFIX}${studentId}`,
        studentId,
        source: "behavior",
        sourceRefId: null,
        detectedAt: nowThaiIso(),
        summary: `เหลือ ${score} คะแนน (เกณฑ์ ${base.schoolSettings.behaviorAlertScore})`,
        status: "pending",
      };
    };

    const pendingSuggestionsOf = (studentId: string): CaseSuggestion[] => {
      const stored = working.sugs.filter((s) => s.studentId === studentId && s.status === "pending");
      const bh = behaviorSuggestionOf(studentId);
      return bh ? [...stored, bh] : stored;
    };

    const pendingSuggestions = base.students
      .filter((s) => base.canSeeSensitive(s.studentId))
      .flatMap((s) => pendingSuggestionsOf(s.studentId));

    const findSuggestion = (id: string): CaseSuggestion | undefined => {
      if (id.startsWith(BEHAVIOR_SUGGESTION_PREFIX)) {
        return behaviorSuggestionOf(id.slice(BEHAVIOR_SUGGESTION_PREFIX.length)) ?? undefined;
      }
      return working.sugs.find((s) => s.suggestionId === id);
    };

    const setSuggestionStatus = (id: string, status: CaseSuggestion["status"]) => {
      if (id.startsWith(BEHAVIOR_SUGGESTION_PREFIX)) return;
      commitSuggestions(working.sugs.map((s) => (s.suggestionId === id ? { ...s, status } : s)));
    };

    /* ----------------------------- เหตุ ----------------------------- */

    const newTrigger = (
      caseId: string,
      source: CaseTriggerSource,
      sourceRefId: string | null,
      detectedAt: string,
      summary?: string,
      planId: string | null = null
    ): CareCaseTrigger => ({
      triggerId: nextId("TRG"),
      caseId,
      source,
      sourceRefId,
      detectedAt,
      planId,
      ...(summary ? { summary } : {}),
    });

    const newPlan = (caseId: string, input: Omit<CarePlanInput, "triggerIds">): CarePlan => ({
      planId: nextId("PLAN"),
      caseId,
      supportType: input.supportType,
      careMethods: input.careMethods,
      goal: input.goal.trim(),
      targetDate: input.targetDate,
      createdBy: base.currentUser.userId,
      createdAt: nowThaiIso(),
    });

    const planError = (input: Omit<CarePlanInput, "triggerIds">): string | null => {
      const n = new Set(input.careMethods).size;
      if (n < CARE_METHODS_MIN || n > CARE_METHODS_MAX) return "เลือกวิธีการดูแล 1–5 วิธี";
      if (!input.goal.trim()) return "ระบุเป้าหมายของแผน";
      if (!input.targetDate) return "ระบุวันที่คาดว่าจะบรรลุเป้าหมาย";
      return null;
    };

    const auditTrigger = (t: CareCaseTrigger, userId?: string) =>
      base.logAudit(
        "CREATE",
        "care_case_triggers",
        t.triggerId,
        { after: { caseId: t.caseId, source: t.source, sourceRefId: t.sourceRefId } },
        userId
      );

    /** byUser = ครูเพิ่มเอง (ไม่ต้องแจ้งตัวเอง) / ไม่ระบุ = ระบบเพิ่ม (แจ้งครูประจำชั้นทุกคน) */
    const appendTrigger = (existing: CareCase, trigger: CareCaseTrigger, byUser = false) => {
      const careCase = { ...existing, triggers: [trigger, ...existing.triggers] };
      updateCase(existing.caseId, () => careCase);
      auditTrigger(trigger, byUser ? undefined : SYSTEM_USER_ID);
      // เหตุใหม่ยังไม่มีแผนรองรับ → แจ้งครูประจำชั้น
      const recipients = byUser ? othersInHomeroom(existing.studentId) : homeroomIds(existing.studentId);
      base.notify("case_trigger_added", recipients, existing.studentId);
      return careCase;
    };

    const raiseTrigger: CareSlice["raiseTrigger"] = (studentId, source, sourceRefId, mode, options) => {
      const student = base.getStudent(studentId);
      if (!student) return { kind: "ignored", reason: "unknown_student" };
      if (student.status !== "studying") return { kind: "ignored", reason: "not_studying" };
      const detectedAt = options?.detectedAt ?? nowThaiIso();
      const sameRef = (s: { source: CaseTriggerSource; sourceRefId: string | null }) =>
        sourceRefId !== null && s.source === source && s.sourceRefId === sourceRefId;

      const active = activeCaseOf(studentId);
      if (active) {
        if (active.triggers.some(sameRef)) return { kind: "ignored", reason: "duplicate" };
        const trigger = newTrigger(active.caseId, source, sourceRefId, detectedAt, options?.summary);
        const careCase = appendTrigger(active, trigger);
        return { kind: "appended", careCase, trigger };
      }

      if (mode === "suggest") {
        const dup = working.sugs.find((s) => s.studentId === studentId && sameRef(s));
        if (dup) return { kind: "ignored", reason: "duplicate" };
        const suggestion: CaseSuggestion = {
          suggestionId: nextId("SUG"),
          studentId,
          source,
          sourceRefId,
          detectedAt,
          ...(options?.summary ? { summary: options.summary } : {}),
          status: "pending",
        };
        commitSuggestions([suggestion, ...working.sugs]);
        return { kind: "suggested", suggestion };
      }

      const caseId = nextId("CASE");
      const trigger = newTrigger(caseId, source, sourceRefId, detectedAt, options?.summary);
      // คำแนะนำที่ค้างอยู่ของนักเรียนคนนี้ถูกรวมเป็นเหตุใน case ใหม่
      const pending = working.sugs.filter((s) => s.studentId === studentId && s.status === "pending");
      const extra = pending.map((s) => newTrigger(caseId, s.source, s.sourceRefId, s.detectedAt, s.summary));
      const careCase: CareCase = {
        caseId,
        studentId,
        openedBy: null,
        status: "active",
        openedAt: detectedAt.split("T")[0],
        closedBy: null,
        closeReason: null,
        closedAt: null,
        triggers: [trigger, ...extra],
        plans: [],
        followups: [],
        referrals: [],
      };
      commitCases([careCase, ...working.cases]);
      if (pending.length > 0) {
        commitSuggestions(working.sugs.map((s) => (pending.includes(s) ? { ...s, status: "accepted" as const } : s)));
      }
      base.logAudit("CREATE", "care_cases", caseId, { after: { studentId, openedBy: null } }, SYSTEM_USER_ID);
      [trigger, ...extra].forEach((t) => auditTrigger(t, SYSTEM_USER_ID));
      base.notify("case_opened", homeroomIds(studentId), studentId);
      return { kind: "opened", careCase, trigger };
    };

    /* --------------------------- เปิด case --------------------------- */

    const canManageCase = (studentId: string) => base.isHomeroomOf(studentId);

    const openCase: CareSlice["openCase"] = (studentId, input) => {
      const student = base.getStudent(studentId);
      if (!student) return { ok: false, error: "ไม่พบนักเรียน" };
      if (student.status !== "studying") return { ok: false, error: "นักเรียนไม่ได้อยู่ในสถานะกำลังศึกษา" };
      if (!canManageCase(studentId)) return { ok: false, error: "เฉพาะครูประจำชั้นของนักเรียนเปิด case ได้" };
      if (activeCaseOf(studentId)) return { ok: false, error: "นักเรียนมี case ที่เปิดอยู่แล้ว (ได้ครั้งละ 1 case)" };
      if (input.plan) {
        const err = planError(input.plan);
        if (err) return { ok: false, error: err };
      }
      const caseId = nextId("CASE");
      const now = nowThaiIso();
      const plan = input.plan ? newPlan(caseId, input.plan) : null;
      const trigger = newTrigger(
        caseId,
        input.source,
        input.sourceRefId ?? null,
        now,
        input.summary?.trim() || undefined,
        plan?.planId ?? null
      );
      const careCase: CareCase = {
        caseId,
        studentId,
        openedBy: base.currentUser.userId,
        status: "active",
        openedAt: now.split("T")[0],
        closedBy: null,
        closeReason: null,
        closedAt: null,
        triggers: [trigger],
        plans: plan ? [plan] : [],
        followups: [],
        referrals: [],
      };
      commitCases([careCase, ...working.cases]);
      base.logAudit("CREATE", "care_cases", caseId, { after: { studentId } });
      auditTrigger(trigger);
      if (plan) {
        base.logAudit("CREATE", "care_plans", plan.planId, {
          after: { caseId, supportType: plan.supportType, careMethods: plan.careMethods },
        });
      }
      // แจ้งครูประจำชั้นอีกคนของห้อง (ผู้เปิดรู้อยู่แล้ว)
      base.notify("case_opened", othersInHomeroom(studentId), studentId);
      return { ok: true, careCase };
    };

    const acceptSuggestion: CareSlice["acceptSuggestion"] = (suggestionId, plan) => {
      const s = findSuggestion(suggestionId);
      if (!s || s.status !== "pending") return { ok: false, error: "ไม่พบคำแนะนำ" };
      if (!canManageCase(s.studentId)) return { ok: false, error: "เฉพาะครูประจำชั้นของนักเรียนเปิด case ได้" };
      const source = s.source === "behavior" ? "behavior" : "manual";
      const active = activeCaseOf(s.studentId);
      if (active) {
        const trigger = newTrigger(active.caseId, source, s.sourceRefId, nowThaiIso(), s.summary);
        const careCase = appendTrigger(active, trigger, true);
        setSuggestionStatus(suggestionId, "accepted");
        return { ok: true, careCase };
      }
      const res = openCase(s.studentId, { source, sourceRefId: s.sourceRefId, summary: s.summary, plan });
      if (res.ok) setSuggestionStatus(suggestionId, "accepted");
      return res;
    };

    const dismissSuggestion: CareSlice["dismissSuggestion"] = (suggestionId) => {
      const s = findSuggestion(suggestionId);
      if (!s || !canManageCase(s.studentId)) return;
      if (s.source === "behavior" && suggestionId.startsWith(BEHAVIOR_SUGGESTION_PREFIX)) {
        const key = `${s.studentId}:${behavior.behaviorScoreOf(s.studentId)}`;
        setDismissedBehavior((prev) => [...prev, key]);
      } else {
        setSuggestionStatus(suggestionId, "dismissed");
      }
    };

    const addManualTrigger: CareSlice["addManualTrigger"] = (caseId, summary) => {
      const existing = getCase(caseId);
      if (!existing || existing.status !== "active") return { ok: false, error: "case นี้ปิดแล้ว" };
      if (!canManageCase(existing.studentId)) return { ok: false, error: "เฉพาะครูประจำชั้นของนักเรียน" };
      if (!summary.trim()) return { ok: false, error: "ระบุเหตุที่พบ" };
      const trigger = newTrigger(caseId, "manual", null, nowThaiIso(), summary.trim());
      appendTrigger(existing, trigger, true);
      return { ok: true, trigger };
    };

    /* ------------------------------ แผน ------------------------------ */

    const addPlan: CareSlice["addPlan"] = (caseId, input) => {
      const existing = getCase(caseId);
      if (!existing || existing.status !== "active") return { ok: false, error: "case นี้ปิดแล้ว" };
      if (!canManageCase(existing.studentId)) return { ok: false, error: "เฉพาะครูประจำชั้นจัดทำแผนได้" };
      const err = planError(input);
      if (err) return { ok: false, error: err };
      const plan = newPlan(caseId, input);
      const triggerIds = (input.triggerIds ?? []).filter((id) => existing.triggers.some((t) => t.triggerId === id));
      updateCase(caseId, (c) => ({
        ...c,
        plans: [...c.plans, plan],
        triggers: c.triggers.map((t) => (triggerIds.includes(t.triggerId) ? { ...t, planId: plan.planId } : t)),
      }));
      base.logAudit("CREATE", "care_plans", plan.planId, {
        after: { caseId, supportType: plan.supportType, careMethods: plan.careMethods, triggerIds },
      });
      triggerIds.forEach((id) => {
        const before = existing.triggers.find((t) => t.triggerId === id)?.planId ?? null;
        base.logAudit("UPDATE", "care_case_triggers", id, { before: { planId: before }, after: { planId: plan.planId } });
      });
      return { ok: true, plan };
    };

    const assignTriggerToPlan: CareSlice["assignTriggerToPlan"] = (triggerId, planId) => {
      const existing = working.cases.find((c) => c.triggers.some((t) => t.triggerId === triggerId));
      if (!existing || existing.status !== "active") return { ok: false, error: "case นี้ปิดแล้ว" };
      if (!canManageCase(existing.studentId)) return { ok: false, error: "เฉพาะครูประจำชั้นของนักเรียน" };
      if (!existing.plans.some((p) => p.planId === planId)) return { ok: false, error: "ไม่พบแผนใน case นี้" };
      const before = existing.triggers.find((t) => t.triggerId === triggerId)?.planId ?? null;
      if (before === planId) return { ok: true };
      updateCase(existing.caseId, (c) => ({
        ...c,
        triggers: c.triggers.map((t) => (t.triggerId === triggerId ? { ...t, planId } : t)),
      }));
      base.logAudit("UPDATE", "care_case_triggers", triggerId, { before: { planId: before }, after: { planId } });
      return { ok: true };
    };

    /* --------------------------- ติดตามผล --------------------------- */

    const followupBlockReason: CareSlice["followupBlockReason"] = (caseId) => {
      const c = getCase(caseId);
      if (!c) return "ไม่พบ case";
      if (c.status !== "active") return "case นี้ปิดแล้ว";
      if (!canManageCase(c.studentId)) return "เฉพาะครูประจำชั้นของนักเรียนบันทึกการติดตามผลได้";
      if (!base.isWindowOpen("care_record")) return "อยู่นอกช่วงดำเนินงานบันทึกการดูแล";
      if (c.plans.length === 0) return "ต้องจัดทำแผนช่วยเหลือก่อน จึงบันทึกการติดตามผลได้";
      return null;
    };

    const addFollowup: CareSlice["addFollowup"] = (caseId, planId, actionTaken, result) => {
      const blocked = followupBlockReason(caseId);
      if (blocked) return { ok: false, error: blocked };
      const c = getCase(caseId);
      if (!c?.plans.some((p) => p.planId === planId)) return { ok: false, error: "เลือกแผนที่ติดตามผล" };
      if (!actionTaken.trim()) return { ok: false, error: "ระบุสิ่งที่ดำเนินการ" };
      const followup: CareFollowup = {
        followupId: nextId("FU"),
        caseId,
        planId,
        actionTaken: actionTaken.trim(),
        result: result.trim() || "-",
        followupDate: today(),
        recordedBy: base.currentUser.userId,
      };
      updateCase(caseId, (x) => ({ ...x, followups: [followup, ...x.followups] }));
      base.logAudit("CREATE", "care_followups", followup.followupId, { after: { caseId, planId } });
      return { ok: true, followup };
    };

    /* ------------------------------ ปิด ------------------------------ */

    const closeBlockReason: CareSlice["closeBlockReason"] = (caseId) => {
      const c = getCase(caseId);
      if (!c) return "ไม่พบ case";
      if (c.status !== "active") return "case นี้ปิดแล้ว";
      if (!canManageCase(c.studentId)) return "เฉพาะครูประจำชั้นของนักเรียนปิด case ได้";
      if (c.followups.length === 0) return "ต้องมีการติดตามผลอย่างน้อย 1 ครั้งก่อนปิด case";
      return null;
    };

    const closeCase: CareSlice["closeCase"] = (caseId) => {
      const blocked = closeBlockReason(caseId);
      if (blocked) return { ok: false, error: blocked };
      updateCase(caseId, (c) => ({
        ...c,
        status: "closed",
        closedBy: base.currentUser.userId,
        closeReason: "resolved",
        closedAt: today(),
      }));
      base.logAudit("UPDATE", "care_cases", caseId, {
        before: { status: "active" },
        after: { status: "closed", closeReason: "resolved" },
      });
      return { ok: true };
    };

    const applyStudentStatusChange: CareSlice["applyStudentStatusChange"] = (studentId, status) => {
      if (status === "studying") return null;
      const active = activeCaseOf(studentId);
      if (!active) return null;
      const closed: CareCase = {
        ...active,
        status: "closed",
        closedBy: null,
        closeReason: status,
        closedAt: today(),
      };
      updateCase(active.caseId, () => closed);
      base.logAudit(
        "UPDATE",
        "care_cases",
        active.caseId,
        { before: { status: "active" }, after: { status: "closed", closeReason: status } },
        SYSTEM_USER_ID
      );
      return closed;
    };

    /* ------------------------- ส่งต่อภายนอก ------------------------- */

    const referralBlockReason: CareSlice["referralBlockReason"] = (caseId) => {
      const c = getCase(caseId);
      if (!c) return "ไม่พบ case";
      if (c.status !== "active") return "case นี้ปิดแล้ว";
      if (!canManageCase(c.studentId)) return "เฉพาะครูประจำชั้นของนักเรียน";
      if (!base.canReferExternally(c.studentId)) {
        return base.consentStatusOf(c.studentId) === "declined"
          ? "ผู้ปกครองไม่ยินยอมให้ส่งต่อข้อมูลแก่หน่วยงานภายนอกในปีการศึกษานี้"
          : "ยังไม่ได้รับความยินยอมจากผู้ปกครองสำหรับปีการศึกษานี้";
      }
      return null;
    };

    const createReferral: CareSlice["createReferral"] = (caseId, externalAgency, content) => {
      const blocked = referralBlockReason(caseId);
      if (blocked) return { ok: false, error: blocked };
      if (!externalAgency.trim()) return { ok: false, error: "ระบุหน่วยงานภายนอก" };
      if (!content.trim()) return { ok: false, error: "ระบุเนื้อหาสรุปที่ส่งต่อ" };
      const referral: ReferralDocument = {
        referralId: nextId("REF"),
        caseId,
        externalAgency: externalAgency.trim(),
        content: content.trim(),
        createdBy: base.currentUser.userId,
        createdAt: nowThaiIso(),
      };
      // การส่งต่อภายนอกไม่ทำให้ case ปิด
      updateCase(caseId, (c) => ({ ...c, referrals: [referral, ...c.referrals] }));
      base.logAudit("CREATE", "referral_documents", referral.referralId, {
        after: { caseId, externalAgency: referral.externalAgency },
      });
      return { ok: true, referral };
    };

    return {
      careCases,
      activeCaseOf,
      caseOf,
      casesOf,
      getCase,
      raiseTrigger,
      pendingSuggestionsOf,
      pendingSuggestions,
      acceptSuggestion,
      dismissSuggestion,
      canManageCase,
      openCase,
      addManualTrigger,
      addPlan,
      assignTriggerToPlan,
      followupBlockReason,
      addFollowup,
      closeBlockReason,
      closeCase,
      applyStudentStatusChange,
      referralBlockReason,
      createReferral,
    };
  }, [base, behavior, careCases, suggestions, dismissedBehavior]);
}
