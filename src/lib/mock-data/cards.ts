/**
 * ข้อมูลตัวอย่าง: บัตรประจำตัวนักเรียน (id_cards) และแม่แบบบัตร
 * ปีการศึกษา 2569 ออกบัตรวันเปิดภาคเรียนที่ 1 (2569-05-18)
 *
 * รหัส QR เป็นสตริงสุ่มที่ไม่มีความหมาย ไม่มีรหัสนักเรียนอยู่ภายใน — ถอดกลับเป็นนักเรียนได้เฉพาะ
 * เมื่อค้นในตาราง id_cards เท่านั้น (ดู lib/store/cards.ts)
 */

import type { CardTemplateSettings, IdCard } from "../types";
import { students, studentUserId, USER } from "./core";

const ISSUED_AT = "2569-05-18T08:30";

/** รหัส QR ที่ seed ไว้ (สุ่มครั้งเดียวแล้วตรึงไว้ เพื่อให้ต้นแบบแสดงผลเหมือนเดิมทุกครั้ง) */
const SEED_TOKENS: Record<string, string> = {
  "30125": "SCTC-4QH7ZK2M9TXB3VRD",
  "30118": "SCTC-P8WY6NC4JGZ2QMKF",
  "30131": "SCTC-R3VD9TQX7KMW2HBN", // ใบที่เพิกถอน (บัตรหาย)
  "30140": "SCTC-M5JK8BZQ3XRT6WVP",
  "30152": "SCTC-T9NX2WGM4KBD7QHR",
  "30160": "SCTC-B6QZ3HRV8MKT5WXJ",
  "30171": "SCTC-W2KM7TQB9XZR4HVN",
};

/** ใบใหม่ของ 30131 หลังแจ้งบัตรหาย */
const REISSUED_TOKEN = "SCTC-H4XT6QKM2WVZ9BRD";

const card = (
  cardId: string,
  studentId: string,
  qrCode: string,
  extra: Partial<IdCard> = {}
): IdCard => ({
  cardId,
  userId: studentUserId(studentId),
  qrCode,
  status: "active",
  issuedAt: ISSUED_AT,
  revokedAt: null,
  revokeReason: null,
  issuedBy: USER.admin,
  academicYear: 2569,
  ...extra,
});

/**
 * สถานะเริ่มต้น: นักเรียน 6 คนมีบัตรใช้งานได้, 30131 มีใบที่เพิกถอน (บัตรหาย) + ใบใหม่,
 * และ 30183 ยังไม่เคยออกบัตร (ใช้สาธิตการออกบัตรให้นักเรียนที่ยังไม่มี)
 */
export const idCards: IdCard[] = [
  card("IDC-001", "30125", SEED_TOKENS["30125"]),
  card("IDC-002", "30118", SEED_TOKENS["30118"]),
  card("IDC-003", "30131", SEED_TOKENS["30131"], {
    status: "revoked",
    revokedAt: "2570-01-12T10:15",
    revokeReason: "บัตรหาย",
  }),
  card("IDC-004", "30140", SEED_TOKENS["30140"]),
  card("IDC-005", "30152", SEED_TOKENS["30152"]),
  card("IDC-006", "30160", SEED_TOKENS["30160"]),
  card("IDC-007", "30171", SEED_TOKENS["30171"]),
  card("IDC-008", "30131", REISSUED_TOKEN, { issuedAt: "2570-01-12T10:20" }),
];

export const initialCardTemplate: CardTemplateSettings = {
  academicYear: 2569,
  expiresOn: "2570-03-31",
  qrUsage: "checkin",
  showClassNo: true,
  footerNote: "พบบัตรนี้โปรดส่งคืนที่ห้องกิจการนักเรียน",
  updatedBy: USER.admin,
  updatedAt: "2569-05-18T08:00",
};

/** รหัส QR ของนักเรียนคนแรกที่มีบัตร ใช้เป็นตัวอย่างในหน้าเช็คอิน */
export const SAMPLE_CARD_TOKEN = SEED_TOKENS[students[0].studentId] ?? SEED_TOKENS["30125"];
