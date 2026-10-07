/**
 * โหมดการใช้งาน (ADR-0005) — ตั้งตอน deploy ด้วย NEXT_PUBLIC_DEPLOYMENT_MODE ไม่มีสวิตช์ในหน้าเว็บ
 * - integrated (ค่าเริ่มต้น): ข้อมูลนักเรียน/ห้อง/ครู/ผู้ปกครอง/ภาคเรียนมาจากทีม B/A อ่านอย่างเดียว
 * - standalone: โรงเรียนใช้ระบบนี้ตัวเดียว ผู้ดูแลระบบนำเข้าข้อมูลเหล่านี้จากไฟล์เอง
 * อ่านที่ไฟล์นี้ไฟล์เดียว ค่าอื่นที่ไม่รู้จักถือเป็น integrated
 */

export type DeploymentMode = "integrated" | "standalone";

export const DEPLOYMENT_MODE: DeploymentMode =
  process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === "standalone" ? "standalone" : "integrated";

export const isStandalone = DEPLOYMENT_MODE === "standalone";

export const DEPLOYMENT_MODE_LABEL: Record<DeploymentMode, string> = {
  integrated: "เชื่อมระบบทีม B",
  standalone: "โหมดเดี่ยว",
};

/** ข้อความเมื่อมีการพยายามเขียนข้อมูลอ้างอิงในโหมดเชื่อมระบบ */
export const INTEGRATED_READ_ONLY_MESSAGE = "ข้อมูลนี้มาจากทีม B — ในโหมดเชื่อมระบบไม่นำเข้าเอง";
