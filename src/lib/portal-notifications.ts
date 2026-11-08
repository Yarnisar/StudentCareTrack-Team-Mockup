/**
 * การแจ้งเตือนในระบบของนักเรียนและผู้ปกครอง (UC3 ข้อ 6)
 * PROTOTYPE: ยังไม่มีตารางแจ้งเตือนจริง จึงสร้างจากเหตุการณ์ในระบบ ได้แก่ บันทึกพฤติกรรม (UC8 ข้อ 15)
 * สถานะเฝ้าระวัง (UC8 Alt-D) นัดเยี่ยมบ้าน (UC4) และแบบประเมินที่ต้องทำ (UC9 ข้อ 13)
 * เนื้อหาเป็นข้อมูลโดยสรุปเท่านั้น ไม่มีผลคัดกรองหรือรายละเอียด case (UC3 ข้อ 4, NFR ข้อ 2)
 */

import { formatThaiDate, formatThaiTime } from "./format";
import { CURRENT_TERM, DEMO_TODAY } from "./mock-data";
import { KIND_LABEL, windowCoversRoom, windowNotice, type AssessmentWindow } from "./periods";
import type { BehaviorRecord, BehaviorRule, HomeVisitAppointment, SdqAssessment } from "./types";
import type { EqAssessment } from "./eq";

export interface PortalNotification {
  id: string;
  at: string;
  title: string;
  body: string;
}

