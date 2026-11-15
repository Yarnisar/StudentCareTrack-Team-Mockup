"use client";

/**
 * เอกสารส่งต่อ (UC11 Scenario D) แสดงเป็นหน้ากระดาษรายงาน และบันทึกเป็น PDF ได้
 * PROTOTYPE: ใช้หน้าต่างพิมพ์ของเบราว์เซอร์ ("บันทึกเป็น PDF") แทนการสร้างไฟล์ฝั่งเซิร์ฟเวอร์
 * Project 2: backend สร้าง PDF จริง ใส่เลขเอกสาร และเก็บฉบับที่ส่งไว้ให้ตรวจย้อนหลัง
 * ผู้ดูแลระบบไม่เห็นเนื้อหาของเอกสารนี้ (3.4.1) หน้านี้จึงใช้เฉพาะฝั่งครูที่รับผิดชอบกรณี
 */

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatThaiDate } from "@/lib/format";
import { CURRENT_TEACHER, CURRENT_TERM, DEMO_TODAY, SCHOOL_NAME } from "@/lib/mock-data";
import { CARE_METHOD_LABEL, CASE_URGENCY_LABEL, type CareCase, type Student } from "@/lib/types";

const PRINT_ID = "referral-print";

/** ซ่อนทุกอย่างยกเว้นหน้ากระดาษตอนพิมพ์ */
const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 14mm; }
  body * { visibility: hidden !important; }
  #${PRINT_ID}, #${PRINT_ID} * { visibility: visible !important; }
  #${PRINT_ID} { position: fixed; inset: 0; width: 100%; margin: 0; border: 0; box-shadow: none; background: #fff; color: #000; }
}`;

/** เปิดหน้าต่างพิมพ์ให้เลือก "บันทึกเป็น PDF" โดยตั้งชื่อไฟล์ให้ตรงกับเอกสาร */
export function saveReferralPdf(fileName: string) {
  const previous = document.title;
  document.title = fileName;
  const restore = () => {
    document.title = previous;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
}

export function ReferralPdfButton({ studentId, caseId }: { studentId: string; caseId: string }) {
  return (
    <Button type="button" variant="outline" onClick={() => saveReferralPdf(`เอกสารส่งต่อ-${studentId}-${caseId}`)}>
      <Download className="size-4" /> ดาวน์โหลด PDF
    </Button>
  );
}

export function ReferralPaper({ careCase, student }: { careCase: CareCase; student: Student }) {
  const followups = [...careCase.followups].sort((a, b) => a.followupDate.localeCompare(b.followupDate));
  const rows: [string, string][] = [
    ["ชื่อ-สกุล", student.fullName],
    ["รหัสนักเรียน", student.studentId],
    ["ชั้น / เลขที่", `${student.roomName} เลขที่ ${student.classNo}`],
    ["รหัสกรณี", careCase.caseId],
    ["เปิดกรณีเมื่อ", formatThaiDate(careCase.openedAt)],
    ["ที่มาของกรณี", careCase.triggerSource],
    ["ความเร่งด่วน", CASE_URGENCY_LABEL[careCase.urgency]],
    ["วิธีการดูแล", careCase.careMethods.map((m) => CARE_METHOD_LABEL[m]).join(", ") || "-"],
    ["เป้าหมาย", careCase.goal || "-"],
  ];

  return (
    <>
      <style>{PRINT_CSS}</style>
      <article
        id={PRINT_ID}
        aria-label="ตัวอย่างเอกสารส่งต่อ"
        className="mx-auto w-full max-w-[640px] rounded-lg border border-border bg-white p-8 text-[13px] leading-relaxed text-neutral-900 shadow-sm"
      >
        <header className="border-b border-neutral-300 pb-4 text-center">
          <div className="text-[12px] text-neutral-600">{SCHOOL_NAME}</div>
          <h2 className="mt-1 text-[17px] font-bold">เอกสารส่งต่อนักเรียนเพื่อรับการช่วยเหลือ</h2>
          <div className="mt-1 text-[12px] text-neutral-600">
            {CURRENT_TERM.label} · ร่างเอกสาร ยังไม่ได้ลงนาม
          </div>
        </header>

        <section className="mt-4">
          <h3 className="mb-1.5 text-[13.5px] font-bold">1. ข้อมูลนักเรียนและกรณี</h3>
          <dl className="divide-y divide-neutral-200 rounded border border-neutral-300">
            {rows.map(([k, v]) => (
              <div key={k} className="flex gap-3 px-3 py-1.5">
                <dt className="w-32 shrink-0 text-neutral-600">{k}</dt>
                <dd className="min-w-0 flex-1">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-4">
          <h3 className="mb-1.5 text-[13.5px] font-bold">2. ประวัติการติดตามช่วยเหลือ ({followups.length} ครั้ง)</h3>
          {followups.length === 0 ? (
            <p className="text-neutral-600">ยังไม่มีบันทึกการติดตาม</p>
          ) : (
            <ol className="space-y-2.5">
              {followups.map((f, i) => (
                <li key={f.followupId} className="rounded border border-neutral-300 px-3 py-2" style={{ breakInside: "avoid" }}>
                  <div className="flex justify-between gap-3 text-[12px] text-neutral-600">
                    <span>ครั้งที่ {i + 1} · {formatThaiDate(f.followupDate)}</span>
                    <span>บันทึกโดย {f.recordedByName}</span>
                  </div>
                  <div className="mt-1">
                    <b>สิ่งที่ดำเนินการ:</b> {f.actionTaken}
                  </div>
                  <div className="mt-0.5">
                    <b>ผลลัพธ์:</b> {f.result}
                  </div>
                </li>
              ))}
            </ol>
          )}
          {careCase.nextFollowupDate && (
            <p className="mt-2 text-neutral-600">นัดติดตามครั้งถัดไป {formatThaiDate(careCase.nextFollowupDate)}</p>
          )}
        </section>

        <section className="mt-8 grid grid-cols-2 gap-6 text-center text-[12.5px]" style={{ breakInside: "avoid" }}>
          <div>
            <div className="h-10 border-b border-dotted border-neutral-500" />
            <div className="mt-1.5">({CURRENT_TEACHER.name})</div>
            <div className="text-neutral-600">ครูที่ปรึกษา ผู้จัดทำ</div>
          </div>
          <div>
            <div className="h-10 border-b border-dotted border-neutral-500" />
            <div className="mt-1.5">(............................................)</div>
            <div className="text-neutral-600">ผู้บริหารสถานศึกษา ผู้อนุมัติ</div>
          </div>
        </section>

        <footer className="mt-6 border-t border-neutral-300 pt-2 text-[11px] text-neutral-500">
          เอกสารลับ ใช้เพื่อการดูแลช่วยเหลือนักเรียนเท่านั้น · จัดทำเมื่อ {formatThaiDate(DEMO_TODAY)} · การลงนามและการส่งต่อหน่วยงานภายนอกเป็นไปตามระเบียบของสถานศึกษา
        </footer>
      </article>
    </>
  );
}
