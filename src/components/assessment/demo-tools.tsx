"use client";

import { useDemoPageTool } from "@/lib/demo/page-tools";

type Target = "normal" | "needs_care";

/**
 * เครื่องมือสาธิตของ Red Flag / 9S — แสดงเฉพาะเมื่อฟอร์มแก้ไขได้ (mount เฉพาะตอนนั้น)
 * ชุดแรก (ผลปกติ) คือค่าเริ่มต้นของปุ่มบนหน้า: ทำต่อเนื่อง Red Flag → 9S ได้ครบเส้นทางปกติ
 * กรอกในฟอร์มเท่านั้น ไม่บันทึก
 */
export function RedFlagDemoTools({ onFill }: { onFill: (target: Target) => void }) {
  useDemoPageTool("กรอกอัตโนมัติ · ผลปกติ", () => onFill("normal"), "ตอบ \"ไม่ใช่\" ทุกข้อ → ไปทำ 9S ต่อ");
  useDemoPageTool("กรอกอัตโนมัติ · ควรดูแล", () => onFill("needs_care"), "ตอบ \"ใช่\" 1 ข้อ → เปิด SDQ ทันที");
  return null;
}

export function NineSDemoTools({ onFill }: { onFill: (target: Target) => void }) {
  useDemoPageTool("กรอกอัตโนมัติ · ผลปกติ", () => onFill("normal"), "ทุกกลุ่มต่ำกว่า 3 คะแนน");
  useDemoPageTool("กรอกอัตโนมัติ · ควรดูแล", () => onFill("needs_care"), "กลุ่มซึมเศร้า/วิตกกังวลได้ 3 คะแนน → เปิด SDQ");
  return null;
}
