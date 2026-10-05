/**
 * Screening slice: การคัดกรอง 6 มิติ
 *
 * - 1 ฉบับต่อนักเรียนต่อภาคเรียน (upsert) แก้ได้จนปิดช่วงดำเนินงาน screening แล้วล็อก
 *   แอดมินปลดล็อกรายฉบับได้ (audit UNLOCK) — มีผลจนกว่าจะรับรองข้อมูลอีกครั้ง
 * - ร่าง → รับรองแล้ว (เฉพาะครูประจำชั้น) นับว่าส่งแล้วเมื่อรับรองแล้วเท่านั้น แก้หลังรับรอง = กลับเป็นร่าง
 * - ผลรายมิติ = ผลที่ระบบคำนวณ (รวมรายการอัตโนมัติ mt3/mt4/bh1) + ผลที่ครูเลือก (±1 ระดับ + เหตุผล)
 * - เหตุเปิด case ส่งตอนรับรอง โดยใช้ผลที่ระบบคำนวณ: มีปัญหา → เปิด case, เสี่ยง → แนะนำ
 */

import { useMemo, useState } from "react";
import { screenings as seedScreenings } from "../mock-data";
import { triggerModeForGroups } from "../care-rules";
import {
  adjustmentError,
  adjustmentOptions,
  computeDimensionResult,
  derivedItemIds,
  isMentalPending,
  overallRisk,
  SCREENING_ITEMS,
  type DerivedFacts,
} from "../rules";
import { nowThaiIso } from "../format";
import {
  DIMENSION_LABEL,
  DIMENSION_ORDER,
  RISK_LABEL,
  type DimensionResult,
  type RiskGroup,
  type Screening,
  type ScreeningDimension,
  type ScreeningDimensionInput,
  type ScreeningResult,
} from "../types";
import type { AssessmentSlice } from "./assessment";
import type { BehaviorSlice } from "./behavior";
import type { CareSlice, RaiseTriggerResult } from "./care";
import type { PlatformSlice } from "./platform";
import { nextId } from "./ids";

export type ScreeningInputs = Record<ScreeningDimension, ScreeningDimensionInput>;

export type ScreeningActionResult<T = object> = ({ ok: true; screening: Screening } & T) | { ok: false; error: string };

export interface ScreeningSlice {
  screenings: Screening[];
  /** การคัดกรองของภาคเรียน (ค่าเริ่มต้น = ภาคเรียนปัจจุบัน) */
  screeningOf: (studentId: string, termId?: string) => Screening | undefined;
  /** ฉบับล่าสุด (ทุกสถานะ ทุกภาคเรียน) */
  latestScreening: (studentId: string) => Screening | undefined;
  /** ฉบับล่าสุดที่รับรองแล้ว (นับว่าส่งแล้ว) */
  latestCertifiedScreening: (studentId: string) => Screening | undefined;
  /** ผลรวมจากฉบับล่าสุดที่รับรองแล้ว (null = ยังไม่มี) */
  overallRiskOf: (studentId: string) => DimensionResult | null;

  /** ข้อมูลสดที่ใช้กำหนดรายการอัตโนมัติ (Red Flag/9S ของปีนี้ + มาสายเดือนนี้) */
  derivedFactsOf: (studentId: string) => DerivedFacts;
  /** คำนวณผลรายมิติจากรายการที่ครูติ๊ก + รายการอัตโนมัติปัจจุบัน (ใช้แสดงผลสดในฟอร์ม) */
  previewScreening: (studentId: string, inputs: ScreeningInputs) => ScreeningResult[];

  /** ล็อกแล้วหรือไม่ (นอกช่วงดำเนินงานและไม่ได้ปลดล็อก) */
  isScreeningLocked: (screening: Screening) => boolean;
  /** เหตุที่บันทึกการคัดกรองภาคเรียนนี้ไม่ได้ (null = บันทึกได้) */
  screeningEditBlockReason: (studentId: string) => string | null;
  saveScreening: (studentId: string, inputs: ScreeningInputs) => ScreeningActionResult;

  certifyBlockReason: (screeningId: string) => string | null;
  /** ครูประจำชั้นรับรองข้อมูล แล้วส่งเหตุเปิด case ตามผลที่ระบบคำนวณ */
  certifyScreening: (screeningId: string) => ScreeningActionResult<{ trigger: RaiseTriggerResult | null }>;

  unlockBlockReason: (screeningId: string) => string | null;
  /** แอดมินปลดล็อกฉบับที่ล็อกแล้ว (บันทึก UNLOCK พร้อมเหตุผล) */
  unlockScreening: (screeningId: string, reason: string) => ScreeningActionResult;
}

const dimensionOf = (itemId: string) => SCREENING_ITEMS.find((i) => i.id === itemId)?.dimension;
const derivedSet = new Set(SCREENING_ITEMS.filter((i) => i.derived).map((i) => i.id));

