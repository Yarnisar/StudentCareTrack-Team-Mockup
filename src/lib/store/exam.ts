/**
 * Exam slice: ห้องสอบและผังที่นั่ง (exam_rooms / exam_sessions / exam_seats) — ADR-0004
 *
 * กฎ
 * - ทุกการเขียนเป็นของผู้ดูแลระบบเท่านั้น และเขียน audit log
 * - ห้องสอบไม่ลบ ใช้ isActive = false
 * - รอบสอบไม่ลบ ยกเลิกด้วย status = voided + เหตุผล (ที่นั่งเดิมยังอยู่ ใช้เป็นประวัติ)
 * - นักเรียน 1 คนมี 1 ที่นั่งต่อรอบสอบ จัดใหม่ = แทนที่ที่นั่งของรอบนั้น (ประวัติอยู่ใน audit)
 * - random ใช้ seed เก็บไว้กับรอบสอบ: seed เดิมได้ผังเดิม สุ่มใหม่ได้ seed ใหม่
 */

import { useMemo, useState } from "react";
import { assignSeats, capacityOf } from "../exam-seating";
import { nowThaiIso } from "../format";
import { examRooms as seedRooms, examSeats as seedSeats, examSessions as seedSessions } from "../mock-data";
import { hashText } from "../mock-data/prng";
import { isAdmin } from "../permissions";
import {
  EXAM_MAX_SIDE,
  type ExamCell,
  type ExamMethod,
  type ExamRoom,
  type ExamSeat,
  type ExamSession,
  type Student,
} from "../types";
import type { PlatformSlice } from "./platform";
import { nextId, nextSeq } from "./ids";

export type ExamResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export interface ExamRoomInput {
  name: string;
  layout: ExamCell[][];
}

export interface ExamSessionInput {
  title: string;
  examDate: string;
  examTime: string;
  /** รหัสห้องเรียนของทีม B */
  studentScope: string[];
  /** ห้องสอบตามลำดับที่เลือก */
  examRoomIds: string[];
  method: ExamMethod;
}

export type ExamReassign = "same_seed" | "new_seed" | "by_code";

export interface ExamSlice {
  examRooms: ExamRoom[];
  examSessions: ExamSession[];
  examSeats: ExamSeat[];

