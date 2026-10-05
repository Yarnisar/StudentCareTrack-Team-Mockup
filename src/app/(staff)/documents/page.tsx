"use client";

import { useState } from "react";
import { Check, Download, FileText, Info } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { CURRENT_TERM } from "@/lib/mock-data";
import { formatThaiDate } from "@/lib/format";
import { DocumentType } from "@/lib/types";

interface DocSpec {
  code: DocumentType;
  name: string;
  purpose: string;
  /** ข้อมูลที่ระบบดึงมาสร้างเอกสาร */
  dataSources: string[];
  issuedBy: string;
  issuedWhen: string;
  /** เอกสารที่กระทรวงศึกษาธิการกำหนดรูปแบบตายตัว */
  officialFormat: boolean;
  note?: string;
}

const DOCS: DocSpec[] = [
  {
    code: "ปพ.4",
    name: "แบบแสดงผลการพัฒนาคุณลักษณะอันพึงประสงค์",
    purpose:
      "แสดงผลการประเมินคุณลักษณะอันพึงประสงค์ 8 ประการ ของนักเรียนรายบุคคล เพื่อรายงานต่อผู้ปกครองและใช้ประกอบการจบช่วงชั้น",
    dataSources: [
      "ผลการประเมินคุณลักษณะอันพึงประสงค์ 8 ด้าน (สรุปจาก ปพ.5 ทุกรายวิชา)",
      "ข้อมูลพื้นฐานนักเรียนจากงานทะเบียน",
    ],
    issuedBy: "ครูประจำชั้น",
    issuedWhen: "ปลายภาคเรียน",
    officialFormat: false,
  },
  {
    code: "ปพ.5",
    name: "แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน",
    purpose:
      "บันทึกผลการประเมินของครูผู้สอนแต่ละรายวิชา ทั้งด้านผลการเรียน การอ่านคิดวิเคราะห์ และคุณลักษณะอันพึงประสงค์",
    dataSources: [
      "คะแนนคุณลักษณะอันพึงประสงค์ที่ครูประจำวิชาบันทึกในระบบ",
      "รายชื่อนักเรียนในรายวิชาจากงานทะเบียน",
    ],
    issuedBy: "ครูผู้สอนรายวิชา",
    issuedWhen: "ระหว่างและปลายภาคเรียน",
    officialFormat: false,
  },
  {
    code: "ปพ.6",
    name: "แบบรายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล",
    purpose:
      "รายงานพัฒนาการของนักเรียนรายบุคคลต่อผู้ปกครอง ครอบคลุมผลการเรียน คุณลักษณะอันพึงประสงค์ และพฤติกรรม",
    dataSources: [
      "ผลสรุปคุณลักษณะอันพึงประสงค์ (ปพ.5 ทุกรายวิชา)",
      "ประวัติความประพฤติและการเข้าเรียนในระบบ",
      "ผลการคัดกรอง 6 มิติ และผลการประเมิน SDQ (เฉพาะส่วนที่เปิดเผยต่อผู้ปกครองได้)",
    ],
    issuedBy: "ครูประจำชั้น",
    issuedWhen: "ปลายภาคเรียนและปลายปีการศึกษา",
    officialFormat: false,
  },
  {
    code: "ปพ.3",
    name: "แบบรายงานผู้สำเร็จการศึกษา",
    purpose:
      "เอกสารอนุมัติการจบหลักสูตร บันทึกรายชื่อผู้จบการศึกษาระดับประถมศึกษา ภาคบังคับ และการศึกษาขั้นพื้นฐาน",
    dataSources: [
      "ทะเบียนนักเรียนและผลการเรียนสะสมจากงานทะเบียน",
      "ผลการประเมินคุณลักษณะอันพึงประสงค์ (ต้องผ่านทุกด้าน)",
    ],
    issuedBy: "งานทะเบียน และผู้อำนวยการสถานศึกษาลงนาม",
    issuedWhen: "เมื่อสิ้นปีการศึกษาที่นักเรียนจบหลักสูตร",
    officialFormat: true,
    note: "กระทรวงศึกษาธิการกำหนดรูปแบบตายตัว ต้องใช้แบบพิมพ์ของกระทรวงเท่านั้น",
  },
  {
    code: "ปพ.7",
    name: "ใบรับรองผลการศึกษา",
    purpose:
      "เอกสารรับรองสถานภาพการเป็นนักเรียนและผลการศึกษาเบื้องต้น ใช้ชั่วคราวระหว่างรอออกระเบียนแสดงผลการเรียน (ปพ.1)",
    dataSources: ["ทะเบียนนักเรียนและผลการเรียนปัจจุบันจากงานทะเบียน"],
    issuedBy: "งานทะเบียน",
    issuedWhen: "เมื่อนักเรียนหรือผู้ปกครองยื่นคำร้อง",
    officialFormat: false,
    note: "มีอายุการใช้งาน 120 วันนับจากวันที่ออกเอกสาร",
  },
];

