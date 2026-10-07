/**
 * ตรรกะผังที่นั่งสอบ (ฟังก์ชันล้วน ไม่แตะ store)
 * - เลขที่นั่ง: ซ้ายไปขวา หน้าไปหลัง ข้ามทางเดิน เริ่มที่ 1 ในแต่ละห้อง
 * - เรียงตามรหัส: รหัสน้อยไปมาก เติมห้องตามลำดับที่เลือก
 * - สุ่ม: mulberry32 จาก seed เดียวกัน ได้ผังเดิมเสมอ
 */

import { Rng } from "./mock-data/prng";
import type { ExamCell, ExamMethod, ExamRoom, ExamSeat } from "./types";

export interface DeskPos {
  seatNo: number;
  /** เริ่มที่ 1 */
  row: number;
  col: number;
}

/** โต๊ะทั้งหมดของผัง เรียงตามเลขที่นั่ง */
export function desksOf(layout: ExamCell[][]): DeskPos[] {
  const out: DeskPos[] = [];
  layout.forEach((cells, r) =>
    cells.forEach((cell, c) => {
      if (cell === "desk") out.push({ seatNo: out.length + 1, row: r + 1, col: c + 1 });
    })
  );
  return out;
}

/** เลขที่นั่งของแต่ละช่อง (ทางเดิน = null) */
export function seatNumbers(layout: ExamCell[][]): (number | null)[][] {
  let n = 0;
  return layout.map((cells) => cells.map((cell) => (cell === "desk" ? ++n : null)));
}

export const capacityOf = (layout: ExamCell[][]) => desksOf(layout).length;

/** ผังเริ่มต้น: โต๊ะทุกช่อง */
export const blankLayout = (rows: number, cols: number): ExamCell[][] =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, (): ExamCell => "desk"));

/** ปรับขนาดผังโดยคงช่องเดิม ช่องใหม่เป็นโต๊ะ */
export function resizeLayout(layout: ExamCell[][], rows: number, cols: number): ExamCell[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c): ExamCell => layout[r]?.[c] ?? "desk")
  );
}

export const sortByCode = (codes: string[]) =>
  [...codes].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

export interface AssignInput {
  sessionId: string;
  studentIds: string[];
  /** ห้องตามลำดับที่เลือก */
  rooms: Pick<ExamRoom, "examRoomId" | "layout">[];
  method: ExamMethod;
  seed: number | null;
}

export type AssignResult = { ok: true; seats: ExamSeat[] } | { ok: false; error: string };

/** จัดที่นั่งอัตโนมัติ — คืนแถวที่นั่งของโต๊ะทุกตัว (โต๊ะที่ไม่มีคนนั่ง studentId = null) */
export function assignSeats(input: AssignInput): AssignResult {
  const slots = input.rooms.flatMap((room) =>
    desksOf(room.layout).map((d) => ({ room, desk: d }))
  );
  const capacity = slots.length;
  const count = new Set(input.studentIds).size;
  if (count > capacity)
    return {
      ok: false,
      error: `ห้องสอบที่เลือกรองรับ ${capacity} ที่นั่ง แต่มีนักเรียน ${count} คน — เลือกห้องเพิ่ม`,
    };

  const sorted = sortByCode([...new Set(input.studentIds)]);
  const order =
    input.method === "random" ? new Rng(input.seed ?? 1).shuffle(sorted) : sorted;

  const seats = slots.map(({ room, desk }, i): ExamSeat => ({
    seatId: `${input.sessionId}:${room.examRoomId}:${desk.seatNo}`,
    sessionId: input.sessionId,
    examRoomId: room.examRoomId,
    seatNo: desk.seatNo,
    rowNo: desk.row,
    colNo: desk.col,
    studentId: order[i] ?? null,
  }));
  return { ok: true, seats };
}
