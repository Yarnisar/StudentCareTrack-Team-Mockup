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
  behaviorRules as seedBehaviorRules,
  careCases as seedCareCases,
  CURRENT_TEACHER,
  CURRENT_TERM,
  DEMO_TODAY,
  dcSummaries,
  educationDocuments as seedDocuments,
  homeVisitRecords as seedHomeVisitRecords,
  screenings as seedScreenings,
  sdqAssessments as seedSdq,
  students,
} from "./mock-data";
import {
  classifyDimension,
  DERIVED_ITEM_ID,
  evaluateNineS,
  evaluateRedFlag,
  scoreSdq,
} from "./rules";
import { nowThaiIso } from "./format";
import { usePathname } from "next/navigation";
import { canRevealCitizenId, defaultRoleFor, ROLE_INFO, type Role } from "./roles";
import { INITIAL_WINDOWS, shiftDate, type AssessmentWindow } from "./periods";
import { DEFAULT_BEHAVIOR_SCORE, runningScore, watchLevelOf, type BehaviorScoreConfig } from "./behavior-score";
import {
  AccessLog,
  AppointmentStatus,
  AssessmentOutcome,
  BehaviorRecord,
  BehaviorRule,
  CareCase,
  CaseUrgency,
  CareMethod,
  DcAssessment,
  DcLevel,
  DcSummary,
  DocumentRequest,
  EducationDocument,
  ReferralStatus,
  DIMENSION_LABEL,
  DIMENSION_ORDER,
  HomeVisitAppointment,
  HomeVisitRecord,
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

interface StoreValue {
  /** บทบาทของผู้ใช้ปัจจุบัน (ต้นแบบ: เลือกจากหน้า login หรือแถบสลับบทบาท) */
  role: Role;
  setRole: (role: Role) => void;

  students: Student[];
  screenings: Screening[];
  redFlags: RedFlagAssessment[];
  nineS: NineSAssessment[];
  sdq: SdqAssessment[];
  behaviorRecords: BehaviorRecord[];
  appointments: HomeVisitAppointment[];
  careCases: CareCase[];
  homeVisitRecords: HomeVisitRecord[];
  /** ประวัติการเปิดดูเลขบัตรประชาชน เรียงใหม่สุดก่อน */
  accessLogs: AccessLog[];
  /** ช่วงเวลาดำเนินงานที่แอดมินตั้งในหน้าตั้งค่า (UC4 Scenario A, UC9) */
  assessmentWindows: AssessmentWindow[];
  setAssessmentWindows: React.Dispatch<React.SetStateAction<AssessmentWindow[]>>;
  /** กฎความประพฤติชุดเดียว หน้าตั้งค่าแก้ ตัวบันทึกและการคิดคะแนนอ่านจากที่นี่ (UC7, UC8) */
  behaviorRules: BehaviorRule[];
  setBehaviorRules: React.Dispatch<React.SetStateAction<BehaviorRule[]>>;
  /** คะแนนเริ่มต้น เพดาน คะแนนต่ำสุด และเกณฑ์เฝ้าระวังหลายระดับ ที่แอดมินตั้ง (UC7 Scenario D) */
  behaviorScoreConfig: BehaviorScoreConfig;
  setBehaviorScoreConfig: (config: BehaviorScoreConfig) => void;

  getStudent: (studentId: string) => Student | undefined;
  latestScreening: (studentId: string) => Screening | undefined;
  overallRiskOf: (studentId: string) => RiskGroup | null;
  sdqOf: (studentId: string) => SdqAssessment[];
  behaviorOf: (studentId: string) => BehaviorRecord[];
  /** คะแนนความประพฤติปัจจุบัน ใส่ extra เพื่อดูคะแนนหลังบันทึกรายการใหม่ (UC8 ข้อ 11) */
  behaviorScoreOf: (studentId: string, extra?: { delta: number; at: string }) => number;
  /** ระดับเฝ้าระวังด้านความประพฤติ 0 = ไม่อยู่ในสถานะ ใส่ extra เพื่อดูระดับหลังบันทึก (UC8 ข้อ 16) */
  behaviorWatchLevelOf: (studentId: string, extra?: { delta: number; at: string }) => number;
  /** ถึงเกณฑ์เฝ้าระวังด้านความประพฤติหรือไม่ */
  isBehaviorWatch: (studentId: string) => boolean;
  caseOf: (studentId: string) => CareCase | undefined;

  /** ร่างแบบประเมินที่ยังไม่ส่ง (key จาก draftKey) */
  getDraft: <T>(key: string) => T | undefined;
  saveDraft: (key: string, value: unknown) => void;

  saveScreening: (studentId: string, checked: Record<ScreeningDimension, string[]>) => Screening;
  saveRedFlag: (studentId: string, answers: Record<string, boolean>) => AssessmentOutcome;
  saveNineS: (studentId: string, answers: Record<string, 0 | 1 | 2>) => AssessmentOutcome;
  saveSdq: (studentId: string, rater: SdqRater, answers: Record<number, 0 | 1 | 2>) => SdqAssessment;
  /** บันทึกพฤติกรรมเดียวกันให้นักเรียนหนึ่งคนหรือหลายคน (UC8) */
  addBehaviorRecord: (input: {
    studentIds: string[];
    ruleId: string;
    description: string;
    /** วันที่เกิดเหตุ (พ.ศ. yyyy-mm-dd) ไม่ระบุ = วันนี้ */
    occurredOn?: string;
    evidence?: string[];
    source?: BehaviorRecord["source"];
  }) => void;
  setAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  /** ครูประจำชั้นนัดหมายเยี่ยมบ้าน (UC4 Scenario B) สถานะเริ่มที่ "รอการยืนยัน" */
  createAppointment: (studentId: string, proposedDate: string) => HomeVisitAppointment;
  saveGuardianInfo: (
    appointmentId: string,
    info: {
      guardianPhone: string;
      caretakerRelation: string;
      caretakerName: string;
      guardianNote: string;
      convenientTime?: string;
    }
  ) => void;
  /** นักเรียนหรือผู้ปกครองยืนยันนัด (Scenario D ข้อ 5) */
  confirmAppointment: (appointmentId: string, by: string) => void;
  /** ขอเปลี่ยนวันพร้อมเหตุผล วันเดิมยังมีผล (Alt-C ข้อ 1–2) */
  requestReschedule: (appointmentId: string, date: string, reason: string, by: string) => void;
  /** ครูพิจารณาคำขอเปลี่ยนวัน: รับวันใหม่ หรือคงวันเดิม (Alt-C ข้อ 3) */
  resolveReschedule: (appointmentId: string, accept: boolean) => void;
  /** ยืนยันว่าได้เยี่ยมจริง (Scenario E) หรือแจ้งว่าไม่ได้เยี่ยม (Alt-E) */
  respondVisit: (appointmentId: string, visited: boolean, by: string) => void;
  /** บันทึกผลการเยี่ยมบ้าน ปิดนัดหมายเป็น "เสร็จสิ้น" และลบร่าง */
  saveHomeVisit: (
    appointmentId: string,
    result: Omit<HomeVisitRecord, "recordId" | "appointmentId" | "studentId" | "signedAt">
  ) => HomeVisitRecord | null;
  openCase: (
    studentId: string,
    supportType: SupportType,
    methods: CareMethod[],
    goal: string,
    options: { urgency: CaseUrgency; nextFollowupDate: string; targetDate?: string; triggerSource?: string }
  ) => CareCase;
  /**
   * เปิด case ติดตามช่วยเหลือ หรือเชื่อมกับ case ที่เปิดอยู่ของนักเรียน (UC6 ข้อ 13, Alt-B/C ข้อ 3)
   * case ที่ระบบเปิดเองยังไม่มีแผน ครูที่ปรึกษาวางแผนต่อใน UC11 (goal ว่าง = ยังไม่วางแผน)
   */
  openOrLinkCase: (studentId: string, trigger: string) => { caseId: string; linked: boolean };
  /** วางแผนช่วยเหลือให้ case ที่ยังไม่มีแผน (UC11 Scenario A ข้อ 5) */
  planCase: (
    caseId: string,
    plan: {
      supportType: SupportType;
      careMethods: CareMethod[];
      goal: string;
      urgency: CaseUrgency;
      nextFollowupDate: string;
      targetDate?: string;
    }
  ) => void;
  /** กลุ่มเสี่ยงที่ครูเลือกไม่เปิด case พร้อมเหตุผล แยกจากสถานะเฝ้าระวังด้านความประพฤติ (UC6 Alt-G) */
  screeningWatch: Record<string, { reason: string; at: string; by: string }>;
  setScreeningWatch: (studentId: string, reason: string) => void;
  addFollowup: (caseId: string, actionTaken: string, result: string, nextFollowupDate: string) => void;
  setCaseUrgency: (caseId: string, urgency: CaseUrgency) => void;
  /** ปิด case พร้อมผลสรุป (UC11 Scenario C) */
  closeCase: (caseId: string, summary: string) => void;
  /** ครูตรวจเอกสารส่งต่อแล้วส่งให้แอดมินเก็บรักษา case ยังเปิดอยู่ (UC11 Scenario D) */
  sendReferral: (caseId: string) => void;
  /** แอดมินเปลี่ยนสถานะเอกสารส่งต่อ โดยไม่เปิดอ่านเนื้อหา (Scenario D ข้อ 6) */
  setReferralStatus: (caseId: string, status: ReferralStatus) => void;
  /** id การแจ้งเตือนที่ผู้ใช้เปิดอ่านแล้ว (UC3 ข้อ 6) */
  readNotifications: string[];
  markNotificationRead: (id: string) => void;
  /** ผลประเมินคุณลักษณะทุกรอบ (UC13) */
  dcAssessments: DcAssessment[];
  /** ผลล่าสุดที่ส่งแล้วของนักเรียน ใช้ทำ ปพ.4 / ปพ.6 / ปพ.3 */
  dcResultOf: (studentId: string) => DcSummary | undefined;
  /** รอบล่าสุดของนักเรียน (รวมร่าง) */
  latestDc: (studentId: string) => DcAssessment | undefined;
  /** บันทึกร่างหรือส่งผลของรอบล่าสุดที่ยังไม่ส่ง ถ้าไม่มีรอบที่เปิดอยู่จะเปิดรอบใหม่ */
  saveDcAssessment: (studentId: string, levels: Record<number, DcLevel | null>, note: string, submit: boolean) => void;
  /** เริ่มประเมินซ้ำ เปิดรอบใหม่ที่ว่างอยู่ (ข้อ 2, 9) */
  startDcReassessment: (studentId: string) => void;
  /** เอกสาร ปพ. ที่จัดทำแล้ว (UC15) */
  educationDocuments: EducationDocument[];
  generateDocument: (docType: EducationDocument["docType"], target: string) => EducationDocument;
  documentRequests: DocumentRequest[];
  requestDocument: (studentId: string) => void;
  fulfillRequest: (requestId: string) => void;
  /** บันทึกว่าบทบาทปัจจุบันเปิดดูเลขบัตรของนักเรียน คืน false ถ้าบทบาทนี้ไม่มีสิทธิ์ */
  logCitizenIdView: (studentId: string) => boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

let seq = 1000;
const nextId = (prefix: string) => `${prefix}-${++seq}`;

export type DraftForm = "screening" | "red_flag" | "nine_s" | `sdq_${SdqRater}` | "home_visit";

/** id คือ studentId ของแบบประเมิน หรือ appointmentId ของการเยี่ยมบ้าน */
export const draftKey = (form: DraftForm, id: string) => `${form}:${id}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  // คำนวณจาก URL ของหน้าแรกที่เปิด ให้ผลเหมือนกันทั้งฝั่ง server และ client (ไม่เกิด hydration mismatch)
  const pathname = usePathname();
  const [role, setRole] = useState<Role>(() => defaultRoleFor(pathname));
  const [screenings, setScreenings] = useState<Screening[]>(seedScreenings);
  const [redFlags, setRedFlags] = useState<RedFlagAssessment[]>([]);
  const [nineS, setNineS] = useState<NineSAssessment[]>([]);
  const [sdq, setSdq] = useState<SdqAssessment[]>(seedSdq);
  const [behaviorRecords, setBehaviorRecords] = useState<BehaviorRecord[]>(seedBehaviorRecords);
  const [rawAppointments, setAppointments] = useState<HomeVisitAppointment[]>(seedAppointments);
  const [careCases, setCareCases] = useState<CareCase[]>(seedCareCases);
  const [homeVisitRecords, setHomeVisitRecords] = useState<HomeVisitRecord[]>(seedHomeVisitRecords);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [assessmentWindows, setAssessmentWindows] = useState<AssessmentWindow[]>(INITIAL_WINDOWS);
  const [behaviorRules, setBehaviorRules] = useState<BehaviorRule[]>(seedBehaviorRules);
  const [behaviorScoreConfig, setBehaviorScoreConfig] = useState<BehaviorScoreConfig>(DEFAULT_BEHAVIOR_SCORE);
  const [drafts, setDrafts] = useState<Record<string, unknown>>({});
  const [dcAssessments, setDcAssessments] = useState<DcAssessment[]>(() =>
    // ข้อมูลตัวอย่าง: คนที่ประเมินครบ 8 ข้อถือว่าส่งแล้ว ที่ยังขาดเป็นร่าง
    dcSummaries.map((d, i) => ({
      id: `DC-SEED-${i}`,
      studentId: d.studentId,
      round: 1,
      levels: d.levels,
      note: "",
      status: Object.values(d.levels).some((l) => l === null) ? "draft" : "submitted",
      assessedAt: "2570-02-10",
      assessedBy: CURRENT_TEACHER.name,
    }))
  );
  const [readNotifications, setReadNotifications] = useState<string[]>([]);
  const [educationDocuments, setEducationDocuments] = useState<EducationDocument[]>(seedDocuments);
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>([]);
  const [screeningWatch, setScreeningWatchState] = useState<StoreValue["screeningWatch"]>({});

  const value = useMemo<StoreValue>(() => {
    /**
     * งานตรวจตามเวลา (3.4.3) ต้นแบบคำนวณตอนอ่านเทียบกับวันนี้ของข้อมูลตัวอย่าง
     * - Alt-D: ถึงวันนัดโดยไม่มีผู้ยืนยันและครูยังไม่ยืนยันวันใหม่ ระบบยืนยันวันนัดเดิม
     * - Alt-F: ครบระยะเวลายืนยันการเยี่ยมโดยไม่มีผู้ตอบ ระบบปิดงานเป็น "ยืนยันโดยไม่มีผู้ตอบกลับ"
     */
    const appointments = rawAppointments.map((a): HomeVisitAppointment => {
      if ((a.status === "pending" || a.status === "reschedule_requested") && a.proposedDate.slice(0, 10) <= DEMO_TODAY)
        return { ...a, status: "confirmed", confirmedBy: "ระบบ (ถึงวันนัดโดยไม่มีผู้ยืนยัน)", reschedule: undefined };
      if (a.status === "awaiting_visit_confirmation" && a.visitConfirmDeadline && DEMO_TODAY > a.visitConfirmDeadline)
        return { ...a, status: "completed_no_response" };
      return a;
    });

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

    const behaviorScoreOf = (studentId: string, extra?: { delta: number; at: string }) => {
      const items = behaviorOf(studentId).map((rec) => ({
        // กฎที่ถูกยกเลิกไม่นับคะแนนรายการเดิม (UC7 Scenario C ข้อ 9)
        delta: (() => {
          const rule = behaviorRules.find((r) => r.ruleId === rec.ruleId);
          return !rule || rule.cancelled ? 0 : rule.scoreDelta;
        })(),
        at: rec.occurredAt,
      }));
      return runningScore(extra ? [...items, extra] : items, behaviorScoreConfig);
    };

    const behaviorWatchLevelOf = (studentId: string, extra?: { delta: number; at: string }) =>
      watchLevelOf(behaviorScoreOf(studentId, extra), behaviorScoreConfig);

    const isBehaviorWatch = (studentId: string) => behaviorWatchLevelOf(studentId) > 0;

    const caseOf = (studentId: string) =>
      careCases.find((c) => c.studentId === studentId && c.status === "active") ??
      careCases.find((c) => c.studentId === studentId);

    const getDraft = <T,>(key: string) => drafts[key] as T | undefined;

    const saveDraft: StoreValue["saveDraft"] = (key, value) =>
      setDrafts((prev) => ({ ...prev, [key]: value }));

    const clearDraft = (key: string) =>
      setDrafts((prev) => {
        const rest = { ...prev };
        delete rest[key];
        return rest;
      });

    /** เขียนผลแบบประเมินกลับเป็นรายการในมิติสุขภาพจิตของการคัดกรอง แล้วจัดกลุ่มมิตินั้นใหม่ */
    const applyToMentalDimension = (studentId: string, itemId: string, flagged: boolean) => {
      setScreenings((prev) =>
        prev.map((sc) =>
          sc.studentId !== studentId
            ? sc
            : {
                ...sc,
                results: sc.results.map((r) => {
                  if (r.dimension !== "mental") return r;
                  const others = r.checkedItemIds.filter((id) => id !== itemId);
                  const checkedItemIds = flagged ? [...others, itemId] : others;
                  return { ...r, checkedItemIds, group: classifyDimension("mental", checkedItemIds) };
                }),
              }
        )
      );
    };

    const openOrLinkCase: StoreValue["openOrLinkCase"] = (studentId, trigger) => {
      const existing = careCases.find((c) => c.studentId === studentId && c.status === "active");
      if (existing) {
        // เชื่อมกับ case เดิม: เพิ่มที่มาใหม่ต่อท้าย ไม่เปิดซ้ำ
        setCareCases((prev) =>
          prev.map((c) =>
            c.caseId === existing.caseId && !c.triggerSource.includes(trigger)
              ? { ...c, triggerSource: `${c.triggerSource} · ${trigger}` }
              : c
          )
        );
        return { caseId: existing.caseId, linked: true };
      }
      const record: CareCase = {
        caseId: nextId("CASE"),
        studentId,
        triggerSource: trigger,
        status: "active",
        openedAt: nowThaiIso().split("T")[0],
        closedAt: null,
        supportType: "prevent",
        careMethods: [],
        goal: "",
        targetDate: "",
        urgency: "medium",
        nextFollowupDate: "",
        followups: [],
      };
      setCareCases((prev) => [record, ...prev]);
      // เปิด case แล้ว ไม่ต้องอยู่ในสถานะเฝ้าดูผลคัดกรองอีก
      setScreeningWatchState((prev) => {
        if (!prev[studentId]) return prev;
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
      return { caseId: record.caseId, linked: false };
    };

    const planCase: StoreValue["planCase"] = (caseId, plan) => {
      setCareCases((prev) =>
        prev.map((c) => (c.caseId === caseId ? { ...c, ...plan, targetDate: plan.targetDate ?? "" } : c))
      );
    };

    const setScreeningWatch: StoreValue["setScreeningWatch"] = (studentId, reason) => {
      setScreeningWatchState((prev) => ({
        ...prev,
        [studentId]: { reason, at: nowThaiIso().split("T")[0], by: CURRENT_TEACHER.name },
      }));
    };

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
      clearDraft(draftKey("screening", studentId));
      // มีมิติที่มีปัญหา (แดง) -> ระบบเปิดหรือเชื่อม case เอง (UC6 ข้อ 13)
      const red = record.results.filter((r) => r.group === "red").map((r) => DIMENSION_LABEL[r.dimension]);
      if (red.length > 0) openOrLinkCase(studentId, `ผลคัดกรอง 6 มิติ: ${red.join(" / ")} มีปัญหา`);
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
      applyToMentalDimension(studentId, DERIVED_ITEM_ID.red_flag, result === "needs_care");
      clearDraft(draftKey("red_flag", studentId));
      if (result === "needs_care") {
        createSdqSet(studentId);
        openOrLinkCase(studentId, "ผล Red Flag อยู่ในเกณฑ์ควรดูแล"); // Alt-B ข้อ 3
      }
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
      applyToMentalDimension(studentId, DERIVED_ITEM_ID.nine_s, result === "needs_care");
      clearDraft(draftKey("nine_s", studentId));
      if (result === "needs_care") {
        createSdqSet(studentId);
        openOrLinkCase(studentId, "ผล 9S อยู่ในเกณฑ์ควรดูแล"); // Alt-C ข้อ 3
      }
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
      clearDraft(draftKey(`sdq_${rater}`, studentId));
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

    const addBehaviorRecord: StoreValue["addBehaviorRecord"] = ({
      studentIds,
      ruleId,
      description,
      occurredOn,
      evidence,
      source = "manual",
    }) => {
      const now = nowThaiIso();
      // วันที่เกิดเหตุย้อนหลังได้ ใช้เวลาที่บันทึกจริงต่อท้าย
      const occurredAt = occurredOn ? `${occurredOn}T${now.split("T")[1]}` : now;
      const created = studentIds.map<BehaviorRecord>((studentId) => ({
        recordId: nextId("BH"),
        studentId,
        ruleId,
        description,
        occurredAt,
        recordedByName: CURRENT_TEACHER.name,
        source,
        ...(evidence && evidence.length > 0 && { evidence }),
      }));
      setBehaviorRecords((prev) => [...created, ...prev]);
    };

    const createAppointment: StoreValue["createAppointment"] = (studentId, proposedDate) => {
      const record: HomeVisitAppointment = {
        appointmentId: nextId("HV"),
        studentId,
        teacherName: CURRENT_TEACHER.name,
        proposedDate,
        status: "pending",
      };
      setAppointments((prev) => [record, ...prev]);
      return record;
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

    const patchAppointment = (appointmentId: string, fn: (a: HomeVisitAppointment) => HomeVisitAppointment) =>
      setAppointments((prev) => prev.map((a) => (a.appointmentId === appointmentId ? fn(a) : a)));

    const confirmAppointment: StoreValue["confirmAppointment"] = (appointmentId, by) =>
      patchAppointment(appointmentId, (a) => ({ ...a, status: "confirmed", confirmedBy: by, reschedule: undefined }));

    const requestReschedule: StoreValue["requestReschedule"] = (appointmentId, date, reason, by) =>
      patchAppointment(appointmentId, (a) => ({ ...a, status: "reschedule_requested", reschedule: { date, reason, by } }));

    const resolveReschedule: StoreValue["resolveReschedule"] = (appointmentId, accept) =>
      patchAppointment(appointmentId, (a) =>
        accept && a.reschedule
          ? { ...a, status: "confirmed", proposedDate: a.reschedule.date, confirmedBy: a.reschedule.by, reschedule: undefined }
          : { ...a, status: "pending", reschedule: undefined }
      );

    const respondVisit: StoreValue["respondVisit"] = (appointmentId, visited, by) =>
      patchAppointment(appointmentId, (a) => ({
        ...a,
        status: visited ? "completed" : "visit_disputed",
        visitRespondedBy: by,
      }));

    const saveHomeVisit: StoreValue["saveHomeVisit"] = (appointmentId, result) => {
      const appointment = appointments.find((a) => a.appointmentId === appointmentId);
      if (!appointment) return null;
      const record: HomeVisitRecord = {
        ...result,
        recordId: nextId("HVR"),
        appointmentId,
        studentId: appointment.studentId,
        signedAt: nowThaiIso().split("T")[0],
      };
      setHomeVisitRecords((prev) => [record, ...prev.filter((r) => r.appointmentId !== appointmentId)]);
      // ส่งคำขอให้นักเรียนหรือผู้ปกครองยืนยันว่าได้เยี่ยมจริง (UC5 ข้อ 12, UC4 Scenario E)
      const waitDays = assessmentWindows.find((w) => w.kind === "home_visit")?.confirmWaitDays ?? 3;
      patchAppointment(appointmentId, (a) => ({
        ...a,
        status: "awaiting_visit_confirmation",
        visitConfirmDeadline: shiftDate(DEMO_TODAY, waitDays),
        visitRespondedBy: undefined,
      }));
      clearDraft(draftKey("home_visit", appointmentId));
      return record;
    };

    const openCase: StoreValue["openCase"] = (studentId, supportType, methods, goal, options) => {
      const record: CareCase = {
        caseId: nextId("CASE"),
        studentId,
        triggerSource: options.triggerSource ?? "เปิดโดยครูประจำชั้น",
        status: "active",
        openedAt: nowThaiIso().split("T")[0],
        closedAt: null,
        supportType,
        careMethods: methods,
        goal,
        targetDate: options.targetDate ?? "",
        urgency: options.urgency,
        nextFollowupDate: options.nextFollowupDate,
        followups: [],
      };
      setCareCases((prev) => [record, ...prev]);
      return record;
    };

    const addFollowup: StoreValue["addFollowup"] = (caseId, actionTaken, result, nextFollowupDate) => {
      setCareCases((prev) =>
        prev.map((c) =>
          c.caseId === caseId
            ? {
                ...c,
                nextFollowupDate,
                followups: [
                  {
                    followupId: nextId("FU"),
                    actionTaken,
                    result,
                    followupDate: nowThaiIso().split("T")[0],
                    recordedByName: CURRENT_TEACHER.name,
                    nextFollowupDate,
                  },
                  ...c.followups,
                ],
              }
            : c
        )
      );
    };

    const setCaseUrgency: StoreValue["setCaseUrgency"] = (caseId, urgency) => {
      setCareCases((prev) => prev.map((c) => (c.caseId === caseId ? { ...c, urgency } : c)));
    };

    const closeCase: StoreValue["closeCase"] = (caseId, summary) => {
      setCareCases((prev) =>
        prev.map((c) =>
          c.caseId === caseId
            ? { ...c, status: "closed", closedAt: nowThaiIso().split("T")[0], closingSummary: summary }
            : c
        )
      );
    };

    const today = () => nowThaiIso().split("T")[0];

    const sendReferral: StoreValue["sendReferral"] = (caseId) => {
      setCareCases((prev) =>
        prev.map((c) =>
          c.caseId === caseId
            ? {
                ...c,
                referral: {
                  referralId: nextId("REF"),
                  preparedAt: today(),
                  sentByName: CURRENT_TEACHER.name,
                  status: "awaiting_admin",
                  statusAt: today(),
                },
              }
            : c
        )
      );
    };

    const setReferralStatus: StoreValue["setReferralStatus"] = (caseId, status) => {
      setCareCases((prev) =>
        prev.map((c) =>
          c.caseId === caseId && c.referral ? { ...c, referral: { ...c.referral, status, statusAt: today() } } : c
        )
      );
    };

    const markNotificationRead = (id: string) =>
      setReadNotifications((prev) => (prev.includes(id) ? prev : [...prev, id]));

    const latestDc = (studentId: string) =>
      dcAssessments.filter((a) => a.studentId === studentId).sort((a, b) => b.round - a.round)[0];

    const dcResultOf = (studentId: string) => {
      const done = dcAssessments
        .filter((a) => a.studentId === studentId && a.status === "submitted")
        .sort((a, b) => b.round - a.round)[0];
      return done ? { studentId, levels: done.levels } : undefined;
    };

    const saveDcAssessment: StoreValue["saveDcAssessment"] = (studentId, levels, note, submit) => {
      const current = latestDc(studentId);
      const base =
        current && current.status === "draft"
          ? current
          : {
              id: nextId("DC"),
              studentId,
              round: (current?.round ?? 0) + 1,
              levels: {},
              note: "",
              status: "draft" as const,
              assessedAt: "",
              assessedBy: CURRENT_TEACHER.name,
            };
      const updated: DcAssessment = {
        ...base,
        levels,
        note,
        status: submit ? "submitted" : "draft",
        assessedAt: today(),
        assessedBy: CURRENT_TEACHER.name,
      };
      setDcAssessments((prev) => [updated, ...prev.filter((a) => a.id !== updated.id)]);
    };

    const startDcReassessment: StoreValue["startDcReassessment"] = (studentId) => {
      const current = latestDc(studentId);
      if (current?.status === "draft") return;
      setDcAssessments((prev) => [
        {
          id: nextId("DC"),
          studentId,
          round: (current?.round ?? 0) + 1,
          levels: {},
          note: "",
          status: "draft",
          assessedAt: today(),
          assessedBy: CURRENT_TEACHER.name,
        },
        ...prev,
      ]);
    };

    const generateDocument: StoreValue["generateDocument"] = (docType, target) => {
      const version = educationDocuments.filter((d) => d.docType === docType && d.target === target).length + 1;
      const doc: EducationDocument = {
        docId: nextId("DOC"),
        docType,
        target,
        generatedByName: ROLE_INFO[role].user.name,
        generatedAt: today(),
        version,
      };
      setEducationDocuments((prev) => [doc, ...prev]);
      return doc;
    };

    const requestDocument: StoreValue["requestDocument"] = (studentId) => {
      setDocumentRequests((prev) => [
        {
          requestId: nextId("REQ"),
          docType: "ปพ.7",
          studentId,
          requestedByName: ROLE_INFO[role].user.name,
          requestedAt: today(),
          status: "pending",
        },
        ...prev,
      ]);
    };

    const fulfillRequest: StoreValue["fulfillRequest"] = (requestId) => {
      const req = documentRequests.find((r) => r.requestId === requestId);
      if (!req) return;
      const doc = generateDocument("ปพ.7", getStudent(req.studentId)?.fullName ?? req.studentId);
      setDocumentRequests((prev) =>
        prev.map((r) => (r.requestId === requestId ? { ...r, status: "done", docId: doc.docId } : r))
      );
    };

    const logCitizenIdView = (studentId: string) => {
      if (!canRevealCitizenId(role)) return false;
      setAccessLogs((prev) => [
        {
          logId: nextId("LOG"),
          studentId,
          field: "citizen_id",
          actorName: ROLE_INFO[role].user.name,
          actorRole: ROLE_INFO[role].label,
          at: nowThaiIso(),
        },
        ...prev,
      ]);
      return true;
    };

    return {
      role,
      setRole,
      students,
      screenings,
      redFlags,
      nineS,
      sdq,
      behaviorRecords,
      appointments,
      careCases,
      homeVisitRecords,
      accessLogs,
      assessmentWindows,
      setAssessmentWindows,
      behaviorRules,
      setBehaviorRules,
      behaviorScoreConfig,
      setBehaviorScoreConfig,
      getStudent,
      latestScreening,
      overallRiskOf,
      sdqOf,
      behaviorOf,
      behaviorScoreOf,
      behaviorWatchLevelOf,
      isBehaviorWatch,
      caseOf,
      getDraft,
      saveDraft,
      saveScreening,
      saveRedFlag,
      saveNineS,
      saveSdq,
      addBehaviorRecord,
      setAppointmentStatus,
      createAppointment,
      saveGuardianInfo,
      confirmAppointment,
      requestReschedule,
      resolveReschedule,
      respondVisit,
      saveHomeVisit,
      openCase,
      openOrLinkCase,
      planCase,
      screeningWatch,
      setScreeningWatch,
      addFollowup,
      setCaseUrgency,
      closeCase,
      sendReferral,
      setReferralStatus,
      readNotifications,
      markNotificationRead,
      dcAssessments,
      dcResultOf,
      latestDc,
      saveDcAssessment,
      startDcReassessment,
      educationDocuments,
      generateDocument,
      documentRequests,
      requestDocument,
      fulfillRequest,
      logCitizenIdView,
    };
  }, [role, screenings, redFlags, nineS, sdq, behaviorRecords, rawAppointments, careCases, homeVisitRecords, accessLogs, assessmentWindows, behaviorRules, behaviorScoreConfig, drafts, screeningWatch, educationDocuments, documentRequests, dcAssessments, readNotifications]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore ต้องถูกเรียกภายใน StoreProvider");
  return ctx;
}

export { seedBehaviorRules as behaviorRules, dcSummaries };
