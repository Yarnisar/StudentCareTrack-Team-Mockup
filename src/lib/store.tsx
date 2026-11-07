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
  behaviorRules as seedBehaviorRules,  careCases as seedCareCases,
  studentCards as seedCards,
  CURRENT_TEACHER,
  CURRENT_TERM,
  DEMO_TODAY,
  dcSummaries,
  educationDocuments as seedDocuments,
  homeVisitRecords as seedHomeVisitRecords,
  screenings as seedScreenings,
  sdqAssessments as seedSdq,
  eqAssessments as seedEq,
  students,
  otherStudents,
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
import { DEFAULT_DC_CRITERIA, type DcRound } from "./dc-round";
import { canRevealCitizenId, defaultRoleFor, recordableRooms, ROLE_INFO, TEACHER_ASSIGNMENTS, type Role } from "./roles";
import { INITIAL_WINDOWS, shiftDate, windowFor, windowStatus, type AssessmentWindow } from "./periods";
import { scoreEq, type EqAnswer, type EqAssessment } from "./eq";
import { eqReviewInfo, sdqReviewInfo, type AssessmentReview, type ReviewKind } from "./assessment-review";
import { sdqSummaryForParent } from "./portal";
import { DEFAULT_BEHAVIOR_SCORE, peakWatchLevel, runningScore, watchLevelOf, type BehaviorScoreConfig } from "./behavior-score";
import {
  AccessLog,
  AppointmentStatus,
  AssessmentOutcome,
  BehaviorRecord,
  BehaviorRule,
  CareCase,
  CaseUrgency,
  CareMethod,
  StudentCard,
  RegistryCorrection,
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
  /** รอบ SDQ ปัจจุบัน = ช่วงเวลา SDQ ที่เปิดอยู่ในหน้าตั้งค่า (ไม่มีรอบเปิด = รอบที่ปิดล่าสุด) */
  sdqRound: 1 | 2;
  /** SDQ 3 ฉบับของรอบที่ระบุ (ค่าเริ่มต้น = รอบปัจจุบัน) */
  sdqSetOf: (studentId: string, round?: 1 | 2) => SdqAssessment[];
  /** EQ ภาคเรียนนี้ (UC10) */
  eq: EqAssessment[];
  eqOf: (studentId: string) => EqAssessment | undefined;
  /** ส่งหรือแก้คำตอบ EQ ก่อนปิดรับ แก้แล้วเก็บประวัติและประมวลผลใหม่ */
  saveEq: (studentId: string, answers: Record<number, EqAnswer>) => void;
  /** นักเรียนมัธยมเลือกไม่ทำ EQ (Alt-B) */
  declineEq: (studentId: string) => void;
  /** การตรวจผลของครูที่ปรึกษา (สถานการณ์ B) */
  reviews: AssessmentReview[];
  sdqReview: (studentId: string) => ReturnType<typeof sdqReviewInfo> & { review?: AssessmentReview };
  eqReview: (studentId: string) => ReturnType<typeof eqReviewInfo> & { review?: AssessmentReview };
  /** ยืนยันว่าตรวจผลแล้ว → เปิดผล ณ ตอนนี้ให้นักเรียนและผู้ปกครอง */
  confirmReview: (studentId: string, kind: ReviewKind) => void;
  behaviorOf: (studentId: string) => BehaviorRecord[];
  /** คะแนนความประพฤติปัจจุบัน ใส่ extra เพื่อดูคะแนนหลังบันทึกรายการใหม่ (UC8 ข้อ 11) */
  behaviorScoreOf: (studentId: string, extra?: { delta: number; at: string }) => number;
  /** คะแนนสะสม ณ เวลานั้น (นับรายการที่เกิดถึงเวลานั้น) ใช้แสดงคะแนนหลังแต่ละบันทึก */
  behaviorScoreAt: (studentId: string, at: string) => number;
  /** ระดับเฝ้าระวังด้านความประพฤติ 0 = ไม่อยู่ในสถานะ ใส่ extra เพื่อดูระดับหลังบันทึก (UC8 ข้อ 16) */
  behaviorWatchLevelOf: (studentId: string, extra?: { delta: number; at: string }) => number;
  /** ถึงเกณฑ์เฝ้าระวังด้านความประพฤติหรือไม่ */
  isBehaviorWatch: (studentId: string) => boolean;
  /** คะแนนกลับเข้าเกณฑ์แล้ว แต่ยังคงสถานะไว้จนครูที่ปรึกษายืนยันถอน (UC8 Scenario C) */
  watchWithdrawalPending: (studentId: string) => boolean;
  /** ครูที่ปรึกษายืนยันถอนสถานะ หรือคงสถานะไว้พร้อมเหตุผล (Scenario C ข้อ 4–6) */
  resolveWatchWithdrawal: (studentId: string, withdraw: boolean, reason?: string) => void;
  /** ประวัติการถอน / คงสถานะเฝ้าระวัง */
  watchDecisions: { studentId: string; at: string; by: string; withdraw: boolean; reason: string }[];
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
    backdateReason?: string;
  }) => void;
  /** นักเรียนทั้งหมดที่ระบบรู้จัก ใช้บอกเหตุผลเมื่อค้นเจอรหัสที่อยู่นอกขอบเขต (ไม่ใช้แสดงรายชื่อ) */
  directory: Student[];
  /** นักเรียนที่ครูคนนี้บันทึกพฤติกรรมได้ = ห้องที่เป็นครูประจำชั้น + ห้องที่สอน */
  recordableStudents: Student[];
  canRecordStudent: (studentId: string) => boolean;
  /** ครูประจำชั้นเห็นทุกรายการของห้องตน ห้องที่สอนเห็นเฉพาะรายการที่ตนบันทึก */
  behaviorVisible: (record: BehaviorRecord) => boolean;
  /** ผู้บันทึกแก้ไขหรือยกเลิกรายการนี้ได้หรือไม่ ไม่ได้ = เหตุผล (UC8 สถานการณ์ B ข้อ 3, Alt-E) */
  behaviorEditable: (record: BehaviorRecord) => { ok: true } | { ok: false; reason: string };
  /** แก้ไขรายการ เก็บประวัติ และคำนวณคะแนนใหม่ */
  updateBehaviorRecord: (
    recordId: string,
    patch: { ruleId: string; occurredOn: string; description: string; backdateReason?: string }
  ) => void;
  /** ยกเลิกรายการ ไม่นับคะแนนแต่ยังเก็บประวัติ */
  cancelBehaviorRecord: (recordId: string, reason: string) => void;
  /** คะแนนและระดับเฝ้าระวังก่อน/หลัง ถ้าแก้หรือยกเลิกรายการนี้ (สถานการณ์ B ข้อ 6, 11) */
  previewBehaviorChange: (
    recordId: string,
    change: { ruleId: string; occurredOn: string } | "cancel"
  ) => { scoreBefore: number; scoreAfter: number; levelBefore: number; levelAfter: number };
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
  /**
   * ยืนยันว่าได้เยี่ยมจริง (Scenario E) หรือแจ้งว่าไม่ได้เยี่ยม (Alt-E)
   * ยืนยันแล้วยังไม่ปิดงานจนครบกำหนด การแจ้งว่าไม่ได้เยี่ยมระหว่างนั้นยกเลิกการยืนยันเดิม
   */
  respondVisit: (appointmentId: string, visited: boolean, by: string) => void;
  /** บันทึกผลการเยี่ยมบ้าน ปิดนัดหมายเป็น "เสร็จสิ้น" และลบร่าง */
  saveHomeVisit: (
    appointmentId: string,
    result: Omit<HomeVisitRecord, "recordId" | "appointmentId" | "studentId" | "signedAt">
  ) => HomeVisitRecord | null;
  /**
   * แก้ผลที่ส่งแล้ว เก็บประวัติการแก้ไข และส่งคำขอยืนยันใหม่โดยเริ่มนับเวลาใหม่ (UC5 สถานการณ์ B, UC4 Alt-F ข้อ 3)
   */
  updateHomeVisit: (
    appointmentId: string,
    result: Omit<HomeVisitRecord, "recordId" | "appointmentId" | "studentId" | "signedAt" | "editHistory">,
    changes: string[]
  ) => void;
  /** บัตรนักเรียนทุกใบ รวมบัตรที่ยกเลิกแล้ว (UC14) */
  studentCards: StudentCard[];
  /** ออกบัตรใหม่หรือบัตรทดแทน บัตรทดแทนยกเลิกบัตรเดิมทันที (UC14 สถานการณ์ A ข้อ 11) */
  issueCards: (studentIds: string[], type: StudentCard["type"], expiresAt: string, reason?: string) => StudentCard[];
  /** บันทึกสถานะบัตรจริง (สถานการณ์ B) */
  setCardPhysical: (cardId: string, physical: StudentCard["physical"]) => void;
  /** คำขอแก้ข้อมูลทะเบียน (UC5 Alt-D) */
  registryCorrections: RegistryCorrection[];
  requestRegistryCorrection: (input: Omit<RegistryCorrection, "id" | "by" | "at" | "status">, delivered: boolean) => void;
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
  /** รอบประเมินคุณลักษณะของแต่ละภาคเรียน: เกณฑ์ วิธีสรุปผล วันปิดส่งผล (UC12) */
  dcRounds: DcRound[];
  saveDcRound: (round: DcRound) => void;
  /** รอบที่เปิดใช้ของภาคเรียนปัจจุบัน ครูที่ปรึกษาประเมินได้เมื่อมีรอบนี้ (UC13 Pre-condition 2) */
  activeDcRound: DcRound | undefined;
  /** รอบนี้มีผลประเมินแล้วหรือยัง ถ้ามีแล้วแก้เกณฑ์ไม่ได้ (UC12 Alt-A) */
  dcRoundHasResults: (termId: string) => boolean;
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

