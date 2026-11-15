"use client";

/**
 * กระดิ่งที่หัวหน้า: ตัวเลขที่ยังไม่อ่าน กดแล้วเปิดแผงรายการใต้กระดิ่ง กดรายการเพื่อไปหน้านั้นและถือว่าอ่านแล้ว
 * มีแต่ "สิ่งที่เกิดขึ้น" ที่ต้องรู้ งานที่ต้องลงมืออยู่ในหน้าภาพรวม
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { formatThaiDate, formatThaiTime } from "@/lib/format";
import { useStore } from "@/lib/store";

export function NotificationBell() {
  const store = useStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [onlyUnread, setOnlyUnread] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  // อ่านแล้วแยกตามบทบาท เพราะบางเหตุการณ์ส่งถึงหลายบทบาท
  const items = store.staffNotifications.map((n) => ({ ...n, key: `${store.role}:${n.id}`, read: store.readNotifications.includes(`${store.role}:${n.id}`) }));
  const unread = items.filter((n) => !n.read).length;
  const shown = onlyUnread ? items.filter((n) => !n.read) : items;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={unread > 0 ? `การแจ้งเตือน ยังไม่อ่าน ${unread}` : "การแจ้งเตือน"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10.5px] leading-4.5 font-bold text-primary-foreground">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-2 w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
            <span className="text-[14px] font-bold">การแจ้งเตือน</span>
            <span className="flex-1" />
            {(["unread", "all"] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={onlyUnread === (k === "unread")}
                onClick={() => setOnlyUnread(k === "unread")}
                className={`rounded-md px-2 py-1 text-[12px] ${onlyUnread === (k === "unread") ? "bg-accent font-semibold text-primary" : "text-muted-foreground hover:bg-muted"}`}
              >
                {k === "unread" ? "ยังไม่อ่าน" : "ทั้งหมด"}
              </button>
            ))}
          </div>

          <div className="max-h-[60vh] divide-y divide-border overflow-y-auto">
            {shown.map((n) => (
              <button
                key={n.key}
                type="button"
                onClick={() => {
                  store.markNotificationRead(n.key);
                  setOpen(false);
                  if (n.href) router.push(n.href);
                }}
                className="flex w-full items-start gap-2.5 px-4 py-3 text-left hover:bg-muted/50"
              >
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-primary"}`} />
                <span className="min-w-0 flex-1">
                  <span className={`block text-[13.5px] ${n.read ? "" : "font-semibold"}`}>{n.title}</span>
                  <span className="block text-[12.5px] text-muted-foreground">{n.body}</span>
                  <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
                    {formatThaiDate(n.at)} {formatThaiTime(n.at)}
                  </span>
                </span>
              </button>
            ))}
            {shown.length === 0 && (
              <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                {items.length === 0 ? "ยังไม่มีการแจ้งเตือน" : "ไม่มีรายการที่ยังไม่อ่าน"}
              </p>
            )}
          </div>

          {unread > 0 && (
            <div className="border-t border-border px-4 py-2 text-right">
              <button
                type="button"
                onClick={() => items.filter((n) => !n.read).forEach((n) => store.markNotificationRead(n.key))}
                className="text-[12.5px] font-semibold text-primary hover:underline"
              >
                อ่านทั้งหมด
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
