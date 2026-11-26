"use client";

/**
 * ห้องสอบและผังที่นั่ง (exam_rooms / exam_sessions / exam_seats) — ADR-0004
 * ย้ายมาจาก branch feat/domain-rules-ui เป็น context แยกจาก store หลัก เพื่อไม่ชนกับ store.tsx
 *
 * กฎ
 * - ทุกการเขียนเป็นของผู้ดูแลระบบเท่านั้น
 * - ห้องสอบไม่ลบ ใช้ isActive = false
 * - รอบสอบไม่ลบ ยกเลิกด้วย status = voided + เหตุผล (ที่นั่งเดิมยังอยู่ ใช้เป็นประวัติ)
 * - นักเรียน 1 คนมี 1 ที่นั่งต่อรอบสอบ จัดใหม่ = แทนที่ที่นั่งของรอบนั้น
 * - random ใช้ seed เก็บไว้กับรอบสอบ: seed เดิมได้ผังเดิม สุ่มใหม่ได้ seed ใหม่
 * - กลุ่มนักเรียนอ้างด้วยชื่อห้องเรียน (roomName) ตามโมเดล Student ของ main
 *
 * PROTOTYPE: เก็บใน state ฝั่งไคลเอนต์ Project 2 แทนด้วย REST API
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { nowThaiIso } from "../format";
import { CURRENT_TERM, DEMO_TODAY, students as mockStudents } from "../mock-data";
import { ROLE_INFO } from "../roles";
import { useStore } from "../store";
import type { Student } from "../types";
import { hashText } from "./rng";
import { assignSeats, capacityOf } from "./seating";
import { EXAM_MAX_SIDE, type ExamCell, type ExamMethod, type ExamRoom, type ExamSeat, type ExamSession } from "./types";

export type ExamResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export interface ExamRoomInput {
  name: string;
  layout: ExamCell[][];
}

export interface ExamSessionInput {
  title: string;
  examDate: string;
  examTime: string;
  /** ชื่อห้องเรียน เช่น ม.3/1 */
  studentScope: string[];
  /** ห้องสอบตามลำดับที่เลือก */
  examRoomIds: string[];
  method: ExamMethod;
}

export type ExamReassign = "same_seed" | "new_seed" | "by_code";

export interface ExamStore {
  examRooms: ExamRoom[];
  examSessions: ExamSession[];
  examSeats: ExamSeat[];
  /** ห้องเรียนที่เลือกเป็นกลุ่มสอบได้ (roomId = roomName) */
  classrooms: { roomId: string; roomName: string }[];
  currentTerm: { termId: string; label: string };

  seatsOfSession: (sessionId: string) => ExamSeat[];
  studentsInScope: (roomNames: string[]) => Student[];
  sessionsUsingRoom: (examRoomId: string) => ExamSession[];

  saveExamRoom: (input: ExamRoomInput, examRoomId?: string) => ExamResult<{ room: ExamRoom }>;
  setExamRoomActive: (examRoomId: string, active: boolean) => ExamResult;
  createExamSession: (input: ExamSessionInput) => ExamResult<{ session: ExamSession }>;
  reassignExamSession: (sessionId: string, how: ExamReassign) => ExamResult;
  publishExamSession: (sessionId: string) => ExamResult;
  voidExamSession: (sessionId: string, reason: string) => ExamResult;
}

const ADMIN_ONLY = "เฉพาะผู้ดูแลระบบจัดห้องสอบได้";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ADMIN_NAME = ROLE_INFO.admin.user.name;

/* ---------- ข้อมูลตัวอย่าง ---------- */

/** แปลงผังแบบข้อความ: # = โต๊ะ, . = ทางเดิน */
const grid = (rows: string[]): ExamCell[][] =>
  rows.map((row) => [...row].map((ch): ExamCell => (ch === "#" ? "desk" : "aisle")));

const seedAt = `${DEMO_TODAY}T08:30:00`;

const seedRooms: ExamRoom[] = [
  {
    examRoomId: "ER-1",
    name: "ห้องประชุม 1",
    layout: grid(["###.###", "###.###", "###.###", "###.###", "###.###"]),
    rowCount: 5,
    colCount: 7,
    isActive: true,
    createdBy: ADMIN_NAME,
    createdAt: seedAt,
  },
  {
    examRoomId: "ER-2",
    name: "ห้องสมุด",
    layout: grid(["#.##.#", "#.##.#", "#.##.#", "..##.."]),
    rowCount: 4,
    colCount: 6,
    isActive: true,
    createdBy: ADMIN_NAME,
    createdAt: seedAt,
  },
];

const SAMPLE_ROOM = "ม.3/1";

const seedSessions: ExamSession[] = [
  {
    sessionId: "ES-1",
    termId: CURRENT_TERM.termId,
    title: "สอบกลางภาค",
    examDate: "2570-03-02",
    examTime: "09:00–11:00",
    studentScope: [SAMPLE_ROOM],
    examRoomIds: ["ER-1", "ER-2"],
    method: "by_student_code",
    seed: null,
    status: "published",
    voidReason: null,
    createdBy: ADMIN_NAME,
    createdAt: seedAt,
  },
];

