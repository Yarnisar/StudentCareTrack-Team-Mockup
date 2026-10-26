/**
 * กติกาการแสดงผลใน portal ผู้ปกครอง (รายงาน 2.1.10, 3.2.4)
 */

import { DcSummary, SdqAssessment, SdqLevel } from "./types";

/**
 * ผลสรุป SDQ ที่ผู้ปกครองเห็น — คิดจากฉบับครูและฉบับผู้ปกครองเท่านั้น
 * ไม่นับฉบับนักเรียนประเมินตนเอง เพราะคำตอบของนักเรียนเป็นความลับ
 * ถ้านับรวม ข้อความที่เปลี่ยนไปจะบอกผู้ปกครองได้ว่านักเรียนตอบอย่างไร
 */
export function sdqSummaryForParent(records: SdqAssessment[]): SdqLevel | null {
  const visible = records.filter(
    (r) => r.rater !== "student" && r.status === "completed" && r.level
  );
  if (visible.length === 0) return null;
  return visible.some((r) => r.level !== "normal") ? "risk" : "normal";
}

/** สรุปคุณลักษณะฯ แบบนับด้าน — ไม่ใช้ค่าเฉลี่ย เพราะค่าเฉลี่ยกลบด้านที่ไม่ผ่านหรือยังไม่ได้ประเมิน */
export function dcSummaryForParent(dc: DcSummary | undefined, totalCriteria: number) {
  const levels = dc ? Object.values(dc.levels) : [];
  const rated = levels.filter((l) => l != null);
  const notPassed = rated.filter((l) => l === 0).length;

  if (rated.length === 0) return { label: "รอประเมิน", allPassed: false };
  if (rated.length < totalCriteria)
    return { label: `ประเมินแล้ว ${rated.length} จาก ${totalCriteria} ด้าน`, allPassed: false };
  return {
    label: `ผ่าน ${totalCriteria - notPassed} จาก ${totalCriteria} ด้าน`,
    allPassed: notPassed === 0,
  };
}
