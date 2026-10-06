/** เมนูฝั่งบุคลากร และบทบาทที่เข้าแต่ละหน้าได้ */

import type { UserRole } from "./types";

export interface NavItem {
  href: string;
  label: string;
  roles: UserRole[];
}

const ALL_STAFF: UserRole[] = ["admin_school", "teacher_homeroom", "teacher_general"];
const SENSITIVE_STAFF: UserRole[] = ["admin_school", "teacher_homeroom"];

/** ลำดับตามที่แสดงใน sidebar */
export const STAFF_NAV: NavItem[] = [
  { href: "/dashboard", label: "ภาพรวม", roles: SENSITIVE_STAFF },
  { href: "/students", label: "ข้อมูลนักเรียน", roles: ALL_STAFF },
  { href: "/screening", label: "การคัดกรอง", roles: SENSITIVE_STAFF },
  { href: "/assessment", label: "การประเมิน", roles: SENSITIVE_STAFF },
  { href: "/behavior", label: "ความประพฤติ", roles: ALL_STAFF },
  { href: "/home-visits", label: "เยี่ยมบ้าน", roles: SENSITIVE_STAFF },
  { href: "/characteristics", label: "คุณลักษณะฯ", roles: ALL_STAFF },
  { href: "/documents", label: "เอกสาร ปพ.", roles: ALL_STAFF },
  { href: "/checkin", label: "บัตร / QR", roles: ALL_STAFF },
  { href: "/cards", label: "ออกบัตรนักเรียน", roles: ["admin_school"] },
  { href: "/care-cases", label: "ติดตามช่วยเหลือ", roles: SENSITIVE_STAFF },
  { href: "/approvals", label: "อนุมัติเอกสารส่งต่อ", roles: ["admin_school"] },
];

export const SETTINGS_NAV: NavItem = { href: "/settings", label: "ตั้งค่าระบบ", roles: ["admin_school"] };

const matches = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

export const navForRole = (role: UserRole) => STAFF_NAV.filter((n) => n.roles.includes(role));

/** บทบาทนี้เข้าหน้าฝั่งบุคลากรที่ pathname นี้ได้หรือไม่ (หน้าที่ไม่อยู่ในเมนู ถือว่าเข้าได้ทุกบทบาทบุคลากร) */
export function canAccessStaffPath(role: UserRole, pathname: string): boolean {
  const item = [...STAFF_NAV, SETTINGS_NAV].find((n) => matches(pathname, n.href));
  if (item) return item.roles.includes(role);
  return ALL_STAFF.includes(role);
}

export const isActivePath = matches;
