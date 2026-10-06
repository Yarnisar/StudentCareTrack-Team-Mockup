"use client";

import { useDemoPageTool } from "@/lib/demo/page-tools";
import { screeningItemIdsFor } from "@/lib/demo/screening-autofill";

/** ลงทะเบียนเครื่องมือสาธิตของแบบคัดกรอง (แสดงเฉพาะเมื่อแก้ไขได้) — กรอกในฟอร์มเท่านั้น ไม่บันทึก/รับรอง */
export function ScreeningDemoTools({ onFill }: { onFill: (ids: string[]) => void }) {
  useDemoPageTool(
    "กรอกอัตโนมัติ · ปกติทุกมิติ",
    () => onFill(screeningItemIdsFor("normal")),
    "ไม่ติ๊กรายการใด — ผลปกติ บันทึกแล้วไม่มีเคสให้ติดตาม"
  );
  useDemoPageTool(
    "กรอกอัตโนมัติ · มีบางมิติเสี่ยง",
    () => onFill(screeningItemIdsFor("risk")),
    "ติ๊กเกณฑ์เสี่ยงในมิติการเรียนและเศรษฐกิจ — ผลเสี่ยง รับรองแล้วระบบไม่เปิด care case"
  );
  useDemoPageTool(
    "กรอกอัตโนมัติ · มีมิติที่มีปัญหา",
    () => onFill(screeningItemIdsFor("problem")),
    "ติ๊กเกณฑ์มีปัญหา 1 ข้อ — ผลมีปัญหา รับรองแล้วระบบเปิด care case ให้อัตโนมัติ"
  );
  return null;
}
