"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Download, Upload, X } from "lucide-react";
import { cn } from "cn";
import { InlineAutofill } from "@/components/demo/inline-autofill";
import { InlineConfirm } from "@/components/settings/confirm";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDemoPageTool } from "@/lib/demo/page-tools";
import { downloadCsv, parseCsv, type CsvTable } from "@/lib/imports/csv";
import type { RowAction } from "@/lib/imports/engine";
import { IMPORT_TEMPLATES, sampleCsv, templateCsv } from "@/lib/imports/templates";
import { useStore, type ImportCommitSummary } from "@/lib/store";
import { IMPORT_KIND_LABEL, type ImportKind } from "@/lib/types";
import { ImportResult } from "./import-result";

const MAX_BYTES = 2 * 1024 * 1024;

const ACTION_LABEL: Record<RowAction, string> = {
  create: "สร้างใหม่",
  update: "อัปเดต",
  unchanged: "ข้าม",
  invalid: "ต้องแก้",
};

interface LoadedFile {
  name: string;
  table: CsvTable;
}

/** นำเข้า 1 ประเภท: แม่แบบ → อัปโหลด → ตรวจ (ไม่เขียน) → ยืนยัน → ผล */
export function KindPanel({ kind }: { kind: ImportKind }) {
  const store = useStore();
  const label = IMPORT_KIND_LABEL[kind];
  const template = IMPORT_TEMPLATES[kind];
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<LoadedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportCommitSummary | null>(null);

  const plan = useMemo(() => (file ? store.previewImport(kind, file.table) : null), [file, kind, store]);

  const load = (name: string, text: string) => {
    setResult(null);
    setConfirming(false);
    setCommitError(null);
    if (text.includes("�")) {
      setFile(null);
      setFileError("อ่านไฟล์ไม่ได้ — บันทึกเป็น CSV UTF-8 แล้วลองใหม่");
      return;
    }
    setFileError(null);
    setFile({ name, table: parseCsv(text) });
  };

  const onPick = async (picked: File | undefined) => {
    if (!picked) return;
    if (!/\.csv$/i.test(picked.name)) {
      setFile(null);
      setFileError("รองรับเฉพาะไฟล์ .csv");
      return;
    }
    if (picked.size > MAX_BYTES) {
      setFile(null);
      setFileError("ไฟล์ใหญ่เกิน 2 MB");
      return;
    }
    load(picked.name, await picked.text());
  };

  useDemoPageTool(
    `กรอกอัตโนมัติ · ไฟล์ตัวอย่าง${label}`,
    () => load(`ตัวอย่าง-${label}.csv`, sampleCsv(kind, "ok")),
    "โหลดไฟล์ตัวอย่างที่ถูกต้อง แล้วดูผลตรวจก่อนยืนยัน"
  );
  useDemoPageTool(
    `กรอกอัตโนมัติ · ไฟล์ตัวอย่าง${label} (มีแถวผิด)`,
    () => load(`ตัวอย่าง-${label}-มีแถวผิด.csv`, sampleCsv(kind, "mixed")),
    "มีแถวที่ผิดปนอยู่ ดูว่าแถวผิดไม่ขวางแถวอื่น"
  );

  const commit = () => {
    if (!file) return;
    const res = store.commitImport(kind, file.name, file.table);
    setConfirming(false);
    if (res.ok) {
      setResult(res);
      setCommitError(null);
      setFile(null);
    } else {
      setCommitError(res.error);
    }
  };

  const counts = plan?.counts;
  const writable = counts ? counts.create + counts.update : 0;

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => downloadCsv(template.filename, templateCsv(kind))}>
            <Download data-icon="inline-start" />
            ดาวน์โหลดแม่แบบ
          </Button>
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            <Upload data-icon="inline-start" />
            เลือกไฟล์ .csv
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            aria-label={`เลือกไฟล์ CSV ${label}`}
            data-testid="import-file-input"
            onChange={(e) => {
              void onPick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {file && <span className="text-[12px] text-muted-foreground">{file.name}</span>}
        </div>
        <p className="text-[12px] text-muted-foreground">
          ไฟล์ .csv (UTF-8) ในต้นแบบมีแม่แบบ .csv เท่านั้น (ระบบจริงมี .xlsx)
        </p>
        <p className="text-[12px] text-muted-foreground">
          คอลัมน์: {template.columns.map((c) => (c.required ? c.name : `${c.name} (ไม่บังคับ)`)).join(" · ")}
        </p>
      </section>

      <InlineAutofill className="mb-0" />

      {fileError && (
        <p role="alert" className="text-[13px] font-medium text-risk-red">
          {fileError}
        </p>
      )}

      {plan?.fileError && (
        <p role="alert" className="text-[13px] font-medium text-risk-red">
          {plan.fileError}
        </p>
      )}

      {plan && !plan.fileError && counts && (
        <section className="space-y-3" aria-label="ผลตรวจไฟล์">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="text-[15px] font-bold">ผลตรวจ</h2>
            <p className="text-[13px]" data-testid="import-counts">
              สร้างใหม่ <b>{counts.create}</b> · อัปเดต <b>{counts.update}</b> · ข้าม <b>{counts.unchanged + counts.invalid}</b>
            </p>
            <p className="text-[12px] text-muted-foreground">
              ยังไม่เขียนข้อมูล{counts.invalid > 0 ? ` · ต้องแก้ ${counts.invalid} แถว` : ""}
            </p>
          </div>

          <div className="max-h-96 overflow-auto rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">บรรทัด</TableHead>
                  <TableHead>รายการ</TableHead>
                  <TableHead className="w-28">ผล</TableHead>
                  <TableHead>เหตุผล</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plan.rows.map((r) => (
                  <TableRow key={r.line} data-action={r.action}>
                    <TableCell className="text-[12px] text-muted-foreground">{r.line}</TableCell>
                    <TableCell className="text-[13px]">{r.label}</TableCell>
                    <TableCell
                      className={cn(
                        "text-[13px] font-semibold",
                        r.action === "invalid" ? "text-risk-red" : r.action === "unchanged" ? "text-muted-foreground" : "text-risk-green"
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {r.action === "invalid" ? <X className="size-3.5" aria-hidden /> : r.action === "unchanged" ? null : <Check className="size-3.5" aria-hidden />}
                        {ACTION_LABEL[r.action]}
                      </span>
                    </TableCell>
                    <TableCell className="text-[12px] whitespace-normal text-muted-foreground">{r.reasons.join(" · ")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {confirming ? (
            <InlineConfirm
              content={{
                title: `นำเข้า${label}`,
                description: `สร้างใหม่ ${counts.create} · อัปเดต ${counts.update} · ข้าม ${counts.unchanged + counts.invalid} (ไม่เขียน) ไม่ลบข้อมูลเดิม`,
                confirmLabel: "ยืนยันนำเข้า",
                danger: false,
              }}
              onConfirm={commit}
              onCancel={() => setConfirming(false)}
            />
          ) : (
            <Button disabled={writable === 0} onClick={() => setConfirming(true)}>
              ยืนยันนำเข้า
            </Button>
          )}
          {writable === 0 && <p className="text-[12px] text-muted-foreground">ไม่มีแถวที่ต้องเขียน</p>}
          {commitError && (
            <p role="alert" className="text-[13px] font-medium text-risk-red">
              {commitError}
            </p>
          )}
        </section>
      )}

      {result && <ImportResult kind={kind} summary={result} onClose={() => setResult(null)} />}
    </div>
  );
}
