/** Assessment slice: Red Flag, 9S, SDQ (ADR-0002) */

import { useMemo, useState } from "react";
import {
  nineSAssessments as seedNineS,
  redFlagAssessments as seedRedFlags,
  sdqAssessments as seedSdq,
  studentUserId,
} from "../mock-data";
import { evaluateNineS, evaluateRedFlag, scoreSdq } from "../rules";
import { nowThaiIso } from "../format";
import type {
  AssessmentOutcome,
  NineSAssessment,
  RedFlagAssessment,
  SdqAssessment,
  SdqRater,
} from "../types";
import type { PlatformSlice } from "./platform";
import { nextId } from "./ids";

export interface AssessmentSlice {
  redFlags: RedFlagAssessment[];
  nineS: NineSAssessment[];
  sdq: SdqAssessment[];
  sdqOf: (studentId: string) => SdqAssessment[];
  saveRedFlag: (studentId: string, answers: Record<string, boolean>) => AssessmentOutcome;
  saveNineS: (studentId: string, answers: Record<string, 0 | 1 | 2>) => AssessmentOutcome;
  saveSdq: (studentId: string, rater: SdqRater, answers: Record<number, 0 | 1 | 2>) => SdqAssessment;
  /** เปิดแบบ SDQ ทั้ง 3 ฉบับ (ครู / นักเรียน / ผู้ปกครอง) ที่ยังไม่มี */
  openSdqSet: (studentId: string) => void;
}

const RATERS: SdqRater[] = ["teacher", "student", "parent"];

export function useAssessmentSlice(base: PlatformSlice): AssessmentSlice {
  const [redFlags, setRedFlags] = useState<RedFlagAssessment[]>(seedRedFlags);
  const [nineS, setNineS] = useState<NineSAssessment[]>(seedNineS);
  const [sdq, setSdq] = useState<SdqAssessment[]>(seedSdq);

  return useMemo<AssessmentSlice>(() => {
    const termId = base.currentTerm.termId;

    const blankSdq = (studentId: string, rater: SdqRater): SdqAssessment => ({
      id: nextId("SDQ"),
      studentId,
      termId,
      round: 1,
      rater,
      raterUserId: null,
      answers: {},
      totalDifficulties: null,
      scaleScores: null,
      level: null,
      status: "pending",
      assessedAt: null,
    });

    /** userId ของผู้ส่งแบบ SDQ ฉบับนี้ */
    const raterUserIdFor = (studentId: string, rater: SdqRater): string | null => {
      const user = base.currentUser;
      if (rater === "student") return studentUserId(studentId);
      if (rater === "parent") {
        if (user.role === "parent") return user.userId;
        return base.guardiansOf(studentId)[0]?.user.userId ?? null;
      }
      return user.userId;
    };

    const sdqOf = (studentId: string) => sdq.filter((s) => s.studentId === studentId);

    const openSdqSet = (studentId: string) => {
      if (!base.getStudent(studentId)) return;
      const existing = new Set(
        sdq.filter((s) => s.studentId === studentId && s.round === 1).map((s) => s.rater)
      );
      const created = RATERS.filter((r) => !existing.has(r)).map((r) => blankSdq(studentId, r));
      if (created.length === 0) return;
      setSdq((prev) => [...prev, ...created]);
      for (const form of created) {
        base.logAudit("CREATE", "sdq_assessments", form.id, { after: { studentId, rater: form.rater, round: form.round } });
      }
      // ขอให้ผู้ปกครองทุกคน (ฉบับผู้ปกครอง) และนักเรียน (ฉบับประเมินตนเอง) ทำแบบประเมิน
      const recipients = [
        ...(created.some((f) => f.rater === "parent") ? base.recipientsOf(studentId, ["guardians"]) : []),
        ...(created.some((f) => f.rater === "student") ? [studentUserId(studentId)] : []),
      ];
      base.notify("sdq_requested", recipients, studentId);
    };

    const saveRedFlag: AssessmentSlice["saveRedFlag"] = (studentId, answers) => {
      const result = evaluateRedFlag(answers);
      const record: RedFlagAssessment = {
        id: nextId("RF"),
        studentId,
        termId,
        answers,
        result,
        assessedBy: base.currentUser.userId,
        assessedAt: nowThaiIso(),
      };
      setRedFlags((prev) => [record, ...prev]);
      base.logAudit("CREATE", "red_flag_assessments", record.id, { after: { studentId, termId, result } });
      if (result === "needs_care") openSdqSet(studentId);
      return result;
    };

    const saveNineS: AssessmentSlice["saveNineS"] = (studentId, answers) => {
      const { clusterScores, clusterResults, result } = evaluateNineS(answers);
      const record: NineSAssessment = {
        id: nextId("NS"),
        studentId,
        termId,
        clusterScores,
        clusterResults,
        result,
        assessedBy: base.currentUser.userId,
        assessedAt: nowThaiIso(),
      };
      setNineS((prev) => [record, ...prev]);
      base.logAudit("CREATE", "nine_s_assessments", record.id, { after: { studentId, termId, result } });
      if (result === "needs_care") openSdqSet(studentId);
      return result;
    };

    const saveSdq: AssessmentSlice["saveSdq"] = (studentId, rater, answers) => {
      const { scaleScores, totalDifficulties, level } = scoreSdq(answers);
      const idx = sdq.findIndex((s) => s.studentId === studentId && s.rater === rater && s.round === 1);
      const form = idx >= 0 ? sdq[idx] : blankSdq(studentId, rater);
      const updated: SdqAssessment = {
        ...form,
        raterUserId: raterUserIdFor(studentId, rater),
        answers,
        scaleScores,
        totalDifficulties,
        level,
        status: "completed",
        assessedAt: nowThaiIso(),
      };
      base.logAudit(idx >= 0 ? "UPDATE" : "CREATE", "sdq_assessments", updated.id, {
        ...(idx >= 0 ? { before: { status: form.status, level: form.level } } : {}),
        after: { studentId, rater, status: updated.status, level },
      });
      setSdq((prev) => {
        const i = prev.findIndex((s) => s.id === updated.id);
        if (i < 0) return [...prev, updated];
        const copy = [...prev];
        copy[i] = updated;
        return copy;
      });
      return updated;
    };

    return { redFlags, nineS, sdq, sdqOf, saveRedFlag, saveNineS, saveSdq, openSdqSet };
  }, [base, redFlags, nineS, sdq]);
}
