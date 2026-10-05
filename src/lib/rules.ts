/**
 * ตรรกะการคัดกรองและการประเมิน
 * อ้างอิงเกณฑ์จากคู่มือการดำเนินงานระบบ HERO OBEC CARE ปี 2568
 */

import { addDaysThai, compareThaiDate, thaiDateOf } from "./format";
import {
  AcademicTerm,
  AssessmentOutcome,
  CombinedSdqResult,
  DimensionResult,
  OperatingWindow,
  NineSCluster,
  RISK_ORDER,
  RiskGroup,
  ScreeningDimension,
  ScreeningItem,
  SdqAssessment,
  SdqLevel,
  SdqRater,
  SdqScale,
  WindowStatus,
} from "./types";

/* ------------------------------------------------------------------ */
/* 1. การคัดกรอง 6 มิติ                                                */
/* ------------------------------------------------------------------ */

export const SCREENING_ITEMS: ScreeningItem[] = [
  // การเรียน
  { id: "ac1", dimension: "academic", label: "ผลการเรียนเฉลี่ยต่ำกว่า 2.00", severity: "risk" },
  { id: "ac2", dimension: "academic", label: "ขาดเรียนเกิน 3 วันต่อเดือนโดยไม่มีเหตุผลอันควร", severity: "risk" },
  { id: "ac3", dimension: "academic", label: "ไม่ส่งงานหรือการบ้านเป็นประจำ", severity: "risk" },
  { id: "ac4", dimension: "academic", label: "มีแนวโน้มออกกลางคัน / ติด 0 ร มส. หลายรายวิชา", severity: "problem" },

  // สุขภาพกาย
  { id: "ph1", dimension: "physical", label: "มีโรคประจำตัวที่ต้องดูแลเป็นพิเศษ", severity: "risk" },
  { id: "ph2", dimension: "physical", label: "มีภาวะทุพโภชนาการ (ผอมหรืออ้วนเกินเกณฑ์)", severity: "risk" },
  { id: "ph3", dimension: "physical", label: "มีความพิการหรือความบกพร่องทางร่างกาย", severity: "risk" },
  { id: "ph4", dimension: "physical", label: "เจ็บป่วยรุนแรงจนกระทบต่อการมาเรียน", severity: "problem" },

  // เศรษฐกิจ
  { id: "ec1", dimension: "economic", label: "รายได้ครัวเรือนเฉลี่ยต่ำกว่า 3,000 บาท/คน/เดือน", severity: "risk" },
  { id: "ec2", dimension: "economic", label: "ขาดแคลนอุปกรณ์การเรียนหรือเครื่องแบบนักเรียน", severity: "risk" },
  { id: "ec3", dimension: "economic", label: "ไม่มีผู้หารายได้หลักในครัวเรือน", severity: "problem" },

  // สวัสดิภาพและความปลอดภัย
  { id: "wf1", dimension: "welfare", label: "ที่พักอาศัยไม่มั่นคงหรือไม่ปลอดภัย", severity: "risk" },
  { id: "wf2", dimension: "welfare", label: "เดินทางมาโรงเรียนด้วยเส้นทางที่เสี่ยงอันตราย", severity: "risk" },
  { id: "wf3", dimension: "welfare", label: "ถูกทำร้ายร่างกายหรือจิตใจ", severity: "problem" },
  { id: "wf4", dimension: "welfare", label: "ถูกทอดทิ้งหรือไม่มีผู้ดูแล", severity: "problem" },

  // พฤติกรรม
  // ข้อความจริงใช้ screeningItemLabel() เพื่ออ่านเกณฑ์จาก school_settings.late_alert_threshold
  { id: "bh1", dimension: "behavior", label: "มาสายตั้งแต่ {n} ครั้งในเดือนนี้", severity: "risk", derived: "late_count" },
  { id: "bh2", dimension: "behavior", label: "ใช้เวลากับเกมหรือสื่อออนไลน์มากกว่า 4 ชั่วโมงต่อวัน", severity: "risk" },
  { id: "bh3", dimension: "behavior", label: "มีพฤติกรรมความรุนแรงหรือทะเลาะวิวาท", severity: "problem" },
  { id: "bh4", dimension: "behavior", label: "พบการใช้สารเสพติด", severity: "problem" },

  // สุขภาพจิต
  { id: "mt1", dimension: "mental", label: "แยกตัวจากเพื่อนหรือครู", severity: "risk" },
  { id: "mt2", dimension: "mental", label: "อารมณ์แปรปรวน หงุดหงิดง่ายผิดปกติ", severity: "risk" },
  { id: "mt3", dimension: "mental", label: "ผลแบบประเมิน 9S ระบุว่าควรดูแล", severity: "risk", derived: "nine_s" },
  { id: "mt4", dimension: "mental", label: "ผลแบบคัดกรอง Red Flag ระบุว่าควรดูแล", severity: "problem", derived: "red_flag" },
];

