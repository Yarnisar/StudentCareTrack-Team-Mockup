/**
 * ค้นหานักเรียนจากข้อความเดียว (ช่องค้นหาที่หัวทุกหน้า)
 * - รหัส 5 หลัก: ตรงตัว ไปทันที · พิมพ์ไม่ครบ: รหัสที่ขึ้นต้นด้วยตัวเลขนั้น
 * - รหัสบัตร "30125-2" (QR บนบัตร / เครื่องอ่านบัตรที่พิมพ์แทนคีย์บอร์ด): บัตรที่ยกเลิกหรือหมดอายุไม่รับ (UC8 Alt-A, UC14)
 * - "3/1-12" หรือ "ม.3/1 12": ห้องและเลขที่ · ตัวเลข 1–2 หลัก: เลขที่ในห้อง
 * - ข้อความ: ชื่อหรือนามสกุล ไม่ต้องพิมพ์คำนำหน้า
 */

import type { Student, StudentCard } from "./types";

export interface SearchResult {
  students: Student[];
  /** ตรงตัวคนเดียว กด Enter ไปได้ทันที */
  exact?: Student;
  /** เหตุผลเมื่อใช้ข้อความนี้ไม่ได้ เช่น บัตรถูกยกเลิก */
  note?: string;
}

const PREFIX = /^(ด\.ช\.|ด\.ญ\.|เด็กชาย|เด็กหญิง|นาย|นางสาว|นาง)\s*/;
const bareName = (name: string) => name.replace(PREFIX, "").replace(/\s+/g, " ").trim();

export function searchStudents(
  query: string,
  pool: Student[],
  cards: StudentCard[],
  today: string
): SearchResult {
  const q = query.trim();
  if (q === "") return { students: [] };

  const card = /^\d{5}-\d+$/.test(q) ? cards.find((c) => c.code === q) : undefined;
  if (/^\d{5}-\d+$/.test(q)) {
    if (!card) return { students: [], note: `ไม่พบบัตร “${q}”` };
    if (card.status === "cancelled" || card.expiresAt < today)
      return { students: [], note: `บัตร “${q}” ${card.status === "cancelled" ? "ถูกยกเลิกแล้ว" : "หมดอายุแล้ว"} ค้นด้วยรหัสหรือชื่อแทน` };
    const s = pool.find((x) => x.studentId === card.studentId);
    return s ? { students: [s], exact: s } : { students: [] };
  }

  const roomNo = q.match(/^(?:ม\.?\s*)?(\d)\s*\/\s*(\d{1,2})\s*[-\s]\s*(\d{1,2})$/);
  if (roomNo) {
    const room = `ม.${roomNo[1]}/${roomNo[2]}`;
    const s = pool.filter((x) => x.roomName === room && x.classNo === Number(roomNo[3]));
    return { students: s, exact: s.length === 1 ? s[0] : undefined };
  }

  if (/^\d{5}$/.test(q)) {
    const s = pool.find((x) => x.studentId === q);
    return s ? { students: [s], exact: s } : { students: [] };
  }
  if (/^\d{1,2}$/.test(q)) {
    // เลขที่ในห้อง รวมกับรหัสที่ขึ้นต้นด้วยเลขนี้
    const byNo = pool.filter((x) => x.classNo === Number(q));
    const byId = pool.filter((x) => x.studentId.startsWith(q) && !byNo.includes(x));
    return { students: [...byNo, ...byId] };
  }
  if (/^\d+$/.test(q)) return { students: pool.filter((x) => x.studentId.startsWith(q)) };

  const words = bareName(q).toLowerCase().split(" ");
  const s = pool.filter((x) => {
    const name = bareName(x.fullName).toLowerCase();
    return words.every((w) => name.includes(w));
  });
  return { students: s, exact: s.length === 1 ? s[0] : undefined };
}
