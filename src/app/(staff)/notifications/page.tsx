"use client";

import { PageHeader } from "@/components/layout/page-header";
import { EmailToggle } from "@/components/notifications/email-toggle";
import { NotificationList } from "@/components/notifications/notification-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";

export default function NotificationsPage() {
  const store = useStore();

  return (
    <>
      <PageHeader
        title="การแจ้งเตือน"
        subtitle={`ทั้งหมด ${store.myNotifications.length} รายการ · ยังไม่อ่าน ${store.myUnreadCount} รายการ`}
      />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-3xl space-y-4">
          <EmailToggle />
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <h2 className="text-[15px] font-bold">รายการแจ้งเตือน</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={store.markAllNotificationsRead}
                  disabled={store.myUnreadCount === 0}
                >
                  อ่านทั้งหมดแล้ว
                </Button>
              </div>
              <NotificationList items={store.myNotifications} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