/** ข้อความของรายการ (แทนค่าเกณฑ์ที่ตั้งได้ เช่น จำนวนครั้งที่มาสาย) */
export function screeningItemLabel(item: ScreeningItem, opts: { lateAlertThreshold: number }): string {
  return item.label.replace("{n}", String(opts.lateAlertThreshold));
}

/**
 * เกณฑ์จัดกลุ่มรายมิติ
 * - ไม่พบรายการใด                       -> ปกติ
 * - พบรายการเกณฑ์เสี่ยง แต่ไม่พบเกณฑ์มีปัญหา -> เสี่ยง
 * - พบรายการเกณฑ์มีปัญหาอย่างน้อย 1 รายการ   -> มีปัญหา
 */
export function classifyDimension(
  dimension: ScreeningDimension,
  checkedIds: string[]
): RiskGroup {
  const items = SCREENING_ITEMS.filter(
    (i) => i.dimension === dimension && checkedIds.includes(i.id)
  );
  if (items.some((i) => i.severity === "problem")) return "red";
  if (items.some((i) => i.severity === "risk")) return "amber";
  return "green";
}

/** ข้อมูลจากโมดูลอื่นที่ใช้กำหนดรายการอัตโนมัติ */
export interface DerivedFacts {
  /** ผล Red Flag / 9S ล่าสุดของปีการศึกษานี้ (null = ยังไม่ได้ประเมิน) */
  redFlag: AssessmentOutcome | null;
  nineS: AssessmentOutcome | null;
  /** จำนวนครั้งที่มาสาย (ยืนยันแล้ว) เดือนนี้ */
  confirmedLateCount: number;
  lateAlertThreshold: number;
}

/** รายการอัตโนมัติที่พบ */
export function derivedItemIds(facts: DerivedFacts): string[] {
  return SCREENING_ITEMS.filter((item) => {
    if (item.derived === "red_flag") return facts.redFlag === "needs_care";
    if (item.derived === "nine_s") return facts.nineS === "needs_care";
    if (item.derived === "late_count") return facts.confirmedLateCount >= facts.lateAlertThreshold;
    return false;
  }).map((i) => i.id);
}

/**
 * มิติสุขภาพจิตยัง "รอผลประเมิน" หรือไม่
 * ต้องมีผล Red Flag ก่อน ถ้า Red Flag ปกติต้องมีผล 9S ด้วย (ถ้า Red Flag ควรดูแล ข้าม 9S)
 */
export function isMentalPending(facts: Pick<DerivedFacts, "redFlag" | "nineS">): boolean {
  if (facts.redFlag === null) return true;
  return facts.redFlag === "normal" && facts.nineS === null;
}

/** ผลที่ระบบคำนวณของมิติหนึ่ง (รวมรายการอัตโนมัติ) */
export function computeDimensionResult(
  dimension: ScreeningDimension,
  itemIds: string[],
  mentalPending: boolean
): DimensionResult {
  if (dimension === "mental" && mentalPending) return "pending";
  return classifyDimension(dimension, itemIds);
}

/** ผลรวมของนักเรียน = ผลที่รุนแรงที่สุดใน 6 มิติ (ถ้าไม่มีปัญหา/เสี่ยง แต่ยังรอผลบางมิติ = รอผลประเมิน) */
export function overallRisk(groups: DimensionResult[]): DimensionResult {
  if (groups.includes("red")) return "red";
  if (groups.includes("amber")) return "amber";
  if (groups.includes("pending")) return "pending";
  return "green";
}

