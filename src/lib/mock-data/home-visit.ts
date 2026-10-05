/** ข้อมูลตัวอย่าง: การเยี่ยมบ้าน */

import type { HomeVisitAppointment, HomeVisitRecord } from "../types";
import { USER } from "./core";

export const appointments: HomeVisitAppointment[] = [
  {
    appointmentId: "HV-001",
    studentId: "30125",
    teacherId: USER.somying,
    proposedDate: "2570-02-18T15:30:00",
    status: "confirmed",
    guardianPhone: "08x-xxx-4471",
    caretakerName: "ยาย (นางบุญมา สายใจ)",
    guardianNote: "อยากขอคำแนะนำเรื่องทุนการศึกษา และการดูแลเรื่องการใช้โทรศัพท์ของลูก",
  },
  {
    appointmentId: "HV-002",
    studentId: "30131",
    teacherId: USER.somying,
    proposedDate: "2570-02-20T16:00:00",
    status: "pending",
  },
  {
    appointmentId: "HV-003",
    studentId: "30118",
    teacherId: USER.somying,
    proposedDate: "2570-02-08T15:00:00",
    status: "completed",
  },
  {
    // การเยี่ยมบ้านรอบติดตามผล — ใช้สาธิตการดึงข้อมูลจากการเยี่ยมบ้านครั้งก่อนมากรอกอัตโนมัติ
    appointmentId: "HV-004",
    studentId: "30118",
    teacherId: USER.somying,
    proposedDate: "2570-02-21T15:30:00",
    status: "confirmed",
    guardianPhone: "08x-xxx-1182",
  },
];

export const homeVisitRecords: HomeVisitRecord[] = [
  {
    recordId: "HVR-001",
    appointmentId: "HV-003",
    studentId: "30118",
    householdMembers: [
      { memberId: "M1", relation: "บิดา", age: 47, occupation: "รับจ้างทั่วไป", monthlyIncome: 9000 },
      { memberId: "M2", relation: "มารดา", age: 44, occupation: "แม่บ้าน", monthlyIncome: 0 },
      { memberId: "M3", relation: "นักเรียน", age: 15, occupation: "-", monthlyIncome: 0 },
    ],
    riskFindings: ["ผู้ปกครองทำงานต่างจังหวัดเป็นช่วง ๆ", "นักเรียนใช้เวลากับเกมมากกว่า 4 ชั่วโมงต่อวัน"],
    informantName: "นายสมชาย ตั้งใจเรียน",
    informantRelation: "บิดา",
    photoLabels: ["ภาพภายนอกบ้าน", "ภาพภายในบ้าน"],
    signedBy: USER.somying,
    signedAt: "2570-02-08",
  },
];



/**
 * ข้อมูลแบบบันทึกการเยี่ยมบ้านครั้งก่อนของนักเรียนแต่ละคน
 * ใช้สาธิตการดึงข้อมูลเดิมมากรอกอัตโนมัติ เพื่อลดการกรอกซ้ำของครู
 */
export interface PreviousVisitForm {
  visitedAt: string;
  householdMembers: {
    id: string;
    relation: string;
    age: number;
    disability: boolean;
    income: { wage: number; agriculture: number; business: number; welfare: number; other: number };
  }[];
  dependencies: string[];
  housingType: string;
  housingConditions: string[];
  vehicles: string[];
  farmland: string;
  hoursTogether: string;
  caretakerWhenAway: string;
  travelKm: string;
  travelHours: string;
  travelMinutes: string;
  travelMode: string;
  duties: string[];
  internet: string;
}

export const previousVisitForms: Record<string, PreviousVisitForm> = {
  "30118": {
    visitedAt: "2570-02-08",
    householdMembers: [
      {
        id: "pm1",
        relation: "บิดา",
        age: 47,
        disability: false,
        income: { wage: 9000, agriculture: 0, business: 0, welfare: 0, other: 0 },
      },
      {
        id: "pm2",
        relation: "มารดา",
        age: 44,
        disability: false,
        income: { wage: 0, agriculture: 0, business: 2500, welfare: 0, other: 0 },
      },
      {
        id: "pm3",
        relation: "นักเรียน",
        age: 15,
        disability: false,
        income: { wage: 0, agriculture: 0, business: 0, welfare: 0, other: 0 },
      },
      {
        id: "pm4",
        relation: "ยาย",
        age: 71,
        disability: false,
        income: { wage: 0, agriculture: 0, business: 0, welfare: 600, other: 0 },
      },
    ],
    dependencies: ["dep_elderly"],
    housingType: "own",
    housingConditions: [],
    vehicles: ["motorcycle"],
    farmland: "no_land",
    hoursTogether: "4",
    caretakerWhenAway: "relative",
    travelKm: "3.5",
    travelHours: "0",
    travelMinutes: "25",
    travelMode: "motorcycle",
    duties: ["housework", "care_sick"],
    internet: "can_access",
  },
};
