/**
 * ข้อมูลตัวอย่าง: แบบประเมินสุขภาพจิต (Red Flag / 9S / SDQ)
 *
 * ภาคเรียนที่ 1/2569: ทุกคนทำ Red Flag → 9S ยกเว้น 30171 (ยังไม่เคยประเมิน → ต้องทำในภาคเรียนที่ 2)
 *   ควรดูแลจาก 9S: 30125, 30118, 30140, 30152 → SDQ ครั้งที่ 1
 * ภาคเรียนที่ 2/2569 (SDQ ครั้งที่ 2):
 *   30125 เปิดแล้ว ครู+นักเรียนส่งแล้ว รอผู้ปกครอง · 30118 เปิดแล้ว รอทุกฉบับ
 *   30152 เปิดแล้ว นักเรียนส่งแล้ว รอฉบับครู · 30140 ยังไม่เปิด
 *   30131 / 30160 / 30183 ปกติ → ไม่ต้องทำ (เว้นแต่เปิด sdq2_for_normal_students)
 */

import { evaluateNineS, RED_FLAG_QUESTIONS, scoreSdq, SDQ_QUESTIONS } from "../rules";
import type { NineSAssessment, RedFlagAssessment, SdqAssessment, SdqRater } from "../types";
import { CURRENT_TERM, PREVIOUS_TERM, USER, studentUserId } from "./core";

const SEM1 = PREVIOUS_TERM.termId;
const SEM2 = CURRENT_TERM.termId;

const redFlag = (studentId: string, assessedAt: string, assessedBy: string = USER.somying): RedFlagAssessment => ({
  id: `RF-${SEM1}-${studentId}`,
  studentId,
  termId: SEM1,
  answers: Object.fromEntries(RED_FLAG_QUESTIONS.map((q) => [q.id, false])),
  result: "normal",
  assessedBy,
  assessedAt,
});

export const redFlagAssessments: RedFlagAssessment[] = [
  redFlag("30125", "2569-06-10T10:00:00"),
  redFlag("30118", "2569-06-10T10:20:00"),
  redFlag("30131", "2569-06-11T09:30:00"),
  redFlag("30140", "2569-06-11T10:00:00", USER.theerapong),
  redFlag("30152", "2569-06-12T09:30:00"),
  redFlag("30160", "2569-06-12T10:00:00", USER.theerapong),
  redFlag("30183", "2569-06-13T09:30:00"),
];

const nineS = (
  studentId: string,
  answers: Record<string, 0 | 1 | 2>,
  assessedAt: string,
  assessedBy: string = USER.somying
): NineSAssessment => {
  const { clusterScores, clusterResults, result } = evaluateNineS(answers);
  return { id: `NS-${SEM1}-${studentId}`, studentId, termId: SEM1, clusterScores, clusterResults, result, assessedBy, assessedAt };
};

export const nineSAssessments: NineSAssessment[] = [
  nineS("30125", { s4: 2, s5: 2, s8: 1 }, "2569-06-10T10:10:00"),
  nineS("30118", { s7: 1, s9: 2, s2: 1 }, "2569-06-10T10:30:00"),
  nineS("30131", { s1: 1, s3: 1 }, "2569-06-11T09:40:00"),
  nineS("30140", { s8: 2, s7: 1, s5: 1 }, "2569-06-11T10:10:00", USER.theerapong),
  nineS("30152", { s1: 1, s2: 1, s3: 1 }, "2569-06-12T09:40:00"),
  nineS("30160", { s5: 1 }, "2569-06-12T10:10:00", USER.theerapong),
  nineS("30183", { s6: 1, s8: 1 }, "2569-06-13T09:40:00"),
];

/** คำตอบตัวอย่างที่ได้คะแนนรวมพฤติกรรมที่เป็นปัญหาตามที่กำหนด */
function answersForTotal(total: number): Record<number, 0 | 1 | 2> {
  let remaining = total;
  const answers: Record<number, 0 | 1 | 2> = {};
  for (const q of SDQ_QUESTIONS) {
    if (q.scale === "prosocial") {
      answers[q.no] = total >= 20 ? 1 : 2;
      continue;
    }
    const scored = Math.min(2, remaining) as 0 | 1 | 2;
    remaining -= scored;
    answers[q.no] = q.reverse ? ((2 - scored) as 0 | 1 | 2) : scored;
  }
  return answers;
}

const RATER_CODE: Record<SdqRater, string> = { teacher: "T", student: "S", parent: "P" };

