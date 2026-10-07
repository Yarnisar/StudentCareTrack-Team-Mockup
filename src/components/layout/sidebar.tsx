"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import {
  Activity,
  Bell,
  ClipboardCheck,
  FileText,
  HeartHandshake,
  HeartPulse,
  House,
  IdCard,
  LayoutGrid,
  ScanLine,
  School,
  Settings,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SCHOOL_NAME } from "@/lib/mock-data";
import { SETTINGS_NAV, isActivePath, isNavEntryActive, navGroupsForRole } from "@/lib/navigation";
import { useStore } from "@/lib/store";
import { initialOf } from "@/lib/format";
import { useNavBadges } from "./use-nav-badges";

const ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutGrid,
  "/students": Users,
  "/home-visits": House,
  "/screening": ClipboardCheck,
  "/assessment": HeartPulse,
  "/care-cases": HeartHandshake,
  "/behavior": Activity,
  "/characteristics": Star,
  "/documents": FileText,
  "/checkin": ScanLine,
  "/cards": IdCard,
  "/approvals": ShieldCheck,
  "/settings": Settings,
};

const ROW =
  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors max-md:justify-center max-md:px-0";

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, currentTerm, myUnreadCount } = useStore();
  const groups = navGroupsForRole(currentUser.role);
  const { counts, urgent } = useNavBadges();
  const notifActive = isActivePath(pathname, "/notifications");
  const canOpenSettings = SETTINGS_NAV.roles.includes(currentUser.role);
  const settingsActive = isActivePath(pathname, SETTINGS_NAV.href);

  return (
    <aside className="flex w-[264px] shrink-0 flex-col border-r border-border bg-card max-md:w-[68px]">
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 max-md:justify-center max-md:px-0">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary text-sm font-bold text-primary-foreground">
          SC
        </div>
        <div className="max-md:hidden">
          <div className="text-[15px] leading-tight font-bold">Student Care Track</div>
        </div>
      </div>

      <div className="mx-3 mb-3 flex items-center gap-3 rounded-2xl border border-border px-3.5 py-3 max-md:hidden">
        <School className="size-[22px] shrink-0 text-muted-foreground" strokeWidth={1.6} />
        <div className="min-w-0">
          <div className="truncate text-[13.5px] font-bold text-foreground">{SCHOOL_NAME}</div>
          <div className="truncate text-[12.5px] text-muted-foreground">ปีการศึกษา {currentTerm.academicYear}</div>
        </div>
      </div>

      <nav aria-label="เมนูหลัก" className="flex-1 overflow-y-auto px-3 pb-2">
        {groups.map((group) => (
          <div key={group.id} className="mb-2">
            <div className="px-3 pt-3 pb-1.5 text-[12px] text-muted-foreground max-md:hidden">{group.label}</div>
            <div className="hidden border-t border-border max-md:mx-2 max-md:mt-2 max-md:mb-1.5 max-md:block" />
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = ICONS[item.href] ?? LayoutGrid;
                const active = isNavEntryActive(pathname, item);
                const count = counts[item.href] ?? 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    aria-label={count > 0 ? `${item.label} (${count})` : item.label}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      ROW,
                      active
                        ? "bg-accent font-bold text-accent-foreground"
                        : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="size-[21px] shrink-0" strokeWidth={1.6} />
                    <span className="flex-1 max-md:hidden">{item.label}</span>
                    {count > 0 && (
                      <span
                        aria-hidden
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[12px] leading-tight font-semibold tabular-nums",
                          "max-md:absolute max-md:top-0.5 max-md:right-1.5 max-md:px-1 max-md:text-[10px]",
                          urgent.includes(item.href)
                            ? "bg-risk-red-bg text-risk-red"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-border p-3">
        <Link
          href="/notifications"
          title="การแจ้งเตือน"
          aria-label={myUnreadCount > 0 ? `การแจ้งเตือน (${myUnreadCount})` : "การแจ้งเตือน"}
          className={cn(
            ROW,
            "py-2 text-[13px]",
            notifActive
              ? "bg-accent font-bold text-accent-foreground"
              : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Bell className="size-[19px] shrink-0" strokeWidth={1.6} />
          <span className="flex-1 max-md:hidden">การแจ้งเตือน</span>
          {myUnreadCount > 0 && (
            <span
              aria-hidden
              className="rounded-full bg-risk-red px-1.5 py-0.5 text-[10.5px] leading-tight font-bold text-white max-md:absolute max-md:top-0.5 max-md:right-1.5"
            >
              {myUnreadCount}
            </span>
          )}
        </Link>
        <div
          title={`${currentUser.name} · ${currentUser.title}`}
          className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 max-md:justify-center"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
            {initialOf(currentUser.name.replace(/^ครู/, ""))}
          </div>
          <div className="min-w-0 flex-1 max-md:hidden">
            <div className="truncate text-[12.5px] font-semibold text-foreground">{currentUser.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">{currentUser.title}</div>
          </div>
          {canOpenSettings && (
            <Link
              href={SETTINGS_NAV.href}
              title={SETTINGS_NAV.label}
              aria-label={SETTINGS_NAV.label}
              aria-current={settingsActive ? "page" : undefined}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors max-md:hidden",
                settingsActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Settings className="size-[18px]" strokeWidth={1.7} />
            </Link>
          )}
        </div>
        {canOpenSettings && (
          <Link
            href={SETTINGS_NAV.href}
            title={SETTINGS_NAV.label}
            aria-label={SETTINGS_NAV.label}
            aria-current={settingsActive ? "page" : undefined}
            className={cn(
              "mx-auto mt-1 hidden size-9 items-center justify-center rounded-lg transition-colors max-md:flex",
              settingsActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Settings className="size-[18px]" strokeWidth={1.7} />
          </Link>
        )}
      </div>
    </aside>
  );
}
