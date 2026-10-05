/** Characteristics slice: คะแนนรายวิชา (ปพ.5) และสรุปคุณลักษณะอันพึงประสงค์ (ปพ.6) */

import { useMemo, useState } from "react";
import { dcCriteria, dcSummaries as seedSummaries, subjectSubmissions as seedSubmissions } from "../mock-data";
import type { DcCriteria, DcSummary, SubjectSubmission } from "../types";
import type { PlatformSlice } from "./platform";

export interface DcSlice {
  dcCriteria: DcCriteria[];
  dcSummaries: DcSummary[];
  subjectSubmissions: SubjectSubmission[];
  dcSummaryOf: (studentId: string) => DcSummary | undefined;
  /** แจ้งครูประจำวิชาที่ยังไม่ส่ง ปพ.5 (dc_scores_requested) คืนจำนวนผู้รับ */
  requestPendingDcScores: () => number;
}

export function useDcSlice(base: PlatformSlice): DcSlice {
  const [dcSummaries] = useState<DcSummary[]>(seedSummaries);
  const [subjectSubmissions] = useState<SubjectSubmission[]>(seedSubmissions);

  return useMemo<DcSlice>(() => {
    const requestPendingDcScores = () =>
      subjectSubmissions
        .filter((s) => !s.submitted)
        .reduce(
          (sum, s) => sum + base.notify("dc_scores_requested", [s.teacherId], null, { subjectName: s.subject }).length,
          0
        );

    return {
      requestPendingDcScores,
      dcCriteria,
      dcSummaries,
      subjectSubmissions,
      dcSummaryOf: (studentId) => dcSummaries.find((d) => d.studentId === studentId),
    };
  }, [base, dcSummaries, subjectSubmissions]);
}
