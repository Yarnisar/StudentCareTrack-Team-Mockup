/** เมนูฝั่งบุคลากร และบทบาทที่เข้าแต่ละหน้าได้ */

import type { UserRole } from "./types";

export interface NavItem {
  href: string;
  label: string;
  roles: UserRole[];
}

const ALL_STAFF: UserRole[] = ["admin_school", "teacher_homeroom", "teacher_general"];
const TEACHERS: UserRole[] = ["teacher_homeroom", "teacher_general"];
const SENSITIVE_STAFF: UserRole[] = ["admin_school", "teacher_homeroom"];

export type NavGroupId = "workspace" | "care" | "school";

export interface NavEntry extends NavItem {
  group: NavGroupId;
  /** เส้นทางอื่นที่ทำให้เมนูนี้ active ด้วย */
  alsoActiveOn?: string[];
}

export const NAV_GROUPS: { id: NavGroupId; label: string }[] = [
  { id: "workspace", label: "พื้นที่ทำงาน" },
  { id: "care", label: "ดูแลช่วยเหลือ" },
  { id: "school", label: "งานโรงเรียน" },
];

/** ลำดับตามที่แสดงใน sidebar (จัดกลุ่มตาม group) */
export const STAFF_NAV: NavEntry[] = [
  { group: "workspace", href: "/dashboard", label: "ภาพรวม", roles: SENSITIVE_STAFF },
  { group: "workspace", href: "/students", label: "ข้อมูลนักเรียน", roles: ALL_STAFF },
  { group: "care", href: "/home-visits", label: "เยี่ยมบ้าน", roles: SENSITIVE_STAFF },
  { group: "care", href: "/screening", label: "การคัดกรอง", roles: SENSITIVE_STAFF },
  { group: "care", href: "/assessment", label: "การประเมิน", roles: SENSITIVE_STAFF },
  { group: "care", href: "/care-cases", label: "ดูแลและติดตาม", roles: SENSITIVE_STAFF },
  { group: "care", href: "/behavior", label: "ความประพฤติ", roles: ALL_STAFF },
  { group: "school", href: "/characteristics", label: "คุณลักษณะฯ", roles: ALL_STAFF },
  { group: "school", href: "/documents", label: "เอกสาร ปพ.", roles: ALL_STAFF },
  { group: "school", href: "/checkin", label: "เช็กชื่อ", roles: TEACHERS },
  { group: "school", href: "/cards", label: "ออกบัตร", roles: ["admin_school"] },
  { group: "school", href: "/exam-rooms", label: "จัดห้องสอบ", roles: ["admin_school"] },
  { group: "school", href: "/approvals", label: "อนุมัติเอกสารส่งต่อ", roles: ["admin_school"] },
];

/** ตั้งค่าระบบ — ไอคอนเฟืองข้างการ์ดผู้ใช้ที่มุมล่างของ sidebar (ไม่อยู่ในรายการเมนู) */
export const SETTINGS_NAV: NavItem = { href: "/settings", label: "ตั้งค่าระบบ", roles: ["admin_school"] };

/** หน้าที่ไม่มีในเมนูแต่ต้องกันสิทธิ์ (เข้าผ่านเฟืองตั้งค่า) */
const HIDDEN_ROUTES: NavItem[] = [SETTINGS_NAV];

const matches = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

export const navForRole = (role: UserRole) => STAFF_NAV.filter((n) => n.roles.includes(role));

/** เมนูของบทบาทนี้จัดเป็นกลุ่ม — ไม่คืนกลุ่มที่ไม่มีรายการ */
export const navGroupsForRole = (role: UserRole) =>
  NAV_GROUPS.map((g) => ({ ...g, items: navForRole(role).filter((n) => n.group === g.id) })).filter(
    (g) => g.items.length > 0
  );

export const isNavEntryActive = (pathname: string, item: NavEntry) =>
  [item.href, ...(item.alsoActiveOn ?? [])].some((h) => matches(pathname, h));

/** บทบาทนี้เข้าหน้าฝั่งบุคลากรที่ pathname นี้ได้หรือไม่ (หน้าที่ไม่อยู่ในเมนู ถือว่าเข้าได้ทุกบทบาทบุคลากร) */
export function canAccessStaffPath(role: UserRole, pathname: string): boolean {
  const item = [...STAFF_NAV, ...HIDDEN_ROUTES].find((n) => matches(pathname, n.href));
  if (item) return item.roles.includes(role);
  return ALL_STAFF.includes(role);
}

export const isActivePath = matches;
