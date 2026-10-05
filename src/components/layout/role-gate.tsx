"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LinkButton } from "@/components/ui/link-button";
import { canAccessStaffPath } from "@/lib/navigation";
import { HOME_BY_ROLE } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import { ROLE_LABEL } from "@/lib/types";

/** กันหน้าฝั่งบุคลากรที่บทบาทของผู้ใช้ปัจจุบันเข้าไม่ได้ */
export function RoleGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { currentUser } = useStore();

  if (canAccessStaffPath(currentUser.role, pathname)) return <>{children}</>;

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-md rounded-xl border border-border bg-card p-6 text-center">
        <h2 className="text-lg font-bold">ไม่มีสิทธิ์เข้าหน้านี้</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          บทบาท {ROLE_LABEL[currentUser.role]} ไม่สามารถเปิดหน้านี้ได้
        </p>
        <LinkButton className="mt-4" href={HOME_BY_ROLE[currentUser.role]}>
          ไปหน้าหลักของฉัน
        </LinkButton>
      </div>
    </div>
  );
}
