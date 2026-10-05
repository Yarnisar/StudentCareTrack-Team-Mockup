/**
 * แม่แบบข้อความแจ้งเตือนต่อ event_type
 *
 * ข้อความบอกแค่ว่ามีเรื่องอะไรของนักเรียนคนไหน — ห้ามมีข้อมูลอ่อนไหว
 * ผู้เรียก notify() ส่งได้เฉพาะ NotificationParams (ตัวเลข วันที่ กิจกรรม ชื่อวิชา)
 * จึงใส่รายละเอียดอื่นลงในข้อความไม่ได้
 */

import { formatThaiDate } from "./format";
import {
  OPERATING_ACTIVITY_LABEL,
  type NotificationEventType,
  type NotificationParams,
  type OperatingActivity,
  type UserRole,
} from "./types";

export const NOTIFICATION_EVENT_LABEL: Record<NotificationEventType, string> = {
  case_opened: "เปิด care case",
  case_trigger_added: "เหตุใหม่ใน care case",
  pending_late_digest: "บันทึกมาสายรอยืนยัน",
  late_threshold: "มาสายครบเกณฑ์",
  behavior_score_low: "คะแนนความประพฤติต่ำกว่าเกณฑ์",
  window_closing: "ช่วงดำเนินงานใกล้ปิด",
  sdq_requested: "ขอให้ทำแบบประเมิน SDQ",
  visit_scheduled: "นัดเยี่ยมบ้าน",
  visit_rescheduled: "ขอเปลี่ยนวันนัดเยี่ยมบ้าน",
  behavior_confirmed: "บันทึกความประพฤติ",
  late_weekly_digest: "สรุปการมาสายประจำสัปดาห์",
  dc_scores_requested: "ขอให้ส่งคะแนนคุณลักษณะฯ",
};

const ACTIVITY_PATH: Record<OperatingActivity, string> = {
  screening: "/screening",
  home_visit: "/home-visits",
  sdq: "/assessment",
  care_record: "/care-cases",
};

const isPortal = (role: UserRole) => role === "parent" || role === "student";

export interface NotificationContent {
  message: string;
  linkPath: string;
}

/**
 * สร้างข้อความและลิงก์ของการแจ้งเตือน
 * @param studentName ชื่อนักเรียน (ชื่อไม่ใช่ข้อมูลอ่อนไหว) หรือ null สำหรับเรื่องระดับห้อง/โรงเรียน
 * @param recipientRole ใช้เลือกหน้าที่ลิงก์ไป (ผู้ปกครอง/นักเรียนไปหน้า portal)
 */
export function buildNotificationContent(
  eventType: NotificationEventType,
  studentId: string | null,
  studentName: string | null,
  recipientRole: UserRole,
  params: NotificationParams = {}
): NotificationContent {
  const who = studentName ?? "นักเรียน";
  const studentPath = studentId ? `/students/${studentId}` : "/students";
  const date = params.date ? formatThaiDate(params.date) : "";
  const count = params.count ?? 0;

  switch (eventType) {
    case "case_opened":
      return { message: `มีการเปิด care case ของ ${who}`, linkPath: "/care-cases" };
    case "case_trigger_added":
      return { message: `มีเหตุใหม่เพิ่มเข้าใน care case ของ ${who}`, linkPath: "/care-cases" };
    case "pending_late_digest":
      return { message: `มีบันทึกมาสายรอยืนยัน ${count} รายการ`, linkPath: "/behavior" };
    case "late_threshold":
      return { message: `${who} มาสายครบ ${count} ครั้งในเดือนนี้`, linkPath: studentPath };
    case "behavior_score_low":
      return { message: `คะแนนความประพฤติของ ${who} ต่ำกว่าเกณฑ์ที่โรงเรียนกำหนด`, linkPath: studentPath };
    case "window_closing": {
      const activity = params.activity ?? "screening";
      return {
        message: `ช่วงดำเนินงาน${OPERATING_ACTIVITY_LABEL[activity]} จะปิดวันที่ ${date} — โปรดบันทึกให้ครบก่อนปิด`,
        linkPath: ACTIVITY_PATH[activity],
      };
    }
    case "sdq_requested":
      return {
        message: `มีแบบประเมิน SDQ ของ ${who} รอให้ทำ`,
        linkPath:
          recipientRole === "parent"
            ? "/portal/parent/results"
            : recipientRole === "student"
              ? "/portal/student/sdq"
              : studentId
                ? `/assessment/sdq/${studentId}`
                : "/assessment",
      };
    case "visit_scheduled":
      return {
        message: date ? `มีนัดเยี่ยมบ้านของ ${who} วันที่ ${date}` : `มีนัดเยี่ยมบ้านของ ${who}`,
        linkPath: isPortal(recipientRole) ? "/portal/parent/appointment" : "/home-visits",
      };
    case "visit_rescheduled":
      return {
        message: `มีการขอเปลี่ยนวันนัดเยี่ยมบ้านของ ${who}`,
        linkPath: isPortal(recipientRole) ? "/portal/parent/appointment" : "/home-visits",
      };
    case "behavior_confirmed":
      return {
        message: `มีบันทึกความประพฤติใหม่ของ ${who}`,
        linkPath: isPortal(recipientRole) ? "/portal/parent/results" : studentPath,
      };
    case "late_weekly_digest":
      return {
        message: `สรุปการมาสายสัปดาห์นี้ของ ${who}: ${count} ครั้ง`,
        linkPath: isPortal(recipientRole) ? "/portal/parent/results" : studentPath,
      };
    case "dc_scores_requested":
      return {
        message: params.subjectName
          ? `โปรดส่งผลการประเมินคุณลักษณะอันพึงประสงค์ (ปพ.5) รายวิชา${params.subjectName}`
          : "โปรดส่งผลการประเมินคุณลักษณะอันพึงประสงค์ (ปพ.5)",
        linkPath: "/characteristics",
      };
  }
}
