/**
 * ส่งออกตารางเป็นไฟล์ CSV ให้เปิดใน Excel ได้ภาษาไทยไม่เพี้ยน (ใส่ BOM ของ UTF-8)
 * Project 2: ถ้าต้องการ .xlsx หรือ PDF ให้สร้างที่ backend
 */

const escapeCell = (value: string | number) => {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/**
 * meta = บรรทัดข้อมูลกำกับไฟล์ไว้บนสุด (เช่น ผู้ส่งออก เวลา) แล้วเว้นหนึ่งบรรทัดก่อนตาราง
 * pre = ตารางสรุปที่วางก่อนตารางหลัก (ใส่บรรทัดว่างคั่นเองในตัวข้อมูล)
 */
export function downloadCsv(
  filename: string,
  header: string[],
  rows: (string | number)[][],
  meta?: [string, string][],
  pre?: (string | number)[][]
) {
  const lead: (string | number)[][] = meta && meta.length > 0 ? [...meta, []] : [];
  const body = [...lead, ...(pre ?? []), header, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
