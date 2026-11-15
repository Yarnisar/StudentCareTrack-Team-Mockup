/**
 * PROTOTYPE ONLY — ข้อมูลจำลองผลคุณลักษณะอันพึงประสงค์ทั้งโรงเรียน สำหรับหน้าสรุปของผู้ดูแลระบบเท่านั้น
 *
 * ใช้นักเรียนชุดเดียวกับภาพรวมของผู้ดูแลระบบ (school-data.ts) แต่สุ่มผลประเมินด้วยเมล็ดแยกต่างหาก
 * จึงไม่กระทบตัวเลขของภาพรวมเดิม ไม่เชื่อมกับ store และเก็บเป็นจำนวนเท่านั้น ไม่มีชื่อนักเรียน (หัวข้อ 3.4.1)
 * Project 2: แทนด้วย API สรุปรายห้องจาก backend โดยนับเฉพาะผลที่ส่งแล้ว
 */

import { allRooms, allStudents } from "../dashboard/_admin/school-data";
import type { DcLevel } from "@/lib/types";

export const DC_TERMS = [
  { termId: "T2569-2", label: "ภาคเรียนที่ 2 ปีการศึกษา 2569" },
  { termId: "T2569-1", label: "ภาคเรียนที่ 1 ปีการศึกษา 2569" },
] as const;

export const CRITERIA_IDS = [1, 2, 3, 4, 5, 6, 7, 8];

/** ระดับผล + "ยังไม่ส่งผล" (ยังไม่ประเมินหรือเป็นร่าง) */
export type DcBucket = DcLevel | "none";

export interface DcRoomRow {
  room: string;
  level: number;
  teacher: string;
  total: number;
  submitted: number;
  notSubmitted: number;
  /** ผลรวมไม่ผ่าน (มีข้อใดข้อหนึ่งไม่ผ่าน, 2.1.6) */
  failed: number;
  /** รายข้อ: จำนวนนักเรียนในแต่ละระดับผล (นับเฉพาะที่ส่งผลแล้ว) */
  items: Record<number, Record<DcLevel, number>>;
}

function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** ความคืบหน้าของแต่ละห้องในภาคเรียนนั้น ภาคก่อนส่งครบเกือบทุกห้อง ภาคปัจจุบันบางห้องยังไม่ส่ง */
function roomPace(room: string, termId: string): number {
  if (termId !== "T2569-2") return 0.97;
  const rnd = seeded(room.split("").reduce((s, c) => s * 31 + c.charCodeAt(0), 7));
  const roll = rnd();
  if (roll < 0.72) return 1;
  if (roll < 0.9) return 0.4 + rnd() * 0.5;
  return rnd() * 0.3;
}

function levelsOf(studentId: string, termId: string): DcLevel[] {
  const rnd = seeded(Number(studentId) * 31 + (termId === "T2569-2" ? 11 : 5));
  const type = rnd();
  // นักเรียนส่วนใหญ่ได้ดีเยี่ยม/ดี บางส่วนผ่าน และน้อยคนที่มีข้อไม่ผ่าน
  const pool: DcLevel[] = type < 0.03 ? [0, 1, 1, 2] : type < 0.16 ? [1, 2, 2, 3] : [2, 3, 3, 3];
  return CRITERIA_IDS.map(() => pool[Math.floor(rnd() * pool.length)]);
}

const cache = new Map<string, DcRoomRow[]>();

/** สรุปรายห้องของภาคเรียนนั้น */
export function dcRoomsOf(termId: string): DcRoomRow[] {
  const hit = cache.get(termId);
  if (hit) return hit;

  const rows = allRooms.map<DcRoomRow>((r) => {
    const pace = roomPace(r.room, termId);
    const items: DcRoomRow["items"] = {};
    for (const id of CRITERIA_IDS) items[id] = { 0: 0, 1: 0, 2: 0, 3: 0 };
    let submitted = 0;
    let failed = 0;
    for (const s of allStudents.filter((x) => x.room === r.room)) {
      const sent = seeded(Number(s.id) * 7 + 3)() < pace;
      if (!sent) continue;
      submitted++;
      const levels = levelsOf(s.id, termId);
      levels.forEach((lv, i) => items[CRITERIA_IDS[i]][lv]++);
      if (levels.includes(0)) failed++;
    }
    return { room: r.room, level: r.level, teacher: r.teacher, total: r.total, submitted, notSubmitted: r.total - submitted, failed, items };
  });
  cache.set(termId, rows);
  return rows;
}
