/**
 * slice พื้นฐานที่ทุก slice ของโมดูลรับเป็นอาร์กิวเมนต์ (base):
 * core (ผู้ใช้/สิทธิ์/ข้อมูลอ้างอิง) + audit + การแจ้งเตือน + ตั้งค่า/ช่วงดำเนินงาน + ความยินยอม
 *
 * ใช้ใน slice: base.logAudit(...), base.notify(...), base.isWindowOpen(...),
 * base.schoolSettings, base.consentOf(...)
 */

import type { AuditSlice } from "./audit";
import type { ConsentSlice } from "./consent";
import type { CoreSlice } from "./core";
import type { NotificationsSlice } from "./notifications";
import type { SettingsSlice } from "./settings";

export type PlatformSlice = CoreSlice & AuditSlice & NotificationsSlice & SettingsSlice & ConsentSlice;
