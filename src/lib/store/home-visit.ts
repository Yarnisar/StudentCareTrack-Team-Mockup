/**
 * Home-visit slice: นัดหมายและผลการเยี่ยมบ้าน
 *
 * กฎ (CONTEXT.md / data_dictionary.md):
 * - เยี่ยมบ้านประจำปี: นักเรียนทุกคน ปีการศึกษาละ 1 ครั้ง (นัดประจำปีที่ยังไม่ยกเลิกได้ครั้งละ 1 นัด)
 * - เยี่ยมเพิ่ม: ไม่บังคับ อ้างอิง case ด้วย caseId (ถ้ามี)
 * - สร้าง/เลื่อนนัด และบันทึกผล ทำได้เฉพาะในช่วงดำเนินงาน home_visit และเฉพาะครูประจำชั้น/แอดมิน
 * - รับรองโดยครู 1 คน (signedBy/signedAt) หลังรับรองแก้ไม่ได้ · นับว่าเยี่ยมแล้วเมื่อ signedAt ไม่ว่าง
 * - เข้าบ้านไม่ได้: ต้องมีเหตุผล + ภาพคู่ป้ายโรงเรียน นับว่าเยี่ยมแล้วแต่รายงานแยกกลุ่ม
 * - ผู้ปกครองทุกคนของนักเรียนมีสิทธิ์เท่ากันในการยืนยัน/ขอเปลี่ยนนัด
 * - การยกเลิกนัดไม่ลบ — เปลี่ยนสถานะเป็น cancelled พร้อมเหตุผล
 */

import { useMemo, useState } from "react";
import { appointments as seedAppointments, homeVisitRecords as seedRecords } from "../mock-data";
import { nowThaiIso } from "../format";
import { perCapitaIncome, signBlockers } from "../home-visit-form";
import { isGuardianOf } from "../permissions";
import type {
  AnnualVisitStatus,
  AppointmentStatus,
  HomeVisitAppointment,
  HomeVisitRecord,
  HomeVisitRecordInput,
  VisitType,
} from "../types";
import type { PlatformSlice } from "./platform";
import { nextId } from "./ids";

export type HomeVisitResult<T> = { ok: true; value: T } | { ok: false; error: string };

export interface CreateAppointmentInput {
  studentId: string;
  visitType: VisitType;
  /** เยี่ยมเพิ่มที่เป็นผลจาก case (ไม่บังคับ) */
  caseId?: string | null;
  /** วันเวลาแบบพุทธศักราช "2570-02-18T15:30:00" */
  proposedDate: string;
}

export interface HomeVisitSlice {
  appointments: HomeVisitAppointment[];
  homeVisitRecords: HomeVisitRecord[];
  appointmentsOf: (studentId: string) => HomeVisitAppointment[];
  recordOfAppointment: (appointmentId: string) => HomeVisitRecord | undefined;
  /** ผลเยี่ยมที่รับรองแล้วล่าสุดของนักเรียน (ไม่นับนัดที่ระบุ) — ใช้ยกข้อมูลครัวเรือนมากรอก */
  latestSignedVisitOf: (studentId: string, excludeAppointmentId?: string) => HomeVisitRecord | undefined;
  /** นัดประจำปีที่ยังไม่ยกเลิกของปีการศึกษา (ค่าเริ่มต้น = ปีปัจจุบัน) */
  annualAppointmentOf: (studentId: string, academicYear?: number) => HomeVisitAppointment | undefined;
  annualVisitStatusOf: (studentId: string, academicYear?: number) => AnnualVisitStatus;
  /** สร้าง/บันทึกผลได้ไหม (ช่วงดำเนินงาน + สิทธิ์) — คืนเหตุผลถ้าไม่ได้ */
  homeVisitBlockReason: (studentId: string) => string | null;
  createAppointment: (input: CreateAppointmentInput) => HomeVisitResult<HomeVisitAppointment>;
  /** ครูเลื่อนนัด → กลับเป็นรอยืนยัน และแจ้งผู้ปกครองทุกคน */
  rescheduleAppointment: (appointmentId: string, proposedDate: string) => HomeVisitResult<HomeVisitAppointment>;
  cancelAppointment: (appointmentId: string, reason: string) => HomeVisitResult<HomeVisitAppointment>;
  /** ผู้ปกครอง (คนใดก็ได้) ยืนยันหรือขอเปลี่ยนวันเวลา */
  setAppointmentStatus: (
    appointmentId: string,
    status: Extract<AppointmentStatus, "confirmed" | "reschedule_requested">
  ) => HomeVisitResult<HomeVisitAppointment>;
  saveGuardianInfo: (
    appointmentId: string,
    info: { guardianPhone: string; awayStayWith: string; guardianNote: string }
  ) => HomeVisitResult<HomeVisitAppointment>;
  /** บันทึกร่าง (sign = false) หรือรับรอง (sign = true — หลังจากนี้แก้ไม่ได้) */
  saveHomeVisitRecord: (
    appointmentId: string,
    input: HomeVisitRecordInput,
    opts: { sign: boolean }
  ) => HomeVisitResult<HomeVisitRecord>;
}

