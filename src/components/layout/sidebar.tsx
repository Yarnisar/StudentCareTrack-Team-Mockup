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
  QrCode,
  Settings,
  Star,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SCHOOL_NAME } from "@/lib/mock-data";
import { isActivePath, navForRole, SETTINGS_NAV } from "@/lib/navigation";
import { useStore } from "@/lib/store";
import { initialOf } from "@/lib/format";
import { SidebarRoleSwitcher } from "./role-switcher";

const ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutGrid,
  "/students": Users,
  "/screening": ClipboardCheck,
  "/assessment": HeartPulse,
  "/behavior": AlertTriangle,
  "/home-visits": Home,
  "/characteristics": Star,
  "/documents": FileText,
  "/checkin": QrCode,
  "/care-cases": Flag,
};

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useStore();
  const nav = navForRole(currentUser.role);
  const canOpenSettings = SETTINGS_NAV.roles.includes(currentUser.role);

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
        {nav.map(({ href, label }) => {
          const Icon = ICONS[href] ?? LayoutGrid;
          const active = isActivePath(pathname, href);
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
            {initialOf(currentUser.name.replace(/^ครู/, ""))}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-semibold">{currentUser.name}</div>
            <div className="truncate text-[11.5px] text-muted-foreground">{currentUser.title}</div>
          </div>
          {canOpenSettings && (
            <Link href={SETTINGS_NAV.href} aria-label={SETTINGS_NAV.label}>
              <Settings className="size-[17px] text-muted-foreground hover:text-foreground" />
            </Link>
          )}
        </div>
        <SidebarRoleSwitcher />
      </div>
    </aside>
  );
}
