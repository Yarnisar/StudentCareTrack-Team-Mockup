/**
 * Imports slice: นำเข้านักเรียน/ห้องเรียน/ผู้ปกครอง/ครู/ภาคเรียนจากไฟล์ (ADR-0005, โหมดเดี่ยวเท่านั้น)
 *
 * เป็นเขตแดนเดียวที่เขียนตารางอ้างอิงของ core (เหมือน assignments.ts กับตารางมอบหมายครู — ADR-0003)
 * ตรวจ (previewImport) ไม่เขียนอะไร · ยืนยัน (commitImport) เขียนเฉพาะแถวที่ผ่าน ไม่ลบแถวใด
 * โหมดเชื่อมระบบ: commitImport ปฏิเสธเสมอ (ข้อมูลเป็นของทีม B)
 * import_jobs เก็บเฉพาะจำนวน · audit เก็บเฉพาะจำนวนกับสถานะที่เปลี่ยน (ไม่มีเลขบัตร ที่อยู่ รหัสผ่าน)
 * รหัสผ่านชั่วคราวส่งกลับครั้งเดียวในผลลัพธ์ ไม่เก็บใน state
 */

import { useMemo, useState } from "react";
import { INTEGRATED_READ_ONLY_MESSAGE, isStandalone } from "../deployment-mode";
import { nowThaiIso } from "../format";
import type { CsvTable } from "../imports/csv";
import { applyPlan, planImport, type ImportPlan, type NewAccount, type RefSnapshot } from "../imports/engine";
import { IMPORT_KIND_LABEL, type ImportJob, type ImportKind } from "../types";
import { nextId, nextSeq } from "./ids";
import type { PlatformSlice } from "./platform";

export interface ImportCommitSummary {
  job: ImportJob;
  /** บัญชีที่สร้างใหม่ — tempPassword แสดงครั้งเดียว ผู้เรียกต้องไม่เก็บต่อ */
  accounts: NewAccount[];
  statusChanges: number;
}

export type ImportCommitResult = ({ ok: true } & ImportCommitSummary) | { ok: false; error: string };

export interface ImportsSlice {
  /** ใหม่สุดก่อน — ไม่ลบ */
  importJobs: ImportJob[];
  /** ตรวจไฟล์ ไม่เขียนข้อมูล */
  previewImport: (kind: ImportKind, table: CsvTable) => ImportPlan;
  /** ยืนยันเขียน (ตรวจซ้ำกับข้อมูลปัจจุบันก่อนเขียนเสมอ) */
  commitImport: (kind: ImportKind, filename: string, table: CsvTable) => ImportCommitResult;
}

export function useImportsSlice(base: PlatformSlice): ImportsSlice {
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);

  return useMemo<ImportsSlice>(() => {
    const snapshot = (): RefSnapshot => ({
      students: base.students,
      users: base.users,
      classrooms: base.classrooms,
      guardians: base.studentGuardians,
      enrollments: base.enrollments,
      terms: base.terms,
      currentYear: base.currentTerm.academicYear,
    });

    const previewImport: ImportsSlice["previewImport"] = (kind, table) => planImport(kind, table, snapshot());

    const commitImport: ImportsSlice["commitImport"] = (kind, filename, table) => {
      if (!isStandalone) return { ok: false, error: INTEGRATED_READ_ONLY_MESSAGE };
      if (base.currentUser.role !== "admin_school") return { ok: false, error: "เฉพาะผู้ดูแลระบบเท่านั้นที่นำเข้าข้อมูลได้" };

      const ref = snapshot();
      const plan = planImport(kind, table, ref);
      if (plan.fileError) return { ok: false, error: plan.fileError };
      const writable = plan.counts.create + plan.counts.update;
      if (writable === 0) return { ok: false, error: "ไม่มีแถวที่ต้องเขียน" };

      const result = applyPlan(plan, ref, { roomId: () => nextId("R"), guardianSeq: nextSeq });
      const t = base.referenceTables;
      const { next } = result;
      if (next.students !== ref.students) t.setStudents(next.students);
      if (next.users !== ref.users) t.setUsers(next.users);
      if (next.classrooms !== ref.classrooms) t.setClassrooms(next.classrooms);
      if (next.guardians !== ref.guardians) t.setStudentGuardians(next.guardians);
      if (next.enrollments !== ref.enrollments) t.setEnrollments(next.enrollments);
      if (next.terms !== ref.terms) t.setTerms(next.terms);

      const now = nowThaiIso();
      const job: ImportJob = {
        jobId: nextId("IJ"),
        kind,
        filename,
        uploadedBy: base.currentUser.userId,
        uploadedAt: now,
        status: "committed",
        totalRows: plan.counts.total,
        validRows: writable + plan.counts.unchanged,
        invalidRows: plan.counts.invalid,
        createdRows: plan.counts.create,
        updatedRows: plan.counts.update,
        unchangedRows: plan.counts.unchanged,
        committedBy: base.currentUser.userId,
        committedAt: now,
      };
      setImportJobs((prev) => [job, ...prev]);

      // audit: เฉพาะจำนวน (ไม่มีข้อมูลรายบุคคล) + UPDATE รายแถวเมื่อสถานะเปลี่ยน
      base.logAudit("CREATE", "import_jobs", job.jobId, {
        note: `นำเข้า${IMPORT_KIND_LABEL[kind]}: สร้าง ${job.createdRows} · อัปเดต ${job.updatedRows} · ข้าม ${job.unchangedRows + job.invalidRows}`,
        after: {
          kind,
          filename,
          totalRows: job.totalRows,
          createdRows: job.createdRows,
          updatedRows: job.updatedRows,
          unchangedRows: job.unchangedRows,
          invalidRows: job.invalidRows,
        },
      });
      for (const c of result.statusChanges) {
        base.logAudit("UPDATE", c.entityType, c.entityId, {
          before: c.before,
          after: c.after,
          note: `เปลี่ยนสถานะจากการนำเข้า ${job.jobId}`,
        });
      }

      return { ok: true, job, accounts: result.accounts, statusChanges: result.statusChanges.length };
    };

    return { importJobs, previewImport, commitImport };
  }, [base, importJobs]);
}
