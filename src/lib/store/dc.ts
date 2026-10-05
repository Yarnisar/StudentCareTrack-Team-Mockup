/** Characteristics slice: คะแนนรายวิชา (ปพ.5) และสรุปคุณลักษณะอันพึงประสงค์ (ปพ.6) */

import { useMemo, useState } from "react";
import { dcCriteria, dcSummaries as seedSummaries, subjectSubmissions as seedSubmissions } from "../mock-data";
import type { DcCriteria, DcSummary, SubjectSubmission } from "../types";
import type { CoreSlice } from "./core";

export interface DcSlice {
  dcCriteria: DcCriteria[];
  dcSummaries: DcSummary[];
  subjectSubmissions: SubjectSubmission[];
  dcSummaryOf: (studentId: string) => DcSummary | undefined;
}

export function useDcSlice(core: CoreSlice): DcSlice {
  const [dcSummaries] = useState<DcSummary[]>(seedSummaries);
  const [subjectSubmissions] = useState<SubjectSubmission[]>(seedSubmissions);

  return useMemo<DcSlice>(() => {
    void core;
    return {
      dcCriteria,
      dcSummaries,
      subjectSubmissions,
      dcSummaryOf: (studentId) => dcSummaries.find((d) => d.studentId === studentId),
    };
  }, [core, dcSummaries, subjectSubmissions]);
}
