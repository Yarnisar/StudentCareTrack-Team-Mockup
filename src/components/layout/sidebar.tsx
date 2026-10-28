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
  Settings,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import { SCHOOL_NAME } from "@/lib/mock-data";
import { canAccess, ROLE_INFO } from "@/lib/roles";
import { useStore } from "@/lib/store";
import { useOnline } from "@/lib/use-online";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * เมนูจัดเป็นหมวด กลุ่ม "การดูแลช่วยเหลือ" เรียงตามขั้นตอนในรายงาน 2.1.1
 * (รู้จักนักเรียนจากการเยี่ยมบ้าน → คัดกรอง → ประเมิน → ช่วยเหลือและติดตาม)
 * หมวดที่บทบาทนี้เข้าไม่ได้เลยจะไม่แสดงหัวหมวด
 */
const NAV: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: "/dashboard", label: "ภาพรวม", icon: LayoutGrid },
      { href: "/students", label: "ข้อมูลนักเรียน", icon: Users },
    ],
  },
  {
    title: "การดูแลช่วยเหลือ",
    items: [
      { href: "/home-visits", label: "เยี่ยมบ้าน", icon: Home },
      { href: "/screening", label: "การคัดกรอง", icon: ClipboardCheck },
      { href: "/assessment", label: "การประเมิน", icon: HeartPulse },
      { href: "/care-cases", label: "ติดตามช่วยเหลือ", icon: Flag },
    ],
  },
  {
    title: "พฤติกรรมและคุณลักษณะ",
    items: [
      { href: "/behavior", label: "ความประพฤติ", icon: AlertTriangle },
      { href: "/characteristics", label: "คุณลักษณะอันพึงประสงค์", icon: Star },
    ],
  },
  {
    title: "เอกสาร",
    items: [{ href: "/documents", label: "เอกสาร ปพ.", icon: FileText }],
  },
  {
    title: "ระบบ",
    items: [{ href: "/settings", label: "ตั้งค่าระบบ", icon: Settings }],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useStore();
  const info = ROLE_INFO[role];
  const online = useOnline();
  // เมนูที่ตรงกับ URL ยาวที่สุดเป็นเมนูที่เลือกอยู่ (กันเมนูแม่ถูกเลือกซ้อนเมื่อมีเมนูลูกที่ path ขึ้นต้นเหมือนกัน)
  const activeHref = NAV.flatMap((g) => g.items)
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
  // แสดงเฉพาะเมนูที่บทบาทนี้เข้าได้
  const groups = NAV.map((g) => ({ ...g, items: g.items.filter((item) => canAccess(role, item.href)) })).filter(
    (g) => g.items.length > 0
  );

  return (
    <aside className="flex w-[264px] shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <div className="flex size-9 items-center justify-center rounded-[10px] bg-primary text-sm font-bold text-primary-foreground">
          SC
        </div>
        <div>
          <div className="text-[15px] leading-tight font-bold">Student Care Track</div>
          <div className="text-[11.5px] text-muted-foreground">{SCHOOL_NAME}</div>
        </div>
      </div>

      <div className="border-b border-border px-3 pb-4">
        <div className="flex items-center gap-2.5 rounded-[10px] bg-surface p-2.5">
          <div className="relative shrink-0">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
              {info.user.name.replace(/^(ครู|ด\.ญ\.|ด\.ช\.|นางสาว|นาง|นาย)\s*/, "").charAt(0)}
            </div>
            <span
              className={cn(
                "absolute right-0 bottom-0 size-3 rounded-full ring-2 ring-surface",
                online ? "bg-emerald-500" : "bg-muted-foreground/50"
              )}
              title={online ? "ออนไลน์" : "ออฟไลน์"}
            />
            <span className="sr-only">{online ? "ออนไลน์" : "ออฟไลน์"}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-semibold">{info.user.name}</div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="shrink-0 rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
                {info.label}
              </span>
              <span className="truncate text-[11.5px] text-muted-foreground">{info.user.scope}</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {groups.map((group, i) => (
          <div key={group.title ?? i} className={i > 0 ? "mt-3" : undefined}>
            {group.title && (
              <div className="px-5 pt-1 pb-1.5 text-[11.5px] font-semibold text-muted-foreground">{group.title}</div>
            )}
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = href === activeHref;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "mr-2 flex items-center gap-3 rounded-r-lg border-l-[3px] px-3.5 py-2 text-[14.5px] transition-colors",
                    active
                      ? "border-primary bg-accent font-semibold text-primary"
                      : "border-transparent font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-[19px] shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-2">
        <Link
          href="/login"
          className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[14px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-[18px]" /> ออกจากระบบ
        </Link>
      </div>
    </aside>
  );
}