function seedSeats(): ExamSeat[] {
  const result = assignSeats({
    sessionId: "ES-1",
    studentIds: mockStudents.filter((s) => s.roomName === SAMPLE_ROOM).map((s) => s.studentId),
    rooms: seedRooms,
    method: "by_student_code",
    seed: null,
  });
  return result.ok ? result.seats : [];
}

/* ---------- provider ---------- */

let seq = 100;
const nextId = (prefix: string) => `${prefix}-${++seq}`;
/** seed ใหม่ที่ไม่ใช้ Math.random: แฮชจากชื่อรอบกับเลขลำดับ (1–999999) */
const newSeed = (title: string) => (((hashText(title) ^ Math.imul(++seq, 2654435761)) >>> 0) % 999999) + 1;

const ExamContext = createContext<ExamStore | null>(null);

export function ExamProvider({ children }: { children: ReactNode }) {
  const { role, directory } = useStore();
  const [examRooms, setRooms] = useState<ExamRoom[]>(seedRooms);
  const [examSessions, setSessions] = useState<ExamSession[]>(seedSessions);
  const [examSeats, setSeats] = useState<ExamSeat[]>(seedSeats);

  const value = useMemo<ExamStore>(() => {
    const admin = role === "admin";
    const me = ROLE_INFO[role].user.name;
    const roomById = (id: string) => examRooms.find((r) => r.examRoomId === id);

    const classrooms = [...new Set(directory.map((s) => s.roomName))]
      .sort((a, b) => a.localeCompare(b, "th", { numeric: true }))
      .map((roomName) => ({ roomId: roomName, roomName }));

    const seatsOfSession: ExamStore["seatsOfSession"] = (sessionId) =>
      examSeats.filter((s) => s.sessionId === sessionId);

    const studentsInScope: ExamStore["studentsInScope"] = (roomNames) =>
      directory.filter((s) => roomNames.includes(s.roomName));

    const sessionsUsingRoom: ExamStore["sessionsUsingRoom"] = (examRoomId) =>
      examSessions.filter((s) => s.status !== "voided" && s.examRoomIds.includes(examRoomId));

    const seatPlan = (session: ExamSession) => {
      const rooms = session.examRoomIds.map(roomById).filter((r): r is ExamRoom => !!r);
      return assignSeats({
        sessionId: session.sessionId,
        studentIds: studentsInScope(session.studentScope).map((s) => s.studentId),
        rooms,
        method: session.method,
        seed: session.seed,
      });
    };

    const saveExamRoom: ExamStore["saveExamRoom"] = (input, examRoomId) => {
      if (!admin) return { ok: false, error: ADMIN_ONLY };
      const name = input.name.trim();
      const rowCount = input.layout.length;
      const colCount = input.layout[0]?.length ?? 0;
      if (!name) return { ok: false, error: "กรอกชื่อห้องสอบ" };
      if (rowCount < 1 || colCount < 1 || rowCount > EXAM_MAX_SIDE || colCount > EXAM_MAX_SIDE)
        return { ok: false, error: `ผังต้องมี 1–${EXAM_MAX_SIDE} แถว และ 1–${EXAM_MAX_SIDE} คอลัมน์` };
      if (capacityOf(input.layout) < 1) return { ok: false, error: "ต้องมีโต๊ะอย่างน้อย 1 ตัว" };
      if (examRooms.some((r) => r.examRoomId !== examRoomId && r.name === name))
        return { ok: false, error: "มีห้องสอบชื่อนี้แล้ว" };

      const existing = examRoomId ? roomById(examRoomId) : undefined;
      if (examRoomId && !existing) return { ok: false, error: "ไม่พบห้องสอบ" };

      if (existing) {
        const layoutChanged = JSON.stringify(existing.layout) !== JSON.stringify(input.layout);
        if (layoutChanged && sessionsUsingRoom(existing.examRoomId).length > 0)
          return {
            ok: false,
            error: "ห้องนี้ถูกใช้ในรอบสอบแล้ว แก้ผังไม่ได้ — ยกเลิกรอบสอบนั้นก่อน หรือสร้างห้องใหม่",
          };
        const room: ExamRoom = { ...existing, name, layout: input.layout, rowCount, colCount };
        setRooms((prev) => prev.map((r) => (r.examRoomId === room.examRoomId ? room : r)));
        return { ok: true, room };
      }

      const room: ExamRoom = {
        examRoomId: nextId("ER"),
        name,
        rowCount,
        colCount,
        layout: input.layout,
        isActive: true,
        createdBy: me,
        createdAt: nowThaiIso(),
      };
      setRooms((prev) => [...prev, room]);
      return { ok: true, room };
    };

    const setExamRoomActive: ExamStore["setExamRoomActive"] = (examRoomId, active) => {
      if (!admin) return { ok: false, error: ADMIN_ONLY };
      const room = roomById(examRoomId);
      if (!room) return { ok: false, error: "ไม่พบห้องสอบ" };
      if (room.isActive === active) return { ok: true };
      setRooms((prev) => prev.map((r) => (r.examRoomId === examRoomId ? { ...r, isActive: active } : r)));
      return { ok: true };
    };

    const createExamSession: ExamStore["createExamSession"] = (input) => {
      if (!admin) return { ok: false, error: ADMIN_ONLY };
      const title = input.title.trim();
      if (!title) return { ok: false, error: "กรอกชื่อการสอบ" };
      const examDate = input.examDate.trim();
      if (examDate && !DATE_RE.test(examDate)) return { ok: false, error: "วันสอบใช้รูปแบบ พ.ศ. ปปปป-ดด-วว เช่น 2570-03-02" };
      if (input.studentScope.length === 0) return { ok: false, error: "เลือกกลุ่มนักเรียนที่สอบ" };
      if (input.examRoomIds.length === 0) return { ok: false, error: "เลือกห้องสอบอย่างน้อย 1 ห้อง" };
      if (input.examRoomIds.some((id) => !roomById(id)?.isActive))
        return { ok: false, error: "มีห้องสอบที่ปิดใช้งานอยู่" };

      const session: ExamSession = {
        sessionId: nextId("ES"),
        termId: CURRENT_TERM.termId,
        title,
        examDate: examDate || null,
        examTime: input.examTime.trim() || null,
        studentScope: input.studentScope,
        examRoomIds: input.examRoomIds,
        method: input.method,
        seed: input.method === "random" ? newSeed(title) : null,
        status: "draft",
        voidReason: null,
        createdBy: me,
        createdAt: nowThaiIso(),
      };
      const plan = seatPlan(session);
      if (!plan.ok) return plan;
      setSessions((prev) => [session, ...prev]);
      setSeats((prev) => [...prev, ...plan.seats]);
      return { ok: true, session };
    };

    const reassignExamSession: ExamStore["reassignExamSession"] = (sessionId, how) => {
      if (!admin) return { ok: false, error: ADMIN_ONLY };
      const current = examSessions.find((s) => s.sessionId === sessionId);
      if (!current) return { ok: false, error: "ไม่พบรอบสอบ" };
      if (current.status === "voided") return { ok: false, error: "รอบสอบที่ยกเลิกแล้วจัดใหม่ไม่ได้" };

      let next: ExamSession = current;
      if (how === "by_code") next = { ...current, method: "by_student_code", seed: null };
      else if (how === "new_seed") next = { ...current, method: "random", seed: newSeed(current.title) };
      else if (current.method !== "random" || current.seed === null)
        return { ok: false, error: "รอบนี้ไม่ได้จัดแบบสุ่ม ไม่มี seed เดิม" };

      const plan = seatPlan(next);
      if (!plan.ok) return plan;
      setSessions((prev) => prev.map((s) => (s.sessionId === sessionId ? next : s)));
      setSeats((prev) => [...prev.filter((s) => s.sessionId !== sessionId), ...plan.seats]);
      return { ok: true };
    };

    const publishExamSession: ExamStore["publishExamSession"] = (sessionId) => {
      if (!admin) return { ok: false, error: ADMIN_ONLY };
      const current = examSessions.find((s) => s.sessionId === sessionId);
      if (!current) return { ok: false, error: "ไม่พบรอบสอบ" };
      if (current.status !== "draft") return { ok: false, error: "เผยแพร่ได้เฉพาะฉบับร่าง" };
      setSessions((prev) => prev.map((s) => (s.sessionId === sessionId ? { ...s, status: "published" } : s)));
      return { ok: true };
    };

    const voidExamSession: ExamStore["voidExamSession"] = (sessionId, reason) => {
      if (!admin) return { ok: false, error: ADMIN_ONLY };
      const current = examSessions.find((s) => s.sessionId === sessionId);
      if (!current) return { ok: false, error: "ไม่พบรอบสอบ" };
      if (current.status === "voided") return { ok: false, error: "รอบสอบนี้ยกเลิกไปแล้ว" };
      const why = reason.trim();
      if (!why) return { ok: false, error: "ระบุเหตุผลที่ยกเลิก" };
      setSessions((prev) =>
        prev.map((s) => (s.sessionId === sessionId ? { ...s, status: "voided", voidReason: why } : s))
      );
      return { ok: true };
    };

    return {
      examRooms,
      examSessions,
      examSeats,
      classrooms,
      currentTerm: { termId: CURRENT_TERM.termId, label: CURRENT_TERM.label },
      seatsOfSession,
      studentsInScope,
      sessionsUsingRoom,
      saveExamRoom,
      setExamRoomActive,
      createExamSession,
      reassignExamSession,
      publishExamSession,
      voidExamSession,
    };
  }, [role, directory, examRooms, examSessions, examSeats]);

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
}

export function useExam(): ExamStore {
  const ctx = useContext(ExamContext);
  if (!ctx) throw new Error("useExam ต้องอยู่ภายใน ExamProvider");
  return ctx;
}
