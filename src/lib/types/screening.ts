/** การคัดกรอง 6 มิติ */

export type RiskGroup = "green" | "amber" | "red";

export const RISK_LABEL: Record<RiskGroup, string> = {
  green: "ปกติ",
  amber: "เสี่ยง",
  red: "มีปัญหา",
};

/** ผลรายมิติ รวมค่า "รอผลประเมิน" เมื่อยังไม่ได้ข้อมูลที่ต้องใช้ */
export type DimensionResult = RiskGroup | "pending";

export const DIMENSION_RESULT_LABEL: Record<DimensionResult, string> = {
  ...RISK_LABEL,
  pending: "รอผลประเมิน",
};

/** 6 มิติการคัดกรอง ตามคู่มือ HERO OBEC CARE */
export type ScreeningDimension =
  | "academic"
  | "physical"
  | "economic"
  | "welfare"
  | "behavior"
  | "mental";

export const DIMENSION_LABEL: Record<ScreeningDimension, string> = {
  academic: "การเรียน",
  physical: "สุขภาพกาย",
  economic: "เศรษฐกิจ",
  welfare: "สวัสดิภาพและความปลอดภัย",
  behavior: "พฤติกรรม",
  mental: "สุขภาพจิต",
};

export const DIMENSION_ORDER: ScreeningDimension[] = [
  "academic",
  "physical",
  "economic",
  "welfare",
  "behavior",
  "mental",
];

/** ระดับที่ครูเลือกได้ เรียงจากเบาไปหนัก (ใช้ตรวจกฎปรับได้ไม่เกิน 1 ระดับ) */
export const RISK_ORDER: RiskGroup[] = ["green", "amber", "red"];

/**
 * แหล่งข้อมูลของรายการอัตโนมัติ (screening_result_items.is_derived = true)
 * - red_flag / nine_s: ผลแบบประเมินสุขภาพจิตของปีการศึกษานี้
 * - late_count: จำนวนครั้งที่มาสาย (ยืนยันแล้ว) เดือนนี้ เทียบ school_settings.late_alert_threshold
 */
export type DerivedItemSource = "red_flag" | "nine_s" | "late_count";

/** รายการตรวจสอบของแต่ละมิติ: ติ๊ก = พบรายการนั้น */
export interface ScreeningItem {
  id: string;
  dimension: ScreeningDimension;
  label: string;
  /** ระดับที่รายการนี้บ่งชี้เมื่อถูกติ๊ก */
  severity: "risk" | "problem";
  /** มีค่า = รายการอัตโนมัติ ครูติ๊กเองไม่ได้ */
  derived?: DerivedItemSource;
}

/** screening_results — ผลรายมิติ */
export interface ScreeningResult {
  /** screening_results.result_id */
  resultId: string;
  dimension: ScreeningDimension;
  /** ผลที่ระบบคำนวณ — ใช้ตัดสินการเปิด case อัตโนมัติ */
  computedGroup: DimensionResult;
  /** ผลที่ครูเลือก ต่างจากผลที่คำนวณได้ไม่เกิน 1 ระดับ (null = ใช้ผลที่คำนวณ) */
  teacherGroup: RiskGroup | null;
  /** เหตุผลการปรับ (บังคับเมื่อ teacherGroup ไม่ว่าง) */
  adjustReason: string | null;
  /** ผลที่แสดง = teacherGroup ?? computedGroup (ค่าอนุพันธ์ เก็บไว้ให้หน้าจออ่านง่าย) */
  group: DimensionResult;
  /** รายการที่ครูติ๊ก */
  checkedItemIds: string[];
  /** รายการอัตโนมัติ ณ เวลาที่บันทึก */
  derivedItemIds: string[];
}

export type ScreeningStatus = "draft" | "certified";

export const SCREENING_STATUS_LABEL: Record<ScreeningStatus, string> = {
  draft: "ร่าง (ยังไม่รับรอง)",
  certified: "รับรองแล้ว",
};

/** แอดมินปลดล็อกการคัดกรองหลังปิดช่วงดำเนินงาน — มีผลจนกว่าจะรับรองข้อมูลอีกครั้ง */
export interface ScreeningUnlock {
  by: string;
  at: string;
  reason: string;
}

export interface Screening {
  screeningId: string;
  studentId: string;
  termId: string;
  /** userId ของครูผู้บันทึกล่าสุด */
  screenedBy: string;
  /** วันเวลาที่บันทึกล่าสุด */
  screenedAt: string;
  /** draft / certified (รับรองแล้ว = ส่งแล้ว) */
  status: ScreeningStatus;
  /** userId ของครูประจำชั้นผู้รับรอง */
  certifiedBy: string | null;
  certifiedAt: string | null;
  unlock: ScreeningUnlock | null;
  results: ScreeningResult[];
}

/** ผลรายมิติที่ครูส่งมาตอนบันทึก (ครูปรับผลได้ ±1 ระดับพร้อมเหตุผล) */
export interface ScreeningDimensionInput {
  checkedItemIds: string[];
  teacherGroup: RiskGroup | null;
  adjustReason: string | null;
}