/** ระดับที่ครูเลือกแทนผลที่คำนวณได้ (ต่างไม่เกิน 1 ระดับ ไม่รวมค่าเดิม) */
export function adjustmentOptions(computed: DimensionResult): RiskGroup[] {
  if (computed === "pending") return [];
  const i = RISK_ORDER.indexOf(computed);
  return RISK_ORDER.filter((_, j) => j !== i && Math.abs(j - i) === 1);
}

/** ตรวจการปรับผลของครู — คืนข้อความผิดพลาด หรือ null เมื่อถูกต้อง */
export function adjustmentError(
  computed: DimensionResult,
  teacherGroup: RiskGroup | null,
  reason: string | null
): string | null {
  if (teacherGroup === null) return null;
  if (computed === "pending") return "มิติที่รอผลประเมินปรับผลไม่ได้";
  if (!adjustmentOptions(computed).includes(teacherGroup)) return "ปรับผลได้ไม่เกิน 1 ระดับจากผลที่ระบบคำนวณ";
  if (!reason?.trim()) return "ต้องระบุเหตุผลการปรับผล";
  return null;
}

export function isValidAdjustment(
  computed: DimensionResult,
  teacherGroup: RiskGroup | null,
  reason: string | null
): boolean {
  return adjustmentError(computed, teacherGroup, reason) === null;
}

/* ------------------------------------------------------------------ */
/* 2. แบบคัดกรอง Red Flag                                              */
/* ------------------------------------------------------------------ */

export const RED_FLAG_QUESTIONS = [
  { id: "rf1", text: "นักเรียนเคยพูดถึงการทำร้ายตนเองหรือการฆ่าตัวตาย" },
  { id: "rf2", text: "นักเรียนมีพฤติกรรมทำร้ายตนเองหรือผู้อื่น" },
  { id: "rf3", text: "นักเรียนมีอาการทางจิตเวชที่สังเกตได้ชัดเจน เช่น หวาดระแวง เห็นภาพหลอน" },
];

/** ตอบ "ใช่" แม้เพียงข้อเดียว ถือว่าควรดูแล และต้องทำ SDQ ทันที */
export function evaluateRedFlag(answers: Record<string, boolean>): AssessmentOutcome {
  return Object.values(answers).some(Boolean) ? "needs_care" : "normal";
}

/* ------------------------------------------------------------------ */
/* 3. แบบประเมิน 9S                                                    */
/* ------------------------------------------------------------------ */

export const NINE_S_QUESTIONS: {
  id: string;
  cluster: NineSCluster;
  text: string;
}[] = [
  { id: "s1", cluster: "adhd", text: "วอกแวกง่าย ไม่มีสมาธิจดจ่อกับงานที่ทำ" },
  { id: "s2", cluster: "adhd", text: "อยู่ไม่นิ่ง ลุกเดินบ่อยขณะเรียน" },
  { id: "s3", cluster: "adhd", text: "ทำงานไม่เสร็จ ลืมสิ่งของเป็นประจำ" },
  { id: "s4", cluster: "depression", text: "ดูเศร้า ซึม ไม่ร่าเริงเหมือนเดิม" },
  { id: "s5", cluster: "depression", text: "กังวลหลายเรื่องจนรบกวนการเรียน" },
  { id: "s6", cluster: "depression", text: "เบื่ออาหาร นอนไม่หลับ หรือนอนมากผิดปกติ" },
  { id: "s7", cluster: "social", text: "ถูกเพื่อนล้อเลียนหรือกลั่นแกล้งเป็นประจำ" },
  { id: "s8", cluster: "social", text: "ไม่มีเพื่อนสนิท มักอยู่คนเดียว" },
  { id: "s9", cluster: "social", text: "มีเรื่องขัดแย้งกับเพื่อนหรือครูบ่อยครั้ง" },
];

/** แต่ละข้อให้คะแนน 0-2 (ไม่จริง / ค่อนข้างจริง / จริงแน่นอน) */
export function evaluateNineS(answers: Record<string, 0 | 1 | 2>) {
  const clusterScores: Record<NineSCluster, number> = {
    adhd: 0,
    depression: 0,
    social: 0,
  };

  for (const q of NINE_S_QUESTIONS) {
    clusterScores[q.cluster] += answers[q.id] ?? 0;
  }

  // เกณฑ์: คะแนนรวมในกลุ่มใดตั้งแต่ 3 คะแนนขึ้นไป ถือว่าควรดูแล
  const clusterResults = Object.fromEntries(
    (Object.keys(clusterScores) as NineSCluster[]).map((c) => [
      c,
      clusterScores[c] >= 3 ? "needs_care" : "normal",
    ])
  ) as Record<NineSCluster, AssessmentOutcome>;

  const result: AssessmentOutcome = Object.values(clusterResults).includes("needs_care")
    ? "needs_care"
    : "normal";

  return { clusterScores, clusterResults, result };
}

