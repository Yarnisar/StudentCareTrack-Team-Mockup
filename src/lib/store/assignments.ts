/**
 * Assignments slice: การมอบหมายครู (ผู้ดูแลระบบเลือกว่าครูแต่ละคนเป็นครูประจำชั้นห้องใด และสอนวิชาใดในห้องใด)
 *
 * นี่คือ "เขตแดนเดียว" ที่เขียนตาราง classroom_homeroom_teachers และ course_teacher_assignments
 * (ADR-0003: ตารางเป็นของทีม A/B ทีม C เป็นเจ้าของหน้าจอและกฎ) ถ้าทีมใดไม่ยอมให้เขียนตรง
 * ให้เปลี่ยนเนื้อใน commit() เป็นการเรียก API ของทีมนั้น โดยไม่ต้องแก้หน้าจอ
 *
 * กฎ: ห้องละไม่เกิน 2 ครูประจำชั้นที่ยังใช้อยู่ · ไม่ลบแถว (สิ้นสุดด้วย endedAt) · ทุกการเพิ่ม/สิ้นสุดเขียน audit log
 * บทบาทของครูไม่ถูกเขียนที่นี่ — core คำนวณจากแถวที่ยังใช้อยู่ ทุกหน้าจึงเปลี่ยนตามทันที
 *
 * ยังไม่ส่งการแจ้งเตือนถึงครู: ชนิดเหตุการณ์ที่มีอยู่ผูกกับนักเรียนทั้งหมด ไม่มีชนิดที่เหมาะ
 */

import { useMemo } from "react";
import { nowThaiIso, thaiDateOf } from "../format";
import { subjects } from "../mock-data";
import type { AuditAction, ClassroomHomeroom, SubjectTeaching, User } from "../types";
import { nextId } from "./ids";
import type { PlatformSlice } from "./platform";
import * as perm from "../permissions";

/** ผู้ดูแลระบบเลือกครูได้ไม่เกินจำนวนนี้ต่อห้อง (CONTEXT: การมอบหมายครู) */
export const MAX_HOMEROOM_TEACHERS_PER_ROOM = 2;

export type AssignmentResult = { ok: true; changes: number } | { ok: false; error: string };

export type AssignmentChange =
  | { kind: "assignHomeroom"; roomId: string; teacherUserId: string }
  | { kind: "endHomeroom"; roomId: string; teacherUserId: string }
  | { kind: "assignSubject"; teacherUserId: string; subjectId: string; roomId: string }
  | { kind: "endSubject"; teachingId: string };

export interface HomeroomOfRoom {
  assignment: ClassroomHomeroom;
  teacher: User;
}

export interface AssignmentsSlice {
  /** ครูประจำชั้นที่ยังใช้อยู่ของห้อง (ปีปัจจุบัน) */
  homeroomsOfRoom: (roomId: string) => HomeroomOfRoom[];
  /** ห้องที่ครูคนนี้เป็นครูประจำชั้นอยู่ (ปีปัจจุบัน ที่ยังไม่สิ้นสุด) */
  homeroomRoomIdsOfTeacher: (teacherUserId: string) => string[];
  /** รายวิชาที่ครูคนนี้สอนอยู่ในภาคเรียนปัจจุบัน (ที่ยังไม่สิ้นสุด) */
  teachingsOfTeacher: (teacherUserId: string) => SubjectTeaching[];

  assignHomeroom: (roomId: string, teacherUserId: string) => AssignmentResult;
  endHomeroom: (roomId: string, teacherUserId: string) => AssignmentResult;
  assignSubject: (teacherUserId: string, subjectId: string, roomId: string) => AssignmentResult;
  endSubject: (teachingId: string) => AssignmentResult;
  /** หลายการเปลี่ยนแปลงในครั้งเดียว: ตรวจทั้งชุดก่อน ผิดข้อใดข้อหนึ่งไม่เขียนอะไรเลย (หน้า "ครูและสิทธิ์" ใช้ตัวนี้) */
  applyAssignmentChanges: (changes: AssignmentChange[]) => AssignmentResult;
}

interface PendingAudit {
  action: AuditAction;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  note: string;
}

