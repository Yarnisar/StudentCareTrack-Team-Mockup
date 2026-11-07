/**
 * การแจ้งเตือนของครูและแอดมิน (กระดิ่งที่หัวหน้า) ขั้นที่ 1–3: เหตุการณ์ของ UC8, UC11 (ติดตามใกล้/เลยกำหนด, เอกสารส่งต่อ) และ UC9 (เปิดรอบ, ใกล้ปิดรอบ)
 * - เหตุการณ์ที่เกิดทันที (เข้า/ขึ้นระดับเฝ้าระวัง, บันทึกตามกฎส่งต่อ) สร้างตอนที่เกิด
 * - เหตุการณ์ตามเวลา (รอยืนยันถอนสถานะ, เลยกำหนดยืนยัน) คำนวณตอนเปิดหน้าเทียบกับวันสมมติ
 * - งานที่ต้องลงมือ (เปิด case, ตรวจผล) อยู่ในหน้าภาพรวม ไม่ซ้ำในกระดิ่ง
 * - ข้อความของแอดมินไม่ระบุชื่อนักเรียน (หัวข้อ 3.4.1)
 * PROTOTYPE: เก็บในหน่วยความจำ รีเฟรชแล้วหาย อีเมลและผู้รับที่ไม่มีบัญชี (หัวหน้าระดับ ฯลฯ) บันทึกเป็น "บันทึกการส่ง (จำลอง)" ในหน้าตั้งค่า
 * Project 2: ส่งผ่านงานแจ้งเตือนฝั่ง backend (ในระบบ + อีเมล)
 */

import type { Role } from "./roles";

export type StaffNotifyKind = "watch_raised" | "watch_pending" | "watch_overdue" | "watch_overdue_admin" | "refer_recorded" | "followup_due" | "followup_overdue" | "followup_overdue_admin" | "referral_sent" | "window_opened" | "window_closing";

export interface StaffNotification {
  id: string;
  kind: StaffNotifyKind;
  title: string;
  body: string;
  href?: string;
  /** วันเวลาของเหตุการณ์ (พ.ศ. ISO) */
  at: string;
  /** ผู้รับ: ครูที่ปรึกษาของห้อง / ผู้ใช้เฉพาะคน / ทุกคนในบทบาท */
  to: { homeroomOf?: string; userName?: string; role?: Role };
}

/** บันทึกการส่งที่ไม่มีกล่องรับในต้นแบบ (อีเมล / ผู้รับตามระดับที่แอดมินกำหนด) แอดมินดูได้โดยไม่เห็นชื่อนักเรียน */
export interface NotificationLogEntry {
  id: string;
  at: string;
  channel: "ในระบบ" | "อีเมล (จำลอง)";
  to: string;
  text: string;
}

export function isFor(n: StaffNotification, viewer: { role: Role; name: string; homeroom?: string }): boolean {
  return (
    n.to.role === viewer.role ||
    (!!n.to.userName && n.to.userName === viewer.name) ||
    (!!n.to.homeroomOf && n.to.homeroomOf === viewer.homeroom)
  );
}