/* ------------------------------------------------------------------ */
/* 4. แบบประเมิน SDQ 25 ข้อ                                            */
/* ------------------------------------------------------------------ */

export interface SdqQuestion {
  no: number;
  text: string;
  scale: SdqScale;
  /** ข้อที่ให้คะแนนกลับด้าน */
  reverse?: boolean;
}

export const SDQ_QUESTIONS: SdqQuestion[] = [
  { no: 1, text: "ห่วงใยความรู้สึกของคนอื่น", scale: "prosocial" },
  { no: 2, text: "อยู่ไม่นิ่ง นั่งนิ่ง ๆ ไม่ได้นาน", scale: "hyperactivity" },
  { no: 3, text: "มักบ่นว่าปวดศีรษะ ปวดท้อง หรือไม่สบาย", scale: "emotional" },
  { no: 4, text: "เต็มใจแบ่งปันสิ่งของให้เพื่อน", scale: "prosocial" },
  { no: 5, text: "มักอาละวาดหรือโมโหร้าย", scale: "conduct" },
  { no: 6, text: "ค่อนข้างแยกตัว ชอบเล่นคนเดียว", scale: "peer" },
  { no: 7, text: "เชื่อฟัง มักทำตามที่ผู้ใหญ่บอก", scale: "conduct", reverse: true },
  { no: 8, text: "กังวลหลายเรื่อง ดูกังวลเสมอ", scale: "emotional" },
  { no: 9, text: "ช่วยเหลือผู้อื่นเมื่อเห็นว่าเขาเจ็บปวดหรือไม่สบายใจ", scale: "prosocial" },
  { no: 10, text: "อยู่ไม่สุข ขยับตัวไปมาตลอดเวลา", scale: "hyperactivity" },
  { no: 11, text: "มีเพื่อนสนิทอย่างน้อยหนึ่งคน", scale: "peer", reverse: true },
  { no: 12, text: "ทะเลาะวิวาทกับเด็กอื่นบ่อย ๆ", scale: "conduct" },
  { no: 13, text: "ดูไม่มีความสุข ท้อแท้ หรือร้องไห้บ่อย", scale: "emotional" },
  { no: 14, text: "เป็นที่ชื่นชอบของเพื่อนวัยเดียวกัน", scale: "peer", reverse: true },
  { no: 15, text: "วอกแวกง่าย ไม่มีสมาธิ", scale: "hyperactivity" },
  { no: 16, text: "รู้สึกกังวลเมื่ออยู่ในสถานการณ์ใหม่ ขาดความมั่นใจ", scale: "emotional" },
  { no: 17, text: "ใจดีกับเด็กที่เล็กกว่า", scale: "prosocial" },
  { no: 18, text: "มักโกหกหรือหลอกลวง", scale: "conduct" },
  { no: 19, text: "ถูกเด็กอื่นล้อเลียนหรือรังแก", scale: "peer" },
  { no: 20, text: "อาสาช่วยเหลือผู้อื่นเป็นประจำ", scale: "prosocial" },
  { no: 21, text: "คิดก่อนทำ ไตร่ตรองรอบคอบ", scale: "hyperactivity", reverse: true },
  { no: 22, text: "ขโมยของที่บ้าน ที่โรงเรียน หรือที่อื่น", scale: "conduct" },
  { no: 23, text: "เข้ากับผู้ใหญ่ได้ดีกว่าเด็กวัยเดียวกัน", scale: "peer" },
  { no: 24, text: "ขี้กลัว รู้สึกหวาดกลัวได้ง่าย", scale: "emotional" },
  { no: 25, text: "ทำงานได้จนเสร็จ มีความตั้งใจนาน", scale: "hyperactivity", reverse: true },
];

export const SDQ_CHOICES: { value: 0 | 1 | 2; label: string }[] = [
  { value: 0, label: "ไม่จริง" },
  { value: 1, label: "ค่อนข้างจริง" },
  { value: 2, label: "จริงแน่นอน" },
];

