/**
 * Core slice: ผู้ใช้ปัจจุบัน (สลับบทบาทได้โดยไม่ reload) ข้อมูลอ้างอิงจาก Team A/B
 * การค้นชื่อจาก userId และสิทธิ์ที่ผูกกับผู้ใช้ปัจจุบัน
 *
 * slice อื่นรับ CoreSlice เป็นอาร์กิวเมนต์ เพื่อใช้ currentUser / nameOf / สิทธิ์
 * (slice ของ audit log, การแจ้งเตือน, ตั้งค่า, ช่วงดำเนินงาน, ความยินยอม จะต่อจาก core ในลำดับเดียวกัน)
 */

import { useMemo, useSyncExternalStore } from "react";
import { storedCurrentUserId } from "../demo/persisted";
import {
  classroomHomerooms,
  classrooms,
  CURRENT_TERM,
  DEFAULT_USER_ID,
  studentEnrollments,
  studentGuardians,
  students,
  SYSTEM_USER_ID,
  users,
} from "../mock-data";
import * as perm from "../permissions";
import type {
  AcademicTerm,
  Classroom,
  ClassroomHomeroom,
  GuardianOf,
  Student,
  StudentGuardian,
  User,
} from "../types";

const SYSTEM_NAME = "ระบบ";

export interface CoreSlice {
  currentTerm: AcademicTerm;
  /** ผู้ใช้ที่กำลังใช้งาน (ตั้งจากตัวเลือกบทบาทในหน้า login หรือแผงสาธิต) */
  currentUser: User;
  setCurrentUser: (userId: string) => void;

  users: User[];
  students: Student[];
  classrooms: Classroom[];
  homerooms: ClassroomHomeroom[];
  studentGuardians: StudentGuardian[];
  permissionContext: perm.PermissionContext;

  getStudent: (studentId: string) => Student | undefined;
  getUser: (userId: string) => User | undefined;
  /** ชื่อที่แสดงของ userId ("ระบบ" สำหรับ SYSTEM_USER_ID, "-" ถ้าไม่มี) */
  nameOf: (userId: string | null | undefined) => string;
  /** ผู้ปกครองทุกคนของนักเรียน (สิทธิ์เท่ากัน) */
  guardiansOf: (studentId: string) => GuardianOf[];
  /** นักเรียนทุกคนที่ผู้ปกครองคนนี้เชื่อมอยู่ */
  studentsOfGuardian: (guardianUserId: string) => Student[];
  /** ครูประจำชั้นปีปัจจุบันของนักเรียน (2 คน) */
  homeroomTeachersOf: (studentId: string) => User[];
  /** ห้องที่ผู้ใช้ปัจจุบันเป็นครูประจำชั้นปีนี้ */
  myHomeroomRoomIds: string[];

  /* สิทธิ์ของ currentUser ต่อนักเรียนคนหนึ่ง (ดู lib/permissions.ts) */
  canSeeSensitive: (studentId: string) => boolean;
  isHomeroomOf: (studentId: string) => boolean;
  isPreviousHomeroomOf: (studentId: string) => boolean;
  canViewRecord: (studentId: string, recordBy: string | null | undefined) => boolean;
  canEdit: (studentId: string) => boolean;
}

export function useCoreSlice(): CoreSlice {
  // จำผู้ใช้ที่เลือกไว้ข้ามการ reload; ฝั่ง server/รอบ hydrate ใช้ DEFAULT_USER_ID
  const storedUserId = useSyncExternalStore(storedCurrentUserId.subscribe, storedCurrentUserId.get, () => null);
  const currentUserId =
    storedUserId && users.some((u) => u.userId === storedUserId) ? storedUserId : DEFAULT_USER_ID;

  return useMemo<CoreSlice>(() => {
    const getUser = (userId: string) => users.find((u) => u.userId === userId);
    const getStudent = (studentId: string) => students.find((s) => s.studentId === studentId);
    const currentUser = getUser(currentUserId) ?? users[0];

    const permissionContext: perm.PermissionContext = {
      homerooms: classroomHomerooms,
      enrollments: studentEnrollments,
      guardians: studentGuardians,
      currentAcademicYear: CURRENT_TERM.academicYear,
    };

    const withStudent =
      (fn: (student: Student) => boolean) =>
      (studentId: string): boolean => {
        const student = getStudent(studentId);
        return student ? fn(student) : false;
      };

    return {
      currentTerm: CURRENT_TERM,
      currentUser,
      setCurrentUser: (userId) => {
        if (getUser(userId)) storedCurrentUserId.set(userId);
      },

      users,
      students,
      classrooms,
      homerooms: classroomHomerooms,
      studentGuardians,
      permissionContext,

      getStudent,
      getUser,
      nameOf: (userId) => {
        if (!userId) return "-";
        if (userId === SYSTEM_USER_ID) return SYSTEM_NAME;
        return getUser(userId)?.name ?? userId;
      },
      guardiansOf: (studentId) =>
        studentGuardians
          .filter((g) => g.studentId === studentId)
          .flatMap((g) => {
            const user = getUser(g.guardianUserId);
            return user ? [{ user, relation: g.relation }] : [];
          }),
      studentsOfGuardian: (guardianUserId) =>
        studentGuardians
          .filter((g) => g.guardianUserId === guardianUserId)
          .flatMap((g) => {
            const s = getStudent(g.studentId);
            return s ? [s] : [];
          }),
      homeroomTeachersOf: (studentId) => {
        const student = getStudent(studentId);
        if (!student) return [];
        const staffIds = classroomHomerooms
          .filter((h) => h.roomId === student.roomId && h.academicYear === CURRENT_TERM.academicYear)
          .map((h) => h.staffId);
        return users.filter((u) => u.refId && staffIds.includes(u.refId) && perm.isStaff(u));
      },
      myHomeroomRoomIds: perm.homeroomRoomsOf(permissionContext, currentUser),

      canSeeSensitive: withStudent((s) => perm.canSeeSensitive(permissionContext, currentUser, s)),
      isHomeroomOf: withStudent((s) => perm.isHomeroomOf(permissionContext, currentUser, s)),
      isPreviousHomeroomOf: withStudent((s) => perm.isPreviousHomeroomOf(permissionContext, currentUser, s)),
      canViewRecord: (studentId, recordBy) =>
        withStudent((s) => perm.canViewRecord(permissionContext, currentUser, s, { by: recordBy }))(studentId),
      canEdit: withStudent((s) => perm.canEdit(permissionContext, currentUser, s)),
    };
  }, [currentUserId]);
}

