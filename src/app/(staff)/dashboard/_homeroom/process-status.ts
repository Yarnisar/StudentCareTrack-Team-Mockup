/**
 * สถานะของ 5 กระบวนการในห้องของครูประจำชั้น (UC1 ขั้นที่ 5–7) คำนวณจากข้อมูลจริงใน store
 * งานที่ยังไม่เสร็จแบ่งเป็น ยังไม่ดำเนินการ / ใกล้ครบกำหนด / เกินกำหนด ตามวันปิดของช่วงเวลาที่ผู้ดูแลระบบตั้งในหน้าตั้งค่า
 * (store.assessmentWindows) ส่วน case ใช้วันติดตามครั้งถัดไปที่ครูกำหนด
 * ความประพฤติไม่มีรอบให้ทำเสร็จ จึงแสดงคนที่ถึงเกณฑ์เฝ้าระวังแทน
 * Project 2: ย้ายไปคำนวณที่ backend และส่งมาเป็นรายการพร้อมลิงก์
 */

import { formatThaiDate } from "@/lib/format";
import { CURRENT_TERM, DEMO_TODAY } from "@/lib/mock-data";
import { daysBetween, dueStatus, isLocked, KIND_LABEL, windowFor, type AssessmentKind } from "@/lib/periods";
import { draftKey, type useStore } from "@/lib/store";
import { needsReview } from "@/lib/assessment-review";
import { termOfDate } from "@/lib/terms";
import { ruleKind } from "@/lib/behavior-rules";
import { CASE_URGENCY_LABEL, SDQ_RATER_LABEL, type CaseUrgency, type Student } from "@/lib/types";

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

/** case ที่เร่งด่วนกว่าขึ้นก่อนเมื่อสถานะเท่ากัน */
const URGENCY_RANK: Record<CaseUrgency, number> = { urgent: 0, normal: 1 };

/** ช่วงเวลาในหน้าตั้งค่าที่เป็นของแต่ละกระบวนการ (คัดกรองรวม Red Flag และ 9S ตาม UC6) */
export const PROCESS_KINDS: Partial<Record<ProcessKey, AssessmentKind[]>> = {
  screening: ["screening", "red_flag", "nine_s"],
  assessment: ["sdq", "eq"],
  home_visit: ["home_visit"],
};

export interface Item {
  process: ProcessKey;
  status: Status;
  student: Student;
  detail: string;
  /** วันครบกำหนดของงานนี้ (วันปิดของช่วงเวลา หรือวันติดตามครั้งถัดไปของ case) */
  due?: string;
  /** ช่วงเวลาในหน้าตั้งค่าที่ใช้เป็นวันครบกำหนด */
  windowId?: string;
  urgency?: CaseUrgency;
  href?: string;
  /** ไม่มี = รอคนอื่นทำ ครูยังไม่ต้องลงมือ */
  action?: string;
  /** ช่วงเวลาปิดรับแล้ว ครูส่งเพิ่มไม่ได้จนกว่าผู้ดูแลระบบจะขยายเวลา */
  locked?: boolean;
  /** ความประพฤติ: อยู่ในเกณฑ์เฝ้าระวังจริง หรือคะแนนกลับมาแล้วรอครูยืนยันถอน (สองอย่างต่างกัน) */
  watch?: { level: number; score: number; pendingWithdrawal: boolean; overdueDays?: number };
  /** งานที่ให้ "พิจารณา" เปิด case ครูเลือกยังไม่เปิดพร้อมเหตุผลได้ (basis = เหตุที่พิจารณา) */
  consider?: { basis: string };
}

export interface ProcessSummary {
  process: ProcessKey;
  /** วันปิดของแต่ละช่วงเวลาในกระบวนการนี้ (locked = ตั้งห้ามบันทึกย้อนหลัง) */
  closes: { id: string; label: string; date: string; locked: boolean }[];
  counts: Record<Status, number>;
  /** งานที่ครูลงมือได้ตอนนี้ (มีปุ่มทำต่อ) กับงานที่รอคนอื่นตอบหรือทำก่อน — ตัวเลขใหญ่ของการ์ดใช้ actionable */
  actionable: number;
  waiting: number;
  /** จำนวนหน่วยทั้งหมดของกระบวนการ (คน หรือ case) */
  total: number;
  unit: string;
  /** ความประพฤติ: จำนวนรายการที่บันทึกในภาคเรียน */
  recorded?: number;
}

