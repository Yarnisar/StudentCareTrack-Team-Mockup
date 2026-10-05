/**
 * Characteristics slice: คะแนนคุณลักษณะรายวิชา (dc_scores, ปพ.5) และสรุปรายคุณลักษณะ (dc_summary, ปพ.6)
 *
 * - ครูประจำวิชาให้คะแนน 0–3 วิชาละ 1 ครั้งต่อตัวชี้วัด ต่อนักเรียน ต่อภาคเรียน
 * - รายวิชา "ส่งแล้ว" เมื่อให้คะแนนครบทุกนักเรียนในห้องทุกตัวชี้วัด
 * - ระบบเสนอฐานนิยม ครูประจำชั้นแก้ได้แต่ต้องใส่เหตุผล
 * - สรุปได้เมื่อส่งครบทุกวิชา หรือเลยกำหนดส่งของงานวิชาการแล้ว (บันทึกรายวิชาที่ยังไม่ส่ง)
 * - คุณลักษณะฯ ไม่ใช่ข้อมูลอ่อนไหว: บุคลากรทุกคนดูได้
 */

import { useMemo, useState } from "react";
import { modeLevel } from "../dc-rules";
import { isAfterThai, nowThaiIso, thaiDateOf } from "../format";
import {
  dcCriteria,
  dcIndicators,
  dcScores as seedScores,
  dcSubmissionDeadlines,
  dcSummaryRows as seedSummaryRows,
  subjects,
  subjectTeachings,
} from "../mock-data";
import type {
  DcCriteria,
  DcIndicator,
  DcLevel,
  DcLevelOverride,
  DcScore,
  DcSubmissionDeadline,
  DcSummary,
  DcSummaryRow,
  Student,
  Subject,
  SubjectSubmission,
  SubjectTeaching,
} from "../types";
import { nextId } from "./ids";
import type { PlatformSlice } from "./platform";

export interface DcScoreEntry {
  studentId: string;
  indicatorId: string;
  level: DcLevel;
}

export type DcResult = { ok: true; count: number } | { ok: false; error: string };

/** ความพร้อมในการสรุป ปพ.6 ของห้อง */
export interface DcSummaryReadiness {
  /** complete = ส่งครบทุกวิชา, deadline_passed = เลยกำหนดส่งแล้ว, waiting = ยังสรุปไม่ได้ */
  status: "complete" | "deadline_passed" | "waiting";
  allowed: boolean;
  pending: SubjectSubmission[];
  deadline: DcSubmissionDeadline | undefined;
}

/** การแก้ระดับจากค่าที่เสนอ: overrides[studentId][criteriaId] */
export type DcOverrides = Record<string, Record<number, DcLevelOverride>>;

export interface DcSlice {
  dcCriteria: DcCriteria[];
  dcIndicators: DcIndicator[];
  /** รายวิชา (Team A, อ่านอย่างเดียว) */
  subjects: Subject[];
  subjectTeachings: SubjectTeaching[];
  dcScores: DcScore[];
  dcSummaryRows: DcSummaryRow[];
  /** สรุปล่าสุดของนักเรียนแต่ละคน (ภาคปัจจุบันถ้าสรุปแล้ว ไม่งั้นภาคล่าสุดที่สรุป) */
  dcSummaries: DcSummary[];
  /** สถานะการส่ง ปพ.5 ทุกห้องของภาคเรียนปัจจุบัน */
  subjectSubmissions: SubjectSubmission[];