export function useScreeningSlice(
  base: PlatformSlice,
  behavior: BehaviorSlice,
  care: CareSlice,
  assessment: AssessmentSlice
): ScreeningSlice {
  const [screenings, setScreenings] = useState<Screening[]>(seedScreenings);

  return useMemo<ScreeningSlice>(() => {
    const termId = base.currentTerm.termId;
    const byNewest = (list: Screening[]) => [...list].sort((a, b) => b.screenedAt.localeCompare(a.screenedAt));

    const screeningOf: ScreeningSlice["screeningOf"] = (studentId, tid = termId) =>
      screenings.find((s) => s.studentId === studentId && s.termId === tid);
    const getScreening = (id: string) => screenings.find((s) => s.screeningId === id);
    const latestScreening = (studentId: string) => byNewest(screenings.filter((s) => s.studentId === studentId))[0];
    const latestCertifiedScreening = (studentId: string) =>
      byNewest(screenings.filter((s) => s.studentId === studentId && s.status === "certified"))[0];
    const overallRiskOf = (studentId: string): DimensionResult | null => {
      const sc = latestCertifiedScreening(studentId);
      return sc ? overallRisk(sc.results.map((r) => r.group)) : null;
    };

    const derivedFactsOf = (studentId: string): DerivedFacts => {
      const plan = assessment.assessmentPlanOf(studentId);
      return {
        redFlag: plan.redFlag?.result ?? null,
        nineS: plan.nineS?.result ?? null,
        confirmedLateCount: behavior.confirmedLateCountOf(studentId),
        lateAlertThreshold: base.schoolSettings.lateAlertThreshold,
      };
    };

    const buildResults = (studentId: string, screeningId: string, inputs: ScreeningInputs): ScreeningResult[] => {
      const facts = derivedFactsOf(studentId);
      const derived = derivedItemIds(facts);
      const pending = isMentalPending(facts);
      return DIMENSION_ORDER.map((dimension) => {
        const input = inputs[dimension];
        const checked = (input?.checkedItemIds ?? []).filter((id) => dimensionOf(id) === dimension && !derivedSet.has(id));
        const derivedHere = derived.filter((id) => dimensionOf(id) === dimension);
        const computedGroup = computeDimensionResult(dimension, [...checked, ...derivedHere], pending);
        // ผลที่ครูเลือกต้องต่างไม่เกิน 1 ระดับ — ถ้าผลที่คำนวณเปลี่ยนจนเกินกรอบ ให้กลับไปใช้ผลที่คำนวณ
        const wanted = input?.teacherGroup ?? null;
        const teacherGroup = wanted && adjustmentOptions(computedGroup).includes(wanted) ? wanted : null;
        const adjustReason = teacherGroup ? (input?.adjustReason?.trim() ?? "") : null;
        return {
          resultId: `${screeningId}-${dimension}`,
          dimension,
          computedGroup,
          teacherGroup,
          adjustReason,
          group: teacherGroup ?? computedGroup,
          checkedItemIds: checked,
          derivedItemIds: derivedHere,
        };
      });
    };

    const previewScreening: ScreeningSlice["previewScreening"] = (studentId, inputs) =>
      buildResults(studentId, screeningOf(studentId)?.screeningId ?? "preview", inputs);

    const isScreeningLocked = (sc: Screening) =>
      sc.unlock === null && (sc.termId !== termId || !base.isWindowOpen("screening"));

    const screeningEditBlockReason = (studentId: string): string | null => {
      if (!base.getStudent(studentId)) return "ไม่พบข้อมูลนักเรียน";
      if (!base.canEdit(studentId)) return "คัดกรองได้เฉพาะครูประจำชั้นของนักเรียนและแอดมิน";
      const current = screeningOf(studentId);
      if (current ? isScreeningLocked(current) : !base.isWindowOpen("screening"))
        return "อยู่นอกช่วงดำเนินงานคัดกรอง — การคัดกรองถูกล็อก ดูได้แต่แก้ไม่ได้";
      return null;
    };

    const replace = (sc: Screening) =>
      setScreenings((prev) => [sc, ...prev.filter((s) => s.screeningId !== sc.screeningId)]);

    const saveScreening: ScreeningSlice["saveScreening"] = (studentId, inputs) => {
      const blocked = screeningEditBlockReason(studentId);
      if (blocked) return { ok: false, error: blocked };
      const previous = screeningOf(studentId);
      const screeningId = previous?.screeningId ?? nextId("SC");
      const results = buildResults(studentId, screeningId, inputs);
      for (const r of results) {
        const err = adjustmentError(r.computedGroup, r.teacherGroup, r.adjustReason);
        if (err) return { ok: false, error: `${DIMENSION_LABEL[r.dimension]}: ${err}` };
      }
      const record: Screening = {
        screeningId,
        studentId,
        termId,
        screenedBy: base.currentUser.userId,
        screenedAt: nowThaiIso(),
        // แก้หลังรับรอง → กลับเป็นร่าง ต้องรับรองใหม่
        status: "draft",
        certifiedBy: null,
        certifiedAt: null,
        unlock: previous?.unlock ?? null,
        results,
      };
      const summary = (sc: Screening) =>
        Object.fromEntries(sc.results.map((r) => [r.dimension, r.teacherGroup ? `${r.computedGroup}→${r.teacherGroup}` : r.computedGroup]));
      base.logAudit(previous ? "UPDATE" : "CREATE", "screenings", screeningId, {
        ...(previous ? { before: { status: previous.status, results: summary(previous) } } : {}),
        after: { studentId, termId, status: "draft", results: summary(record) },
      });
      replace(record);
      return { ok: true, screening: record };
    };

    const certifyBlockReason = (screeningId: string): string | null => {
      const sc = getScreening(screeningId);
      if (!sc) return "ไม่พบการคัดกรอง";
      if (sc.status === "certified") return "รับรองข้อมูลแล้ว";
      if (!base.isHomeroomOf(sc.studentId)) return "รับรองข้อมูลได้เฉพาะครูประจำชั้นของนักเรียน";
      if (isScreeningLocked(sc)) return "อยู่นอกช่วงดำเนินงานคัดกรอง — รับรองไม่ได้";
      return null;
    };

    const certifyScreening: ScreeningSlice["certifyScreening"] = (screeningId) => {
      const blocked = certifyBlockReason(screeningId);
      if (blocked) return { ok: false, error: blocked };
      const sc = getScreening(screeningId)!;
      const at = nowThaiIso();
      const record: Screening = {
        ...sc,
        status: "certified",
        certifiedBy: base.currentUser.userId,
        certifiedAt: at,
        unlock: null,
      };
      base.logAudit("UPDATE", "screenings", screeningId, {
        before: { status: sc.status },
        after: { status: "certified" },
      });
      replace(record);

      // เหตุเปิด case ใช้ผลที่ระบบคำนวณ (ไม่ใช้ผลที่ครูปรับ)
      const computed = record.results.map((r) => r.computedGroup).filter((g): g is RiskGroup => g !== "pending");
      const mode = triggerModeForGroups(computed);
      let trigger: RaiseTriggerResult | null = null;
      if (mode) {
        const part = (g: RiskGroup) => {
          const dims = record.results.filter((r) => r.computedGroup === g).map((r) => DIMENSION_LABEL[r.dimension]);
          return dims.length ? `${RISK_LABEL[g]} มิติ${dims.join(" / ")}` : null;
        };
        const summary = `ผลคัดกรอง${[part("red"), part("amber")].filter(Boolean).join(" · ")}`;
        trigger = care.raiseTrigger(record.studentId, "screening", screeningId, mode, { summary, detectedAt: at });
      }
      return { ok: true, screening: record, trigger };
    };

    const unlockBlockReason = (screeningId: string): string | null => {
      const sc = getScreening(screeningId);
      if (!sc) return "ไม่พบการคัดกรอง";
      if (base.currentUser.role !== "admin_school") return "ปลดล็อกได้เฉพาะแอดมิน";
      if (sc.termId !== termId) return "ปลดล็อกได้เฉพาะการคัดกรองของภาคเรียนปัจจุบัน";
      if (!isScreeningLocked(sc)) return sc.unlock ? "ปลดล็อกไว้แล้ว" : "ยังอยู่ในช่วงดำเนินงาน ไม่ต้องปลดล็อก";
      return null;
    };

    const unlockScreening: ScreeningSlice["unlockScreening"] = (screeningId, reason) => {
      const blocked = unlockBlockReason(screeningId);
      if (blocked) return { ok: false, error: blocked };
      if (!reason.trim()) return { ok: false, error: "ต้องระบุเหตุผลการปลดล็อก" };
      const sc = getScreening(screeningId)!;
      const record: Screening = {
        ...sc,
        unlock: { by: base.currentUser.userId, at: nowThaiIso(), reason: reason.trim() },
      };
      base.logAudit("UNLOCK", "screenings", screeningId, { reason: reason.trim() });
      replace(record);
      return { ok: true, screening: record };
    };

    return {
      screenings,
      screeningOf,
      latestScreening,
      latestCertifiedScreening,
      overallRiskOf,
      derivedFactsOf,
      previewScreening,
      isScreeningLocked,
      screeningEditBlockReason,
      saveScreening,
      certifyBlockReason,
      certifyScreening,
      unlockBlockReason,
      unlockScreening,
    };
  }, [base, behavior, care, assessment, screenings]);
}
