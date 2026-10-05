"use client";

import { MobileShell } from "@/components/layout/mobile-shell";
import { EmailToggle } from "@/components/notifications/email-toggle";
import { NotificationList } from "@/components/notifications/notification-list";
import { useStore } from "@/lib/store";

export default function PortalNotificationsPage() {
  const store = useStore();
  const role = store.currentUser.role === "student" ? "student" : "parent";

  return (
    <MobileShell
      title="การแจ้งเตือน"
      subtitle={`ยังไม่อ่าน ${store.myUnreadCount} รายการ`}
      role={role}
      back={role === "student" ? "/portal/student" : "/portal/parent"}
    >
      <div className="space-y-3 p-4">
        <EmailToggle />
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-[14px] font-bold">รายการแจ้งเตือน</span>
            {store.myUnreadCount > 0 && (
              <button
                type="button"
                onClick={store.markAllNotificationsRead}
                className="text-[12px] font-semibold text-primary"
              >
                อ่านทั้งหมดแล้ว
              </button>
            )}
          </div>
          <NotificationList items={store.myNotifications} compact />
        </div>
      </div>
    </MobileShell>
  );
}
