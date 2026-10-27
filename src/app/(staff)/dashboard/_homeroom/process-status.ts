/**
 * สถานะของ 5 กระบวนการในห้องของครูประจำชั้น (UC1 ขั้นที่ 5–7) คำนวณจากข้อมูลจริงใน store
 * งานที่ยังไม่เสร็จแบ่งเป็น ยังไม่ดำเนินการ / ใกล้ครบกำหนด / เกินกำหนด ตามวันปิดรอบใน lib/periods.ts
 * ความประพฤติไม่มีรอบให้ทำเสร็จ จึงแสดงคนที่ถึงเกณฑ์เฝ้าระวังแทน
 * Project 2: ย้ายไปคำนวณที่ backend และส่งมาเป็นรายการพร้อมลิงก์
 */

import { formatThaiDate } from "@/lib/format";
import { CURRENT_TERM, DEMO_TODAY } from "@/lib/mock-data";
import { daysBetween, dueStatus, PROCESS_PERIODS, type PeriodProcess } from "@/lib/periods";
import { draftKey, type useStore } from "@/lib/store";
import { SDQ_RATER_LABEL, type Student } from "@/lib/types";

type Store = ReturnType<typeof useStore>;

export type ProcessKey = "screening" | "assessment" | "home_visit" | "care" | "behavior";
export type Status = "done" | "pending" | "near_due" | "overdue" | "watch";

export const PROCESS_LABEL: Record<ProcessKey, string> = {
  screening: "คัดกรอง",
  assessment: "การประเมิน",
  home_visit: "เยี่ยมบ้าน",
  care: "การติดตามช่วยเหลือ",
  behavior: "ความประพฤติ",
};

export const PROCESS_NOTE: Record<ProcessKey, string> = {
  screening: "6 มิติ + Red Flag ทุกคน, 9S เมื่อ Red Flag ปกติ",
  assessment: "SDQ เฉพาะคนที่ระบบเปิดให้ทำ (ยังไม่มี EQ)",
  home_visit: "ทุกคน",
  care: "case และกลุ่มมีปัญหาที่ยังไม่มี case",
  behavior: "ไม่มีรอบกำหนด",
};

export const PROCESS_ORDER = Object.keys(PROCESS_LABEL) as ProcessKey[];

export const STATUS_LABEL: Record<Status, string> = {
  done: "ดำเนินการแล้ว",
  pending: "ยังไม่ดำเนินการ",
  near_due: "ใกล้ครบกำหนด",
  overdue: "เกินกำหนด",
  watch: "ถึงเกณฑ์เฝ้าระวัง",
};

/** 4 สถานะตามรายงาน เรียงตามลำดับคอลัมน์ในตาราง */
export const STATUS_COLUMNS = ["done", "pending", "near_due", "overdue"] as const;

/** ลำดับความเร่งด่วนในรายการ */
const STATUS_RANK: Record<Status, number> = { overdue: 0, near_due: 1, pending: 2, watch: 3, done: 4 };

/** case ที่ไม่มีการติดตามนานกว่านี้ให้บอกไว้ในรายละเอียด — PROTOTYPE: ยังไม่ได้ตกลงกับทีม */
export const STALE_CASE_DAYS = 30;

/** คะแนนความประพฤติสุทธิต่ำกว่าหรือเท่ากับค่านี้ถือว่าถึงเกณฑ์เฝ้าระวัง — PROTOTYPE: รอ UC6/7 */
export const BEHAVIOR_WATCH_SCORE = -5;

export interface Item {
  process: ProcessKey;
  status: Status;
  student: Student;
  detail: string;
  /** วันครบกำหนดของงานนี้ (วันปิดรอบ หรือวันเป้าหมายของ case) */
  due?: string;
  href?: string;
  /** ไม่มี = รอคนอื่นทำ ครูยังไม่ต้องลงมือ */
  action?: string;
}

export interface ProcessSummary {
  process: ProcessKey;
  /** วันปิดรอบ ถ้ามี */
  closesAt?: string;
  counts: Record<Status, number>;
  /** จำนวนหน่วยทั้งหมดของกระบวนการ (คน หรือ case) */
  total: number;
  unit: string;
  /** ความประพฤติ: จำนวนรายการที่บันทึกในภาคเรียน */
  recorded?: number;
}

