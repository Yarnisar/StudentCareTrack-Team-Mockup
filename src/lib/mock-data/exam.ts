/**
 * ข้อมูลตัวอย่างห้องสอบและรอบสอบ (ADR-0004)
 * ผังที่นั่งของรอบตัวอย่างสร้างด้วยตัวจัดที่นั่งเดียวกับระบบจริง จากรายชื่อนักเรียนใน store
 */

import { assignSeats } from "../exam-seating";
import type { ExamCell, ExamRoom, ExamSeat, ExamSession } from "../types";
import { CURRENT_TERM, DEMO_TODAY, USER, students } from "./core";

/** แปลงผังแบบข้อความ: # = โต๊ะ, . = ทางเดิน */
const grid = (rows: string[]): ExamCell[][] =>
  rows.map((row) => [...row].map((ch): ExamCell => (ch === "#" ? "desk" : "aisle")));

const at = `${DEMO_TODAY}T08:30:00`;

export const examRooms: ExamRoom[] = [
  {
    examRoomId: "ER-1",
    name: "ห้องประชุม 1",
    // ทางเดินกลางห้อง
    layout: grid(["###.###", "###.###", "###.###", "###.###", "###.###"]),
    rowCount: 5,
    colCount: 7,
    isActive: true,
    createdBy: USER.admin,
    createdAt: at,
  },
  {
    examRoomId: "ER-2",
    name: "ห้องสมุด",
    // ทางเดินสองข้างและช่องว่างมุมห้อง
    layout: grid(["#.##.#", "#.##.#", "#.##.#", "..##.."]),
    rowCount: 4,
    colCount: 6,
    isActive: true,
    createdBy: USER.admin,
    createdAt: at,
  },
];

export const SAMPLE_EXAM_SESSION_ID = "ES-1";

export const examSessions: ExamSession[] = [
  {
    sessionId: SAMPLE_EXAM_SESSION_ID,
    termId: CURRENT_TERM.termId,
    title: "สอบกลางภาค",
    examDate: "2570-03-02",
    examTime: "09:00–11:00",
    studentScope: ["R-301"],
    examRoomIds: ["ER-1", "ER-2"],
    method: "by_student_code",
    seed: null,
    status: "published",
    voidReason: null,
    createdBy: USER.admin,
    createdAt: at,
  },
];

function sampleSeats(): ExamSeat[] {
  const result = assignSeats({
    sessionId: SAMPLE_EXAM_SESSION_ID,
    studentIds: students
      .filter((s) => s.roomId === "R-301" && s.status === "studying")
      .map((s) => s.studentId),
    rooms: examRooms,
    method: "by_student_code",
    seed: null,
  });
  return result.ok ? result.seats : [];
}

export const examSeats: ExamSeat[] = sampleSeats();
