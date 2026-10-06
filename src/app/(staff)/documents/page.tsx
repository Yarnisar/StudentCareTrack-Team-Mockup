"use client";

import { useState } from "react";
import { Check, Download, FileText, Info } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DcLevelChip } from "@/components/characteristics/dc-level";
import { GradeSourceBadge } from "@/components/documents/grade-source-badge";
import { PagerNumbered, usePagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { academicTerms } from "@/lib/mock-data";
import { formatThaiDateTime } from "@/lib/format";
import {
  DOCUMENT_HAS_GRADES,
  DOCUMENT_NAME,
  DOCUMENT_SCOPE_KIND,
  type DocumentCheckSource,
  type DocumentScope,
  type DocumentType,
} from "@/lib/types";

interface DocSpec {
  code: DocumentType;
  purpose: string;
  /** ข้อมูลที่ระบบดึงมาสร้างเอกสาร (ตามตารางแหล่งข้อมูลของ ปพ. ใน data dictionary) */
  dataSources: { text: string; source: DocumentCheckSource }[];
  issuedBy: string;
  issuedWhen: string;
  /** เอกสารที่กระทรวงศึกษาธิการกำหนดรูปแบบตายตัว */
  officialFormat: boolean;
  note?: string;
}

const SOURCE_LABEL: Record<DocumentCheckSource, string> = {
  team_c: "ระบบนี้",
  team_a: "งานวิชาการ",
  team_b: "งานทะเบียน",
};

const SOURCE_STYLE: Record<DocumentCheckSource, string> = {
  team_c: "bg-accent text-primary",
  team_a: "bg-surface text-muted-foreground",
  team_b: "bg-surface text-muted-foreground",
};

/** ชื่อและองค์ประกอบของแต่ละ ปพ. ต้องตรวจกับระเบียบการวัดและประเมินผลฯ หลักสูตรแกนกลางฯ 2551 อีกครั้ง */
const DOCS: DocSpec[] = [
  {
    code: "ปพ.4",
    purpose:
      "แสดงผลการประเมินคุณลักษณะอันพึงประสงค์ 8 ประการ ของนักเรียนรายบุคคล เพื่อรายงานต่อผู้ปกครองและใช้ประกอบการจบช่วงชั้น",
    dataSources: [
      { text: "คุณลักษณะ 8 ด้าน และผลสรุปคุณลักษณะอันพึงประสงค์ทั้งฉบับ (dc_criteria, dc_summary)", source: "team_c" },
      { text: "ข้อมูลนักเรียนและห้องเรียน", source: "team_b" },
    ],
    issuedBy: "ครูประจำชั้น",
    issuedWhen: "ปลายภาคเรียน",
    officialFormat: false,
  },
  {
    code: "ปพ.5",
    purpose:
      "บันทึกผลการประเมินของครูประจำวิชาแต่ละรายวิชา ทั้งด้านผลการเรียน เวลาเรียน และคุณลักษณะอันพึงประสงค์",
    dataSources: [
      { text: "คะแนนคุณลักษณะอันพึงประสงค์รายตัวชี้วัดที่ครูประจำวิชาบันทึก (dc_scores)", source: "team_c" },
      { text: "เวลาเรียนและคะแนนรายวิชา", source: "team_a" },
    ],
    issuedBy: "ครูประจำวิชา",
    issuedWhen: "ระหว่างและปลายภาคเรียน",
    officialFormat: false,
  },
  {
    code: "ปพ.6",
    purpose: "รายงานพัฒนาการของนักเรียนรายบุคคลต่อผู้ปกครอง ครอบคลุมผลการเรียนและคุณลักษณะอันพึงประสงค์",
    dataSources: [
      { text: "ผลสรุปคุณลักษณะอันพึงประสงค์ (dc_summary)", source: "team_c" },
      { text: "ผลการเรียน", source: "team_a" },
    ],
    issuedBy: "ครูประจำชั้น",
    issuedWhen: "ปลายภาคเรียนและปลายปีการศึกษา",
    officialFormat: false,
  },
  {
    code: "ปพ.3",
    purpose:
      "เอกสารอนุมัติการจบหลักสูตร บันทึกรายชื่อผู้จบการศึกษาระดับประถมศึกษา ภาคบังคับ และการศึกษาขั้นพื้นฐาน",
    dataSources: [
      { text: "ผลคุณลักษณะอันพึงประสงค์ (dc_summary) — ต้องผ่านทุกด้าน", source: "team_c" },
      { text: "รายชื่อผู้จบการศึกษา", source: "team_b" },
      { text: "ผลการเรียน", source: "team_a" },
    ],
    issuedBy: "งานทะเบียน และผู้อำนวยการสถานศึกษาลงนาม",
    issuedWhen: "เมื่อสิ้นปีการศึกษาที่นักเรียนจบหลักสูตร",
    officialFormat: true,
    note: "กระทรวงศึกษาธิการกำหนดรูปแบบตายตัว ต้องใช้แบบพิมพ์ของกระทรวงเท่านั้น",
  },
  {
    code: "ปพ.7",
    purpose:
      "เอกสารรับรองสถานภาพการเป็นนักเรียนและผลการศึกษาเบื้องต้น ใช้ชั่วคราวระหว่างรอออกระเบียนแสดงผลการเรียน (ปพ.1)",
    dataSources: [
      { text: "ข้อมูลนักเรียน", source: "team_b" },
      { text: "ผลการเรียน", source: "team_a" },
    ],
    issuedBy: "งานทะเบียน",
    issuedWhen: "เมื่อนักเรียนหรือผู้ปกครองยื่นคำร้อง",
    officialFormat: false,
    note: "มีอายุการใช้งาน 120 วันนับจากวันที่ออกเอกสาร",
  },
];

const termLabel = (termId: string) => academicTerms.find((t) => t.termId === termId)?.label ?? termId;

export default function DocumentsPage() {
  const store = useStore();
  return (
    <>
      <PageHeader
        title="เอกสารประเมินผลทางการศึกษา"
        subtitle={`จัดทำเอกสาร ปพ. จากข้อมูลที่บันทึกไว้ในระบบ · ${store.currentTerm.label}`}
      />
      <DocumentsContent key={store.currentUser.userId} />
    </>
  );
}

function DocumentsContent() {
  const store = useStore();
  const isAdmin = store.currentUser.role === "admin_school";
  const termId = store.currentTerm.termId;

  const roomsWithStudents = store.classrooms.filter((c) => store.studentsOfRoom(c.roomId).length > 0);
  const studentOptions = isAdmin
    ? store.students.filter((s) => s.status === "studying")
    : store.students.filter((s) => s.status === "studying" && store.isHomeroomOf(s.studentId));
  const activeTeachings = store.subjectTeachings.filter((t) => t.endedAt === null && t.termId === termId);
  const teachingOptions = activeTeachings.filter(
    (t) => isAdmin || t.teacherId === store.currentUser.userId
  );

  const [selected, setSelected] = useState<DocumentType>("ปพ.6");
  const [studentId, setStudentId] = useState(() => studentOptions[0]?.studentId ?? store.students[0]?.studentId ?? "");
  const [roomId, setRoomId] = useState(() => roomsWithStudents[0]?.roomId ?? "");
  const [teachingId, setTeachingId] = useState(
    () => teachingOptions[0]?.teachingId ?? activeTeachings[0]?.teachingId ?? ""
  );
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [historySize, setHistorySize] = useState(10);
  const historyPager = usePagination(store.educationDocuments, historySize);

  const doc = DOCS.find((d) => d.code === selected)!;
  const kind = DOCUMENT_SCOPE_KIND[selected];
  const scope: DocumentScope =
    kind === "student" ? { kind, studentId } : kind === "room" ? { kind, roomId } : { kind, teachingId };
  const readiness = store.documentReadiness(selected, scope);
  const failing = readiness.checks.filter((c) => !c.ok);
  const roomName = (id: string | null) => store.classrooms.find((c) => c.roomId === id)?.roomName ?? "";

  const pick = (code: DocumentType) => {
    setSelected(code);
    setMessage(null);
  };

  const generate = () => {
    const result = store.generateDocument(selected, scope);
    setMessage(
      result.ok
        ? { ok: true, text: `จัดทำ ${result.doc.docType} ${result.doc.target} แล้ว` }
        : { ok: false, text: result.error }
    );
  };

  /** ตัวอย่างข้อมูลคุณลักษณะฯ ที่จะอยู่ในเอกสาร (ไม่ใช่ข้อมูลอ่อนไหว) */
  const dcPreview = (selected === "ปพ.4" || selected === "ปพ.6") && studentId ? store.dcSummaryOf(studentId, termId) : undefined;

  const selectClass = "h-9 w-full rounded-lg border border-border bg-card px-3 text-[13px]";

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-accent px-4 py-3.5">
        <Info className="size-5 shrink-0 text-primary" />
        <p className="text-[13.5px] leading-relaxed text-accent-foreground">
          เอกสารหลักฐานการศึกษาแบ่งเป็น 2 กลุ่ม — <b>ปพ.1 ปพ.2 และ ปพ.3</b> เป็นเอกสารที่กระทรวงศึกษาธิการกำหนดรูปแบบตายตัว
          ส่วน <b>ปพ.4 ถึง ปพ.9</b> สถานศึกษากำหนดรูปแบบเองได้ ระบบนี้สร้างเอกสารจากข้อมูลที่บันทึกไว้แล้ว
          ส่วนผลการเรียนและข้อมูลทะเบียนอ่านจากงานวิชาการและงานทะเบียน (แก้ไขในระบบนี้ไม่ได้)
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-1 text-[15.5px] font-bold">เลือกประเภทเอกสาร</h2>
              <p className="mb-4 text-xs text-muted-foreground">เลือกเพื่อดูว่าเอกสารแต่ละประเภทใช้ข้อมูลจากส่วนใด</p>

              <div className="space-y-2.5">
                {DOCS.map((d) => {
                  const active = d.code === selected;
                  return (
                    <button
                      key={d.code}
                      onClick={() => pick(d.code)}
                      className={
                        active
                          ? "flex w-full items-center gap-3 rounded-xl border border-primary bg-accent p-4 text-left"
                          : "flex w-full items-center gap-3 rounded-xl border border-border p-4 text-left hover:bg-muted/50"
                      }
                    >
                      <span
                        className={
                          active
                            ? "flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-[13px] font-bold text-primary-foreground"
                            : "flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface text-[13px] font-bold text-muted-foreground"
                        }
                      >
                        {d.code}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold">{DOCUMENT_NAME[d.code]}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          ออกโดย {d.issuedBy} · {d.issuedWhen}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        {d.officialFormat && (
                          <span className="rounded-full bg-risk-amber-bg px-2.5 py-1 text-[11px] font-semibold text-risk-amber">
                            แบบพิมพ์ของกระทรวง
                          </span>
                        )}
                        {DOCUMENT_HAS_GRADES[d.code] && <GradeSourceBadge />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[15.5px] font-bold">ประวัติการจัดทำเอกสาร</h2>
                <span className="text-[12.5px] text-muted-foreground">บันทึกใน audit log ทุกครั้ง</span>
              </div>
              <div className="divide-y divide-border">
                {historyPager.slice.map((d) => (
                  <div key={d.docId} className="flex items-center gap-3 py-3">
                    <span className="w-36 shrink-0 text-[12.5px] text-muted-foreground">
                      {formatThaiDateTime(d.generatedAt)}
                    </span>
                    <span className="w-16 shrink-0 rounded-md bg-surface px-2 py-1 text-center text-[12px] font-bold">
                      {d.docType}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium">{d.target}</span>
                      <span className="block truncate text-[11.5px] text-muted-foreground">
                        {termLabel(d.termId)}
                        {d.studentId && d.roomId ? ` · ${roomName(d.roomId)}` : ""}
                      </span>
                    </span>
                    <span className="w-40 shrink-0 text-[12.5px] text-muted-foreground">{store.nameOf(d.generatedBy)}</span>
                    <span title="ต้นแบบยังไม่สร้างไฟล์ PDF จริง">
                      <Download className="size-4 shrink-0 text-muted-foreground" />
                    </span>
                  </div>
                ))}
                {store.educationDocuments.length === 0 && (
                  <p className="py-6 text-center text-[13px] text-muted-foreground">ยังไม่มีเอกสารที่จัดทำไว้</p>
                )}
              </div>

              <PagerNumbered
                page={historyPager.page}
                totalPages={historyPager.totalPages}
                setPage={historyPager.setPage}
                from={historyPager.from}
                to={historyPager.to}
                total={historyPager.total}
                pageSize={historySize}
                onPageSize={(n) => {
                  setHistorySize(n);
                  historyPager.reset();
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* รายละเอียดเอกสารที่เลือก */}
        <div className="space-y-5">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-xl bg-accent text-sm font-bold text-primary">
                  {doc.code}
                </span>
                <div>
                  <h2 className="text-[15.5px] font-bold">{DOCUMENT_NAME[doc.code]}</h2>
                  <p className="text-xs text-muted-foreground">
                    ออกโดย {doc.issuedBy} · {doc.issuedWhen}
                  </p>
                </div>
              </div>
              {DOCUMENT_HAS_GRADES[doc.code] && <GradeSourceBadge className="mt-3" />}

              <p className="mt-4 text-[13.5px] leading-relaxed">{doc.purpose}</p>

              {doc.note && (
                <p className="mt-3 rounded-lg bg-risk-amber-bg px-3.5 py-2.5 text-[12.5px] leading-relaxed text-risk-amber">
                  {doc.note}
                </p>
              )}

              <h3 className="mt-5 mb-2 text-[13.5px] font-bold">ข้อมูลที่ระบบดึงมาสร้างเอกสาร</h3>
              <ul className="space-y-2">
                {doc.dataSources.map((src) => (
                  <li key={src.text} className="flex items-start gap-2.5 text-[13px] leading-relaxed">
                    <span
                      className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${SOURCE_STYLE[src.source]}`}
                    >
                      {SOURCE_LABEL[src.source]}
                    </span>
                    {src.text}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-[15px] font-bold">จัดทำเอกสาร</h3>
              <p className="mt-0.5 mb-3 text-[11.5px] text-muted-foreground">
                {kind === "student" ? "รายบุคคล" : kind === "room" ? "ทั้งห้อง" : "รายวิชาของห้อง"} · {store.currentTerm.label}
              </p>

              {kind === "student" && (
                <select value={studentId} onChange={(e) => {
                  setStudentId(e.target.value);
                  setMessage(null);
                }} className={selectClass}>
                  {(studentOptions.length > 0 ? studentOptions : store.students).map((s) => (
                    <option key={s.studentId} value={s.studentId}>
                      {s.fullName} ({s.roomName} เลขที่ {s.classNo})
                    </option>
                  ))}
                </select>
              )}
              {kind === "room" && (
                <select value={roomId} onChange={(e) => {
                  setRoomId(e.target.value);
                  setMessage(null);
                }} className={selectClass}>
                  {roomsWithStudents.map((c) => (
                    <option key={c.roomId} value={c.roomId}>
                      {c.roomName}
                    </option>
                  ))}
                </select>
              )}
              {kind === "teaching" && (
                <select value={teachingId} onChange={(e) => {
                  setTeachingId(e.target.value);
                  setMessage(null);
                }} className={selectClass}>
                  {(teachingOptions.length > 0
                    ? teachingOptions
                    : activeTeachings
                  ).map((t) => (
                    <option key={t.teachingId} value={t.teachingId}>
                      {store.subjectOf(t.subjectId)?.name} · {roomName(t.roomId)}
                    </option>
                  ))}
                </select>
              )}

              <h4 className="mt-4 mb-2 text-[13px] font-bold">ตรวจสอบความครบถ้วนก่อนออกเอกสาร</h4>
              <div className="space-y-2">
                {readiness.checks.map((c) => (
                  <div key={c.label} className="flex items-start gap-2.5">
                    <span
                      className={
                        c.ok
                          ? "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-risk-green"
                          : "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-risk-amber"
                      }
                    >
                      {c.ok ? (
                        <Check className="size-3 text-white" strokeWidth={3} />
                      ) : (
                        <span className="text-[11px] font-bold text-white">!</span>
                      )}
                    </span>
                    <span className="flex-1 text-[13px] leading-relaxed">
                      {c.label}
                      <span className="ml-1.5 text-[11px] text-muted-foreground">({SOURCE_LABEL[c.source]})</span>
                      {c.detail && (!c.ok || c.source === "team_c") && (
                        <span className={`block text-[11.5px] ${c.ok ? "text-muted-foreground" : "text-risk-amber"}`}>
                          {c.detail}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {dcPreview && (
                <div className="mt-4 rounded-lg bg-surface p-3">
                  <div className="mb-2 text-[12px] font-semibold text-muted-foreground">ผลคุณลักษณะที่จะอยู่ในเอกสาร</div>
                  <div className="flex flex-wrap gap-2">
                    {store.dcCriteria.map((c) => (
                      <span key={c.criteriaId} className="flex items-center gap-1.5 text-[12px]">
                        {c.shortName} <DcLevelChip level={dcPreview.levels[c.criteriaId]} />
                      </span>
                    ))}
                  </div>
                  {dcPreview.missingSubjects.length > 0 && (
                    <p className="mt-2 text-[11.5px] text-risk-amber">
                      สรุปขณะยังไม่ส่งคะแนน: {dcPreview.missingSubjects.join(", ")}
                    </p>
                  )}
                </div>
              )}

              {readiness.allowed && failing.length > 0 && (
                <p className="mt-3 flex gap-2 rounded-lg bg-risk-amber-bg px-3 py-2.5 text-[12px] leading-relaxed text-risk-amber">
                  <FileText className="size-4 shrink-0" />
                  ยังออก {doc.code} ไม่ได้ — {failing.map((c) => c.label).join(" · ")}
                </p>
              )}
              {!readiness.allowed && (
                <p className="mt-3 flex gap-2 rounded-lg bg-surface px-3 py-2.5 text-[12px] leading-relaxed text-muted-foreground">
                  <FileText className="size-4 shrink-0" />
                  {doc.code} ของ {readiness.target} ออกโดย{doc.issuedBy}
                  {doc.code === "ปพ.4" || doc.code === "ปพ.6" ? "ของนักเรียนคนนั้น" : doc.code === "ปพ.5" ? "ของรายวิชานั้น" : ""}
                </p>
              )}

              {message && (
                <p className={`mt-3 text-[12.5px] font-semibold ${message.ok ? "text-risk-green" : "text-risk-red"}`}>
                  {message.text}
                </p>
              )}

              <Button className="mt-4 w-full" disabled={!readiness.ready || !readiness.allowed} onClick={generate}>
                {readiness.ready && readiness.allowed ? `จัดทำเอกสาร ${doc.code}` : `ยังออก ${doc.code} ไม่ได้`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
