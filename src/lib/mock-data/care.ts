/** ข้อมูลตัวอย่าง: care case เหตุเปิด case แผนช่วยเหลือ การติดตามผล และคำแนะนำให้เปิด case */

import type { CareCase, CaseSuggestion, ReferralDocument, SignatureRequest } from "../types";
import { SYSTEM_USER_ID, USER } from "./core";
import { generatedCareCases, generatedCaseSuggestions } from "./generated-class";

/** เอกสารส่งต่อของ CASE-2570-014 — ร่างแล้ว ส่งให้ผู้ปกครองลงนาม รอลายมือชื่อ */
const referral014: ReferralDocument = {
  referralId: "REF-2570-001",
  caseId: "CASE-2570-014",
  externalAgency: "โรงพยาบาลบางพลี (คลินิกสุขภาพจิตเด็กและวัยรุ่น)",
  content:
    "ขอส่งต่อนักเรียนเพื่อรับการประเมินและดูแลด้านสุขภาพจิต หลังโรงเรียนให้คำปรึกษาต่อเนื่อง 3 ครั้งแล้วอาการยังไม่ดีขึ้น แนบผลการคัดกรอง ผลประเมิน และบันทึกการช่วยเหลือที่ผ่านมา",
  createdBy: USER.somying,
  createdAt: "2570-02-15T09:30:00",
  status: "awaiting_guardian",
  sentBy: null,
  sentAt: null,
  voidedBy: null,
  voidedAt: null,
  voidReason: null,
};

/** เอกสารส่งต่อของ CASE-2570-015 — ผู้ปกครองลงนามแล้ว รอผู้ดูแลระบบอนุมัติ */
const referral015: ReferralDocument = {
  referralId: "REF-2570-002",
  caseId: "CASE-2570-015",
  externalAgency: "สำนักงานสาธารณสุขจังหวัดสมุทรปราการ",
  content:
    "ขอส่งต่อนักเรียนเพื่อรับการประเมินเชิงลึกด้านสุขภาพจิต ตามแผนส่งต่อภายในที่ครูแนะแนวรับเรื่องแล้วแต่ต้องการผู้เชี่ยวชาญภายนอกร่วมประเมิน",
  createdBy: USER.somying,
  createdAt: "2570-02-14T15:20:00",
  status: "awaiting_executive",
  sentBy: null,
  sentAt: null,
  voidedBy: null,
  voidedAt: null,
  voidReason: null,
};

/**
 * คำขอลงนามของเอกสารส่งต่อ (จัดทำร่าง → ผู้ปกครองลงนาม → ผู้ดูแลระบบอนุมัติ → ส่งต่อได้)
 * คำขอที่ไม่ใช้แล้วใช้การยกเลิกพร้อมเหตุผล ไม่มีการลบ
 */
export const signatureRequests: SignatureRequest[] = [
  {
    requestId: "SR-2570-001",
    referralId: referral014.referralId,
    step: "guardian",
    signerRole: "parent",
    requestedBy: USER.somying,
    requestedAt: "2570-02-15T09:35:00",
    signerUserId: null,
    signedAt: null,
    status: "pending",
    declinedAt: null,
    declineReason: null,
    voidedBy: null,
    voidedAt: null,
    voidReason: null,
  },
  {
    requestId: "SR-2570-002",
    referralId: referral015.referralId,
    step: "guardian",
    signerRole: "parent",
    requestedBy: USER.somying,
    requestedAt: "2570-02-14T15:25:00",
    signerUserId: "U-G03",
    signedAt: "2570-02-14T20:10:00",
    status: "signed",
    declinedAt: null,
    declineReason: null,
    voidedBy: null,
    voidedAt: null,
    voidReason: null,
  },
  {
    requestId: "SR-2570-003",
    referralId: referral015.referralId,
    step: "executive",
    signerRole: "admin_school",
    requestedBy: SYSTEM_USER_ID,
    requestedAt: "2570-02-14T20:10:00",
    signerUserId: null,
    signedAt: null,
    status: "pending",
    declinedAt: null,
    declineReason: null,
    voidedBy: null,
    voidedAt: null,
    voidReason: null,
  },
];

