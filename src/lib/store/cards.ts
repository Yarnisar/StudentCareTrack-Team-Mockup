/**
 * Cards slice: บัตรประจำตัวนักเรียน (id_cards) + แม่แบบบัตร
 *
 * กฎจาก CONTEXT.md / data_dictionary.md
 * - ออกบัตรและเพิกถอนบัตรได้เฉพาะแอดมินโรงเรียน
 * - บัตรไม่เคยถูกลบ เมื่อหาย/ชำรุดให้เพิกถอน (status = revoked + เหตุผล) แล้วออกใบใหม่
 * - นักเรียน 1 คนมีบัตรที่ใช้งานได้ได้ใบเดียว
 * - qr_code เป็นรหัสอ้างอิงแบบสุ่ม ไม่มีรหัสนักเรียนอยู่ในรหัส — แปลงกลับผ่าน cardByToken เท่านั้น
 * - ทุกการเปลี่ยนแปลงเขียน audit log
 */

import { useMemo, useState } from "react";
import { idCards as seedCards, initialCardTemplate } from "../mock-data";
import { nowThaiIso } from "../format";
import * as perm from "../permissions";
import type { CardOwnerKind, CardTemplateSettings, IdCard, IdCardStatus, Student, User } from "../types";
import type { PlatformSlice } from "./platform";
import { nextId } from "./ids";

export type CardResult = { ok: true; card: IdCard } | { ok: false; error: string };

export type CardTemplatePatch = Partial<Omit<CardTemplateSettings, "updatedBy" | "updatedAt">>;

/** ผลการแปลงรหัส QR เป็นนักเรียน (ใช้โดยหน้าเช็คอิน) */
export type CardLookup =
  | { ok: true; card: IdCard; student: Student }
  | { ok: false; error: string; card?: IdCard; kind: "not_a_card" | "invalid" };

/** สถานะบัตรที่แสดงผล — "expired" = ยังไม่เพิกถอน แต่ไม่ใช่ปีการศึกษาปัจจุบันหรือเลยวันหมดอายุ */
export type CardDisplayStatus = IdCardStatus | "expired" | "none";

export interface CardsSlice {
  /** บัตรทั้งหมด ใหม่สุดก่อน (รวมใบที่เพิกถอนแล้ว) */
  idCards: IdCard[];
  cardTemplate: CardTemplateSettings;

  /** ประเภทเจ้าของบัตร คำนวณจากบทบาทของผู้ใช้ (ไม่ใช่นักเรียน/ผู้ปกครอง = บุคลากร) */
  cardOwnerKind: (userId: string) => CardOwnerKind;
  /** บัญชีบุคลากรทั้งหมด (ครูประจำชั้น ครูทั่วไป แอดมิน) ที่ใช้งานอยู่ */
  staffAccounts: User[];
  /** บัตรทุกใบของเจ้าของบัตร (ผู้ใช้) ใหม่สุดก่อน */
  cardsOfUser: (userId: string) => IdCard[];
  activeCardOfUser: (userId: string) => IdCard | undefined;
  cardStatusOfUser: (userId: string) => CardDisplayStatus;
  issueCardToUser: (userId: string) => CardResult;
  reissueCardToUser: (userId: string, reason: string) => CardResult;

  /** บัตรทุกใบของนักเรียน ใหม่สุดก่อน */
  cardsOfStudent: (studentId: string) => IdCard[];
  /** บัตรใบนี้หมดอายุหรือไม่ (ปีการศึกษาไม่ตรงภาคเรียนปัจจุบัน หรือเลยวันหมดอายุบนบัตร) */
  isCardExpired: (card: IdCard) => boolean;
  /** รหัสบัตรที่แผงสาธิตจำลองให้หมดอายุ (ไม่เปลี่ยนข้อมูลบัตรจริง) */
  simulatedExpiredCardIds: string[];
  /** สำหรับแผงสาธิต: จำลองให้บัตรใบนี้หมดอายุ/ยกเลิกการจำลอง (แอดมินเท่านั้น, เขียน audit) */
  setCardSimulatedExpiry: (cardId: string, expired: boolean) => { ok: true } | { ok: false; error: string };
  /** บัตรที่ใช้งานได้ของนักเรียน (ไม่มี = ยังไม่ได้ออกบัตร เพิกถอนหมด หรือหมดอายุ) */
  activeCardOfStudent: (studentId: string) => IdCard | undefined;
  /** สถานะบัตรของนักเรียนสำหรับแสดงผล */
  cardStatusOfStudent: (studentId: string) => CardDisplayStatus;
  /** นักเรียนที่กำลังศึกษาและยังไม่มีบัตรที่ใช้งานได้ */
  studentsWithoutCard: Student[];