  subjectOf: (subjectId: string) => Subject | undefined;
  teachingOf: (teachingId: string) => SubjectTeaching | undefined;
  /** รายวิชาที่ผู้ใช้ปัจจุบันสอนในภาคเรียนปัจจุบัน */
  myTeachings: SubjectTeaching[];
  /** นักเรียนที่กำลังศึกษาในห้อง เรียงตามเลขที่ */
  studentsOfRoom: (roomId: string) => Student[];
  /** กำหนดส่งคะแนน ปพ.5 (จากงานวิชาการ) */
  dcDeadlineOf: (termId?: string) => DcSubmissionDeadline | undefined;
  isDcDeadlinePassed: (termId?: string) => boolean;
  subjectSubmissionsOf: (roomId: string, termId?: string) => SubjectSubmission[];
  /** รายวิชาที่ยังให้คะแนนนักเรียนคนนี้ไม่ครบ */
  missingSubjectsOf: (studentId: string, termId?: string) => Subject[];
  dcScoreOf: (studentId: string, indicatorId: string, subjectId: string, termId?: string) => DcScore | undefined;
  /** ฐานนิยมจาก dc_scores ของคุณลักษณะนั้น (ทุกตัวชี้วัด ทุกรายวิชา) */
  suggestedDcLevelOf: (studentId: string, criteriaId: number, termId?: string) => DcLevel | null;
  dcSummaryRowOf: (studentId: string, criteriaId: number, termId?: string) => DcSummaryRow | undefined;
  /**
   * มุมมองสรุปของนักเรียน — ระบุ termId เพื่อดูภาคนั้น
   * ไม่ระบุ: ภาคปัจจุบันถ้าสรุปแล้ว ไม่งั้นภาคล่าสุดที่สรุป (ดู .termId)
   */
  dcSummaryOf: (studentId: string, termId?: string) => DcSummary | undefined;

  /** ผู้ใช้ปัจจุบันเป็นครูประจำวิชาของรายวิชานี้ (ภาคเรียนปัจจุบัน) */
  canEnterDcScores: (teachingId: string) => boolean;
  /** บันทึก/แก้คะแนน (upsert) ครูประจำวิชาเท่านั้น */
  saveDcScores: (teachingId: string, entries: DcScoreEntry[]) => DcResult;

  dcSummaryReadiness: (roomId: string) => DcSummaryReadiness;
  /** ครูประจำชั้นของห้อง และห้องพร้อมสรุป */
  canSummarizeDc: (roomId: string) => boolean;
  /** สรุป ปพ.6 ทั้งห้อง (สรุปซ้ำได้ → UPDATE) */
  summarizeDcRoom: (roomId: string, overrides: DcOverrides) => DcResult;

  /** แจ้งครูประจำวิชาที่ยังไม่ส่ง ปพ.5 (dc_scores_requested) คืนจำนวนผู้รับ — ไม่ระบุห้อง = ห้องที่ผู้ใช้เป็นครูประจำชั้น */
  requestPendingDcScores: (roomId?: string) => number;
}

/** จัดกลุ่มตามคีย์ (ไม่ใช้ Map.groupBy เพื่อรองรับเบราว์เซอร์รุ่นเก่า) */
function groupBy<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const item of items) out.set(keyOf(item), [...(out.get(keyOf(item)) ?? []), item]);
  return out;
}

const scoreKey = (studentId: string, indicatorId: string, subjectId: string, termId: string) =>
  `${studentId}|${indicatorId}|${subjectId}|${termId}`;

