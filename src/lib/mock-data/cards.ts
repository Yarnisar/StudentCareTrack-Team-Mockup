/**
 * ข้อมูลตัวอย่าง: บัตรประจำตัวนักเรียน (id_cards) และแม่แบบบัตร
 * ปีการศึกษา 2569 ออกบัตรวันเปิดภาคเรียนที่ 1 (2569-05-18)
 *
 * รหัส QR เป็นสตริงสุ่มที่ไม่มีความหมาย ไม่มีรหัสนักเรียนอยู่ภายใน — ถอดกลับเป็นนักเรียนได้เฉพาะ
 * เมื่อค้นในตาราง id_cards เท่านั้น (ดู lib/store/cards.ts)
 */

import type { CardTemplateSettings, IdCard } from "../types";
import { generatedRoster, students, studentUserId, USER, users } from "./core";
import { hashText, Rng } from "./prng";

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
const baseIdCards: IdCard[] = [
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

/**
 * นักเรียนที่สร้างเพิ่ม: ส่วนใหญ่มีบัตรใช้งานได้ ออกวันเดียวกับ 8 คนแรก
 * 1 คนบัตรชำรุดแล้วออกใบใหม่ และ 1 คนยังไม่เคยออกบัตร
 */
const QR_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const cardRng = new Rng(hashText("sct-class-38:cards"));
const usedTokens = new Set<string>([...Object.values(SEED_TOKENS), REISSUED_TOKEN]);
const newToken = (): string => {
  let token = "";
  do {
    token = "SCTC-" + Array.from({ length: 16 }, () => QR_ALPHABET[cardRng.int(0, QR_ALPHABET.length - 1)]).join("");
  } while (usedTokens.has(token));
  usedTokens.add(token);
  return token;
};
let cardSeq = baseIdCards.length;
const generatedCards: IdCard[] = generatedRoster.profiles.flatMap((p) => {
  if (p.card === "none") return [];
  const first = card(`IDC-${String(++cardSeq).padStart(3, "0")}`, p.studentId, newToken());
  if (p.card === "active") return [first];
  return [
    { ...first, status: "revoked" as const, revokedAt: "2569-11-20T09:40", revokeReason: "บัตรชำรุด" },
    card(`IDC-${String(++cardSeq).padStart(3, "0")}`, p.studentId, newToken(), { issuedAt: "2569-11-20T09:45" }),
  ];
});

/**
 * บัตรบุคลากร: ทุกบัญชีบุคลากร (ครู + แอดมิน) มีบัตรใช้งานได้ ยกเว้น U-T13 ยังไม่มีบัตร (สาธิตการออกบัตร)
 * และ U-T05 บัตรชำรุดแล้วออกใบใหม่ — สร้างต่อท้ายนักเรียนเพื่อไม่ให้รหัสของนักเรียนเปลี่ยน
 */
const STAFF_ROLES = ["admin_school", "teacher_homeroom", "teacher_general"];
const staffUsers = users.filter((u) => STAFF_ROLES.includes(u.role));
let staffSeq = 0;
const staffCard = (userId: string, extra: Partial<IdCard> = {}): IdCard => ({
  cardId: `IDC-S${String(++staffSeq).padStart(2, "0")}`,
  userId,
  qrCode: newToken(),
  status: "active",
  issuedAt: ISSUED_AT,
  revokedAt: null,
  revokeReason: null,
  issuedBy: USER.admin,
  academicYear: 2569,
  ...extra,
});
const staffCards: IdCard[] = staffUsers.flatMap((u) => {
  if (u.userId === USER.kamol) return [];
  if (u.userId !== USER.wimon) return [staffCard(u.userId)];
  return [
    staffCard(u.userId, { status: "revoked", revokedAt: "2569-12-02T13:10", revokeReason: "บัตรชำรุด" }),
    staffCard(u.userId, { issuedAt: "2569-12-02T13:15" }),
  ];
});

export const idCards: IdCard[] = [...baseIdCards, ...generatedCards, ...staffCards];

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
