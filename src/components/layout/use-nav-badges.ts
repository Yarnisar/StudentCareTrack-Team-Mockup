"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import type { AssessmentNextStep } from "@/lib/types";

/** ขั้นตอนประเมินที่ครูลงมือได้ทันที (ไม่นับ done / not_required / รอเปิดช่วงเวลา) */
const ACTIONABLE_ASSESSMENT: AssessmentNextStep[] = ["red_flag", "nine_s", "open_sdq", "sdq"];

export interface NavBadges {
  /** จำนวนที่ต้องดำเนินการ ต่อ href ของเมนู — ซ่อนเมื่อเป็น 0 */
  counts: Partial<Record<string, number>>;
  /** href ที่ใช้โทนสีแดงอ่อน */
  urgent: string[];
}

/** ตัวเลขกำกับเมนูข้าง คำนวณจาก selector ของ store และเคารพสิทธิ์ของผู้ใช้ปัจจุบัน */
export function useNavBadges(): NavBadges {
  const store = useStore();
  // เลือกคำนวณใหม่เฉพาะเมื่อ store เปลี่ยน (ห้อง 38 คน: ต้องวนทุกคนต่อการ render ของ sidebar)
  return useMemo(() => computeNavBadges(store), [store]);
}

function computeNavBadges(store: ReturnType<typeof useStore>): NavBadges {
  const sensitiveStudents = store.students.filter((s) => store.canSeeSensitive(s.studentId));

  const visits = store.appointments.filter(
    (a) =>
      (a.status === "pending" || a.status === "reschedule_requested") &&
      (store.canSeeSensitive(a.studentId) || store.canViewRecord(a.studentId, a.teacherId))
  ).length;

  const screening = sensitiveStudents.filter(
    (s) => store.screeningOf(s.studentId)?.status !== "certified"
  ).length;

  const assessment = sensitiveStudents.filter((s) =>
    ACTIONABLE_ASSESSMENT.includes(store.assessmentPlanOf(s.studentId).next)
  ).length;

  const cases = store.careCases.filter(
    (c) =>
      c.status === "active" &&
      store.canSeeSensitive(c.studentId) &&
      c.triggers.some((t) => !t.planId)
  ).length;

  const behavior = store.myPendingBehaviorRecords.length;

  return {
    counts: {
      "/home-visits": visits,
      "/screening": screening,
      "/assessment": assessment,
      "/care-cases": cases,
      "/behavior": behavior,
    },
    urgent: ["/care-cases"],
  };
}
