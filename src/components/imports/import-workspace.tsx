"use client";

import { useState } from "react";
import { cn } from "cn";
import { IMPORT_KINDS, IMPORT_KIND_LABEL, type ImportKind } from "@/lib/types";
import { ImportHistory } from "./import-history";
import { KindPanel } from "./kind-panel";

/** นำเข้าข้อมูลโรงเรียน (โหมดเดี่ยว) — เลือกประเภทแล้วทำทีละขั้น */
export function ImportWorkspace() {
  const [kind, setKind] = useState<ImportKind>("students");

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-5 lg:p-8">
      <div role="group" aria-label="ประเภทข้อมูล" className="flex flex-wrap gap-1.5">
        {IMPORT_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={k === kind}
            onClick={() => setKind(k)}
            className={cn(
              "rounded-lg border px-4 py-1.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
              k === kind ? "border-primary bg-primary/5 font-bold" : "border-border bg-card hover:bg-muted"
            )}
          >
            {IMPORT_KIND_LABEL[k]}
          </button>
        ))}
      </div>
      <KindPanel key={kind} kind={kind} />
      <ImportHistory />
    </div>
  );
}