  seatsOfSession: (sessionId: string) => ExamSeat[];
  /** นักเรียนที่กำลังศึกษาในห้องเรียนเหล่านี้ */
  studentsInScope: (roomIds: string[]) => Student[];
  /** รอบสอบที่ยังไม่ยกเลิกและใช้ห้องสอบนี้อยู่ */
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

/** seed ใหม่ที่ไม่ใช้นาฬิกา/Math.random: แฮชจากชื่อรอบกับเลขลำดับของต้นแบบ (1–999999) */
const newSeed = (title: string) => ((hashText(title) ^ Math.imul(nextSeq(), 2654435761)) >>> 0) % 999999 + 1;

export function useExamSlice(base: PlatformSlice): ExamSlice {
  const [examRooms, setRooms] = useState<ExamRoom[]>(seedRooms);
  const [examSessions, setSessions] = useState<ExamSession[]>(seedSessions);
  const [examSeats, setSeats] = useState<ExamSeat[]>(seedSeats);

  return useMemo<ExamSlice>(() => {
    const admin = isAdmin(base.currentUser);
    const roomById = (id: string) => examRooms.find((r) => r.examRoomId === id);

    const seatsOfSession: ExamSlice["seatsOfSession"] = (sessionId) =>
      examSeats.filter((s) => s.sessionId === sessionId);

    const studentsInScope: ExamSlice["studentsInScope"] = (roomIds) =>
      base.students.filter((s) => s.status === "studying" && roomIds.includes(s.roomId));

    const sessionsUsingRoom: ExamSlice["sessionsUsingRoom"] = (examRoomId) =>
      examSessions.filter((s) => s.status !== "voided" && s.examRoomIds.includes(examRoomId));

    const saveExamRoom: ExamSlice["saveExamRoom"] = (input, examRoomId) => {
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
        base.logAudit("UPDATE", "exam_rooms", room.examRoomId, {
          before: { name: existing.name, capacity: capacityOf(existing.layout) },
          after: { name, capacity: capacityOf(input.layout) },
        });
        return { ok: true, room };
      }

      const room: ExamRoom = {
        examRoomId: nextId("ER"),
        name,
        rowCount,
        colCount,
        layout: input.layout,
        isActive: true,
        createdBy: base.currentUser.userId,
        createdAt: nowThaiIso(),
      };
      setRooms((prev) => [...prev, room]);
      base.logAudit("CREATE", "exam_rooms", room.examRoomId, {
        note: `${name} ${rowCount}×${colCount} ความจุ ${capacityOf(input.layout)}`,
      });
      return { ok: true, room };
    };

    const setExamRoomActive: ExamSlice["setExamRoomActive"] = (examRoomId, active) => {
      if (!admin) return { ok: false, error: ADMIN_ONLY };
      const room = roomById(examRoomId);
      if (!room) return { ok: false, error: "ไม่พบห้องสอบ" };
      if (room.isActive === active) return { ok: true };
      setRooms((prev) => prev.map((r) => (r.examRoomId === examRoomId ? { ...r, isActive: active } : r)));
      base.logAudit("UPDATE", "exam_rooms", examRoomId, {
        before: { isActive: room.isActive },
        after: { isActive: active },
        note: active ? "เปิดใช้งานห้องสอบ" : "ปิดใช้งานห้องสอบ",
      });
      return { ok: true };
    };

    /** จัดที่นั่งของรอบสอบ (ใช้ทั้งตอนสร้างและจัดใหม่) */
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

    const createExamSession: ExamSlice["createExamSession"] = (input) => {
      if (!admin) return { ok: false, error: ADMIN_ONLY };
      const title = input.title.trim();
      const examDate = input.examDate.trim();
      const examTime = input.examTime.trim();
      if (!title) return { ok: false, error: "กรอกชื่อการสอบ" };
      if (examDate && !DATE_RE.test(examDate))
        return { ok: false, error: "วันสอบใช้รูปแบบ พ.ศ. ปปปป-ดด-วว เช่น 2570-03-02" };
      if (input.studentScope.length === 0) return { ok: false, error: "เลือกกลุ่มนักเรียนที่สอบ" };
      if (input.examRoomIds.length === 0) return { ok: false, error: "เลือกห้องสอบอย่างน้อย 1 ห้อง" };
      if (input.examRoomIds.some((id) => !roomById(id)?.isActive))
        return { ok: false, error: "มีห้องสอบที่ปิดใช้งานอยู่" };

      const session: ExamSession = {
        sessionId: nextId("ES"),
        termId: base.currentTerm.termId,
        title,
        examDate: examDate || null,
        examTime: examTime || null,
        studentScope: input.studentScope,
        examRoomIds: input.examRoomIds,
        method: input.method,
        seed: input.method === "random" ? newSeed(title) : null,
        status: "draft",
        voidReason: null,
        createdBy: base.currentUser.userId,
        createdAt: nowThaiIso(),
      };
      const plan = seatPlan(session);
      if (!plan.ok) return plan;

      setSessions((prev) => [session, ...prev]);
      setSeats((prev) => [...prev, ...plan.seats]);
      base.logAudit("CREATE", "exam_sessions", session.sessionId, { note: title });
      base.logAudit("CREATE", "exam_seats", session.sessionId, {
        note: `จัดที่นั่ง ${plan.seats.filter((s) => s.studentId).length} คน (${
          session.method === "random" ? `สุ่ม seed ${session.seed}` : "เรียงตามรหัส"
        })`,
      });
      return { ok: true, session };
    };

    const reassignExamSession: ExamSlice["reassignExamSession"] = (sessionId, how) => {
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

      const before = seatsOfSession(sessionId).filter((s) => s.studentId).length;
      setSessions((prev) => prev.map((s) => (s.sessionId === sessionId ? next : s)));
      setSeats((prev) => [...prev.filter((s) => s.sessionId !== sessionId), ...plan.seats]);
      base.logAudit("UPDATE", "exam_seats", sessionId, {
        before: { method: current.method, seed: current.seed, seated: before },
        after: {
          method: next.method,
          seed: next.seed,
          seated: plan.seats.filter((s) => s.studentId).length,
        },
        note: "จัดที่นั่งใหม่ แทนที่ผังเดิม",
      });
      return { ok: true };
    };

    const publishExamSession: ExamSlice["publishExamSession"] = (sessionId) => {
      if (!admin) return { ok: false, error: ADMIN_ONLY };
      const current = examSessions.find((s) => s.sessionId === sessionId);
      if (!current) return { ok: false, error: "ไม่พบรอบสอบ" };
      if (current.status !== "draft") return { ok: false, error: "เผยแพร่ได้เฉพาะฉบับร่าง" };
      setSessions((prev) =>
        prev.map((s) => (s.sessionId === sessionId ? { ...s, status: "published" } : s))
      );
      base.logAudit("UPDATE", "exam_sessions", sessionId, {
        before: { status: "draft" },
        after: { status: "published" },
        note: "เผยแพร่ผังที่นั่ง",
      });
      return { ok: true };
    };

    const voidExamSession: ExamSlice["voidExamSession"] = (sessionId, reason) => {
      if (!admin) return { ok: false, error: ADMIN_ONLY };
      const current = examSessions.find((s) => s.sessionId === sessionId);
      if (!current) return { ok: false, error: "ไม่พบรอบสอบ" };
      if (current.status === "voided") return { ok: false, error: "รอบสอบนี้ยกเลิกไปแล้ว" };
      const why = reason.trim();
      if (!why) return { ok: false, error: "ระบุเหตุผลที่ยกเลิก" };
      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === sessionId ? { ...s, status: "voided", voidReason: why } : s
        )
      );
      base.logAudit("VOID", "exam_sessions", sessionId, { reason: why });
      return { ok: true };
    };

    return {
      examRooms,
      examSessions,
      examSeats,
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
  }, [base, examRooms, examSessions, examSeats]);
}