export function buildNotifications(input: {
  viewer: "student" | "parent";
  behaviors: BehaviorRecord[];
  rules: BehaviorRule[];
  watchLevel: number;
  appointments: HomeVisitAppointment[];
  sdq: SdqAssessment[];
  eq?: EqAssessment;
  /** ครูที่ปรึกษายืนยันถอนสถานะเฝ้าระวังแล้ว (UC8 สถานการณ์ C ข้อ 5) */
  withdrawals?: { at: string }[];
  /** รอบประเมินที่แอดมินตั้ง และห้องของนักเรียน ใช้แจ้งเปิดรอบ/ใกล้ปิดรอบ (UC9 ข้อ 14, Alt-B) */
  windows?: AssessmentWindow[];
  room?: string;
}): PortalNotification[] {
  const list: PortalNotification[] = [];

  // บันทึกพฤติกรรมแจ้งผู้ปกครองทุกครั้ง (UC8 ข้อ 15)
  if (input.viewer === "parent")
    for (const b of input.behaviors) {
      const rule = input.rules.find((r) => r.ruleId === b.ruleId);
      list.push({
        id: `bh-${b.recordId}`,
        at: b.occurredAt,
        title: "มีการบันทึกพฤติกรรม",
        body: `${rule?.name ?? "พฤติกรรม"} · ${formatThaiDate(b.occurredAt)} ดูรายละเอียดได้ที่แท็บความประพฤติ`,
      });
      // แก้ไขหรือยกเลิกรายการแจ้งผู้ปกครองด้วย (UC8 สถานการณ์ B ข้อ 10)
      const lastEdit = b.editHistory?.at(-1);
      if (lastEdit)
        list.push({
          id: `bh-${b.recordId}-edit-${b.editHistory!.length}`,
          at: lastEdit.at,
          title: "มีการแก้ไขบันทึกพฤติกรรม",
          body: `${rule?.name ?? "พฤติกรรม"} · ดูรายการล่าสุดได้ที่แท็บความประพฤติ`,
        });
      if (b.cancelled)
        list.push({
          id: `bh-${b.recordId}-cancel`,
          at: b.cancelled.at,
          title: "มีการยกเลิกบันทึกพฤติกรรม",
          body: `${rule?.name ?? "พฤติกรรม"} · ${formatThaiDate(b.occurredAt)} ไม่นับคะแนนแล้ว`,
        });
    }

  if (input.watchLevel > 0)
    list.push({
      id: `watch-${input.watchLevel}`,
      at: `${DEMO_TODAY}T08:00:00`,
      title: "เข้าสถานะเฝ้าระวังด้านความประพฤติ",
      body: `ระดับ ${input.watchLevel} · ครูที่ปรึกษาจะติดตามและอาจติดต่อเพื่อพูดคุย`,
    });

  for (const w of input.withdrawals ?? [])
    list.push({
      id: `watch-withdrawn-${w.at}`,
      at: w.at,
      title: "ถอนสถานะเฝ้าระวังด้านความประพฤติแล้ว",
      body: "ครูที่ปรึกษาตรวจสอบแล้ว ขอบคุณที่ปรับตัว",
    });

  for (const a of input.appointments) {
    if (a.status === "pending")
      list.push({
        id: `ap-${a.appointmentId}-pending`,
        at: a.proposedDate,
        title: "นัดหมายเยี่ยมบ้าน รอการยืนยัน",
        body: `${a.teacherName} · ${formatThaiDate(a.proposedDate)} ${formatThaiTime(a.proposedDate)}`,
      });
    if (a.status === "awaiting_visit_confirmation")
      list.push({
        id: `ap-${a.appointmentId}-visit`,
        at: a.proposedDate,
        title: "ยืนยันว่าครูได้เยี่ยมบ้านจริง",
        body: `ครูบันทึกผลการเยี่ยมบ้านแล้ว ยืนยันได้ภายใน ${formatThaiDate(a.visitConfirmDeadline ?? "")} ที่เมนูนัดหมาย`,
      });
    if (a.status === "cancelled")
      list.push({
        id: `ap-${a.appointmentId}-cancelled`,
        at: `${DEMO_TODAY}T08:00:00`,
        title: "ครูยกเลิกนัดเยี่ยมบ้าน",
        body: `${formatThaiDate(a.proposedDate)}${a.cancelReason ? ` · เหตุผล: ${a.cancelReason}` : ""} ครูจะนัดหมายใหม่`,
      });
    if (a.status === "confirmed")
      list.push({
        id: `ap-${a.appointmentId}-confirmed`,
        at: a.proposedDate,
        title: "ยืนยันนัดเยี่ยมบ้านแล้ว",
        body: `${formatThaiDate(a.proposedDate)} ${formatThaiTime(a.proposedDate)}`,
      });
  }

  const own = input.sdq.find((s) => s.rater === input.viewer && s.status === "pending");
  if (own)
    list.push({
      id: `sdq-${own.id}`,
      at: `${DEMO_TODAY}T07:00:00`,
      title: "มีแบบประเมิน SDQ ที่ต้องทำ",
      body: input.viewer === "parent" ? "ฉบับผู้ปกครอง ทำได้ที่เมนูผลประเมิน" : "ฉบับนักเรียน ทำได้ที่เมนูแบบประเมิน",
    });

  if (input.viewer === "student" && input.eq?.status === "pending")
    list.push({
      id: `eq-${input.eq.id}`,
      at: `${DEMO_TODAY}T07:00:00`,
      title: "มีแบบประเมิน EQ ที่ต้องทำ",
      body: "ทำได้ที่เมนูแบบประเมิน หรือเลือกไม่ทำก็ได้",
    });

  // แจ้งเปิดรอบ และเตือนก่อนปิดรอบ เฉพาะผู้ตอบที่ยังไม่ได้ทำ (SDQ ฉบับของตน หรือ EQ ของนักเรียน)
  for (const w of input.windows ?? []) {
    const notice = windowNotice(w);
    if (!notice || !w.raters.includes(input.viewer)) continue;
    if ((w.termId ?? CURRENT_TERM.termId) !== CURRENT_TERM.termId) continue;
    if (input.room && !windowCoversRoom(w, input.room)) continue;
    const pending = w.kind === "sdq" ? !!own : w.kind === "eq" ? input.eq?.status === "pending" : false;
    if (!pending) continue;
    const name = w.label || KIND_LABEL[w.kind];
    list.push({
      id: `win-${w.id}-${notice}`,
      at: notice === "opened" ? `${w.openDate}T08:00:00` : `${DEMO_TODAY}T08:00:00`,
      title: notice === "opened" ? `เปิดรอบ ${name}` : `ใกล้ปิดรอบ ${name}`,
      body: notice === "opened" ? `ทำได้ถึง ${formatThaiDate(w.closeDate)}` : `ปิดรับ ${formatThaiDate(w.closeDate)} ยังไม่ได้ทำ`,
    });
  }

  // แยกสถานะอ่านแล้วของนักเรียนกับผู้ปกครอง แม้เป็นเหตุการณ์เดียวกัน
  return list.map((n) => ({ ...n, id: `${input.viewer}:${n.id}` })).sort((a, b) => b.at.localeCompare(a.at));
}