const fail = (error: string) => ({ ok: false as const, error });

export function useHomeVisitSlice(base: PlatformSlice): HomeVisitSlice {
  const [appointments, setAppointments] = useState<HomeVisitAppointment[]>(seedAppointments);
  const [homeVisitRecords, setRecords] = useState<HomeVisitRecord[]>(seedRecords);

  return useMemo<HomeVisitSlice>(() => {
    const currentYear = base.currentTerm.academicYear;
    const user = base.currentUser;

    const findAppointment = (id: string) => appointments.find((a) => a.appointmentId === id);
    const recordOfAppointment = (id: string) => homeVisitRecords.find((r) => r.appointmentId === id);
    const appointmentsOf = (studentId: string) =>
      appointments
        .filter((a) => a.studentId === studentId)
        .sort((a, b) => b.proposedDate.localeCompare(a.proposedDate));

    const latestSignedVisitOf: HomeVisitSlice["latestSignedVisitOf"] = (studentId, exclude) =>
      homeVisitRecords
        .filter((r) => r.studentId === studentId && r.signedAt && r.appointmentId !== exclude)
        .sort((a, b) => (b.signedAt ?? "").localeCompare(a.signedAt ?? ""))[0];

    const annualAppointmentOf: HomeVisitSlice["annualAppointmentOf"] = (studentId, year = currentYear) =>
      appointments.find(
        (a) =>
          a.studentId === studentId &&
          a.academicYear === year &&
          a.visitType === "annual" &&
          a.status !== "cancelled"
      );

    const annualVisitStatusOf: HomeVisitSlice["annualVisitStatusOf"] = (studentId, year = currentYear) => {
      const appt = annualAppointmentOf(studentId, year);
      if (!appt) return "none";
      const record = recordOfAppointment(appt.appointmentId);
      if (record?.signedAt) return record.cannotAccessHome ? "visited_inaccessible" : "visited";
      return record ? "draft" : "scheduled";
    };

    const homeVisitBlockReason: HomeVisitSlice["homeVisitBlockReason"] = (studentId) => {
      if (!base.canEdit(studentId)) return "เฉพาะครูประจำชั้นของนักเรียนและแอดมินเท่านั้น";
      if (!base.isWindowOpen("home_visit")) return "อยู่นอกช่วงดำเนินงานการเยี่ยมบ้าน";
      return null;
    };

    const replaceAppointment = (next: HomeVisitAppointment) =>
      setAppointments((prev) => prev.map((a) => (a.appointmentId === next.appointmentId ? next : a)));

    const createAppointment: HomeVisitSlice["createAppointment"] = (input) => {
      const block = homeVisitBlockReason(input.studentId);
      if (block) return fail(block);
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(input.proposedDate)) return fail("ระบุวันและเวลานัดหมาย");
      if (input.proposedDate.localeCompare(nowThaiIso()) < 0) return fail("วันนัดหมายต้องไม่ย้อนหลัง");
      if (input.visitType === "annual" && annualAppointmentOf(input.studentId)) {
        return fail("นักเรียนคนนี้มีนัดเยี่ยมบ้านประจำปีของปีการศึกษานี้แล้ว (ปีละ 1 ครั้ง)");
      }
      const appointment: HomeVisitAppointment = {
        appointmentId: nextId("HV"),
        studentId: input.studentId,
        teacherId: user.userId,
        academicYear: currentYear,
        visitType: input.visitType,
        caseId: input.visitType === "follow_up" ? (input.caseId ?? null) : null,
        proposedDate: input.proposedDate,
        status: "pending",
      };
      setAppointments((prev) => [appointment, ...prev]);
      base.logAudit("CREATE", "home_visit_appointments", appointment.appointmentId, {
        after: {
          studentId: appointment.studentId,
          visitType: appointment.visitType,
          caseId: appointment.caseId,
          proposedDate: appointment.proposedDate,
        },
      });
      base.notify("visit_scheduled", base.recipientsOf(input.studentId, ["guardians"]), input.studentId, {
        date: input.proposedDate,
      });
      return { ok: true, value: appointment };
    };

    const rescheduleAppointment: HomeVisitSlice["rescheduleAppointment"] = (id, proposedDate) => {
      const existing = findAppointment(id);
      if (!existing) return fail("ไม่พบนัดหมาย");
      const block = homeVisitBlockReason(existing.studentId);
      if (block) return fail(block);
      if (existing.status === "completed" || existing.status === "cancelled")
        return fail("นัดหมายนี้ปิดแล้ว เลื่อนไม่ได้");
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(proposedDate)) return fail("ระบุวันและเวลานัดหมาย");
      if (proposedDate.localeCompare(nowThaiIso()) < 0) return fail("วันนัดหมายต้องไม่ย้อนหลัง");
      const next: HomeVisitAppointment = { ...existing, proposedDate, status: "pending" };
      replaceAppointment(next);
      base.logAudit("UPDATE", "home_visit_appointments", id, {
        before: { proposedDate: existing.proposedDate, status: existing.status },
        after: { proposedDate, status: "pending" },
      });
      base.notify("visit_rescheduled", base.recipientsOf(existing.studentId, ["guardians"]), existing.studentId, {
        date: proposedDate,
      });
      return { ok: true, value: next };
    };

    const cancelAppointment: HomeVisitSlice["cancelAppointment"] = (id, reason) => {
      const existing = findAppointment(id);
      if (!existing) return fail("ไม่พบนัดหมาย");
      if (!base.canEdit(existing.studentId)) return fail("เฉพาะครูประจำชั้นของนักเรียนและแอดมินเท่านั้น");
      if (existing.status === "completed" || existing.status === "cancelled")
        return fail("นัดหมายนี้ปิดแล้ว");
      if (recordOfAppointment(id)?.signedAt) return fail("ผลการเยี่ยมบ้านรับรองแล้ว ยกเลิกนัดไม่ได้");
      if (!reason.trim()) return fail("ระบุเหตุผลการยกเลิก");
      const next: HomeVisitAppointment = { ...existing, status: "cancelled", cancelReason: reason.trim() };
      replaceAppointment(next);
      base.logAudit("VOID", "home_visit_appointments", id, {
        before: { status: existing.status },
        after: { status: "cancelled" },
        reason: reason.trim(),
      });
      return { ok: true, value: next };
    };

    const canRespondAsGuardianOrStaff = (studentId: string) =>
      isGuardianOf(base.permissionContext, user, studentId) || base.canEdit(studentId);

    const setAppointmentStatus: HomeVisitSlice["setAppointmentStatus"] = (id, status) => {
      const existing = findAppointment(id);
      if (!existing) return fail("ไม่พบนัดหมาย");
      if (!canRespondAsGuardianOrStaff(existing.studentId)) return fail("ไม่มีสิทธิ์ตอบนัดหมายนี้");
      if (existing.status === "completed" || existing.status === "cancelled")
        return fail("นัดหมายนี้ปิดแล้ว");
      if (existing.status === status) return { ok: true, value: existing };
      const next: HomeVisitAppointment = { ...existing, status };
      replaceAppointment(next);
      base.logAudit("UPDATE", "home_visit_appointments", id, {
        before: { status: existing.status },
        after: { status },
      });
      // ผู้ปกครองขอเปลี่ยนวันเวลา → แจ้งครูผู้นัดและครูประจำชั้น
      if (status === "reschedule_requested") {
        base.notify(
          "visit_rescheduled",
          [...new Set([existing.teacherId, ...base.recipientsOf(existing.studentId, ["homeroom"])])],
          existing.studentId
        );
      }
      return { ok: true, value: next };
    };

    const saveGuardianInfo: HomeVisitSlice["saveGuardianInfo"] = (id, info) => {
      const existing = findAppointment(id);
      if (!existing) return fail("ไม่พบนัดหมาย");
      if (!canRespondAsGuardianOrStaff(existing.studentId)) return fail("ไม่มีสิทธิ์แก้ข้อมูลนัดหมายนี้");
      // ไม่เก็บค่าในรายละเอียด audit (เบอร์โทรเป็นข้อมูลอ่อนไหว) — บันทึกเฉพาะชื่อฟิลด์
      base.logAudit("UPDATE", "home_visit_appointments", id, {
        note: "ผู้ปกครองกรอกข้อมูลก่อนเยี่ยมบ้าน",
        after: { fields: Object.keys(info) },
      });
      const next = { ...existing, ...info };
      replaceAppointment(next);
      return { ok: true, value: next };
    };

    const saveHomeVisitRecord: HomeVisitSlice["saveHomeVisitRecord"] = (appointmentId, input, { sign }) => {
      const appt = findAppointment(appointmentId);
      if (!appt) return fail("ไม่พบนัดหมาย");
      const block = homeVisitBlockReason(appt.studentId);
      if (block) return fail(block);
      if (appt.status === "cancelled") return fail("นัดหมายนี้ถูกยกเลิกแล้ว");
      if (appt.status === "pending" || appt.status === "reschedule_requested")
        return fail("รอผู้ปกครองยืนยันนัดหมายก่อนจึงจะบันทึกผลได้");
      const existing = recordOfAppointment(appointmentId);
      if (existing?.signedAt) return fail("ผลการเยี่ยมบ้านรับรองแล้ว แก้ไขไม่ได้");
      if (sign) {
        const issues = signBlockers(input);
        if (issues.length > 0) return fail(`ยังรับรองไม่ได้: ${issues.join(" · ")}`);
      }
      const now = nowThaiIso();
      const km = Number(input.form.travelKm);
      const record: HomeVisitRecord = {
        ...input,
        cannotAccessReason: input.cannotAccessHome ? input.cannotAccessReason.trim() : "",
        recordId: existing?.recordId ?? nextId("HVR"),
        appointmentId,
        studentId: appt.studentId,
        householdIncomeAvg: perCapitaIncome(input.form.members),
        travelDistanceKm: input.form.travelKm && Number.isFinite(km) ? km : null,
        recordedBy: user.userId,
        updatedAt: now,
        signedBy: sign ? user.userId : null,
        signedAt: sign ? now : null,
      };
      setRecords((prev) =>
        existing ? prev.map((r) => (r.recordId === record.recordId ? record : r)) : [record, ...prev]
      );
      // ไม่ใส่คำตอบในแบบฟอร์มลง audit (ข้อมูลอ่อนไหว) — บันทึกเฉพาะสถานะ
      base.logAudit(existing ? "UPDATE" : "CREATE", "home_visit_records", record.recordId, {
        after: {
          appointmentId,
          status: sign ? "signed" : "draft",
          cannotAccessHome: record.cannotAccessHome,
          photos: record.photos.map((p) => p.photoType),
        },
        note: sign ? "รับรองผลการเยี่ยมบ้าน (แก้ไขไม่ได้หลังจากนี้)" : "บันทึกร่าง",
      });
      if (sign && appt.status !== "completed") {
        replaceAppointment({ ...appt, status: "completed" });
        base.logAudit("UPDATE", "home_visit_appointments", appointmentId, {
          before: { status: appt.status },
          after: { status: "completed" },
        });
      }
      return { ok: true, value: record };
    };

    return {
      appointments,
      homeVisitRecords,
      appointmentsOf,
      recordOfAppointment,
      latestSignedVisitOf,
      annualAppointmentOf,
      annualVisitStatusOf,
      homeVisitBlockReason,
      createAppointment,
      rescheduleAppointment,
      cancelAppointment,
      setAppointmentStatus,
      saveGuardianInfo,
      saveHomeVisitRecord,
    };
  }, [base, appointments, homeVisitRecords]);
}
