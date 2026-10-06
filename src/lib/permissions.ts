/**
 * สิทธิ์การเห็นและแก้ไขข้อมูล (CONTEXT.md: ครูประจำชั้น, ครูทั่วไป, ข้อมูลอ่อนไหว)
 *
 * - ครูประจำชั้น (ห้องละ 2 คน สิทธิ์เท่ากัน) และผู้ดูแลระบบ เห็นข้อมูลอ่อนไหวของนักเรียน
 * - ครูทั่วไปเห็นได้เฉพาะ ชื่อ ห้อง ความประพฤติ และคุณลักษณะอันพึงประสงค์
 * - หลังเลื่อนชั้น ครูประจำชั้นคนใหม่เห็นย้อนหลังทั้งหมด
 *   ครูประจำชั้นคนเดิมเห็นเฉพาะบันทึกที่ตัวเองเขียน และแก้ไม่ได้
 *
 * ฟังก์ชันในไฟล์นี้เป็น pure function — หน้าจอเรียกผ่าน useStore() ที่ผูก currentUser ไว้แล้ว
 */

import type { ClassroomHomeroom, Student, StudentEnrollment, StudentGuardian, User, UserRole } from "./types";

/** ข้อมูลอ้างอิงที่ใช้ตัดสินสิทธิ์ */
export interface PermissionContext {
  homerooms: ClassroomHomeroom[];
  enrollments: StudentEnrollment[];
  guardians: StudentGuardian[];
  currentAcademicYear: number;
}

/** บันทึกใด ๆ ที่รู้ผู้เขียน (userId) */
export interface AuthoredRecord {
  by: string | null | undefined;
}

export const isAdmin = (user: User) => user.role === "admin_school";

export const isStaff = (user: User) =>
  user.role === "admin_school" || user.role === "teacher_general" || user.role === "teacher_homeroom";

/** ห้องที่นักเรียนอยู่ในปีการศึกษาที่ระบุ */
export function roomOfStudentIn(ctx: PermissionContext, student: Student, academicYear: number): string | null {
  if (academicYear === ctx.currentAcademicYear) return student.roomId;
  return (
    ctx.enrollments.find((e) => e.studentId === student.studentId && e.academicYear === academicYear)?.roomId ??
    null
  );
}

/**
 * การมอบหมายครูประจำชั้นนี้ยังมีผลอยู่หรือไม่ — ปีปัจจุบัน: ยังไม่สิ้นสุด (endedAt เป็น null)
 * ปีก่อน ๆ: นับเป็นประวัติของปีนั้นเสมอ (ไม่ดู endedAt)
 */
export function isActiveHomeroom(ctx: Pick<PermissionContext, "currentAcademicYear">, h: ClassroomHomeroom): boolean {
  return h.academicYear !== ctx.currentAcademicYear || h.endedAt === null;
}

/** ห้องที่ผู้ใช้เป็นครูประจำชั้นในปีการศึกษาที่ระบุ (ค่าเริ่มต้น = ปีปัจจุบัน) — ไม่นับการมอบหมายที่สิ้นสุดแล้ว */
export function homeroomRoomsOf(ctx: PermissionContext, user: User, academicYear = ctx.currentAcademicYear): string[] {
  if (!user.refId || !isStaff(user)) return [];
  return ctx.homerooms
    .filter((h) => h.staffId === user.refId && h.academicYear === academicYear && isActiveHomeroom(ctx, h))
    .map((h) => h.roomId);
}

/**
 * บทบาทของครูที่คำนวณจากการมอบหมาย (CONTEXT: การมอบหมายครู)
 * ผู้ดูแลระบบคงเดิม · ครูที่มีห้องประจำชั้นที่ยังใช้อยู่ในปีปัจจุบัน = ครูประจำชั้น ไม่มี = ครูทั่วไป
 * บทบาทอื่น (นักเรียน ผู้ปกครอง) คงเดิม
 */
export function deriveRole(ctx: PermissionContext, user: User): UserRole {
  if (user.role === "admin_school" || !user.refId) return user.role;
  if (user.role !== "teacher_general" && user.role !== "teacher_homeroom") return user.role;
  return ctx.homerooms.some(
    (h) => h.staffId === user.refId && h.academicYear === ctx.currentAcademicYear && isActiveHomeroom(ctx, h)
  )
    ? "teacher_homeroom"
    : "teacher_general";
}

