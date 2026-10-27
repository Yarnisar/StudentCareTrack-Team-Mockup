/**
 * เหตุการณ์ในปฏิทินของภาพรวมครูประจำชั้น: ข้อมูลชุดเดียวกับตารางสถานะ แต่ดูตามวัน
 * - ช่วงเวลาของแต่ละกระบวนการ (lib/periods.ts) และวันปิดรอบพร้อมจำนวนที่ยังไม่เสร็จ
 * - นัดเยี่ยมบ้าน (UC3) และวันเป้าหมายของ case ที่เปิดอยู่ (UC10)
 * ยังไม่มีวันติดตามครั้งถัดไปของ case (UC10 Subflow B) เพราะแบบบันทึกการติดตามยังไม่มีช่องนี้
 */

import { formatThaiTime } from "@/lib/format";
import { PROCESS_PERIODS, type PeriodProcess } from "@/lib/periods";
import type { useStore } from "@/lib/store";
import { APPOINTMENT_STATUS_LABEL, type Student } from "@/lib/types";
import { PROCESS_LABEL, type ProcessSummary } from "./process-status";

type Store = ReturnType<typeof useStore>;

export type EventKind = "visit" | "close" | "case_target";

export const EVENT_LABEL: Record<EventKind, string> = {
  visit: "นัดเยี่ยมบ้าน",
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
  /** เรื่องที่ต้องจับตา (ขอเปลี่ยนวัน, ยังมีงานค้างตอนปิดรอบ) แสดงเด่นกว่าปกติ */
  attention?: boolean;
  href?: string;
  action?: string;
}

export interface PeriodRange {
  process: PeriodProcess;
  opensAt: string;
  closesAt: string;
}

const PERIOD_HREF: Record<PeriodProcess, string> = {
  screening: "/screening",
  assessment: "/assessment",
  home_visit: "/home-visits",
};

export function calendarEvents(
  store: Store,
  termId: string,
  summaries: ProcessSummary[]
): { events: CalendarEvent[]; periods: PeriodRange[] } {
  const termPeriods = PROCESS_PERIODS[termId];
  if (!termPeriods || summaries.length === 0) return { events: [], periods: [] };

  const periods = (Object.keys(termPeriods) as PeriodProcess[]).map((process) => ({
    process,
    ...termPeriods[process],
  }));
  const events: CalendarEvent[] = [];

  for (const p of periods) {
    const counts = summaries.find((s) => s.process === p.process)?.counts;
    const left = counts ? counts.pending + counts.near_due + counts.overdue : 0;
    events.push({
      date: p.closesAt,
      kind: "close",
      title: `ปิดรอบ${PROCESS_LABEL[p.process]}`,
      detail: left > 0 ? `ยังไม่เสร็จ ${left} คน` : "ดำเนินการครบแล้ว",
      attention: left > 0,
      href: PERIOD_HREF[p.process],
      action: "ดูรายชื่อ",
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
      attention: a.status === "reschedule_requested",
      href: a.status === "confirmed" ? `/home-visits/${a.appointmentId}/record` : "/home-visits",
      action: a.status === "confirmed" ? "บันทึกผล" : "ดูนัดหมาย",
    });
  }

  for (const c of store.careCases.filter((c) => c.status === "active" && c.targetDate)) {
    const student = store.getStudent(c.studentId);
    if (!student) continue;
    events.push({
      date: c.targetDate,
      kind: "case_target",
      title: student.fullName,
      detail: "ถึงวันที่ตั้งเป้าไว้ ควรประเมินผลหรือปรับแผน",
      student,
      href: `/care-cases?student=${c.studentId}`,
      action: "ดู case",
    });
  }

  events.sort((a, b) => a.date.localeCompare(b.date) || EVENT_KINDS.indexOf(a.kind) - EVENT_KINDS.indexOf(b.kind));
  return { events, periods };
}