/**
 * เกณฑ์แปลผลคะแนนรวมพฤติกรรมที่เป็นปัญหา แยกตามผู้ประเมิน (แต่ละฉบับใช้เกณฑ์ของตัวเอง)
 * TODO: รอยืนยันเกณฑ์จากคู่มือกรมสุขภาพจิต — ตอนนี้ใช้ 16/20 เท่ากันทั้ง 3 ฉบับไว้ก่อน ห้ามเดาตัวเลข
 */
export const SDQ_CUTOFFS: Record<SdqRater, { risk: number; problem: number }> = {
  teacher: { risk: 16, problem: 20 }, // รอยืนยันเกณฑ์จากคู่มือกรมสุขภาพจิต
  student: { risk: 16, problem: 20 }, // รอยืนยันเกณฑ์จากคู่มือกรมสุขภาพจิต
  parent: { risk: 16, problem: 20 }, // รอยืนยันเกณฑ์จากคู่มือกรมสุขภาพจิต
};

export function scoreSdq(answers: Record<number, 0 | 1 | 2>, rater: SdqRater = "teacher") {
  const scaleScores: Record<SdqScale, number> = {
    emotional: 0,
    conduct: 0,
    hyperactivity: 0,
    peer: 0,
    prosocial: 0,
  };

  for (const q of SDQ_QUESTIONS) {
    const raw = answers[q.no];
    if (raw === undefined) continue;
    const value = q.reverse ? ((2 - raw) as 0 | 1 | 2) : raw;
    scaleScores[q.scale] += value;
  }

  /** คะแนนรวมพฤติกรรมที่เป็นปัญหา = 4 ด้าน ไม่รวมด้านสัมพันธภาพทางสังคม */
  const totalDifficulties =
    scaleScores.emotional +
    scaleScores.conduct +
    scaleScores.hyperactivity +
    scaleScores.peer;

  const cut = SDQ_CUTOFFS[rater];
  let level: SdqLevel = "normal";
  if (totalDifficulties >= cut.problem) level = "problem";
  else if (totalDifficulties >= cut.risk) level = "risk";

  return { scaleScores, totalDifficulties, level };
}

const SDQ_LEVEL_ORDER: SdqLevel[] = ["normal", "risk", "problem"];

/** ระดับ SDQ → ผลแบบเดียวกับผลรายมิติ (ใช้กับ triggerModeForGroup) */
export const SDQ_LEVEL_TO_GROUP: Record<SdqLevel, RiskGroup> = {
  normal: "green",
  risk: "amber",
  problem: "red",
};

/** ชั้นประถม (ป.1–ป.6) ไม่มีฉบับนักเรียนประเมินตนเอง */
export function isPrimaryGrade(gradeLevel: string): boolean {
  return gradeLevel.startsWith("ป.");
}

export function sdqRatersFor(gradeLevel: string): SdqRater[] {
  return isPrimaryGrade(gradeLevel) ? ["teacher", "parent"] : ["teacher", "student", "parent"];
}

/**
 * ผล SDQ รวมของชุดเดียวกัน (นักเรียน + ภาคเรียน + ครั้ง) = ระดับที่รุนแรงที่สุดของฉบับที่ส่งแล้ว
 * มีผลก็ต่อเมื่อฉบับครูส่งแล้ว (ก่อนนั้น level = null) — แสดง basedOn/total กำกับเสมอ
 */
export function combineSdq(forms: SdqAssessment[]): CombinedSdqResult | null {
  const first = forms[0];
  if (!first) return null;
  const submitted = forms.filter((f) => f.status === "submitted" && f.level);
  const teacherSubmitted = submitted.some((f) => f.rater === "teacher");
  const worst = submitted.reduce<SdqLevel | null>((acc, f) => {
    const lv = f.level as SdqLevel;
    return acc === null || SDQ_LEVEL_ORDER.indexOf(lv) > SDQ_LEVEL_ORDER.indexOf(acc) ? lv : acc;
  }, null);
  return {
    studentId: first.studentId,
    termId: first.termId,
    round: first.round,
    level: teacherSubmitted ? worst : null,
    basedOn: submitted.length,
    total: forms.length,
    teacherSubmitted,
  };
}

