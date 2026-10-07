"use client";

import { formatThaiDateTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import { IMPORT_KIND_LABEL } from "@/lib/types";

/** ประวัติการนำเข้า (import_jobs) — ไม่ลบ เก็บเฉพาะจำนวน */
export function ImportHistory() {
  const store = useStore();
  const jobs = store.importJobs;

  return (
    <section className="space-y-2" aria-label="ประวัติการนำเข้า">
      <h2 className="text-[15px] font-bold">ประวัติการนำเข้า</h2>
      {jobs.length === 0 ? (
        <p className="text-[12px] text-muted-foreground">ยังไม่มีการนำเข้า</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card" data-testid="import-history">
          {jobs.slice(0, 10).map((j) => (
            <li key={j.jobId} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-2.5">
              <span className="text-[13px] font-semibold">{IMPORT_KIND_LABEL[j.kind]}</span>
              <span className="min-w-0 flex-1 truncate text-[13px]">{j.filename}</span>
              <span className="text-[13px]">
                สร้าง {j.createdRows} · อัปเดต {j.updatedRows} · ข้าม {j.unchangedRows + j.invalidRows}
              </span>
              <span className="text-[12px] text-muted-foreground">
                {store.nameOf(j.committedBy)} · {formatThaiDateTime(j.committedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
