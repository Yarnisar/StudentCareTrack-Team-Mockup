/**
 * ข้อมูลตัวอย่างของนักเรียนที่สร้างเพิ่มให้ ม.3/1 ครบ 38 คน (ทุกโมดูล)
 *
 * - pure + กำหนดผลได้: ตัวสุ่ม mulberry32 ตรึง seed, ไม่ใช้ Math.random, ไม่อ่านนาฬิกา
 *   (ทุกวันที่คิดจาก DEMO_TODAY) รันครั้งเดียวตอนโหลดโมดูล แล้วแต่ละไฟล์ใน mock-data นำไปต่อท้ายข้อมูลเดิม
 * - นักเรียน 8 คนเขียนมือ (30125 ... 30183) ไม่ถูกแตะ — ไฟล์นี้สร้างเฉพาะส่วนที่เพิ่ม
 * - ใช้กฎเดียวกับ lib/rules.ts: รายการอัตโนมัติ (mt3/mt4/bh1) มาจากผล Red Flag/9S และจำนวนมาสายที่ยืนยันแล้วจริง
 *   ผลรายมิติใช้ classifyDimension, ผล SDQ ใช้ scoreSdq, เหตุเปิด case ใช้เกณฑ์ care-rules
 *
 * บทบาทของนักเรียนแต่ละคน (scenario) และสัดส่วนทั้งห้องกำหนดใน generated-roster.ts
 * ผลคัดกรองรวมของ 38 คน (เฉพาะที่รับรองแล้ว 30 คน): ปกติ 16 / เสี่ยง 9 / มีปัญหา 5
 */

import { addDaysThai, isBusinessDayThai } from "../format";
import {
  DIMENSION_ORDER,
  type BehaviorRecord,
  type CareCase,
  type CareCaseTrigger,
  type CarePlan,
  type CareFollowup,
  type CaseSuggestion,
  type CheckinLog,
  type DimensionResult,
  type HomeVisitAppointment,
  type HomeVisitRecord,
  type NineSAssessment,
  type RedFlagAssessment,
  type ReferralDocument,
  type RiskGroup,
  type Screening,
  type ScreeningDimension,
  type ScreeningResult,
  type SdqAssessment,
  type SdqRater,
} from "../types";
import {
  classifyDimension,
  derivedItemIds,
  evaluateNineS,
  evaluateRedFlag,
  isMentalPending,
  NINE_S_QUESTIONS,
  RED_FLAG_QUESTIONS,
  scoreSdq,
  SCREENING_ITEMS,
  SDQ_QUESTIONS,
  sdqSetRef,
} from "../rules";
import {
  DEPENDENCY_OPTIONS,
  emptyHomeVisitForm,
  INFORMANT_OPTIONS,
  perCapitaIncome,
} from "../home-visit-form";
import { CURRENT_TERM, DEMO_TODAY, generatedRoster, PREVIOUS_TERM, SYSTEM_USER_ID, USER, studentUserId, users } from "./core";
import type { GenProfile, Scenario } from "./generated-roster";
import { hashText, Rng } from "./prng";

/* ------------------------------------------------------------------ */
/* ตัวช่วยวันเวลา (พ.ศ.) — ทุกค่าคิดจาก DEMO_TODAY ไม่อ่านนาฬิกา          */
/* ------------------------------------------------------------------ */

const SEM1 = PREVIOUS_TERM.termId; // T2569-1
const SEM2 = CURRENT_TERM.termId; // T2569-2
const LATE_ALERT_THRESHOLD = 5; // ตรงกับ initialSchoolSettings.lateAlertThreshold

const pad = (n: number, w = 3) => String(n).padStart(w, "0");
const day = (offset: number) => addDaysThai(DEMO_TODAY, offset);
const at = (date: string, hh: number, mm = 0, ss = 0) => `${date}T${pad(hh, 2)}:${pad(mm, 2)}:${pad(ss, 2)}`;

function businessDays(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDaysThai(d, 1)) if (isBusinessDayThai(d)) out.push(d);
  return out;
}

const rngFor = (salt: string) => new Rng(hashText(`sct-class-38:${salt}`));

const PROFILES = generatedRoster.profiles;
const guardianNameOf = (userId: string) => users.find((u) => u.userId === userId)?.name ?? "";
const guardianPhoneOf = (userId: string) => users.find((u) => u.userId === userId)?.phone ?? null;

const is = (p: GenProfile, ...scenarios: Scenario[]) => scenarios.includes(p.scenario);

/* ------------------------------------------------------------------ */
/* ข้อเท็จจริงรายคน: Red Flag / 9S ภาคเรียนที่ 1                          */
/* ------------------------------------------------------------------ */

type Outcome = "normal" | "needs_care";

interface Facts {
  redFlag: Outcome | null;
  nineS: Outcome | null;
  /** จำนวนมาสายที่ยืนยันแล้วในเดือน ก.พ. 2570 */
  confirmedLate: number;
}

const NINE_S_NEEDS_CARE: Scenario[] = ["red_welfare", "amber_sdq_case", "amber_9s", "draft_9s"];

function factsOf(p: GenProfile): Facts {
  if (is(p, "none_new")) return { redFlag: null, nineS: null, confirmedLate: 0 };
  if (is(p, "red_mental")) return { redFlag: "needs_care", nineS: null, confirmedLate: 0 };
  return {
    redFlag: "normal",
    nineS: NINE_S_NEEDS_CARE.includes(p.scenario) ? "needs_care" : "normal",
    confirmedLate: is(p, "amber_late") ? 5 : 0,
  };
}

/* ------------------------------------------------------------------ */
/* Red Flag / 9S                                                       */
/* ------------------------------------------------------------------ */

const assessDates = businessDays("2569-06-09", "2569-06-19");

export const generatedRedFlags: RedFlagAssessment[] = [];
export const generatedNineS: NineSAssessment[] = [];

/** วันที่ทำ Red Flag/9S ภาคเรียนที่ 1 ของนักเรียน (ใช้ต่อกับ SDQ ครั้งที่ 1) */
const assessedAtOf = new Map<string, string>();

{
  const rng = rngFor("assess");
  for (const p of PROFILES) {
    const facts = factsOf(p);
    if (facts.redFlag === null) continue;
    const date = rng.pick(assessDates);
    const hh = rng.int(9, 11);
    const mm = rng.int(0, 40);
    const assessedAt = at(date, hh, mm);
    assessedAtOf.set(p.studentId, assessedAt);
    const answers = Object.fromEntries(RED_FLAG_QUESTIONS.map((q) => [q.id, q.id === "rf1" && facts.redFlag === "needs_care"]));
    generatedRedFlags.push({
      id: `RF-${SEM1}-${p.studentId}`,
      studentId: p.studentId,
      termId: SEM1,
      answers,
      result: evaluateRedFlag(answers),
      assessedBy: p.teacherId,
      assessedAt,
    });
    if (facts.nineS === null) continue;
    let nine: Record<string, 0 | 1 | 2> = {};
    if (facts.nineS === "needs_care") {
      nine = rng.pick<Record<string, 0 | 1 | 2>>([
        { s4: 2, s5: 1 },
        { s1: 2, s3: 1 },
        { s7: 1, s9: 2 },
        { s5: 2, s6: 1, s8: 1 },
      ]);
    } else {
      for (const q of NINE_S_QUESTIONS) if (rng.chance(0.14)) nine[q.id] = 1;
      if (evaluateNineS(nine).result === "needs_care") nine = {};
    }
    const { clusterScores, clusterResults, result } = evaluateNineS(nine);
    generatedNineS.push({
      id: `NS-${SEM1}-${p.studentId}`,
      studentId: p.studentId,
      termId: SEM1,
      clusterScores,
      clusterResults,
      result,
      assessedBy: p.teacherId,
      assessedAt: at(date, hh, mm + 10),
    });
  }
}

