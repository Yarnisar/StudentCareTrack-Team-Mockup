"use client";

/**
 * จัดทำเอกสารประเมินผลทางการศึกษา ปพ.3–7 (UC15)
 * - สถานการณ์ A: เลือกประเภทและนักเรียน ระบบตรวจความครบถ้วนรายคน แยกคนที่ข้อมูลไม่ครบไว้ทำภายหลัง
 *   ดูตัวอย่างแล้วยืนยัน ระบบสร้างไฟล์และเก็บฉบับเดิมไว้ ผลที่ได้เป็นร่างเอกสาร การลงนามอยู่นอกระบบ (ข้อ 12)
 * - สถานการณ์ B: ครูขอ ปพ.7 แอดมินจัดทำแล้วส่งกลับ
 * - สถานการณ์ C: ประวัติการจัดทำ กรองตามประเภทได้
 * - UC11 Scenario D: แอดมินจัดการสถานะเอกสารส่งต่อ เห็นเฉพาะเลขเอกสาร ผู้ส่ง วันที่ ไม่เห็นชื่อนักเรียนหรือเนื้อหา
 * PROTOTYPE: ยังไม่สร้าง PDF จริง ยังไม่มีการตั้งค่ารูปแบบเอกสาร (สถานการณ์ D) และผลการเรียนจาก Team A ถือว่าปิดภาคแล้ว
 */

