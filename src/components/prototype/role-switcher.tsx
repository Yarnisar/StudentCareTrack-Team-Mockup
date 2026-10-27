"use client";

/**
 * PROTOTYPE ONLY — แถบสลับบทบาทสำหรับ demo (ทิ้งเมื่อมีระบบยืนยันตัวตนจริง)
 * สลับได้จากทุกหน้าโดยข้อมูลในระบบไม่หาย ถ้าบทบาทใหม่เข้าหน้าปัจจุบันไม่ได้ จะพาไปหน้าแรกของบทบาทนั้น
 */

import { usePathname, useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { canAccess, ROLE_INFO, ROLE_ORDER, type Role } from "@/lib/roles";
import { useStore } from "@/lib/store";

export function RoleSwitcher() {
  const store = useStore();
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  const switchTo = (next: Role) => {
    store.setRole(next);
    if (!canAccess(next, pathname)) router.push(ROLE_INFO[next].home);
  };

  return (
    // มุมขวาล่าง เหนือแถบเมนูล่างของ portal (สูง 56px) และไม่ทับแถบสลับแบบร่างตรงกลาง
    <div className="fixed right-4 bottom-20 z-50 flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 py-1.5 pr-1.5 pl-3 text-zinc-100 shadow-xl">
      <UserRound className="size-4 text-amber-400" />
      <label htmlFor="demo-role" className="text-[11.5px] font-semibold tracking-wide text-amber-400">
        DEMO · บทบาท
      </label>
      <select
        id="demo-role"
        value={store.role}
        onChange={(e) => switchTo(e.target.value as Role)}
        className="h-8 rounded-full border border-zinc-600 bg-zinc-800 px-3 text-[13px] font-semibold text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        {ROLE_ORDER.map((r) => (
          <option key={r} value={r}>
            {ROLE_INFO[r].label}
          </option>
        ))}
      </select>
    </div>
  );
}
