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
import type { CardTemplateSettings, IdCard, IdCardStatus, Student } from "../types";
import type { PlatformSlice } from "./platform";
import { nextId } from "./ids";

export type CardResult = { ok: true; card: IdCard } | { ok: false; error: string };

export type CardTemplatePatch = Partial<Omit<CardTemplateSettings, "updatedBy" | "updatedAt">>;

/** ผลการแปลงรหัส QR เป็นนักเรียน (ใช้โดยหน้าเช็คอิน) */
export type CardLookup =
  | { ok: true; card: IdCard; student: Student }
  | { ok: false; error: string; card?: IdCard };

export interface CardsSlice {
  /** บัตรทั้งหมด ใหม่สุดก่อน (รวมใบที่เพิกถอนแล้ว) */
  idCards: IdCard[];
  cardTemplate: CardTemplateSettings;

  /** บัตรทุกใบของนักเรียน ใหม่สุดก่อน */
  cardsOfStudent: (studentId: string) => IdCard[];
  /** บัตรที่ใช้งานได้ของนักเรียน (ไม่มี = ยังไม่ได้ออกบัตร หรือเพิกถอนหมดแล้ว) */
  activeCardOfStudent: (studentId: string) => IdCard | undefined;
  /** สถานะบัตรของนักเรียนสำหรับแสดงผล */
  cardStatusOfStudent: (studentId: string) => IdCardStatus | "none";
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

  return useMemo<CardsSlice>(() => {
    const sorted = [...idCards].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
    const userIdOf = (studentId: string) =>
      base.users.find((u) => u.role === "student" && u.refId === studentId)?.userId;

    const cardsOfStudent: CardsSlice["cardsOfStudent"] = (studentId) => {
      const userId = userIdOf(studentId);
      return userId ? sorted.filter((c) => c.userId === userId) : [];
    };

    const activeCardOfStudent: CardsSlice["activeCardOfStudent"] = (studentId) =>
      cardsOfStudent(studentId).find((c) => c.status === "active");

    const cardStatusOfStudent: CardsSlice["cardStatusOfStudent"] = (studentId) => {
      const all = cardsOfStudent(studentId);
      if (all.some((c) => c.status === "active")) return "active";
      return all.length > 0 ? "revoked" : "none";
    };

    const cardByToken: CardsSlice["cardByToken"] = (token) => {
      const key = token.trim().toUpperCase();
      return key ? idCards.find((c) => c.qrCode.toUpperCase() === key) : undefined;
    };

    const studentOfCard = (cardOwner: IdCard) => {
      const user = base.getUser(cardOwner.userId);
      return user?.refId ? base.getStudent(user.refId) : undefined;
    };

    const resolveCardToken: CardsSlice["resolveCardToken"] = (token) => {
      const found = cardByToken(token);
      if (!found) return { ok: false, error: "ไม่พบบัตรที่ตรงกับรหัส QR นี้" };
      if (found.status === "revoked")
        return {
          ok: false,
          error: `บัตรใบนี้ถูกเพิกถอนแล้ว${found.revokeReason ? ` (${found.revokeReason})` : ""} — ให้ติดต่อแอดมินเพื่อออกบัตรใหม่`,
          card: found,
        };
      const student = studentOfCard(found);
      if (!student) return { ok: false, error: "บัตรใบนี้ไม่ได้ผูกกับนักเรียนในระบบ", card: found };
      return { ok: true, card: found, student };
    };

    const adminOnly = (): string | null =>
      perm.isAdmin(base.currentUser) ? null : "ออกบัตรและเพิกถอนบัตรได้เฉพาะแอดมินโรงเรียน";

    const createCard = (studentId: string): CardResult => {
      const student = base.getStudent(studentId);
      if (!student) return { ok: false, error: "ไม่พบนักเรียนคนนี้" };
      if (student.status !== "studying")
        return { ok: false, error: "ออกบัตรได้เฉพาะนักเรียนที่กำลังศึกษา" };
      const userId = userIdOf(studentId);
      if (!userId) return { ok: false, error: "นักเรียนคนนี้ยังไม่มีบัญชีผู้ใช้ในระบบ" };

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
        after: { studentId, academicYear: card.academicYear },
      });
      return { ok: true, card };
    };

    const issueCard: CardsSlice["issueCard"] = (studentId) => {
      const denied = adminOnly();
      if (denied) return { ok: false, error: denied };
      if (activeCardOfStudent(studentId))
        return { ok: false, error: "นักเรียนคนนี้มีบัตรที่ใช้งานได้อยู่แล้ว — ให้เพิกถอนใบเดิมก่อน" };
      return createCard(studentId);
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

    const reissueCard: CardsSlice["reissueCard"] = (studentId, reason) => {
      const denied = adminOnly();
      if (denied) return { ok: false, error: denied };
      const current = activeCardOfStudent(studentId);
      if (current) {
        const result = revoke(current.cardId, reason);
        if (!result.ok) return result;
      }
      return createCard(studentId);
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

    const studentsWithoutCard = base.students.filter(
      (s) => s.status === "studying" && !activeCardOfStudent(s.studentId)
    );

    return {
      idCards: sorted,
      cardTemplate,
      cardsOfStudent,
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
  }, [base, idCards, cardTemplate]);
}
