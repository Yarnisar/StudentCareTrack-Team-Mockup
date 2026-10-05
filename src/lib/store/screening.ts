/** Screening slice: การคัดกรอง 6 มิติ */

import { useMemo, useState } from "react";
import { screenings as seedScreenings } from "../mock-data";
import { classifyDimension } from "../rules";
import { nowThaiIso } from "../format";
import { DIMENSION_ORDER, type RiskGroup, type Screening, type ScreeningDimension } from "../types";
import type { PlatformSlice } from "./platform";
import { nextId } from "./ids";

export interface ScreeningSlice {
  screenings: Screening[];
  latestScreening: (studentId: string) => Screening | undefined;
  overallRiskOf: (studentId: string) => RiskGroup | null;
  saveScreening: (studentId: string, checked: Record<ScreeningDimension, string[]>) => Screening;
}

export function useScreeningSlice(base: PlatformSlice): ScreeningSlice {
  const [screenings, setScreenings] = useState<Screening[]>(seedScreenings);

  return useMemo<ScreeningSlice>(() => {
    const latestScreening = (studentId: string) =>
      screenings
        .filter((s) => s.studentId === studentId)
        .sort((a, b) => b.screenedAt.localeCompare(a.screenedAt))[0];

    const overallRiskOf = (studentId: string): RiskGroup | null => {
      const sc = latestScreening(studentId);
      if (!sc) return null;
      const groups = sc.results.map((r) => r.group);
      if (groups.includes("red")) return "red";
      if (groups.includes("amber")) return "amber";
      return "green";
    };

    const saveScreening: ScreeningSlice["saveScreening"] = (studentId, checked) => {
      const termId = base.currentTerm.termId;
      const record: Screening = {
        screeningId: nextId("SC"),
        studentId,
        termId,
        screenedBy: base.currentUser.userId,
        screenedAt: nowThaiIso().split("T")[0],
        results: DIMENSION_ORDER.map((dimension) => ({
          dimension,
          group: classifyDimension(dimension, checked[dimension] ?? []),
          checkedItemIds: checked[dimension] ?? [],
        })),
      };
      const previous = screenings.find((s) => s.studentId === studentId && s.termId === termId);
      base.logAudit(previous ? "UPDATE" : "CREATE", "screenings", record.screeningId, {
        ...(previous ? { before: { screeningId: previous.screeningId, results: previous.results } } : {}),
        after: { studentId, termId, results: record.results },
      });
      // ภาคเรียนละ 1 ครั้ง: แทนที่เฉพาะของภาคเรียนนี้ ประวัติภาคเรียนก่อนยังอยู่
      setScreenings((prev) => [
        record,
        ...prev.filter((s) => !(s.studentId === studentId && s.termId === termId)),
      ]);
      return record;
    };

    return { screenings, latestScreening, overallRiskOf, saveScreening };
  }, [base, screenings]);
}
