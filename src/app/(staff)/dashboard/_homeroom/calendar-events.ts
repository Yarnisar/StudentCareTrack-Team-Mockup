/**
 * เหตุการณ์ในปฏิทินของภาพรวมครูประจำชั้น: ข้อมูลชุดเดียวกับตารางสถานะ แต่ดูตามวัน
 * - ช่วงเวลาที่แอดมินตั้งในหน้าตั้งค่า (store.assessmentWindows) และวันปิดพร้อมจำนวนที่ยังไม่เสร็จ
 * - นัดเยี่ยมบ้าน (UC4), วันติดตามครั้งถัดไปและวันเป้าหมายของ case ที่เปิดอยู่ (UC11)
 */

import { formatThaiTime } from "@/lib/format";
import { CURRENT_TERM } from "@/lib/mock-data";
import { dueStatus, KIND_LABEL, windowCoversRoom } from "@/lib/periods";
import { TEACHER_ASSIGNMENTS } from "@/lib/roles";
import type { useStore } from "@/lib/store";
import { APPOINTMENT_STATUS_LABEL, CASE_URGENCY_LABEL, type Student } from "@/lib/types";
import type { Item } from "./process-status";

type Store = ReturnType<typeof useStore>;

export type EventKind = "visit" | "case_followup" | "close" | "case_target";

export const EVENT_LABEL: Record<EventKind, string> = {
  visit: "นัดเยี่ยมบ้าน",
  case_followup: "วันติดตาม case",
  close: "ปิดรอบ",
  case_target: "วันเป้าหมาย case",
};

export const EVENT_KINDS = Object.keys(EVENT_LABEL) as EventKind[];

export interface CalendarEvent {
  /** วันที่ พ.ศ. รูปแบบ "2570-02-18" */
  date: string;
  kind: EventKind;
  title: string;
  detail: string;
  student?: Student;
  /** เรื่องที่ต้องจับตา (ขอเปลี่ยนวัน, ยังมีงานค้างตอนปิดรอบ, case เร่งด่วนหรือเลยวันติดตาม) แสดงเด่นกว่าปกติ */
  attention?: boolean;
  href?: string;
  action?: string;
}

export interface PeriodRange {
  id: string;
  label: string;
  opensAt: string;
  closesAt: string;
}

/** termId ที่ไม่มีข้อมูล (items ว่าง) จะไม่มีเหตุการณ์ หน้าจอจึงบอกให้เปลี่ยนตัวกรองเหมือนตาราง */
export function calendarEvents(
  store: Store,
  items: Item[],
  hasData: boolean
): { events: CalendarEvent[]; periods: PeriodRange[] } {
  if (!hasData) return { events: [], periods: [] };

  const room = TEACHER_ASSIGNMENTS.homeroom?.homeroomRoom ?? "";
  const windows = store.assessmentWindows.filter(
    (w) => w.enabled && (w.termId ?? CURRENT_TERM.termId) === CURRENT_TERM.termId && windowCoversRoom(w, room)
  );
  const periods = windows.map((w) => ({
    id: w.id,
    label: KIND_LABEL[w.kind] + (w.round ? ` รอบ ${w.round}` : ""),
    opensAt: w.openDate,
    closesAt: w.closeDate,
  }));
  const events: CalendarEvent[] = [];

  for (const p of periods) {
    const left = items.filter((i) => i.windowId === p.id && i.status !== "done").length;
    events.push({
      date: p.closesAt,
      kind: "close",
      title: `ปิดรอบ ${p.label}`,
      detail: left > 0 ? `ยังไม่เสร็จ ${left} คน` : "ไม่มีงานค้างในรอบนี้",
      attention: left > 0,
    });
  }

  for (const a of store.appointments) {
    const student = store.getStudent(a.studentId);
    if (!student || a.status === "cancelled") continue;
    events.push({
      date: a.proposedDate.slice(0, 10),
      kind: "visit",
      title: student.fullName,
      detail: `${formatThaiTime(a.proposedDate)} น. · ${APPOINTMENT_STATUS_LABEL[a.status]}`,
      student,
      attention: a.status === "reschedule_requested" || a.status === "visit_disputed",
      href: a.status === "confirmed" ? `/home-visits/${a.appointmentId}/record` : "/home-visits",
      action: a.status === "confirmed" ? "บันทึกผล" : "ดูนัดหมาย",
    });
  }

  for (const c of store.careCases.filter((c) => c.status === "active")) {
    const student = store.getStudent(c.studentId);
    if (!student) continue;
    const href = `/care-cases?student=${c.studentId}`;
    if (c.nextFollowupDate) {
      const overdue = dueStatus(c.nextFollowupDate) === "overdue";
      events.push({
        date: c.nextFollowupDate,
        kind: "case_followup",
        title: student.fullName,
        detail: `ความเร่งด่วน: ${CASE_URGENCY_LABEL[c.urgency]}${overdue ? " · เลยวันติดตามแล้ว" : ""}`,
        student,
        attention: c.urgency === "urgent" || overdue,
        href,
        action: "บันทึกการติดตาม",
      });
    }
    if (c.targetDate) {
      events.push({
        date: c.targetDate,
        kind: "case_target",
        title: student.fullName,
        detail: "ถึงวันที่ตั้งเป้าไว้ ควรประเมินผลหรือปรับแผน",
        student,
        href,
        action: "ดู case",
      });
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date) || EVENT_KINDS.indexOf(a.kind) - EVENT_KINDS.indexOf(b.kind));
  return { events, periods };
}
