"use client";

/**
 * สถานะของต้นแบบระบบ (เก็บในหน่วยความจำฝั่งไคลเอนต์)
 * ใน Project 2 ส่วนนี้จะถูกแทนที่ด้วยการเรียก REST API ของ FastAPI
 * โดยโครงสร้างฟังก์ชันยังคงเดิม เพื่อให้เปลี่ยนไปเรียก API ได้โดยไม่กระทบหน้าจอ
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  appointments as seedAppointments,
  behaviorRecords as seedBehaviorRecords,
  behaviorRules,
  careCases as seedCareCases,
  checkinLogs as seedCheckins,
  CURRENT_TEACHER,
  CURRENT_TERM,
  dcSummaries,
  educationDocuments as seedDocuments,
  homeVisitRecords,
  screenings as seedScreenings,
  sdqAssessments as seedSdq,
  students,
} from "./mock-data";
import {
  classifyDimension,
  evaluateNineS,
  evaluateRedFlag,
  isLateArrival,
  LATE_ALERT_THRESHOLD,
  scoreSdq,
} from "./rules";
import { nowThaiIso } from "./format";
import {
  AppointmentStatus,
  AssessmentOutcome,
  BehaviorRecord,
  CareCase,
  CareMethod,
  CheckinLog,
  DIMENSION_ORDER,
  HomeVisitAppointment,
  NineSAssessment,
  RedFlagAssessment,
  RiskGroup,
  ScreeningDimension,
  Screening,
  SdqAssessment,
  SdqRater,
  Student,
  SupportType,
} from "./types";

export interface CheckinOutcome {
  student: Student;
  log: CheckinLog;
  isLate: boolean;
  lateCountThisMonth: number;
  exceededThreshold: boolean;
}

interface StoreValue {
  students: Student[];
  screenings: Screening[];
  redFlags: RedFlagAssessment[];
  nineS: NineSAssessment[];
  sdq: SdqAssessment[];
  behaviorRecords: BehaviorRecord[];
  checkins: CheckinLog[];
  appointments: HomeVisitAppointment[];
  careCases: CareCase[];

  getStudent: (studentId: string) => Student | undefined;
  latestScreening: (studentId: string) => Screening | undefined;
  overallRiskOf: (studentId: string) => RiskGroup | null;
  sdqOf: (studentId: string) => SdqAssessment[];
  behaviorOf: (studentId: string) => BehaviorRecord[];
  behaviorScoreOf: (studentId: string) => number;
  caseOf: (studentId: string) => CareCase | undefined;

  saveScreening: (studentId: string, checked: Record<ScreeningDimension, string[]>) => Screening;
  saveRedFlag: (studentId: string, answers: Record<string, boolean>) => AssessmentOutcome;
  saveNineS: (studentId: string, answers: Record<string, 0 | 1 | 2>) => AssessmentOutcome;
  saveSdq: (studentId: string, rater: SdqRater, answers: Record<number, 0 | 1 | 2>) => SdqAssessment;
  addBehaviorRecord: (studentId: string, ruleId: string, description: string) => void;
  checkIn: (studentId: string, simulatedTime?: string) => CheckinOutcome | null;
  setAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  saveGuardianInfo: (appointmentId: string, info: { guardianPhone: string; caretakerName: string; guardianNote: string }) => void;
  openCase: (studentId: string, supportType: SupportType, methods: CareMethod[], goal: string) => CareCase;
  addFollowup: (caseId: string, actionTaken: string, result: string) => void;
  closeCase: (caseId: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

let seq = 1000;
const nextId = (prefix: string) => `${prefix}-${++seq}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [screenings, setScreenings] = useState<Screening[]>(seedScreenings);
  const [redFlags, setRedFlags] = useState<RedFlagAssessment[]>([]);
  const [nineS, setNineS] = useState<NineSAssessment[]>([]);
  const [sdq, setSdq] = useState<SdqAssessment[]>(seedSdq);
  const [behaviorRecords, setBehaviorRecords] = useState<BehaviorRecord[]>(seedBehaviorRecords);
  const [checkins, setCheckins] = useState<CheckinLog[]>(seedCheckins);
  const [appointments, setAppointments] = useState<HomeVisitAppointment[]>(seedAppointments);
  const [careCases, setCareCases] = useState<CareCase[]>(seedCareCases);

  const value = useMemo<StoreValue>(() => {
    const getStudent = (studentId: string) => students.find((s) => s.studentId === studentId);

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

    const sdqOf = (studentId: string) => sdq.filter((s) => s.studentId === studentId);

    const behaviorOf = (studentId: string) =>
      behaviorRecords
        .filter((b) => b.studentId === studentId)
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

    const behaviorScoreOf = (studentId: string) =>
      behaviorOf(studentId).reduce((sum, rec) => {
        const rule = behaviorRules.find((r) => r.ruleId === rec.ruleId);
        return sum + (rule?.scoreDelta ?? 0);
      }, 0);

    const caseOf = (studentId: string) =>
      careCases.find((c) => c.studentId === studentId && c.status === "active") ??
      careCases.find((c) => c.studentId === studentId);

    const saveScreening: StoreValue["saveScreening"] = (studentId, checked) => {
      const record: Screening = {
        screeningId: nextId("SC"),
        studentId,
        termId: CURRENT_TERM.termId,
        screenedBy: CURRENT_TEACHER.name,
        screenedAt: nowThaiIso().split("T")[0],
        results: DIMENSION_ORDER.map((dimension) => ({
          dimension,
          group: classifyDimension(dimension, checked[dimension] ?? []),
          checkedItemIds: checked[dimension] ?? [],
        })),
      };
      setScreenings((prev) => [record, ...prev.filter((s) => s.studentId !== studentId)]);
      return record;
    };

    const saveRedFlag: StoreValue["saveRedFlag"] = (studentId, answers) => {
      const result = evaluateRedFlag(answers);
      const record: RedFlagAssessment = {
        id: nextId("RF"),
        studentId,
        termId: CURRENT_TERM.termId,
        answers,
        result,
        assessedBy: CURRENT_TEACHER.name,
        assessedAt: nowThaiIso(),
      };
      setRedFlags((prev) => [record, ...prev]);
      if (result === "needs_care") createSdqSet(studentId);
      return result;
    };

    const saveNineS: StoreValue["saveNineS"] = (studentId, answers) => {
      const { clusterScores, clusterResults, result } = evaluateNineS(answers);
      const record: NineSAssessment = {
        id: nextId("NS"),
        studentId,
        termId: CURRENT_TERM.termId,
        clusterScores,
        clusterResults,
        result,
        assessedBy: CURRENT_TEACHER.name,
        assessedAt: nowThaiIso(),
      };
      setNineS((prev) => [record, ...prev]);
      if (result === "needs_care") createSdqSet(studentId);
      return result;
    };

    /** เปิดแบบ SDQ ทั้ง 3 ฉบับโดยอัตโนมัติ (ครู / นักเรียน / ผู้ปกครอง) */
    function createSdqSet(studentId: string) {
      const student = getStudent(studentId);
      if (!student) return;
      const raters: { rater: SdqRater; raterName: string }[] = [
        { rater: "teacher", raterName: CURRENT_TEACHER.name },
        { rater: "student", raterName: student.fullName },
        { rater: "parent", raterName: student.guardianName },
      ];
      setSdq((prev) => {
        const existing = new Set(
          prev.filter((s) => s.studentId === studentId && s.round === 1).map((s) => s.rater)
        );
        const created = raters
          .filter((r) => !existing.has(r.rater))
          .map<SdqAssessment>((r) => ({
            id: nextId("SDQ"),
            studentId,
            termId: CURRENT_TERM.termId,
            round: 1,
            rater: r.rater,
            raterName: r.raterName,
            answers: {},
            totalDifficulties: null,
            scaleScores: null,
            level: null,
            status: "pending",
            assessedAt: null,
          }));
        return [...prev, ...created];
      });
    }

    const saveSdq: StoreValue["saveSdq"] = (studentId, rater, answers) => {
      const { scaleScores, totalDifficulties, level } = scoreSdq(answers);
      const student = getStudent(studentId);
      let saved: SdqAssessment | undefined;

      setSdq((prev) => {
        const idx = prev.findIndex(
          (s) => s.studentId === studentId && s.rater === rater && s.round === 1
        );
        const base: SdqAssessment =
          idx >= 0
            ? prev[idx]
            : {
                id: nextId("SDQ"),
                studentId,
                termId: CURRENT_TERM.termId,
                round: 1,
                rater,
                raterName:
                  rater === "teacher"
                    ? CURRENT_TEACHER.name
                    : rater === "student"
                      ? (student?.fullName ?? "นักเรียน")
                      : (student?.guardianName ?? "ผู้ปกครอง"),
                answers: {},
                totalDifficulties: null,
                scaleScores: null,
                level: null,
                status: "pending",
                assessedAt: null,
              };

        const updated: SdqAssessment = {
          ...base,
          answers,
          scaleScores,
          totalDifficulties,
          level,
          status: "completed",
          assessedAt: nowThaiIso(),
        };
        saved = updated;
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = updated;
          return copy;
        }
        return [...prev, updated];
      });

      return (
        saved ?? {
          id: nextId("SDQ"),
          studentId,
          termId: CURRENT_TERM.termId,
          round: 1,
          rater,
          raterName: "",
          answers,
          scaleScores,
          totalDifficulties,
          level,
          status: "completed",
          assessedAt: nowThaiIso(),
        }
      );
    };

    const addBehaviorRecord: StoreValue["addBehaviorRecord"] = (studentId, ruleId, description) => {
      setBehaviorRecords((prev) => [
        {
          recordId: nextId("BH"),
          studentId,
          ruleId,
          description,
          occurredAt: nowThaiIso(),
          recordedByName: CURRENT_TEACHER.name,
          source: "manual",
        },
        ...prev,
      ]);
    };

    const checkIn: StoreValue["checkIn"] = (studentId, simulatedTime) => {
      const student = getStudent(studentId);
      if (!student) return null;

      const now = new Date();
      // ต้นแบบ: อนุญาตให้จำลองเวลาสแกน (HH:MM) เพื่อสาธิตเงื่อนไขการมาสายได้ทุกช่วงเวลา
      if (simulatedTime) {
        const [h, m] = simulatedTime.split(":").map(Number);
        now.setHours(h, m, 0, 0);
      }
      const late = isLateArrival(now);
      const pad = (n: number) => String(n).padStart(2, "0");
      const stamp = nowThaiIso(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
      const log: CheckinLog = {
        logId: nextId("CI"),
        studentId,
        scannedAt: stamp,
        isLate: late,
        scannedByName: CURRENT_TEACHER.name,
      };

      const month = stamp.slice(0, 7);
      const lateCountThisMonth =
        checkins.filter((c) => c.studentId === studentId && c.isLate && c.scannedAt.startsWith(month))
          .length + (late ? 1 : 0);

      setCheckins((prev) => [log, ...prev]);

      // มาสาย -> สร้างบันทึกความประพฤติอัตโนมัติ (เชื่อมกับโมดูลความประพฤติ)
      if (late) {
        setBehaviorRecords((prev) => [
          {
            recordId: nextId("BH"),
            studentId,
            ruleId: "BR-01",
            description: `บันทึกอัตโนมัติจากการสแกน QR เวลา ${stamp.split("T")[1].slice(0, 5)} น.`,
            occurredAt: stamp,
            recordedByName: "ระบบ (QR Check-in)",
            source: "qr_checkin",
          },
          ...prev,
        ]);
      }

      return {
        student,
        log,
        isLate: late,
        lateCountThisMonth,
        exceededThreshold: late && lateCountThisMonth >= LATE_ALERT_THRESHOLD,
      };
    };

    const setAppointmentStatus: StoreValue["setAppointmentStatus"] = (appointmentId, status) => {
      setAppointments((prev) =>
        prev.map((a) => (a.appointmentId === appointmentId ? { ...a, status } : a))
      );
    };

    const saveGuardianInfo: StoreValue["saveGuardianInfo"] = (appointmentId, info) => {
      setAppointments((prev) =>
        prev.map((a) => (a.appointmentId === appointmentId ? { ...a, ...info } : a))
      );
    };

    const openCase: StoreValue["openCase"] = (studentId, supportType, methods, goal) => {
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

    const addFollowup: StoreValue["addFollowup"] = (caseId, actionTaken, result) => {
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
                    recordedByName: CURRENT_TEACHER.name,
                  },
                  ...c.followups,
                ],
              }
            : c
        )
      );
    };

    const closeCase: StoreValue["closeCase"] = (caseId) => {
      setCareCases((prev) =>
        prev.map((c) =>
          c.caseId === caseId
            ? { ...c, status: "closed", closedAt: nowThaiIso().split("T")[0] }
            : c
        )
      );
    };

    return {
      students,
      screenings,
      redFlags,
      nineS,
      sdq,
      behaviorRecords,
      checkins,
      appointments,
      careCases,
      getStudent,
      latestScreening,
      overallRiskOf,
      sdqOf,
      behaviorOf,
      behaviorScoreOf,
      caseOf,
      saveScreening,
      saveRedFlag,
      saveNineS,
      saveSdq,
      addBehaviorRecord,
      checkIn,
      setAppointmentStatus,
      saveGuardianInfo,
      openCase,
      addFollowup,
      closeCase,
    };
  }, [screenings, redFlags, nineS, sdq, behaviorRecords, checkins, appointments, careCases]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore ต้องถูกเรียกภายใน StoreProvider");
  return ctx;
}

export { behaviorRules, dcSummaries, homeVisitRecords, seedDocuments as educationDocuments };
