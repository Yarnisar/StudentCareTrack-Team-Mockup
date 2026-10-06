/**
 * ข้อความยืนยันของหน้าตั้งค่า — บอกผลที่จะเกิดขึ้นจริง
 * ตัวเลขทั้งหมดคำนวณจากข้อมูลจริงในระบบ ไม่ใช่ข้อความสมมติ
 */

import { formatThaiDate } from "@/lib/format";
import { windowStatusAt } from "@/lib/rules";
import {
  OPERATING_ACTIVITY_LABEL,
  type BehaviorRule,
  type OperatingActivity,
  type OperatingWindow,
} from "@/lib/types";
import type { ConfirmContent } from "./confirm";

export interface ImpactContext {
  /** แบบประเมิน SDQ ที่ยังทำไม่เสร็จ — ใช้กับช่วงดำเนินงาน SDQ */
  pendingSdq: number;
  /** นักเรียนที่อยู่ในระบบ */
  studentCount: number;
  /** วันนี้ (พ.ศ. yyyy-mm-dd) */
  today: string;
}

export interface WindowDraft {
  opensAt: string;
  closesAt: string;
  remindDaysBefore: number;
}

/** แก้ไขหรือกำหนดช่วงดำเนินงาน — ยืนยันในที่ */
export function windowSaveConfirm(
  activity: OperatingActivity,
  existing: OperatingWindow | undefined,
  draft: WindowDraft,
  ctx: ImpactContext
): ConfirmContent {
  const label = OPERATING_ACTIVITY_LABEL[activity];
  const wasOpen = windowStatusAt(existing, ctx.today) === "open";
  const nextStatus = windowStatusAt(
    { ...(existing ?? { windowId: "", termId: "", activity, updatedBy: "" }), ...draft },
    ctx.today
  );

  const range = `${formatThaiDate(draft.opensAt)} ถึง ${formatThaiDate(draft.closesAt)}`;
  const parts: string[] = [
    existing
      ? `ช่วง "${label}" จะเปลี่ยนเป็น ${range}`
      : `จะกำหนดช่วง "${label}" เป็น ${range}`,
  ];

  if (nextStatus === "open") {
    parts.push(
      `ผลคือเปิดให้บันทึกได้ทันที และแจ้งเตือนล่วงหน้า ${draft.remindDaysBefore} วันก่อนปิดรับ`
    );
  } else if (nextStatus === "upcoming") {
    parts.push("ผลคือยังไม่ถึงรอบ ครูจะยังบันทึกไม่ได้จนถึงวันเปิด");
  } else {
    parts.push("ผลคือรอบนี้ถือว่าปิดแล้ว ระบบล็อกการบันทึกย้อนหลังเสมอ");
  }

  if (wasOpen && nextStatus !== "open") {
    parts.push(
      activity === "sdq" && ctx.pendingSdq > 0
        ? `ขณะนี้ยังมีแบบประเมิน SDQ ที่ทำไม่เสร็จ ${ctx.pendingSdq} ฉบับ ผู้ประเมินจะเข้าทำต่อไม่ได้ทันที`
        : `ครูที่กำลังทำงานในรอบนี้ (นักเรียน ${ctx.studentCount} คน) จะบันทึกต่อไม่ได้ทันที`
    );
  }
  parts.push("ข้อมูลที่บันทึกไว้แล้วจะไม่ถูกลบ");

  return {
    title: existing ? `แก้ไขช่วงดำเนินงาน "${label}" ?` : `กำหนดช่วงดำเนินงาน "${label}" ?`,
    description: parts.join(" · "),
    confirmLabel: existing ? "บันทึกการแก้ไข" : "กำหนดช่วงเวลา",
    danger: wasOpen && nextStatus !== "open",
  };
}

export interface SettingChange {
  label: string;
  before: string;
  after: string;
}

/** แก้ไขตั้งค่าโรงเรียน — ยืนยันในที่ */
export function schoolSettingsSaveConfirm(
  changes: SettingChange[],
  ctx: ImpactContext
): ConfirmContent {
  return {
    title: `บันทึกการตั้งค่าโรงเรียน ${changes.length} รายการ ?`,
    description: `${changes
      .map((c) => `${c.label}: ${c.before} → ${c.after}`)
      .join(" · ")} — มีผลกับนักเรียนทั้ง ${ctx.studentCount} คนทันที และบันทึกค่าก่อน/หลังไว้ในประวัติการใช้งาน`,
    confirmLabel: "บันทึกการตั้งค่า",
    danger: false,
  };
}

