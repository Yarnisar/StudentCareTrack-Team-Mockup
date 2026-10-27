/**
 * ตรรกะการคัดกรองและการประเมิน
 * อ้างอิงเกณฑ์จากคู่มือการดำเนินงานระบบ HERO OBEC CARE ปี 2568
 */

import {
  AssessmentOutcome,
  NineSCluster,
  RiskGroup,
  ScreeningDimension,
  ScreeningItem,
  SdqLevel,
  SdqScale,
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
  { id: "bh1", dimension: "behavior", label: "มาสายเกิน 5 ครั้งต่อเดือน", severity: "risk" },
  { id: "bh2", dimension: "behavior", label: "ใช้เวลากับเกมหรือสื่อออนไลน์มากกว่า 4 ชั่วโมงต่อวัน", severity: "risk" },
  { id: "bh3", dimension: "behavior", label: "มีพฤติกรรมความรุนแรงหรือทะเลาะวิวาท", severity: "problem" },
  { id: "bh4", dimension: "behavior", label: "พบการใช้สารเสพติด", severity: "problem" },

  // สุขภาพจิต
  { id: "mt1", dimension: "mental", label: "แยกตัวจากเพื่อนหรือครู", severity: "risk" },
  { id: "mt2", dimension: "mental", label: "อารมณ์แปรปรวน หงุดหงิดง่ายผิดปกติ", severity: "risk" },
  { id: "mt3", dimension: "mental", label: "ผลแบบประเมิน 9S ระบุว่าควรดูแล", severity: "risk", derivedFrom: "nine_s" },
  { id: "mt4", dimension: "mental", label: "ผลแบบคัดกรอง Red Flag ระบุว่าควรดูแล", severity: "problem", derivedFrom: "red_flag" },
];

/** รายการคัดกรองที่ผูกกับผลแบบประเมินแต่ละแบบ */
export const DERIVED_ITEM_ID = { red_flag: "mt4", nine_s: "mt3" } as const;

/**
 * เกณฑ์จัดกลุ่มรายมิติ
 * - ไม่พบรายการใด                       -> กลุ่มปกติ (เขียว)
 * - พบรายการเกณฑ์เสี่ยง แต่ไม่พบเกณฑ์มีปัญหา -> กลุ่มเสี่ยง (เหลือง)
 * - พบรายการเกณฑ์มีปัญหาอย่างน้อย 1 รายการ   -> กลุ่มมีปัญหา (แดง)
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

/** ผลรวมของนักเรียน = กลุ่มที่รุนแรงที่สุดในบรรดา 6 มิติ */
export function overallRisk(groups: RiskGroup[]): RiskGroup {
  if (groups.includes("red")) return "red";
  if (groups.includes("amber")) return "amber";
  return "green";
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

export function scoreSdq(answers: Record<number, 0 | 1 | 2>) {
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

  let level: SdqLevel = "normal";
  if (totalDifficulties >= 20) level = "problem";
  else if (totalDifficulties >= 16) level = "risk";

  return { scaleScores, totalDifficulties, level };
}

