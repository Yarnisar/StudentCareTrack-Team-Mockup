/**
 * บัตรประจำตัว (id_cards) และแม่แบบการพิมพ์บัตร
 *
 * - บัตรไม่เคยถูกลบ เมื่อหายหรือเลิกใช้ให้ "เพิกถอน" (status = revoked) แล้วออกใบใหม่
 * - qr_code เป็นรหัสอ้างอิงแบบสุ่ม (opaque) ไม่มีรหัสนักเรียนหรือข้อมูลส่วนตัวอยู่ในรหัส
 *   ต้องแปลงกลับเป็นนักเรียนผ่านการค้นในระบบเท่านั้น
 */

export type IdCardStatus = "active" | "revoked";

export const ID_CARD_STATUS_LABEL: Record<IdCardStatus, string> = {
  active: "ใช้งานได้",
  revoked: "เพิกถอนแล้ว",
};

/** เจ้าของบัตร — คำนวณจากบทบาทของ users ไม่เก็บซ้ำในแถวบัตร */
export type CardOwnerKind = "student" | "staff";

export const CARD_OWNER_LABEL: Record<CardOwnerKind, string> = {
  student: "นักเรียน",
  staff: "บุคลากร",
};

/** id_cards */
export interface IdCard {
  cardId: string;
  /** เจ้าของบัตร (users.user_id — นักเรียนหรือบุคลากร ดู CardOwnerKind) */
  userId: string;
  /** รหัส QR เฉพาะใบ (UNIQUE) — สุ่ม ไม่ผูกกับรหัสนักเรียน */
  qrCode: string;
  status: IdCardStatus;
  issuedAt: string;
  revokedAt: string | null;
  /** เหตุผลการเพิกถอน (บังคับเมื่อ revoked) */
  revokeReason: string | null;
  /** userId ของแอดมินผู้ออกบัตร */
  issuedBy: string;
  /** ปีการศึกษาที่ออกบัตร */
  academicYear: number;
}

/** เหตุผลการเพิกถอนที่ใช้บ่อย (ยังพิมพ์เหตุผลอื่นได้) */
export const REVOKE_REASONS = [
  "บัตรหาย",
  "บัตรชำรุด",
  "ออกบัตรใหม่แทนใบเดิม",
  "นักเรียนย้ายออก / จบการศึกษา",
] as const;

export const STAFF_REVOKE_REASONS = ["บัตรหาย", "บัตรชำรุด", "ออกบัตรใหม่แทนใบเดิม", "พ้นจากตำแหน่ง"] as const;

/** การใช้งาน QR บนบัตร */
export type CardQrUsage = "checkin" | "checkin_behavior";

export const CARD_QR_USAGE_LABEL: Record<CardQrUsage, string> = {
  checkin: "เช็คอินเข้าโรงเรียนเท่านั้น",
  checkin_behavior: "เช็คอินและบันทึกความประพฤติ",
};

/** แม่แบบบัตร — ค่าที่ใช้ตอนแสดงผลและพิมพ์ (ขนาด CR80 85.60 × 53.98 มม.) */
export interface CardTemplateSettings {
  /** ปีการศึกษาที่พิมพ์บนบัตร */
  academicYear: number;
  /** วันหมดอายุที่พิมพ์บนบัตร (พ.ศ. YYYY-MM-DD) */
  expiresOn: string;
  qrUsage: CardQrUsage;
  /** แสดงเลขที่ในห้องบนบัตร */
  showClassNo: boolean;
  /** ข้อความท้ายบัตร เช่น เบอร์ติดต่อเมื่อเก็บบัตรได้ */
  footerNote: string;
  updatedBy: string;
  updatedAt: string;
}