export function useAssignmentsSlice(base: PlatformSlice): AssignmentsSlice {
  return useMemo<AssignmentsSlice>(() => {
    const year = base.currentTerm.academicYear;
    const termId = base.currentTerm.termId;
    const ctx = base.permissionContext;
    const roomName = (roomId: string) => base.classrooms.find((c) => c.roomId === roomId)?.roomName ?? roomId;
    const subjectName = (subjectId: string) => subjects.find((s) => s.subjectId === subjectId)?.name ?? subjectId;
    const userOfStaff = (staffId: string) => base.users.find((u) => u.refId === staffId);

    const homeroomsOfRoom: AssignmentsSlice["homeroomsOfRoom"] = (roomId) =>
      base.homerooms
        .filter((h) => h.roomId === roomId && h.academicYear === year && perm.isActiveHomeroom(ctx, h))
        .flatMap((assignment) => {
          const teacher = userOfStaff(assignment.staffId);
          return teacher ? [{ assignment, teacher }] : [];
        });

    const homeroomRoomIdsOfTeacher: AssignmentsSlice["homeroomRoomIdsOfTeacher"] = (teacherUserId) => {
      const u = base.getUser(teacherUserId);
      return u ? perm.homeroomRoomsOf(ctx, u) : [];
    };

    const teachingsOfTeacher: AssignmentsSlice["teachingsOfTeacher"] = (teacherUserId) =>
      base.subjectTeachings.filter((t) => t.teacherId === teacherUserId && t.termId === termId && t.endedAt === null);

    const apply: AssignmentsSlice["applyAssignmentChanges"] = (changes) => {
      if (base.currentUser.role !== "admin_school") {
        return { ok: false, error: "เฉพาะผู้ดูแลระบบเท่านั้นที่มอบหมายครูได้" };
      }
      if (changes.length === 0) return { ok: true, changes: 0 };

      const today = thaiDateOf(nowThaiIso());
      let homerooms = base.homerooms;
      let teachings = base.subjectTeachings;
      const audits: PendingAudit[] = [];
      const fail = (error: string): AssignmentResult => ({ ok: false, error });

      const teacherOf = (userId: string): User | string => {
        const u = base.getUser(userId);
        if (!u || !u.refId || (u.role !== "teacher_general" && u.role !== "teacher_homeroom")) return "เลือกได้เฉพาะครู";
        if (!u.isActive) return `${u.name} ถูกปิดใช้งานบัญชี`;
        return u;
      };
      const isActiveRow = (h: ClassroomHomeroom) => h.academicYear === year && h.endedAt === null;

      for (const change of changes) {
        if (change.kind === "assignHomeroom" || change.kind === "endHomeroom") {
          const teacher = teacherOf(change.teacherUserId);
          if (typeof teacher === "string") return fail(teacher);
          if (!base.classrooms.some((c) => c.roomId === change.roomId)) return fail("ไม่พบห้องเรียนนี้");
          const rn = roomName(change.roomId);
          const staffId = teacher.refId!;
          const existing = homerooms.find(
            (h) => h.roomId === change.roomId && h.staffId === staffId && h.academicYear === year
          );

          if (change.kind === "assignHomeroom") {
            if (existing && existing.endedAt === null) {
              return fail(`${teacher.name} เป็นครูประจำชั้น ${rn} อยู่แล้ว`);
            }
            const current = homerooms.filter((h) => h.roomId === change.roomId && isActiveRow(h));
            if (current.length >= MAX_HOMEROOM_TEACHERS_PER_ROOM) {
              const names = current.map((h) => userOfStaff(h.staffId)?.name ?? h.staffId).join(" และ ");
              return fail(
                `ห้อง ${rn} มีครูประจำชั้นครบ ${MAX_HOMEROOM_TEACHERS_PER_ROOM} คนแล้ว (${names}) — ต้องสิ้นสุดการมอบหมายของคนใดคนหนึ่งก่อนจึงเพิ่มได้`
              );
            }
            const entityId = `${change.roomId}:${staffId}:${year}`;
            if (existing) {
              // เคยสิ้นสุดไปแล้ว: เปิดแถวเดิมกลับมา (คีย์หลักคือ ห้อง+ครู+ปี จึงไม่สร้างแถวซ้ำ)
              homerooms = homerooms.map((h) => (h === existing ? { ...h, endedAt: null } : h));
              audits.push({
                action: "UPDATE",
                entityType: "classroom_homeroom_teachers",
                entityId,
                before: { endedAt: existing.endedAt },
                after: { endedAt: null },
                note: `มอบหมาย ${teacher.name} เป็นครูประจำชั้น ${rn} อีกครั้ง`,
              });
            } else {
              const row: ClassroomHomeroom = { roomId: change.roomId, staffId, academicYear: year, endedAt: null };
              homerooms = [...homerooms, row];
              audits.push({
                action: "CREATE",
                entityType: "classroom_homeroom_teachers",
                entityId,
                after: row,
                note: `มอบหมาย ${teacher.name} เป็นครูประจำชั้น ${rn}`,
              });
            }
          } else {
            if (!existing || existing.endedAt !== null) {
              return fail(`${teacher.name} ไม่ได้เป็นครูประจำชั้น ${rn}`);
            }
            homerooms = homerooms.map((h) => (h === existing ? { ...h, endedAt: today } : h));
            audits.push({
              action: "UPDATE",
              entityType: "classroom_homeroom_teachers",
              entityId: `${change.roomId}:${staffId}:${year}`,
              before: { endedAt: null },
              after: { endedAt: today },
              note: `สิ้นสุดการเป็นครูประจำชั้น ${rn} ของ ${teacher.name}`,
            });
          }
        } else if (change.kind === "assignSubject") {
          const teacher = teacherOf(change.teacherUserId);
          if (typeof teacher === "string") return fail(teacher);
          if (!subjects.some((s) => s.subjectId === change.subjectId)) return fail("ไม่พบรายวิชานี้");
          if (!base.classrooms.some((c) => c.roomId === change.roomId)) return fail("ไม่พบห้องเรียนนี้");
          const label = `${subjectName(change.subjectId)} ${roomName(change.roomId)}`;
          const existing = teachings.find(
            (t) =>
              t.subjectId === change.subjectId &&
              t.roomId === change.roomId &&
              t.termId === termId &&
              t.teacherId === teacher.userId
          );
          if (existing && existing.endedAt === null) return fail(`${teacher.name} สอน ${label} อยู่แล้ว`);
          if (existing) {
            teachings = teachings.map((t) => (t === existing ? { ...t, endedAt: null } : t));
            audits.push({
              action: "UPDATE",
              entityType: "course_teacher_assignments",
              entityId: existing.teachingId,
              before: { endedAt: existing.endedAt },
              after: { endedAt: null },
              note: `มอบหมาย ${teacher.name} สอน ${label} อีกครั้ง`,
            });
          } else {
            const row: SubjectTeaching = {
              teachingId: nextId("TCH"),
              subjectId: change.subjectId,
              roomId: change.roomId,
              termId,
              teacherId: teacher.userId,
              endedAt: null,
            };
            teachings = [...teachings, row];
            audits.push({
              action: "CREATE",
              entityType: "course_teacher_assignments",
              entityId: row.teachingId,
              after: row,
              note: `มอบหมาย ${teacher.name} สอน ${label}`,
            });
          }
        } else {
          const existing = teachings.find((t) => t.teachingId === change.teachingId);
          if (!existing || existing.endedAt !== null) return fail("ไม่พบการมอบหมายวิชานี้ หรือสิ้นสุดไปแล้ว");
          const teacherName = base.nameOf(existing.teacherId);
          teachings = teachings.map((t) => (t === existing ? { ...t, endedAt: today } : t));
          audits.push({
            action: "UPDATE",
            entityType: "course_teacher_assignments",
            entityId: existing.teachingId,
            before: { endedAt: null },
            after: { endedAt: today },
            note: `สิ้นสุดการสอน ${subjectName(existing.subjectId)} ${roomName(existing.roomId)} ของ ${teacherName}`,
          });
        }
      }

      // commit: จุดเดียวที่เขียนตาราง (ผ่าน core) — ตรวจครบทั้งชุดแล้วจึงมาถึงตรงนี้
      if (homerooms !== base.homerooms) base.assignmentTables.setHomerooms(homerooms);
      if (teachings !== base.subjectTeachings) base.assignmentTables.setSubjectTeachings(teachings);
      for (const a of audits) {
        base.logAudit(a.action, a.entityType, a.entityId, { before: a.before, after: a.after, note: a.note });
      }
      return { ok: true, changes: audits.length };
    };

    return {
      homeroomsOfRoom,
      homeroomRoomIdsOfTeacher,
      teachingsOfTeacher,
      assignHomeroom: (roomId, teacherUserId) => apply([{ kind: "assignHomeroom", roomId, teacherUserId }]),
      endHomeroom: (roomId, teacherUserId) => apply([{ kind: "endHomeroom", roomId, teacherUserId }]),
      assignSubject: (teacherUserId, subjectId, roomId) =>
        apply([{ kind: "assignSubject", teacherUserId, subjectId, roomId }]),
      endSubject: (teachingId) => apply([{ kind: "endSubject", teachingId }]),
      applyAssignmentChanges: apply,
    };
  }, [base]);
}