export type DraftForm = "screening" | "red_flag" | "nine_s" | `sdq_${SdqRater}` | "eq" | "home_visit";

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
  const [eq, setEq] = useState<EqAssessment[]>(seedEq);
  const [reviews, setReviews] = useState<AssessmentReview[]>([]);
  const [behaviorRecords, setBehaviorRecords] = useState<BehaviorRecord[]>(() =>
    // ข้อมูลตัวอย่างถือว่าบันทึกไว้ด้วยค่ากฎตอนนี้ จึงเก็บคะแนน ณ ตอนบันทึกไว้เหมือนรายการที่บันทึกจริง
    seedBehaviorRecords.map((r) => ({ ...r, scoreDelta: r.scoreDelta ?? seedBehaviorRules.find((x) => x.ruleId === r.ruleId)?.scoreDelta }))
  );
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
  const [dcRounds, setDcRounds] = useState<DcRound[]>([
    {
      termId: CURRENT_TERM.termId,
      termLabel: CURRENT_TERM.label,
      criteria: DEFAULT_DC_CRITERIA,
      method: "min",
      deadline: "2570-03-15",
      status: "open",
    },
  ]);
  const [studentCards, setStudentCards] = useState<StudentCard[]>(seedCards);
  const [registryCorrections, setRegistryCorrections] = useState<RegistryCorrection[]>([]);
  const [watchDecisions, setWatchDecisions] = useState<StoreValue["watchDecisions"]>([]);
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
      // มีผู้ยืนยันแล้วและไม่มีใครแจ้งว่าไม่ได้เยี่ยมจนครบกำหนด -> ปิดงาน
      if (a.status === "visit_confirmed" && a.visitConfirmDeadline && DEMO_TODAY > a.visitConfirmDeadline)
        return { ...a, status: "completed" };
      return a;
    });

    const getStudent = (studentId: string) =>
      students.find((s) => s.studentId === studentId) ?? otherStudents.find((s) => s.studentId === studentId);
    // ขอบเขตตามการมอบหมาย (UC8 ข้อ 6, ตารางขอบเขตสิทธิ์)
    const rooms = recordableRooms(role);
    const recordableStudents = [...students, ...otherStudents].filter((s) => rooms.includes(s.roomName));
    const directory = [...students, ...otherStudents];
    const canRecordStudent = (studentId: string) => recordableStudents.some((s) => s.studentId === studentId);
    const homeroomRoom = TEACHER_ASSIGNMENTS[role]?.homeroomRoom;
    const behaviorVisible = (rec: BehaviorRecord) =>
      (!!homeroomRoom && getStudent(rec.studentId)?.roomName === homeroomRoom) || rec.recordedByName === ROLE_INFO[role].user.name;

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
    const eqOf = (studentId: string) => eq.find((e) => e.studentId === studentId);
    const reviewOf = (studentId: string, kind: ReviewKind) =>
      reviews
        .filter((r) => r.studentId === studentId && r.kind === kind && (kind !== "sdq" || (r.round ?? 1) === sdqRound))
        .sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt))[0];
    const sdqWindow = windowFor(assessmentWindows, "sdq");
    const sdqRound: 1 | 2 = sdqWindow?.round ?? 1;
    const sdqSetOf = (studentId: string, round: 1 | 2 = sdqRound) => sdqOf(studentId).filter((x) => x.round === round);
    const sdqReview: StoreValue["sdqReview"] = (studentId) => {
      const review = reviewOf(studentId, "sdq");
      const roundClosed = !!sdqWindow && windowStatus(sdqWindow) === "closed";
      return { ...sdqReviewInfo(sdqSetOf(studentId), review, roundClosed), review };
    };
    const eqReview: StoreValue["eqReview"] = (studentId) => {
      const review = reviewOf(studentId, "eq");
      return { ...eqReviewInfo(eqOf(studentId), review), review };
    };
    const confirmReview: StoreValue["confirmReview"] = (studentId, kind) => {
      const e = eqOf(studentId);
      setReviews((prev) => [
        ...prev,
        {
          studentId,
          kind,
          round: kind === "sdq" ? sdqRound : undefined,
          reviewedAt: nowThaiIso(),
          reviewedBy: CURRENT_TEACHER.name,
          released:
            kind === "sdq"
              ? { sdq: sdqSummaryForParent(sdqSetOf(studentId)) }
              : { eq: e?.status === "completed" ? e.levels : null },
        },
      ]);
    };
    const saveEq: StoreValue["saveEq"] = (studentId, answers) => {
      clearDraft(draftKey("eq", studentId));
      const at = nowThaiIso();
      setEq((prev) =>
        prev.map((e) =>
          e.studentId === studentId
            ? {
                ...e,
                status: "completed",
                answers,
                ...scoreEq(answers),
                assessedAt: at,
                editHistory: e.status === "completed" && e.assessedAt ? [...(e.editHistory ?? []), e.assessedAt] : e.editHistory,
              }
            : e
        )
      );
    };
    const declineEq: StoreValue["declineEq"] = (studentId) =>
      setEq((prev) =>
        prev.map((e) =>
          e.studentId === studentId ? { ...e, status: "declined", answers: {}, scores: null, levels: null, assessedAt: nowThaiIso() } : e
        )
      );

    const behaviorOf = (studentId: string) =>
      behaviorRecords
        .filter((b) => b.studentId === studentId)
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

    /** คะแนนของรายการ: กฎที่ถูกยกเลิก (UC7 Scenario C ข้อ 9) และรายการที่ครูยกเลิก (UC8 สถานการณ์ B) ไม่นับ */
    const deltaOf = (ruleId: string) => {
      const rule = behaviorRules.find((r) => r.ruleId === ruleId);
      return !rule || rule.cancelled ? 0 : rule.scoreDelta;
    };
    /** คะแนนของรายการ: ใช้ค่าที่เก็บไว้ตอนบันทึก กฎถูกยกเลิกหรือรายการถูกยกเลิกไม่นับ */
    const recordDelta = (rec: BehaviorRecord) => {
      const rule = behaviorRules.find((r) => r.ruleId === rec.ruleId);
      return rec.cancelled || !rule || rule.cancelled ? 0 : (rec.scoreDelta ?? rule.scoreDelta);
    };
    const scoreItems = (studentId: string) => behaviorOf(studentId).map((rec) => ({ delta: recordDelta(rec), at: rec.occurredAt }));

    const behaviorScoreOf = (studentId: string, extra?: { delta: number; at: string }) => {
      const items = scoreItems(studentId);
      return runningScore(extra ? [...items, extra] : items, behaviorScoreConfig);
    };

    const behaviorScoreAt = (studentId: string, at: string) =>
      runningScore(scoreItems(studentId).filter((i) => i.at <= at), behaviorScoreConfig);

    /** ระดับตามคะแนนตอนนี้ */
    const currentWatchLevel = (studentId: string, extra?: { delta: number; at: string }) =>
      watchLevelOf(behaviorScoreOf(studentId, extra), behaviorScoreConfig);

    /** ระดับที่มีผล = สูงสุดระหว่างระดับตอนนี้ กับระดับสูงสุดที่เคยถึงหลังครูยืนยันถอนครั้งล่าสุด */
    const behaviorWatchLevelOf = (studentId: string, extra?: { delta: number; at: string }) => {
      const lastWithdraw = watchDecisions
        .filter((d) => d.studentId === studentId && d.withdraw)
        .map((d) => d.at)
        .sort()
        .at(-1) ?? "";
      const items = scoreItems(studentId);
      const peak = peakWatchLevel(extra ? [...items, extra] : items, behaviorScoreConfig, lastWithdraw);
      return Math.max(currentWatchLevel(studentId, extra), peak);
    };

    const isBehaviorWatch = (studentId: string) => behaviorWatchLevelOf(studentId) > 0;

    const watchWithdrawalPending = (studentId: string) =>
      behaviorWatchLevelOf(studentId) > currentWatchLevel(studentId);

    const resolveWatchWithdrawal: StoreValue["resolveWatchWithdrawal"] = (studentId, withdraw, reason = "") =>
      setWatchDecisions((prev) => [
        ...prev,
        { studentId, at: nowThaiIso(), by: CURRENT_TEACHER.name, withdraw, reason },
      ]);

    const currentUserName = ROLE_INFO[role].user.name;
    const behaviorEditable: StoreValue["behaviorEditable"] = (rec) => {
      if (rec.cancelled) return { ok: false, reason: "รายการนี้ถูกยกเลิกแล้ว" };
      if (rec.recordedByName !== currentUserName) return { ok: false, reason: `แก้ไขได้เฉพาะผู้บันทึก (${rec.recordedByName})` };
      const since = (rec.recordedAt ?? rec.occurredAt).slice(0, 10);
      if (shiftDate(since, behaviorScoreConfig.editDays) < DEMO_TODAY)
        return { ok: false, reason: `พ้นระยะเวลาแก้ไข ${behaviorScoreConfig.editDays} วันหลังบันทึกแล้ว` };
      return { ok: true };
    };

    const previewBehaviorChange: StoreValue["previewBehaviorChange"] = (recordId, change) => {
      const rec = behaviorRecords.find((r) => r.recordId === recordId)!;
      const lastWithdraw =
        watchDecisions
          .filter((d) => d.studentId === rec.studentId && d.withdraw)
          .map((d) => d.at)
          .sort()
          .at(-1) ?? "";
      const others = behaviorOf(rec.studentId)
        .filter((r) => r.recordId !== recordId)
        .map((r) => ({ delta: recordDelta(r), at: r.occurredAt }));
      const after =
        change === "cancel"
          ? others
          : [...others, { delta: change.ruleId === rec.ruleId ? recordDelta(rec) : deltaOf(change.ruleId), at: `${change.occurredOn}T${rec.occurredAt.split("T")[1] ?? "00:00:00"}` }];
      const scoreAfter = runningScore(after, behaviorScoreConfig);
      const levelAfter = Math.max(watchLevelOf(scoreAfter, behaviorScoreConfig), peakWatchLevel(after, behaviorScoreConfig, lastWithdraw));
      return {
        scoreBefore: behaviorScoreOf(rec.studentId),
        scoreAfter,
        levelBefore: behaviorWatchLevelOf(rec.studentId),
        levelAfter,
      };
    };

    const updateBehaviorRecord: StoreValue["updateBehaviorRecord"] = (recordId, patch) =>
      setBehaviorRecords((prev) =>
        prev.map((r) => {
          if (r.recordId !== recordId) return r;
          const occurredAt = `${patch.occurredOn}T${r.occurredAt.split("T")[1] ?? "00:00:00"}`;
          const changes = [
            patch.ruleId !== r.ruleId &&
              `พฤติกรรม: ${behaviorRules.find((x) => x.ruleId === r.ruleId)?.name} → ${behaviorRules.find((x) => x.ruleId === patch.ruleId)?.name}`,
            patch.occurredOn !== r.occurredAt.slice(0, 10) && "วันที่เกิดเหตุ",
            patch.description !== r.description && "รายละเอียด",
          ].filter(Boolean) as string[];
          return {
            ...r,
            ruleId: patch.ruleId,
            scoreDelta: patch.ruleId === r.ruleId ? r.scoreDelta : behaviorRules.find((x) => x.ruleId === patch.ruleId)?.scoreDelta,
            occurredAt,
            description: patch.description,
            backdateReason: patch.backdateReason ?? r.backdateReason,
            editHistory: [...(r.editHistory ?? []), { at: nowThaiIso(), by: currentUserName, changes }],
          };
        })
      );

    const cancelBehaviorRecord: StoreValue["cancelBehaviorRecord"] = (recordId, reason) =>
      setBehaviorRecords((prev) =>
        prev.map((r) => (r.recordId === recordId ? { ...r, cancelled: { at: nowThaiIso(), by: currentUserName, reason } } : r))
      );

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
          prev.filter((s) => s.studentId === studentId && s.round === sdqRound).map((s) => s.rater)
        );
        const created = raters
          .filter((r) => !existing.has(r.rater))
          .map<SdqAssessment>((r) => ({
            id: nextId("SDQ"),
            studentId,
            termId: CURRENT_TERM.termId,
            round: sdqRound,
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
          (s) => s.studentId === studentId && s.rater === rater && s.round === sdqRound
        );
        const base: SdqAssessment =
          idx >= 0
            ? prev[idx]
            : {
                id: nextId("SDQ"),
                studentId,
                termId: CURRENT_TERM.termId,
                round: sdqRound,
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
          editHistory:
            base.status === "completed" && base.assessedAt ? [...(base.editHistory ?? []), base.assessedAt] : base.editHistory,
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
          round: sdqRound,
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
      backdateReason,
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
        recordedByName: ROLE_INFO[role].user.name,
        recordedAt: now,
        scoreDelta: behaviorRules.find((r) => r.ruleId === ruleId)?.scoreDelta ?? 0,
        source,
        ...(backdateReason && { backdateReason }),
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
        status: visited ? "visit_confirmed" : "visit_disputed",
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

    const updateHomeVisit: StoreValue["updateHomeVisit"] = (appointmentId, result, changes) => {
      setHomeVisitRecords((prev) =>
        prev.map((r) =>
          r.appointmentId === appointmentId
            ? {
                ...r,
                ...result,
                editHistory: [...(r.editHistory ?? []), { by: CURRENT_TEACHER.name, at: nowThaiIso(), changes }],
              }
            : r
        )
      );
      const waitDays = assessmentWindows.find((w) => w.kind === "home_visit")?.confirmWaitDays ?? 3;
      patchAppointment(appointmentId, (a) => ({
        ...a,
        status: "awaiting_visit_confirmation",
        visitConfirmDeadline: shiftDate(DEMO_TODAY, waitDays),
        visitRespondedBy: undefined,
      }));
      clearDraft(draftKey("home_visit", appointmentId));
    };

    const issueCards: StoreValue["issueCards"] = (studentIds, type, expiresAt, reason) => {
      const today = nowThaiIso().split("T")[0];
      const created = studentIds.map((studentId): StudentCard => {
        const n = studentCards.filter((c) => c.studentId === studentId).length + 1;
        return {
          cardId: nextId("CARD"),
          code: `${studentId}-${n}`,
          studentId,
          type,
          reason: type === "replacement" ? reason : undefined,
          issuedAt: today,
          expiresAt,
          status: "active",
          physical: "none",
        };
      });
      setStudentCards((prev) => [
        ...prev.map((c) => (studentIds.includes(c.studentId) && c.status === "active" ? { ...c, status: "cancelled" as const } : c)),
        ...created,
      ]);
      return created;
    };

    const setCardPhysical: StoreValue["setCardPhysical"] = (cardId, physical) =>
      setStudentCards((prev) =>
        prev.map((c) => (c.cardId === cardId ? { ...c, physical, physicalAt: nowThaiIso() } : c))
      );

    const requestRegistryCorrection: StoreValue["requestRegistryCorrection"] = (input, delivered) =>
      setRegistryCorrections((prev) => [
        ...prev,
        { ...input, id: nextId("REG"), by: CURRENT_TEACHER.name, at: nowThaiIso(), status: delivered ? "sent" : "queued" },
      ]);

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

    const saveDcRound: StoreValue["saveDcRound"] = (round) =>
      setDcRounds((prev) => [round, ...prev.filter((r) => r.termId !== round.termId)]);
    const activeDcRound = dcRounds.find((r) => r.termId === CURRENT_TERM.termId && r.status === "open");
    // PROTOTYPE: ผลประเมินในต้นแบบเป็นของภาคเรียนปัจจุบันทั้งหมด
    const dcRoundHasResults = (termId: string) =>
      termId === CURRENT_TERM.termId && dcAssessments.some((a) => a.status === "submitted");

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
      sdqRound,
      sdqSetOf,
      eq,
      eqOf,
      saveEq,
      declineEq,
      reviews,
      sdqReview,
      eqReview,
      confirmReview,
      behaviorOf,
      behaviorScoreOf,
      behaviorScoreAt,
      behaviorWatchLevelOf,
      isBehaviorWatch,
      watchWithdrawalPending,
      resolveWatchWithdrawal,
      watchDecisions,
      caseOf,
      getDraft,
      saveDraft,
      saveScreening,
      saveRedFlag,
      saveNineS,
      saveSdq,
      addBehaviorRecord,
      behaviorEditable,
      recordableStudents,
      directory,
      canRecordStudent,
      behaviorVisible,
      updateBehaviorRecord,
      cancelBehaviorRecord,
      previewBehaviorChange,
      setAppointmentStatus,
      createAppointment,
      saveGuardianInfo,
      confirmAppointment,
      requestReschedule,
      resolveReschedule,
      respondVisit,
      saveHomeVisit,
      updateHomeVisit,
      registryCorrections,
      requestRegistryCorrection,
      studentCards,
      issueCards,
      setCardPhysical,
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
      dcRounds,
      saveDcRound,
      activeDcRound,
      dcRoundHasResults,
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
  }, [role, screenings, redFlags, nineS, sdq, eq, reviews, behaviorRecords, rawAppointments, careCases, homeVisitRecords, accessLogs, assessmentWindows, behaviorRules, behaviorScoreConfig, drafts, screeningWatch, educationDocuments, documentRequests, dcAssessments, readNotifications, dcRounds, watchDecisions, registryCorrections, studentCards]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore ต้องถูกเรียกภายใน StoreProvider");
  return ctx;
}

export { seedBehaviorRules as behaviorRules, dcSummaries };