import { useState } from "react";
import { Check, Download, FileText, Info, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { downloadCsv } from "@/lib/csv";
import { formatThaiDate } from "@/lib/format";
import { CURRENT_TERM, subjectSubmissions } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { REFERRAL_STATUS_LABEL, REGISTRY_FIELD_LABEL, type DcSummary, type DocumentType, type ReferralStatus, type Student } from "@/lib/types";
import { StudentId } from "@/components/shared/student-id";

interface DocSpec {
  code: DocumentType;
  name: string;
  purpose: string;
  dataSources: string[];
  /** ผู้ที่จัดทำได้ในระบบ */
  makers: ("admin" | "homeroom")[];
  /** กลุ่มเป้าหมาย: นักเรียนรายคน หรือรายวิชา (ปพ.5) */
  per: "student" | "subject";
  officialFormat?: boolean;
  note?: string;
}

const DOCS: DocSpec[] = [
  {
    code: "ปพ.4",
    name: "แบบแสดงผลการพัฒนาคุณลักษณะอันพึงประสงค์",
    purpose: "แสดงผลการพัฒนาคุณลักษณะอันพึงประสงค์ 8 ประการของนักเรียนรายบุคคล",
    dataSources: ["ผลประเมินคุณลักษณะอันพึงประสงค์ในระบบนี้ (UC13)", "ข้อมูลพื้นฐานนักเรียนจากงานทะเบียน"],
    makers: ["admin", "homeroom"],
    per: "student",
  },
  {
    code: "ปพ.5",
    name: "แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน",
    purpose: "รายงานเวลาเรียนและผลการวัดและประเมินผลที่ผู้สอนบันทึกในระบบวิชาการ ระบบนี้จัดทำเป็นแบบรายงานเท่านั้น",
    dataSources: ["เวลาเรียนและผลการเรียนรายวิชาจากระบบวิชาการ (Team A)", "รายชื่อนักเรียนในรายวิชาจากงานทะเบียน"],
    makers: ["admin"],
    per: "subject",
  },
  {
    code: "ปพ.6",
    name: "แบบรายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล",
    purpose: "รายงานผลการเรียนและพัฒนาการของนักเรียนรายบุคคลให้ผู้ปกครองทราบ",
    // ไม่ใช้ผลคัดกรองและผล SDQ เพราะเป็นข้อมูลอ่อนไหวที่แอดมินไม่เห็น (3.4.1)
    dataSources: ["ผลการเรียนจากระบบวิชาการ (Team A)", "ผลประเมินคุณลักษณะอันพึงประสงค์ในระบบนี้", "ข้อมูลพื้นฐานนักเรียนจากงานทะเบียน"],
    makers: ["admin", "homeroom"],
    per: "student",
  },
  {
    code: "ปพ.3",
    name: "แบบรายงานผู้สำเร็จการศึกษา",
    purpose: "อนุมัติและบันทึกรายชื่อผู้จบการศึกษา",
    dataSources: ["ทะเบียนนักเรียนและผลการเรียนสะสมจากงานทะเบียนและระบบวิชาการ", "ผลประเมินคุณลักษณะอันพึงประสงค์ (ต้องผ่านทุกด้าน)"],
    makers: ["admin"],
    per: "student",
    officialFormat: true,
    note: "กระทรวงศึกษาธิการกำหนดรูปแบบ ระบบจัดทำเป็นร่าง การอนุมัติและลงนามเป็นไปตามระเบียบของสถานศึกษา",
  },
  {
    code: "ปพ.7",
    name: "ใบรับรองผลการศึกษา",
    purpose: "รับรองสถานภาพหรือผลการเรียนชั่วคราวตามที่ร้องขอ ครูส่งคำขอแล้วแอดมินจัดทำ",
    dataSources: ["ทะเบียนนักเรียนจากงานทะเบียน", "ผลการเรียนปัจจุบันจากระบบวิชาการ"],
    makers: ["admin"],
    per: "student",
    note: "มีอายุการใช้งาน 120 วันนับจากวันที่ออกเอกสาร",
  },
];

/** ข้อมูลที่ขาดของนักเรียนแต่ละคนสำหรับเอกสารประเภทนั้น (ว่าง = พร้อมจัดทำ) */
function missingFor(code: DocumentType, s: Student, dc: DcSummary | undefined): string[] {
  const levels = dc ? Object.values(dc.levels) : [];
  const dcIncomplete = !dc || levels.some((l) => l === null);
  const missing: string[] = [];
  if (!s.address || !s.guardianName) missing.push("ข้อมูลทะเบียนไม่ครบ");
  if ((code === "ปพ.4" || code === "ปพ.6" || code === "ปพ.3") && dcIncomplete) missing.push("ครูที่ปรึกษายังไม่ส่งผลคุณลักษณะครบ 8 ด้าน");
  if (code === "ปพ.3" && !dcIncomplete && levels.some((l) => l === 0)) missing.push("ผลคุณลักษณะไม่ผ่านบางด้าน");
  return missing;
}

export default function DocumentsPage() {
  const store = useStore();
  const isAdmin = store.role === "admin";
  const canMake = (d: DocSpec) => (isAdmin ? d.makers.includes("admin") : store.role === "homeroom" && d.makers.includes("homeroom"));
  const docs = DOCS.filter(canMake);
  const [selected, setSelected] = useState<DocumentType | null>(docs[0]?.code ?? null);
  const doc = docs.find((d) => d.code === selected);
  const [historyFilter, setHistoryFilter] = useState<DocumentType | "all">("all");
  const history = store.educationDocuments.filter((d) => historyFilter === "all" || d.docType === historyFilter);

  return (
    <>
      <PageHeader title="เอกสารประเมินผลทางการศึกษา" subtitle={`จัดทำร่างเอกสาร ปพ. จากข้อมูลในระบบ · ${CURRENT_TERM.label}`} />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3.5">
          <Info className="size-5 shrink-0 text-primary" />
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            ระบบนี้จัดทำ ปพ.3–7 เป็นร่างเอกสารจากข้อมูลทะเบียน (Team B) ผลการเรียน (Team A) และผลประเมินคุณลักษณะในระบบนี้
            การตรวจรับรองและลงนามเป็นไปตามระเบียบของสถานศึกษา ส่วน ปพ.1 และ ปพ.2 อยู่ในระบบงานทะเบียน
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
          <div className="space-y-5">
            {docs.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <h2 className="mb-3 text-[15.5px] font-bold">เลือกประเภทเอกสาร</h2>
                  <div className="space-y-2">
                    {docs.map((d) => {
                      const active = d.code === selected;
                      return (
                        <button
                          key={d.code}
                          type="button"
                          onClick={() => setSelected(d.code)}
                          className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${active ? "border-primary bg-accent" : "border-border hover:bg-muted/50"}`}
                        >
                          <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-[12.5px] font-bold ${active ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"}`}>
                            {d.code}
                          </span>
                          <span className="min-w-0 flex-1 text-[13.5px] font-semibold">{d.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {!isAdmin && <RequestPp7 />}
            {isAdmin && <RequestQueue />}
            {isAdmin && <ReferralQueue />}
            {isAdmin && <RegistryQueue />}

            <Card>
              <CardContent className="p-5">
                <h2 className="text-[15.5px] font-bold">ประวัติการจัดทำ</h2>
                <div className="mt-2 mb-2 flex flex-wrap gap-1.5">
                  {(["all", ...DOCS.map((d) => d.code)] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={historyFilter === t}
                      onClick={() => setHistoryFilter(t)}
                      className={`rounded-md border px-2.5 py-1 text-[12px] ${historyFilter === t ? "border-primary bg-accent font-semibold text-primary" : "border-border hover:bg-muted"}`}
                    >
                      {t === "all" ? "ทั้งหมด" : t}
                    </button>
                  ))}
                </div>
                <div className="divide-y divide-border">
                  {history.map((d) => (
                    <div key={d.docId} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2.5">
                      <span className="w-14 shrink-0 rounded-md bg-surface px-2 py-0.5 text-center text-[12px] font-bold">{d.docType}</span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                        {d.target}
                        {d.version && d.version > 1 && <span className="ml-1 text-[11.5px] text-muted-foreground">ฉบับที่ {d.version}</span>}
                      </span>
                      <span className="text-[12px] text-muted-foreground">
                        {formatThaiDate(d.generatedAt)} · {d.generatedByName}
                      </span>
                      <Download className="size-4 shrink-0 text-primary" aria-label="ดาวน์โหลด" />
                    </div>
                  ))}
                  {history.length === 0 && <p className="py-3 text-[12.5px] text-muted-foreground">ยังไม่มีเอกสารประเภทนี้</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {doc ? <Generator key={doc.code} doc={doc} /> : (
            <Card>
              <CardContent className="p-8 text-center text-[13px] text-muted-foreground">
                บทบาทนี้ขอจัดทำ ปพ.7 ได้จากแบบฟอร์มด้านซ้าย
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

/** สถานการณ์ A */
function Generator({ doc }: { doc: DocSpec }) {
  const store = useStore();
  const [picked, setPicked] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);
  const [done, setDone] = useState("");

  const targets =
    doc.per === "subject"
      ? subjectSubmissions.map((s) => ({ id: s.subject, label: s.subject, missing: s.submitted ? [] : [`${s.teacherName} ยังไม่ส่งผลในระบบวิชาการ`] }))
      : store.students.map((s) => ({ id: s.studentId, label: `${s.studentId} ${s.fullName} · เลขที่ ${s.classNo}`, missing: missingFor(doc.code, s, store.dcResultOf(s.studentId)) }));
  const ready = targets.filter((t) => t.missing.length === 0);
  const notReady = targets.filter((t) => t.missing.length > 0);
  const chosen = ready.filter((t) => picked.includes(t.id));

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const confirm = () => {
    for (const t of chosen) {
      const name = doc.per === "subject" ? `รายวิชา${t.label}` : (store.getStudent(t.id)?.fullName ?? t.label);
      store.generateDocument(doc.code, name);
    }
    setDone(`สร้างร่าง ${doc.code} แล้ว ${chosen.length} ฉบับ · ลิงก์ดาวน์โหลดหมดอายุใน 24 ชั่วโมง`);
    setPicked([]);
    setPreview(false);
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-[13px] font-bold text-primary">{doc.code}</span>
            <h2 className="text-[15.5px] font-bold">{doc.name}</h2>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed">{doc.purpose}</p>
          <h3 className="mt-4 mb-1.5 text-[13px] font-bold">ข้อมูลที่ใช้</h3>
          <ul className="space-y-1">
            {doc.dataSources.map((d) => (
              <li key={d} className="flex gap-2 text-[12.5px] text-muted-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {d}
              </li>
            ))}
          </ul>
          {doc.note && <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-[12px] text-muted-foreground">{doc.note}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="flex-1 text-[15px] font-bold">
              เลือก{doc.per === "subject" ? "รายวิชา" : "นักเรียน"} · พร้อมจัดทำ {ready.length} จาก {targets.length}
            </h3>
            {ready.length > 0 && (
              <button
                type="button"
                onClick={() => setPicked(picked.length === ready.length ? [] : ready.map((t) => t.id))}
                className="text-[12.5px] font-semibold text-primary"
              >
                {picked.length === ready.length ? "ล้างที่เลือก" : "เลือกทั้งหมดที่พร้อม"}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ready.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={picked.includes(t.id)}
                onClick={() => toggle(t.id)}
                className={`rounded-lg border px-2.5 py-1.5 text-[12.5px] ${picked.includes(t.id) ? "border-primary bg-accent font-semibold text-primary" : "border-border hover:bg-muted"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {notReady.length > 0 && (
            <div className="mt-4 rounded-lg border border-dashed border-border p-3">
              <div className="text-[12.5px] font-semibold">ข้อมูลไม่ครบ แยกไว้จัดทำภายหลัง · {notReady.length}</div>
              <ul className="mt-1 space-y-0.5 text-[12px] text-muted-foreground">
                {notReady.map((t) => (
                  <li key={t.id}>
                    {t.label}: {t.missing.join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {ready.length === 0 && (
            <p className="mt-3 text-[12.5px] text-muted-foreground">ยังไม่มีข้อมูลที่พร้อมจัดทำ ตรวจสอบหรือแก้ไขในระบบต้นทางก่อน (Alt-B)</p>
          )}

          {done && (
            <p role="status" className="mt-4 flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-[13px] text-primary">
              <Check className="size-4" /> {done}
            </p>
          )}
          <Button className="mt-4 w-full" disabled={chosen.length === 0} onClick={() => setPreview(true)}>
            <FileText className="size-4" /> ดูตัวอย่างก่อนจัดทำ {chosen.length > 0 && `(${chosen.length})`}
          </Button>
        </CardContent>
      </Card>

      {preview && chosen[0] && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 sm:items-center" role="dialog" aria-modal="true" aria-label="ตัวอย่างเอกสาร">
          <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl bg-card shadow-lg sm:rounded-2xl">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
              <h2 className="flex-1 text-[15.5px] font-bold">ตัวอย่าง {doc.code}</h2>
              <button type="button" aria-label="ปิด" onClick={() => setPreview(false)} className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="rounded-lg border border-border bg-surface p-5 text-center">
                <div className="text-[12px] text-muted-foreground">ร่างเอกสาร · ยังไม่ได้ลงนาม</div>
                <div className="mt-1 text-[15px] font-bold">{doc.name}</div>
                <div className="mt-3 text-[13px]">{chosen[0].label}</div>
                <div className="mt-1 text-[12px] text-muted-foreground">{CURRENT_TERM.label}</div>
                <div className="mt-4 h-24 rounded bg-card" />
              </div>
              <p className="mt-3 text-[12.5px] text-muted-foreground">
                จะสร้างไฟล์ PDF {chosen.length} ฉบับ ถ้าเคยจัดทำแล้วระบบเก็บฉบับเดิมไว้และนับเป็นฉบับใหม่
              </p>
            </div>
            <div className="flex gap-2 border-t border-border px-5 py-3.5">
              <Button variant="outline" onClick={() => setPreview(false)}>
                กลับไปแก้
              </Button>
              <Button className="flex-1" onClick={confirm}>
                ยืนยันจัดทำ {chosen.length} ฉบับ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** สถานการณ์ B (ฝั่งครู): ขอจัดทำ ปพ.7 */
function RequestPp7() {
  const store = useStore();
  const [studentId, setStudentId] = useState("");
  const mine = store.documentRequests;
  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-[15.5px] font-bold">ขอจัดทำ ปพ.7 (ใบรับรองผลการศึกษา)</h2>
        <p className="mb-2 text-[12px] text-muted-foreground">เลือกนักเรียนแล้วส่งคำขอ แอดมินจัดทำและส่งกลับ</p>
        <div className="flex flex-wrap gap-1.5">
          {store.students.map((s) => (
            <button
              key={s.studentId}
              type="button"
              aria-pressed={studentId === s.studentId}
              onClick={() => setStudentId(s.studentId)}
              className={`rounded-lg border px-2.5 py-1.5 text-[12.5px] ${studentId === s.studentId ? "border-primary bg-accent font-semibold text-primary" : "border-border hover:bg-muted"}`}
            >
              <span className="mr-1.5 tabular-nums text-muted-foreground">{s.studentId}</span>
              {s.fullName}
            </button>
          ))}
        </div>
        <Button
          className="mt-3"
          size="sm"
          disabled={!studentId}
          onClick={() => {
            store.requestDocument(studentId);
            setStudentId("");
          }}
        >
          ส่งคำขอ
        </Button>
        {mine.length > 0 && (
          <div className="mt-3 divide-y divide-border">
            {mine.map((r) => (
              <div key={r.requestId} className="flex items-center gap-2 py-2 text-[12.5px]">
                <span className="flex flex-1 items-baseline gap-2">
                  <StudentId id={r.studentId} />
                  {store.getStudent(r.studentId)?.fullName}
                </span>
                <span className="text-muted-foreground">{r.status === "done" ? "แอดมินส่งกลับแล้ว" : "รอแอดมินจัดทำ"}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** สถานการณ์ B (ฝั่งแอดมิน): คำขอ ปพ.7 ที่รอจัดทำ */
function RequestQueue() {
  const store = useStore();
  const pending = store.documentRequests.filter((r) => r.status === "pending");
  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-[15.5px] font-bold">คำขอ ปพ.7 จากครู · {pending.length}</h2>
        <div className="mt-2 divide-y divide-border">
          {pending.map((r) => (
            <div key={r.requestId} className="flex flex-wrap items-center gap-2 py-2.5 text-[13px]">
              <span className="flex min-w-0 flex-1 items-start gap-2">
                <StudentId id={r.studentId} className="pt-0.5" />
                <span className="min-w-0">
                {store.getStudent(r.studentId)?.fullName}
                <span className="block text-[11.5px] text-muted-foreground">
                  ขอโดย {r.requestedByName} · {formatThaiDate(r.requestedAt)}
                </span>
                </span>
              </span>
              <Button size="sm" onClick={() => store.fulfillRequest(r.requestId)}>
                จัดทำและส่งกลับ
              </Button>
            </div>
          ))}
          {pending.length === 0 && <p className="py-2 text-[12.5px] text-muted-foreground">ไม่มีคำขอที่รอจัดทำ</p>}
        </div>
      </CardContent>
    </Card>
  );
}

/** UC11 Scenario D: แอดมินเก็บรักษาเอกสารส่งต่อ โดยไม่เห็นชื่อนักเรียนหรือเนื้อหา */
function ReferralQueue() {
  const store = useStore();
  const items = store.careCases.filter((c) => c.referral);
  const next: Record<ReferralStatus, ReferralStatus | null> = { awaiting_admin: "stored", stored: "forwarded", forwarded: null };
  const action: Record<ReferralStatus, string> = { awaiting_admin: "รับเก็บรักษา", stored: "บันทึกว่าส่งต่อแล้ว", forwarded: "" };
  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-[15.5px] font-bold">เอกสารส่งต่อ · {items.length}</h2>
        <p className="mb-2 text-[12px] text-muted-foreground">เห็นเฉพาะเลขเอกสาร ผู้ส่ง วันที่ และสถานะ เนื้อหาเปิดได้เฉพาะครูที่รับผิดชอบ</p>
        <div className="divide-y divide-border">
          {items.map((c) => {
            const r = c.referral!;
            const n = next[r.status];
            return (
              <div key={r.referralId} className="flex flex-wrap items-center gap-2 py-2.5 text-[13px]">
                <span className="min-w-0 flex-1">
                  {r.referralId}
                  <span className="block text-[11.5px] text-muted-foreground">
                    ส่งโดย {r.sentByName} · {formatThaiDate(r.preparedAt)} · {REFERRAL_STATUS_LABEL[r.status]}
                  </span>
                </span>
                {n && (
                  <Button size="sm" variant="outline" onClick={() => store.setReferralStatus(c.caseId, n)}>
                    {action[r.status]}
                  </Button>
                )}
              </div>
            );
          })}
          {items.length === 0 && <p className="py-2 text-[12.5px] text-muted-foreground">ยังไม่มีเอกสารส่งต่อ</p>}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * คำขอแก้ข้อมูลทะเบียนที่ส่งไปฝ่ายทะเบียนไม่สำเร็จ แอดมินส่งออกเป็นไฟล์ให้ฝ่ายทะเบียน (UC5 Alt-D ข้อ 3)
 * เป็นข้อมูลทะเบียน ไม่ใช่ผลเยี่ยมบ้าน แอดมินจึงเห็นได้
 */
function RegistryQueue() {
  const store = useStore();
  const queued = store.registryCorrections.filter((r) => r.status === "queued");
  if (queued.length === 0) return null;
  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-[15.5px] font-bold">คำขอแก้ข้อมูลทะเบียนที่ส่งไม่สำเร็จ · {queued.length}</h2>
        <p className="mb-2 text-[12px] text-muted-foreground">ส่งออกเป็นไฟล์แล้วนำไปให้ฝ่ายทะเบียนแก้ในระบบงานทะเบียน</p>
        <div className="divide-y divide-border text-[13px]">
          {queued.map((r) => (
            <div key={r.id} className="py-2">
              {store.getStudent(r.studentId)?.fullName} · {REGISTRY_FIELD_LABEL[r.field]}: {r.from} → {r.to}
              <span className="block text-[11.5px] text-muted-foreground">แจ้งโดย {r.by} · {formatThaiDate(r.at)}</span>
            </div>
          ))}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="mt-2"
          onClick={() =>
            downloadCsv(
              "registry-corrections.csv",
              ["นักเรียน", "ช่องข้อมูล", "ตามทะเบียน", "ที่พบจริง", "ผู้แจ้ง", "วันที่"],
              queued.map((r) => [
                store.getStudent(r.studentId)?.fullName ?? r.studentId,
                REGISTRY_FIELD_LABEL[r.field],
                r.from,
                r.to,
                r.by,
                formatThaiDate(r.at),
              ])
            )
          }
        >
          ส่งออกให้ฝ่ายทะเบียน
        </Button>
      </CardContent>
    </Card>
  );
}
