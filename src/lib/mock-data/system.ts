/**
 * ข้อมูลตัวอย่าง: ตั้งค่าโรงเรียน ช่วงดำเนินงาน ความยินยอมของผู้ปกครอง การแจ้งเตือน และ audit log
 * ทุกวันที่สอดคล้องกับ DEMO_TODAY (2570-02-16, ภาคเรียนที่ 2/2569)
 *
 * ณ DEMO_TODAY: คัดกรอง / SDQ / บันทึกการช่วยเหลือ / เยี่ยมบ้าน เปิดอยู่
 * และช่วง SDQ (ปิด 20 ก.พ. แจ้งล่วงหน้า 5 วัน) อยู่ในช่วง "ใกล้ปิด"
 */

import { addHoursThai } from "../format";
import { buildNotificationContent } from "../notifications";
import type {
  AuditLog,
  GuardianConsent,
  Notification,
  NotificationEventType,
  NotificationParams,
  NotificationSetting,
  OperatingWindow,
  SchoolSettings,
} from "../types";
import { behaviorRecords, checkinLogs } from "./behavior";
import { careCases } from "./care";
import { CURRENT_TERM, PREVIOUS_TERM, students, SYSTEM_USER_ID, USER, users } from "./core";
import { appointments } from "./home-visit";
import { screenings } from "./screening";

export const initialSchoolSettings: SchoolSettings = {
  schoolStartTime: "07:30",
  lateAlertThreshold: 5,
  behaviorAlertScore: 60,
  pendingAutoConfirmDays: 3,
  sdq2ForNormalStudents: false,
  updatedBy: USER.admin,
  updatedAt: "2569-10-25T09:00:00",
};

export const operatingWindows: OperatingWindow[] = [
  // ภาคเรียนที่ 1/2569 — ปิดแล้วทั้งหมด (ดูย้อนหลังได้ บันทึกไม่ได้)
  { windowId: "OW-2569-1-SC", termId: PREVIOUS_TERM.termId, activity: "screening", opensAt: "2569-05-20", closesAt: "2569-06-30", remindDaysBefore: 7, updatedBy: USER.admin },
  { windowId: "OW-2569-1-HV", termId: PREVIOUS_TERM.termId, activity: "home_visit", opensAt: "2569-06-01", closesAt: "2569-08-31", remindDaysBefore: 7, updatedBy: USER.admin },
  { windowId: "OW-2569-1-SDQ", termId: PREVIOUS_TERM.termId, activity: "sdq", opensAt: "2569-07-01", closesAt: "2569-07-31", remindDaysBefore: 5, updatedBy: USER.admin },
  { windowId: "OW-2569-1-CR", termId: PREVIOUS_TERM.termId, activity: "care_record", opensAt: "2569-05-16", closesAt: "2569-10-10", remindDaysBefore: 7, updatedBy: USER.admin },
  // ภาคเรียนที่ 2/2569 (ปัจจุบัน)
  { windowId: "OW-2569-2-SC", termId: CURRENT_TERM.termId, activity: "screening", opensAt: "2570-02-02", closesAt: "2570-02-28", remindDaysBefore: 7, updatedBy: USER.admin },
  { windowId: "OW-2569-2-HV", termId: CURRENT_TERM.termId, activity: "home_visit", opensAt: "2570-01-15", closesAt: "2570-03-15", remindDaysBefore: 7, updatedBy: USER.admin },
  { windowId: "OW-2569-2-SDQ", termId: CURRENT_TERM.termId, activity: "sdq", opensAt: "2570-02-09", closesAt: "2570-02-20", remindDaysBefore: 5, updatedBy: USER.admin },
  { windowId: "OW-2569-2-CR", termId: CURRENT_TERM.termId, activity: "care_record", opensAt: "2569-11-01", closesAt: "2570-03-31", remindDaysBefore: 7, updatedBy: USER.admin },
];

