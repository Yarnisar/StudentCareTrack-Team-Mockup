/** ข้อมูลตัวอย่าง: care case */

import type { CareCase } from "../types";
import { USER } from "./core";

export const careCases: CareCase[] = [
  {
    caseId: "CASE-2570-014",
    studentId: "30125",
    triggerSource: "ผลคัดกรอง 6 มิติ (เศรษฐกิจ / สุขภาพจิต)",
    status: "active",
    openedAt: "2570-02-01",
    closedAt: null,
    supportType: "prevent",
    careMethods: ["behavior_adjust", "life_skills", "counseling"],
    goal:
      "ลดความกังวลด้านการเรียนและเศรษฐกิจ โดยประสานทุนการศึกษาจากโรงเรียน และให้คำปรึกษาต่อเนื่องสัปดาห์ละ 1 ครั้ง จนถึงสิ้นภาคเรียน",
    targetDate: "2570-03-31",
    followups: [
      {
        followupId: "FU-003",
        actionTaken: "พูดคุยกับผู้ปกครองทางโทรศัพท์",
        result:
          "ผู้ปกครองแจ้งว่ารายได้ครัวเรือนลดลง และนักเรียนใช้เวลากับเกมมาก ขอความช่วยเหลือด้านทุนการศึกษา (นัดเยี่ยมบ้านวันที่ 18 ก.พ.)",
        followupDate: "2570-02-15",
        recordedBy: USER.somying,
      },
      {
        followupId: "FU-002",
        actionTaken: "ให้คำปรึกษารายบุคคล ครั้งที่ 2",
        result: "นักเรียนเริ่มเปิดใจมากขึ้น พูดคุยเรื่องความกังวลเรื่องการเรียนและค่าใช้จ่ายที่บ้าน",
        followupDate: "2570-02-12",
        recordedBy: USER.somying,
      },
      {
        followupId: "FU-001",
        actionTaken: "ให้คำปรึกษารายบุคคล ครั้งที่ 1",
        result: "ประเมินสภาพปัญหาเบื้องต้น นักเรียนมีความกังวลเรื่องฐานะทางบ้าน",
        followupDate: "2570-02-05",
        recordedBy: USER.somying,
      },
    ],
  },
  {
    caseId: "CASE-2570-015",
    studentId: "30118",
    triggerSource: "ผลแบบคัดกรอง Red Flag",
    status: "active",
    openedAt: "2570-02-13",
    closedAt: null,
    supportType: "refer_internal",
    careMethods: ["counseling", "guidance_teacher"],
    goal: "ส่งต่อครูแนะแนวเพื่อประเมินเชิงลึกด้านสุขภาพจิต และติดตามพฤติกรรมการมาสาย",
    targetDate: "2570-03-15",
    followups: [
      {
        followupId: "FU-010",
        actionTaken: "ส่งต่อครูแนะแนว",
        result: "ครูแนะแนวรับเรื่องแล้ว นัดพบนักเรียนสัปดาห์หน้า",
        followupDate: "2570-02-14",
        recordedBy: USER.somying,
      },
    ],
  },
];
