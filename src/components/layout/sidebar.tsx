"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import {
  AlertTriangle,
  ClipboardCheck,
  FileText,
  Flag,
  HeartPulse,
  Home,
  LayoutGrid,
  LogOut,
  QrCode,
  Settings,
  Star,
  Users,
} from "lucide-react";
import { SCHOOL_NAME } from "@/lib/mock-data";
import { canAccess, ROLE_INFO } from "@/lib/roles";
import { useStore } from "@/lib/store";

const NAV = [
  { href: "/dashboard", label: "ภาพรวม", icon: LayoutGrid },
  { href: "/students", label: "ข้อมูลนักเรียน", icon: Users },
  { href: "/screening", label: "การคัดกรอง", icon: ClipboardCheck },
  { href: "/assessment", label: "การประเมิน", icon: HeartPulse },
  { href: "/behavior", label: "ความประพฤติ", icon: AlertTriangle },
  { href: "/home-visits", label: "เยี่ยมบ้าน", icon: Home },
  { href: "/characteristics", label: "คุณลักษณะฯ", icon: Star },
  { href: "/documents", label: "เอกสาร ปพ.", icon: FileText },
  { href: "/checkin", label: "บัตร / QR", icon: QrCode },
  { href: "/care-cases", label: "ติดตามช่วยเหลือ", icon: Flag },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useStore();
  const user = ROLE_INFO[role].user;
  // แสดงเฉพาะเมนูที่บทบาทนี้เข้าได้
  const nav = NAV.filter((item) => canAccess(role, item.href));

  return (
    <aside className="flex w-[264px] shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-[10px] bg-primary text-sm font-bold text-primary-foreground">
          SC
        </div>
        <div>
          <div className="text-[15px] leading-tight font-bold">Student Care Track</div>
          <div className="text-[11.5px] text-muted-foreground">{SCHOOL_NAME}</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "mr-2 flex items-center gap-3 rounded-r-lg border-l-[3px] px-3.5 py-2.5 text-[14.5px] transition-colors",
                active
                  ? "border-primary bg-accent font-semibold text-primary"
                  : "border-transparent font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-[19px]" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-[10px] bg-surface p-2.5">
          <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
            {user.name.replace(/^ครู/, "").charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-semibold">{user.name}</div>
            <div className="truncate text-[11.5px] text-muted-foreground">{user.title}</div>
          </div>
          {canAccess(role, "/settings") && (
            <Link href="/settings" aria-label="ตั้งค่าระบบ" className="rounded-md p-1 hover:bg-muted">
              <Settings className="size-[17px] text-muted-foreground hover:text-foreground" />
            </Link>
          )}
          <Link href="/login" aria-label="ออกจากระบบ" title="ออกจากระบบ" className="rounded-md p-1 hover:bg-muted">
            <LogOut className="size-[17px] text-muted-foreground hover:text-foreground" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
