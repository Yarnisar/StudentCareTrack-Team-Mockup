/**
 * บทบาทผู้ใช้และสิทธิ์เข้าถึงหน้า (รายงาน 3.4.1, ตาราง 3.4)
 *
 * PROTOTYPE: ยังไม่มีบัญชีจริง บทบาทเลือกจากหน้า login หรือแถบสลับบทบาท (RoleSwitcher)
 * Project 2: บทบาทและขอบเขตความรับผิดชอบมาจากระบบยืนยันตัวตนกลาง และ backend ต้องตรวจสิทธิ์ซ้ำทุกคำขอ
 * ตารางสิทธิ์ของ "ครูทั่วไป" เป็นข้อเสนอ — รายงานระบุเพียงว่าครูแต่ละหน้าที่เห็นข้อมูลต่างกันตาม Assignment (3.3.4)
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
    label: "แอดมินโรงเรียน",
    home: "/dashboard",
    user: { name: "ครูวิชัย ระบบดี", title: "แอดมินโรงเรียน", scope: "ทั้งโรงเรียน" },
  },
  homeroom: {
    label: "ครูประจำชั้น",
    home: "/dashboard",
    user: { name: "ครูสมหญิง ใจดี", title: "ครูประจำชั้น ม.3/1", scope: "ม.3/1" },
  },
  subject: {
    label: "ครูทั่วไป",
    home: "/behavior",
    user: { name: "ครูมานพ สอนดี", title: "ครูผู้สอน วิทยาศาสตร์", scope: "วิชาวิทยาศาสตร์" },
  },
  student: {
    label: "นักเรียน",
    home: "/portal/student/card",
    // ตรงกับนักเรียนตัวอย่างของ portal (studentId 30125 ใน mock-data)
    user: { name: "ด.ญ. แพรวา สายใจ", title: "นักเรียน ม.3/1", scope: "ม.3/1" },
  },
  parent: {
    label: "ผู้ปกครอง",
    home: "/portal/parent",
    user: { name: "นางสาวรัตนา สายใจ", title: "ผู้ปกครอง (มารดา)", scope: "มารดา" },
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
 * แอดมินดูภาพรวมเป็นจำนวน ตั้งค่า และจัดทำเอกสาร ปพ. เท่านั้น (3.4.1)
 * ไม่เข้าหน้าที่มีข้อมูลรายคน: ผลคัดกรอง ผล SDQ/EQ รายละเอียด case ผลเยี่ยมบ้าน ความประพฤติ และคุณลักษณะฯ
 * การตั้งค่าช่วงเวลาเยี่ยมบ้าน (UC4 Scenario A) และกฎความประพฤติ (UC7) อยู่ในหน้าตั้งค่า
 * PROTOTYPE: ยังไม่มีหน้าจัดทำบัตรนักเรียน (UC14)
 */
const ADMIN_PAGES = ["/dashboard", "/documents", "/settings"];

const ALLOWED: Record<Role, string[]> = {
  admin: ADMIN_PAGES,
  homeroom: TEACHER_PAGES,
  subject: ["/behavior", "/characteristics"],
  student: ["/portal/student"],
  parent: ["/portal/parent"],
};

/**
 * บทบาทเริ่มต้นเมื่อเปิดหน้าใหม่ (รีเฟรช / พิมพ์ URL) — ต้นแบบยังไม่มี session จริง
 * จึงเลือกบทบาทแรกที่เข้าหน้านั้นได้ เช่น /portal/parent → ผู้ปกครอง, /settings → แอดมิน
 */
export function defaultRoleFor(pathname: string): Role {
  const preference: Role[] = ["homeroom", "admin", "subject", "student", "parent"];
  return preference.find((r) => canAccess(r, pathname)) ?? "homeroom";
}

/**
 * ดูข้อมูลรายบุคคลของนักเรียนได้หรือไม่ (UC2 Alternate: ไม่มีสิทธิ์)
 * UC2 เป็นของครูและผู้ปกครอง ครูประจำชั้นดูได้เฉพาะห้องที่รับผิดชอบ
 * แอดมินไม่เห็นข้อมูลรายคน (3.4.1) — ข้อมูลรายคนที่แอดมินใช้มีแค่ในงานจัดทำบัตรและเอกสาร ปพ.
 * PROTOTYPE: เทียบจากชื่อห้อง · Project 2 ใช้ Assignment จริงและตรวจซ้ำที่ backend
 */
export function canViewStudent(role: Role, roomName: string): boolean {
  if (role === "homeroom") return roomName === ROLE_INFO.homeroom.user.scope;
  return false;
}

/**
 * เปิดดูเลขบัตรประชาชนเต็มได้หรือไม่ (ข้อ 2.1.10) ค่าเริ่มต้นซ่อนทุกบทบาท
 * PROTOTYPE: ให้เฉพาะแอดมิน (ข้อเสนอ ยังไม่ได้ตกลงกับทีม) ทุกครั้งที่เปิดดูต้องบันทึกประวัติ
 */
export function canRevealCitizenId(role: Role): boolean {
  return role === "admin";
}

export function canAccess(role: Role, pathname: string): boolean {
  if (pathname === "/login") return true;
  return ALLOWED[role].some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
