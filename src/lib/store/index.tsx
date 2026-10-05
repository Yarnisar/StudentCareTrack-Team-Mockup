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
 * ลำดับ: core → (audit / notifications / settings / consent) → behavior → checkin → care
 *        → screening → assessment → home-visit → dc → documents
 * slice ที่ต้องการเรียก slice อื่น (เช่น เปิด case อัตโนมัติ) ให้รับ slice นั้นเป็นอาร์กิวเมนต์
 * และต้องอยู่หลัง slice นั้นในลำดับ
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
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
  BehaviorSlice &
  CheckinSlice &
  CareSlice &
  ScreeningSlice &
  AssessmentSlice &
  HomeVisitSlice &
  DcSlice &
  DocumentsSlice;

export type { CheckinOutcome } from "./checkin";

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const core = useCoreSlice();
  const behavior = useBehaviorSlice(core);
  const checkin = useCheckinSlice(core, behavior);
  const care = useCareSlice(core);
  const screening = useScreeningSlice(core);
  const assessment = useAssessmentSlice(core);
  const homeVisit = useHomeVisitSlice(core);
  const dc = useDcSlice(core);
  const documents = useDocumentsSlice(core);

  const value = useMemo<StoreValue>(
    () => ({
      ...core,
      ...behavior,
      ...checkin,
      ...care,
      ...screening,
      ...assessment,
      ...homeVisit,
      ...dc,
      ...documents,
    }),
    [core, behavior, checkin, care, screening, assessment, homeVisit, dc, documents]
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
