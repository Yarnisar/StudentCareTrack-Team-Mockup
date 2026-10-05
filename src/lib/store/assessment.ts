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
import type { CoreSlice } from "./core";
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

export function useAssessmentSlice(core: CoreSlice): AssessmentSlice {
  const [redFlags, setRedFlags] = useState<RedFlagAssessment[]>(seedRedFlags);
  const [nineS, setNineS] = useState<NineSAssessment[]>(seedNineS);
  const [sdq, setSdq] = useState<SdqAssessment[]>(seedSdq);

  return useMemo<AssessmentSlice>(() => {
    const termId = core.currentTerm.termId;

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
      const user = core.currentUser;
      if (rater === "student") return studentUserId(studentId);
      if (rater === "parent") {
        if (user.role === "parent") return user.userId;
        return core.guardiansOf(studentId)[0]?.user.userId ?? null;
      }
      return user.userId;
    };

    const sdqOf = (studentId: string) => sdq.filter((s) => s.studentId === studentId);

    const openSdqSet = (studentId: string) => {
      if (!core.getStudent(studentId)) return;
      setSdq((prev) => {
        const existing = new Set(
          prev.filter((s) => s.studentId === studentId && s.round === 1).map((s) => s.rater)
        );
        const created = RATERS.filter((r) => !existing.has(r)).map((r) => blankSdq(studentId, r));
        return [...prev, ...created];
      });
    };

    const saveRedFlag: AssessmentSlice["saveRedFlag"] = (studentId, answers) => {
      const result = evaluateRedFlag(answers);
      const record: RedFlagAssessment = {
        id: nextId("RF"),
        studentId,
        termId,
        answers,
        result,
        assessedBy: core.currentUser.userId,
        assessedAt: nowThaiIso(),
      };
      setRedFlags((prev) => [record, ...prev]);
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
        assessedBy: core.currentUser.userId,
        assessedAt: nowThaiIso(),
      };
      setNineS((prev) => [record, ...prev]);
      if (result === "needs_care") openSdqSet(studentId);
      return result;
    };

    const saveSdq: AssessmentSlice["saveSdq"] = (studentId, rater, answers) => {
      const { scaleScores, totalDifficulties, level } = scoreSdq(answers);
      const idx = sdq.findIndex((s) => s.studentId === studentId && s.rater === rater && s.round === 1);
      const base = idx >= 0 ? sdq[idx] : blankSdq(studentId, rater);
      const updated: SdqAssessment = {
        ...base,
        raterUserId: raterUserIdFor(studentId, rater),
        answers,
        scaleScores,
        totalDifficulties,
        level,
        status: "completed",
        assessedAt: nowThaiIso(),
      };
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
  }, [core, redFlags, nineS, sdq]);
}
