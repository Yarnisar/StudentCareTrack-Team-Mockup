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

/** รายการตรวจสอบของแต่ละมิติ: ติ๊ก = พบรายการนั้น */
export interface ScreeningItem {
  id: string;
  dimension: ScreeningDimension;
  label: string;
  /** ระดับที่รายการนี้บ่งชี้เมื่อถูกติ๊ก */
  severity: "risk" | "problem";
}

export interface ScreeningResult {
  dimension: ScreeningDimension;
  group: RiskGroup;
  checkedItemIds: string[];
}

export interface Screening {
  screeningId: string;
  studentId: string;
  termId: string;
  /** userId ของผู้คัดกรอง */
  screenedBy: string;
  screenedAt: string;
  results: ScreeningResult[];
}
