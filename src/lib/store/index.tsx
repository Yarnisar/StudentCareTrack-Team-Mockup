"use client";

/**
 * สถานะของต้นแบบระบบ (เก็บในหน่วยความจำฝั่งไคลเอนต์)
 * ใน Project 2 ส่วนนี้จะถูกแทนที่ด้วยการเรียก REST API ของ FastAPI
 * โดยโครงสร้างฟังก์ชันยังคงเดิม เพื่อให้เปลี่ยนไปเรียก API ได้โดยไม่กระทบหน้าจอ
 *
 * แยกเป็น slice ต่อโมดูล (ไฟล์ละโมดูลในโฟลเดอร์นี้) แต่ละ slice เป็น hook ที่ถือ state ของตัวเอง
 * และรับ slice ที่ต้องพึ่งเป็นอาร์กิวเมนต์ StoreProvider เรียกทุก slice ตามลำดับการพึ่งพา
 * แล้วรวมเป็นค่าเดียว — หน้าจอใช้ useStore() เหมือนเดิม
 *

 * ลำดับ: core → audit → notifications → settings → consent  (รวมเป็น base: PlatformSlice)
 *        → assignments (เขตแดนเขียนตารางมอบหมายครู ADR-0003) → imports (เขตแดนเขียนตารางอ้างอิง ADR-0005 โหมดเดี่ยว) → behavior → checkin → cards → care → assessment → screening → home-visit → dc → documents → exam
 * (assessment ส่งเหตุเปิด case ผ่าน care; screening อ่านผล Red Flag/9S จาก assessment และมาสายจาก behavior)
 * slice ของโมดูลรับ base เป็นอาร์กิวเมนต์แรก (base.logAudit / base.notify / base.isWindowOpen /
 * base.schoolSettings / base.consentOf) slice ที่ต้องเรียก slice โมดูลอื่น (เช่น เปิด case อัตโนมัติ)
 * ให้รับ slice นั้นเป็นอาร์กิวเมนต์เพิ่ม และต้องอยู่หลัง slice นั้นในลำดับ
 */

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useAssignmentsSlice, type AssignmentsSlice } from "./assignments";
import { useAuditSlice, type AuditSlice } from "./audit";
import { useImportsSlice, type ImportsSlice } from "./imports";
import { useConsentSlice, type ConsentSlice } from "./consent";
import { useNotificationsSlice, type NotificationsSlice } from "./notifications";
import type { PlatformSlice } from "./platform";
import { useSettingsSlice, type SettingsSlice } from "./settings";
import { useAssessmentSlice, type AssessmentSlice } from "./assessment";
import { useBehaviorSlice, type BehaviorSlice } from "./behavior";
import { useCardsSlice, type CardsSlice } from "./cards";
import { useCareSlice, type CareSlice } from "./care";
import { useCheckinSlice, type CheckinSlice } from "./checkin";
import { useCoreSlice, type CoreSlice } from "./core";
import { useDcSlice, type DcSlice } from "./dc";
import { useDocumentsSlice, type DocumentsSlice } from "./documents";
import { useExamSlice, type ExamSlice } from "./exam";
import { useHomeVisitSlice, type HomeVisitSlice } from "./home-visit";
import { useScreeningSlice, type ScreeningSlice } from "./screening";

export type StoreValue = CoreSlice &
  AuditSlice &
  NotificationsSlice &
  SettingsSlice &
  ConsentSlice &
  AssignmentsSlice &
  ImportsSlice &
  BehaviorSlice &
  CheckinSlice &
  CardsSlice &
  CareSlice &
  ScreeningSlice &
  AssessmentSlice &
  HomeVisitSlice &
  DcSlice &
  DocumentsSlice &
  ExamSlice;

