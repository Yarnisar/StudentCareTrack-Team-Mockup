/**
 * Documents slice: เอกสาร ปพ. (education_documents)
 *
 * ส่วนของ Team C ใช้ dc_criteria / dc_scores / dc_summary จาก dc slice
 * ส่วนผลการเรียน (Team A) และรายชื่อผู้จบ/ข้อมูลนักเรียน (Team B) อ่านอย่างเดียวจากข้อมูลจำลอง (ADR-0001)
 */

import { useMemo, useState } from "react";
import { passesAllCriteria } from "../dc-rules";
import { nowThaiIso } from "../format";
import {
  academicResultStatuses,
  educationDocuments as seedDocuments,
  graduateLists,
} from "../mock-data";
import {
  DOCUMENT_SCOPE_KIND,
  type DocumentCheck,
  type DocumentScope,
  type DocumentType,
  type EducationDocument,
} from "../types";
import type { DcSlice } from "./dc";
import { nextId } from "./ids";
import type { PlatformSlice } from "./platform";

export interface DocumentReadiness {
  checks: DocumentCheck[];
  ready: boolean;
  /** ผู้ใช้ปัจจุบันมีสิทธิ์ออกเอกสารนี้ */
  allowed: boolean;
  /** ข้อความแสดงชื่อเป้าหมาย เช่น ชื่อนักเรียน / "ทั้งห้อง ม.3/1 (8 คน)" */
  target: string;
}

export type GenerateDocumentResult = { ok: true; doc: EducationDocument } | { ok: false; error: string };

export interface DocumentsSlice {
  /** ใหม่สุดก่อน */
  educationDocuments: EducationDocument[];
  documentsOfStudent: (studentId: string) => EducationDocument[];
  /** เงื่อนไขก่อนออกเอกสาร (ภาคเรียนปัจจุบัน) */
  documentReadiness: (docType: DocumentType, scope: DocumentScope) => DocumentReadiness;
  /** ออกเอกสาร: เพิ่มใน education_documents + audit CREATE */
  generateDocument: (docType: DocumentType, scope: DocumentScope) => GenerateDocumentResult;
}