/** termId ที่ไม่มีข้อมูลจะได้รายการว่าง หน้าจอจึงบอกให้เปลี่ยนตัวกรอง (UC1 Alternate Flow) */
export function processStatus(store: Store, termId: string): { items: Item[]; summaries: ProcessSummary[] } {
  const items: Item[] = [];
  const periods = PROCESS_PERIODS[termId];
  if (termId !== CURRENT_TERM.termId || !periods) return { items, summaries: [] };

  const close = (p: PeriodProcess) => periods[p].closesAt;
  const open = (p: PeriodProcess, base: Omit<Item, "process" | "status" | "due">) => ({
    ...base,
    process: p,
    status: dueStatus(close(p)),
    due: close(p),
  });

  for (const student of store.students) {
    const id = student.studentId;

    // ---- คัดกรอง (UC5): 6 มิติ → Red Flag ของมิติสุขภาพจิต → 9S เมื่อ Red Flag ไม่พบความเสี่ยง (Subflow A)
    const screening = store.screenings.find((s) => s.studentId === id && s.termId === termId);
    const redFlag = store.redFlags.find((r) => r.studentId === id && r.termId === termId);
    const nineS = store.nineS.find((n) => n.studentId === id && n.termId === termId);
    if (screening && redFlag && (redFlag.result === "needs_care" || nineS)) {
      items.push({ process: "screening", status: "done", student, detail: `คัดกรองเมื่อ ${formatThaiDate(screening.screenedAt)}` });
    } else if (screening && redFlag) {
      items.push(
        open("screening", {
          student,
          detail: "Red Flag ผลปกติ เหลือ 9S ของมิติสุขภาพจิต",
          href: `/assessment/nine-s/${id}`,
          action: "ทำ 9S",
        })
      );
    } else if (screening) {
      items.push(
        open("screening", {
          student,
          detail: "คัดกรอง 6 มิติแล้ว เหลือ Red Flag ของมิติสุขภาพจิต",
          href: `/assessment/red-flag/${id}`,
          action: "ทำ Red Flag",
        })
      );
    } else {
      const hasDraft = store.getDraft(draftKey("screening", id)) !== undefined;
      items.push(
        open("screening", {
          student,
          detail: hasDraft ? "มีร่างที่ทำค้างไว้" : "ยังไม่ได้เริ่มคัดกรอง",
          href: `/screening/${id}`,
          action: hasDraft ? "ทำต่อ" : "คัดกรอง",
        })
      );
    }

    // ---- การประเมิน (UC9): SDQ 3 ฉบับ (ครู / นักเรียน / ผู้ปกครอง) ที่ระบบเปิดเมื่อ Red Flag หรือ 9S ควรดูแล
    // PROTOTYPE: ยังไม่มี EQ
    const sdq = store.sdq.filter((s) => s.studentId === id && s.termId === termId);
    if (sdq.length > 0) {
      const pending = sdq.filter((s) => s.status === "pending");
      if (pending.length === 0) {
        items.push({ process: "assessment", status: "done", student, detail: "SDQ ครบทั้ง 3 ฉบับ" });
      } else {
        const teacherPending = pending.some((s) => s.rater === "teacher");
        const others = pending.filter((s) => s.rater !== "teacher").map((s) => SDQ_RATER_LABEL[s.rater]);
        items.push(
          open("assessment", {
            student,
            detail: [
              teacherPending && "SDQ ฉบับครูยังไม่ได้ทำ",
              others.length > 0 && `รอ${others.join(" และ ")}ทำ SDQ`,
            ]
              .filter(Boolean)
              .join(" · "),
            ...(teacherPending && { href: `/assessment/sdq/${id}`, action: "ทำ SDQ" }),
          })
        );
      }
    }

    // ---- เยี่ยมบ้าน: ทุกคน ปีละครั้ง
    const record = store.homeVisitRecords.find((r) => r.studentId === id);
    const appointment = store.appointments.find((a) => a.studentId === id && a.status !== "completed");
    if (record) {
      items.push({ process: "home_visit", status: "done", student, detail: `เยี่ยมบ้านเมื่อ ${formatThaiDate(record.signedAt)}` });
    } else if (!appointment) {
      items.push(open("home_visit", { student, detail: "ยังไม่ได้นัดหมาย", href: "/home-visits", action: "นัดหมาย" }));
    } else if (appointment.status === "reschedule_requested") {
      items.push(
        open("home_visit", { student, detail: "ผู้ปกครองขอเปลี่ยนวันเวลานัด", href: "/home-visits", action: "ดูนัดหมาย" })
      );
    } else if (appointment.status === "confirmed" && appointment.proposedDate.slice(0, 10) <= DEMO_TODAY) {
      const hasDraft = store.getDraft(draftKey("home_visit", appointment.appointmentId)) !== undefined;
      items.push(
        open("home_visit", {
          student,
          detail: hasDraft ? "มีร่างบันทึกที่ทำค้างไว้" : "ถึงวันนัดแล้ว ยังไม่บันทึกผล",
          href: `/home-visits/${appointment.appointmentId}/record`,
          action: hasDraft ? "ทำต่อ" : "บันทึกผล",
        })
      );
    } else if (appointment.status === "confirmed") {
      items.push(
        open("home_visit", {
          student,
          detail: `นัดไว้ ${formatThaiDate(appointment.proposedDate)} ผู้ปกครองยืนยันแล้ว`,
          href: `/home-visits/${appointment.appointmentId}/record`,
        })
      );
    } else {
      items.push(open("home_visit", { student, detail: "รอผู้ปกครองยืนยันวันนัด" }));
    }

    // ---- การติดตามช่วยเหลือ: ครบกำหนดตามวันเป้าหมายของแต่ละ case
    const cases = store.careCases.filter((c) => c.studentId === id);
    const activeCase = cases.find((c) => c.status === "active");
    if (activeCase) {
      const last = activeCase.followups.map((f) => f.followupDate).sort().at(-1);
      const sinceLast = daysBetween(last ?? activeCase.openedAt, DEMO_TODAY);
      items.push({
        process: "care",
        status: dueStatus(activeCase.targetDate || undefined),
        student,
        due: activeCase.targetDate || undefined,
        detail:
          sinceLast > STALE_CASE_DAYS
            ? `ไม่มีการติดตามมา ${sinceLast} วัน`
            : last
              ? `ติดตามล่าสุด ${formatThaiDate(last)}`
              : "เปิด case แล้ว ยังไม่มีการติดตาม",
        href: `/care-cases?student=${id}`,
        action: "บันทึกการติดตาม",
      });
    } else if (store.overallRiskOf(id) === "red") {
      items.push({
        process: "care",
        status: "pending",
        student,
        detail: "ผลคัดกรองอยู่ในกลุ่มมีปัญหา แต่ยังไม่มีแผนช่วยเหลือ",
        href: `/care-cases?student=${id}`,
        action: "เปิด case",
      });
    }
    for (const c of cases.filter((c) => c.status === "closed")) {
      items.push({ process: "care", status: "done", student, detail: `ปิด case เมื่อ ${formatThaiDate(c.closedAt ?? "")}` });
    }

    // ---- ความประพฤติ: ไม่มีรอบ แสดงเฉพาะคนที่ถึงเกณฑ์เฝ้าระวัง
    const score = store.behaviorScoreOf(id);
    if (score <= BEHAVIOR_WATCH_SCORE) {
      items.push({
        process: "behavior",
        status: "watch",
        student,
        detail: `คะแนนความประพฤติสุทธิ ${score} (เกณฑ์เฝ้าระวัง ${BEHAVIOR_WATCH_SCORE})`,
        href: `/students/${id}`,
        action: "ดูประวัติ",
      });
    }
  }

  items.sort(
    (a, b) =>
      STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
      PROCESS_ORDER.indexOf(a.process) - PROCESS_ORDER.indexOf(b.process) ||
      a.student.classNo - b.student.classNo
  );

  const studentIds = new Set(store.students.map((s) => s.studentId));
  const summaries = PROCESS_ORDER.map<ProcessSummary>((process) => {
    const own = items.filter((i) => i.process === process);
    const counts = { done: 0, pending: 0, near_due: 0, overdue: 0, watch: 0 };
    for (const i of own) counts[i.status]++;
    return {
      process,
      closesAt: process === "screening" || process === "assessment" || process === "home_visit" ? close(process) : undefined,
      counts,
      total: process === "behavior" ? store.students.length : own.length,
      unit: process === "care" ? "รายการ" : "คน",
      recorded:
        process === "behavior"
          ? store.behaviorRecords.filter((r) => studentIds.has(r.studentId)).length
          : undefined,
    };
  });

  return { items, summaries };
}
