"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "cn";
import { DEMO_USERS } from "@/lib/mock-data";
import { canAccessStaffPath } from "@/lib/navigation";
import { HOME_BY_ROLE, isStaff } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import { ROLE_LABEL, type User } from "@/lib/types";

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

/** ตัวเลือกบทบาทในหน้า login */
export function LoginRolePicker() {
  const store = useStore();
  const switchUser = useSwitchUser();

  return (
    <div className="grid gap-2">
      {demoUsers(store.users).map(({ user, note }) => (
        <button
          key={user.userId}
          type="button"
          onClick={() => switchUser(user, { stay: false })}
          className={cn(
            "flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors hover:bg-muted",
            user.userId === store.currentUser.userId ? "border-primary bg-accent" : "border-border"
          )}
        >
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-semibold">{user.name}</span>
            <span className="block truncate text-[11.5px] text-muted-foreground">{note}</span>
          </span>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {ROLE_LABEL[user.role]}
          </span>
        </button>
      ))}
    </div>
  );
}