export function useDocumentsSlice(base: PlatformSlice, dc: DcSlice): DocumentsSlice {
  const [educationDocuments, setEducationDocuments] = useState<EducationDocument[]>(seedDocuments);

  return useMemo<DocumentsSlice>(() => {
    const termId = base.currentTerm.termId;
    const user = base.currentUser;
    const isAdmin = user.role === "admin_school";
    const roomName = (roomId: string) => base.classrooms.find((c) => c.roomId === roomId)?.roomName ?? roomId;

    const academicOf = (studentId: string, t = termId) =>
      academicResultStatuses.find((a) => a.studentId === studentId && a.termId === t);

    /** สรุป ปพ.6 ภาคนี้ครบ 8 ด้าน */
    const summaryComplete = (studentId: string) => {
      const s = dc.dcSummaryOf(studentId, termId);
      return !!s && dc.dcCriteria.every((c) => s.levels[c.criteriaId] != null);
    };

    const studentChecks = (docType: DocumentType, studentId: string): DocumentCheck[] => {
      const student = base.getStudent(studentId);
      const academic = academicOf(studentId);
      const summaryCheck: DocumentCheck = {
        label: "ครูประจำชั้นสรุปคุณลักษณะอันพึงประสงค์ (ปพ.6) ของภาคเรียนนี้ครบ 8 ด้านแล้ว",
        ok: summaryComplete(studentId),
        source: "team_c",
        detail: "สรุปได้ที่หน้าคุณลักษณะฯ",
      };
      const registry: DocumentCheck = {
        label: "ข้อมูลนักเรียนและห้องจากงานทะเบียน (สถานะกำลังศึกษา)",
        ok: student?.status === "studying",
        source: "team_b",
      };
      switch (docType) {
        case "ปพ.4":
          return [summaryCheck, registry];
        case "ปพ.6":
          return [
            summaryCheck,
            {
              label: "ผลการเรียนของภาคเรียนนี้ครบทุกรายวิชา",
              ok: !!academic?.gradesComplete,
              source: "team_a",
              detail: "รองานวิชาการบันทึกผลการเรียนให้ครบ",
            },
          ];
        case "ปพ.7":
          return [
            registry,
            {
              label: "มีผลการเรียนของภาคเรียนที่ผ่านมา",
              ok: academicResultStatuses.some((a) => a.studentId === studentId && a.gradesComplete),
              source: "team_a",
            },
          ];
        default:
          return [];
      }
    };

    const roomChecks = (roomId: string): DocumentCheck[] => {
      const roomStudents = dc.studentsOfRoom(roomId);
      const unsummarized = roomStudents.filter((s) => !summaryComplete(s.studentId));
      const notPassing = roomStudents.filter(
        (s) => summaryComplete(s.studentId) && !passesAllCriteria(Object.values(dc.dcSummaryOf(s.studentId, termId)!.levels))
      );
      const academicYear = base.currentTerm.academicYear;
      return [
        {
          label: "สรุปคุณลักษณะอันพึงประสงค์ของภาคเรียนนี้ครบทุกคนในห้อง",
          ok: roomStudents.length > 0 && unsummarized.length === 0,
          source: "team_c",
          detail:
            unsummarized.length > 0
              ? `ยังไม่ได้สรุป ${unsummarized.length} คน`
              : notPassing.length > 0
                ? `ไม่ผ่านเกณฑ์คุณลักษณะ ${notPassing.length} คน — ไม่อยู่ในรายชื่อผู้สำเร็จการศึกษา`
                : undefined,
        },
        {
          label: "งานทะเบียนยืนยันรายชื่อผู้จบการศึกษาแล้ว",
          ok: !!graduateLists.find((g) => g.roomId === roomId && g.academicYear === academicYear)?.confirmed,
          source: "team_b",
        },
        {
          label: "ผลการเรียนครบตามโครงสร้างหลักสูตรทุกคน",
          ok: roomStudents.every((s) => academicOf(s.studentId)?.gradesComplete),
          source: "team_a",
          detail: "รองานวิชาการบันทึกผลการเรียนให้ครบ",
        },
      ];
    };

    const teachingChecks = (teachingId: string): DocumentCheck[] => {
      const t = dc.teachingOf(teachingId);
      if (!t) return [];
      const sub = dc.subjectSubmissionsOf(t.roomId, t.termId).find((s) => s.teachingId === teachingId);
      return [
        {
          label: "ครูประจำวิชาให้คะแนนคุณลักษณะฯ ครบทุกนักเรียนทุกตัวชี้วัด",
          ok: !!sub?.submitted,
          source: "team_c",
          detail: sub ? `ให้คะแนนแล้ว ${sub.filled}/${sub.total} ช่อง` : undefined,
        },
        {
          label: "เวลาเรียนและคะแนนรายวิชา",
          ok: dc.studentsOfRoom(t.roomId).every((s) => academicOf(s.studentId, t.termId)?.attendanceComplete),
          source: "team_a",
        },
      ];
    };

    const targetOf = (scope: DocumentScope): string => {
      switch (scope.kind) {
        case "student":
          return base.getStudent(scope.studentId)?.fullName ?? scope.studentId;
        case "room":
          return `ทั้งห้อง ${roomName(scope.roomId)} (${dc.studentsOfRoom(scope.roomId).length} คน)`;
        case "teaching": {
          const t = dc.teachingOf(scope.teachingId);
          return t ? `${dc.subjectOf(t.subjectId)?.name ?? t.subjectId} ${roomName(t.roomId)}` : scope.teachingId;
        }
      }
    };

    const allowedFor = (docType: DocumentType, scope: DocumentScope): boolean => {
      if (isAdmin) return true;
      if ((docType === "ปพ.4" || docType === "ปพ.6") && scope.kind === "student") return base.isHomeroomOf(scope.studentId);
      if (docType === "ปพ.5" && scope.kind === "teaching") return dc.teachingOf(scope.teachingId)?.teacherId === user.userId;
      // ปพ.3 และ ปพ.7 ออกโดยงานทะเบียน (แอดมิน)
      return false;
    };

    const documentReadiness: DocumentsSlice["documentReadiness"] = (docType, scope) => {
      const checks =
        DOCUMENT_SCOPE_KIND[docType] !== scope.kind
          ? []
          : scope.kind === "student"
            ? studentChecks(docType, scope.studentId)
            : scope.kind === "room"
              ? roomChecks(scope.roomId)
              : teachingChecks(scope.teachingId);
      return {
        checks,
        ready: checks.length > 0 && checks.every((c) => c.ok),
        allowed: allowedFor(docType, scope),
        target: targetOf(scope),
      };
    };

    const generateDocument: DocumentsSlice["generateDocument"] = (docType, scope) => {
      const r = documentReadiness(docType, scope);
      if (!r.allowed) return { ok: false, error: "บทบาทนี้ออกเอกสารนี้ไม่ได้" };
      if (!r.ready) return { ok: false, error: "ข้อมูลยังไม่ครบตามเงื่อนไขของเอกสาร" };
      const teaching = scope.kind === "teaching" ? dc.teachingOf(scope.teachingId) : undefined;
      const doc: EducationDocument = {
        docId: nextId("DOC"),
        docType,
        studentId: scope.kind === "student" ? scope.studentId : null,
        roomId:
          scope.kind === "room"
            ? scope.roomId
            : scope.kind === "student"
              ? (base.getStudent(scope.studentId)?.roomId ?? null)
              : (teaching?.roomId ?? null),
        subjectId: teaching?.subjectId ?? null,
        termId,
        target: r.target,
        generatedBy: user.userId,
        generatedAt: nowThaiIso(),
        fileUrl: null,
      };
      setEducationDocuments((prev) => [doc, ...prev]);
      base.logAudit("CREATE", "education_documents", doc.docId, {
        after: { docType, studentId: doc.studentId, roomId: doc.roomId, subjectId: doc.subjectId, termId },
        note: `${docType} ${r.target}`,
      });
      return { ok: true, doc };
    };

    const sorted = [...educationDocuments].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));

    return {
      educationDocuments: sorted,
      documentsOfStudent: (studentId) => sorted.filter((d) => d.studentId === studentId),
      documentReadiness,
      generateDocument,
    };
  }, [base, dc, educationDocuments]);
}
