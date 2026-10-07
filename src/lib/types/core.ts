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
  admin_school: "ผู้ดูแลระบบ",
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
  /**
   * ครู: คำนวณจากการมอบหมาย (ครูประจำชั้น = มีห้องที่ยังใช้อยู่ในปีการศึกษาปัจจุบัน ไม่มี = ครูทั่วไป)
   * ค่าใน seed เป็นเพียงค่าตั้งต้น — store คำนวณทับเสมอ (ดู store/core.ts)
   */
  role: UserRole;
  /** staff.staffId หรือ students.studentId ตาม role (ผู้ปกครองเชื่อมผ่าน student_guardians จึงเป็น null) */
  refId: string | null;
  /** ชื่อที่แสดง (staff.full_name / students.full_name / ชื่อผู้ปกครอง) */
  name: string;
  /** ตำแหน่ง/คำอธิบายสั้นที่แสดงใต้ชื่อ เช่น "ครูประจำชั้น ม.3/1" */
  title?: string;
  /** อีเมลสำหรับการแจ้งเตือน (nullable) */
  email: string | null;
  /** เบอร์ติดต่อจากงานทะเบียน (ข้อมูลอ่อนไหว) */
  phone?: string | null;
  isActive: boolean;
  /** เลขบัตรประชาชนของผู้ปกครองที่สร้างจากการนำเข้า (โหมดเดี่ยว) — ใช้เป็นคีย์นำเข้าซ้ำ ข้อมูลอ่อนไหว ไม่แสดงเต็ม */
  citizenId?: string | null;
  /** บัญชีที่สร้างจากการนำเข้ามีรหัสผ่านชั่วคราว ต้องเปลี่ยนเมื่อเข้าสู่ระบบครั้งแรก (ไม่เก็บรหัสผ่านใน state) */
  mustChangePassword?: boolean;
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
  /** ปีการศึกษาของห้อง (ห้องที่นำเข้าในโหมดเดี่ยว) — ไม่ระบุ = ปีการศึกษาปัจจุบัน */
  academicYear?: number;
}

/**
 * classroom_homeroom_teachers (Team B) — ห้องละไม่เกิน 2 คนที่ยังใช้อยู่ สิทธิ์เท่ากัน
 * ผู้ดูแลระบบเป็นผู้มอบหมาย (ADR-0003) ไม่ลบแถว ใช้ endedAt สิ้นสุดการมอบหมาย
 */
export interface ClassroomHomeroom {
  roomId: string;
  staffId: string;
  academicYear: number;
  /** วันที่สิ้นสุดการมอบหมาย (พ.ศ. yyyy-mm-dd) — null = ยังใช้อยู่ */
  endedAt: string | null;
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
  sourceSystem: "team_b_registry" | "standalone_import";
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