function sdq(
  studentId: string,
  termId: string,
  rater: SdqRater,
  requestedAt: string,
  submitted: { by: string; at: string; total: number } | null
): SdqAssessment {
  const round = termId === SEM1 ? 1 : 2;
  const base = {
    id: `SDQ-${termId}-${studentId}-${RATER_CODE[rater]}`,
    studentId,
    termId,
    round,
    rater,
    requestedAt,
  } as const;
  if (!submitted) {
    return {
      ...base,
      raterUserId: null,
      answers: {},
      totalDifficulties: null,
      scaleScores: null,
      level: null,
      status: "pending",
      submittedAt: null,
    };
  }
  const answers = answersForTotal(submitted.total);
  const { scaleScores, totalDifficulties, level } = scoreSdq(answers, rater);
  return {
    ...base,
    raterUserId: submitted.by,
    answers,
    totalDifficulties,
    scaleScores,
    level,
    status: "submitted",
    submittedAt: submitted.at,
  };
}

const S = studentUserId;

export const sdqAssessments: SdqAssessment[] = [
  // ---------------- ครั้งที่ 1 (ภาคเรียนที่ 1/2569) ----------------
  sdq("30125", SEM1, "teacher", "2569-06-10T10:10:00", { by: USER.somying, at: "2569-07-03T14:00:00", total: 16 }),
  sdq("30125", SEM1, "student", "2569-06-10T10:10:00", { by: S("30125"), at: "2569-07-04T10:15:00", total: 13 }),
  sdq("30125", SEM1, "parent", "2569-06-10T10:10:00", { by: USER.ratana, at: "2569-07-06T19:40:00", total: 12 }),

  sdq("30118", SEM1, "teacher", "2569-06-10T10:30:00", { by: USER.somying, at: "2569-07-03T14:30:00", total: 17 }),
  sdq("30118", SEM1, "student", "2569-06-10T10:30:00", { by: S("30118"), at: "2569-07-05T09:00:00", total: 14 }),
  sdq("30118", SEM1, "parent", "2569-06-10T10:30:00", { by: "U-G03", at: "2569-07-08T20:10:00", total: 10 }),

  // 30140 ฉบับครูมีปัญหา → ผล SDQ รวมมีปัญหา (เพิ่มเป็นเหตุใน CASE-2569-008) — ใช้สาธิต "ดูคำตอบรายข้อ"
  sdq("30140", SEM1, "teacher", "2569-06-11T10:10:00", { by: USER.theerapong, at: "2569-07-08T11:00:00", total: 21 }),
  sdq("30140", SEM1, "student", "2569-06-11T10:10:00", { by: S("30140"), at: "2569-07-09T10:00:00", total: 17 }),
  sdq("30140", SEM1, "parent", "2569-06-11T10:10:00", { by: "U-G05", at: "2569-07-10T18:30:00", total: 11 }),

  sdq("30152", SEM1, "teacher", "2569-06-12T09:40:00", { by: USER.somying, at: "2569-07-04T15:00:00", total: 9 }),
  sdq("30152", SEM1, "student", "2569-06-12T09:40:00", { by: S("30152"), at: "2569-07-05T10:00:00", total: 11 }),
  sdq("30152", SEM1, "parent", "2569-06-12T09:40:00", { by: "U-G06", at: "2569-07-07T19:00:00", total: 8 }),

  // ---------------- ครั้งที่ 2 (ภาคเรียนที่ 2/2569) ----------------
  sdq("30125", SEM2, "teacher", "2570-02-09T08:30:00", { by: USER.somying, at: "2570-02-13T14:00:00", total: 12 }),
  sdq("30125", SEM2, "student", "2570-02-09T08:30:00", { by: S("30125"), at: "2570-02-14T10:20:00", total: 13 }),
  sdq("30125", SEM2, "parent", "2570-02-09T08:30:00", null),

  sdq("30118", SEM2, "teacher", "2570-02-09T08:35:00", null),
  sdq("30118", SEM2, "student", "2570-02-09T08:35:00", null),
  sdq("30118", SEM2, "parent", "2570-02-09T08:35:00", null),

  sdq("30152", SEM2, "teacher", "2570-02-10T09:00:00", null),
  sdq("30152", SEM2, "student", "2570-02-10T09:00:00", { by: S("30152"), at: "2570-02-12T10:00:00", total: 10 }),
  sdq("30152", SEM2, "parent", "2570-02-10T09:00:00", null),
];
