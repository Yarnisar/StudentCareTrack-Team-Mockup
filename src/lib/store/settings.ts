/**
 * Settings slice: school_settings (แถวเดียว) และ operating_windows (UNIQUE ต่อ ภาคเรียน + กิจกรรม)
 *
 * นอกช่วงดำเนินงาน ดูได้แต่บันทึกไม่ได้ — หลังวันปิดล็อกเสมอ (ไม่มีตัวเลือกปิดการล็อก)
 * slice อื่นตรวจด้วย isWindowOpen(activity) ก่อนบันทึก
 * การปลดล็อกการคัดกรองรายคนเป็นของ screening slice (audit UNLOCK)
 */

import { useMemo, useState } from "react";
import { initialSchoolSettings, operatingWindows as seedWindows } from "../mock-data";
import { compareThaiDate, nowThaiIso, thaiDateOf } from "../format";
import { isWindowClosingSoon, windowStatusAt } from "../rules";
import type { OperatingActivity, OperatingWindow, SchoolSettings, WindowStatus } from "../types";
import type { AuditSlice } from "./audit";
import type { CoreSlice } from "./core";
import { nextId } from "./ids";
import type { NotificationsSlice } from "./notifications";

export type SchoolSettingsPatch = Partial<Omit<SchoolSettings, "updatedBy" | "updatedAt">>;

export interface OperatingWindowInput {
  opensAt: string;
  closesAt: string;
  remindDaysBefore: number;
}

export type SaveWindowResult = { ok: true; window: OperatingWindow } | { ok: false; error: string };

export interface SettingsSlice {
  schoolSettings: SchoolSettings;
  /** แอดมินเท่านั้น — audit UPDATE พร้อมค่าก่อน/หลัง */
  updateSchoolSettings: (patch: SchoolSettingsPatch) => void;

  operatingWindows: OperatingWindow[];
  /** ช่วงดำเนินงานของกิจกรรมในภาคเรียน (ค่าเริ่มต้น = ภาคเรียนปัจจุบัน) */
  windowOf: (activity: OperatingActivity, termId?: string) => OperatingWindow | undefined;
  /** สถานะ ณ at (ค่าเริ่มต้น = ตอนนี้) ของช่วงในภาคเรียนปัจจุบัน */
  windowStatusOf: (activity: OperatingActivity, at?: string) => WindowStatus;
  /** บันทึกได้หรือไม่ ณ at (ค่าเริ่มต้น = ตอนนี้) — false เมื่อยังไม่เปิด ปิดแล้ว หรือไม่ได้กำหนด */
  isWindowOpen: (activity: OperatingActivity, at?: string) => boolean;
  /** เปิดอยู่และเหลือไม่เกิน remindDaysBefore วันก่อนปิด */
  isWindowClosingSoon: (activity: OperatingActivity, at?: string) => boolean;
  /** สร้างหรือแก้ช่วงของกิจกรรมในภาคเรียน (ค่าเริ่มต้น = ปัจจุบัน) — แอดมินเท่านั้น */
  saveOperatingWindow: (
    activity: OperatingActivity,
    input: OperatingWindowInput,
    termId?: string
  ) => SaveWindowResult;
}

export function useSettingsSlice(
  core: CoreSlice,
  audit: AuditSlice,
  notifications: NotificationsSlice
): SettingsSlice {
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(initialSchoolSettings);
  const [operatingWindows, setOperatingWindows] = useState<OperatingWindow[]>(seedWindows);

  return useMemo<SettingsSlice>(() => {
    const currentTermId = core.currentTerm.termId;
    const isAdmin = core.currentUser.role === "admin_school";

    const windowOf: SettingsSlice["windowOf"] = (activity, termId = currentTermId) =>
      operatingWindows.find((w) => w.termId === termId && w.activity === activity);

    const windowStatusOf: SettingsSlice["windowStatusOf"] = (activity, at = nowThaiIso()) =>
      windowStatusAt(windowOf(activity), at);

    const updateSchoolSettings: SettingsSlice["updateSchoolSettings"] = (patch) => {
      if (!isAdmin) return;
      const before = schoolSettings;
      const changed = (Object.keys(patch) as (keyof SchoolSettingsPatch)[]).filter(
        (k) => patch[k] !== undefined && patch[k] !== before[k]
      );
      if (changed.length === 0) return;
      const next: SchoolSettings = {
        ...before,
        ...patch,
        updatedBy: core.currentUser.userId,
        updatedAt: nowThaiIso(),
      };
      setSchoolSettings(next);
      audit.logAudit("UPDATE", "school_settings", "1", {
        before: Object.fromEntries(changed.map((k) => [k, before[k]])),
        after: Object.fromEntries(changed.map((k) => [k, next[k]])),
      });
    };

    const saveOperatingWindow: SettingsSlice["saveOperatingWindow"] = (activity, input, termId = currentTermId) => {
      if (!isAdmin) return { ok: false, error: "เฉพาะแอดมินโรงเรียนเท่านั้นที่กำหนดช่วงดำเนินงานได้" };
      if (!input.opensAt || !input.closesAt) return { ok: false, error: "ต้องระบุวันเปิดและวันปิด" };
      if (compareThaiDate(input.opensAt, input.closesAt) > 0)
        return { ok: false, error: "วันเปิดต้องไม่อยู่หลังวันปิด" };
      const remindDaysBefore = Math.max(0, Math.round(input.remindDaysBefore || 0));

      const existing = windowOf(activity, termId);
      const window: OperatingWindow = {
        windowId: existing?.windowId ?? nextId("OW"),
        termId,
        activity,
        opensAt: thaiDateOf(input.opensAt),
        closesAt: thaiDateOf(input.closesAt),
        remindDaysBefore,
        updatedBy: core.currentUser.userId,
      };
      setOperatingWindows((prev) =>
        existing ? prev.map((w) => (w.windowId === existing.windowId ? window : w)) : [...prev, window]
      );

      const pick = (w: OperatingWindow) => ({
        opensAt: w.opensAt,
        closesAt: w.closesAt,
        remindDaysBefore: w.remindDaysBefore,
      });
      audit.logAudit(
        existing ? "UPDATE" : "CREATE",
        "operating_windows",
        window.windowId,
        existing ? { before: pick(existing), after: pick(window) } : { after: { activity, ...pick(window) } }
      );

      // เพิ่งเข้าช่วง "ใกล้ปิด" จากการแก้ครั้งนี้ → แจ้งครูประจำชั้นทุกคน
      const now = nowThaiIso();
      if (
        termId === currentTermId &&
        isWindowClosingSoon(window, now) &&
        !isWindowClosingSoon(existing, now)
      ) {
        const homeroomTeachers = core.users.filter((u) => u.role === "teacher_homeroom").map((u) => u.userId);
        notifications.notify("window_closing", homeroomTeachers, null, { activity, date: window.closesAt });
      }
      return { ok: true, window };
    };

    return {
      schoolSettings,
      updateSchoolSettings,
      operatingWindows,
      windowOf,
      windowStatusOf,
      isWindowOpen: (activity, at) => windowStatusOf(activity, at) === "open",
      isWindowClosingSoon: (activity, at = nowThaiIso()) => isWindowClosingSoon(windowOf(activity), at),
      saveOperatingWindow,
    };
  }, [core, audit, notifications, schoolSettings, operatingWindows]);
}
