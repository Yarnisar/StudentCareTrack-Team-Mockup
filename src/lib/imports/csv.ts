/** อ่าน/เขียน CSV แบบ RFC 4180 (ไม่พึ่งไลบรารี) — รองรับ BOM, เครื่องหมายคำพูด, ขึ้นบรรทัดใหม่ในช่อง, ข้อความไทย */

export interface CsvTable {
  header: string[];
  /** แถวข้อมูลที่ไม่ว่าง (ตัดแถวว่างทิ้ง) พร้อมเลขบรรทัดในไฟล์ (หัวตาราง = 1) */
  rows: { line: number; cells: string[] }[];
}

const DELIMITERS = [",", ";", "\t"] as const;

/** เดาตัวคั่นจากบรรทัดแรก (Excel บางภาษาบันทึกเป็น ; หรือ tab) */
function detectDelimiter(text: string): string {
  let inQuotes = false;
  const counts = new Map<string, number>(DELIMITERS.map((d) => [d, 0]));
  for (const ch of text) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes && (ch === "\n" || ch === "\r")) break;
    else if (!inQuotes && counts.has(ch)) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }
  let best = ",";
  let bestCount = 0;
  for (const [d, n] of counts) {
    if (n > bestCount) {
      best = d;
      bestCount = n;
    }
  }
  return best;
}

/** แยกข้อความ CSV เป็นแถว (ยังไม่แยกหัวตาราง) พร้อมเลขบรรทัดเริ่มของแต่ละแถว */
function parseRecords(input: string): { line: number; cells: string[] }[] {
  const text = input.replace(/^﻿/, "");
  const delimiter = detectDelimiter(text);
  const records: { line: number; cells: string[] }[] = [];
  let cells: string[] = [];
  let cell = "";
  let inQuotes = false;
  let line = 1;
  let startLine = 1;
  let touched = false;

  const endCell = () => {
    cells.push(cell);
    cell = "";
  };
  const endRecord = () => {
    endCell();
    records.push({ line: startLine, cells });
    cells = [];
    touched = false;
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        if (ch === "\n") line++;
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      touched = true;
    } else if (ch === delimiter) {
      endCell();
      touched = true;
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      if (touched || cell !== "" || cells.length > 0) endRecord();
      line++;
      startLine = line;
    } else {
      cell += ch;
      touched = true;
    }
  }
  if (touched || cell !== "" || cells.length > 0) endRecord();
  return records;
}

export function parseCsv(text: string): CsvTable {
  const records = parseRecords(text);
  const [head, ...rest] = records;
  const header = (head?.cells ?? []).map((h) => h.trim());
  const rows = rest.filter((r) => r.cells.some((c) => c.trim() !== ""));
  return { header, rows: rows.map((r) => ({ line: r.line, cells: r.cells.map((c) => c.trim()) })) };
}

const needsQuotes = (v: string) => /[",\r\n]/.test(v) || /^\s|\s$/.test(v);

/** สร้างข้อความ CSV (คั่นด้วย CRLF) */
export function toCsv(rows: string[][]): string {
  return rows.map((r) => r.map((v) => (needsQuotes(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(",")).join("\r\n") + "\r\n";
}

/** ดาวน์โหลดข้อความเป็นไฟล์ .csv แบบ UTF-8 พร้อม BOM (Excel เปิดภาษาไทยได้ถูกต้อง) */
export function downloadCsv(filename: string, text: string): void {
  const blob = new Blob(["﻿", text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
