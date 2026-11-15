/**
 * ป้ายสถานะนัดหมายเยี่ยมบ้าน แบ่ง 4 กลุ่มตามความหมายต่อผู้ใช้ ใช้ไอคอน พื้น และน้ำหนักต่างกัน ไม่พึ่งสีอย่างเดียว
 * ไม่ใช้เขียว/เหลือง/แดง เพราะสงวนไว้สำหรับกลุ่มผลคัดกรอง
 * - ต้องจัดการ: พื้นเข้ม · รอผู้อื่นตอบ: ขอบทึบ · ยืนยันแล้ว: ม่วงอ่อน · ปิดแล้ว: เทา
 */

import { AlertTriangle, Check, CheckCheck, Clock, X, type LucideIcon } from "lucide-react";
import { APPOINTMENT_STATUS_LABEL, type AppointmentStatus } from "@/lib/types";

type Group = "action" | "waiting" | "confirmed" | "closed";

const GROUP: Record<AppointmentStatus, Group> = {
  reschedule_requested: "action",
  visit_disputed: "action",
  pending: "waiting",
  awaiting_visit_confirmation: "waiting",
  confirmed: "confirmed",
  visit_confirmed: "confirmed",
  completed: "closed",
  completed_no_response: "closed",
  cancelled: "closed",
};

const STYLE: Record<Group, string> = {
  action: "bg-foreground text-background",
  waiting: "border border-foreground/40 text-foreground",
  confirmed: "bg-accent text-primary",
  closed: "bg-muted text-muted-foreground",
};

const ICON: Record<AppointmentStatus, LucideIcon> = {
  reschedule_requested: AlertTriangle,
  visit_disputed: AlertTriangle,
  pending: Clock,
  awaiting_visit_confirmation: Clock,
  confirmed: Check,
  visit_confirmed: Check,
  completed: CheckCheck,
  completed_no_response: CheckCheck,
  cancelled: X,
};

/** ข้อความสั้นสำหรับป้าย ข้อความเต็มอยู่ใน title และ APPOINTMENT_STATUS_LABEL */
const SHORT: Partial<Record<AppointmentStatus, string>> = {
  reschedule_requested: "ขอเลื่อนนัด",
  awaiting_visit_confirmation: "รอยืนยันการเยี่ยม",
  visit_confirmed: "ยืนยันการเยี่ยมแล้ว",
  visit_disputed: "โต้แย้งการเยี่ยม",
  completed_no_response: "ไม่มีผู้ตอบ",
};

export function AppointmentStatusBadge({ status, large = false }: { status: AppointmentStatus; large?: boolean }) {
  const Icon = ICON[status];
  return (
    <span
      title={APPOINTMENT_STATUS_LABEL[status]}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full font-semibold whitespace-nowrap ${
        large ? "px-3 py-1.5 text-[12.5px]" : "px-2 py-0.5 text-[11px]"
      } ${STYLE[GROUP[status]]} ${status === "cancelled" ? "line-through" : ""}`}
    >
      <Icon className={large ? "size-3.5" : "size-3"} aria-hidden />
      {SHORT[status] ?? APPOINTMENT_STATUS_LABEL[status]}
    </span>
  );
}
