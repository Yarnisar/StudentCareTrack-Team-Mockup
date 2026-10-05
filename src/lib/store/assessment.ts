/**
 * Assessment slice: Red Flag, 9S, SDQ (ADR-0002)
 *
 * ลำดับตามภาคเรียน (lib/rules.ts: needsRedFlag, sdqRoundFor, sdqRequiredFor)
 * - ภาคเรียนที่ 1: ทุกคนทำ Red Flag → 9S (ข้าม 9S เมื่อ Red Flag ควรดูแล) → ควรดูแลทำ SDQ ครั้งที่ 1
 * - ภาคเรียนที่ 2: ไม่ทำ Red Flag/9S ซ้ำ ยกเว้นคนที่ยังไม่เคยประเมินในปีนี้ → SDQ ครั้งที่ 2
 * - Red Flag/9S: 1 ฉบับต่อนักเรียนต่อภาคเรียน แก้ได้จนปิดช่วงดำเนินงานคัดกรอง (screening)
 * - SDQ: 1 ฉบับต่อ (นักเรียน, ภาคเรียน, ครั้ง, ผู้ประเมิน) ส่งแล้วแก้ไม่ได้ เปิดรับเฉพาะในช่วงดำเนินงาน sdq
 * - Red Flag ควรดูแล → เปิด case อัตโนมัติ; ผล SDQ รวมมีปัญหา → เปิด case, เสี่ยง → แนะนำ (care.raiseTrigger)
 * - เปิดแบบ SDQ ได้เมื่อต้องทำ SDQ รอบนี้ (sdqRequiredFor) และอยู่ในช่วงดำเนินงาน sdq — นอกช่วงรอเปิดภายหลัง
 * - Red Flag/9S แก้จากควรดูแลกลับเป็นปกติ → ยกเลิก (void) ฉบับ SDQ รอบนี้ที่ยังไม่มีใครตอบ ฉบับที่ส่งแล้วคงไว้
 * - ฉบับที่ยกเลิกแล้วเก็บไว้ในสถานะ voided (ไม่ลบ) แต่ไม่นับในทุกการค้นหา/ผลรวม
 */

import { useMemo, useState } from "react";
import {
  academicTerms,
  nineSAssessments as seedNineS,
  redFlagAssessments as seedRedFlags,
  sdqAssessments as seedSdq,
  studentUserId,
} from "../mock-data";
import { triggerModeForGroup, triggerModeForRedFlag } from "../care-rules";
import {
  combineSdq,
  evaluateNineS,
  evaluateRedFlag,
  needsRedFlag,
  scoreSdq,
  SDQ_LEVEL_TO_GROUP,
  sdqRatersFor,
  sdqRequiredFor,
  sdqRoundFor,
  sdqSetRef,
} from "../rules";
import { nowThaiIso } from "../format";
import {
  SDQ_LEVEL_LABEL,
  SDQ_RATER_LABEL,
  type AssessmentNextStep,
  type AssessmentPlan,
  type CombinedSdqResult,
  type NineSAssessment,
  type RedFlagAssessment,
  type SdqAssessment,
  type SdqRater,
} from "../types";
import type { CareSlice, RaiseTriggerResult } from "./care";
import type { PlatformSlice } from "./platform";
import { nextId } from "./ids";

export type AssessmentResult<T> = ({ ok: true } & T) | { ok: false; error: string };

export type SaveRedFlagResult = AssessmentResult<{
  record: RedFlagAssessment;
  /** ผลการส่งเหตุเปิด case (null = ผลปกติ ไม่ได้ส่ง) */
  trigger: RaiseTriggerResult | null;
  /** เปิดแบบ SDQ ให้ใหม่กี่ฉบับ */
  sdqOpened: number;
  /** ยกเลิกแบบ SDQ ที่ยังไม่มีใครตอบกี่ฉบับ (ผลแก้กลับเป็นปกติ) */
  sdqVoided: number;
}>;

export type SaveNineSResult = AssessmentResult<{ record: NineSAssessment; sdqOpened: number; sdqVoided: number }>;

export type SaveSdqResult = AssessmentResult<{
  form: SdqAssessment;
  combined: CombinedSdqResult | null;
  /** ผลการส่งเหตุเปิด case จากผล SDQ รวม (null = ยังไม่มีผลรวม หรือผลรวมปกติ) */
  trigger: RaiseTriggerResult | null;
}>;