  /** ค้นบัตรจากรหัส QR (รหัสเป็นรหัสอ้างอิงแบบสุ่ม จึงต้องค้นในระบบเสมอ) */
  cardByToken: (token: string) => IdCard | undefined;
  /** แปลงรหัส QR เป็นนักเรียน พร้อมเหตุผลเมื่อใช้ไม่ได้ */
  resolveCardToken: (token: string) => CardLookup;

  /** แอดมินออกบัตรใหม่ให้นักเรียน (ต้องไม่มีใบที่ใช้งานได้อยู่) */
  issueCard: (studentId: string) => CardResult;
  /** เพิกถอนบัตรพร้อมเหตุผล (ไม่มีการลบ) */
  revokeCard: (cardId: string, reason: string) => CardResult;
  /** เพิกถอนใบเดิมแล้วออกใบใหม่ในขั้นตอนเดียว (บัตรหาย/ชำรุด) */
  reissueCard: (studentId: string, reason: string) => CardResult;

  updateCardTemplate: (patch: CardTemplatePatch) => { ok: true } | { ok: false; error: string };
}

/** อักขระที่ใช้ในรหัส QR — ตัด 0/O/1/I ออกเพื่อให้ครูอ่านและพิมพ์แทนได้ */
const TOKEN_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** รหัสอ้างอิงแบบสุ่ม ไม่ผูกกับรหัสนักเรียน (ต้นแบบใช้ Math.random — ของจริงใช้ตัวสุ่มเชิงรหัสลับ) */
function randomToken(): string {
  let out = "";
  for (let i = 0; i < 16; i++)
    out += TOKEN_ALPHABET[Math.floor(Math.random() * TOKEN_ALPHABET.length)];
  return `SCTC-${out}`;
}