const baseCareCases: CareCase[] = [
  {
    // ครูประจำชั้นเปิดเองจากการสังเกต ต่อมาผลคัดกรองเป็น "เสี่ยง" จึงเพิ่มเป็นเหตุใน case เดิม
    caseId: "CASE-2570-014",
    studentId: "30125",
    openedBy: USER.somying,
    status: "active",
    openedAt: "2570-02-01",
    closedBy: null,
    closeReason: null,
    closedAt: null,
    triggers: [
      {
        triggerId: "TRG-2570-021",
        caseId: "CASE-2570-014",
        source: "screening",
        sourceRefId: "SC-001",
        detectedAt: "2570-02-12T10:00:00",
        planId: "PLAN-2570-014-1",
        summary: "ผลคัดกรองเสี่ยง มิติเศรษฐกิจ / สุขภาพจิต",
      },
      {
        triggerId: "TRG-2570-014",
        caseId: "CASE-2570-014",
        source: "manual",
        sourceRefId: null,
        detectedAt: "2570-02-01T09:00:00",
        planId: "PLAN-2570-014-1",
        summary: "ครูประจำชั้นสังเกตเห็นความกังวลเรื่องการเรียนและฐานะทางบ้าน",
      },
    ],
    plans: [
      {
        planId: "PLAN-2570-014-1",
        caseId: "CASE-2570-014",
        supportType: "prevent",
        careMethods: ["behavior_adjust", "life_skills", "counseling"],
        goal:
          "ลดความกังวลด้านการเรียนและเศรษฐกิจ โดยประสานทุนการศึกษาจากโรงเรียน และให้คำปรึกษาต่อเนื่องสัปดาห์ละ 1 ครั้ง จนถึงสิ้นภาคเรียน",
        targetDate: "2570-03-31",
        createdBy: USER.somying,
        createdAt: "2570-02-01T10:00:00",
      },
    ],
    followups: [
      {
        followupId: "FU-003",
        caseId: "CASE-2570-014",
        planId: "PLAN-2570-014-1",
        actionTaken: "พูดคุยกับผู้ปกครองทางโทรศัพท์",
        result:
          "ผู้ปกครองแจ้งว่ารายได้ครัวเรือนลดลง และนักเรียนใช้เวลากับเกมมาก ขอความช่วยเหลือด้านทุนการศึกษา (นัดเยี่ยมบ้านวันที่ 18 ก.พ.)",
        followupDate: "2570-02-15",
        recordedBy: USER.somying,
      },
      {
        followupId: "FU-002",
        caseId: "CASE-2570-014",
        planId: "PLAN-2570-014-1",
        actionTaken: "ให้คำปรึกษารายบุคคล ครั้งที่ 2",
        result: "นักเรียนเริ่มเปิดใจมากขึ้น พูดคุยเรื่องความกังวลเรื่องการเรียนและค่าใช้จ่ายที่บ้าน",
        followupDate: "2570-02-12",
        recordedBy: USER.somying,
      },
      {
        followupId: "FU-001",
        caseId: "CASE-2570-014",
        planId: "PLAN-2570-014-1",
        actionTaken: "ให้คำปรึกษารายบุคคล ครั้งที่ 1",
        result: "ประเมินสภาพปัญหาเบื้องต้น นักเรียนมีความกังวลเรื่องฐานะทางบ้าน",
        followupDate: "2570-02-05",
        recordedBy: USER.somying,
      },
    ],
    referrals: [referral014],
  },
  {
    // ระบบเปิดให้อัตโนมัติจากมิติสุขภาพจิต "มีปัญหา" มีเหตุที่ 2 ที่ยังไม่มีแผนรองรับ
    caseId: "CASE-2570-015",
    studentId: "30118",
    openedBy: null,
    status: "active",
    openedAt: "2570-02-13",
    closedBy: null,
    closeReason: null,
    closedAt: null,
    triggers: [
      {
        triggerId: "TRG-2570-024",
        caseId: "CASE-2570-015",
        source: "manual",
        sourceRefId: null,
        detectedAt: "2570-02-16T08:10:00",
        planId: null,
        summary: "มาสายบ่อยในเดือนกุมภาพันธ์",
      },
      {
        triggerId: "TRG-2570-022",
        caseId: "CASE-2570-015",
        source: "screening",
        sourceRefId: "SC-002",
        detectedAt: "2570-02-13T09:00:00",
        planId: "PLAN-2570-015-1",
        summary: "ผลคัดกรองมีปัญหา มิติพฤติกรรม",
      },
    ],
    plans: [
      {
        planId: "PLAN-2570-015-1",
        caseId: "CASE-2570-015",
        supportType: "refer_internal",
        careMethods: ["counseling", "guidance_teacher"],
        goal: "ส่งต่อครูแนะแนวเพื่อประเมินเชิงลึกด้านสุขภาพจิต",
        targetDate: "2570-03-15",
        createdBy: USER.somying,
        createdAt: "2570-02-13T14:00:00",
      },
    ],
    followups: [
      {
        followupId: "FU-010",
        caseId: "CASE-2570-015",
        planId: "PLAN-2570-015-1",
        actionTaken: "ส่งต่อครูแนะแนว",
        result: "ครูแนะแนวรับเรื่องแล้ว นัดพบนักเรียนสัปดาห์หน้า",
        followupDate: "2570-02-14",
        recordedBy: USER.somying,
      },
    ],
    referrals: [referral015],
  },
  {
    // ระบบเปิดให้อัตโนมัติจากมิติการเรียน "มีปัญหา" — ยังไม่มีแผนและยังไม่มีการติดตามผล
    // ผู้ปกครองไม่ยินยอมปี 2569 → ส่งต่อภายนอกไม่ได้
    caseId: "CASE-2570-016",
    studentId: "30131",
    openedBy: null,
    status: "active",
    openedAt: "2570-02-11",
    closedBy: null,
    closeReason: null,
    closedAt: null,
    triggers: [
      {
        triggerId: "TRG-2570-020",
        caseId: "CASE-2570-016",
        source: "screening",
        sourceRefId: "SC-003",
        detectedAt: "2570-02-11T10:00:00",
        planId: null,
        summary: "ผลคัดกรองมีปัญหา มิติการเรียน",
      },
    ],
    plans: [],
    followups: [],
    referrals: [],
  },
  {
    // case ภาคเรียนที่ 1 ที่ปิดแล้ว (ช่วยเหลือสำเร็จ)
    caseId: "CASE-2569-008",
    studentId: "30140",
    openedBy: USER.somying,
    status: "closed",
    openedAt: "2569-07-08",
    closedBy: USER.somying,
    closeReason: "resolved",
    closedAt: "2569-09-25",
    triggers: [
      {
        triggerId: "TRG-2569-008",
        caseId: "CASE-2569-008",
        source: "manual",
        sourceRefId: null,
        detectedAt: "2569-07-08T09:00:00",
        planId: "PLAN-2569-008-1",
        summary: "ขาดความมั่นใจในการเข้าร่วมกิจกรรมกลุ่ม",
      },
      {
        // ฉบับครูของ SDQ ครั้งที่ 1 ส่งหลังเปิด case → ผล SDQ รวมมีปัญหา ระบบเพิ่มเหตุเข้า case เดิม
        triggerId: "TRG-2569-009",
        caseId: "CASE-2569-008",
        source: "sdq",
        sourceRefId: "SDQSET-T2569-1-R1-30140",
        detectedAt: "2569-07-08T11:00:00",
        planId: "PLAN-2569-008-1",
        summary: "ผล SDQ รวมมีปัญหา (ครั้งที่ 1)",
      },
    ],
    plans: [
      {
        planId: "PLAN-2569-008-1",
        caseId: "CASE-2569-008",
        supportType: "promote",
        careMethods: ["life_skills"],
        goal: "ส่งเสริมให้เข้าร่วมกิจกรรมชุมนุมและมีบทบาทในกลุ่มเพื่อน",
        targetDate: "2569-09-30",
        createdBy: USER.somying,
        createdAt: "2569-07-08T10:00:00",
      },
    ],
    followups: [
      {
        followupId: "FU-2569-021",
        caseId: "CASE-2569-008",
        planId: "PLAN-2569-008-1",
        actionTaken: "ติดตามการเข้าร่วมชุมนุม",
        result: "นักเรียนเข้าร่วมกิจกรรมสม่ำเสมอ และรับหน้าที่ประสานงานกลุ่ม",
        followupDate: "2569-09-20",
        recordedBy: USER.somying,
      },
      {
        followupId: "FU-2569-012",
        caseId: "CASE-2569-008",
        planId: "PLAN-2569-008-1",
        actionTaken: "แนะนำชุมนุมที่ตรงความสนใจ",
        result: "นักเรียนเลือกชุมนุมศิลปะ",
        followupDate: "2569-07-15",
        recordedBy: USER.somying,
      },
    ],
    referrals: [],
  },
  {
    // ปีการศึกษา 2568 (ม.2/1) — ครูวิชัยเป็นครูประจำชั้นในตอนนั้น เปิด/ปิด case เอง (สาธิตครูประจำชั้นคนเดิม)
    caseId: "CASE-2568-031",
    studentId: "30118",
    openedBy: USER.wichai,
    status: "closed",
    openedAt: "2568-11-14",
    closedBy: USER.wichai,
    closeReason: "resolved",
    closedAt: "2569-02-20",
    triggers: [
      {
        triggerId: "TRG-2568-031",
        caseId: "CASE-2568-031",
        source: "manual",
        sourceRefId: null,
        detectedAt: "2568-11-14T09:00:00",
        planId: "PLAN-2568-031-1",
        summary: "ครูประจำชั้นสังเกตว่าไม่ส่งงานหลายวิชาติดต่อกัน",
      },
    ],
    plans: [
      {
        planId: "PLAN-2568-031-1",
        caseId: "CASE-2568-031",
        supportType: "prevent",
        careMethods: ["behavior_adjust", "counseling"],
        goal: "ติดตามการส่งงานรายสัปดาห์และให้คำปรึกษาเรื่องการจัดเวลา จนส่งงานครบทุกวิชา",
        targetDate: "2569-02-28",
        createdBy: USER.wichai,
        createdAt: "2568-11-14T10:00:00",
      },
    ],
    followups: [
      {
        followupId: "FU-0568-031",
        caseId: "CASE-2568-031",
        planId: "PLAN-2568-031-1",
        actionTaken: "ติดตามการส่งงานร่วมกับครูประจำวิชา",
        result: "ส่งงานครบทุกวิชาตั้งแต่เดือนมกราคม",
        followupDate: "2569-02-15",
        recordedBy: USER.wichai,
      },
    ],
    referrals: [],
  },
];

/** คำแนะนำให้เปิด case จากผลคัดกรอง "เสี่ยง" ของนักเรียนที่ยังไม่มี case เปิดอยู่ */
const baseCaseSuggestions: CaseSuggestion[] = [
  {
    suggestionId: "SUG-2570-001",
    studentId: "30140",
    source: "screening",
    sourceRefId: "SC-004",
    detectedAt: "2570-02-11T10:00:00",
    summary: "ผลคัดกรองเสี่ยง มิติสวัสดิภาพและความปลอดภัย / สุขภาพจิต",
    status: "pending",
  },
  {
    suggestionId: "SUG-2570-002",
    studentId: "30152",
    source: "screening",
    sourceRefId: "SC-005",
    detectedAt: "2570-02-10T10:00:00",
    summary: "ผลคัดกรองเสี่ยง มิติสุขภาพจิต",
    status: "pending",
  },
];

/** 8 คนตัวอย่างหลัก + นักเรียนที่สร้างเพิ่ม (ดู generated-class.ts) */
export const careCases: CareCase[] = [...baseCareCases, ...generatedCareCases];
export const caseSuggestions: CaseSuggestion[] = [...baseCaseSuggestions, ...generatedCaseSuggestions];