/** รหัสชุด SDQ (นักเรียน + ภาคเรียน + ครั้ง) ใช้เป็น sourceRefId ของเหตุเปิด case จาก SDQ */
export function sdqSetRef(studentId: string, termId: string, round: 1 | 2): string {
  return `SDQSET-${termId}-R${round}-${studentId}`;
}

/** "อิงจาก 2 จาก 3 ฉบับ" */
export function combinedSdqBasisLabel(c: Pick<CombinedSdqResult, "basedOn" | "total">): string {
  return `อิงจาก ${c.basedOn} จาก ${c.total} ฉบับ`;
}

/* ------------------------------------------------------------------ */
/* 4.1 ลำดับการประเมินตามภาคเรียน (HERO OBEC CARE 2568)                 */
/* ------------------------------------------------------------------ */

/** SDQ ครั้งที่ 1 = ภาคเรียนที่ 1, ครั้งที่ 2 = ภาคเรียนที่ 2 */
export function sdqRoundFor(term: Pick<AcademicTerm, "semester">): 1 | 2 {
  return term.semester;
}

/**
 * ต้องทำ Red Flag ในภาคเรียนนี้หรือไม่
 * - ภาคเรียนที่ 1: ทุกคน (จนกว่าจะทำในภาคเรียนนี้แล้ว)
 * - ภาคเรียนที่ 2: เฉพาะคนที่ยังไม่เคยประเมินในปีการศึกษานี้
 * @param assessedTerms ภาคเรียนที่นักเรียนเคยทำ Red Flag
 */
export function needsRedFlag(
  assessedTerms: Pick<AcademicTerm, "termId" | "academicYear">[],
  term: Pick<AcademicTerm, "termId" | "academicYear" | "semester">
): boolean {
  if (term.semester === 1) return !assessedTerms.some((t) => t.termId === term.termId);
  return !assessedTerms.some((t) => t.academicYear === term.academicYear);
}

/**
 * ต้องทำ SDQ ในรอบนี้หรือไม่
 * - ครั้งที่ 1: เฉพาะคนที่ผล Red Flag/9S ควรดูแล
 * - ครั้งที่ 2: คนที่ควรดูแล + คนที่ปกติเมื่อโรงเรียนเปิด sdq2_for_normal_students
 */
export function sdqRequiredFor(
  round: 1 | 2,
  needsCare: boolean | null,
  sdq2ForNormalStudents: boolean
): boolean {
  if (needsCare === null) return false;
  if (needsCare) return true;
  return round === 2 && sdq2ForNormalStudents;
}

/* ------------------------------------------------------------------ */
/* 5. เกณฑ์การมาสาย (ค่าจาก school_settings ในสโตร์)                    */
/* ------------------------------------------------------------------ */

/** "HH:MM" → นาทีนับจากเที่ยงคืน */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * มาสาย = เช็คอินหลังเวลาเข้าเรียนครบ 1 นาทีขึ้นไป (schoolStartTime จาก useStore().schoolSettings)
 * scannedAt = สตริงวันเวลา พ.ศ. "2569-11-16T07:52:00" (จาก nowThaiIso)
 */
export function isLateArrival(scannedAt: string, schoolStartTime: string): boolean {
  const time = scannedAt.split("T")[1] ?? "";
  return timeToMinutes(time) > timeToMinutes(schoolStartTime);
}

/* ------------------------------------------------------------------ */
/* 6. ช่วงดำเนินงาน (operating windows)                                 */
/* ------------------------------------------------------------------ */

/** สถานะของช่วงดำเนินงาน ณ วันที่ (พ.ศ.) — ปิดแล้วล็อกเสมอ */
export function windowStatusAt(window: OperatingWindow | undefined, at: string): WindowStatus {
  if (!window) return "none";
  const day = thaiDateOf(at);
  if (compareThaiDate(day, window.opensAt) < 0) return "upcoming";
  if (compareThaiDate(day, window.closesAt) > 0) return "closed";
  return "open";
}

/** เปิดอยู่และเหลือไม่เกิน remindDaysBefore วันก่อนปิด */
export function isWindowClosingSoon(window: OperatingWindow | undefined, at: string): boolean {
  if (!window || windowStatusAt(window, at) !== "open") return false;
  return compareThaiDate(thaiDateOf(at), addDaysThai(window.closesAt, -window.remindDaysBefore)) >= 0;
}
