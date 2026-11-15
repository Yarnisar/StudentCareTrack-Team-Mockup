/**
 * PROTOTYPE ONLY — ข้อความยืนยัน (ทิ้งได้)
 * ข้อความบอก "ผลที่จะเกิดขึ้นจริง" ไม่ใช่ "แน่ใจหรือไม่" ลอย ๆ
 * ตัวเลขทั้งหมดคำนวณจากข้อมูลจริงในระบบ ไม่ใช่ข้อความสมมติ
 */

import { formatThaiDate } from "@/lib/format";
import type { BehaviorRule } from "@/lib/types";
import { type AssessmentWindow, windowStatus } from "./state";

export interface ImpactContext {
  /** จำนวนแบบประเมินที่ยังทำไม่เสร็จ (ใช้กับรอบ SDQ) */
  pendingSdq: number;
  /** จำนวนนักเรียนที่อยู่ในความดูแล */
  studentCount: number;
}

export function windowEnabledConfirm(
  w: AssessmentWindow,
  ctx: ImpactContext
): { title: string; description: string; confirmLabel: string; doneLabel: string; danger: boolean } {
  const turningOff = w.enabled;
  const status = windowStatus(w);

  if (turningOff) {
    const affected =
      w.kind === "sdq" && ctx.pendingSdq > 0
        ? `ขณะนี้ยังมีแบบประเมินที่ทำไม่เสร็จ ${ctx.pendingSdq} ฉบับ ผู้ประเมินจะเข้าทำต่อไม่ได้ทันที`
        : `นักเรียนในความดูแล ${ctx.studentCount} คนจะไม่ถูกนับรวมในรอบนี้`;
    return {
      title: `ปิดใช้งาน "${w.label}" ?`,
      description:
        status === "open"
          ? `รอบนี้กำลังเปิดให้ทำอยู่ — ${affected} ข้อมูลที่บันทึกไว้แล้วจะไม่ถูกลบ`
          : `รอบนี้จะหายจากรายการที่ครูเห็น และจะไม่ถูกเปิดอัตโนมัติเมื่อถึงวันที่กำหนด`,
      confirmLabel: "ปิดใช้งาน",
      doneLabel: `ปิดใช้งาน "${w.label}" แล้ว`,
      danger: status === "open",
    };
  }

  return {
    title: `เปิดใช้งาน "${w.label}" ?`,
    description: `ระบบจะเปิดให้ทำระหว่าง ${formatThaiDate(w.openDate)} ถึง ${formatThaiDate(
      w.closeDate
    )} และแจ้งเตือนล่วงหน้า ${w.remindDaysBefore} วันก่อนปิดรับ`,
    confirmLabel: "เปิดใช้งาน",
    doneLabel: `เปิดใช้งาน "${w.label}" แล้ว`,
    danger: false,
  };
}

export function ruleActiveConfirm(rule: BehaviorRule, usedCount: number) {
  const turningOff = rule.isActive;
  const name = rule.name || "กฎที่ยังไม่ตั้งชื่อ";
  return turningOff
    ? {
        title: `ปิดใช้งานกฎ "${name}" ?`,
        description:
          usedCount > 0
            ? `ครูจะเลือกกฎนี้ไม่ได้อีก บันทึกเดิม ${usedCount} รายการยังคงอยู่และยังคิดคะแนนตามเดิม`
            : "ครูจะเลือกกฎนี้ไม่ได้อีก กฎนี้ยังไม่เคยถูกใช้บันทึก",
        confirmLabel: "ปิดใช้งาน",
        doneLabel: `ปิดใช้งานกฎ "${name}" แล้ว`,
        danger: false,
      }
    : {
        title: `เปิดใช้งานกฎ "${name}" ?`,
        description:
          rule.severity === "refer"
            ? "กฎนี้จะกลับไปอยู่ในตัวเลือกของครู เป็นกฎส่งต่อที่ไม่มีคะแนน บันทึกแล้วแจ้งครูที่ปรึกษาให้พิจารณาเปิดกรณี"
            : `กฎนี้จะกลับไปอยู่ในตัวเลือกของครู โดยมีผลต่อคะแนน ${
                rule.scoreDelta > 0 ? `+${rule.scoreDelta}` : rule.scoreDelta
              } ต่อการบันทึกหนึ่งครั้ง`,
        confirmLabel: "เปิดใช้งาน",
        doneLabel: `เปิดใช้งานกฎ "${name}" แล้ว`,
        danger: false,
      };
}