/* ------------------------------------------------------------------ */
/* SDQ ครั้งที่ 1 (ภาคเรียนที่ 1) และครั้งที่ 2 (ภาคเรียนที่ 2)            */
/* ------------------------------------------------------------------ */

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

type Submitted = { by: string; at: string; total: number } | null;

function sdqForm(
  studentId: string,
  termId: string,
  rater: SdqRater,
  requestedAt: string,
  submitted: Submitted
): SdqAssessment {
  const base = {
    id: `SDQ-${termId}-${studentId}-${RATER_CODE[rater]}`,
    studentId,
    termId,
    round: termId === SEM1 ? (1 as const) : (2 as const),
    rater,
    requestedAt,
  };
  if (!submitted) {
    return { ...base, raterUserId: null, answers: {}, totalDifficulties: null, scaleScores: null, level: null, status: "pending", submittedAt: null };
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

/** ผลของแต่ละบทบาทที่ต้องทำ SDQ: คะแนนรวมรายฉบับ (ครู / นักเรียน / ผู้ปกครอง) ของแต่ละรอบ; null = ยังไม่ส่ง; "closed" = ยังไม่เปิดแบบประเมิน */
type SdqPlan = { teacher: number | null; student: number | null; parent: number | null } | "closed";

const SDQ_SCRIPT: Partial<Record<Scenario, { r1: SdqPlan; r2: SdqPlan }>> = {
  // รอบ 1: ฉบับครู "มีปัญหา" (เพิ่มเป็นเหตุใน case) · รอบ 2: ครูส่งแล้ว (เสี่ยง) นักเรียน/ผู้ปกครองยังไม่ส่ง
  red_mental: { r1: { teacher: 21, student: 17, parent: 12 }, r2: { teacher: 18, student: null, parent: null } },
  red_welfare: { r1: { teacher: 18, student: 15, parent: 13 }, r2: "closed" },
  // รอบ 2 ครบทั้ง 3 ฉบับ ฉบับครูมีปัญหา → ผลรวมมีปัญหา เปิด case อัตโนมัติ
  amber_sdq_case: { r1: { teacher: 14, student: 15, parent: 11 }, r2: { teacher: 22, student: 18, parent: 13 } },
  // รอบ 2 ครูและนักเรียนส่งแล้ว รอผู้ปกครอง
  amber_9s: { r1: { teacher: 17, student: 12, parent: 14 }, r2: { teacher: 11, student: 12, parent: null } },
  draft_9s: { r1: { teacher: 15, student: 12, parent: 10 }, r2: { teacher: null, student: null, parent: null } },
};

export const generatedSdq: SdqAssessment[] = [];
/** รหัสชุด SDQ ที่ผลรวมเป็น "มีปัญหา" / "เสี่ยง" — ใช้เป็นเหตุใน care case */
export const sdqCombinedLevel = new Map<string, "normal" | "risk" | "problem">();

{
  const rng = rngFor("sdq");
  for (const p of PROFILES) {
    const script = SDQ_SCRIPT[p.scenario];
    if (!script) continue;
    const parent = p.guardianUserId;
    for (const round of [1, 2] as const) {
      const plan = round === 1 ? script.r1 : script.r2;
      if (plan === "closed") continue;
      const termId = round === 1 ? SEM1 : SEM2;
      const requestedAt =
        round === 1
          ? addMinutes(assessedAtOf.get(p.studentId)!, 10)
          : at(day(-rng.int(5, 7)), 8, rng.int(20, 50));
      const when = (i: number) =>
        round === 1
          ? at(addDaysThai("2569-07-02", rng.int(0, 8) + i), rng.int(9, 19), rng.int(0, 59))
          : at(addDaysThai(requestedAt, rng.int(1, 2) + i), rng.int(9, 19), rng.int(0, 59));
      const forms: SdqAssessment[] = (["teacher", "student", "parent"] as const).map((rater, i) => {
        const total = plan[rater];
        const by = rater === "teacher" ? p.teacherId : rater === "student" ? studentUserId(p.studentId) : parent;
        return sdqForm(p.studentId, termId, rater, requestedAt, total === null ? null : { by, at: when(i), total });
      });
      generatedSdq.push(...forms);
      // ผลรวมเมื่อฉบับครูส่งแล้ว = ระดับที่รุนแรงที่สุดของฉบับที่ส่งแล้ว
      const submitted = forms.filter((f) => f.status === "submitted");
      if (submitted.some((f) => f.rater === "teacher")) {
        const order = ["normal", "risk", "problem"] as const;
        const worst = submitted.reduce<(typeof order)[number]>(
          (acc, f) => (order.indexOf(f.level!) > order.indexOf(acc) ? f.level! : acc),
          "normal"
        );
        sdqCombinedLevel.set(sdqSetRef(p.studentId, termId, round), worst);
      }
    }
  }
}

function addMinutes(iso: string, minutes: number): string {
  const [date, time] = iso.split("T");
  const [h, m, s] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return at(date, Math.floor(total / 60) % 24, total % 60, s);
}

/* ------------------------------------------------------------------ */
/* การคัดกรอง 6 มิติ ภาคเรียนที่ 2/2569                                   */
/* ------------------------------------------------------------------ */

/** รายการที่ครูติ๊กเอง (ไม่รวมรายการอัตโนมัติ — เติมจากข้อเท็จจริงด้านบน) */
const CHECKED_ITEMS: Partial<Record<Scenario, string[]>> = {
  red_mental: ["mt1", "ac3"],
  red_welfare: ["wf3", "wf1", "ec2"],
  red_behavior: ["bh3", "bh2", "ac2"],
  amber_sdq_case: ["mt2"],
  amber_9s: ["mt2"],
  amber_economic_case: ["ec1", "ec2"],
  amber_physical: ["ph1", "ph2"],
  amber_academic_case: ["ac1", "ac2", "ec2"],
  amber_late: ["bh2"],
  draft_9s: ["mt2"],
  draft_econ: ["ec2", "ec1"],
  draft_acad: ["ac3"],
};

const DRAFT: Scenario[] = ["draft_9s", "draft_econ", "draft_acad"];
const NO_SCREENING: Scenario[] = ["none_assessed", "none_new"];

const derivedSet = new Set(SCREENING_ITEMS.filter((i) => i.derived).map((i) => i.id));
const dimensionOfItem = (id: string) => SCREENING_ITEMS.find((i) => i.id === id)?.dimension;

export const generatedScreenings: Screening[] = [];
/** รหัสการคัดกรองภาคเรียนปัจจุบันของนักเรียน + ผลที่คำนวณ (ใช้เปิด case / คำแนะนำ) */
const screeningInfo = new Map<string, { id: string; certifiedAt: string | null; computed: DimensionResult[]; screening: Screening }>();

{
  const rng = rngFor("screening");
  const days = businessDays("2570-02-02", "2570-02-13");
  let seq = 6; // SC-001..006 ใช้แล้ว
  for (const p of PROFILES) {
    if (is(p, ...NO_SCREENING)) continue;
    const facts = factsOf(p);
    const screeningId = `SC-${pad(++seq)}`;
    const date = rng.pick(days);
    const screenedAt = at(date, rng.int(9, 15), rng.int(0, 59));
    const certified = !is(p, ...DRAFT);
    const derived = derivedItemIds({
      redFlag: facts.redFlag,
      nineS: facts.nineS,
      confirmedLateCount: facts.confirmedLate,
      lateAlertThreshold: LATE_ALERT_THRESHOLD,
    });
    const checked = CHECKED_ITEMS[p.scenario] ?? [];
    const pending = isMentalPending({ redFlag: facts.redFlag, nineS: facts.nineS });
    const results: ScreeningResult[] = DIMENSION_ORDER.map((dimension: ScreeningDimension) => {
      const checkedHere = checked.filter((id) => dimensionOfItem(id) === dimension && !derivedSet.has(id));
      const derivedHere = derived.filter((id) => dimensionOfItem(id) === dimension);
      const computed: DimensionResult =
        dimension === "mental" && pending ? "pending" : classifyDimension(dimension, [...checkedHere, ...derivedHere]);
      // ครูปรับผลได้ ±1 ระดับพร้อมเหตุผล — ตัวอย่างเดียว: รับทุนแล้ว เศรษฐกิจกลับเป็นปกติ
      const adjust: { to: RiskGroup; reason: string } | null =
        p.scenario === "amber_academic_case" && dimension === "economic"
          ? { to: "green", reason: "ได้รับทุนเสมอภาคและอุปกรณ์การเรียนจากโรงเรียนแล้ว" }
          : null;
      return {
        resultId: `${screeningId}-${dimension}`,
        dimension,
        computedGroup: computed,
        teacherGroup: adjust?.to ?? null,
        adjustReason: adjust?.reason ?? null,
        group: adjust?.to ?? computed,
        checkedItemIds: checkedHere,
        derivedItemIds: derivedHere,
      };
    });
    const screening: Screening = {
      screeningId,
      studentId: p.studentId,
      termId: SEM2,
      screenedBy: p.teacherId,
      screenedAt,
      status: certified ? "certified" : "draft",
      certifiedBy: certified ? p.teacherId : null,
      certifiedAt: certified ? `${date}T15:30:00` : null,
      unlock: null,
      results,
    };
    generatedScreenings.push(screening);
    screeningInfo.set(p.studentId, {
      id: screeningId,
      certifiedAt: screening.certifiedAt,
      computed: results.map((r) => r.computedGroup),
      screening,
    });
  }
}

/* ------------------------------------------------------------------ */
/* ความประพฤติและเช็คอิน                                                */
/* ------------------------------------------------------------------ */

const RULE_DELTA: Record<string, number> = {
  "BR-01": -2,
  "BR-02": -1,
  "BR-03": -3,
  "BR-04": -3,
  "BR-05": -10,
  "BR-06": 5,
  "BR-07": 3,
};

const SUBJECT_TEACHERS: [subject: string, teacher: string][] = [
  ["คณิตศาสตร์", USER.wichai],
  ["ภาษาไทย", USER.wimon],
  ["วิทยาศาสตร์", USER.napa],
  ["สังคมศึกษา", USER.prayong],
  ["ภาษาอังกฤษ", USER.anna],
];
const OTHER_TEACHERS = [USER.somchaiK, USER.malee, USER.arun];

const DRESS = ["ไม่สวมเสื้อนักเรียนตามระเบียบ", "ทรงผมไม่ถูกระเบียบ", "ไม่สวมถุงเท้าและรองเท้าตามระเบียบ", "ไม่ติดป้ายชื่อบนเสื้อนักเรียน"];
const FIGHT = ["ทะเลาะวิวาทกับเพื่อนช่วงพักกลางวัน", "ทะเลาะวิวาทหน้าโรงอาหาร", "มีปากเสียงและชกต่อยกับเพื่อนต่างห้อง"];
const GOOD_SCHOOL = ["ช่วยจัดสถานที่กิจกรรมวันวิชาการ", "เป็นตัวแทนห้องแข่งกีฬาสี", "ร่วมกิจกรรมจิตอาสาพัฒนาโรงเรียน"];
const GOOD_PEOPLE = ["ช่วยครูยกอุปกรณ์การสอน", "ช่วยติวหนังสือให้เพื่อนก่อนสอบ", "เก็บของมีค่าได้และนำส่งครู"];

const lateText = (scannedAt: string) => `บันทึกอัตโนมัติจากการสแกน QR เวลา ${scannedAt.slice(11, 16)} น.`;

export const generatedBehaviorRecords: BehaviorRecord[] = [];
export const generatedCheckinLogs: CheckinLog[] = [];

{
  const rng = rngFor("behavior");
  let bhSeq = 30; // BH-001..030 ใช้แล้ว
  let ciSeq = 11; // CI-001..011 ใช้แล้ว
  const checkinDays = new Set<string>();
  const checkinKey = (id: string, date: string) => `${id}|${date}`;

  const year = businessDays("2569-06-01", "2570-02-13");
  const febDays = businessDays("2570-02-02", "2570-02-13");
  const todayBiz = DEMO_TODAY;

  const addCheckin = (studentId: string, scannedAt: string, isLate: boolean, scannedBy: string): string => {
    const logId = `CI-${pad(++ciSeq)}`;
    checkinDays.add(checkinKey(studentId, scannedAt.slice(0, 10)));
    generatedCheckinLogs.push({
      logId,
      studentId,
      checkinDate: scannedAt.slice(0, 10),
      scannedAt,
      isLate,
      scannedBy,
    });
    return logId;
  };

  const addLate = (
    p: GenProfile,
    scannedAt: string,
    decision?: { status: "confirmed" | "excused"; by: string; at: string; reason?: string }
  ) => {
    const checkinLogId = addCheckin(p.studentId, scannedAt, true, p.teacherId);
    generatedBehaviorRecords.push({
      recordId: `BH-${pad(++bhSeq)}`,
      studentId: p.studentId,
      ruleId: "BR-01",
      description: lateText(scannedAt),
      occurredAt: scannedAt,
      recordedBy: SYSTEM_USER_ID,
      source: "qr_checkin",
      checkinLogId,
      status: decision?.status ?? "pending",
      decidedBy: decision?.by ?? null,
      decidedAt: decision?.at ?? null,
      decisionReason: decision?.reason ?? null,
      voidReason: null,
      createdAt: scannedAt,
    });
  };

  const addManual = (p: GenProfile, ruleId: string, description: string, occurredAt: string, recordedBy: string) => {
    generatedBehaviorRecords.push({
      recordId: `BH-${pad(++bhSeq)}`,
      studentId: p.studentId,
      ruleId,
      description,
      occurredAt,
      recordedBy,
      source: "manual",
      checkinLogId: null,
      status: "confirmed",
      decidedBy: recordedBy,
      decidedAt: occurredAt,
      decisionReason: null,
      voidReason: null,
      createdAt: occurredAt,
    });
  };

  const lateTime = () => ({ hh: 7, mm: rng.int(34, 58) });

  for (const p of PROFILES) {
    // ---- มาสาย (เฉพาะเดือน ก.พ. 2570 ที่ครูเห็นและนับ) ----
    let lateDeficit = 0;
    if (is(p, "amber_late")) {
      // 5 ครั้งที่ยืนยันแล้ว (ถึงเกณฑ์ bh1): ยืนยันโดยครู 4 ครั้ง + ระบบยืนยันให้เองหลังครบ 3 วันทำการ 1 ครั้ง
      const dates = ["2570-02-02", "2570-02-04", "2570-02-06", "2570-02-09", "2570-02-11"];
      dates.forEach((date, i) => {
        const t = lateTime();
        const scannedAt = at(date, t.hh, t.mm);
        if (date === "2570-02-09") addLate(p, scannedAt); // ไม่มีครูกด → ยืนยันอัตโนมัติ 02-12
        else
          addLate(p, scannedAt, {
            status: "confirmed",
            by: i % 2 === 0 ? USER.somying : USER.theerapong,
            at: at(date, 8, 30 + i),
          });
      });
      lateDeficit = 10;
    } else if (is(p, "green_pending_late")) {
      // ใช้ลำดับของนักเรียนกลุ่มนี้: 2 คนแรกสายวันนี้ คนที่ 3 สายวันศุกร์ที่ 12
      const group = PROFILES.filter((q) => q.scenario === "green_pending_late");
      const date = group.indexOf(p) < 2 ? todayBiz : "2570-02-12";
      const t = { hh: 7, mm: rng.int(35, 59) };
      addLate(p, at(date, t.hh, t.mm));
    } else if (!is(p, "red_behavior") && rng.chance(0.22)) {
      const date = rng.pick(febDays);
      const t = lateTime();
      const scannedAt = at(date, t.hh, t.mm);
      if (rng.chance(0.25) && !checkinDays.has(checkinKey(p.studentId, date))) {
        addLate(p, scannedAt, {
          status: "excused",
          by: p.teacherId,
          at: at(date, 8, 20),
          reason: rng.pick(["ผู้ปกครองแจ้งว่ารถโดยสารประจำทางขัดข้อง", "ฝนตกหนักและน้ำท่วมขังระหว่างเดินทาง", "พาไปพบแพทย์ตอนเช้า มีใบรับรอง"]),
        });
      } else if (!checkinDays.has(checkinKey(p.studentId, date))) {
        addLate(p, scannedAt, { status: "confirmed", by: p.teacherId, at: at(date, 8, 40) });
        lateDeficit = 2;
      }
    }

    // ---- บันทึกความประพฤติที่ครูบันทึกเอง: ให้คะแนนปีนี้ได้ตามเป้า (ปัดตามมาสายที่ยืนยันแล้ว) ----
    const target = Math.min(p.scoreTarget, 100 - lateDeficit);
    let positives = 0;
    if (rng.chance(0.35) && target <= 100) {
      const n = rng.int(1, 2);
      for (let i = 0; i < n; i++) {
        const people = rng.chance(0.5);
        const ruleId = people ? "BR-07" : "BR-06";
        positives += RULE_DELTA[ruleId];
        addManual(p, ruleId, rng.pick(people ? GOOD_PEOPLE : GOOD_SCHOOL), at(rng.pick(year), rng.int(9, 15), rng.int(0, 59)), p.teacherId);
      }
    }
    // ติดลบที่ต้องสะสม = 100 - เป้า + คะแนนความดีที่ได้ไปแล้ว (คะแนนสูงสุด 100 ไม่ปัดระหว่างทาง)
    let deficit = Math.max(0, 100 - target - lateDeficit + positives);
    const negatives: string[] = [];
    if (is(p, "red_behavior")) {
      // พฤติกรรม "มีปัญหา" (bh3): ทะเลาะวิวาทอย่างน้อย 2 ครั้ง
      for (let i = 0; i < 2 && deficit >= 10; i++) {
        negatives.push("BR-05");
        deficit -= 10;
      }
    }
    while (deficit >= 3) {
      negatives.push(rng.chance(0.5) ? "BR-03" : "BR-04");
      deficit -= 3;
    }
    while (deficit > 0) {
      negatives.push("BR-02");
      deficit -= 1;
    }
    const used = new Set<string>();
    negatives.forEach((ruleId, i) => {
      let date = rng.pick(year);
      while (used.has(date)) date = rng.pick(year);
      used.add(date);
      const subj = rng.pick(SUBJECT_TEACHERS);
      const teacher = ruleId === "BR-02" || ruleId === "BR-05" ? rng.pick([...OTHER_TEACHERS, p.teacherId]) : subj[1];
      const text =
        ruleId === "BR-03"
          ? `ไม่ส่งการบ้านวิชา${subj[0]}`
          : ruleId === "BR-04"
            ? `ใช้โทรศัพท์ระหว่างเรียนวิชา${subj[0]}`
            : ruleId === "BR-05"
              ? FIGHT[i % FIGHT.length]
              : rng.pick(DRESS);
      addManual(p, ruleId, text, at(date, rng.int(8, 15), rng.int(0, 59)), teacher);
    });

    // ---- เช็คอินวันนี้ (นักเรียนที่ไม่ขาด และไม่ใช่รายสายวันนี้ซึ่งสร้างไปแล้ว) ----
    if (!p.absentToday && !checkinDays.has(checkinKey(p.studentId, DEMO_TODAY))) {
      addCheckin(p.studentId, at(DEMO_TODAY, 7, rng.int(2, 29), rng.int(0, 59)), false, USER.somying);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Care case                                                           */
/* ------------------------------------------------------------------ */

export const generatedCareCases: CareCase[] = [];
export const generatedCaseSuggestions: CaseSuggestion[] = [];
const generatedReferrals: ReferralDocument[] = [];
/** นักเรียนที่ระบบเปิด case ให้เอง (openedBy = null) — ใช้ส่งการแจ้งเตือนตัวอย่าง */
export const autoOpenedCases: { caseId: string; studentId: string; openedAt: string }[] = [];

{
  const rng = rngFor("care");
  let trgSeq = 29; // TRG-2570-014..024, 2569-008/009 ใช้แล้ว
  let fuSeq = 20; // FU-001..010 ใช้แล้ว
  let sugSeq = 2;
  const trig = (
    caseId: string,
    source: CareCaseTrigger["source"],
    sourceRefId: string | null,
    detectedAt: string,
    planId: string | null,
    summary: string
  ): CareCaseTrigger => ({
    triggerId: `TRG-${detectedAt.slice(0, 4)}-${pad(++trgSeq)}`,
    caseId,
    source,
    sourceRefId,
    detectedAt,
    planId,
    summary,
  });
  const plan = (
    caseId: string,
    n: number,
    by: string,
    createdAt: string,
    supportType: CarePlan["supportType"],
    careMethods: CarePlan["careMethods"],
    goal: string,
    targetDate: string
  ): CarePlan => ({
    planId: `PLAN-${caseId.slice(5)}-${n}`,
    caseId,
    supportType,
    careMethods,
    goal,
    targetDate,
    createdBy: by,
    createdAt,
  });
  const fu = (caseId: string, planId: string, by: string, date: string, actionTaken: string, result: string): CareFollowup => ({
    followupId: `FU-${pad(++fuSeq)}`,
    caseId,
    planId,
    actionTaken,
    result,
    followupDate: date,
    recordedBy: by,
  });
  const newestFirst = <T extends { followupDate: string }>(list: T[]) => [...list].sort((a, b) => b.followupDate.localeCompare(a.followupDate));

  const of = (scenario: Scenario) => PROFILES.find((q) => q.scenario === scenario);
  const sc = (p: GenProfile) => screeningInfo.get(p.studentId)!;
  const screeningSummary = (p: GenProfile) => {
    const info = sc(p);
    const part = (g: RiskGroup, label: string) => {
      const dims = info.screening.results.filter((r) => r.computedGroup === g).map((r) => dimLabel(r.dimension));
      return dims.length ? `${label} มิติ${dims.join(" / ")}` : null;
    };
    return `ผลคัดกรอง${[part("red", "มีปัญหา"), part("amber", "เสี่ยง")].filter(Boolean).join(" · ")}`;
  };
  const sdqRef = (p: GenProfile, round: 1 | 2) => sdqSetRef(p.studentId, round === 1 ? SEM1 : SEM2, round);

  // ---- R1: Red Flag ควรดูแลตั้งแต่ภาคเรียนที่ 1 (case ยาว มีทั้งเหตุจาก SDQ และผลคัดกรองล่าสุด) ----
  const r1 = of("red_mental");
  if (r1) {
    const caseId = "CASE-2569-011";
    const by = r1.teacherId;
    const planId1 = `PLAN-2569-011-1`;
    const planId2 = `PLAN-2569-011-2`;
    const rfAt = assessedAtOf.get(r1.studentId)!;
    const sdqAt = generatedSdq.find((f) => f.studentId === r1.studentId && f.termId === SEM1 && f.rater === "teacher")!.submittedAt!;
    const sdq2At = generatedSdq.find((f) => f.studentId === r1.studentId && f.termId === SEM2 && f.rater === "teacher")!.submittedAt!;
    const screenAt = sc(r1).certifiedAt!;
    const followups = [
      fu(caseId, planId1, by, addDaysThai(rfAt, 7), "นัดพบนักเรียนและผู้ปกครองครั้งแรก", "ผู้ปกครองรับทราบ ตกลงให้โรงเรียนประสานครูแนะแนวดูแลต่อเนื่อง"),
      fu(caseId, planId1, by, "2569-08-12", "พบครูแนะแนวร่วมกับนักเรียน ครั้งที่ 1", "นักเรียนยังพูดน้อย แต่ยอมรับการนัดพบสัปดาห์ละครั้ง"),
      fu(caseId, planId1, by, "2569-10-03", "ติดตามอาการร่วมกับครูแนะแนว", "การเข้าเรียนสม่ำเสมอขึ้น ยังมีช่วงเก็บตัวในบางสัปดาห์"),
      fu(caseId, planId2, by, "2570-01-22", "ให้คำปรึกษารายบุคคลหลังเปิดภาคเรียนที่ 2", "นักเรียนเริ่มเข้าร่วมกิจกรรมชุมนุมกับเพื่อน"),
      fu(caseId, planId2, by, day(-5), "พูดคุยกับผู้ปกครองทางโทรศัพท์", "ผู้ปกครองแจ้งว่าที่บ้านนักเรียนนอนหลับได้ดีขึ้น ขอให้ติดตามต่อ"),
    ];
    const referral: ReferralDocument = {
      referralId: "REF-2570-003",
      caseId,
      externalAgency: "โรงพยาบาลบางพลี (คลินิกสุขภาพจิตเด็กและวัยรุ่น)",
      content:
        "ร่างเอกสารส่งต่อเพื่อประเมินสุขภาพจิตเชิงลึก หลังโรงเรียนให้การช่วยเหลือต่อเนื่องตลอดภาคเรียนที่ 1 และ 2 แล้วนักเรียนยังมีช่วงเก็บตัว แนบผลคัดกรองและบันทึกการติดตาม",
      createdBy: by,
      createdAt: at(day(-2), 14, 10),
      status: "draft",
      sentBy: null,
      sentAt: null,
      voidedBy: null,
      voidedAt: null,
      voidReason: null,
    };
    generatedReferrals.push(referral);
    generatedCareCases.push({
      caseId,
      studentId: r1.studentId,
      openedBy: null,
      status: "active",
      openedAt: rfAt.slice(0, 10),
      closedBy: null,
      closeReason: null,
      closedAt: null,
      triggers: [
        trig(caseId, "screening", sc(r1).id, screenAt, planId2, screeningSummary(r1)),
        trig(caseId, "sdq", sdqRef(r1, 2), sdq2At, planId2, "ผล SDQ รวมเสี่ยง (ครั้งที่ 2)"),
        trig(caseId, "sdq", sdqRef(r1, 1), sdqAt, planId1, "ผล SDQ รวมมีปัญหา (ครั้งที่ 1)"),
        trig(caseId, "red_flag", `RF-${SEM1}-${r1.studentId}`, rfAt, planId1, "แบบคัดกรอง Red Flag ควรดูแล"),
      ],
      plans: [
        plan(caseId, 2, by, "2570-01-20T10:00:00", "refer_external", ["counseling", "school_psychologist"], "ประสานโรงพยาบาลเพื่อประเมินสุขภาพจิตเชิงลึก และให้ครูแนะแนวติดตามต่อเนื่องระหว่างรอ", "2570-03-31"),
        plan(caseId, 1, by, `${addDaysThai(rfAt, 1)}T10:00:00`, "prevent", ["counseling", "guidance_teacher"], "ให้ครูแนะแนวพบนักเรียนสัปดาห์ละ 1 ครั้ง และติดตามการเข้าร่วมกิจกรรมกับเพื่อน", "2570-03-15"),
      ],
      followups: newestFirst(followups),
      referrals: [referral],
    });
  }

  // ---- R2: สวัสดิภาพ "มีปัญหา" → ระบบเปิด case (มีแผนและติดตาม 1 ครั้ง) ----
  const r2 = of("red_welfare");
  if (r2) {
    const caseId = "CASE-2570-017";
    const openedAt = sc(r2).certifiedAt!;
    const planId = `PLAN-2570-017-1`;
    generatedCareCases.push({
      caseId,
      studentId: r2.studentId,
      openedBy: null,
      status: "active",
      openedAt: openedAt.slice(0, 10),
      closedBy: null,
      closeReason: null,
      closedAt: null,
      triggers: [trig(caseId, "screening", sc(r2).id, openedAt, planId, screeningSummary(r2))],
      plans: [
        plan(caseId, 1, r2.teacherId, at(addDaysThai(openedAt, 1), 10), "refer_internal", ["counseling", "guidance_teacher"], "ส่งต่อครูแนะแนวและประสานผู้ปกครองเพื่อดูแลความปลอดภัยของนักเรียน", "2570-03-15"),
      ],
      followups: [
        fu(caseId, planId, r2.teacherId, day(-2), "ส่งต่อครูแนะแนว", "ครูแนะแนวรับเรื่องแล้ว นัดพบนักเรียนและผู้ปกครองสัปดาห์หน้า"),
      ],
      referrals: [],
    });
    autoOpenedCases.push({ caseId, studentId: r2.studentId, openedAt });
  }

  // ---- R3: พฤติกรรม "มีปัญหา" → ระบบเปิด case ยังไม่มีแผน ----
  const r3 = of("red_behavior");
  if (r3) {
    const caseId = "CASE-2570-018";
    const openedAt = sc(r3).certifiedAt!;
    generatedCareCases.push({
      caseId,
      studentId: r3.studentId,
      openedBy: null,
      status: "active",
      openedAt: openedAt.slice(0, 10),
      closedBy: null,
      closeReason: null,
      closedAt: null,
      triggers: [trig(caseId, "screening", sc(r3).id, openedAt, null, screeningSummary(r3))],
      plans: [],
      followups: [],
      referrals: [],
    });
    autoOpenedCases.push({ caseId, studentId: r3.studentId, openedAt });
  }

  // ---- A2: SDQ ครั้งที่ 2 ผลรวมมีปัญหา → ระบบเปิด case และรวมคำแนะนำจากผลคัดกรองเสี่ยงไว้เป็นเหตุเพิ่ม ----
  const a2 = of("amber_sdq_case");
  if (a2) {
    const caseId = "CASE-2570-019";
    const sdqAt = generatedSdq.find((f) => f.studentId === a2.studentId && f.termId === SEM2 && f.rater === "teacher")!.submittedAt!;
    generatedCareCases.push({
      caseId,
      studentId: a2.studentId,
      openedBy: null,
      status: "active",
      openedAt: sdqAt.slice(0, 10),
      closedBy: null,
      closeReason: null,
      closedAt: null,
      triggers: [
        trig(caseId, "sdq", sdqRef(a2, 2), sdqAt, null, "ผล SDQ รวมมีปัญหา (ครั้งที่ 2)"),
        trig(caseId, "screening", sc(a2).id, sc(a2).certifiedAt!, null, screeningSummary(a2)),
      ],
      plans: [],
      followups: [],
      referrals: [],
    });
    autoOpenedCases.push({ caseId, studentId: a2.studentId, openedAt: sdqAt });
  }

  // ---- A3: เศรษฐกิจเสี่ยง ครูเปิด case เองก่อนคัดกรอง → ผลคัดกรองต่อเข้า case เดิม ----
  const a3 = of("amber_economic_case");
  if (a3) {
    const caseId = "CASE-2570-020";
    const openedAt = "2570-02-02";
    const planId = `PLAN-2570-020-1`;
    generatedCareCases.push({
      caseId,
      studentId: a3.studentId,
      openedBy: a3.teacherId,
      status: "active",
      openedAt,
      closedBy: null,
      closeReason: null,
      closedAt: null,
      triggers: [
        trig(caseId, "screening", sc(a3).id, sc(a3).certifiedAt!, planId, screeningSummary(a3)),
        trig(caseId, "manual", null, at(openedAt, 9), planId, "ครูประจำชั้นสังเกตว่านักเรียนขาดอุปกรณ์การเรียนและมักไม่ซื้ออาหารกลางวัน"),
      ],
      plans: [
        plan(caseId, 1, a3.teacherId, at(openedAt, 10), "promote", ["life_skills", "counseling"], "ประสานทุนอาหารกลางวันและอุปกรณ์การเรียนจากโรงเรียน พร้อมให้คำปรึกษาผู้ปกครองเรื่องสวัสดิการ", "2570-03-31"),
      ],
      followups: newestFirst([
        fu(caseId, planId, a3.teacherId, "2570-02-06", "พูดคุยกับนักเรียนและผู้ปกครอง", "ผู้ปกครองยินดีให้โรงเรียนประสานทุน นัดส่งเอกสารภายในสัปดาห์หน้า"),
        fu(caseId, planId, a3.teacherId, day(-1), "ติดตามเอกสารขอรับทุน", "ผู้ปกครองส่งเอกสารครบ รอคณะกรรมการพิจารณา"),
      ]),
      referrals: [],
    });
  }

  // ---- A5: การเรียนเสี่ยง ครูรับคำแนะนำแล้วเปิด case ----
  const a5 = of("amber_academic_case");
  if (a5) {
    const caseId = "CASE-2570-021";
    const certAt = sc(a5).certifiedAt!;
    const planId = `PLAN-2570-021-1`;
    generatedCareCases.push({
      caseId,
      studentId: a5.studentId,
      openedBy: a5.teacherId,
      status: "active",
      openedAt: addDaysThai(certAt, 1),
      closedBy: null,
      closeReason: null,
      closedAt: null,
      triggers: [trig(caseId, "screening", sc(a5).id, certAt, planId, screeningSummary(a5))],
      plans: [
        plan(caseId, 1, a5.teacherId, at(addDaysThai(certAt, 1), 13), "prevent", ["behavior_adjust", "counseling"], "ติดตามการเข้าเรียนและการส่งงานรายสัปดาห์ร่วมกับครูประจำวิชา จนส่งงานครบทุกวิชา", "2570-03-31"),
      ],
      followups: [
        fu(caseId, planId, a5.teacherId, day(-3), "นัดนักเรียนวางแผนการส่งงานค้าง", "นักเรียนรับปากส่งงานค้างภายใน 2 สัปดาห์ ครูวิชาคณิตศาสตร์ช่วยติดตาม"),
      ],
      referrals: [],
    });
  }

  // ---- case ที่ปิดแล้ว (ภาคเรียนที่ 1) ของนักเรียนที่ผลคัดกรองตอนนี้ปกติ ----
  const history = PROFILES.filter((p) => p.scenario === "green_history");
  const HISTORY = [
    { trigger: "ขาดเรียนบ่อยหลังผู้ปกครองย้ายที่ทำงาน", goal: "ติดตามการเข้าเรียนและประสานผู้ปกครองให้ส่งนักเรียนตรงเวลา", action: "ติดตามการเข้าเรียนรายสัปดาห์", result: "นักเรียนเข้าเรียนครบทุกสัปดาห์ในรอบ 1 เดือน", type: "prevent" as const, methods: ["behavior_adjust", "counseling"] as CarePlan["careMethods"] },
    { trigger: "เก็บตัวและไม่เข้าร่วมกิจกรรมกลุ่มหลังย้ายห้องเรียน", goal: "ส่งเสริมให้ร่วมกิจกรรมชุมนุมและมีเพื่อนสนิทในห้อง", action: "ติดตามการเข้าร่วมชุมนุม", result: "นักเรียนเข้าร่วมกิจกรรมสม่ำเสมอ มีเพื่อนกลุ่มใหม่", type: "promote" as const, methods: ["life_skills"] as CarePlan["careMethods"] },
    { trigger: "ผลการเรียนตกหลายรายวิชาในช่วงต้นภาคเรียน", goal: "จัดติวเสริมและติดตามการส่งงานจนผลการเรียนกลับสู่เกณฑ์", action: "ตรวจสอบผลสอบกลางภาคร่วมกับครูประจำวิชา", result: "คะแนนสอบกลางภาคดีขึ้นทุกวิชา ไม่มีวิชาที่ต้องแก้ 0 ร", type: "prevent" as const, methods: ["behavior_adjust", "guidance_teacher"] as CarePlan["careMethods"] },
  ];
  history.forEach((p, i) => {
    const h = HISTORY[i % HISTORY.length];
    const caseId = `CASE-2569-${pad(9 + i + (i >= 2 ? 1 : 0))}`; // 009, 010, 012 (011 เป็นของ red_mental)
    const open = addDaysThai("2569-07-10", i * 6 + rng.int(0, 3));
    const planId = `PLAN-${caseId.slice(5)}-1`;
    const f1 = addDaysThai(open, 14);
    const f2 = addDaysThai(open, 45);
    const close = addDaysThai(open, 60);
    generatedCareCases.push({
      caseId,
      studentId: p.studentId,
      openedBy: p.teacherId,
      status: "closed",
      openedAt: open,
      closedBy: p.teacherId,
      closeReason: "resolved",
      closedAt: close,
      triggers: [trig(caseId, "manual", null, at(open, 9), planId, h.trigger)],
      plans: [plan(caseId, 1, p.teacherId, at(open, 10), h.type, h.methods, h.goal, addDaysThai(close, 5))],
      followups: newestFirst([
        fu(caseId, planId, p.teacherId, f1, h.action, "เริ่มมีแนวโน้มที่ดีขึ้น นัดติดตามต่อ"),
        fu(caseId, planId, p.teacherId, f2, h.action, h.result),
      ]),
      referrals: [],
    });
  });

  // ---- คำแนะนำให้เปิด case: ผลคัดกรอง "เสี่ยง" (คำนวณ) ของนักเรียนที่ยังไม่มี case เปิดอยู่ ----
  const hasActive = new Set(generatedCareCases.filter((c) => c.status === "active").map((c) => c.studentId));
  for (const p of PROFILES) {
    const info = screeningInfo.get(p.studentId);
    if (!info || info.screening.status !== "certified" || hasActive.has(p.studentId)) continue;
    if (!info.computed.includes("amber") || info.computed.includes("red")) continue;
    generatedCaseSuggestions.push({
      suggestionId: `SUG-2570-${pad(++sugSeq)}`,
      studentId: p.studentId,
      source: "screening",
      sourceRefId: info.id,
      detectedAt: info.certifiedAt!,
      summary: screeningSummary(p),
      status: "pending",
    });
  }
}

function dimLabel(d: ScreeningDimension): string {
  return {
    academic: "การเรียน",
    physical: "สุขภาพกาย",
    economic: "เศรษฐกิจ",
    welfare: "สวัสดิภาพและความปลอดภัย",
    behavior: "พฤติกรรม",
    mental: "สุขภาพจิต",
  }[d];
}

/* ------------------------------------------------------------------ */
/* เยี่ยมบ้าน                                                           */
/* ------------------------------------------------------------------ */

export const generatedAppointments: HomeVisitAppointment[] = [];
export const generatedHomeVisitRecords: HomeVisitRecord[] = [];

const OCCUPATIONS = ["รับจ้างทั่วไป", "ค้าขาย", "พนักงานโรงงาน", "เกษตรกร", "ขับรถรับจ้าง", "พนักงานบริษัท", "แม่บ้าน", "ช่างซ่อมรถ"];
const EDUCATIONS = ["ประถมศึกษา", "มัธยมศึกษาตอนต้น", "มัธยมศึกษาตอนปลาย / ปวช.", "ปริญญาตรี"];
const LIVES_WITH = ["บิดาและมารดา", "บิดาและมารดา", "บิดาและมารดา", "มารดา", "บิดา", "ปู่ / ย่า / ตา / ยาย", "ญาติ"];
const INACCESSIBLE_REASONS = [
  "บ้านอยู่ในชุมชนปิดที่ไม่อนุญาตให้บุคคลภายนอกเข้า จึงพบผู้ปกครองที่หน้าทางเข้าชุมชน",
  "ผู้ปกครองทำงานต่างจังหวัด ญาติไม่สะดวกให้เข้าบ้านระหว่างเจ้าของบ้านไม่อยู่ จึงพบที่ร้านค้าหน้าซอย",
];

function householdIncome(rng: Rng, low: boolean) {
  const none = { wage: 0, agriculture: 0, business: 0, welfare: 0, other: 0 };
  const guardianWage = low ? rng.int(2500, 5000) : rng.int(9000, 22000);
  const second = low ? rng.int(0, 1800) : rng.int(0, 12000);
  return { guardianWage, second, none };
}

function buildForm(p: GenProfile, rng: Rng, awayWith: string | null) {
  const form = emptyHomeVisitForm();
  const { guardianWage, second, none } = householdIncome(rng, p.lowIncome);
  const members = [
    { id: "pm1", relation: p.guardianRelation, age: rng.int(38, 52), disability: false, income: { ...none, wage: guardianWage } },
    { id: "pm2", relation: "นักเรียน", age: 15, disability: false, income: { ...none } },
  ];
  if (rng.chance(0.7)) {
    members.push({
      id: "pm3",
      relation: p.guardianRelation === "บิดา" ? "มารดา" : "บิดา",
      age: rng.int(36, 50),
      disability: false,
      income: { ...none, business: second },
    });
  }
  if (rng.chance(0.3)) members.push({ id: `pm${members.length + 1}`, relation: "ยาย", age: rng.int(62, 78), disability: false, income: { ...none, welfare: 600 } });
  if (rng.chance(0.4)) members.push({ id: `pm${members.length + 1}`, relation: "น้อง", age: rng.int(5, 13), disability: false, income: { ...none } });
  form.members = members;
  form.guardianOccupation = rng.pick(OCCUPATIONS);
  form.guardianEducation = rng.pick(EDUCATIONS);
  form.currentAddress = generatedRoster.students.find((s) => s.studentId === p.studentId)!.address;
  form.disadvantages = p.lowIncome ? ["poor"] : [];
  form.dependencies = members.some((m) => m.relation === "ยาย") ? [DEPENDENCY_OPTIONS[1].id] : [];
  form.housingType = rng.pick(["own", "own", "rent"]);
  form.vehicles = { car: !p.lowIncome && rng.chance(0.4), pickup: false, farm: false };
  form.farmland = "no_land";
  form.electricity = "meter";
  form.waterSources = [rng.pick(["bottled", "tap"])];
  form.hoursTogether = String(rng.int(2, 6));
  form.relations = Object.fromEntries(
    members.filter((m) => m.relation !== "นักเรียน").map((m) => [m.relation === "ยาย" ? "ปู่ / ย่า / ตา / ยาย" : m.relation, rng.pick(["สนิทสนม", "สนิทสนม", "เฉยๆ"])])
  );
  form.caretakerWhenAway = rng.pick(["relative", "neighbor"]);
  form.travelKm = String(rng.int(1, 9));
  form.travelHours = "0";
  form.travelMinutes = String(rng.int(10, 40));
  form.travelMode = rng.pick(["motorcycle", "guardian", "bus", "school_bus"]);
  form.duties = [rng.pick(["housework", "small_trade", "farm_work"])];
  form.internet = "can_access";
  form.parentStatus = rng.pick(["together", "together", "separated", "divorced"]);
  form.siblingKind = members.some((m) => m.relation === "น้อง") ? "order" : "only";
  form.birthOrder = form.siblingKind === "order" ? "1" : "";
  form.houseBuilding = rng.pick(["single_storey", "two_storey", "townhouse"]);
  form.closestTo = [p.guardianRelation === "บิดา" ? "father" : "mother"];
  form.confideIn = [rng.pick(["mother", "friend", "teacher"])];
  form.photoSource = "teacher";
  form.guardianConcern = awayWith ? `เมื่อผู้ปกครองไม่อยู่บ้าน นักเรียนอยู่กับ${awayWith}` : "";
  if (is(p, "red_welfare")) form.welfareRisks = ["family_conflict"];
  if (is(p, "amber_physical")) form.healthRisks = ["chronic"];
  return form;
}

{
  const rng = rngFor("home-visit");
  let hvSeq = 6; // HV-001..006 ใช้แล้ว
  let hvrSeq = 3; // HVR-001..003 ใช้แล้ว
  let photoSeq = 100;
  const visitDays = businessDays("2570-01-19", "2570-02-13");
  const futureDays = businessDays("2570-02-17", "2570-03-06");

  const photos = (kind: "home" | "signboard", date: string, count = 2) => {
    const types = kind === "home" ? (["exterior", "interior"] as const) : (["with_signboard"] as const);
    return types.slice(0, kind === "home" ? count : 1).map((photoType, i) => ({
      photoId: `PH-${++photoSeq}-${photoType}`,
      photoType,
      fileUrl: `mock://home-visit/G${photoSeq}-${photoType}.jpg`,
      uploadedAt: at(date, 15, 40 + i * 5),
    }));
  };

  const informant = (p: GenProfile) => ({
    name: guardianNameOf(p.guardianUserId),
    relation: INFORMANT_OPTIONS.includes(p.guardianRelation) ? p.guardianRelation : "บิดา",
  });

  for (const p of PROFILES) {
    const teacher = p.teacherId;

    // ปีการศึกษา 2568 (ม.2/1): ครูประจำชั้นคนเดิม
    if (p.visited2568) {
      const appId = `HV-0568-${p.studentId.slice(2)}`;
      const prevTeacher = rng.pick([USER.prapa, USER.wichai]);
      const date = addDaysThai("2568-12-01", rng.int(0, 20));
      const date2 = isBusinessDayThai(date) ? date : addDaysThai(date, 2);
      generatedAppointments.push({
        appointmentId: appId,
        studentId: p.studentId,
        teacherId: prevTeacher,
        academicYear: 2568,
        visitType: "annual",
        caseId: null,
        proposedDate: at(date2, 15, 30),
        status: "completed",
      });
      const form = buildForm(p, rng, null);
      const inf = informant(p);
      generatedHomeVisitRecords.push({
        recordId: `HVR-0568-${p.studentId.slice(2)}`,
        appointmentId: appId,
        studentId: p.studentId,
        form,
        livesWith: rng.pick(LIVES_WITH),
        informantName: inf.name,
        informantRelation: inf.relation,
        cannotAccessHome: false,
        cannotAccessReason: "",
        photos: photos("home", date2),
        householdIncomeAvg: perCapitaIncome(form.members),
        travelDistanceKm: Number(form.travelKm),
        recordedBy: prevTeacher,
        updatedAt: at(date2, 17, 30),
        signedBy: prevTeacher,
        signedAt: at(date2, 17, 30),
      });
    }

    // ปีการศึกษา 2569 เยี่ยมประจำปี
    if (p.hv === "none") continue;
    const appointmentId = `HV-${pad(++hvSeq)}`;
    const awayWith = rng.chance(0.4) ? rng.pick(["ยาย", "ป้า", "ตา", "พี่สาว"]) : null;
    const base: HomeVisitAppointment = {
      appointmentId,
      studentId: p.studentId,
      teacherId: teacher,
      academicYear: 2569,
      visitType: "annual",
      caseId: null,
      proposedDate: "",
      status: "pending",
    };

    if (p.hv === "done" || p.hv === "done_inaccessible" || p.hv === "draft") {
      const date = p.hv === "draft" ? rng.pick(["2570-02-12", "2570-02-13"]) : rng.pick(visitDays);
      const guardianNote = rng.chance(0.3) ? "อยากขอคำแนะนำเรื่องการเรียนต่อชั้น ม.4" : undefined;
      generatedAppointments.push({
        ...base,
        proposedDate: at(date, 15, rng.pick([0, 30])),
        status: p.hv === "draft" ? "confirmed" : "completed",
        ...(guardianNote ? { guardianNote } : {}),
      });
      const form = buildForm(p, rng, awayWith);
      const inf = informant(p);
      const inaccessible = p.hv === "done_inaccessible";
      const draft = p.hv === "draft";
      generatedHomeVisitRecords.push({
        recordId: `HVR-${pad(++hvrSeq)}`,
        appointmentId,
        studentId: p.studentId,
        form,
        livesWith: inaccessible ? "อื่น ๆ (วัด มูลนิธิ หอพัก นายจ้าง)" : rng.pick(LIVES_WITH),
        informantName: draft ? "" : inf.name,
        informantRelation: draft ? "" : inf.relation,
        cannotAccessHome: inaccessible,
        cannotAccessReason: inaccessible ? rng.pick(INACCESSIBLE_REASONS) : "",
        photos: draft ? photos("home", date, 1) : photos(inaccessible ? "signboard" : "home", date),
        householdIncomeAvg: perCapitaIncome(form.members),
        travelDistanceKm: Number(form.travelKm),
        recordedBy: teacher,
        updatedAt: at(date, draft ? 16 : 17, 20),
        signedBy: draft ? null : teacher,
        signedAt: draft ? null : at(date, 17, 20),
      });
      continue;
    }

    const guardianPhone = guardianPhoneOf(p.guardianUserId) ?? undefined;
    if (p.hv === "sched_confirmed") {
      generatedAppointments.push({
        ...base,
        proposedDate: at(rng.pick(futureDays), 15, rng.pick([0, 30])),
        status: "confirmed",
        ...(guardianPhone ? { guardianPhone } : {}),
        ...(awayWith ? { awayStayWith: awayWith } : {}),
      });
    } else if (p.hv === "sched_pending") {
      generatedAppointments.push({ ...base, proposedDate: at(rng.pick(futureDays), 16, 0), status: "pending" });
    } else {
      generatedAppointments.push({
        ...base,
        proposedDate: at("2570-02-18", 15, 30),
        status: "reschedule_requested",
        guardianNote: "ขอเลื่อนเป็นช่วงเย็นวันศุกร์ เนื่องจากผู้ปกครองติดงานในวันที่นัด",
      });
    }
  }

  // เยี่ยมเพิ่มสำหรับนักเรียนที่มี case เปิดอยู่ (ไม่บังคับ)
  const followUps: [Scenario, string, "confirmed" | "pending", string][] = [
    ["red_mental", "CASE-2569-011", "confirmed", "2570-02-24"],
    ["amber_economic_case", "CASE-2570-020", "pending", "2570-02-26"],
  ];
  for (const [scenario, caseId, status, date] of followUps) {
    const p = PROFILES.find((q) => q.scenario === scenario);
    if (!p) continue;
    generatedAppointments.push({
      appointmentId: `HV-${pad(++hvSeq)}`,
      studentId: p.studentId,
      teacherId: p.teacherId,
      academicYear: 2569,
      visitType: "follow_up",
      caseId,
      proposedDate: at(date, 15, 30),
      status,
      ...(status === "confirmed" && guardianPhoneOf(p.guardianUserId) ? { guardianPhone: guardianPhoneOf(p.guardianUserId)! } : {}),
    });
  }
}
