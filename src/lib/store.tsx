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
  staffNotificationSeeds as seedStaffEvents,
  notificationLogSeeds as seedNotificationLog,
  studentCards as seedCards,
  CURRENT_TEACHER,
  CURRENT_TERM,
  DEMO_TODAY,
  dcSummaries,
  educationDocuments as seedDocuments,
  homeVisitRecords as seedHomeVisitRecords,
  screenings as seedScreenings,
  redFlagSeeds,
  nineSSeeds,
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
import { formatThaiDate, nowThaiIso } from "./format";
import { INITIAL_RULE_EDIT_WINDOW, diffConfig, diffRules, type RuleEditWindow, type RuleSetVersion } from "./rule-sets";
import { usePathname } from "next/navigation";
import { DEFAULT_DC_CRITERIA, type DcRound } from "./dc-round";
import { canRevealCitizenId, defaultRoleFor, recordableRooms, ROLE_INFO, TEACHER_ASSIGNMENTS, type Role } from "./roles";
import { INITIAL_WINDOWS, KIND_HREF, KIND_LABEL, shiftDate, windowCoversRoom, windowFor, windowNotice, windowStatus, type AssessmentWindow } from "./periods";
import { EQ_DOMAIN_LABEL, EQ_DOMAINS, EQ_LEVEL_LABEL, scoreEq, type EqAnswer, type EqAssessment } from "./eq";
import { colorResults, type MentalStatus } from "./screening-view";
import { eqReviewInfo, needsReview, sdqReviewInfo, type AssessmentReview, type ReviewKind } from "./assessment-review";
import { sdqSummaryForParent } from "./portal";
import { DEFAULT_BEHAVIOR_SCORE, lastRecoveryAt, peakWatchLevel, runningScore, WATCH_NOTIFY_LABEL, watchLevelOf, type BehaviorScoreConfig } from "./behavior-score";
import { ruleKind } from "./behavior-rules";
import { academicYearOfDate } from "./terms";
import { isFor, type NotificationLogEntry, type StaffNotification } from "./staff-notifications";
import {
  AccessLog,
  ChangeLogEntry,
  ExportLogEntry,
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
  RISK_LABEL,
  SDQ_LEVEL_LABEL,
  SDQ_RATER_LABEL,
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
  exportLog: ExportLogEntry[];
  changeLog: ChangeLogEntry[];
  /** บันทึกประวัติการแก้ไข merge = รวมกับรายการเดิมของคนเดียวกันที่เพิ่งแก้ภายใน 5 นาที (พิมพ์ต่อเนื่องไม่แตกเป็นหลายรายการ) */
  logChange: (
    entity: ChangeLogEntry["entity"],
    ref: string,
    summary: string,
    changes: ChangeLogEntry["changes"],
    merge?: boolean
  ) => void;
  /** บันทึกการส่งออกและคืนข้อมูลผู้ส่งออก/เวลา ไว้ใส่ในไฟล์ */
  logExport: (scope: string) => [string, string][];
  /** ช่วงเวลาดำเนินงานที่ผู้ดูแลระบบตั้งในหน้าตั้งค่า (UC4 Scenario A, UC9) */
  assessmentWindows: AssessmentWindow[];
  setAssessmentWindows: React.Dispatch<React.SetStateAction<AssessmentWindow[]>>;
  /** กฎความประพฤติชุดเดียว หน้าตั้งค่าแก้ ตัวบันทึกและการคิดคะแนนอ่านจากที่นี่ (UC7, UC8) */
  behaviorRules: BehaviorRule[];
  setBehaviorRules: React.Dispatch<React.SetStateAction<BehaviorRule[]>>;
  /**
   * ชุดกฎแบบมีเวอร์ชัน (UC7 สถานการณ์ A, E): behaviorRules คือชุดที่ใช้งานอยู่ แก้ผ่านฉบับร่างแล้วเผยแพร่พร้อมวันเริ่มใช้เท่านั้น
   * ruleVersions = ชุดที่เคยมีผลแล้ว (เรียงเก่าไปใหม่) · scheduledRuleSet = เผยแพร่แล้วแต่ยังไม่ถึงวันเริ่มใช้
   */
  ruleVersions: RuleSetVersion[];
  scheduledRuleSet: RuleSetVersion | null;
  ruleDraft: BehaviorRule[] | null;
  setRuleDraft: React.Dispatch<React.SetStateAction<BehaviorRule[] | null>>;
  /** ค่าตั้งต้นคะแนนและเกณฑ์เฝ้าระวังในฉบับร่าง (มีคู่กับ ruleDraft เสมอ) */
  configDraft: BehaviorScoreConfig | null;
  setConfigDraft: React.Dispatch<React.SetStateAction<BehaviorScoreConfig | null>>;
  /** ค่าตั้งต้นที่มีผลในวันที่ระบุ ใช้คิดคะแนนของแต่ละรายการตามวันที่เกิดพฤติกรรม ("" = ที่ใช้อยู่ตอนนี้) */
  configOn: (date: string) => BehaviorScoreConfig;
  ruleEditWindow: RuleEditWindow;
  setRuleEditWindow: (window: RuleEditWindow) => void;
  /** PROTOTYPE: จำลองว่าวันนี้อยู่ในช่วงที่แก้กฎได้ ใช้โชว์ทั้งสองสถานะเพราะวันตัวอย่างอยู่กลางภาคเรียน */
  simulateRuleEditOpen: boolean;
  setSimulateRuleEditOpen: (on: boolean) => void;
  /** วันนี้อยู่ในช่วงที่แก้กฎได้ (หรือกำลังจำลอง) */
  ruleEditOpen: boolean;
  /** กฎที่มีผลในวันที่ระบุ (UC8 ข้อ 6 ตรวจตอนบันทึกย้อนหลัง) */
  rulesOn: (date: string) => BehaviorRule[];
  startRuleDraft: () => void;
  discardRuleDraft: () => void;
  /** เผยแพร่ฉบับร่าง วันเริ่มใช้ไม่เกินวันนี้ = มีผลทันที ไม่งั้นรอถึงวันเริ่มใช้ (สถานการณ์ E) */
  publishRuleDraft: (effectiveFrom: string, reason: string) => "applied" | "scheduled";
  /** เรียกฉบับที่รอวันเริ่มใช้กลับมาเป็นฉบับร่าง */
  recallScheduledRules: () => void;
  /** PROTOTYPE: จำลองว่าถึงวันเริ่มใช้ของฉบับที่รออยู่ (Alt-D) */
  activateScheduledRules: () => void;
  /** คะแนนเริ่มต้น เพดาน คะแนนต่ำสุด และเกณฑ์เฝ้าระวังหลายระดับ ที่ผู้ดูแลระบบตั้ง (UC7 Scenario D) */
  behaviorScoreConfig: BehaviorScoreConfig;
  setBehaviorScoreConfig: (config: BehaviorScoreConfig) => void;

  getStudent: (studentId: string) => Student | undefined;
  latestScreening: (studentId: string) => Screening | undefined;
  overallRiskOf: (studentId: string) => RiskGroup | null;
  /** มิติที่ 6 สุขภาพจิต: รอประเมิน / ควรดูแล / ไม่ต้องดูแลเพิ่ม (ไม่ใช้สี) */
  mentalStatusOf: (studentId: string, termId?: string) => MentalStatus | null;
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
  /** วันที่คะแนนกลับเข้าเกณฑ์ วันครบกำหนดยืนยันถอน และเลยกำหนดหรือยัง (UC8 Alt-F) ไม่ได้รอยืนยัน = null */
  withdrawalWait: (studentId: string) => { since: string; dueOn: string; overdue: boolean } | null;
  /** การแจ้งเตือนของผู้ใช้ปัจจุบัน (กระดิ่งที่หัวหน้า) ใหม่สุดก่อน */
  staffNotifications: StaffNotification[];
  /** บันทึกการส่งที่ไม่มีกล่องรับในต้นแบบ (อีเมล / ผู้รับตามระดับ) แสดงในประวัติการใช้งานของผู้ดูแลระบบ ไม่มีชื่อนักเรียน */
  notificationLog: NotificationLogEntry[];
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
  /** ครูเลื่อนนัดที่ยังไม่ถึงวันเยี่ยม: ล้างการยืนยันเดิมและคำขอเปลี่ยนวันที่ค้าง แจ้งนักเรียนและผู้ปกครอง รอยืนยันนัดใหม่ (Scenario F) */
  postponeAppointment: (appointmentId: string, newDateTime: string) => void;
  /** ครูยกเลิกนัดพร้อมเหตุผล แล้วนัดหมายใหม่ตามสถานการณ์ B (Scenario F) */
  cancelAppointment: (appointmentId: string, reason: string) => void;
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
  /**
   * ครูที่ปรึกษาพิจารณาเปิด case จากเฝ้าระวังด้านความประพฤติ / บันทึกตามกฎส่งต่อ แล้วเลือกยังไม่เปิด (UC8 Alt-D ข้อ 2, Alt-G)
   * basis คือเหตุที่พิจารณา ถ้ามีเหตุใหม่ (ระดับเฝ้าระวังเพิ่ม หรือมีบันทึกส่งต่อใหม่) งานจะกลับมาให้พิจารณาอีก
   */
  caseConsiderations: Record<string, { basis: string; reason: string; at: string; by: string }>;
  considerCase: (studentId: string, basis: string, reason: string) => void;
  addFollowup: (caseId: string, actionTaken: string, result: string, nextFollowupDate: string) => void;
  setCaseUrgency: (caseId: string, urgency: CaseUrgency) => void;
  /** ปิด case พร้อมผลสรุป (UC11 Scenario C) */
  closeCase: (caseId: string, summary: string) => void;
  /** ครูตรวจเอกสารส่งต่อแล้วส่งให้ผู้ดูแลระบบเก็บรักษา case ยังเปิดอยู่ (UC11 Scenario D) */
  sendReferral: (caseId: string) => void;
  /** ผู้ดูแลระบบเปลี่ยนสถานะเอกสารส่งต่อ โดยไม่เปิดอ่านเนื้อหา (Scenario D ข้อ 6) */
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
  /** ผลล่าสุดที่ส่งแล้วของนักเรียนในภาคเรียนนั้น (ค่าเริ่มต้นภาคปัจจุบัน) ใช้ทำ ปพ.4 / ปพ.6 / ปพ.3 */
  dcResultOf: (studentId: string, termId?: string) => DcSummary | undefined;
  /** รอบล่าสุดของนักเรียนในภาคเรียนนั้น (รวมร่าง ค่าเริ่มต้นภาคปัจจุบัน) */
  latestDc: (studentId: string, termId?: string) => DcAssessment | undefined;
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
  const [redFlags, setRedFlags] = useState<RedFlagAssessment[]>(redFlagSeeds);
  const [nineS, setNineS] = useState<NineSAssessment[]>(nineSSeeds);
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
  const [exportLog, setExportLog] = useState<ExportLogEntry[]>([]);
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([]);
  const [assessmentWindows, setAssessmentWindows] = useState<AssessmentWindow[]>(INITIAL_WINDOWS);
  const [behaviorRules, setBehaviorRules] = useState<BehaviorRule[]>(seedBehaviorRules);
  const [ruleVersions, setRuleVersions] = useState<RuleSetVersion[]>(() => [
    {
      versionId: "RS-1",
      number: 1,
      effectiveFrom: "2569-05-01",
      rules: seedBehaviorRules,
      config: DEFAULT_BEHAVIOR_SCORE,
      publishedAt: "2569-04-20T09:00:00",
      publishedBy: "ค่าตั้งต้นของโรงเรียน",
      reason: "ชุดกฎตั้งต้น",
    },
  ]);
  const [scheduledRuleSet, setScheduledRuleSet] = useState<RuleSetVersion | null>(null);
  const [ruleDraft, setRuleDraft] = useState<BehaviorRule[] | null>(null);
  const [configDraft, setConfigDraft] = useState<BehaviorScoreConfig | null>(null);
  const [ruleEditWindow, setRuleEditWindow] = useState<RuleEditWindow>(INITIAL_RULE_EDIT_WINDOW);
  const [simulateRuleEditOpen, setSimulateRuleEditOpen] = useState(false);
  const [behaviorScoreConfig, setBehaviorScoreConfig] = useState<BehaviorScoreConfig>(DEFAULT_BEHAVIOR_SCORE);
  const [drafts, setDrafts] = useState<Record<string, unknown>>({});
  const [dcAssessments, setDcAssessments] = useState<DcAssessment[]>(() => [
    // ข้อมูลตัวอย่างภาคเรียนปัจจุบัน: คนที่ประเมินครบ 8 ข้อถือว่าส่งแล้ว ที่ยังขาดเป็นร่าง
    ...dcSummaries.map<DcAssessment>((d, i) => ({
      id: `DC-SEED-${i}`,
      studentId: d.studentId,
      termId: CURRENT_TERM.termId,
      round: 1,
      levels: d.levels,
      note: "",
      status: Object.values(d.levels).some((l) => l === null) ? "draft" : "submitted",
      assessedAt: "2570-02-10",
      assessedBy: CURRENT_TEACHER.name,
    })),
    // ภาคเรียนก่อนหน้า (1/2569) ส่งผลครบแล้วทุกคน ใช้เทียบและเลือกดูย้อนหลัง
    ...dcSummaries.map<DcAssessment>((d, i) => ({
      id: `DC-SEED-PREV-${i}`,
      studentId: d.studentId,
      termId: "T2569-1",
      round: 1,
      levels: Object.fromEntries(
        Object.entries(d.levels).map(([k, v]) => [Number(k), (v == null ? 2 : Math.max(d.studentId === "30131" ? 0 : 1, v - (Number(k) % 3 === i % 3 ? 1 : 0))) as DcLevel])
      ),
      note: "",
      status: "submitted",
      assessedAt: "2569-10-20",
      assessedBy: CURRENT_TEACHER.name,
    })),
  ]);
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
  const [staffEvents, setStaffEvents] = useState<StaffNotification[]>(seedStaffEvents);
  const [notificationLog, setNotificationLog] = useState<NotificationLogEntry[]>(seedNotificationLog);
  const [caseConsiderations, setCaseConsiderations] = useState<StoreValue["caseConsiderations"]>({});

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
    // ดูรายการพฤติกรรมของนักเรียนทุกคนในห้องที่รับผิดชอบหรือสอน (ตาราง 3.4) ส่วนการแก้ไข/ยกเลิกได้เฉพาะรายการของตน (behaviorEditable)
    const behaviorVisible = (rec: BehaviorRecord) => {
      const room = getStudent(rec.studentId)?.roomName;
      return (!!room && recordableRooms(role).includes(room)) || rec.recordedByName === ROLE_INFO[role].user.name;
    };

    const latestScreening = (studentId: string) =>
      screenings
        .filter((s) => s.studentId === studentId)
        .sort((a, b) => b.screenedAt.localeCompare(a.screenedAt))[0];

    /** สถานะมิติสุขภาพจิตของภาคเรียนนั้น: ภาคปัจจุบันดูจากผล Red Flag/9S ภาคก่อนที่ไม่มีผลประเมินใช้ผลที่เก็บในการคัดกรอง ไม่มีการคัดกรอง = null */
    const mentalStatusOf = (studentId: string, termId: string = CURRENT_TERM.termId): MentalStatus | null => {
      const sc = screenings.find((s) => s.studentId === studentId && s.termId === termId);
      if (!sc) return null;
      const rf = redFlags.find((r) => r.studentId === studentId && r.termId === termId);
      const n9 = nineS.find((r) => r.studentId === studentId && r.termId === termId);
      if (!rf) {
        if (termId === CURRENT_TERM.termId) return "pending";
        const g = sc.results.find((r) => r.dimension === "mental")?.group ?? "green";
        return g === "green" ? "no_more_care" : "needs_care";
      }
      if (rf.result === "needs_care") return "needs_care";
      if (!n9) return "pending";
      return n9.result === "needs_care" ? "needs_care" : "no_more_care";
    };

    const overallRiskOf = (studentId: string): RiskGroup | null => {
      const sc = latestScreening(studentId);
      if (!sc) return null;
      // กลุ่มสีมาจาก 5 มิติแรก มิติสุขภาพจิตแสดงแยกเป็น ควรดูแล / ไม่ต้องดูแลเพิ่ม (UC6 สถานการณ์ B)
      const groups = colorResults(sc.results).map((r) => r.group);
      if (groups.includes("red")) return "red";
      if (groups.includes("amber")) return "amber";
      return "green";
    };

    const sdqOf = (studentId: string) => sdq.filter((s) => s.studentId === studentId);
    const eqOf = (studentId: string) => eq.find((e) => e.studentId === studentId && e.termId === CURRENT_TERM.termId);
    const reviewOf = (studentId: string, kind: ReviewKind) =>
      reviews
        .filter((r) => r.studentId === studentId && r.kind === kind && (kind !== "sdq" || (r.round ?? 1) === sdqRound))
        .sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt))[0];
    const sdqWindow = windowFor(assessmentWindows, "sdq");
    const sdqRound: 1 | 2 = sdqWindow?.round ?? 1;
    const sdqSetOf = (studentId: string, round: 1 | 2 = sdqRound) =>
      sdqOf(studentId).filter((x) => x.round === round && x.termId === CURRENT_TERM.termId);
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
      const prevEq = eqOf(studentId);
      if (prevEq?.status === "completed") {
        const next = scoreEq(answers).levels;
        const diff = EQ_DOMAINS.map((d) => ({
          label: `EQ ด้าน${EQ_DOMAIN_LABEL[d]}`,
          from: prevEq.levels ? EQ_LEVEL_LABEL[prevEq.levels[d]] : "-",
          to: next ? EQ_LEVEL_LABEL[next[d]] : "-",
        })).filter((c) => c.from !== c.to);
        logChange("assessment", studentId, "นักเรียนแก้คำตอบ EQ", diff.length > 0 ? diff : [{ label: "ผล EQ", from: "เดิม", to: "ไม่เปลี่ยน" }]);
      }
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

    /** ค่าตั้งต้นที่มีผลในวันที่ระบุ ว่าง = ที่ใช้อยู่ตอนนี้ (ใช้คิดคะแนนต่อรายการ) */
    const configOn = (date: string): BehaviorScoreConfig => {
      if (date === "") return behaviorScoreConfig;
      const sorted = [...ruleVersions].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
      return (sorted.filter((v) => v.effectiveFrom <= date.slice(0, 10)).at(-1) ?? sorted[0]).config;
    };

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
    /** คะแนนเริ่มใหม่ทุกปีการศึกษา จึงนับเฉพาะรายการของปีที่ระบุ (ค่าเริ่มต้น = ปีปัจจุบัน) */
    const scoreItems = (studentId: string, year: number = CURRENT_TERM.academicYear) =>
      behaviorOf(studentId)
        .filter((rec) => academicYearOfDate(rec.occurredAt) === year)
        .map((rec) => ({ delta: recordDelta(rec), at: rec.occurredAt }));

    const behaviorScoreOf = (studentId: string, extra?: { delta: number; at: string }) => {
      const items = scoreItems(studentId);
      return runningScore(extra ? [...items, extra] : items, configOn);
    };

    // คะแนน ณ เวลานั้น คิดในปีการศึกษาของเวลานั้น
    const behaviorScoreAt = (studentId: string, at: string) =>
      runningScore(scoreItems(studentId, academicYearOfDate(at)).filter((i) => i.at <= at), configOn);

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
      const peak = peakWatchLevel(extra ? [...items, extra] : items, configOn, lastWithdraw);
      return Math.max(currentWatchLevel(studentId, extra), peak);
    };

    const isBehaviorWatch = (studentId: string) => behaviorWatchLevelOf(studentId) > 0;

    const watchWithdrawalPending = (studentId: string) =>
      behaviorWatchLevelOf(studentId) > currentWatchLevel(studentId);

    const resolveWatchWithdrawal: StoreValue["resolveWatchWithdrawal"] = (studentId, withdraw, reason = "") => {
      setWatchDecisions((prev) => [
        ...prev,
        { studentId, at: nowThaiIso(), by: CURRENT_TEACHER.name, withdraw, reason },
      ]);
      // ถอนสถานะแล้วแจ้งนักเรียนและผู้ปกครองในระบบ (สถานการณ์ C ข้อ 5) นักเรียน/ผู้ปกครองเห็นจากรายการแจ้งเตือนในพอร์ทัล
      if (withdraw) {
        const room = getStudent(studentId)?.roomName ?? "";
        logSend("ในระบบ", "นักเรียน, ผู้ปกครอง", `ถอนสถานะเฝ้าระวังของนักเรียนห้อง ${room} (ครูที่ปรึกษายืนยันแล้ว)`);
      }
    };

    // ----- การแจ้งเตือนของครูและผู้ดูแลระบบ (UC8 Alt-D, Alt-F, Alt-G)
    function addStaffEvent(n: Omit<StaffNotification, "id">) {
      setStaffEvents((prev) => [{ ...n, id: nextId("NT") }, ...prev]);
    }
    function logSend(channel: NotificationLogEntry["channel"], to: string, text: string) {
      setNotificationLog((prev) => [{ id: nextId("NL"), at: nowThaiIso(), channel, to, text }, ...prev]);
    }
    /** ครูที่ปรึกษาของห้องตามการมอบหมาย */
    const homeroomTeacherOf = (room: string) => {
      const r = (Object.keys(TEACHER_ASSIGNMENTS) as Role[]).find((k) => TEACHER_ASSIGNMENTS[k]?.homeroomRoom === room);
      return r ? ROLE_INFO[r].user.name : undefined;
    };
    /** เข้าหรือขึ้นระดับเฝ้าระวัง: แจ้งครูที่ปรึกษา ครูที่บันทึก นักเรียน ผู้ปกครอง (ในระบบและอีเมล) และผู้ที่ผู้ดูแลระบบกำหนดไว้ของระดับนั้น */
    const notifyWatchRaised = (studentId: string, before: number, after: number, recorder: string, score: number) => {
      if (after <= before) return;
      const st = getStudent(studentId);
      if (!st) return;
      const title = before === 0 ? `${st.fullName} เข้าสถานะเฝ้าระวัง` : `${st.fullName} ขึ้นเป็นเฝ้าระวังระดับ ${after}`;
      const body = `ระดับ ${after} · คะแนนคงเหลือ ${score} · บันทึกโดย ${recorder}`;
      const href = `/students/${studentId}`;
      const at = nowThaiIso();
      addStaffEvent({ kind: "watch_raised", title, body, href, at, to: { homeroomOf: st.roomName } });
      if (homeroomTeacherOf(st.roomName) !== recorder) addStaffEvent({ kind: "watch_raised", title, body, href, at, to: { userName: recorder } });
      const where = `นักเรียนห้อง ${st.roomName}`;
      logSend("ในระบบ", "ครูที่ปรึกษา, ครูที่บันทึก, นักเรียน, ผู้ปกครอง", `${where} ${before === 0 ? "เข้า" : "ขึ้นเป็น"}สถานะเฝ้าระวังระดับ ${after}`);
      logSend("อีเมล (จำลอง)", "ผู้ปกครอง", `${where} ${before === 0 ? "เข้า" : "ขึ้นเป็น"}สถานะเฝ้าระวังระดับ ${after}`);
      const extra = behaviorScoreConfig.watchLevels
        .slice(0, after)
        .flatMap((l) => l.notify)
        .filter((n, i, all) => all.indexOf(n) === i)
        .map((n) => WATCH_NOTIFY_LABEL[n]);
      if (extra.length > 0) logSend("ในระบบ", extra.join(", "), `${where} สถานะเฝ้าระวังระดับ ${after} ตามที่กำหนดไว้ในหน้าตั้งค่า`);
    };

    const withdrawalWait: StoreValue["withdrawalWait"] = (studentId) => {
      if (!watchWithdrawalPending(studentId)) return null;
      const items = scoreItems(studentId);
      const since = (lastRecoveryAt(items, configOn) ?? items.map((i) => i.at).sort().at(-1) ?? DEMO_TODAY).slice(0, 10);
      const dueOn = shiftDate(since, behaviorScoreConfig.withdrawalWaitDays);
      return { since, dueOn, overdue: DEMO_TODAY > dueOn };
    };

    /** เหตุการณ์ตามเวลา: รอยืนยันถอนสถานะ และเลยกำหนด (เตือนครูที่ปรึกษาซ้ำ + แจ้งผู้ดูแลระบบโดยไม่ระบุชื่อ) */
    const derivedStaffEvents = (): StaffNotification[] => {
      const out: StaffNotification[] = [];
      const overdueByRoom: Record<string, number> = {};
      for (const st of students) {
        const w = withdrawalWait(st.studentId);
        if (!w) continue;
        const href = "/behavior/withdrawals";
        out.push({
          id: `wd-${st.studentId}-${w.since}`,
          kind: "watch_pending",
          title: `${st.fullName} คะแนนกลับเข้าเกณฑ์แล้ว`,
          body: "รอคุณยืนยันถอนสถานะเฝ้าระวัง ระบบไม่ถอนให้เอง",
          href,
          at: `${w.since}T08:00:00`,
          to: { homeroomOf: st.roomName },
        });
        if (w.overdue) {
          out.push({
            id: `wdo-${st.studentId}-${w.dueOn}`,
            kind: "watch_overdue",
            title: `เลยกำหนดยืนยันถอนสถานะ ${st.fullName}`,
            body: `รอมาเกิน ${behaviorScoreConfig.withdrawalWaitDays} วันแล้ว ระบบคงสถานะเฝ้าระวังไว้`,
            href,
            at: `${w.dueOn}T08:00:00`,
            to: { homeroomOf: st.roomName },
          });
          overdueByRoom[st.roomName] = (overdueByRoom[st.roomName] ?? 0) + 1;
        }
      }
      // UC11 Alt-B: ใกล้ถึง/เลยวันติดตามของ case ที่เปิดอยู่ (ผู้ดูแลระบบได้รับเฉพาะจำนวน ไม่ระบุชื่อนักเรียน)
      const followupOverdueByRoom: Record<string, number> = {};
      for (const c of careCases) {
        if (c.status !== "active" || !c.nextFollowupDate) continue;
        const st = students.find((x) => x.studentId === c.studentId);
        if (!st) continue;
        const href = `/care-cases?student=${c.studentId}`;
        if (c.nextFollowupDate < DEMO_TODAY) {
          out.push({
            id: `fo-${c.caseId}-${c.nextFollowupDate}`,
            kind: "followup_overdue",
            title: `เลยวันติดตาม ${st.fullName}`,
            body: `${c.caseId} · ครบกำหนด ${c.nextFollowupDate} ยังไม่บันทึกผลติดตาม`,
            href,
            at: `${c.nextFollowupDate}T08:00:00`,
            to: { homeroomOf: st.roomName },
          });
          followupOverdueByRoom[st.roomName] = (followupOverdueByRoom[st.roomName] ?? 0) + 1;
        } else if (c.nextFollowupDate <= shiftDate(DEMO_TODAY, 3)) {
          out.push({
            id: `fd-${c.caseId}-${c.nextFollowupDate}`,
            kind: "followup_due",
            title: `ใกล้ถึงวันติดตาม ${st.fullName}`,
            body: `${c.caseId} · นัดติดตาม ${c.nextFollowupDate}`,
            href,
            at: `${DEMO_TODAY}T08:00:00`,
            to: { homeroomOf: st.roomName },
          });
        }
      }
      for (const [room, n] of Object.entries(followupOverdueByRoom))
        out.push({
          id: `fo-admin-${room}-${n}`,
          kind: "followup_overdue_admin",
          title: "มีกรณีติดตามช่วยเหลือเลยกำหนด",
          body: `ห้อง ${room} · ${n} กรณี · เตือนครูที่ปรึกษาแล้ว`,
          at: `${DEMO_TODAY}T08:00:00`,
          to: { role: "admin" },
        });
      // UC11 Scenario D: ครูส่งเอกสารส่งต่อ → แจ้งผู้ดูแลระบบให้เก็บรักษา (เห็นเลขเอกสารและผู้ส่ง ไม่เห็นชื่อนักเรียน)
      for (const c of careCases)
        if (c.referral && c.referral.status === "awaiting_admin")
          out.push({
            id: `rf-${c.referral.referralId}`,
            kind: "referral_sent",
            title: "มีเอกสารส่งต่อรอรับเก็บรักษา",
            body: `${c.referral.referralId} · ส่งโดย ${c.referral.sentByName}`,
            href: "/documents",
            at: `${c.referral.preparedAt.slice(0, 10)}T08:00:00`,
            to: { role: "admin" },
          });
      // UC10: แจ้งครูที่ปรึกษาให้ตรวจผล SDQ / EQ (ตอบครบ, ปิดรอบแล้วมีผู้ไม่ตอบพร้อมบอกฝ่ายที่ยังไม่ตอบ, แก้คำตอบหลังตรวจ)
      for (const st of students) {
        const href = `/assessment/review/${st.studentId}`;
        const sdqInfo = sdqReview(st.studentId);
        if (needsReview(sdqInfo.state)) {
          const set = sdqSetOf(st.studentId);
          const missing = (["teacher", "student", "parent"] as const).filter(
            (r) => !set.some((x) => x.rater === r && x.status === "completed")
          );
          const lastAt = set.map((x) => x.assessedAt ?? "").sort().at(-1) || `${DEMO_TODAY}T08:00:00`;
          out.push({
            id: `rv-sdq-${st.studentId}-${sdqInfo.state}-${lastAt}`,
            kind: "review_pending",
            title: `ผล SDQ รอตรวจ ${st.fullName}`,
            body:
              sdqInfo.state === "closed_incomplete"
                ? `ปิดรอบแล้ว ยังไม่ตอบ: ${missing.map((r) => SDQ_RATER_LABEL[r]).join(", ")}`
                : sdqInfo.state === "re_review"
                  ? "มีการแก้คำตอบหลังตรวจ ต้องตรวจใหม่"
                  : "ตอบครบ 3 ฝ่ายแล้ว ตรวจก่อนเปิดให้นักเรียนและผู้ปกครองเห็น",
            href,
            at: lastAt,
            to: { homeroomOf: st.roomName },
          });
        }
        const eqInfo = eqReview(st.studentId);
        if (needsReview(eqInfo.state)) {
          const e = eqOf(st.studentId);
          out.push({
            id: `rv-eq-${st.studentId}-${eqInfo.state}-${e?.assessedAt ?? ""}`,
            kind: "review_pending",
            title: `ผล EQ รอตรวจ ${st.fullName}`,
            body: eqInfo.state === "re_review" ? "นักเรียนแก้คำตอบหลังตรวจ ต้องตรวจใหม่" : "นักเรียนทำเสร็จแล้ว ตรวจก่อนเปิดให้เห็นผล",
            href,
            at: e?.assessedAt ?? `${DEMO_TODAY}T08:00:00`,
            to: { homeroomOf: st.roomName },
          });
        }
      }
      // UC9: แจ้งผู้ตอบเมื่อเปิดรอบ และเตือนก่อนปิดรอบ (ครูของห้องที่อยู่ในกลุ่มเป้าหมาย)
      const rooms = [...new Set(students.map((st) => st.roomName))];
      for (const w of assessmentWindows) {
        const notice = windowNotice(w);
        if (!notice || !w.raters.includes("teacher") || (w.termId ?? CURRENT_TERM.termId) !== CURRENT_TERM.termId) continue;
        const name = w.label || KIND_LABEL[w.kind];
        for (const room of rooms.filter((r) => windowCoversRoom(w, r)))
          out.push({
            id: `win-${w.id}-${notice}-${room}`,
            kind: notice === "opened" ? "window_opened" : "window_closing",
            title: notice === "opened" ? `เปิดรอบ ${name}` : `ใกล้ปิดรอบ ${name}`,
            body: notice === "opened" ? `ทำได้ถึง ${w.closeDate}` : `ปิดรับ ${w.closeDate} ดูงานที่ยังไม่ทำที่หน้าภาพรวม`,
            href: KIND_HREF[w.kind],
            at: notice === "opened" ? `${w.openDate}T08:00:00` : `${DEMO_TODAY}T08:00:00`,
            to: { homeroomOf: room },
          });
      }
      for (const [room, n] of Object.entries(overdueByRoom))
        out.push({
          id: `wdo-admin-${room}-${n}`,
          kind: "watch_overdue_admin",
          title: "มีนักเรียนรอยืนยันถอนสถานะเฝ้าระวังเกินกำหนด",
          body: `ห้อง ${room} · ${n} คน · เตือนครูที่ปรึกษาซ้ำแล้ว`,
          at: `${DEMO_TODAY}T08:00:00`,
          to: { role: "admin" },
        });
      return out;
    };
    const viewer = { role, name: ROLE_INFO[role].user.name, homeroom: TEACHER_ASSIGNMENTS[role]?.homeroomRoom };
    const staffNotifications = [...staffEvents, ...derivedStaffEvents()]
      .filter((n) => isFor(n, viewer))
      .sort((a, b) => b.at.localeCompare(a.at));

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
        .filter((r) => r.recordId !== recordId && academicYearOfDate(r.occurredAt) === academicYearOfDate(rec.occurredAt))
        .map((r) => ({ delta: recordDelta(r), at: r.occurredAt }));
      const after =
        change === "cancel"
          ? others
          : [...others, { delta: change.ruleId === rec.ruleId ? recordDelta(rec) : deltaOf(change.ruleId), at: `${change.occurredOn}T${rec.occurredAt.split("T")[1] ?? "00:00:00"}` }];
      const scoreAfter = runningScore(after, configOn);
      const levelAfter = Math.max(watchLevelOf(scoreAfter, behaviorScoreConfig), peakWatchLevel(after, configOn, lastWithdraw));
      return {
        scoreBefore: behaviorScoreOf(rec.studentId),
        scoreAfter,
        levelBefore: behaviorWatchLevelOf(rec.studentId),
        levelAfter,
      };
    };

    const updateBehaviorRecord: StoreValue["updateBehaviorRecord"] = (recordId, patch) => {
      const target = behaviorRecords.find((r) => r.recordId === recordId);
      if (target) {
        const p = previewBehaviorChange(recordId, { ruleId: patch.ruleId, occurredOn: patch.occurredOn });
        notifyWatchRaised(target.studentId, p.levelBefore, p.levelAfter, ROLE_INFO[role].user.name, p.scoreAfter);
      }
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
    };

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
        careMethods: [],
        goal: "",
        targetDate: "",
        urgency: "urgent",
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

    const considerCase: StoreValue["considerCase"] = (studentId, basis, reason) =>
      setCaseConsiderations((prev) => ({
        ...prev,
        [studentId]: { basis, reason, at: nowThaiIso().split("T")[0], by: ROLE_INFO[role].user.name },
      }));

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
      const before = screenings.find((s) => s.studentId === studentId && s.termId === record.termId);
      if (before) {
        const diff = colorResults(record.results)
          .map((r) => ({ label: DIMENSION_LABEL[r.dimension], from: RISK_LABEL[before.results.find((x) => x.dimension === r.dimension)?.group ?? "green"], to: RISK_LABEL[r.group] }))
          .filter((c) => c.from !== c.to);
        logChange("screening", studentId, "คัดกรองซ้ำ แก้ผลเดิมของภาคเรียนนี้", diff.length > 0 ? diff : [{ label: "ผลคัดกรอง", from: "เดิม", to: "ไม่เปลี่ยน" }]);
      }
      setScreenings((prev) => [record, ...prev.filter((s) => !(s.studentId === studentId && s.termId === record.termId))]);
      clearDraft(draftKey("screening", studentId));
      // มีมิติที่มีปัญหา (แดง) -> ระบบเปิดหรือเชื่อม case เอง (UC6 ข้อ 13)
      const red = colorResults(record.results).filter((r) => r.group === "red").map((r) => DIMENSION_LABEL[r.dimension]);
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
          prev.filter((s) => s.studentId === studentId && s.round === sdqRound && s.termId === CURRENT_TERM.termId).map((s) => s.rater)
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
      // แก้คำตอบที่ส่งแล้ว: เก็บผู้แก้ วันเวลา และผลที่เปลี่ยน
      const prevSdq = sdq.find(
        (x) => x.studentId === studentId && x.rater === rater && x.round === sdqRound && x.termId === CURRENT_TERM.termId
      );
      if (prevSdq?.status === "completed") {
        const label = (l: SdqAssessment["level"]) => (l ? SDQ_LEVEL_LABEL[l] : "-");
        const diff = [
          { label: "คะแนนรวม", from: String(prevSdq.totalDifficulties ?? "-"), to: String(totalDifficulties) },
          { label: "ระดับ", from: label(prevSdq.level), to: label(level) },
        ].filter((c) => c.from !== c.to);
        logChange(
          "assessment",
          studentId,
          `แก้คำตอบ SDQ รอบที่ ${sdqRound} ฉบับ${SDQ_RATER_LABEL[rater]}`,
          diff.length > 0 ? diff : [{ label: "ผล SDQ", from: "เดิม", to: "ไม่เปลี่ยน" }]
        );
      }

      setSdq((prev) => {
        const idx = prev.findIndex(
          (s) => s.studentId === studentId && s.rater === rater && s.round === sdqRound && s.termId === CURRENT_TERM.termId
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

    const ruleEditOpen = simulateRuleEditOpen || (DEMO_TODAY >= ruleEditWindow.open && DEMO_TODAY <= ruleEditWindow.close);

    const rulesOn: StoreValue["rulesOn"] = (date) => {
      const sorted = [...ruleVersions].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
      return (sorted.filter((v) => v.effectiveFrom <= date).at(-1) ?? sorted[0]).rules;
    };

    const copyConfig = (c: BehaviorScoreConfig): BehaviorScoreConfig => ({
      ...c,
      watchLevels: c.watchLevels.map((l) => ({ ...l, notify: [...l.notify] })),
    });

    const startRuleDraft = () => {
      if (!ruleEditOpen || scheduledRuleSet || ruleDraft) return;
      setRuleDraft(behaviorRules.map((r) => ({ ...r })));
      setConfigDraft(copyConfig(behaviorScoreConfig));
    };

    const discardRuleDraft = () => {
      setRuleDraft(null);
      setConfigDraft(null);
    };

    /** ระดับเฝ้าระวังตามคะแนนตอนนี้ภายใต้กฎและค่าตั้งต้นที่กำหนด ใช้เทียบก่อน/หลังชุดใหม่เริ่มใช้ */
    const levelsUnder = (rules: BehaviorRule[], source: (at: string) => BehaviorScoreConfig, current: BehaviorScoreConfig) =>
      Object.fromEntries(
        students.map((st) => {
          const items = behaviorRecords
            .filter((rec) => rec.studentId === st.studentId && academicYearOfDate(rec.occurredAt) === CURRENT_TERM.academicYear)
            .map((rec) => {
              const rule = rules.find((r) => r.ruleId === rec.ruleId);
              return { delta: rec.cancelled || !rule || rule.cancelled ? 0 : (rec.scoreDelta ?? rule.scoreDelta), at: rec.occurredAt };
            });
          const score = runningScore(items, source);
          return [st.studentId, { score, level: watchLevelOf(score, current) }] as const;
        })
      );

    const applyRuleVersion = (version: RuleSetVersion) => {
      // Alt-D: ถึงวันเริ่มใช้ แจ้งผู้เกี่ยวข้องเมื่อสถานะเฝ้าระวังของนักเรียนเปลี่ยน (พ้นสถานะ: ระบบคงสถานะไว้ให้ครูที่ปรึกษายืนยันถอนก่อน)
      const before = levelsUnder(behaviorRules, configOn, behaviorScoreConfig);
      const after = levelsUnder(version.rules, (at) => (at === "" || at.slice(0, 10) >= version.effectiveFrom ? version.config : configOn(at)), version.config);
      for (const st of students) {
        const b = before[st.studentId];
        const a = after[st.studentId];
        if (a.level > b.level) notifyWatchRaised(st.studentId, b.level, a.level, "ระบบ (ชุดกฎใหม่เริ่มใช้)", a.score);
      }
      setRuleVersions((prev) => [...prev, version]);
      setBehaviorRules(version.rules);
      setBehaviorScoreConfig(version.config);
    };

    const publishRuleDraft: StoreValue["publishRuleDraft"] = (effectiveFrom, reason) => {
      if (!ruleDraft || !configDraft) return "applied";
      const number = Math.max(0, ...ruleVersions.map((v) => v.number)) + 1;
      const version: RuleSetVersion = {
        versionId: `RS-${number}`,
        number,
        effectiveFrom,
        rules: ruleDraft,
        config: configDraft,
        publishedAt: nowThaiIso(),
        publishedBy: ROLE_INFO[role].user.name,
        reason,
      };
      // บันทึกประวัติของกฎแต่ละข้อที่เปลี่ยน พร้อมเหตุผลและวันเริ่มใช้
      for (const d of diffRules(behaviorRules, ruleDraft)) {
        logChange("rule", d.ruleId, d.summary, [
          ...d.changes,
          { label: "เหตุผล", from: "", to: reason },
          { label: "วันเริ่มใช้", from: "", to: formatThaiDate(effectiveFrom) },
        ]);
      }
      const configChanges = diffConfig(behaviorScoreConfig, configDraft);
      if (configChanges.length > 0)
        logChange("rule", "CONFIG", "แก้ค่าตั้งต้นคะแนนและเกณฑ์เฝ้าระวัง", [
          ...configChanges,
          { label: "เหตุผล", from: "", to: reason },
          { label: "วันเริ่มใช้", from: "", to: formatThaiDate(effectiveFrom) },
        ]);
      setRuleDraft(null);
      setConfigDraft(null);
      if (effectiveFrom <= DEMO_TODAY) {
        applyRuleVersion(version);
        return "applied";
      }
      setScheduledRuleSet(version);
      return "scheduled";
    };

    const recallScheduledRules = () => {
      if (!scheduledRuleSet) return;
      setRuleDraft(scheduledRuleSet.rules.map((r) => ({ ...r })));
      setConfigDraft(copyConfig(scheduledRuleSet.config));
      setScheduledRuleSet(null);
    };

    const activateScheduledRules = () => {
      if (!scheduledRuleSet) return;
      applyRuleVersion(scheduledRuleSet);
      setScheduledRuleSet(null);
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
        scoreDelta: rulesOn(occurredAt.slice(0, 10)).find((r) => r.ruleId === ruleId)?.scoreDelta ?? 0,
        source,
        ...(backdateReason && { backdateReason }),
        ...(evidence && evidence.length > 0 && { evidence }),
      }));
      setBehaviorRecords((prev) => [...created, ...prev]);

      // กฎที่มีผลในวันที่เกิดพฤติกรรม (บันทึกย้อนหลังข้ามวันเริ่มใช้ใช้กฎเดิม)
      const rule = rulesOn(occurredAt.slice(0, 10)).find((r) => r.ruleId === ruleId);
      const refer = !!rule && ruleKind(rule) === "refer";
      const delta = refer ? 0 : (rule?.scoreDelta ?? 0);
      for (const studentId of studentIds) {
        const before = behaviorWatchLevelOf(studentId);
        const after = behaviorWatchLevelOf(studentId, { delta, at: occurredAt });
        notifyWatchRaised(studentId, before, after, ROLE_INFO[role].user.name, behaviorScoreOf(studentId, { delta, at: occurredAt }));
        // กฎส่งต่อ: แจ้งครูที่ปรึกษาให้พิจารณาเปิด case (Alt-G)
        const st = getStudent(studentId);
        if (refer && st)
          addStaffEvent({
            kind: "refer_recorded",
            title: `${st.fullName} ถูกบันทึกตามกฎส่งต่อ`,
            body: `${rule?.name} · บันทึกโดย ${ROLE_INFO[role].user.name} · พิจารณาเปิดกรณีช่วยเหลือ`,
            href: "/dashboard",
            at: now,
            to: { homeroomOf: st.roomName },
          });
      }
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

    // แจ้งนักเรียนและผู้ปกครองทางอีเมล (ต้นแบบบันทึกเป็นบันทึกการส่งจำลอง ไม่ระบุชื่อนักเรียน)
    const logVisitEmail = (text: string) =>
      setNotificationLog((prev) => [
        { id: nextId("NLOG"), at: nowThaiIso(), channel: "อีเมล (จำลอง)", to: "นักเรียนและผู้ปกครอง", text },
        ...prev,
      ]);

    const postponeAppointment: StoreValue["postponeAppointment"] = (appointmentId, newDateTime) => {
      patchAppointment(appointmentId, (a) => ({
        ...a,
        proposedDate: newDateTime,
        status: "pending",
        confirmedBy: undefined,
        reschedule: undefined,
        cancelReason: undefined,
      }));
      logVisitEmail("ครูเลื่อนนัดเยี่ยมบ้าน ขอให้ยืนยันนัดใหม่");
    };

    const cancelAppointment: StoreValue["cancelAppointment"] = (appointmentId, reason) => {
      patchAppointment(appointmentId, (a) => ({
        ...a,
        status: "cancelled",
        confirmedBy: undefined,
        reschedule: undefined,
        cancelReason: reason,
      }));
      logVisitEmail(`ครูยกเลิกนัดเยี่ยมบ้าน · เหตุผล: ${reason}`);
    };

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

    const openCase: StoreValue["openCase"] = (studentId, methods, goal, options) => {
      const record: CareCase = {
        caseId: nextId("CASE"),
        studentId,
        triggerSource: options.triggerSource ?? "เปิดโดยครูประจำชั้น",
        status: "active",
        openedAt: nowThaiIso().split("T")[0],
        closedAt: null,
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
    const dcRoundHasResults = (termId: string) => dcAssessments.some((a) => a.termId === termId && a.status === "submitted");

    const markNotificationRead = (id: string) =>
      setReadNotifications((prev) => (prev.includes(id) ? prev : [...prev, id]));

    const latestDc = (studentId: string, termId: string = CURRENT_TERM.termId) =>
      dcAssessments.filter((a) => a.studentId === studentId && a.termId === termId).sort((a, b) => b.round - a.round)[0];

    const dcResultOf = (studentId: string, termId: string = CURRENT_TERM.termId) => {
      const done = dcAssessments
        .filter((a) => a.studentId === studentId && a.termId === termId && a.status === "submitted")
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
              termId: CURRENT_TERM.termId,
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
          termId: CURRENT_TERM.termId,
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

    const logChange: StoreValue["logChange"] = (entity, ref, summary, changes, merge = false) => {
      const by = ROLE_INFO[role].user.name;
      const at = nowThaiIso();
      const secs = (t: string) => {
        const [h, m, sec] = t.slice(11, 19).split(":").map(Number);
        return h * 3600 + m * 60 + sec;
      };
      setChangeLog((prev) => {
        const last = prev.find((e) => e.entity === entity && e.ref === ref && e.by === by);
        if (merge && last && secs(at) - secs(last.at) <= 300 && last.at.slice(0, 10) === at.slice(0, 10)) {
          const merged = [...last.changes];
          for (const c of changes) {
            const i = merged.findIndex((m) => m.label === c.label);
            if (i >= 0) merged[i] = { ...merged[i], to: c.to };
            else merged.push(c);
          }
          const kept = merged.filter((c) => c.from !== c.to);
          const rest = prev.filter((e) => e !== last);
          return kept.length > 0 ? [{ ...last, at, changes: kept }, ...rest] : rest;
        }
        return [{ id: nextId("CHG"), at, by, entity, ref, summary, changes }, ...prev];
      });
    };

    const logExport = (scope: string): [string, string][] => {
      const entry: ExportLogEntry = {
        logId: nextId("EXP"),
        at: nowThaiIso(),
        actorName: ROLE_INFO[role].user.name,
        actorRole: ROLE_INFO[role].label,
        scope,
      };
      setExportLog((prev) => [entry, ...prev]);
      return [
        ["ผู้ส่งออก", `${entry.actorName} (${entry.actorRole})`],
        ["เวลาส่งออก", entry.at.replace("T", " ").slice(0, 16)],
        ["ขอบเขตข้อมูล", scope],
      ];
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
      exportLog,
      changeLog,
      logChange,
      logExport,
      assessmentWindows,
      setAssessmentWindows,
      behaviorRules,
      setBehaviorRules,
      ruleVersions,
      scheduledRuleSet,
      ruleDraft,
      setRuleDraft,
      configDraft,
      setConfigDraft,
      configOn,
      ruleEditWindow,
      setRuleEditWindow,
      simulateRuleEditOpen,
      setSimulateRuleEditOpen,
      ruleEditOpen,
      rulesOn,
      startRuleDraft,
      discardRuleDraft,
      publishRuleDraft,
      recallScheduledRules,
      activateScheduledRules,
      behaviorScoreConfig,
      setBehaviorScoreConfig,
      getStudent,
      latestScreening,
      overallRiskOf,
      mentalStatusOf,
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
      withdrawalWait,
      staffNotifications,
      notificationLog,
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
      postponeAppointment,
      cancelAppointment,
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
      caseConsiderations,
      considerCase,
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
  }, [role, screenings, redFlags, nineS, sdq, eq, reviews, behaviorRecords, rawAppointments, careCases, homeVisitRecords, accessLogs, exportLog, changeLog, assessmentWindows, behaviorRules, ruleVersions, scheduledRuleSet, ruleDraft, configDraft, ruleEditWindow, simulateRuleEditOpen, behaviorScoreConfig, drafts, screeningWatch, caseConsiderations, staffEvents, notificationLog, educationDocuments, documentRequests, dcAssessments, readNotifications, dcRounds, watchDecisions, registryCorrections, studentCards]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore ต้องถูกเรียกภายใน StoreProvider");
  return ctx;
}

export { seedBehaviorRules as behaviorRules, dcSummaries };
