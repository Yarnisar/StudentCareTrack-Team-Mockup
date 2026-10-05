/**
 * ชนิดข้อมูลอ้างอิงที่ใช้ร่วมกันทุกโมดูล: ผู้ใช้ บทบาท ห้องเรียน ผู้ปกครอง นักเรียน ภาคเรียน
 * ตารางเหล่านี้เป็นของ Team A / Team B (ADR-0001) — ระบบนี้อ่านอย่างเดียว
 */

export type UserRole =
  | "admin_school"
  | "teacher_general"
  | "teacher_homeroom"
  | "student"
  | "parent";

export const ROLE_LABEL: Record<UserRole, string> = {
  admin_school: "แอดมินโรงเรียน / ผู้บริหาร",
  teacher_general: "ครูทั่วไป",
  teacher_homeroom: "ครูประจำชั้น",
  student: "นักเรียน",
  parent: "ผู้ปกครอง",
};

/** บทบาทที่ใช้หน้าจอฝั่งบุคลากร (sidebar) */
export const STAFF_ROLES: UserRole[] = ["admin_school", "teacher_general", "teacher_homeroom"];

/** users (Team B) */
export interface User {
  userId: string;
  username: string;
  role: UserRole;
  /** staff.staffId หรือ students.studentId ตาม role (ผู้ปกครองเชื่อมผ่าน student_guardians จึงเป็น null) */
  refId: string | null;
  /** ชื่อที่แสดง (staff.full_name / students.full_name / ชื่อผู้ปกครอง) */
  name: string;
  /** ตำแหน่ง/คำอธิบายสั้นที่แสดงใต้ชื่อ เช่น "ผู้อำนวยการ" */
  title?: string;
  /** อีเมลสำหรับการแจ้งเตือน (nullable) */
  email: string | null;
  /** เบอร์ติดต่อจากงานทะเบียน (ข้อมูลอ่อนไหว) */
  phone?: string | null;
  isActive: boolean;
}

/** staff (Team B) */
export interface Staff {
  staffId: string;
  fullName: string;
  position: string;
}

/** classrooms (Team B) */
export interface Classroom {
  roomId: string;
  /** ระดับชั้น ป.1–ม.6 */
  gradeLevel: string;
  roomName: string;
}

/** classroom_homeroom_teachers (Team B) — ห้องละ 2 คน สิทธิ์เท่ากัน */
export interface ClassroomHomeroom {
  roomId: string;
  staffId: string;
  academicYear: number;
}

/** student_guardians (Team B) — many-to-many, ผู้ปกครองทุกคนสิทธิ์เท่ากัน */
export interface StudentGuardian {
  studentId: string;
  guardianUserId: string;
  relation: string;
}

export type StudentStatus = "studying" | "graduated" | "transferred";

export const STUDENT_STATUS_LABEL: Record<StudentStatus, string> = {
  studying: "กำลังศึกษา",
  graduated: "จบการศึกษา",
  transferred: "ย้ายออก",
};

/** students (Team B) */
export interface Student {
  studentId: string;
  fullName: string;
  citizenId: string;
  /** ห้องเรียนปัจจุบัน (FK → classrooms) */
  roomId: string;
  /** สำเนาจาก classrooms เพื่อแสดงผล */
  roomName: string;
  gradeLevel: string;
  classNo: number;
  status: StudentStatus;
  address: string;
  /** อ้างอิงจากงานทะเบียนนักเรียนของโรงเรียน — ระบบนี้อ่านอย่างเดียว */
  sourceSystem: "team_b_registry";
}

/**
 * ประวัติห้องเรียนรายปีการศึกษา (Team B) — ใช้หาครูประจำชั้นคนเดิมหลังเลื่อนชั้น
 */
export interface StudentEnrollment {
  studentId: string;
  roomId: string;
  academicYear: number;
}

/** academic_terms (Team A) */
export interface AcademicTerm {
  termId: string;
  academicYear: number;
  semester: 1 | 2;
  startDate: string;
  endDate: string;
  label: string;
}

/** ผู้ปกครอง 1 คนของนักเรียน พร้อมข้อมูลบัญชี */
export interface GuardianOf {
  user: User;
  relation: string;
}
