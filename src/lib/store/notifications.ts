/**
 * Notifications slice: notifications + notification_settings
 *
 * notify() ส่งในระบบเสมอ (ปิดไม่ได้) และ "ส่งอีเมล" (จำลองด้วย emailedAt) เมื่อผู้รับมีอีเมลและไม่ได้ปิดรับ
 * ข้อความสร้างจากแม่แบบใน lib/notifications.ts เท่านั้น — ไม่มีข้อมูลอ่อนไหว
 */

import { useMemo, useState } from "react";
import {
  notificationSettings as seedSettings,
  seedNotifications,
  studentGuardians,
} from "../mock-data";
import { buildNotificationContent } from "../notifications";
import { nowThaiIso } from "../format";
import type {
  Notification,
  NotificationEventType,
  NotificationParams,
  NotificationSetting,
} from "../types";
import type { AuditSlice } from "./audit";
import type { CoreSlice } from "./core";
import { nextId } from "./ids";

export type RecipientGroup = "homeroom" | "guardians";

export interface NotificationsSlice {
  notifications: Notification[];
  /** การแจ้งเตือนของ currentUser ใหม่สุดก่อน */
  myNotifications: Notification[];
  myUnreadCount: number;
  /**
   * สร้างการแจ้งเตือน 1 แถวต่อผู้รับ (ตัด userId ซ้ำ/ไม่มีอยู่ออก) คืนแถวที่สร้าง
   * studentId = null สำหรับเรื่องระดับห้อง/โรงเรียน
   */
  notify: (
    eventType: NotificationEventType,
    recipients: string[],
    studentId: string | null,
    params?: NotificationParams
  ) => Notification[];
  /** userId ของผู้รับตามกลุ่ม: ครูประจำชั้นทั้ง 2 คน และ/หรือ ผู้ปกครองทุกคน (สิทธิ์เท่ากัน) */
  recipientsOf: (studentId: string, groups: RecipientGroup[]) => string[];
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  emailEnabledOf: (userId: string) => boolean;
  /** ตั้งค่า "รับอีเมล" ของ currentUser (ไม่ใช่การตั้งค่าของแอดมิน) */
  setEmailEnabled: (enabled: boolean) => void;
}

export function useNotificationsSlice(core: CoreSlice, audit: AuditSlice): NotificationsSlice {
  const [notifications, setNotifications] = useState<Notification[]>(seedNotifications);
  const [settings, setSettings] = useState<NotificationSetting[]>(seedSettings);

  return useMemo<NotificationsSlice>(() => {
    const me = core.currentUser.userId;

    const emailEnabledOf = (userId: string) =>
      settings.find((s) => s.userId === userId)?.emailEnabled ?? true;

    const notify: NotificationsSlice["notify"] = (eventType, recipients, studentId, params) => {
      const now = nowThaiIso();
      const studentName = studentId ? (core.getStudent(studentId)?.fullName ?? null) : null;
      const created = [...new Set(recipients)].flatMap<Notification>((userId) => {
        const user = core.getUser(userId);
        if (!user) return [];
        const content = buildNotificationContent(eventType, studentId, studentName, user.role, params);
        return [
          {
            notificationId: nextId("NT"),
            recipientUserId: userId,
            eventType,
            studentId,
            ...content,
            createdAt: now,
            readAt: null,
            emailedAt: user.email && emailEnabledOf(userId) ? now : null,
          },
        ];
      });
      if (created.length > 0) setNotifications((prev) => [...created, ...prev]);
      return created;
    };

    const recipientsOf: NotificationsSlice["recipientsOf"] = (studentId, groups) => {
      const ids: string[] = [];
      if (groups.includes("homeroom")) ids.push(...core.homeroomTeachersOf(studentId).map((u) => u.userId));
      if (groups.includes("guardians"))
        ids.push(...studentGuardians.filter((g) => g.studentId === studentId).map((g) => g.guardianUserId));
      return [...new Set(ids)];
    };

    const myNotifications = notifications
      .filter((n) => n.recipientUserId === me)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const markNotificationRead: NotificationsSlice["markNotificationRead"] = (notificationId) => {
      const now = nowThaiIso();
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId && n.recipientUserId === me && !n.readAt ? { ...n, readAt: now } : n
        )
      );
    };

    const markAllNotificationsRead = () => {
      const now = nowThaiIso();
      setNotifications((prev) =>
        prev.map((n) => (n.recipientUserId === me && !n.readAt ? { ...n, readAt: now } : n))
      );
    };

    const setEmailEnabled: NotificationsSlice["setEmailEnabled"] = (enabled) => {
      const before = emailEnabledOf(me);
      if (before === enabled) return;
      const row: NotificationSetting = { userId: me, emailEnabled: enabled, updatedAt: nowThaiIso() };
      setSettings((prev) => [...prev.filter((s) => s.userId !== me), row]);
      audit.logAudit("UPDATE", "notification_settings", me, {
        before: { emailEnabled: before },
        after: { emailEnabled: enabled },
      });
    };

    return {
      notifications,
      myNotifications,
      myUnreadCount: myNotifications.filter((n) => !n.readAt).length,
      notify,
      recipientsOf,
      markNotificationRead,
      markAllNotificationsRead,
      emailEnabledOf,
      setEmailEnabled,
    };
  }, [core, audit, notifications, settings]);
}
