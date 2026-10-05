/** ข้อมูลตัวอย่าง: care case เหตุเปิด case แผนช่วยเหลือ การติดตามผล และคำแนะนำให้เปิด case */

import type { CareCase, CaseSuggestion } from "../types";
import { USER } from "./core";

export const careCases: CareCase[] = [
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
    referrals: [],
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
    referrals: [],
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
];

/** คำแนะนำให้เปิด case จากผลคัดกรอง "เสี่ยง" ของนักเรียนที่ยังไม่มี case เปิดอยู่ */
export const caseSuggestions: CaseSuggestion[] = [
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
