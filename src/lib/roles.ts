/**
 * บทบาทผู้ใช้และสิทธิ์เข้าถึงหน้า (รายงาน 3.4.1, ตาราง 3.4)
 *
 * PROTOTYPE: ยังไม่มีบัญชีจริง บทบาทเลือกจากหน้า login
 * Project 2: บทบาทและขอบเขตความรับผิดชอบมาจากระบบยืนยันตัวตนกลาง และ backend ต้องตรวจสิทธิ์ซ้ำทุกคำขอ
 * ครูมีผู้ใช้ประเภทเดียว สิทธิ์ขึ้นกับการมอบหมาย (Assignment) ต่อห้อง/นักเรียน ไม่ใช่ประเภทของครู (3.3.4, ตารางขอบเขตสิทธิ์)
 * แถบสลับบทบาทมีครู 2 คนเพื่อให้เห็นความต่าง: คนหนึ่งเป็นครูประจำชั้นและสอนด้วย อีกคนสอนอย่างเดียว
 */

export type Role = "admin" | "homeroom" | "subject" | "student" | "parent";

export const ROLE_ORDER: Role[] = ["admin", "homeroom", "subject", "student", "parent"];

export const ROLE_INFO: Record<
  Role,
  {
    label: string;
    home: string;
    /** scope = ขอบเขตความรับผิดชอบ แสดงคู่กับป้ายบทบาทในแถบด้านข้าง */
    user: { name: string; title: string; scope: string };
  }
> = {
  admin: {
    label: "ผู้ดูแลระบบ",
    home: "/dashboard",
    user: { name: "ครูตุ้ยดุ่ย เจียมรันย์", title: "ผู้ดูแลระบบ", scope: "ทั้งโรงเรียน" },
  },
  homeroom: {
    label: "ครูประจำชั้น",
    home: "/dashboard",
    user: { name: "ครูมาลีฮัน จันทะสะรวย", title: "ครูประจำชั้น ม.3/1", scope: "ม.3/1" },
  },
  subject: {
    label: "ครูผู้สอน",
    home: "/behavior",
    user: { name: "ครูมานพ สอนดี", title: "สอนวิทยาศาสตร์ ม.3/1–3/2", scope: "วิทยาศาสตร์" },
  },
  student: {
    label: "นักเรียน",
    home: "/portal/student",
    // ตรงกับนักเรียนตัวอย่างของ portal (studentId 30125 ใน mock-data)
    user: { name: "ด.ญ. พิชสินีย์ เพรี่ยงพร้อม", title: "นักเรียน ม.3/1", scope: "ม.3/1" },
  },
  parent: {
    label: "ผู้ปกครอง",
    home: "/portal/parent",
    user: { name: "นางสาวภัคคินีย์ เพรี่ยงพร้อม", title: "ผู้ปกครอง (มารดา)", scope: "มารดา" },
  },
};

const TEACHER_PAGES = [
  "/dashboard",
  "/students",
  "/screening",
  "/assessment",
  "/behavior",
  "/home-visits",
  "/characteristics",
  "/documents",
  "/care-cases",
];

/**
 * ผู้ดูแลระบบดูภาพรวมเป็นจำนวน ตั้งค่า และจัดทำเอกสาร ปพ. เท่านั้น (3.4.1)
 * ไม่เข้าหน้าที่มีข้อมูลรายคน: ผลคัดกรอง ผล SDQ/EQ รายละเอียด case ผลเยี่ยมบ้าน ความประพฤติ และการประเมินคุณลักษณะฯ รายคน (/characteristics)
 * ดูผลคุณลักษณะฯ ได้เฉพาะหน้าสรุปเป็นจำนวนรายห้อง/ระดับชั้น (/dc-summary) ซึ่งไม่มีชื่อนักเรียน
 * การตั้งค่าช่วงเวลาเยี่ยมบ้าน (UC4 Scenario A) และกฎความประพฤติ (UC7) อยู่ในหน้าตั้งค่า
 * จัดทำบัตรนักเรียน (UC14) ใช้ข้อมูลทะเบียนเท่าที่บัตรต้องใช้
 */
const ADMIN_PAGES = ["/dashboard", "/dc-summary", "/documents", "/cards", "/exam-rooms", "/settings"];

const ALLOWED: Record<Role, string[]> = {
  admin: ADMIN_PAGES,
  homeroom: TEACHER_PAGES,
  // ครูผู้สอนดูข้อมูลพื้นฐานและพฤติกรรมของห้องที่สอน บันทึกพฤติกรรม และขอจัดทำ ปพ.7 ได้ ส่วนการประเมินคุณลักษณะเป็นของครูที่ปรึกษา (ตาราง 3.4, UC2, UC13)
  subject: ["/students", "/behavior", "/documents"],
  student: ["/portal/student"],
  parent: ["/portal/parent"],
};

/**
 * บทบาทเริ่มต้นเมื่อเปิดหน้าใหม่ (รีเฟรช / พิมพ์ URL) — ต้นแบบยังไม่มี session จริง
 * จึงเลือกบทบาทแรกที่เข้าหน้านั้นได้ เช่น /portal/parent → ผู้ปกครอง, /settings → ผู้ดูแลระบบ
 */