/** เป็นครูประจำชั้นของนักเรียนคนนี้ในปีการศึกษาที่ระบุ (ค่าเริ่มต้น = ปีปัจจุบัน) */
export function isHomeroomOf(
  ctx: PermissionContext,
  user: User,
  student: Student,
  academicYear = ctx.currentAcademicYear
): boolean {
  const room = roomOfStudentIn(ctx, student, academicYear);
  return room !== null && homeroomRoomsOf(ctx, user, academicYear).includes(room);
}

/** เคยเป็นครูประจำชั้นของนักเรียนคนนี้ในปีการศึกษาก่อน ๆ (และไม่ใช่ครูประจำชั้นปีนี้) */
export function isPreviousHomeroomOf(ctx: PermissionContext, user: User, student: Student): boolean {
  if (isHomeroomOf(ctx, user, student)) return false;
  // สิ้นสุดการมอบหมายกลางปีของห้องนี้ ปฏิบัติเหมือนครูประจำชั้นปีก่อน: เห็นเฉพาะที่ตัวเองบันทึก
  if (
    user.refId &&
    isStaff(user) &&
    ctx.homerooms.some(
      (h) =>
        h.staffId === user.refId &&
        h.academicYear === ctx.currentAcademicYear &&
        h.endedAt !== null &&
        h.roomId === student.roomId
    )
  )
    return true;
  const years = new Set(
    ctx.enrollments
      .filter((e) => e.studentId === student.studentId && e.academicYear < ctx.currentAcademicYear)
      .map((e) => e.academicYear)
  );
  return [...years].some((y) => isHomeroomOf(ctx, user, student, y));
}

export function isGuardianOf(ctx: PermissionContext, user: User, studentId: string): boolean {
  return (
    user.role === "parent" &&
    ctx.guardians.some((g) => g.studentId === studentId && g.guardianUserId === user.userId)
  );
}

/** เห็นข้อมูลอ่อนไหวทั้งหมดของนักเรียน: ผู้ดูแลระบบ หรือครูประจำชั้นปีปัจจุบัน */
export function canSeeSensitive(ctx: PermissionContext, user: User, student: Student): boolean {
  return isAdmin(user) || isHomeroomOf(ctx, user, student);
}

/**
 * เห็นบันทึกอ่อนไหวรายการนี้ได้หรือไม่
 * ครูประจำชั้นคนเดิม (หลังเลื่อนชั้น) เห็นเฉพาะบันทึกที่ตัวเองเขียน
 */
export function canViewRecord(
  ctx: PermissionContext,
  user: User,
  student: Student,
  record: AuthoredRecord
): boolean {
  if (canSeeSensitive(ctx, user, student)) return true;
  return isPreviousHomeroomOf(ctx, user, student) && !!record.by && record.by === user.userId;
}

/**
 * แก้ไข/บันทึกข้อมูลอ่อนไหวของนักเรียนได้หรือไม่ (ไม่รวมกฎช่วงดำเนินงานและกฎเวลา 24 ชั่วโมง)
 * - ครูประจำชั้นปีปัจจุบันและแอดมินแก้ได้
 * - ครูประจำชั้นคนเดิมเห็นบันทึกของตัวเองได้แต่แก้ไม่ได้
 * - ครูทั่วไปแก้ไม่ได้
 * ใช้ได้ทั้ง "สร้างบันทึกใหม่ได้ไหม" และ "แก้บันทึกเดิมได้ไหม" (บันทึกของครูประจำชั้นคนเดิมจึงเป็นอ่านอย่างเดียว)
 */
export function canEdit(ctx: PermissionContext, user: User, student: Student): boolean {
  return canSeeSensitive(ctx, user, student);
}

/** หน้าแรกของแต่ละบทบาทหลังเข้าสู่ระบบ / สลับบทบาท */
export const HOME_BY_ROLE: Record<UserRole, string> = {
  admin_school: "/dashboard",
  teacher_homeroom: "/dashboard",
  teacher_general: "/behavior",
  student: "/portal/student/card",
  parent: "/portal/parent",
};