export default function DocumentsPage() {
  const store = useStore();
  const { educationDocuments, subjectSubmissions } = store;
  const [selected, setSelected] = useState<DocumentType>("ปพ.6");
  const doc = DOCS.find((d) => d.code === selected)!;
  const pendingSubjects = subjectSubmissions.filter((s) => !s.submitted);

  /** เงื่อนไขความครบถ้วนของข้อมูลก่อนออกเอกสารแต่ละประเภท */
  const checksFor = (code: DocumentType) => {
    const dcComplete = pendingSubjects.length === 0;
    switch (code) {
      case "ปพ.4":
      case "ปพ.6":
        return [
          { label: "ครูประจำวิชาส่งผลคุณลักษณะอันพึงประสงค์ครบทุกรายวิชา", ok: dcComplete },
          { label: "มีผลการคัดกรอง 6 มิติ ของภาคเรียนปัจจุบัน", ok: true },
          { label: "ข้อมูลพื้นฐานนักเรียนจากงานทะเบียนครบถ้วน", ok: true },
        ];
      case "ปพ.5":
        return [
          { label: "มีรายชื่อนักเรียนในรายวิชา", ok: true },
          { label: "ครูผู้สอนบันทึกคะแนนคุณลักษณะอันพึงประสงค์แล้ว", ok: true },
        ];
      case "ปพ.3":
        return [
          { label: "นักเรียนมีผลการเรียนครบตามโครงสร้างหลักสูตร", ok: true },
          { label: "ผลคุณลักษณะอันพึงประสงค์ผ่านเกณฑ์ทุกด้าน", ok: dcComplete },
          { label: "ผู้อำนวยการสถานศึกษาอนุมัติการจบหลักสูตร", ok: false },
        ];
      case "ปพ.7":
        return [{ label: "มีคำร้องขอเอกสารจากนักเรียนหรือผู้ปกครอง", ok: true }];
      default:
        return [];
    }
  };

  const checks = checksFor(selected);
  const ready = checks.every((c) => c.ok);

  return (
    <>
      <PageHeader
        title="เอกสารประเมินผลทางการศึกษา"
        subtitle={`จัดทำเอกสาร ปพ. จากข้อมูลที่บันทึกไว้ในระบบ · ${CURRENT_TERM.label}`}
      />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-accent px-4 py-3.5">
          <Info className="size-5 shrink-0 text-primary" />
          <p className="text-[13.5px] leading-relaxed text-accent-foreground">
            เอกสารหลักฐานการศึกษาแบ่งเป็น 2 กลุ่ม — <b>ปพ.1 ปพ.2 และ ปพ.3</b>{" "}
            เป็นเอกสารที่กระทรวงศึกษาธิการกำหนดรูปแบบตายตัว ส่วน <b>ปพ.4 ถึง ปพ.9</b>{" "}
            สถานศึกษากำหนดรูปแบบเองได้ ระบบนี้สร้างเอกสารจากข้อมูลที่บันทึกไว้แล้ว
            จึงไม่ต้องคัดลอกข้อมูลซ้ำจากหลายแหล่ง
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5">
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-1 text-[15.5px] font-bold">เลือกประเภทเอกสาร</h2>
                <p className="mb-4 text-xs text-muted-foreground">
                  เลือกเพื่อดูว่าเอกสารแต่ละประเภทใช้ข้อมูลจากส่วนใดของระบบ
                </p>

                <div className="space-y-2.5">
                  {DOCS.map((d) => {
                    const active = d.code === selected;
                    return (
                      <button
                        key={d.code}
                        onClick={() => setSelected(d.code)}
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
                          <span className="block text-sm font-bold">{d.name}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            ออกโดย {d.issuedBy} · {d.issuedWhen}
                          </span>
                        </span>
                        {d.officialFormat && (
                          <span className="shrink-0 rounded-full bg-risk-amber-bg px-2.5 py-1 text-[11px] font-semibold text-risk-amber">
                            แบบพิมพ์ของกระทรวง
                          </span>
                        )}
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
                  <span className="text-[12.5px] text-muted-foreground">
                    บันทึกใน audit log ทุกครั้ง
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {educationDocuments.map((d) => (
                    <div key={d.docId} className="flex items-center gap-3 py-3">
                      <span className="w-28 shrink-0 text-[12.5px] text-muted-foreground">
                        {formatThaiDate(d.generatedAt)}
                      </span>
                      <span className="w-16 shrink-0 rounded-md bg-surface px-2 py-1 text-center text-[12px] font-bold">
                        {d.docType}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">
                        {d.target}
                      </span>
                      <span className="w-40 shrink-0 text-[12.5px] text-muted-foreground">
                        {store.nameOf(d.generatedBy)}
                      </span>
                      <Download className="size-4 shrink-0 text-primary" />
                    </div>
                  ))}
                </div>
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
                    <h2 className="text-[15.5px] font-bold">{doc.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      ออกโดย {doc.issuedBy} · {doc.issuedWhen}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-[13.5px] leading-relaxed">{doc.purpose}</p>

                {doc.note && (
                  <p className="mt-3 rounded-lg bg-risk-amber-bg px-3.5 py-2.5 text-[12.5px] leading-relaxed text-risk-amber">
                    {doc.note}
                  </p>
                )}

                <h3 className="mt-5 mb-2 text-[13.5px] font-bold">ข้อมูลที่ระบบดึงมาสร้างเอกสาร</h3>
                <ul className="space-y-2">
                  {doc.dataSources.map((src) => (
                    <li key={src} className="flex gap-2.5 text-[13px] leading-relaxed">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      {src}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-[15px] font-bold">ตรวจสอบความครบถ้วนก่อนออกเอกสาร</h3>
                <p className="mt-0.5 mb-3 text-[11.5px] text-muted-foreground">
                  เงื่อนไขของ {doc.code}
                </p>
                <div className="space-y-2">
                  {checks.map((c) => (
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
                      <span className="text-[13px] leading-relaxed">{c.label}</span>
                    </div>
                  ))}
                </div>

                {!ready && (
                  <p className="mt-3 flex gap-2 rounded-lg bg-risk-amber-bg px-3 py-2.5 text-[12px] leading-relaxed text-risk-amber">
                    <FileText className="size-4 shrink-0" />
                    {selected === "ปพ.3"
                      ? "รอผู้อำนวยการสถานศึกษาอนุมัติการจบหลักสูตรก่อนจึงจะออกเอกสารได้"
                      : `รอครูประจำวิชาส่งผลคุณลักษณะอันพึงประสงค์อีก ${pendingSubjects.length} รายวิชา (${pendingSubjects
                          .map((s) => s.subject)
                          .join(", ")})`}
                  </p>
                )}

                <Button className="mt-4 w-full" disabled={!ready}>
                  {ready ? `จัดทำเอกสาร ${doc.code}` : `ยังออก ${doc.code} ไม่ได้`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
