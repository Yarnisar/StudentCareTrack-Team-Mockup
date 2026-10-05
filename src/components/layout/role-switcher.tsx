"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "cn";
import { DEMO_USERS } from "@/lib/mock-data";
import { canAccessStaffPath } from "@/lib/navigation";
import { HOME_BY_ROLE, isStaff } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import { ROLE_LABEL, type User } from "@/lib/types";

/** สลับผู้ใช้ปัจจุบันโดยไม่ reload (state ของต้นแบบอยู่ในหน่วยความจำ) แล้วพาไปหน้าที่บทบาทนั้นเข้าได้ */
function useSwitchUser() {
  const store = useStore();
  const router = useRouter();
  const pathname = usePathname();

  return (user: User, { stay }: { stay: boolean }) => {
    store.setCurrentUser(user.userId);
    const keepPage = stay && isStaff(user) && canAccessStaffPath(user.role, pathname);
    if (!keepPage) router.push(HOME_BY_ROLE[user.role]);
  };
}

function demoUsers(users: User[]) {
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

/** ตัวเลือกบทบาทแบบย่อท้าย sidebar */
export function SidebarRoleSwitcher() {
  const store = useStore();
  const switchUser = useSwitchUser();
  const options = demoUsers(store.users);

  return (
    <label className="mt-2 block">
      <span className="mb-1 block text-[11px] text-muted-foreground">สลับผู้ใช้ (สาธิต)</span>
      <select
        value={store.currentUser.userId}
        onChange={(e) => {
          const user = store.getUser(e.target.value);
          if (user) switchUser(user, { stay: true });
        }}
        className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-[12.5px]"
      >
        {options.map(({ user, note }) => (
          <option key={user.userId} value={user.userId}>
            {user.name} — {note}
          </option>
        ))}
      </select>
    </label>
  );
}