/** termId ที่ไม่มีข้อมูลจะได้รายการว่าง หน้าจอจึงบอกให้เปลี่ยนตัวกรอง (UC1 Alternate Flow) */
export function processStatus(store: Store, termId: string): { items: Item[]; summaries: ProcessSummary[] } {
  const items: Item[] = [];
  // PROTOTYPE: ช่วงเวลาในหน้าตั้งค่ายังไม่ผูกกับภาคเรียน จึงมีข้อมูลเฉพาะภาคเรียนปัจจุบัน
  if (termId !== CURRENT_TERM.termId) return { items, summaries: [] };
  const windows = store.assessmentWindows;

  /** งานที่ยังไม่เสร็จ: ครบกำหนดตามวันปิดของช่วงเวลาที่ตรงกับขั้นตอนนั้น ไม่มีช่วงเวลา = ยังไม่ดำเนินการ */
  const open = (
    process: ProcessKey,
    kind: AssessmentKind,
    base: Omit<Item, "process" | "status" | "due" | "windowId">,
    round?: 1 | 2
  ): Item => {
    const w = windowFor(windows, kind, round, base.student.roomName);
    const item: Item = { ...base, process, status: dueStatus(w?.closeDate), due: w?.closeDate, windowId: w?.id };
    // ปิดรับแล้ว: ไม่มีปุ่มให้ทำต่อ (UC9)
    if (w && isLocked(w)) return { ...item, href: undefined, action: undefined, locked: true };
    return item;
  };

  for (const student of store.students) {
    const id = student.studentId;

    // ---- คัดกรอง (UC6): 6 มิติ → Red Flag ของมิติสุขภาพจิต → 9S เมื่อ Red Flag ไม่พบความเสี่ยง (Scenario B)
    const screening = store.screenings.find((s) => s.studentId === id && s.termId === termId);
    const redFlag = store.redFlags.find((r) => r.studentId === id && r.termId === termId);
    const nineS = store.nineS.find((n) => n.studentId === id && n.termId === termId);
    if (screening && redFlag && (redFlag.result === "needs_care" || nineS)) {
      items.push({ process: "screening", status: "done", student, detail: `คัดกรองเมื่อ ${formatThaiDate(screening.screenedAt)}` });
    } else if (screening && redFlag) {
      items.push(
        open("screening", "nine_s", {
          student,
          detail: "รอประเมินสุขภาพจิต · Red Flag ผลปกติ เหลือ 9S",
          href: `/assessment/nine-s/${id}`,
          action: "ทำ 9S",
        })
      );
    } else if (screening) {
      items.push(
        open("screening", "red_flag", {
          student,
          detail: "รอประเมินสุขภาพจิต · เหลือ Red Flag",
          href: `/assessment/red-flag/${id}`,
          action: "ทำ Red Flag",
        })
      );
    } else {
      const hasDraft = store.getDraft(draftKey("screening", id)) !== undefined;
      items.push(
        open("screening", "screening", {
          student,
          detail: hasDraft ? "มีร่างที่ยังทำไม่เสร็จ" : "ยังไม่ได้เริ่มคัดกรอง",
          href: `/screening/${id}`,
          action: hasDraft ? "ทำต่อ" : "คัดกรอง",
        })
      );
    }

    // ---- การประเมิน (UC10): SDQ 3 ฉบับ (ครู / นักเรียน / ผู้ปกครอง) ที่ระบบเปิดเมื่อ Red Flag หรือ 9S ควรดูแล
    const sdq = store.sdqSetOf(id).filter((s) => s.termId === termId);
    if (sdq.length > 0) {
      const pending = sdq.filter((s) => s.status === "pending");
      const review = store.sdqReview(id);
      if (needsReview(review.state)) {
        // ครูที่ปรึกษาตรวจผลก่อนเปิดให้นักเรียนและผู้ปกครอง (UC10 สถานการณ์ B) — ไม่มีวันครบกำหนดในรายงาน
        items.push({
          process: "assessment",
          status: "pending",
          student,
          detail:
            review.state === "re_review"
              ? "มีการแก้คำตอบ SDQ หลังตรวจ ต้องตรวจผลใหม่"
              : review.state === "closed_incomplete"
                ? "ปิดรอบแล้วผู้ตอบ SDQ ไม่ครบ ตรวจจากข้อมูลที่มี"
                : "SDQ ครบทั้ง 3 ฉบับ รอครูตรวจผล",
          href: `/assessment/review/${id}`,
          action: "ตรวจผล",
        });
      } else if (pending.length === 0) {
        items.push({ process: "assessment", status: "done", student, detail: "SDQ ครบทั้ง 3 ฉบับ ตรวจผลแล้ว" });
      } else {
        const teacherPending = pending.some((s) => s.rater === "teacher");
        const others = pending.filter((s) => s.rater !== "teacher").map((s) => SDQ_RATER_LABEL[s.rater]);
        const base = {
          student,
          detail: [
            teacherPending && "SDQ ฉบับครูยังไม่ได้ทำ",
            others.length > 0 && `รอ${others.join(" และ ")}ทำ SDQ`,
          ]
            .filter(Boolean)
            .join(" · "),
          ...(teacherPending && { href: `/assessment/sdq/${id}`, action: "ทำ SDQ" }),
        };
        // ครบกำหนดตามช่วงเวลา SDQ ของรอบนั้น
        items.push(open("assessment", "sdq", base, pending[0].round));
      }
    }

    // ---- EQ (UC10): มัธยมให้นักเรียนประเมินตนเอง เลือกไม่ทำได้
    const eq = store.eqOf(id);
    const eqReview = store.eqReview(id);
    if (eq?.status === "declined") {
      items.push({ process: "assessment", status: "done", student, detail: "นักเรียนเลือกไม่ทำ EQ" });
    } else if (eq?.status === "completed" && needsReview(eqReview.state)) {
      items.push({
        process: "assessment",
        status: "pending",
        student,
        detail: eqReview.state === "re_review" ? "นักเรียนแก้คำตอบ EQ หลังตรวจ ต้องตรวจผลใหม่" : "นักเรียนทำ EQ แล้ว รอครูตรวจผล",
        href: `/assessment/review/${id}`,
        action: "ตรวจผล EQ",
      });
    } else if (eq?.status === "completed") {
      items.push({ process: "assessment", status: "done", student, detail: "EQ ตรวจผลแล้ว" });
    } else if (eq) {
      items.push(open("assessment", "eq", { student, detail: "รอนักเรียนทำ EQ" }));
    }

    // ---- เยี่ยมบ้าน: ทุกคน ปีละครั้ง
    // ผลของนัดที่ถูกแจ้งว่าไม่ได้เยี่ยมจริงไม่นับว่าเยี่ยมแล้ว (UC4 Alt-E)
    const disputed = new Set(store.appointments.filter((a) => a.status === "visit_disputed").map((a) => a.appointmentId));
    const record = store.homeVisitRecords.find((r) => r.studentId === id && !disputed.has(r.appointmentId));
    // นัดล่าสุดที่ยังไม่ปิด ถ้าครูนัดใหม่แล้ว นัดเดิมที่ถูกแจ้งว่าไม่ได้เยี่ยมจะไม่ถูกหยิบมาแสดง
    const appointment = store.appointments
      .filter((a) => a.studentId === id && !["completed", "completed_no_response", "cancelled"].includes(a.status))
      .sort((a, b) => b.proposedDate.localeCompare(a.proposedDate))[0];
    if (appointment?.status === "visit_disputed") {
      items.push(
        open("home_visit", "home_visit", { student, detail: "แจ้งว่าไม่ได้เยี่ยมบ้านจริง ต้องนัดใหม่", href: "/home-visits", action: "ดูนัดหมาย" })
      );
    } else if (record) {
      items.push({ process: "home_visit", status: "done", student, detail: `เยี่ยมบ้านเมื่อ ${formatThaiDate(record.signedAt)}` });
    } else if (!appointment) {
      items.push(open("home_visit", "home_visit", { student, detail: "ยังไม่ได้นัดหมาย", href: "/home-visits", action: "นัดหมาย" }));
    } else if (appointment.status === "reschedule_requested") {
      items.push(
        open("home_visit", "home_visit", { student, detail: "ผู้ปกครองขอเปลี่ยนวันเวลานัด", href: "/home-visits", action: "ดูนัดหมาย" })
      );
    } else if (appointment.status === "confirmed" && appointment.proposedDate.slice(0, 10) <= DEMO_TODAY) {
      const hasDraft = store.getDraft(draftKey("home_visit", appointment.appointmentId)) !== undefined;
      items.push(
        open("home_visit", "home_visit", {
          student,
          detail: hasDraft ? "มีร่างบันทึกที่ยังทำไม่เสร็จ" : "ถึงวันนัดแล้ว ยังไม่บันทึกผล",
          href: `/home-visits/${appointment.appointmentId}/record`,
          action: hasDraft ? "ทำต่อ" : "บันทึกผล",
        })
      );
    } else if (appointment.status === "confirmed") {
      items.push(
        open("home_visit", "home_visit", {
          student,
          detail: `นัดไว้ ${formatThaiDate(appointment.proposedDate)} ผู้ปกครองยืนยันแล้ว`,
          href: `/home-visits/${appointment.appointmentId}/record`,
        })
      );
    } else {
      items.push(open("home_visit", "home_visit", { student, detail: "รอผู้ปกครองยืนยันวันนัด" }));
    }

    // ---- การติดตามช่วยเหลือ (UC11): ครบกำหนดตามวันติดตามครั้งถัดไปที่ครูกำหนดใน case
    const cases = store.careCases.filter((c) => c.studentId === id);
    const activeCase = cases.find((c) => c.status === "active");
    if (activeCase && activeCase.goal === "") {
      // ระบบเปิดให้จากผลคัดกรอง ครูยังไม่วางแผน (UC11 ข้อ 5)
      items.push({
        process: "care",
        status: "pending",
        student,
        detail: `ระบบเปิดกรณีให้จาก${activeCase.triggerSource} · ยังไม่วางแผนช่วยเหลือ`,
        href: `/care-cases?student=${id}`,
        action: "วางแผนช่วยเหลือ",
      });
    } else if (activeCase) {
      const last = activeCase.followups.map((f) => f.followupDate).sort().at(-1);
      const next = activeCase.nextFollowupDate || undefined;
      items.push({
        process: "care",
        status: dueStatus(next),
        student,
        due: next,
        urgency: activeCase.urgency,
        detail: [
          `ความเร่งด่วน: ${CASE_URGENCY_LABEL[activeCase.urgency]}`,
          !next && "ยังไม่กำหนดวันติดตามครั้งถัดไป",
          last ? `ติดตามล่าสุด ${formatThaiDate(last)}` : "ยังไม่มีการติดตาม",
        ]
          .filter(Boolean)
          .join(" · "),
        href: `/care-cases?student=${id}`,
        action: "บันทึกการติดตาม",
      });
    } else {
      // ยังไม่มี case ที่เปิดอยู่: รวมเหตุที่ควรพิจารณาเปิด case ไว้เป็นงานเดียวต่อนักเรียน
      // กลุ่มมีปัญหาจากคัดกรอง (UC6) / เข้าสถานะเฝ้าระวังความประพฤติ (UC8 Alt-D ข้อ 2) / บันทึกตามกฎส่งต่อ (UC8 Alt-G)
      const reasons: string[] = [];
      const basis: string[] = [];
      if (store.overallRiskOf(id) === "red") {
        reasons.push("ผลคัดกรองอยู่ในกลุ่มมีปัญหา");
        basis.push("red");
      }
      const level = store.behaviorWatchLevelOf(id);
      if (level > 0) {
        reasons.push(`เฝ้าระวังความประพฤติระดับ ${level}`);
        basis.push(`watch${level}`);
      }
      const refers = store.behaviorOf(id).filter((r) => {
        const rule = store.behaviorRules.find((x) => x.ruleId === r.ruleId);
        return !r.cancelled && !!rule && ruleKind(rule) === "refer";
      });
      if (refers.length > 0) {
        reasons.push(`บันทึกตามกฎส่งต่อ ${refers.length} รายการ`);
        basis.push(`refer:${refers.map((r) => r.recordId).sort().join(",")}`);
      }
      const key = basis.join("|");
      // ครูพิจารณาแล้วเลือกยังไม่เปิด และยังไม่มีเหตุใหม่ จึงไม่แสดงซ้ำ
      if (reasons.length > 0 && store.caseConsiderations[id]?.basis !== key) {
        items.push({
          process: "care",
          status: "pending",
          student,
          detail: `ยังไม่มีกรณี · ${reasons.join(" · ")}`,
          href: `/care-cases?student=${id}${level > 0 || refers.length > 0 ? "&from=behavior" : ""}`,
          action: "เปิดกรณี",
          consider: { basis: key },
        });
      }
    }
    for (const c of cases.filter((c) => c.status === "closed")) {
      items.push({ process: "care", status: "done", student, detail: `ปิดกรณีเมื่อ ${formatThaiDate(c.closedAt ?? "")}` });
    }

    // ---- ความประพฤติ: ไม่มีรอบ แสดงเฉพาะคนที่ถึงเกณฑ์เฝ้าระวัง
    // เกณฑ์เฝ้าระวังมาจากหน้าตั้งค่า (UC7 Scenario D)
    if (store.isBehaviorWatch(id)) {
      const score = store.behaviorScoreOf(id);
      const level = store.behaviorWatchLevelOf(id);
      const pendingWithdrawal = store.watchWithdrawalPending(id);
      const wait = pendingWithdrawal ? store.withdrawalWait(id) : null;
      const overdueDays = wait?.overdue ? Math.max(1, daysBetween(wait.dueOn, DEMO_TODAY)) : undefined;
      const full = store.behaviorScoreConfig.ceiling ?? store.behaviorScoreConfig.startScore;
      items.push({
        process: "behavior",
        status: "watch",
        student,
        watch: { level, score, pendingWithdrawal, overdueDays },
        detail: pendingWithdrawal
          ? `คะแนนกลับมา ${score}/${full}${overdueDays ? ` · เลยกำหนดยืนยัน ${overdueDays} วัน` : ""}`
          : `คะแนน ${score}/${full}`,
        href: pendingWithdrawal ? "/behavior/withdrawals" : `/students/${id}?tab=conduct`,
        action: pendingWithdrawal ? "ยืนยันถอน" : "ดูประวัติ",
      });
    }
  }

  /** เฝ้าระวังในเกณฑ์จริงขึ้นก่อน รองลงมาคือเลยกำหนดยืนยันถอน */
  const rank = (i: Item) =>
    i.watch ? (i.watch.pendingWithdrawal ? (i.watch.overdueDays ? -1 : 3) : -2) : STATUS_RANK[i.status];
  items.sort(
    (a, b) =>
      rank(a) - rank(b) ||
      PROCESS_ORDER.indexOf(a.process) - PROCESS_ORDER.indexOf(b.process) ||
      (a.urgency ? URGENCY_RANK[a.urgency] : 3) - (b.urgency ? URGENCY_RANK[b.urgency] : 3) ||
      a.student.classNo - b.student.classNo
  );

  const studentIds = new Set(store.students.map((s) => s.studentId));
  const summaries = PROCESS_ORDER.map<ProcessSummary>((process) => {
    const own = items.filter((i) => i.process === process);
    const counts = { done: 0, pending: 0, near_due: 0, overdue: 0, watch: 0 };
    for (const i of own) counts[i.status]++;
    const undone = own.filter((i) => i.status !== "done" && i.status !== "watch");
    return {
      process,
      actionable: undone.filter((i) => i.action && !i.locked).length,
      waiting: undone.filter((i) => !i.action && !i.locked).length,
      closes: windows
        .filter((w) => w.enabled && (PROCESS_KINDS[process] ?? []).includes(w.kind))
        .map((w) => ({
          id: w.id,
          label: KIND_LABEL[w.kind] + (w.round ? ` รอบ ${w.round}` : ""),
          date: w.closeDate,
          locked: w.lockAfterClose,
        })),
      counts,
      total: process === "behavior" ? store.students.length : own.length,
      unit: process === "care" ? "รายการ" : "คน",
      recorded:
        process === "behavior"
          ? store.behaviorRecords.filter((r) => studentIds.has(r.studentId) && termOfDate(r.occurredAt).termId === termId).length
          : undefined,
    };
  });

  return { items, summaries };
}
