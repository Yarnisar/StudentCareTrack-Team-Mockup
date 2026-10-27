/**
 * ส่งออกตารางเป็นไฟล์ CSV ให้เปิดใน Excel ได้ภาษาไทยไม่เพี้ยน (ใส่ BOM ของ UTF-8)
 * Project 2: ถ้าต้องการ .xlsx หรือ PDF ให้สร้างที่ backend
 */

const escapeCell = (value: string | number) => {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const body = [header, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