export function useCardsSlice(base: PlatformSlice): CardsSlice {
  const [idCards, setIdCards] = useState<IdCard[]>(seedCards);
  const [cardTemplate, setCardTemplate] = useState<CardTemplateSettings>(initialCardTemplate);
  const [simulatedExpired, setSimulatedExpired] = useState<string[]>([]);

  return useMemo<CardsSlice>(() => {
    const sorted = [...idCards].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
    const userIdOf = (studentId: string) =>
      base.users.find((u) => u.role === "student" && u.refId === studentId)?.userId;

    const cardsOfUser: CardsSlice["cardsOfUser"] = (userId) => sorted.filter((c) => c.userId === userId);
    const cardOwnerKind: CardsSlice["cardOwnerKind"] = (userId) =>
      base.getUser(userId)?.role === "student" ? "student" : "staff";
    const staffAccounts = base.users.filter((u) => perm.isStaff(u) && u.isActive);

    const cardsOfStudent: CardsSlice["cardsOfStudent"] = (studentId) => {
      const userId = userIdOf(studentId);
      return userId ? cardsOfUser(userId) : [];
    };

    const isCardExpired: CardsSlice["isCardExpired"] = (card) =>
      simulatedExpired.includes(card.cardId) ||
      card.academicYear !== base.currentTerm.academicYear ||
      nowThaiIso().slice(0, 10) > cardTemplate.expiresOn;

    const activeCardOfUser: CardsSlice["activeCardOfUser"] = (userId) =>
      cardsOfUser(userId).find((c) => c.status === "active" && !isCardExpired(c));

    const cardStatusOfUser: CardsSlice["cardStatusOfUser"] = (userId) => {
      const all = cardsOfUser(userId);
      if (all.some((c) => c.status === "active" && !isCardExpired(c))) return "active";
      if (all.some((c) => c.status === "active")) return "expired";
      return all.length > 0 ? "revoked" : "none";
    };

    const activeCardOfStudent: CardsSlice["activeCardOfStudent"] = (studentId) => {
      const userId = userIdOf(studentId);
      return userId ? activeCardOfUser(userId) : undefined;
    };

    const cardStatusOfStudent: CardsSlice["cardStatusOfStudent"] = (studentId) => {
      const userId = userIdOf(studentId);
      return userId ? cardStatusOfUser(userId) : "none";
    };

    const cardByToken: CardsSlice["cardByToken"] = (token) => {
      const key = token.trim().toUpperCase();
      return key ? idCards.find((c) => c.qrCode.toUpperCase() === key) : undefined;
    };

    const studentOfCard = (cardOwner: IdCard) => {
      const user = base.getUser(cardOwner.userId);
      return user?.role === "student" && user.refId ? base.getStudent(user.refId) : undefined;
    };

    const resolveCardToken: CardsSlice["resolveCardToken"] = (token) => {
      const found = cardByToken(token);
      if (!found) return { ok: false, kind: "not_a_card", error: "ไม่พบบัตรที่ตรงกับรหัส QR นี้" };
      if (cardOwnerKind(found.userId) === "staff")
        return { ok: false, kind: "invalid", error: "บัตรบุคลากร ใช้เช็กชื่อนักเรียนไม่ได้", card: found };
      if (found.status === "revoked")
        return {
          ok: false,
          kind: "invalid",
          error: `บัตรใบนี้ถูกเพิกถอนแล้ว${found.revokeReason ? ` (${found.revokeReason})` : ""} — ให้ติดต่อแอดมินเพื่อออกบัตรใหม่`,
          card: found,
        };
      if (isCardExpired(found))
        return {
          ok: false,
          kind: "invalid",
          error: "บัตรหมดอายุ — ให้ติดต่อแอดมินเพื่อออกบัตรใหม่ ระหว่างนี้ให้ครูบันทึกการมาเรียนด้วยตนเอง",
          card: found,
        };
      const student = studentOfCard(found);
      if (!student)
        return { ok: false, kind: "invalid", error: "บัตรใบนี้ไม่ได้ผูกกับนักเรียนในระบบ", card: found };
      return { ok: true, card: found, student };
    };

    const adminOnly = (): string | null =>
      perm.isAdmin(base.currentUser) ? null : "ออกบัตรและเพิกถอนบัตรได้เฉพาะแอดมินโรงเรียน";

    const createCard = (userId: string): CardResult => {
      const owner = base.getUser(userId);
      if (!owner) return { ok: false, error: "ไม่พบผู้ใช้คนนี้" };
      const kind = cardOwnerKind(userId);
      if (kind === "student") {
        const student = owner.refId ? base.getStudent(owner.refId) : undefined;
        if (!student) return { ok: false, error: "ไม่พบนักเรียนคนนี้" };
        if (student.status !== "studying")
          return { ok: false, error: "ออกบัตรได้เฉพาะนักเรียนที่กำลังศึกษา" };
      } else if (!perm.isStaff(owner) || !owner.isActive) {
        return { ok: false, error: "ออกบัตรได้เฉพาะบุคลากรที่ใช้งานอยู่" };
      }

      let qrCode = randomToken();
      while (idCards.some((c) => c.qrCode === qrCode)) qrCode = randomToken();

      const card: IdCard = {
        cardId: nextId("IDC"),
        userId,
        qrCode,
        status: "active",
        issuedAt: nowThaiIso(),
        revokedAt: null,
        revokeReason: null,
        issuedBy: base.currentUser.userId,
        academicYear: base.currentTerm.academicYear,
      };
      setIdCards((prev) => [...prev, card]);
      // ไม่เก็บรหัส QR ลง audit log (เป็นรหัสที่ใช้ยืนยันตัวตนได้)
      base.logAudit("CREATE", "id_cards", card.cardId, {
        after: { ownerKind: kind, userId, academicYear: card.academicYear },
      });
      return { ok: true, card };
    };

    const issueCardToUser: CardsSlice["issueCardToUser"] = (userId) => {
      const denied = adminOnly();
      if (denied) return { ok: false, error: denied };
      if (activeCardOfUser(userId))
        return { ok: false, error: "มีบัตรที่ใช้งานได้อยู่แล้ว — ให้เพิกถอนใบเดิมก่อน" };
      return createCard(userId);
    };

    const issueCard: CardsSlice["issueCard"] = (studentId) => {
      const userId = userIdOf(studentId);
      return userId ? issueCardToUser(userId) : { ok: false, error: "นักเรียนคนนี้ยังไม่มีบัญชีผู้ใช้ในระบบ" };
    };

    const revoke = (cardId: string, reason: string): CardResult => {
      const target = idCards.find((c) => c.cardId === cardId);
      if (!target) return { ok: false, error: "ไม่พบบัตรใบนี้" };
      if (target.status === "revoked") return { ok: false, error: "บัตรใบนี้ถูกเพิกถอนไปแล้ว" };
      const trimmed = reason.trim();
      if (!trimmed) return { ok: false, error: "ต้องระบุเหตุผลการเพิกถอน" };

      const revoked: IdCard = {
        ...target,
        status: "revoked",
        revokedAt: nowThaiIso(),
        revokeReason: trimmed,
      };
      setIdCards((prev) => prev.map((c) => (c.cardId === cardId ? revoked : c)));
      base.logAudit("VOID", "id_cards", cardId, {
        before: { status: target.status },
        after: { status: "revoked" },
        reason: trimmed,
      });
      return { ok: true, card: revoked };
    };

    const revokeCard: CardsSlice["revokeCard"] = (cardId, reason) => {
      const denied = adminOnly();
      if (denied) return { ok: false, error: denied };
      return revoke(cardId, reason);
    };

    const reissueCardToUser: CardsSlice["reissueCardToUser"] = (userId, reason) => {
      const denied = adminOnly();
      if (denied) return { ok: false, error: denied };
      const current = activeCardOfUser(userId);
      if (current) {
        const result = revoke(current.cardId, reason);
        if (!result.ok) return result;
      }
      return createCard(userId);
    };

    const reissueCard: CardsSlice["reissueCard"] = (studentId, reason) => {
      const userId = userIdOf(studentId);
      return userId
        ? reissueCardToUser(userId, reason)
        : { ok: false, error: "นักเรียนคนนี้ยังไม่มีบัญชีผู้ใช้ในระบบ" };
    };

    const updateCardTemplate: CardsSlice["updateCardTemplate"] = (patch) => {
      if (!perm.isAdmin(base.currentUser))
        return { ok: false, error: "แก้ไขแม่แบบบัตรได้เฉพาะแอดมินโรงเรียน" };
      const before = cardTemplate;
      const after: CardTemplateSettings = {
        ...before,
        ...patch,
        updatedBy: base.currentUser.userId,
        updatedAt: nowThaiIso(),
      };
      setCardTemplate(after);
      base.logAudit("UPDATE", "card_template_settings", "card-template", { before, after });
      return { ok: true };
    };

    const setCardSimulatedExpiry: CardsSlice["setCardSimulatedExpiry"] = (cardId, expired) => {
      const denied = adminOnly();
      if (denied) return { ok: false, error: denied };
      if (!idCards.some((c) => c.cardId === cardId)) return { ok: false, error: "ไม่พบบัตรใบนี้" };
      const was = simulatedExpired.includes(cardId);
      if (was === expired) return { ok: true };
      setSimulatedExpired((prev) => (expired ? [...prev, cardId] : prev.filter((id) => id !== cardId)));
      base.logAudit("UPDATE", "id_cards", cardId, {
        before: { simulatedExpired: was },
        after: { simulatedExpired: expired },
        reason: "จำลองจากแผงสาธิต (ไม่เปลี่ยนข้อมูลบัตรจริง)",
      });
      return { ok: true };
    };

    const studentsWithoutCard = base.students.filter(
      (s) => s.status === "studying" && !activeCardOfStudent(s.studentId)
    );

    return {
      idCards: sorted,
      cardTemplate,
      cardOwnerKind,
      staffAccounts,
      cardsOfUser,
      activeCardOfUser,
      cardStatusOfUser,
      issueCardToUser,
      reissueCardToUser,
      cardsOfStudent,
      isCardExpired,
      simulatedExpiredCardIds: simulatedExpired,
      setCardSimulatedExpiry,
      activeCardOfStudent,
      cardStatusOfStudent,
      studentsWithoutCard,
      cardByToken,
      resolveCardToken,
      issueCard,
      revokeCard,
      reissueCard,
      updateCardTemplate,
    };
  }, [base, idCards, cardTemplate, simulatedExpired]);
}
