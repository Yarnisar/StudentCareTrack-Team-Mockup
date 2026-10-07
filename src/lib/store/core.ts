/**
 * Core slice: ผู้ใช้ปัจจุบัน (สลับบทบาทได้โดยไม่ reload) ข้อมูลอ้างอิงจาก Team A/B
 * การค้นชื่อจาก userId และสิทธิ์ที่ผูกกับผู้ใช้ปัจจุบัน
 *
 * slice อื่นรับ CoreSlice เป็นอาร์กิวเมนต์ เพื่อใช้ currentUser / nameOf / สิทธิ์
 * (slice ของ audit log, การแจ้งเตือน, ตั้งค่า, ช่วงดำเนินงาน, ความยินยอม จะต่อจาก core ในลำดับเดียวกัน)
 */

import { useMemo, useState, useSyncExternalStore, type Dispatch, type SetStateAction } from "react";
import { storedCurrentUserId } from "../demo/persisted";
import {
  academicTerms as seedTerms,
  classroomHomerooms,
  classrooms as seedClassrooms,
  CURRENT_TERM,
  DEFAULT_USER_ID,
  studentEnrollments as seedEnrollments,
  studentGuardians as seedGuardians,
  students as seedStudents,
  subjectTeachings as seedSubjectTeachings,
  SYSTEM_USER_ID,
  users as seedUsers,
} from "../mock-data";
import * as perm from "../permissions";
import type {
  AcademicTerm,
  Classroom,
  ClassroomHomeroom,
  GuardianOf,
  Student,
  StudentEnrollment,
  StudentGuardian,
  SubjectTeaching,
  User,
} from "../types";

const SYSTEM_NAME = "ระบบ";

export interface CoreSlice {
  currentTerm: AcademicTerm;
  /** ภาคเรียนทั้งหมด (โหมดเดี่ยวนำเข้าเพิ่ม/แก้วันที่ได้) */
  terms: AcademicTerm[];
  /** ผู้ใช้ที่กำลังใช้งาน (ตั้งจากตัวเลือกบทบาทในหน้า login หรือแผงสาธิต) */
  currentUser: User;
  setCurrentUser: (userId: string) => void;

  /** บทบาทของครูคำนวณจากการมอบหมายครูประจำชั้นที่ยังใช้อยู่ — เปลี่ยนตามทันทีเมื่อผู้ดูแลระบบมอบหมาย */
  users: User[];
  students: Student[];
  classrooms: Classroom[];
  /** การมอบหมายครูประจำชั้นทุกแถวทุกปี รวมที่สิ้นสุดแล้ว (endedAt) — ผู้อ่านต้องกรองด้วย isActiveHomeroom */
  homerooms: ClassroomHomeroom[];
  /** การมอบหมายครูสอนวิชาทุกแถว รวมที่สิ้นสุดแล้ว — ผู้อ่านต้องกรอง endedAt === null */
  subjectTeachings: SubjectTeaching[];
  /**
   * จุดเขียนตารางการมอบหมาย — ใช้เฉพาะ slice assignments (ADR-0003) ห้ามเรียกจากหน้าจอ
   * หน้าจอเขียนผ่าน assignHomeroom / endHomeroom / assignSubject / endSubject
   */
  assignmentTables: {
    setHomerooms: Dispatch<SetStateAction<ClassroomHomeroom[]>>;
    setSubjectTeachings: Dispatch<SetStateAction<SubjectTeaching[]>>;
  };
  /**
   * จุดเขียนตารางอ้างอิง (นักเรียน ห้อง ผู้ใช้ ผู้ปกครอง ห้องรายปี ภาคเรียน) — ใช้เฉพาะ slice imports (ADR-0005)
   * ตารางเหล่านี้เป็นของทีม B/A ในโหมดเชื่อมระบบ จึงห้ามเรียกจากหน้าจอ
   */
  referenceTables: {
    setStudents: Dispatch<SetStateAction<Student[]>>;
    setUsers: Dispatch<SetStateAction<User[]>>;
    setClassrooms: Dispatch<SetStateAction<Classroom[]>>;
    setStudentGuardians: Dispatch<SetStateAction<StudentGuardian[]>>;
    setEnrollments: Dispatch<SetStateAction<StudentEnrollment[]>>;
    setTerms: Dispatch<SetStateAction<AcademicTerm[]>>;
  };
  studentGuardians: StudentGuardian[];
  /** ห้องเรียนรายปีของนักเรียน */
  enrollments: StudentEnrollment[];
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

  // ตารางอ้างอิง (ทีม B/A) — โหมดเชื่อมระบบอ่านอย่างเดียว โหมดเดี่ยวเขียนผ่าน slice imports เท่านั้น
  const [students, setStudents] = useState<Student[]>(seedStudents);
  const [baseUsers, setUsers] = useState<User[]>(seedUsers);
  const [classrooms, setClassrooms] = useState<Classroom[]>(seedClassrooms);
  const [studentGuardians, setStudentGuardians] = useState<StudentGuardian[]>(seedGuardians);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>(seedEnrollments);
  const [terms, setTerms] = useState<AcademicTerm[]>(seedTerms);

  const currentUserId =
    storedUserId && baseUsers.some((u) => u.userId === storedUserId) ? storedUserId : DEFAULT_USER_ID;

  // ตารางการมอบหมายครู (ทีม B/A) — ผู้ดูแลระบบเปลี่ยนได้ผ่าน slice assignments เท่านั้น
  const [homerooms, setHomerooms] = useState<ClassroomHomeroom[]>(classroomHomerooms);
  const [subjectTeachings, setSubjectTeachings] = useState<SubjectTeaching[]>(seedSubjectTeachings);

  return useMemo<CoreSlice>(() => {
    const permissionContext: perm.PermissionContext = {
      homerooms,
      enrollments,
      guardians: studentGuardians,
      currentAcademicYear: CURRENT_TERM.academicYear,
    };
    // บทบาทครูคำนวณจากการมอบหมาย ไม่ใช่ค่าที่กรอกเอง (ADR-0003)
    const users = baseUsers.map<User>((u) => {
      const role = perm.deriveRole(permissionContext, u);
      return role === u.role ? u : { ...u, role };
    });
    const getUser = (userId: string) => users.find((u) => u.userId === userId);
    const getStudent = (studentId: string) => students.find((s) => s.studentId === studentId);
    const currentUser = getUser(currentUserId) ?? users[0];

    const withStudent =
      (fn: (student: Student) => boolean) =>
      (studentId: string): boolean => {
        const student = getStudent(studentId);
        return student ? fn(student) : false;
      };

    return {
      currentTerm: terms.find((t) => t.termId === CURRENT_TERM.termId) ?? CURRENT_TERM,
      terms,
      currentUser,
      setCurrentUser: (userId) => {
        if (getUser(userId)) storedCurrentUserId.set(userId);
      },

      users,
      students,
      classrooms,
      homerooms,
      subjectTeachings,
      assignmentTables: { setHomerooms, setSubjectTeachings },
      referenceTables: { setStudents, setUsers, setClassrooms, setStudentGuardians, setEnrollments, setTerms },
      studentGuardians,
      enrollments,
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
        const staffIds = homerooms
          .filter(
            (h) => h.roomId === student.roomId && h.academicYear === CURRENT_TERM.academicYear && perm.isActiveHomeroom(permissionContext, h)
          )
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
  }, [currentUserId, homerooms, subjectTeachings, students, baseUsers, classrooms, studentGuardians, enrollments, terms]);
}

