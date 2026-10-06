"use client";

import { usePathname, useRouter } from "next/navigation";
import { DEMO_USERS } from "@/lib/mock-data";
import { canAccessStaffPath } from "@/lib/navigation";
import { HOME_BY_ROLE, isStaff } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import type { User } from "@/lib/types";

const within = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

/** บทบาทนี้อยู่หน้าเดิมต่อได้หรือไม่ — ข้ามฝั่งบุคลากร ↔ portal ต้องเปลี่ยนหน้าเสมอ */
export function canStayOnPath(user: User, pathname: string): boolean {
  const inPortal = within(pathname, "/portal");
  if (isStaff(user)) return !inPortal && canAccessStaffPath(user.role, pathname);
  if (!inPortal) return false;
  if (within(pathname, "/portal/notifications")) return true;
  return within(pathname, user.role === "parent" ? "/portal/parent" : "/portal/student");
}

/** สลับผู้ใช้ปัจจุบันโดยไม่ reload (state ของต้นแบบอยู่ในหน่วยความจำ) แล้วพาไปหน้าที่บทบาทนั้นเข้าได้ */
export function useSwitchUser() {
  const store = useStore();
  const router = useRouter();
  const pathname = usePathname();

  return (user: User, { stay }: { stay: boolean }) => {
    store.setCurrentUser(user.userId);
    if (!(stay && canStayOnPath(user, pathname))) router.push(HOME_BY_ROLE[user.role]);
  };
}

/** ผู้ใช้สาธิตตามลำดับใน DEMO_USERS พร้อมคำอธิบายว่าแต่ละคนใช้สาธิตอะไร */
export function demoUsers(users: User[]) {
  return DEMO_USERS.flatMap(({ userId, note }) => {
    const user = users.find((u) => u.userId === userId);
    return user ? [{ user, note }] : [];
  });
}
