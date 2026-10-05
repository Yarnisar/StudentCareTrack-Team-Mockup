/**
 * Consent slice: guardian_consents — UNIQUE (studentId, academicYear)
 *
 * ผู้ปกครองคนใดก็ได้ของนักเรียนตอบได้ ปีการศึกษาละ 1 ครั้ง (คำตอบแรกมีผล)
 * ไม่มีแถว = ยังไม่ได้ความยินยอม → คัดกรองได้ แต่ส่งต่อข้อมูลให้หน่วยงานภายนอกไม่ได้
 */

import { useMemo, useState } from "react";
import { guardianConsents as seedConsents } from "../mock-data";
import { nowThaiIso } from "../format";
import * as perm from "../permissions";
import type { GuardianConsent } from "../types";
import type { AuditSlice } from "./audit";
import type { CoreSlice } from "./core";
import { nextId } from "./ids";

export type ConsentStatus = "granted" | "declined" | "none";

export type RecordConsentResult =
  | { ok: true; consent: GuardianConsent }
  | { ok: false; error: string; consent?: GuardianConsent };

export interface ConsentSlice {
  guardianConsents: GuardianConsent[];
  /** แถวความยินยอมของปีการศึกษา (ค่าเริ่มต้น = ปีปัจจุบัน) หรือ undefined ถ้ายังไม่มีผู้ปกครองตอบ */
  consentOf: (studentId: string, academicYear?: number) => GuardianConsent | undefined;
  consentStatusOf: (studentId: string, academicYear?: number) => ConsentStatus;
  /** ส่งต่อข้อมูลให้หน่วยงานภายนอกได้หรือไม่ (ต้องมีความยินยอมปีนี้) */
  canReferExternally: (studentId: string) => boolean;
  /** currentUser ต้องเป็นผู้ปกครองของนักเรียน และปีนี้ยังไม่มีใครตอบ */
  recordConsent: (studentId: string, granted: boolean) => RecordConsentResult;
}

export function useConsentSlice(core: CoreSlice, audit: AuditSlice): ConsentSlice {
  const [guardianConsents, setGuardianConsents] = useState<GuardianConsent[]>(seedConsents);

  return useMemo<ConsentSlice>(() => {
    const currentYear = core.currentTerm.academicYear;

    const consentOf: ConsentSlice["consentOf"] = (studentId, academicYear = currentYear) =>
      guardianConsents.find((c) => c.studentId === studentId && c.academicYear === academicYear);

    const consentStatusOf: ConsentSlice["consentStatusOf"] = (studentId, academicYear) => {
      const c = consentOf(studentId, academicYear);
      if (!c) return "none";
      return c.granted ? "granted" : "declined";
    };

    const recordConsent: ConsentSlice["recordConsent"] = (studentId, granted) => {
      const user = core.currentUser;
      if (!perm.isGuardianOf(core.permissionContext, user, studentId))
        return { ok: false, error: "เฉพาะผู้ปกครองของนักเรียนคนนี้เท่านั้นที่ให้ความยินยอมได้" };
      const existing = consentOf(studentId);
      if (existing)
        return { ok: false, error: "ปีการศึกษานี้มีผู้ปกครองตอบความยินยอมแล้ว", consent: existing };
      const consent: GuardianConsent = {
        consentId: nextId("GC"),
        studentId,
        guardianUserId: user.userId,
        academicYear: currentYear,
        granted,
        respondedAt: nowThaiIso(),
      };
      setGuardianConsents((prev) => [...prev, consent]);
      audit.logAudit("CREATE", "guardian_consents", consent.consentId, {
        after: { studentId, academicYear: currentYear, granted },
      });
      return { ok: true, consent };
    };

    return {
      guardianConsents,
      consentOf,
      consentStatusOf,
      canReferExternally: (studentId) => consentStatusOf(studentId) === "granted",
      recordConsent,
    };
  }, [core, audit, guardianConsents]);
}
