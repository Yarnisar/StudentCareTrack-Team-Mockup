/**
 * การแจ้งเตือนในระบบของนักเรียนและผู้ปกครอง (UC3 ข้อ 6)
 * PROTOTYPE: ยังไม่มีตารางแจ้งเตือนจริง จึงสร้างจากเหตุการณ์ในระบบ ได้แก่ บันทึกพฤติกรรม (UC8 ข้อ 15)
 * สถานะเฝ้าระวัง (UC8 Alt-D) นัดเยี่ยมบ้าน (UC4) และแบบประเมินที่ต้องทำ (UC9 ข้อ 13)
 * เนื้อหาเป็นข้อมูลโดยสรุปเท่านั้น ไม่มีผลคัดกรองหรือรายละเอียด case (UC3 ข้อ 4, NFR ข้อ 2)
 */

import { formatThaiDate, formatThaiTime } from "./format";
import { DEMO_TODAY } from "./mock-data";
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

  // แยกสถานะอ่านแล้วของนักเรียนกับผู้ปกครอง แม้เป็นเหตุการณ์เดียวกัน
  return list.map((n) => ({ ...n, id: `${input.viewer}:${n.id}` })).sort((a, b) => b.at.localeCompare(a.at));
}
