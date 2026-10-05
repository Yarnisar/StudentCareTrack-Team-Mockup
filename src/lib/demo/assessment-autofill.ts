/**
 * คำตอบตัวอย่างสำหรับปุ่ม "กรอกอัตโนมัติ" ในแผงสาธิต
 * แต่ละแบบมีชุดคำตอบที่ให้ผลต่างกัน เพื่อสาธิตเส้นทางถัดไปของระบบได้ครบ
 */

import { NINE_S_QUESTIONS, RED_FLAG_QUESTIONS, SDQ_QUESTIONS } from "@/lib/rules";

export function redFlagAnswersFor(target: "normal" | "needs_care"): Record<string, boolean> {
  return Object.fromEntries(
    RED_FLAG_QUESTIONS.map((q, i) => [q.id, target === "needs_care" && i === 0])
  );
}

/** ควรดูแล = กลุ่มซึมเศร้า/วิตกกังวลได้ 3 คะแนน ส่วนกลุ่มอื่นต่ำกว่าเกณฑ์ */
export function nineSAnswersFor(target: "normal" | "needs_care"): Record<string, 0 | 1 | 2> {
  const pattern: Record<string, 0 | 1 | 2> =
    target === "needs_care" ? { s4: 2, s5: 1, s1: 1 } : { s1: 1, s7: 1 };
  return Object.fromEntries(NINE_S_QUESTIONS.map((q) => [q.id, pattern[q.id] ?? 0]));
}

/** คะแนนรวมพฤติกรรมที่เป็นปัญหาเป้าหมาย: ปกติ 6 / เสี่ยง 17 / มีปัญหา 24 */
export function sdqAnswersFor(target: "normal" | "risk" | "problem"): Record<number, 0 | 1 | 2> {
  let remaining = { normal: 6, risk: 17, problem: 24 }[target];
  const answers: Record<number, 0 | 1 | 2> = {};
  for (const q of SDQ_QUESTIONS) {
    if (q.scale === "prosocial") {
      answers[q.no] = target === "problem" ? 1 : 2;
      continue;
    }
    const scored = Math.min(2, remaining) as 0 | 1 | 2;
    remaining -= scored;
    answers[q.no] = q.reverse ? ((2 - scored) as 0 | 1 | 2) : scored;
  }
  return answers;
}
