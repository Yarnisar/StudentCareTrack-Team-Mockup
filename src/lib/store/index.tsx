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
 *        → behavior → checkin → care → screening → assessment → home-visit → dc → documents
 * slice ของโมดูลรับ base เป็นอาร์กิวเมนต์แรก (base.logAudit / base.notify / base.isWindowOpen /
 * base.schoolSettings / base.consentOf) slice ที่ต้องเรียก slice โมดูลอื่น (เช่น เปิด case อัตโนมัติ)
 * ให้รับ slice นั้นเป็นอาร์กิวเมนต์เพิ่ม และต้องอยู่หลัง slice นั้นในลำดับ
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuditSlice, type AuditSlice } from "./audit";
import { useConsentSlice, type ConsentSlice } from "./consent";
import { useNotificationsSlice, type NotificationsSlice } from "./notifications";
import type { PlatformSlice } from "./platform";
import { useSettingsSlice, type SettingsSlice } from "./settings";
import { useAssessmentSlice, type AssessmentSlice } from "./assessment";
import { useBehaviorSlice, type BehaviorSlice } from "./behavior";
import { useCareSlice, type CareSlice } from "./care";
import { useCheckinSlice, type CheckinSlice } from "./checkin";
import { useCoreSlice, type CoreSlice } from "./core";
import { useDcSlice, type DcSlice } from "./dc";
import { useDocumentsSlice, type DocumentsSlice } from "./documents";
import { useHomeVisitSlice, type HomeVisitSlice } from "./home-visit";
import { useScreeningSlice, type ScreeningSlice } from "./screening";

export type StoreValue = CoreSlice &
  AuditSlice &
  NotificationsSlice &
  SettingsSlice &
  ConsentSlice &
  BehaviorSlice &
  CheckinSlice &
  CareSlice &
  ScreeningSlice &
  AssessmentSlice &
  HomeVisitSlice &
  DcSlice &
  DocumentsSlice;

export type { CheckinOutcome } from "./checkin";
export type { PlatformSlice } from "./platform";
export type { RecipientGroup } from "./notifications";
export type { OperatingWindowInput, SaveWindowResult, SchoolSettingsPatch } from "./settings";
export type { ConsentStatus, RecordConsentResult } from "./consent";
export type { DcOverrides, DcResult, DcScoreEntry, DcSummaryReadiness } from "./dc";
export type { DocumentReadiness, GenerateDocumentResult } from "./documents";
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

  const behavior = useBehaviorSlice(base);
  const checkin = useCheckinSlice(base, behavior);
  const care = useCareSlice(base);
  const screening = useScreeningSlice(base);
  const assessment = useAssessmentSlice(base);
  const homeVisit = useHomeVisitSlice(base);
  const dc = useDcSlice(base);
  const documents = useDocumentsSlice(base, dc);

  const value = useMemo<StoreValue>(
    () => ({
      ...base,
      ...behavior,
      ...checkin,
      ...care,
      ...screening,
      ...assessment,
      ...homeVisit,
      ...dc,
      ...documents,
    }),
    [base, behavior, checkin, care, screening, assessment, homeVisit, dc, documents]
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
