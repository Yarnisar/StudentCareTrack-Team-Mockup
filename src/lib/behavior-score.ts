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
  /** บันทึกย้อนหลังได้ไม่เกินกี่วัน (UC8 ข้อ 6, Alt-B) */
  backdateDays: number;
  /** ผู้บันทึกแก้ไขหรือยกเลิกได้ภายในกี่วันหลังบันทึก (UC8 สถานการณ์ B, Alt-E) */
  editDays: number;
  /** ครูที่ปรึกษาต้องยืนยันถอนสถานะภายในกี่วันหลังคะแนนกลับเข้าเกณฑ์ เลยแล้วเตือนซ้ำและแจ้งแอดมิน (UC8 Alt-F) */
  withdrawalWaitDays: number;
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
  // PROTOTYPE: ค่าตัวอย่าง ยังไม่ได้ตกลงกับโรงเรียน
  backdateDays: 7,
  editDays: 3,
  withdrawalWaitDays: 7,
};

export interface ScoreItem {
  delta: number;
  /** วันเวลาที่เกิดพฤติกรรม ใช้เรียงลำดับ */
  at: string;
}

/** ห่างเกณฑ์เฝ้าระวังระดับ 1 ไม่เกินกี่คะแนนถือว่า "ใกล้เกณฑ์" — PROTOTYPE: เพิ่มเอง ไม่อยู่ในรายงาน ค่าตัวอย่างรอทีมยืนยัน */
export const NEAR_WATCH_POINTS = 10;

/**
 * ค่าตั้งต้นที่ใช้คิดคะแนน: ค่าเดียว หรือฟังก์ชันที่ให้ค่าที่มีผล ณ วันที่ของแต่ละรายการ
 * ค่าที่แอดมินเปลี่ยนจึงมีผลกับพฤติกรรมที่เกิดตั้งแต่วันเริ่มใช้เป็นต้นไปเท่านั้น (UC7 Scenario D ข้อ 9)
 * วันที่ว่าง ("") = ค่าที่ใช้อยู่ตอนนี้
 */
export type ScoreConfigSource = BehaviorScoreConfig | ((at: string) => BehaviorScoreConfig);
const cfgAt = (src: ScoreConfigSource, at: string) => (typeof src === "function" ? src(at) : src);

export function clampScore(score: number, cfg: BehaviorScoreConfig): number {
  const capped = cfg.ceiling === null ? score : Math.min(score, cfg.ceiling);
  return Math.max(capped, cfg.minScore);
}

/**
 * วันเวลาของรายการที่ทำให้คะแนนกลับขึ้นพ้นเกณฑ์ระดับ 1 ล่าสุด ใช้นับระยะเวลารอยืนยันถอนสถานะ (UC8 Alt-F)
 * คะแนนยังอยู่ในเกณฑ์ หรือไม่เคยเข้าเกณฑ์ = null
 */
export function lastRecoveryAt(items: ScoreItem[], src: ScoreConfigSource): string | null {
  const sorted = [...items].sort((a, b) => a.at.localeCompare(b.at));
  let score = cfgAt(src, sorted[0]?.at ?? "").startScore;
  let at: string | null = null;
  for (const item of sorted) {
    const cfg = cfgAt(src, item.at);
    const first = cfg.watchLevels[0]?.atOrBelow;
    if (first === undefined) return null;
    const before = score;
    score = clampScore(score + item.delta, cfg);
    if (before <= first && score > first) at = item.at;
    else if (score <= first) at = null;
  }
  return at;
}

export function runningScore(items: ScoreItem[], src: ScoreConfigSource): number {
  const sorted = [...items].sort((a, b) => a.at.localeCompare(b.at));
  return sorted.reduce((score, item) => clampScore(score + item.delta, cfgAt(src, item.at)), cfgAt(src, sorted[0]?.at ?? "").startScore);
}

/**
 * ระดับเฝ้าระวังสูงสุดที่เคยถึงหลังเวลา since (ไม่รวม) ไล่คะแนนตามลำดับวันที่
 * ใช้คงสถานะไว้จนครูที่ปรึกษายืนยันถอน (UC8 Scenario C, Alt-F: ไม่ถอนสถานะอัตโนมัติ)
 */
export function peakWatchLevel(items: ScoreItem[], src: ScoreConfigSource, since: string): number {
  const sorted = [...items].sort((a, b) => a.at.localeCompare(b.at));
  let score = cfgAt(src, sorted[0]?.at ?? "").startScore;
  let peak = 0;
  for (const item of sorted) {
    const cfg = cfgAt(src, item.at);
    score = clampScore(score + item.delta, cfg);
    if (item.at > since) peak = Math.max(peak, watchLevelOf(score, cfg));
  }
  return peak;
}

/** ระดับเฝ้าระวังของคะแนนนี้ 0 = ไม่อยู่ในสถานะเฝ้าระวัง */
export function watchLevelOf(score: number, cfg: BehaviorScoreConfig): number {
  return cfg.watchLevels.filter((l) => score <= l.atOrBelow).length;
}

/** ตรวจค่าตั้งต้นก่อนใช้ คืนข้อความที่ต้องแก้ (ว่าง = ใช้ได้) */
export function validateScoreConfig(cfg: BehaviorScoreConfig): string[] {
  const errors: string[] = [];
  if (cfg.minScore >= cfg.startScore) errors.push("คะแนนต่ำสุดต้องน้อยกว่าคะแนนเริ่มต้น");
  if (cfg.backdateDays < 0) errors.push("ระยะบันทึกย้อนหลังต้องไม่ติดลบ");
  if (cfg.editDays < 0) errors.push("ระยะเวลาแก้ไขต้องไม่ติดลบ");
  if (cfg.withdrawalWaitDays < 1) errors.push("ระยะเวลารอยืนยันถอนสถานะต้องอย่างน้อย 1 วัน");
  if (cfg.ceiling !== null && cfg.ceiling < cfg.startScore) errors.push("เพดานต้องไม่น้อยกว่าคะแนนเริ่มต้น");
  cfg.watchLevels.forEach((l, i) => {
    if (l.atOrBelow < cfg.minScore || l.atOrBelow >= cfg.startScore)
      errors.push(`เกณฑ์ระดับ ${i + 1} ต้องอยู่ระหว่างคะแนนต่ำสุดถึงต่ำกว่าคะแนนเริ่มต้น`);
    if (i > 0 && l.atOrBelow >= cfg.watchLevels[i - 1].atOrBelow)
      errors.push(`เกณฑ์ระดับ ${i + 1} ต้องต่ำกว่าระดับ ${i}`);
  });
  return errors;
}
