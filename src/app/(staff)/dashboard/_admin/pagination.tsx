"use client";

/**
 * การแบ่งหน้าของตารางรายห้อง (ภาพรวมผู้ดูแลระบบ)
 */

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export function usePagination<T>(items: T[], pageSize: number) {
  const [requestedPage, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // ถ้าตัวกรองเปลี่ยนจนจำนวนหน้าลดลง ให้หนีบกลับมาหน้าสุดท้ายที่มีอยู่จริง
  // คำนวณตอน render ไม่ใช้ effect เพื่อไม่ให้เกิดการ render ซ้อน
  const page = Math.min(requestedPage, totalPages - 1);

  const slice = useMemo(
    () => items.slice(page * pageSize, page * pageSize + pageSize),
    [items, page, pageSize]
  );

  return {
    page,
    setPage,
    totalPages,
    slice,
    from: items.length === 0 ? 0 : page * pageSize + 1,
    to: Math.min((page + 1) * pageSize, items.length),
    total: items.length,
    reset: () => setPage(0),
  };
}

/** เลขหน้าที่จะแสดง พร้อมจุดไข่ปลาเมื่อหน้าเยอะ */
function pageWindow(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i);
  const out: (number | "gap")[] = [0];
  const start = Math.max(1, page - 1);
  const end = Math.min(totalPages - 2, page + 1);
  if (start > 1) out.push("gap");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < totalPages - 2) out.push("gap");
  out.push(totalPages - 1);
  return out;
}

const BTN =
  "flex h-9 min-w-9 items-center justify-center rounded-lg border border-border px-2.5 text-[13px] font-medium transition-colors hover:bg-muted disabled:opacity-35 disabled:hover:bg-transparent";

/** แบบเต็ม: ปุ่มเลขหน้า + ไปหน้าแรก/สุดท้าย + เลือกจำนวนแถวต่อหน้า */
export function PagerNumbered({
  page,
  totalPages,
  setPage,
  from,
  to,
  total,
  pageSize,
  onPageSize,
}: {
  page: number;
  totalPages: number;
  setPage: (p: number) => void;
  from: number;
  to: number;
  total: number;
  pageSize?: number;
  onPageSize?: (n: number) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
      <span className="text-[13px] text-muted-foreground">
        แสดง {from}–{to} จาก {total.toLocaleString("th-TH")} รายการ
      </span>

      {onPageSize && (
        <label className="ml-2 flex items-center gap-1.5 text-[13px] text-muted-foreground">
          แถวต่อหน้า
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="h-9 rounded-lg border border-border bg-card px-2 text-[13px]"
          >
            {[10, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      )}

      <span className="flex-1" />

      <div className="flex items-center gap-1">
        <button type="button" className={BTN} onClick={() => setPage(0)} disabled={page === 0} aria-label="หน้าแรก">
          <ChevronsLeft className="size-4" />
        </button>
        <button
          type="button"
          className={BTN}
          onClick={() => setPage(page - 1)}
          disabled={page === 0}
          aria-label="หน้าก่อนหน้า"
        >
          <ChevronLeft className="size-4" />
        </button>

        {pageWindow(page, totalPages).map((p, i) =>
          p === "gap" ? (
            <span key={`gap${i}`} className="px-1 text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              aria-current={p === page ? "page" : undefined}
              className={
                p === page
                  ? "flex h-9 min-w-9 items-center justify-center rounded-lg bg-primary px-2.5 text-[13px] font-bold text-primary-foreground"
                  : BTN
              }
            >
              {p + 1}
            </button>
          )
        )}

        <button
          type="button"
          className={BTN}
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages - 1}
          aria-label="หน้าถัดไป"
        >
          <ChevronRight className="size-4" />
        </button>
        <button
          type="button"
          className={BTN}
          onClick={() => setPage(totalPages - 1)}
          disabled={page >= totalPages - 1}
          aria-label="หน้าสุดท้าย"
        >
          <ChevronsRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
