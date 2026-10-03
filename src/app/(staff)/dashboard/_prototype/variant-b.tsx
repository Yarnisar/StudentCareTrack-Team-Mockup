"use client";

/**
 * PROTOTYPE — แบบ B "ไล่ลงตามระดับชั้น (drill-down)"
 * แนวคิด: โรงเรียนมี 48 ห้อง การเอามากองในตารางเดียวยังเยอะเกินไป
 * จึงให้เลือกระดับชั้นก่อน แล้วค่อยลงไปดูรายชื่อนักเรียนของระดับนั้น
 * แบ่งหน้าแบบเรียบ ก่อนหน้า/ถัดไป เพราะคนอ่านไล่ทีละหน้า ไม่ได้กระโดด
 */

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RiskBadge } from "@/components/shared/risk-badge";
import { PagerSimple, usePagination } from "./pagination";
import { LEVELS, studentsInScope, totalsOf, type Risk, type Scope } from "./school-data";

export const VARIANT_B_NAME = "ไล่ตามระดับชั้น + รายชื่อแบ่งหน้า";

type Filter = "all" | Risk | "not_screened";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "red", label: "มีปัญหา" },
  { key: "amber", label: "เสี่ยง" },
  { key: "green", label: "ปกติ" },
  { key: "not_screened", label: "ยังไม่คัดกรอง" },
];

export function VariantB({ scope }: { scope: Scope }) {
  const totals = totalsOf(scope);
  const students = studentsInScope(scope);
  const [level, setLevel] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const levelCards = useMemo(
    () =>
      LEVELS.map((lv) => {
        const own = students.filter((s) => s.level === lv);
        return {
          level: lv,
          total: own.length,
          screened: own.filter((s) => s.screened).length,
          red: own.filter((s) => s.risk === "red").length,
          amber: own.filter((s) => s.risk === "amber").length,
        };
      }).filter((c) => c.total > 0),
    [students]
  );

  const filtered = useMemo(() => {
    let list = level === null ? students : students.filter((s) => s.level === level);
    if (filter === "not_screened") list = list.filter((s) => !s.screened);
    else if (filter !== "all") list = list.filter((s) => s.risk === filter);
    return list;
  }, [students, level, filter]);

  const pager = usePagination(filtered, 20);

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mb-5 flex flex-wrap gap-4 text-[13.5px]">
        <Summary label="นักเรียนทั้งหมด" value={`${totals.total.toLocaleString("th-TH")} คน`} />
        <Summary
          label="คัดกรองแล้ว"
          value={`${Math.round((totals.screened / totals.total) * 100)}%`}
        />
        <Summary label="กลุ่มเสี่ยง" value={`${totals.amber} คน`} tone="text-risk-amber" />
        <Summary label="กลุ่มมีปัญหา" value={`${totals.red} คน`} tone="text-risk-red" />
        <Summary label="เคสที่เปิดอยู่" value={`${totals.openCases} เคส`} />
      </div>

      <h2 className="mb-2.5 text-[15.5px] font-bold">เลือกระดับชั้นเพื่อดูรายละเอียด</h2>
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {levelCards.map((c) => {
          const pct = Math.round((c.screened / c.total) * 100);
          const active = level === c.level;
          return (
            <button
              key={c.level}
              type="button"
              onClick={() => {
                setLevel(active ? null : c.level);
                pager.reset();
              }}
              className={`rounded-xl border p-4 text-left transition-colors ${
                active
                  ? "border-primary bg-accent"
                  : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
              }`}
            >
              <div className="text-[15px] font-bold">ม.{c.level}</div>
              <div className="mt-0.5 text-[12px] text-muted-foreground">{c.total} คน</div>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={pct >= 90 ? "h-full bg-risk-green" : "h-full bg-risk-amber"}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1.5 text-[11.5px] text-muted-foreground">คัดกรองแล้ว {pct}%</div>
              <div className="mt-2 flex gap-2 text-[11.5px] font-semibold">
                <span className="text-risk-amber">เสี่ยง {c.amber}</span>
                <span className="text-risk-red">ปัญหา {c.red}</span>
              </div>
            </button>
          );
        })}
      </div>

      <Card className="mt-5">
        <CardContent className="p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="text-[15.5px] font-bold">
              {level === null ? "รายชื่อนักเรียนทั้งหมด" : `รายชื่อนักเรียน ม.${level}`}
            </h2>
            <span className="flex-1" />
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  setFilter(f.key);
                  pager.reset();
                }}
                className={`h-8 rounded-lg border px-3 text-[12.5px] transition-colors ${
                  filter === f.key
                    ? "border-primary bg-accent font-semibold text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="divide-y divide-border">
            {pager.slice.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-2.5">
                <span className="w-16 shrink-0 text-[12px] text-muted-foreground">{s.id}</span>
                <span className="min-w-0 flex-1 text-[13.5px] font-medium">{s.name}</span>
                <span className="w-20 shrink-0 text-[12.5px] text-muted-foreground">{s.room}</span>
                <span className="w-16 shrink-0 text-right text-[12px] text-muted-foreground">
                  เลขที่ {s.classNo}
                </span>
                <span className="w-24 shrink-0 text-right">
                  {s.risk ? (
                    <RiskBadge group={s.risk} />
                  ) : (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground">
                      ยังไม่คัดกรอง
                    </span>
                  )}
                </span>
                <span className="w-24 shrink-0 text-right text-[12px] text-muted-foreground">
                  {s.hasCase ? "เปิดเคสแล้ว" : ""}
                </span>
              </div>
            ))}
            {pager.slice.length === 0 && (
              <p className="py-10 text-center text-[13px] text-muted-foreground">
                ไม่มีนักเรียนตรงเงื่อนไขที่เลือก
              </p>
            )}
          </div>

          <PagerSimple
            page={pager.page}
            totalPages={pager.totalPages}
            setPage={pager.setPage}
            from={pager.from}
            to={pager.to}
            total={pager.total}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Summary({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-2.5">
      <div className="text-[11.5px] text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-[16px] font-bold ${tone ?? ""}`}>{value}</div>
    </div>
  );
}
