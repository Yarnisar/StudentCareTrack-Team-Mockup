/** ข้อมูลตัวอย่าง: แบบประเมินสุขภาพจิต (Red Flag / 9S / SDQ / EQ) */

import type { NineSAssessment, RedFlagAssessment, SdqAssessment } from "../types";
import { CURRENT_TERM, USER, studentUserId } from "./core";

export const redFlagAssessments: RedFlagAssessment[] = [];

export const nineSAssessments: NineSAssessment[] = [];

export const sdqAssessments: SdqAssessment[] = [
  {
    id: "SDQ-001",
    studentId: "30125",
    termId: CURRENT_TERM.termId,
    round: 1,
    rater: "teacher",
    raterUserId: USER.somying,
    answers: {},
    totalDifficulties: 16,
    scaleScores: { emotional: 6, conduct: 3, hyperactivity: 4, peer: 3, prosocial: 7 },
    level: "risk",
    status: "completed",
    assessedAt: "2570-02-13",
  },
  {
    id: "SDQ-002",
    studentId: "30125",
    termId: CURRENT_TERM.termId,
    round: 1,
    rater: "student",
    raterUserId: studentUserId("30125"),
    answers: {},
    totalDifficulties: 13,
    scaleScores: { emotional: 5, conduct: 2, hyperactivity: 4, peer: 2, prosocial: 8 },
    level: "normal",
    status: "completed",
    assessedAt: "2570-02-14",
  },
  {
    id: "SDQ-003",
    studentId: "30125",
    termId: CURRENT_TERM.termId,
    round: 1,
    rater: "parent",
    raterUserId: null,
    answers: {},
    totalDifficulties: null,
    scaleScores: null,
    level: null,
    status: "pending",
    assessedAt: null,
  },
  {
    id: "SDQ-004",
    studentId: "30118",
    termId: CURRENT_TERM.termId,
    round: 1,
    rater: "teacher",
    raterUserId: USER.somying,
    answers: {},
    totalDifficulties: 21,
    scaleScores: { emotional: 5, conduct: 6, hyperactivity: 7, peer: 3, prosocial: 5 },
    level: "problem",
    status: "completed",
    assessedAt: "2570-02-13",
  },
];