/** แก้ไขรายละเอียดกฎ — ยืนยันในที่ */
export function ruleSaveConfirm(
  name: string,
  scoreDelta: number,
  usedCount: number,
  isNew: boolean
): ConfirmContent {
  const shown = name || "กฎที่ยังไม่ตั้งชื่อ";
  const delta = scoreDelta > 0 ? `+${scoreDelta}` : `${scoreDelta}`;
  return {
    title: isNew ? `เพิ่มกฎ "${shown}" ?` : `บันทึกการแก้ไขกฎ "${shown}" ?`,
    description: isNew
      ? `ครูจะเลือกกฎนี้ได้ทันที โดยมีผลต่อคะแนน ${delta} ต่อการบันทึกหนึ่งครั้ง`
      : `การบันทึกครั้งต่อไปจะใช้ค่าใหม่ (คะแนน ${delta} ต่อครั้ง) บันทึกเดิม ${usedCount} รายการยังคิดคะแนนตามค่าที่บันทึกไว้ ณ ตอนนั้น`,
    confirmLabel: isNew ? "เพิ่มกฎ" : "บันทึกการแก้ไข",
    danger: false,
  };
}

/** เปิด/ปิดใช้งานกฎ — ปิดใช้งานถามด้วยกล่องกลางจอ เพราะกระทบตัวเลือกของครูทุกคน */
export function ruleActiveConfirm(rule: BehaviorRule, usedCount: number): ConfirmContent {
  const name = rule.name || "กฎที่ยังไม่ตั้งชื่อ";
  if (rule.isActive) {
    return {
      title: `ปิดใช้งานกฎ "${name}" ?`,
      description:
        usedCount > 0
          ? `ครูทุกคนจะเลือกกฎนี้ไม่ได้อีก บันทึกเดิม ${usedCount} รายการยังคงอยู่และยังคิดคะแนนตามเดิม — กฎไม่ถูกลบ เปิดใช้งานกลับได้ภายหลัง`
          : "ครูทุกคนจะเลือกกฎนี้ไม่ได้อีก กฎนี้ยังไม่เคยถูกใช้บันทึก — กฎไม่ถูกลบ เปิดใช้งานกลับได้ภายหลัง",
      confirmLabel: "ปิดใช้งานกฎ",
      danger: true,
    };
  }
  return {
    title: `เปิดใช้งานกฎ "${name}" ?`,
    description: `กฎนี้จะกลับไปอยู่ในตัวเลือกของครู โดยมีผลต่อคะแนน ${
      rule.scoreDelta > 0 ? `+${rule.scoreDelta}` : rule.scoreDelta
    } ต่อการบันทึกหนึ่งครั้ง`,
    confirmLabel: "เปิดใช้งานกฎ",
    danger: false,
  };
}

/** ผลต่างก่อน → หลังของการมอบหมายครู 1 คน (หน้า "ครูและสิทธิ์") */
export interface TeacherAssignmentDiff {
  teacherName: string;
  roleBefore: string;
  roleAfter: string;
  roomsBefore: string[];
  roomsAfter: string[];
  subjectsBefore: string[];
  subjectsAfter: string[];
}

const listOrNone = (items: string[]) => (items.length > 0 ? items.join(", ") : "ไม่มี");

/** บันทึกการมอบหมายครู — ยืนยันในที่ บอกก่อน → หลัง และผลต่อสิทธิ์ */
export function teacherAssignmentConfirm(diff: TeacherAssignmentDiff): ConfirmContent {
  const parts: string[] = [];
  if (diff.roomsBefore.join() !== diff.roomsAfter.join()) {
    parts.push(`ครูประจำชั้น: ${listOrNone(diff.roomsBefore)} → ${listOrNone(diff.roomsAfter)}`);
  }
  if (diff.subjectsBefore.join() !== diff.subjectsAfter.join()) {
    parts.push(`วิชาที่สอน: ${listOrNone(diff.subjectsBefore)} → ${listOrNone(diff.subjectsAfter)}`);
  }
  parts.push(
    diff.roleBefore === diff.roleAfter
      ? `สิทธิ์ยังเป็น${diff.roleAfter}`
      : `สิทธิ์: ${diff.roleBefore} → ${diff.roleAfter} มีผลทันทีกับเมนูและข้อมูลที่ครูเห็น`
  );
  parts.push("การสิ้นสุดการมอบหมายไม่ลบข้อมูล เก็บวันที่สิ้นสุดไว้ และบันทึกลงประวัติการใช้งาน");
  return {
    title: `บันทึกการมอบหมายของ ${diff.teacherName} ?`,
    description: parts.join(" · "),
    confirmLabel: "บันทึกการมอบหมาย",
    danger: diff.roleBefore !== diff.roleAfter && diff.roleAfter === "ครูทั่วไป",
  };
}
