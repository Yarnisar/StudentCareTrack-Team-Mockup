/**
 * ครูที่ปรึกษาตรวจผลก่อนเปิดให้นักเรียนและผู้ปกครอง (UC10 สถานการณ์ B)
 * - ผลรวม SDQ แสดงเมื่อครู นักเรียน และผู้ปกครองตอบครบ (ข้อ 3)
 * - ปิดรอบแล้วผู้ตอบไม่ครบ: ไม่คำนวณผลรวม แจ้งว่าฝ่ายใดยังไม่ตอบ ครูตรวจจากข้อมูลที่มีได้ (Alt-E)
 * - แก้คำตอบหลังตรวจแล้ว ต้องตรวจใหม่ก่อนแสดงผลที่เปลี่ยน (ข้อ 7) — ผลที่เปิดไว้คือภาพ ณ เวลาที่ตรวจ
 */

import type { EqAssessment, EqDomain, EqLevel } from "./eq";
import type { SdqAssessment, SdqLevel, SdqRater } from "./types";

export type ReviewKind = "sdq" | "eq";

export const REVIEW_KIND_LABEL: Record<ReviewKind, string> = { sdq: "SDQ", eq: "EQ" };

export interface AssessmentReview {
  studentId: string;
  kind: ReviewKind;
  /** SDQ: รอบที่ตรวจ (รอบ 1 / รอบ 2 ตามหน้าตั้งค่า) */
  round?: 1 | 2;
  reviewedAt: string;
  reviewedBy: string;
  /** ผลที่เปิดให้นักเรียน/ผู้ปกครองเห็น ณ เวลาที่ตรวจ */
  released: { sdq?: SdqLevel | null; eq?: Record<EqDomain, EqLevel> | null };
}

/**
 * none = ยังไม่มีแบบประเมิน, waiting = รอผู้ตอบ, declined = นักเรียนไม่ทำ EQ
 * pending = รอครูตรวจ, closed_incomplete = ปิดรอบแล้วผู้ตอบไม่ครบ (ตรวจได้ ไม่มีผลรวม)
 * re_review = แก้คำตอบหลังตรวจ ต้องตรวจใหม่, released = ตรวจแล้ว เปิดผลแล้ว
 */
export type ReviewState = "none" | "waiting" | "declined" | "pending" | "closed_incomplete" | "re_review" | "released";

export const REVIEW_STATE_LABEL: Record<ReviewState, string> = {
  none: "ยังไม่มีแบบประเมิน",
  waiting: "รอผู้ตอบ",
  declined: "นักเรียนเลือกไม่ทำ",
  pending: "รอครูตรวจผล",
  closed_incomplete: "ปิดรอบแล้ว ผู้ตอบไม่ครบ",
  re_review: "มีการแก้คำตอบ ต้องตรวจใหม่",
  released: "ตรวจแล้ว เปิดผลแล้ว",
};

export const needsReview = (s: ReviewState) => s === "pending" || s === "closed_incomplete" || s === "re_review";

const RATERS: SdqRater[] = ["teacher", "student", "parent"];

const SDQ_ORDER: Record<SdqLevel, number> = { normal: 0, risk: 1, problem: 2 };

/** ผลรวม SDQ จาก 3 ผู้ประเมิน: ใช้ระดับที่น่าห่วงที่สุด — PROTOTYPE: วิธีรวมผลรอทีมยืนยันกับคู่มือ */
export function combinedSdqLevel(set: SdqAssessment[]): SdqLevel | null {
  const done = set.filter((s) => s.status === "completed" && s.level);
  if (done.length < RATERS.length) return null;
  return done.map((s) => s.level!).sort((a, b) => SDQ_ORDER[b] - SDQ_ORDER[a])[0];
}

export function sdqReviewInfo(set: SdqAssessment[], review: AssessmentReview | undefined, roundClosed: boolean) {
  const done = set.filter((s) => s.status === "completed");
  const missing = RATERS.filter((r) => !done.some((s) => s.rater === r));
  const complete = missing.length === 0;
  const latest = done.map((s) => s.assessedAt ?? "").sort().at(-1) ?? "";
  let state: ReviewState;
  if (set.length === 0) state = "none";
  else if (done.length === 0 || (!complete && !roundClosed)) state = review ? "released" : "waiting";
  else if (review && review.reviewedAt >= latest) state = "released";
  else if (review) state = "re_review";
  else state = complete ? "pending" : "closed_incomplete";
  return { state, missing, complete, total: complete ? combinedSdqLevel(set) : null };
}

export function eqReviewInfo(eq: EqAssessment | undefined, review: AssessmentReview | undefined) {
  let state: ReviewState;
  if (!eq) state = "none";
  else if (eq.status === "declined") state = "declined";
  else if (eq.status === "pending") state = review ? "released" : "waiting";
  else if (review && review.reviewedAt >= (eq.assessedAt ?? "")) state = "released";
  else state = review ? "re_review" : "pending";
  return { state };
}
