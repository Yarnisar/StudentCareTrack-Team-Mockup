/**
 * แบบประเมิน EQ (UC10) — โรงเรียนมัธยม นักเรียนประเมินตนเอง เลือกไม่ทำได้ (Pre-condition 2, Alt-B)
 * วัด 3 ด้านหลัก ดี / เก่ง / สุข ตอบแบบ 4 ระดับ
 *
 * PROTOTYPE: คำถามและเกณฑ์เป็นตัวอย่างสำหรับทดสอบการใช้งานเท่านั้น ไม่ใช่แบบประเมิน EQ ฉบับจริงของกรมสุขภาพจิต
 * Project 2: ใช้แบบประเมินฉบับจริง (ฉบับนักเรียน 12–17 ปี) พร้อมเกณฑ์ปกติตามคู่มือ และฉบับประถมที่ครูหรือผู้ปกครองประเมิน
 */

export type EqDomain = "good" | "smart" | "happy";

export const EQ_DOMAIN_LABEL: Record<EqDomain, string> = {
  good: "ดี",
  smart: "เก่ง",
  happy: "สุข",
};

export const EQ_DOMAIN_HINT: Record<EqDomain, string> = {
  good: "ควบคุมอารมณ์ เข้าใจผู้อื่น รับผิดชอบ",
  smart: "รู้จักตัวเอง แก้ปัญหา สัมพันธ์กับผู้อื่น",
  happy: "ภูมิใจในตนเอง พอใจในชีวิต สงบทางใจ",
};

export const EQ_CHOICES = [
  { value: 1, label: "ไม่จริง" },
  { value: 2, label: "จริงบางครั้ง" },
  { value: 3, label: "ค่อนข้างจริง" },
  { value: 4, label: "จริงมาก" },
] as const;

export type EqAnswer = 1 | 2 | 3 | 4;

export const EQ_QUESTIONS: { no: number; domain: EqDomain; text: string }[] = [
  { no: 1, domain: "good", text: "เมื่อโกรธหรือไม่พอใจ ฉันควบคุมตัวเองได้" },
  { no: 2, domain: "good", text: "ฉันเข้าใจความรู้สึกของคนอื่น" },
  { no: 3, domain: "good", text: "เมื่อทำผิด ฉันยอมรับและพร้อมแก้ไข" },
  { no: 4, domain: "good", text: "ฉันช่วยเหลือผู้อื่นโดยไม่หวังสิ่งตอบแทน" },
  { no: 5, domain: "smart", text: "ฉันรู้ว่าตัวเองชอบและถนัดอะไร" },
  { no: 6, domain: "smart", text: "เมื่อมีปัญหา ฉันหาทางแก้ไขได้" },
  { no: 7, domain: "smart", text: "ฉันกล้าบอกความคิดของตัวเองอย่างเหมาะสม" },
  { no: 8, domain: "smart", text: "ฉันเข้ากับเพื่อนใหม่ได้" },
  { no: 9, domain: "happy", text: "ฉันพอใจในตัวเอง" },
  { no: 10, domain: "happy", text: "ฉันหาเรื่องสนุกหรือกิจกรรมที่ชอบทำได้" },
  { no: 11, domain: "happy", text: "เมื่อผิดหวัง ฉันทำใจได้ไม่นานนัก" },
  { no: 12, domain: "happy", text: "โดยรวมแล้ว ฉันมีความสุขกับชีวิตตอนนี้" },
];

/** ระดับรายด้าน: คะแนนด้านละ 4–16 */
export type EqLevel = "develop" | "normal" | "strong";

export const EQ_LEVEL_LABEL: Record<EqLevel, string> = {
  develop: "ควรส่งเสริม",
  normal: "อยู่ในเกณฑ์ปกติ",
  strong: "อยู่ในเกณฑ์ดี",
};

/** PROTOTYPE: เกณฑ์ตัวอย่าง ต่ำกว่า 9 ควรส่งเสริม, 9–13 ปกติ, 14 ขึ้นไปดี */
const levelOf = (score: number): EqLevel => (score < 9 ? "develop" : score <= 13 ? "normal" : "strong");

export const EQ_DOMAINS = Object.keys(EQ_DOMAIN_LABEL) as EqDomain[];

export function scoreEq(answers: Record<number, EqAnswer>) {
  const scores = Object.fromEntries(EQ_DOMAINS.map((d) => [d, 0])) as Record<EqDomain, number>;
  for (const q of EQ_QUESTIONS) scores[q.domain] += answers[q.no] ?? 0;
  const levels = Object.fromEntries(EQ_DOMAINS.map((d) => [d, levelOf(scores[d])])) as Record<EqDomain, EqLevel>;
  return { scores, levels };
}

export interface EqAssessment {
  id: string;
  studentId: string;
  termId: string;
  /** declined = นักเรียนเลือกไม่ทำ EQ (Alt-B) */
  status: "pending" | "completed" | "declined";
  answers: Record<number, EqAnswer>;
  scores: Record<EqDomain, number> | null;
  levels: Record<EqDomain, EqLevel> | null;
  assessedAt: string | null;
  /** เวลาที่ส่งครั้งก่อน ๆ เมื่อแก้คำตอบที่ส่งแล้ว (ข้อ 13) */
  editHistory?: string[];
}