export function useDcSlice(base: PlatformSlice): DcSlice {
  const [dcScores, setDcScores] = useState<DcScore[]>(seedScores);
  const [dcSummaryRows, setDcSummaryRows] = useState<DcSummaryRow[]>(seedSummaryRows);

  return useMemo<DcSlice>(() => {
    const currentTermId = base.currentTerm.termId;
    const user = base.currentUser;

    const scoreIndex = new Map(dcScores.map((s) => [scoreKey(s.studentId, s.indicatorId, s.subjectId, s.termId), s]));
    const dcScoreOf: DcSlice["dcScoreOf"] = (studentId, indicatorId, subjectId, termId = currentTermId) =>
      scoreIndex.get(scoreKey(studentId, indicatorId, subjectId, termId));

    const subjectOf = (subjectId: string) => subjects.find((s) => s.subjectId === subjectId);
    const teachingOf = (teachingId: string) => subjectTeachings.find((t) => t.teachingId === teachingId);
    const studentsOfRoom = (roomId: string) =>
      base.students
        .filter((s) => s.roomId === roomId && s.status === "studying")
        .sort((a, b) => a.classNo - b.classNo);
    const teachingsOfRoom = (roomId: string, termId: string) =>
      subjectTeachings.filter((t) => t.roomId === roomId && t.termId === termId);

    const dcDeadlineOf = (termId = currentTermId) => dcSubmissionDeadlines.find((d) => d.termId === termId);
    const isDcDeadlinePassed = (termId = currentTermId) => {
      const d = dcDeadlineOf(termId);
      return !!d && isAfterThai(thaiDateOf(nowThaiIso()), d.date);
    };

    const studentComplete = (studentId: string, subjectId: string, termId: string) =>
      dcIndicators.every((ind) => scoreIndex.has(scoreKey(studentId, ind.indicatorId, subjectId, termId)));

    const submissionOf = (t: SubjectTeaching): SubjectSubmission => {
      const roomStudents = studentsOfRoom(t.roomId);
      const total = roomStudents.length * dcIndicators.length;
      const filled = roomStudents.reduce(
        (sum, st) =>
          sum + dcIndicators.filter((ind) => scoreIndex.has(scoreKey(st.studentId, ind.indicatorId, t.subjectId, t.termId))).length,
        0
      );
      return {
        teachingId: t.teachingId,
        subjectId: t.subjectId,
        subject: subjectOf(t.subjectId)?.name ?? t.subjectId,
        teacherId: t.teacherId,
        roomId: t.roomId,
        filled,
        total,
        submitted: total > 0 && filled === total,
      };
    };

    const subjectSubmissionsOf = (roomId: string, termId = currentTermId) =>
      teachingsOfRoom(roomId, termId).map(submissionOf);

    const missingSubjectsOf = (studentId: string, termId = currentTermId): Subject[] => {
      const student = base.getStudent(studentId);
      if (!student) return [];
      return teachingsOfRoom(student.roomId, termId)
        .filter((t) => !studentComplete(studentId, t.subjectId, termId))
        .flatMap((t) => subjectOf(t.subjectId) ?? []);
    };

    const suggestedDcLevelOf = (studentId: string, criteriaId: number, termId = currentTermId) => {
      const indicatorIds = new Set(dcIndicators.filter((i) => i.criteriaId === criteriaId).map((i) => i.indicatorId));
      return modeLevel(
        dcScores
          .filter((s) => s.studentId === studentId && s.termId === termId && indicatorIds.has(s.indicatorId))
          .map((s) => s.level)
      );
    };

    const dcSummaryRowOf = (studentId: string, criteriaId: number, termId = currentTermId) =>
      dcSummaryRows.find((r) => r.studentId === studentId && r.criteriaId === criteriaId && r.termId === termId);

    const summaryView = (studentId: string, termId: string): DcSummary | undefined => {
      const rows = dcSummaryRows.filter((r) => r.studentId === studentId && r.termId === termId);
      if (rows.length === 0) return undefined;
      const missingIds = [...new Set(rows.flatMap((r) => r.missingSubjects))];
      const latest = rows.reduce((a, b) => (b.summarizedAt > a.summarizedAt ? b : a));
      return {
        studentId,
        termId,
        levels: Object.fromEntries(dcCriteria.map((c) => [c.criteriaId, rows.find((r) => r.criteriaId === c.criteriaId)?.level ?? null])),
        missingSubjects: missingIds.map((id) => subjectOf(id)?.name ?? id),
        summarizedBy: latest.summarizedBy,
        summarizedAt: latest.summarizedAt,
      };
    };

    const dcSummaryOf: DcSlice["dcSummaryOf"] = (studentId, termId) => {
      if (termId) return summaryView(studentId, termId);
      const current = summaryView(studentId, currentTermId);
      if (current) return current;
      const terms = [...new Set(dcSummaryRows.filter((r) => r.studentId === studentId).map((r) => r.termId))].sort();
      const last = terms.at(-1);
      return last ? summaryView(studentId, last) : undefined;
    };

    const dcSummaries = base.students.flatMap((s) => dcSummaryOf(s.studentId) ?? []);
    const subjectSubmissions = subjectTeachings.filter((t) => t.termId === currentTermId).map(submissionOf);
    const myTeachings = subjectTeachings.filter((t) => t.termId === currentTermId && t.teacherId === user.userId);

    const canEnterDcScores = (teachingId: string) => {
      const t = teachingOf(teachingId);
      return !!t && t.termId === currentTermId && t.teacherId === user.userId;
    };

    const saveDcScores: DcSlice["saveDcScores"] = (teachingId, entries) => {
      const t = teachingOf(teachingId);
      if (!t || !canEnterDcScores(teachingId)) return { ok: false, error: "เฉพาะครูประจำวิชานี้ในภาคเรียนปัจจุบันเท่านั้นที่บันทึกคะแนนได้" };
      const roomIds = new Set(studentsOfRoom(t.roomId).map((s) => s.studentId));
      const changed = entries.filter(
        (e) => roomIds.has(e.studentId) && dcScoreOf(e.studentId, e.indicatorId, t.subjectId, t.termId)?.level !== e.level
      );
      if (changed.length === 0) return { ok: true, count: 0 };

      const now = nowThaiIso();
      const updates = new Map<string, DcScore>();
      for (const e of changed) {
        const key = scoreKey(e.studentId, e.indicatorId, t.subjectId, t.termId);
        const prev = scoreIndex.get(key);
        updates.set(key, {
          scoreId: prev?.scoreId ?? nextId("DCS"),
          studentId: e.studentId,
          indicatorId: e.indicatorId,
          subjectId: t.subjectId,
          subjectTeacherId: user.userId,
          termId: t.termId,
          level: e.level,
          updatedAt: now,
        });
      }
      setDcScores((prev) => {
        const kept = prev.map((s) => updates.get(scoreKey(s.studentId, s.indicatorId, s.subjectId, s.termId)) ?? s);
        const existing = new Set(prev.map((s) => scoreKey(s.studentId, s.indicatorId, s.subjectId, s.termId)));
        return [...kept, ...[...updates.entries()].filter(([k]) => !existing.has(k)).map(([, v]) => v)];
      });

      // audit 1 แถวต่อ (นักเรียน, รายวิชา, ภาคเรียน)
      const byStudent = groupBy(changed, (e) => e.studentId);
      const codeOf = (indicatorId: string) => dcIndicators.find((i) => i.indicatorId === indicatorId)?.code ?? indicatorId;
      for (const [studentId, list] of byStudent) {
        const hadAny = dcIndicators.some((ind) => scoreIndex.has(scoreKey(studentId, ind.indicatorId, t.subjectId, t.termId)));
        const before = Object.fromEntries(
          list.flatMap((e) => {
            const prev = dcScoreOf(studentId, e.indicatorId, t.subjectId, t.termId);
            return prev ? [[codeOf(e.indicatorId), prev.level]] : [];
          })
        );
        const after = Object.fromEntries(list.map((e) => [codeOf(e.indicatorId), e.level]));
        base.logAudit(hadAny ? "UPDATE" : "CREATE", "dc_scores", `${studentId}:${t.subjectId}:${t.termId}`, {
          before: hadAny ? before : undefined,
          after,
          note: `${subjectOf(t.subjectId)?.name ?? t.subjectId} ${list.length} ตัวชี้วัด`,
        });
      }
      return { ok: true, count: changed.length };
    };

    const dcSummaryReadiness = (roomId: string): DcSummaryReadiness => {
      const pending = subjectSubmissionsOf(roomId).filter((s) => !s.submitted);
      const deadline = dcDeadlineOf();
      const status = pending.length === 0 ? "complete" : isDcDeadlinePassed() ? "deadline_passed" : "waiting";
      return { status, allowed: status !== "waiting" && studentsOfRoom(roomId).length > 0, pending, deadline };
    };

    const isHomeroomOfRoom = (roomId: string) => base.myHomeroomRoomIds.includes(roomId);
    const canSummarizeDc = (roomId: string) => isHomeroomOfRoom(roomId) && dcSummaryReadiness(roomId).allowed;

    const summarizeDcRoom: DcSlice["summarizeDcRoom"] = (roomId, overrides) => {
      if (!isHomeroomOfRoom(roomId)) return { ok: false, error: "เฉพาะครูประจำชั้นของห้องนี้เท่านั้นที่สรุปผลได้" };
      const readiness = dcSummaryReadiness(roomId);
      if (!readiness.allowed)
        return { ok: false, error: "ยังสรุปไม่ได้ — ต้องรอให้ครูประจำวิชาส่งครบทุกวิชา หรือเลยกำหนดส่งก่อน" };

      const now = nowThaiIso();
      const rows: DcSummaryRow[] = [];
      for (const student of studentsOfRoom(roomId)) {
        const missing = missingSubjectsOf(student.studentId).map((s) => s.subjectId);
        for (const c of dcCriteria) {
          const suggested = suggestedDcLevelOf(student.studentId, c.criteriaId);
          const o = overrides[student.studentId]?.[c.criteriaId];
          const level = o?.level ?? suggested;
          if (level === null)
            return { ok: false, error: `${student.fullName}: ยังไม่มีคะแนนด้าน${c.name} ต้องเลือกระดับพร้อมเหตุผล` };
          const reason = o?.reason.trim() ?? "";
          if (level !== suggested && !reason)
            return { ok: false, error: `${student.fullName}: ระดับด้าน${c.name} ต่างจากค่าที่ระบบเสนอ ต้องใส่เหตุผล` };
          const prev = dcSummaryRowOf(student.studentId, c.criteriaId);
          rows.push({
            summaryId: prev?.summaryId ?? nextId("DSM"),
            studentId: student.studentId,
            criteriaId: c.criteriaId,
            termId: currentTermId,
            suggestedLevel: suggested,
            level,
            adjustReason: level !== suggested ? reason : null,
            missingSubjects: missing,
            summarizedBy: user.userId,
            summarizedAt: now,
          });
        }
      }

      const replaced = new Set(rows.map((r) => r.summaryId));
      setDcSummaryRows((prev) => [...prev.filter((r) => !replaced.has(r.summaryId)), ...rows]);

      for (const [studentId, list] of groupBy(rows, (r) => r.studentId)) {
        const before = summaryView(studentId, currentTermId);
        const missing = list[0].missingSubjects.map((id) => subjectOf(id)?.name ?? id);
        const adjusted = list.filter((r) => r.adjustReason).length;
        base.logAudit(before ? "UPDATE" : "CREATE", "dc_summary", `${studentId}:${currentTermId}`, {
          before: before?.levels,
          after: Object.fromEntries(list.map((r) => [r.criteriaId, r.level])),
          note: [
            adjusted > 0 ? `แก้จากค่าที่เสนอ ${adjusted} ด้าน` : null,
            missing.length > 0 ? `รายวิชาที่ยังไม่ส่ง: ${missing.join(", ")}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || undefined,
        });
      }
      return { ok: true, count: rows.length };
    };

    const requestPendingDcScores: DcSlice["requestPendingDcScores"] = (roomId) => {
      const roomIds = roomId ? [roomId] : base.myHomeroomRoomIds;
      return roomIds
        .flatMap((r) => subjectSubmissionsOf(r).filter((s) => !s.submitted))
        .reduce(
          (sum, s) => sum + base.notify("dc_scores_requested", [s.teacherId], null, { subjectName: s.subject }).length,
          0
        );
    };

    return {
      dcCriteria,
      dcIndicators,
      subjects,
      subjectTeachings,
      dcScores,
      dcSummaryRows,
      dcSummaries,
      subjectSubmissions,
      subjectOf,
      teachingOf,
      myTeachings,
      studentsOfRoom,
      dcDeadlineOf,
      isDcDeadlinePassed,
      subjectSubmissionsOf,
      missingSubjectsOf,
      dcScoreOf,
      suggestedDcLevelOf,
      dcSummaryRowOf,
      dcSummaryOf,
      canEnterDcScores,
      saveDcScores,
      dcSummaryReadiness,
      canSummarizeDc,
      summarizeDcRoom,
      requestPendingDcScores,
    };
  }, [base, dcScores, dcSummaryRows]);
}
