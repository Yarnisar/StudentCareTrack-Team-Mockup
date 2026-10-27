"use client";

/**
 * แสดงหน้าเฉพาะบทบาทที่มีสิทธิ์ (UC2 Alternate: ไม่มีสิทธิ์ → ไม่แสดงข้อมูลและแจ้งว่าเข้าถึงไม่ได้)
 * เป็นการซ่อนฝั่งหน้าจอเท่านั้น — Project 2 ต้องตรวจสิทธิ์ที่ backend ด้วย
 */

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { canAccess, ROLE_INFO } from "@/lib/roles";
import { useStore } from "@/lib/store";

export function RoleGate({ children }: { children: ReactNode }) {
  const { role } = useStore();
  const pathname = usePathname();

  if (canAccess(role, pathname)) return <>{children}</>;

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <Lock className="size-5 text-muted-foreground" />
        </div>
        <h1 className="text-lg font-bold">ไม่มีสิทธิ์เข้าถึงหน้านี้</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          บทบาท {ROLE_INFO[role].label} ไม่สามารถเข้าถึงหน้านี้ได้
          หากต้องการสิทธิ์เพิ่มเติม กรุณาติดต่อผู้ดูแลระบบของโรงเรียน
        </p>
        <LinkButton className="mt-5" href={ROLE_INFO[role].home}>
          กลับหน้าแรก
        </LinkButton>
      </div>
    </div>
  );
}
