"use client";

import { useRouter } from "next/navigation";
import { cn } from "cn";
import { Mail } from "lucide-react";
import { formatThaiDateTime } from "@/lib/format";
import { NOTIFICATION_EVENT_LABEL } from "@/lib/notifications";
import { useStore } from "@/lib/store";
import type { Notification } from "@/lib/types";

/** รายการแจ้งเตือน — กดแล้วทำเครื่องหมายว่าอ่านแล้วและไปหน้าที่เกี่ยวข้อง */
export function NotificationList({
  items,
  compact = false,
  onNavigate,
}: {
  items: Notification[];
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const store = useStore();
  const router = useRouter();

  if (items.length === 0) {
    return <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">ยังไม่มีการแจ้งเตือน</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((n) => (
        <li key={n.notificationId}>
          <button
            type="button"
            onClick={() => {
              store.markNotificationRead(n.notificationId);
              onNavigate?.();
              router.push(n.linkPath);
            }}
            className={cn(
              "flex w-full gap-3 text-left transition-colors hover:bg-muted",
              compact ? "px-4 py-3" : "px-5 py-3.5",
              !n.readAt && "bg-accent/40"
            )}
          >
            <span
              aria-hidden
              className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-primary")}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-semibold text-muted-foreground">
                {NOTIFICATION_EVENT_LABEL[n.eventType]}
              </span>
              <span className={cn("block text-[13px] leading-snug", !n.readAt && "font-semibold")}>
                {n.message}
              </span>
              <span className="mt-1 flex items-center gap-2 text-[12px] text-muted-foreground">
                {formatThaiDateTime(n.createdAt)}
                {n.emailedAt && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="size-3" /> ส่งอีเมลแล้ว
                  </span>
                )}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
