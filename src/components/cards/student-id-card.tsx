"use client";

import { SCHOOL_NAME } from "@/lib/mock-data";
import { formatThaiDate, initialOf } from "@/lib/format";
import type { CardTemplateSettings, IdCard, Student } from "@/lib/types";
import { QrSvg } from "./qr-svg";
import styles from "./card-print.module.css";

/**
 * หน้าบัตรนักเรียนขนาดจริง CR80 (85.60 × 53.98 มม.) ใช้ทั้งพรีวิวบนจอและพิมพ์
 * QR บนบัตรคือรหัสอ้างอิงแบบสุ่ม (id_cards.qr_code) ไม่มีรหัสนักเรียนหรือข้อมูลส่วนตัวอยู่ในรหัส
 */
export function StudentIdCard({
  student,
  card,
  template,
}: {
  student: Student;
  card: IdCard;
  template: CardTemplateSettings;
}) {
  const revoked = card.status === "revoked";

  return (
    <div className={revoked ? `${styles.card} ${styles.cardRevoked}` : styles.card}>
      {revoked && <div className={styles.revokedStamp}>เพิกถอนแล้ว</div>}
      <div className={styles.inner}>
        <div className={styles.head}>
          <span className={styles.mark}>SC</span>
          <div>
            <div className={styles.schoolName}>{SCHOOL_NAME}</div>
            <div className={styles.cardKind}>บัตรประจำตัวนักเรียน · ปีการศึกษา {template.academicYear}</div>
          </div>
        </div>

        <div className={styles.body}>
          <span className={styles.photo}>{initialOf(student.fullName)}</span>
          <div className={styles.fields}>
            <div className={styles.fieldLabel}>ชื่อ — นามสกุล</div>
            <div className={styles.name}>{student.fullName}</div>
            <div className={styles.meta}>
              {student.roomName}
              {template.showClassNo ? ` เลขที่ ${student.classNo}` : ""}
            </div>
            <div className={styles.meta}>รหัสนักเรียน {student.studentId}</div>
          </div>
          <div className={styles.qrBox}>
            <QrSvg value={card.qrCode} size={84} title={`รหัส QR ของบัตร ${student.fullName}`} />
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
  items: { student: Student; card: IdCard }[];
  template: CardTemplateSettings;
}) {
  return (
    <div className={styles.sheet}>
      {items.map(({ student, card }) => (
        <div key={card.cardId} className={styles.sheetItem}>
          <StudentIdCard student={student} card={card} template={template} />
        </div>
      ))}
    </div>
  );
}
