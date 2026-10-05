/** Care slice: care case แผนช่วยเหลือ และการติดตามผล */

import { useMemo, useState } from "react";
import { careCases as seedCareCases } from "../mock-data";
import { nowThaiIso } from "../format";
import type { CareCase, CareMethod, SupportType } from "../types";
import type { CoreSlice } from "./core";
import { nextId } from "./ids";

export interface CareSlice {
  careCases: CareCase[];
  caseOf: (studentId: string) => CareCase | undefined;
  openCase: (studentId: string, supportType: SupportType, methods: CareMethod[], goal: string) => CareCase;
  addFollowup: (caseId: string, actionTaken: string, result: string) => void;
  closeCase: (caseId: string) => void;
}

export function useCareSlice(core: CoreSlice): CareSlice {
  const [careCases, setCareCases] = useState<CareCase[]>(seedCareCases);

  return useMemo<CareSlice>(() => {
    const caseOf = (studentId: string) =>
      careCases.find((c) => c.studentId === studentId && c.status === "active") ??
      careCases.find((c) => c.studentId === studentId);

    const openCase: CareSlice["openCase"] = (studentId, supportType, methods, goal) => {
      const record: CareCase = {
        caseId: nextId("CASE"),
        studentId,
        triggerSource: "เปิดโดยครูประจำชั้น",
        status: "active",
        openedAt: nowThaiIso().split("T")[0],
        closedAt: null,
        supportType,
        careMethods: methods,
        goal,
        targetDate: "",
        followups: [],
      };
      setCareCases((prev) => [record, ...prev]);
      return record;
    };

    const addFollowup: CareSlice["addFollowup"] = (caseId, actionTaken, result) => {
      setCareCases((prev) =>
        prev.map((c) =>
          c.caseId === caseId
            ? {
                ...c,
                followups: [
                  {
                    followupId: nextId("FU"),
                    actionTaken,
                    result,
                    followupDate: nowThaiIso().split("T")[0],
                    recordedBy: core.currentUser.userId,
                  },
                  ...c.followups,
                ],
              }
            : c
        )
      );
    };

    const closeCase: CareSlice["closeCase"] = (caseId) => {
      setCareCases((prev) =>
        prev.map((c) =>
          c.caseId === caseId ? { ...c, status: "closed", closedAt: nowThaiIso().split("T")[0] } : c
        )
      );
    };

    return { careCases, caseOf, openCase, addFollowup, closeCase };
  }, [core, careCases]);
}
