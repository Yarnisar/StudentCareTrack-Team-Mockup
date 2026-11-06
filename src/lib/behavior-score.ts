/**
 * คะแนนความประพฤติตามค่าตั้งต้นที่แอดมินกำหนด (UC7 Scenario D)
 * - เริ่มที่คะแนนเริ่มต้น แล้วบวกลบตามรายการเรียงตามวันที่เกิดพฤติกรรม
 * - ทุกขั้นคะแนนรวมอยู่ระหว่างคะแนนต่ำสุดถึงเพดาน ชนเพดานแล้วยังเก็บรายการเชิงบวก แต่คะแนนไม่เพิ่ม (UC8 ข้อ 14)
 * - เกณฑ์เฝ้าระวังมีได้หลายระดับ แต่ละระดับมีคะแนนที่เข้าสถานะและผู้ที่ต้องแจ้งเพิ่ม (Scenario D ข้อ 5, FR ข้อ 5)
 * PROTOTYPE: เปลี่ยนค่าแล้วคำนวณใหม่ทั้งหมดทันที รายงานให้มีผลเฉพาะรายการหลังวันเริ่มใช้ (Scenario D ข้อ 11, NFR ข้อ 3)
 */

/** ผู้ที่แจ้งเพิ่มเมื่อเข้าระดับนั้น นอกจากผู้ที่ได้รับแจ้งเสมอ (UC8 Alt-D ข้อ 1) */
export type WatchNotify = "level_head" | "guidance" | "discipline_head" | "executive";

export const WATCH_NOTIFY_ORDER: WatchNotify[] = ["level_head", "guidance", "discipline_head", "executive"];

export const WATCH_NOTIFY_LABEL: Record<WatchNotify, string> = {
  level_head: "หัวหน้าระดับ",
  guidance: "ครูแนะแนว",
  discipline_head: "หัวหน้างานปกครอง",
  executive: "ผู้บริหาร",
};

/** ได้รับแจ้งทุกระดับตาม UC8 Alt-D ข้อ 1 */
export const WATCH_ALWAYS_NOTIFIED = "ครูที่บันทึก ครูที่ปรึกษา นักเรียน และผู้ปกครอง (ในระบบและอีเมล)";

export interface WatchLevel {
  /** เข้าระดับนี้เมื่อคะแนน ≤ ค่านี้ */
  atOrBelow: number;
  notify: WatchNotify[];
}

export interface BehaviorScoreConfig {
  startScore: number;
  /** null = ไม่จำกัดเพดาน */
  ceiling: number | null;
  minScore: number;
  /** เรียงจากเกณฑ์สูงไปต่ำ ระดับ 1 คือเกณฑ์แรกที่ถึง */
  watchLevels: WatchLevel[];
}

/** ค่าตั้งต้น: เริ่ม 100 เพดานเท่าคะแนนเริ่มต้น ต่ำสุด 0 ตามรายงาน ส่วนเกณฑ์เฝ้าระวังเป็นค่าตัวอย่าง ยังไม่ได้ตกลงกับโรงเรียน */
export const DEFAULT_BEHAVIOR_SCORE: BehaviorScoreConfig = {
  startScore: 100,
  ceiling: 100,
  minScore: 0,
  watchLevels: [
    { atOrBelow: 80, notify: [] },
    { atOrBelow: 60, notify: ["level_head", "guidance"] },
  ],
};

export interface ScoreItem {
  delta: number;
  /** วันเวลาที่เกิดพฤติกรรม ใช้เรียงลำดับ */
  at: string;
}

export function clampScore(score: number, cfg: BehaviorScoreConfig): number {
  const capped = cfg.ceiling === null ? score : Math.min(score, cfg.ceiling);
  return Math.max(capped, cfg.minScore);
}

export function runningScore(items: ScoreItem[], cfg: BehaviorScoreConfig): number {
  return [...items]
    .sort((a, b) => a.at.localeCompare(b.at))
    .reduce((score, item) => clampScore(score + item.delta, cfg), cfg.startScore);
}

/** ระดับเฝ้าระวังของคะแนนนี้ 0 = ไม่อยู่ในสถานะเฝ้าระวัง */
export function watchLevelOf(score: number, cfg: BehaviorScoreConfig): number {
  return cfg.watchLevels.filter((l) => score <= l.atOrBelow).length;
}

/** ตรวจค่าตั้งต้นก่อนใช้ คืนข้อความที่ต้องแก้ (ว่าง = ใช้ได้) */
export function validateScoreConfig(cfg: BehaviorScoreConfig): string[] {
  const errors: string[] = [];
  if (cfg.minScore >= cfg.startScore) errors.push("คะแนนต่ำสุดต้องน้อยกว่าคะแนนเริ่มต้น");
  if (cfg.ceiling !== null && cfg.ceiling < cfg.startScore) errors.push("เพดานต้องไม่น้อยกว่าคะแนนเริ่มต้น");
  cfg.watchLevels.forEach((l, i) => {
    if (l.atOrBelow < cfg.minScore || l.atOrBelow >= cfg.startScore)
      errors.push(`เกณฑ์ระดับ ${i + 1} ต้องอยู่ระหว่างคะแนนต่ำสุดถึงต่ำกว่าคะแนนเริ่มต้น`);
    if (i > 0 && l.atOrBelow >= cfg.watchLevels[i - 1].atOrBelow)
      errors.push(`เกณฑ์ระดับ ${i + 1} ต้องต่ำกว่าระดับ ${i}`);
  });
  return errors;
}
