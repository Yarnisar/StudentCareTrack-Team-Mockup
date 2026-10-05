/** ข้อมูลตัวอย่าง: ความประพฤติ และการเช็คอิน */

import type { BehaviorRecord, BehaviorRule, CheckinLog } from "../types";
import { SYSTEM_USER_ID, USER } from "./core";

export const behaviorRules: BehaviorRule[] = [
  { ruleId: "BR-01", name: "มาสาย", severity: "minor", scoreDelta: -2, isActive: true },
  { ruleId: "BR-02", name: "แต่งกายไม่ถูกระเบียบ", severity: "minor", scoreDelta: -1, isActive: true },
  { ruleId: "BR-03", name: "ไม่ส่งงาน / การบ้าน", severity: "moderate", scoreDelta: -3, isActive: true },
  { ruleId: "BR-04", name: "ใช้โทรศัพท์ในเวลาเรียน", severity: "moderate", scoreDelta: -3, isActive: true },
  { ruleId: "BR-05", name: "ทะเลาะวิวาท", severity: "severe", scoreDelta: -10, isActive: true },
  { ruleId: "BR-06", name: "ช่วยเหลือกิจกรรมโรงเรียน", severity: "positive", scoreDelta: 5, isActive: true },
  { ruleId: "BR-07", name: "ช่วยเหลือครูหรือเพื่อน", severity: "positive", scoreDelta: 3, isActive: true },
];

export const behaviorRecords: BehaviorRecord[] = [
  {
    recordId: "BH-001",
    studentId: "30118",
    ruleId: "BR-01",
    description: "บันทึกอัตโนมัติจากการสแกน QR เวลา 07:52 น.",
    occurredAt: "2570-02-16T07:52:00",
    recordedBy: SYSTEM_USER_ID,
    source: "qr_checkin",
  },
  {
    recordId: "BH-002",
    studentId: "30125",
    ruleId: "BR-01",
    description: "บันทึกอัตโนมัติจากการสแกน QR เวลา 07:55 น.",
    occurredAt: "2570-02-16T07:55:00",
    recordedBy: SYSTEM_USER_ID,
    source: "qr_checkin",
  },
  {
    recordId: "BH-003",
    studentId: "30131",
    ruleId: "BR-03",
    description: "ไม่ส่งการบ้านวิชาคณิตศาสตร์ ครั้งที่ 3 ในเดือนนี้",
    occurredAt: "2570-02-15T13:20:00",
    recordedBy: USER.wichai,
    source: "manual",
  },
  {
    recordId: "BH-004",
    studentId: "30140",
    ruleId: "BR-06",
    description: "ช่วยจัดสถานที่กิจกรรมวันวิชาการ",
    occurredAt: "2570-02-15T10:05:00",
    recordedBy: USER.somying,
    source: "manual",
  },
  {
    recordId: "BH-005",
    studentId: "30118",
    ruleId: "BR-02",
    description: "ไม่สวมเสื้อนักเรียนตามระเบียบ",
    occurredAt: "2570-02-14T08:10:00",
    recordedBy: USER.somchaiK,
    source: "manual",
  },
  {
    recordId: "BH-006",
    studentId: "30152",
    ruleId: "BR-07",
    description: "ช่วยครูจัดห้องเรียนหลังเลิกเรียน",
    occurredAt: "2570-02-13T15:40:00",
    recordedBy: USER.somying,
    source: "manual",
  },
];

export const checkinLogs: CheckinLog[] = [
  { logId: "CI-001", studentId: "30118", scannedAt: "2570-02-16T07:52:00", isLate: true, scannedBy: USER.somying },
  { logId: "CI-002", studentId: "30125", scannedAt: "2570-02-16T07:55:00", isLate: true, scannedBy: USER.somying },
  { logId: "CI-003", studentId: "30171", scannedAt: "2570-02-16T07:58:00", isLate: true, scannedBy: USER.somying },
  { logId: "CI-004", studentId: "30160", scannedAt: "2570-02-16T07:28:00", isLate: false, scannedBy: USER.somying },
  { logId: "CI-005", studentId: "30152", scannedAt: "2570-02-16T07:22:00", isLate: false, scannedBy: USER.somying },
];
