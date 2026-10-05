"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "cn";
import { Bell } from "lucide-react";
import { useStore } from "@/lib/store";
import { NotificationList } from "./notification-list";

const PREVIEW_COUNT = 5;

/** กระดิ่งพร้อมจำนวนที่ยังไม่อ่าน และแผงรายการล่าสุด */
export function NotificationBell({
  allHref,
  tone = "default",
  align = "right",
}: {
  /** หน้ารายการทั้งหมด */
  allHref: string;
  tone?: "default" | "inverse";
  align?: "left" | "right";
}) {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const unread = store.myUnreadCount;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={unread > 0 ? `การแจ้งเตือน ยังไม่อ่าน ${unread} รายการ` : "การแจ้งเตือน"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex size-9 items-center justify-center rounded-lg transition-colors",
          tone === "inverse" ? "text-primary-foreground hover:bg-white/10" : "text-muted-foreground hover:bg-muted"
        )}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-risk-red px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="ปิดแผงการแจ้งเตือน"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute top-full z-50 mt-2 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-lg",
              align === "right" ? "right-0" : "left-0"
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-[14px] font-bold">การแจ้งเตือน</span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={store.markAllNotificationsRead}
                  className="text-[12px] font-semibold text-primary hover:underline"
                >
                  อ่านทั้งหมดแล้ว
                </button>
              )}
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              <NotificationList
                items={store.myNotifications.slice(0, PREVIEW_COUNT)}
                compact
                onNavigate={() => setOpen(false)}
              />
            </div>
            <Link
              href={allHref}
              onClick={() => setOpen(false)}
              className="block border-t border-border px-4 py-2.5 text-center text-[13px] font-semibold text-primary hover:bg-muted"
            >
              ดูทั้งหมด
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
