"use client";

import { SCHOOL_NAME } from "@/lib/mock-data";
import { formatThaiDate, initialOf } from "@/lib/format";
import type { CardTemplateSettings, IdCard, Student } from "@/lib/types";
import { QrSvg } from "./qr-svg";
import styles from "./card-print.module.css";

/** เจ้าของบัตรที่ใช้แสดงบนหน้าบัตร: นักเรียน (มีรูป/ห้อง) หรือบุคลากร (ตำแหน่ง + รหัสบุคลากร) */
export type CardOwner =
  | { kind: "student"; student: Student }
  | { kind: "staff"; name: string; role: string; code: string };

/**
 * หน้าบัตรขนาดจริง CR80 (85.60 × 53.98 มม.) ใช้ทั้งพรีวิวบนจอและพิมพ์ ทั้งนักเรียนและบุคลากร
 * QR บนบัตรคือรหัสอ้างอิงแบบสุ่ม (id_cards.qr_code) ไม่มีรหัสนักเรียน/รหัสบุคลากรหรือข้อมูลส่วนตัวอยู่ในรหัส
 */
export function IdCardFace({
  owner,
  card,
  template,
}: {
  owner: CardOwner;
  card: IdCard;
  template: CardTemplateSettings;
}) {
  const revoked = card.status === "revoked";
  const isStaff = owner.kind === "staff";
  const name = isStaff ? owner.name : owner.student.fullName;

  return (
    <div className={revoked ? `${styles.card} ${styles.cardRevoked}` : styles.card}>
      {revoked && <div className={styles.revokedStamp}>เพิกถอนแล้ว</div>}
      <div className={styles.inner}>
        <div className={styles.head}>
          <span className={styles.mark}>SC</span>
          <div>
            <div className={styles.schoolName}>{SCHOOL_NAME}</div>
            <div className={styles.cardKind}>
              {isStaff ? "บัตรประจำตัวบุคลากร" : "บัตรประจำตัวนักเรียน"} · ปีการศึกษา {template.academicYear}
            </div>
          </div>
        </div>

        <div className={styles.body}>
          {!isStaff && <span className={styles.photo}>{initialOf(name)}</span>}
          <div className={styles.fields}>
            <div className={styles.fieldLabel}>{isStaff ? "บุคลากร" : "ชื่อ — นามสกุล"}</div>
            <div className={styles.name}>{name}</div>
            {isStaff ? (
              <>
                <div className={styles.meta}>{owner.role}</div>
                <div className={styles.meta}>รหัสบุคลากร {owner.code}</div>
              </>
            ) : (
              <>
                <div className={styles.meta}>
                  {owner.student.roomName}
                  {template.showClassNo ? ` เลขที่ ${owner.student.classNo}` : ""}
                </div>
                <div className={styles.meta}>รหัสนักเรียน {owner.student.studentId}</div>
              </>
            )}
          </div>
          <div className={styles.qrBox}>
            <QrSvg value={card.qrCode} size={84} title={`รหัส QR ของบัตร ${name}`} />
          </div>
        </div>

        <div className={styles.foot}>
          <span>ใช้ได้ถึง {formatThaiDate(template.expiresOn)}</span>
          <span className={styles.footNote}>{template.footerNote}</span>
        </div>
      </div>
    </div>
  );
}

/** แผ่นพิมพ์: การ์ดหลายใบต่อหน้า A4 — ส่วนอื่นของหน้าจะไม่ถูกพิมพ์ (ดู card-print.module.css) */
export function CardPrintSheet({
  items,
  template,
}: {
  items: { owner: CardOwner; card: IdCard }[];
  template: CardTemplateSettings;
}) {
  return (
    <div className={styles.sheet} data-print-sheet>
      {items.map(({ owner, card }) => (
        <div key={card.cardId} className={styles.sheetItem}>
          <IdCardFace owner={owner} card={card} template={template} />
        </div>
      ))}
    </div>
  );
}