export type OpenSdqSetResult = AssessmentResult<{ created: SdqAssessment[] }>;

export interface AssessmentSlice {
  redFlags: RedFlagAssessment[];
  nineS: NineSAssessment[];
  /** SDQ ทุกฉบับ ทุกภาคเรียน (ไม่รวมฉบับที่ยกเลิกแล้ว) */
  sdq: SdqAssessment[];
  /** SDQ ทุกฉบับของนักเรียน (ทุกภาคเรียน/ทุกครั้ง) */
  sdqOf: (studentId: string) => SdqAssessment[];
  /** SDQ ของรอบปัจจุบัน (ภาคเรียนปัจจุบัน) */
  currentSdqOf: (studentId: string) => SdqAssessment[];
  /** ฉบับเดียวของผู้ประเมิน (ค่าเริ่มต้น = ภาคเรียนปัจจุบัน) */
  sdqFormFor: (studentId: string, rater: SdqRater, termId?: string) => SdqAssessment | undefined;
  /** ผล SDQ รวม (ค่าเริ่มต้น = ภาคเรียนปัจจุบัน) — null เมื่อยังไม่เปิดแบบประเมิน */
  combinedSdqOf: (studentId: string, termId?: string) => CombinedSdqResult | null;
  /** ผล SDQ รวมล่าสุดที่มีผลแล้ว (ฉบับครูส่งแล้ว) ย้อนหลังได้ */
  latestCombinedSdqOf: (studentId: string) => CombinedSdqResult | null;

  /** Red Flag / 9S ของภาคเรียนที่ระบุ (ค่าเริ่มต้น = ภาคเรียนปัจจุบัน) */
  redFlagOf: (studentId: string, termId?: string) => RedFlagAssessment | undefined;
  nineSOf: (studentId: string, termId?: string) => NineSAssessment | undefined;
  /** สถานะและขั้นถัดไปของนักเรียนในภาคเรียนปัจจุบัน */
  assessmentPlanOf: (studentId: string) => AssessmentPlan;

  /** เหตุที่บันทึก Red Flag / 9S ไม่ได้ตอนนี้ (null = บันทึกได้) */
  redFlagBlockReason: (studentId: string) => string | null;
  nineSBlockReason: (studentId: string) => string | null;
  /** เหตุที่ส่ง SDQ ฉบับนี้ไม่ได้ตอนนี้ (null = ส่งได้) — ตรวจสิทธิ์ของผู้ใช้ปัจจุบันด้วย */
  sdqBlockReason: (studentId: string, rater: SdqRater) => string | null;

  saveRedFlag: (studentId: string, answers: Record<string, boolean>) => SaveRedFlagResult;
  saveNineS: (studentId: string, answers: Record<string, 0 | 1 | 2>) => SaveNineSResult;
  /** ส่ง SDQ (ส่งแล้วแก้ไม่ได้) — ฉบับผู้ปกครอง: ผู้ปกครองคนที่ส่งก่อนเป็นผู้ประเมิน */
  saveSdq: (studentId: string, rater: SdqRater, answers: Record<number, 0 | 1 | 2>) => SaveSdqResult;
  /**
   * เปิดแบบ SDQ ของรอบปัจจุบันที่ยังไม่มี (ประถมไม่มีฉบับนักเรียน) และแจ้ง sdq_requested
   * เปิดได้เฉพาะเมื่อนักเรียนต้องทำ SDQ รอบนี้ และอยู่ในช่วงดำเนินงาน sdq
   */
  openSdqSet: (studentId: string) => OpenSdqSetResult;

  /** เปิดดูคำตอบรายข้อได้หรือไม่ (เฉพาะฉบับที่ผลมีปัญหา + ผู้ที่เห็นข้อมูลอ่อนไหว) */
  canViewSdqAnswers: (form: SdqAssessment) => boolean;
  /** เปิดดูคำตอบรายข้อ — บันทึก VIEW_SENSITIVE ทุกครั้ง; null = ไม่มีสิทธิ์ */
  viewSdqAnswers: (formId: string) => Record<number, 0 | 1 | 2> | null;
}

const termById = (termId: string) => academicTerms.find((t) => t.termId === termId);
const newest = <T extends { assessedAt: string }>(list: T[]) =>
  [...list].sort((a, b) => b.assessedAt.localeCompare(a.assessedAt))[0];