export type { CheckinOutcome } from "./checkin";
export type { CardLookup, CardResult, CardTemplatePatch } from "./cards";
export type {
  AddBehaviorRecordResult,
  BehaviorActionResult,
  BehaviorRecordPatch,
  BehaviorScoreLowEvent,
} from "./behavior";
export type { PlatformSlice } from "./platform";
export type { RecipientGroup } from "./notifications";
export type { OperatingWindowInput, SaveWindowResult, SchoolSettingsPatch } from "./settings";
export type { AssignmentChange, AssignmentResult, HomeroomOfRoom } from "./assignments";
export { MAX_HOMEROOM_TEACHERS_PER_ROOM } from "./assignments";
export type { ImportCommitResult, ImportCommitSummary } from "./imports";
export type { ConsentStatus, RecordConsentResult } from "./consent";
export type { CreateAppointmentInput, HomeVisitResult } from "./home-visit";
export type { DcOverrides, DcResult, DcScoreEntry, DcSummaryReadiness } from "./dc";
export type { ExamReassign, ExamResult, ExamRoomInput, ExamSessionInput } from "./exam";
export type { DocumentReadiness, GenerateDocumentResult } from "./documents";
export type {
  AssessmentResult,
  OpenSdqSetResult,
  SaveNineSResult,
  SaveRedFlagResult,
  SaveSdqResult,
} from "./assessment";
export type { ScreeningActionResult, ScreeningInputs } from "./screening";
export type { RaiseTriggerResult, ReferralEntry } from "./care";
export { auditSummary } from "./audit";

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const core = useCoreSlice();
  const audit = useAuditSlice(core);
  const notifications = useNotificationsSlice(core, audit);
  const settings = useSettingsSlice(core, audit, notifications);
  const consent = useConsentSlice(core, audit);
  const base = useMemo<PlatformSlice>(
    () => ({ ...core, ...audit, ...notifications, ...settings, ...consent }),
    [core, audit, notifications, settings, consent]
  );

  const assignments = useAssignmentsSlice(base);
  const imports = useImportsSlice(base);
  const behavior = useBehaviorSlice(base);
  const checkin = useCheckinSlice(base, behavior);
  const cards = useCardsSlice(base);
  const care = useCareSlice(base, behavior);
  const assessment = useAssessmentSlice(base, care);
  const screening = useScreeningSlice(base, behavior, care, assessment);
  const homeVisit = useHomeVisitSlice(base);
  const dc = useDcSlice(base);
  const documents = useDocumentsSlice(base, dc);
  const exam = useExamSlice(base);

  const value = useMemo<StoreValue>(
    () => ({
      ...base,
      ...assignments,
      ...imports,
      ...behavior,
      ...checkin,
      ...cards,
      ...care,
      ...screening,
      ...assessment,
      ...homeVisit,
      ...dc,
      ...documents,
      ...exam,
    }),
    [base, assignments, imports, behavior, checkin, cards, care, screening, assessment, homeVisit, dc, documents, exam]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore ต้องถูกเรียกภายใน StoreProvider");
  return ctx;
}

/**
 * @deprecated ค่าเริ่มต้นแบบคงที่ — ใช้ `useStore().behaviorRules`
 * คงไว้ให้หน้า behavior/_prototype ที่ยังรอการตัดสินใจด้าน UI คอมไพล์ได้
 */
export { behaviorRules } from "../mock-data";

/**
 * บันทึก VIEW_SENSITIVE ครั้งเดียวเมื่อเปิดข้อมูลรายคน (logSensitiveView ข้ามเองถ้าไม่ใช่ผู้ดูแลระบบ
 * เว้นแต่ always) — ยิงใหม่เมื่อ entityId/ผู้ใช้เปลี่ยนเท่านั้น
 */
export function useSensitiveView(
  entityType: string,
  entityId: string | null | undefined,
  opts?: { enabled?: boolean; always?: boolean; note?: string }
) {
  const { logSensitiveView } = useStore();
  const enabled = opts?.enabled ?? true;
  const always = opts?.always;
  const note = opts?.note;
  useEffect(() => {
    if (enabled && entityId) logSensitiveView(entityType, entityId, { always, note });
  }, [enabled, entityType, entityId, always, note, logSensitiveView]);
}