/** ความยินยอมปีการศึกษา 2569 — นักเรียนที่ไม่มีแถว = ยังไม่ได้ความยินยอม (เช่น 30183 ผู้ปกครองยังไม่ตอบ) */
export const guardianConsents: GuardianConsent[] = [
  { consentId: "GC-001", studentId: "30125", guardianUserId: USER.ratana, academicYear: 2569, granted: true, respondedAt: "2569-05-20T19:12:00" },
  { consentId: "GC-002", studentId: "30118", guardianUserId: "U-G03", academicYear: 2569, granted: true, respondedAt: "2569-05-21T20:05:00" },
  { consentId: "GC-003", studentId: "30131", guardianUserId: USER.pimjai, academicYear: 2569, granted: false, respondedAt: "2569-05-22T18:40:00" },
  { consentId: "GC-004", studentId: "30140", guardianUserId: "U-G05", academicYear: 2569, granted: true, respondedAt: "2569-05-23T07:55:00" },
  { consentId: "GC-005", studentId: "30152", guardianUserId: "U-G06", academicYear: 2569, granted: true, respondedAt: "2569-05-25T12:30:00" },
];

/** ค่าที่ผู้ใช้ปรับเอง — ผู้ใช้ที่ไม่มีแถวรับอีเมลตามค่าเริ่มต้น (เปิด) */
export const notificationSettings: NotificationSetting[] = [
  { userId: USER.prapa, emailEnabled: false, updatedAt: "2569-11-03T08:00:00" },
];

const emailEnabledSeed = (userId: string) =>
  notificationSettings.find((s) => s.userId === userId)?.emailEnabled ?? true;

const homeroomUserIds = users.filter((u) => u.role === "teacher_homeroom").map((u) => u.userId);

let seedSeq = 0;
function seedNotification(
  eventType: NotificationEventType,
  recipientUserId: string,
  studentId: string | null,
  createdAt: string,
  readAt: string | null,
  params?: NotificationParams
): Notification {
  const user = users.find((u) => u.userId === recipientUserId);
  const studentName = studentId ? (students.find((s) => s.studentId === studentId)?.fullName ?? null) : null;
  const content = buildNotificationContent(eventType, studentId, studentName, user?.role ?? "teacher_general", params);
  return {
    notificationId: `NT-${String(++seedSeq).padStart(3, "0")}`,
    recipientUserId,
    eventType,
    studentId,
    ...content,
    createdAt,
    readAt,
    emailedAt: user?.email && emailEnabledSeed(recipientUserId) ? createdAt : null,
  };
}

const sdqWindow = operatingWindows.find((w) => w.windowId === "OW-2569-2-SDQ")!;
const hv001 = appointments.find((a) => a.appointmentId === "HV-001")!;

export const seedNotifications: Notification[] = [
  // ช่วง SDQ ใกล้ปิด — เริ่มเตือน 5 วันก่อนวันปิด (15 ก.พ.) ถึงครูประจำชั้นทุกคน
  ...homeroomUserIds.map((userId) =>
    seedNotification("window_closing", userId, null, "2570-02-15T07:00:00", null, {
      activity: "sdq",
      date: sdqWindow.closesAt,
    })
  ),
  // ผู้ปกครองได้รับแจ้งทันทีเมื่อบันทึกความประพฤติระดับกลางขึ้นไป / ความดี ถูกยืนยัน
  seedNotification("behavior_confirmed", USER.pimjai, "30131", "2570-02-15T13:20:00", null),
  seedNotification("behavior_confirmed", "U-G05", "30140", "2570-02-15T10:05:00", "2570-02-15T18:30:00"),
  seedNotification("behavior_confirmed", "U-G06", "30152", "2570-02-13T15:40:00", null),
  // คะแนนความประพฤติของ 30183 ต่ำกว่า 60 จากบันทึก BH-028 → แจ้งครูประจำชั้นทั้ง 2 คน
  seedNotification("behavior_score_low", USER.somying, "30183", "2570-02-03T10:15:00", "2570-02-03T12:00:00"),
  seedNotification("behavior_score_low", USER.theerapong, "30183", "2570-02-03T10:15:00", null),
  // case เปิดให้อัตโนมัติจากผลคัดกรองมิติสุขภาพจิต "มีปัญหา" ของ 30118
  seedNotification("case_opened", USER.somying, "30118", "2570-02-13T09:00:00", "2570-02-13T09:30:00"),
  seedNotification("case_opened", USER.theerapong, "30118", "2570-02-13T09:00:00", null),
  // นัดเยี่ยมบ้าน HV-001 ถึงผู้ปกครองทุกคนของ 30125
  seedNotification("visit_scheduled", USER.ratana, "30125", "2570-02-10T16:00:00", "2570-02-10T19:45:00", {
    date: hv001.proposedDate,
  }),
  seedNotification("visit_scheduled", USER.ekachai, "30125", "2570-02-10T16:00:00", null, {
    date: hv001.proposedDate,
  }),
].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