export function defaultRoleFor(pathname: string): Role {
  const preference: Role[] = ["homeroom", "admin", "subject", "student", "parent"];
  return preference.find((r) => canAccess(r, pathname)) ?? "homeroom";
}

/**
 * ดูข้อมูลรายบุคคลของนักเรียนได้หรือไม่ (UC2 Alternate: ไม่มีสิทธิ์)
 * UC2 เป็นของครูและผู้ปกครอง ครูประจำชั้นดูได้เฉพาะห้องที่รับผิดชอบ
 * ผู้ดูแลระบบไม่เห็นข้อมูลรายคน (3.4.1) — ข้อมูลรายคนที่ผู้ดูแลระบบใช้มีแค่ในงานจัดทำบัตรและเอกสาร ปพ.
 * PROTOTYPE: เทียบจากชื่อห้อง · Project 2 ใช้ Assignment จริงและตรวจซ้ำที่ backend
 */
export function canViewStudent(role: Role, roomName: string): boolean {
  return studentViewLevel(role, roomName) !== "none";
}

/**
 * ระดับการดูข้อมูลรายบุคคล (ตาราง 3.4)
 * - full = ครูประจำชั้น/ครูที่ปรึกษาของห้องนั้น เห็นทุกหมวด
 * - limited = ครูที่ได้รับมอบหมายอื่น (เช่น ครูผู้สอน, หรือครูประจำชั้นในห้องที่สอน) เห็นข้อมูลพื้นฐานและรายการพฤติกรรมของตน ไม่เห็นผลคัดกรอง ผลประเมิน กรณีช่วยเหลือ และคุณลักษณะ
 */
export type StudentViewLevel = "full" | "limited" | "none";

export function studentViewLevel(role: Role, roomName: string): StudentViewLevel {
  if (role === "homeroom" && roomName === ROLE_INFO.homeroom.user.scope) return "full";
  return recordableRooms(role).includes(roomName) ? "limited" : "none";
}

/**
 * เปิดดูเลขบัตรประชาชนเต็มได้หรือไม่ (ข้อ 2.1.10 เก็บและเปิดเผยเท่าที่จำเป็น) ค่าเริ่มต้นซ่อนทุกบทบาท
 * ให้เฉพาะครูประจำชั้นของนักเรียนรายนั้น (ขอบเขตห้องตรวจด้วย canViewStudent) เพราะเป็นผู้ตรวจข้อมูลพื้นฐาน
 * กับข้อมูลทะเบียนตอนเยี่ยมบ้าน (UC5 ข้อ 5 และ Alt-D) ครูผู้สอนไม่จำเป็นต้องเห็น
 * ผู้ดูแลระบบไม่เข้าหน้าข้อมูลรายคน (3.4.1) เลขเต็มที่ผู้ดูแลระบบต้องใช้อยู่ในงานจัดทำบัตรและเอกสาร ปพ.
 * ทุกครั้งที่เปิดดูต้องบันทึกประวัติ
 * หมายเหตุ: รายงานยังไม่ได้ระบุเรื่องนี้ ควรเพิ่มใน 2.1.10 หรือ UC2
 */
export function canRevealCitizenId(role: Role): boolean {
  return role === "homeroom";
}

export function canAccess(role: Role, pathname: string): boolean {
  if (pathname === "/login") return true;
  return ALLOWED[role].some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * การมอบหมายงานของครูแต่ละบัญชี — ครูคนเดียวเป็นทั้งครูประจำชั้นและครูผู้สอนได้
 * - ห้องที่เป็นครูประจำชั้น: เห็นข้อมูลรายคนและรายการพฤติกรรมทั้งหมดของนักเรียนห้องนั้น
 * - ห้องที่สอน: บันทึกพฤติกรรมได้ และเห็น/แก้ไข/ยกเลิกเฉพาะรายการที่ตนบันทึก (ตารางขอบเขตสิทธิ์ "ครูที่ได้รับมอบหมายอื่น")
 * PROTOTYPE: Project 2 อ่าน Assignment จาก IAM ของ Team B
 */
export interface TeacherAssignment {
  homeroomRoom?: string;
  teaches: { subject: string; rooms: string[] }[];
}

export const TEACHER_ASSIGNMENTS: Partial<Record<Role, TeacherAssignment>> = {
  homeroom: { homeroomRoom: "ม.3/1", teaches: [{ subject: "สังคมศึกษา", rooms: ["ม.3/1", "ม.3/2"] }] },
  subject: { teaches: [{ subject: "วิทยาศาสตร์", rooms: ["ม.3/1", "ม.3/2"] }] },
};

/** ห้องที่ครูคนนี้บันทึกพฤติกรรมได้ = ห้องที่เป็นครูประจำชั้น + ห้องที่สอน */
export function recordableRooms(role: Role): string[] {
  const a = TEACHER_ASSIGNMENTS[role];
  if (!a) return [];
  return [...new Set([...(a.homeroomRoom ? [a.homeroomRoom] : []), ...a.teaches.flatMap((t) => t.rooms)])];
}