export function useAssessmentSlice(base: PlatformSlice, care: CareSlice): AssessmentSlice {
  const [redFlags, setRedFlags] = useState<RedFlagAssessment[]>(seedRedFlags);
  const [nineS, setNineS] = useState<NineSAssessment[]>(seedNineS);
  const [sdq, setSdq] = useState<SdqAssessment[]>(seedSdq);

  return useMemo<AssessmentSlice>(() => {
    const term = base.currentTerm;
    const termId = term.termId;
    const round = sdqRoundFor(term);
    // สำเนาที่ใช้ภายใน event เดียว (เช่น Red Flag แล้วเปิด/ยกเลิก SDQ ต่อทันที)
    const working = { sdq, redFlags, nineS };

    const inYear = (tid: string) => termById(tid)?.academicYear === term.academicYear;
    const redFlagsOf = (studentId: string) => working.redFlags.filter((r) => r.studentId === studentId);
    const nineSOfStudent = (studentId: string) => working.nineS.filter((r) => r.studentId === studentId);

    const redFlagOf: AssessmentSlice["redFlagOf"] = (studentId, tid = termId) =>
      working.redFlags.find((r) => r.studentId === studentId && r.termId === tid);
    const nineSOf: AssessmentSlice["nineSOf"] = (studentId, tid = termId) =>
      working.nineS.find((r) => r.studentId === studentId && r.termId === tid);

    const sdqOf = (studentId: string) =>
      working.sdq.filter((s) => s.studentId === studentId && s.status !== "voided");
    const setOf = (studentId: string, tid: string) => sdqOf(studentId).filter((s) => s.termId === tid);
    const currentSdqOf = (studentId: string) => setOf(studentId, termId);
    const sdqFormFor: AssessmentSlice["sdqFormFor"] = (studentId, rater, tid = termId) =>
      setOf(studentId, tid).find((s) => s.rater === rater);
    const combinedSdqOf: AssessmentSlice["combinedSdqOf"] = (studentId, tid = termId) =>
      combineSdq(setOf(studentId, tid));
    const latestCombinedSdqOf = (studentId: string) => {
      const tids = [...new Set(sdqOf(studentId).map((s) => s.termId))].sort().reverse();
      for (const tid of tids) {
        const c = combinedSdqOf(studentId, tid);
        if (c?.level) return c;
      }
      return null;
    };

    const assessmentPlanOf = (studentId: string): AssessmentPlan => {
      const redFlag = newest(redFlagsOf(studentId).filter((r) => inYear(r.termId)));
      const nine = newest(nineSOfStudent(studentId).filter((r) => inYear(r.termId)));
      const needsCare: boolean | null = !redFlag
        ? null
        : redFlag.result === "needs_care"
          ? true
          : nine
            ? nine.result === "needs_care"
            : null;
      const sdqForms = currentSdqOf(studentId);
      const combined = combineSdq(sdqForms);
      const sdqRequired = sdqRequiredFor(round, needsCare, base.schoolSettings.sdq2ForNormalStudents);
      const rfTerms = redFlagsOf(studentId).flatMap((r) => termById(r.termId) ?? []);
      let next: AssessmentNextStep;
      if (!redFlag && needsRedFlag(rfTerms, term)) next = "red_flag";
      else if (redFlag && redFlag.result === "normal" && !nine) next = "nine_s";
      else if (sdqForms.length > 0) next = sdqForms.every((f) => f.status === "submitted") ? "done" : "sdq";
      else if (!sdqRequired) next = "not_required";
      else next = base.isWindowOpen("sdq") ? "open_sdq" : "wait_sdq_window";
      return {
        studentId,
        termId,
        round,
        redFlag,
        nineS: nine,
        needsCare,
        carriedFromEarlierTerm: !!redFlag && redFlag.termId !== termId,
        sdqRequired,
        sdqForms,
        combined,
        next,
      };
    };

    /* ----------------------------- สิทธิ์/ช่วงเวลา ----------------------------- */

    const staffBlock = (studentId: string): string | null => {
      if (!base.getStudent(studentId)) return "ไม่พบข้อมูลนักเรียน";
      if (!base.canEdit(studentId)) return "บันทึกได้เฉพาะครูประจำชั้นของนักเรียนและแอดมิน";
      return null;
    };

    const redFlagBlockReason = (studentId: string): string | null => {
      const staff = staffBlock(studentId);
      if (staff) return staff;
      const rfTerms = redFlagsOf(studentId).flatMap((r) => termById(r.termId) ?? []);
      if (!redFlagOf(studentId) && !needsRedFlag(rfTerms, term))
        return "ภาคเรียนที่ 2 ไม่ต้องทำ Red Flag ซ้ำ — ใช้ผลจากภาคเรียนที่ 1";
      if (!base.isWindowOpen("screening")) return "อยู่นอกช่วงดำเนินงานคัดกรอง — ดูได้แต่บันทึกไม่ได้";
      return null;
    };

    const nineSBlockReason = (studentId: string): string | null => {
      const staff = staffBlock(studentId);
      if (staff) return staff;
      const rf = redFlagOf(studentId);
      if (!nineSOf(studentId)) {
        if (!rf) {
          return assessmentPlanOf(studentId).carriedFromEarlierTerm
            ? "ภาคเรียนที่ 2 ไม่ต้องทำ 9S ซ้ำ — ใช้ผลจากภาคเรียนที่ 1"
            : "ต้องทำแบบคัดกรอง Red Flag ของภาคเรียนนี้ก่อน";
        }
        if (rf.result === "needs_care") return "ผล Red Flag ควรดูแล — ข้าม 9S ไปทำ SDQ ได้เลย";
      }
      if (!base.isWindowOpen("screening")) return "อยู่นอกช่วงดำเนินงานคัดกรอง — ดูได้แต่บันทึกไม่ได้";
      return null;
    };

    const isGuardian = (studentId: string) =>
      base.currentUser.role === "parent" &&
      base.guardiansOf(studentId).some((g) => g.user.userId === base.currentUser.userId);

    const sdqBlockReason = (studentId: string, rater: SdqRater): string | null => {
      const student = base.getStudent(studentId);
      if (!student) return "ไม่พบข้อมูลนักเรียน";
      const form = sdqFormFor(studentId, rater);
      if (!form) return `ยังไม่มีคำขอให้ทำ SDQ ${SDQ_RATER_LABEL[rater]} ครั้งที่ ${round}`;
      if (form.status === "submitted") {
        return rater === "parent" && form.raterUserId !== base.currentUser.userId
          ? `${base.nameOf(form.raterUserId)} ส่งฉบับผู้ปกครองแล้ว — ดูได้แต่แก้ไม่ได้`
          : "ส่งแบบประเมินฉบับนี้แล้ว — แก้ไขไม่ได้";
      }
      const user = base.currentUser;
      if (rater === "teacher" && !base.canEdit(studentId)) return "ฉบับครูทำได้เฉพาะครูประจำชั้นของนักเรียนและแอดมิน";
      if (rater === "student" && user.userId !== studentUserId(studentId)) return "ฉบับนักเรียนทำได้เฉพาะนักเรียนเจ้าของข้อมูล";
      if (rater === "parent" && !isGuardian(studentId)) return "ฉบับผู้ปกครองทำได้เฉพาะผู้ปกครองของนักเรียน";
      if (!base.isWindowOpen("sdq")) return "อยู่นอกช่วงดำเนินงาน SDQ — ดูได้แต่บันทึกไม่ได้";
      return null;
    };

    /* --------------------------------- SDQ --------------------------------- */

    const openSdqSet: AssessmentSlice["openSdqSet"] = (studentId) => {
      const student = base.getStudent(studentId);
      if (!student) return { ok: false, error: "ไม่พบข้อมูลนักเรียน" };
      if (!base.canEdit(studentId)) return { ok: false, error: "เปิดแบบประเมินได้เฉพาะครูประจำชั้นของนักเรียนและแอดมิน" };
      if (!assessmentPlanOf(studentId).sdqRequired)
        return { ok: false, error: `นักเรียนไม่ต้องทำ SDQ ครั้งที่ ${round} ตามผล Red Flag/9S และการตั้งค่าของโรงเรียน` };
      if (!base.isWindowOpen("sdq"))
        return { ok: false, error: "อยู่นอกช่วงดำเนินงาน SDQ — เปิดแบบประเมินได้เมื่อถึงช่วงทำ SDQ" };
      const existing = new Set(currentSdqOf(studentId).map((s) => s.rater));
      const at = nowThaiIso();
      const created = sdqRatersFor(student.gradeLevel)
        .filter((r) => !existing.has(r))
        .map<SdqAssessment>((rater) => ({
          id: nextId("SDQ"),
          studentId,
          termId,
          round,
          rater,
          raterUserId: null,
          answers: {},
          totalDifficulties: null,
          scaleScores: null,
          level: null,
          status: "pending",
          requestedAt: at,
          submittedAt: null,
        }));
      if (created.length === 0) return { ok: true, created };
      working.sdq = [...working.sdq, ...created];
      setSdq(working.sdq);
      for (const form of created) {
        base.logAudit("CREATE", "sdq_assessments", form.id, {
          after: { studentId, rater: form.rater, round: form.round, status: "pending" },
        });
      }
      // ขอให้ผู้ปกครองทุกคน (ฉบับผู้ปกครอง) และนักเรียน (ฉบับประเมินตนเอง) ทำแบบประเมิน
      const recipients = [
        ...(created.some((f) => f.rater === "parent") ? base.recipientsOf(studentId, ["guardians"]) : []),
        ...(created.some((f) => f.rater === "student") ? [studentUserId(studentId)] : []),
      ];
      if (recipients.length > 0) base.notify("sdq_requested", recipients, studentId);
      return { ok: true, created };
    };

    /**
     * ผลแก้กลับเป็นปกติ: ถ้าไม่ต้องทำ SDQ รอบนี้แล้ว ยกเลิกฉบับที่ยังรอทำและยังไม่มีคำตอบ (ฉบับที่ส่งแล้วไม่แตะ)
     */
    const voidUnansweredSdq = (studentId: string, reason: string): number => {
      if (assessmentPlanOf(studentId).sdqRequired) return 0;
      const targets = currentSdqOf(studentId).filter(
        (s) => s.status === "pending" && Object.keys(s.answers).length === 0
      );
      if (targets.length === 0) return 0;
      const ids = new Set(targets.map((s) => s.id));
      working.sdq = working.sdq.map((s) => (ids.has(s.id) ? { ...s, status: "voided", voidReason: reason } : s));
      setSdq(working.sdq);
      for (const form of targets) {
        base.logAudit("VOID", "sdq_assessments", form.id, {
          before: { status: "pending" },
          after: { studentId, rater: form.rater, round: form.round, status: "voided" },
          reason,
        });
      }
      return targets.length;
    };

    const saveSdq: AssessmentSlice["saveSdq"] = (studentId, rater, answers) => {
      const blocked = sdqBlockReason(studentId, rater);
      if (blocked) return { ok: false, error: blocked };
      const form = sdqFormFor(studentId, rater)!;
      const { scaleScores, totalDifficulties, level } = scoreSdq(answers, rater);
      const updated: SdqAssessment = {
        ...form,
        raterUserId: rater === "student" ? studentUserId(studentId) : base.currentUser.userId,
        answers,
        scaleScores,
        totalDifficulties,
        level,
        status: "submitted",
        submittedAt: nowThaiIso(),
      };
      // ไม่บันทึกคำตอบ/คะแนนลง audit (ข้อมูลอ่อนไหว) — บันทึกแค่การเปลี่ยนสถานะ
      base.logAudit("UPDATE", "sdq_assessments", updated.id, {
        before: { status: "pending" },
        after: { studentId, rater, round: updated.round, status: "submitted" },
      });
      working.sdq = working.sdq.map((s) => (s.id === updated.id ? updated : s));
      setSdq(working.sdq);

      const combined = combineSdq(currentSdqOf(studentId));
      let trigger: RaiseTriggerResult | null = null;
      if (combined?.level) {
        const mode = triggerModeForGroup(SDQ_LEVEL_TO_GROUP[combined.level]);
        if (mode) {
          trigger = care.raiseTrigger(studentId, "sdq", sdqSetRef(studentId, termId, round), mode, {
            summary: `ผล SDQ รวม${SDQ_LEVEL_LABEL[combined.level]} (ครั้งที่ ${round})`,
          });
        }
      }
      return { ok: true, form: updated, combined, trigger };
    };

    const canViewSdqAnswers = (form: SdqAssessment) =>
      form.status === "submitted" && form.level === "problem" && base.canSeeSensitive(form.studentId);

    const viewSdqAnswers: AssessmentSlice["viewSdqAnswers"] = (formId) => {
      const form = working.sdq.find((s) => s.id === formId);
      if (!form || !canViewSdqAnswers(form)) return null;
      base.logSensitiveView("sdq_assessments", form.id, { always: true, note: "เปิดดูคำตอบรายข้อ SDQ" });
      return form.answers;
    };

    /* ---------------------------- Red Flag / 9S ---------------------------- */

    const saveRedFlag: AssessmentSlice["saveRedFlag"] = (studentId, answers) => {
      const blocked = redFlagBlockReason(studentId);
      if (blocked) return { ok: false, error: blocked };
      const result = evaluateRedFlag(answers);
      const previous = redFlagOf(studentId);
      const record: RedFlagAssessment = {
        id: previous?.id ?? nextId("RF"),
        studentId,
        termId,
        answers,
        result,
        assessedBy: base.currentUser.userId,
        assessedAt: nowThaiIso(),
      };
      working.redFlags = [record, ...working.redFlags.filter((r) => r.id !== record.id)];
      setRedFlags(working.redFlags);
      base.logAudit(previous ? "UPDATE" : "CREATE", "red_flag_assessments", record.id, {
        ...(previous ? { before: { result: previous.result } } : {}),
        after: { studentId, termId, result },
      });
      let trigger: RaiseTriggerResult | null = null;
      let sdqOpened = 0;
      let sdqVoided = 0;
      const mode = triggerModeForRedFlag(result === "needs_care");
      if (mode) {
        trigger = care.raiseTrigger(studentId, "red_flag", record.id, mode, { summary: "ผล Red Flag ควรดูแล" });
        // นอกช่วงดำเนินงาน sdq จะไม่เปิด — ขั้นถัดไปเป็น "รอเปิดช่วงทำ SDQ"
        const opened = openSdqSet(studentId);
        if (opened.ok) sdqOpened = opened.created.length;
      }
      if (previous?.result === "needs_care" && result === "normal") {
        sdqVoided = voidUnansweredSdq(studentId, "แก้ผล Red Flag จากควรดูแลเป็นปกติ");
      }
      return { ok: true, record, trigger, sdqOpened, sdqVoided };
    };

    const saveNineS: AssessmentSlice["saveNineS"] = (studentId, answers) => {
      const blocked = nineSBlockReason(studentId);
      if (blocked) return { ok: false, error: blocked };
      const { clusterScores, clusterResults, result } = evaluateNineS(answers);
      const previous = nineSOf(studentId);
      const record: NineSAssessment = {
        id: previous?.id ?? nextId("NS"),
        studentId,
        termId,
        clusterScores,
        clusterResults,
        result,
        assessedBy: base.currentUser.userId,
        assessedAt: nowThaiIso(),
      };
      working.nineS = [record, ...working.nineS.filter((r) => r.id !== record.id)];
      setNineS(working.nineS);
      base.logAudit(previous ? "UPDATE" : "CREATE", "nine_s_assessments", record.id, {
        ...(previous ? { before: { result: previous.result } } : {}),
        after: { studentId, termId, result },
      });
      // 9S ควรดูแล → ขอ SDQ เท่านั้น (ไม่เปิด case อัตโนมัติ)
      let sdqOpened = 0;
      let sdqVoided = 0;
      if (result === "needs_care") {
        const opened = openSdqSet(studentId);
        if (opened.ok) sdqOpened = opened.created.length;
      } else if (previous?.result === "needs_care") {
        sdqVoided = voidUnansweredSdq(studentId, "แก้ผล 9S จากควรดูแลเป็นปกติ");
      }
      return { ok: true, record, sdqOpened, sdqVoided };
    };

    return {
      redFlags,
      nineS,
      sdq: sdq.filter((s) => s.status !== "voided"),
      sdqOf,
      currentSdqOf,
      sdqFormFor,
      combinedSdqOf,
      latestCombinedSdqOf,
      redFlagOf,
      nineSOf,
      assessmentPlanOf,
      redFlagBlockReason,
      nineSBlockReason,
      sdqBlockReason,
      saveRedFlag,
      saveNineS,
      saveSdq,
      openSdqSet,
      canViewSdqAnswers,
      viewSdqAnswers,
    };
  }, [base, care, redFlags, nineS, sdq]);
}