/* ------------------------------------------------------------------ */
/* audit log ตั้งต้น — สร้างจากข้อมูลตัวอย่างอื่น เพื่อให้สอดคล้องกัน          */
/* ------------------------------------------------------------------ */

let auditSeq = 0;
const audit = (
  userId: string,
  action: AuditLog["action"],
  entityType: string,
  entityId: string,
  createdAt: string,
  detail: AuditLog["detail"] = null
): AuditLog => ({
  logId: `AL-${String(++auditSeq).padStart(4, "0")}`,
  userId,
  action,
  entityType,
  entityId,
  detail,
  createdAt,
});

const atTime = (date: string, time: string) => (date.includes("T") ? date : `${date}T${time}`);

export const seedAuditLogs: AuditLog[] = [
  audit(USER.admin, "UPDATE", "school_settings", "1", initialSchoolSettings.updatedAt, {
    note: "ตั้งค่าโรงเรียนต้นปีการศึกษา",
    after: { ...initialSchoolSettings },
  }),
  ...operatingWindows.map((w) =>
    audit(
      USER.admin,
      "CREATE",
      "operating_windows",
      w.windowId,
      w.termId === CURRENT_TERM.termId ? "2569-10-25T09:10:00" : "2569-05-10T09:00:00",
      { after: { activity: w.activity, opensAt: w.opensAt, closesAt: w.closesAt } }
    )
  ),
  ...guardianConsents.map((c) =>
    audit(c.guardianUserId, "CREATE", "guardian_consents", c.consentId, c.respondedAt, {
      after: { academicYear: c.academicYear, granted: c.granted },
    })
  ),
  ...screenings.map((s) => audit(s.screenedBy, "CREATE", "screenings", s.screeningId, atTime(s.screenedAt, "10:00:00"))),
  ...careCases.flatMap((c) => [
    audit(c.openedBy ?? SYSTEM_USER_ID, "CREATE", "care_cases", c.caseId, atTime(c.openedAt, "09:00:00"), {
      after: { studentId: c.studentId },
    }),
    ...c.triggers.map((t) =>
      audit(c.openedBy ?? SYSTEM_USER_ID, "CREATE", "care_case_triggers", t.triggerId, t.detectedAt, {
        after: { caseId: c.caseId, source: t.source, sourceRefId: t.sourceRefId },
      })
    ),
    ...c.plans.map((p) => audit(p.createdBy, "CREATE", "care_plans", p.planId, p.createdAt, { after: { caseId: c.caseId } })),
    ...c.followups.map((f) =>
      audit(f.recordedBy, "CREATE", "care_followups", f.followupId, atTime(f.followupDate, "15:00:00"))
    ),
    ...(c.closedAt
      ? [
          audit(c.closedBy ?? SYSTEM_USER_ID, "UPDATE", "care_cases", c.caseId, atTime(c.closedAt, "16:00:00"), {
            before: { status: "active" },
            after: { status: "closed", closeReason: c.closeReason },
          }),
        ]
      : []),
  ]),
  ...checkinLogs.map((c) => audit(c.scannedBy, "CREATE", "checkin_logs", c.logId, c.scannedAt)),
  ...behaviorRecords.flatMap((b) => [
    audit(b.recordedBy, "CREATE", "behavior_records", b.recordId, b.createdAt),
    // การยืนยัน/ยกเว้นบันทึกจาก QR โดยครู
    ...(b.source === "qr_checkin" && b.decidedBy && b.decidedAt
      ? [
          audit(b.decidedBy, "UPDATE", "behavior_records", b.recordId, b.decidedAt, {
            before: { status: "pending" },
            after: { status: b.status },
            ...(b.decisionReason ? { reason: b.decisionReason } : {}),
          }),
        ]
      : []),
    ...(b.status === "voided"
      ? [audit(b.recordedBy, "VOID", "behavior_records", b.recordId, addHoursThai(b.createdAt, 30), { reason: b.voidReason ?? "" })]
      : []),
  ]),
  // ผู้บริหารเปิดดูข้อมูลรายคน — ระบบบันทึกไว้ทุกครั้ง
  audit(USER.director, "VIEW_SENSITIVE", "students", "30118", "2570-02-14T13:10:00", {
    note: "เปิดหน้าข้อมูลนักเรียนรายคน",
  }),
].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
