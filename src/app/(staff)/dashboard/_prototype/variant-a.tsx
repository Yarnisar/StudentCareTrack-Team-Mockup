"use client";

/**
 * PROTOTYPE — แบบ A "ตัวเลขรวม + ตารางรายห้องแบ่งหน้า"
 * แนวคิด: แอดมินดูโรงเรียนเป็นก้อนเดียว ตัวเลขรวมขึ้นก่อน
 * แล้วไล่ดูรายห้องในตารางเดียวที่เรียง/กรองได้ แบ่งหน้าแบบมีปุ่มเลขหน้าเต็มรูปแบบ
 */

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RiskDot } from "@/components/shared/risk-badge";
import { PagerNumbered, usePagination } from "./pagination";
import { roomsInScope, totalsOf, type Scope } from "./school-data";

export const VARIANT_A_NAME = "ตัวเลขรวม + ตารางรายห้อง";

type SortKey = "room" | "progress" | "red";

export function VariantA({ scope }: { scope: Scope }) {
  const totals = totalsOf(scope);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<SortKey>("red");
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  const rooms = useMemo(() => {
    const list = roomsInScope(scope).filter((r) => !onlyOverdue || r.overdue);
    return [...list].sort((a, b) => {
      if (sort === "room") return a.room.localeCompare(b.room, "th");
      if (sort === "progress") return a.screened / a.total - b.screened / b.total;
      return b.red - a.red;
    });
  }, [scope, sort, onlyOverdue]);

  const pager = usePagination(rooms, pageSize);

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <Kpi label="นักเรียนทั้งหมด" value={totals.total} unit="คน" />
        <Kpi
          label="คัดกรองแล้ว"
          value={Math.round((totals.screened / totals.total) * 100)}
          unit="%"
          note={`${totals.screened.toLocaleString("th-TH")} คน`}
          tone="text-primary"
        />
        <Kpi label="กลุ่มเสี่ยง" value={totals.amber} unit="คน" tone="text-risk-amber" />
        <Kpi label="กลุ่มมีปัญหา" value={totals.red} unit="คน" tone="text-risk-red" />
        <Kpi
          label="ห้องที่คัดกรองไม่ทัน"
          value={totals.overdueRooms}
          unit={`จาก ${roomsInScope(scope).length} ห้อง`}
          tone="text-risk-red"
        />
      </div>

      <Card className="mt-5">
        <CardContent className="p-6">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="text-[15.5px] font-bold">ความคืบหน้ารายห้องเรียน</h2>
            <span className="flex-1" />
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
              <input
                type="checkbox"
                checked={onlyOverdue}
                onChange={(e) => {
                  setOnlyOverdue(e.target.checked);
                  pager.reset();
                }}
              />
              เฉพาะห้องที่ยังคัดกรองไม่ครบ
            </label>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortKey);
                pager.reset();
              }}
              className="h-9 rounded-lg border border-border bg-card px-2.5 text-[13px]"
            >
              <option value="red">เรียงตามกลุ่มแดงมากสุด</option>
              <option value="progress">เรียงตามคัดกรองน้อยสุด</option>
              <option value="room">เรียงตามชื่อห้อง</option>
            </select>
          </div>

          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
                <th className="w-24 py-2 font-medium">ห้อง</th>
                <th className="py-2 font-medium">ครูประจำชั้น</th>
                <th className="w-52 py-2 font-medium">ความคืบหน้าการคัดกรอง</th>
                <th className="w-20 py-2 text-center font-medium">ปกติ</th>
                <th className="w-20 py-2 text-center font-medium">เสี่ยง</th>
                <th className="w-20 py-2 text-center font-medium">มีปัญหา</th>
                <th className="w-24 py-2 text-center font-medium">เคสที่เปิด</th>
              </tr>
            </thead>
            <tbody>
              {pager.slice.map((r) => {
                const pct = Math.round((r.screened / r.total) * 100);
                return (
                  <tr key={r.room} className="border-b border-border">
                    <td className="py-2.5 font-semibold">{r.room}</td>
                    <td className="py-2.5 text-muted-foreground">{r.teacher}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={pct >= 90 ? "h-full bg-risk-green" : "h-full bg-risk-amber"}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span
                          className={`w-24 shrink-0 text-[12px] ${
                            r.overdue ? "font-semibold text-risk-red" : "text-muted-foreground"
                          }`}
                        >
                          {r.screened}/{r.total} ({pct}%)
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 text-center text-muted-foreground">{r.green}</td>
                    <td className="py-2.5 text-center font-semibold text-risk-amber">{r.amber}</td>
                    <td className="py-2.5 text-center font-bold text-risk-red">{r.red}</td>
                    <td className="py-2.5 text-center text-muted-foreground">{r.openCases}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <PagerNumbered
            page={pager.page}
            totalPages={pager.totalPages}
            setPage={pager.setPage}
            from={pager.from}
            to={pager.to}
            total={pager.total}
            pageSize={pageSize}
            onPageSize={(n) => {
              setPageSize(n);
              pager.reset();
            }}
          />
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardContent className="p-6">
          <h2 className="mb-3 text-[15.5px] font-bold">สัดส่วนผลคัดกรองทั้งหมด</h2>
          <div className="flex h-5 overflow-hidden rounded-full bg-muted">
            <div
              className="bg-risk-green"
              style={{ width: `${(totals.green / totals.screened) * 100}%` }}
            />
            <div
              className="bg-risk-amber"
              style={{ width: `${(totals.amber / totals.screened) * 100}%` }}
            />
            <div
              className="bg-risk-red"
              style={{ width: `${(totals.red / totals.screened) * 100}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-5 text-[13px]">
            <span className="flex items-center gap-1.5">
              <RiskDot group="green" /> ปกติ {totals.green.toLocaleString("th-TH")} คน
            </span>
            <span className="flex items-center gap-1.5">
              <RiskDot group="amber" /> เสี่ยง {totals.amber.toLocaleString("th-TH")} คน
            </span>
            <span className="flex items-center gap-1.5">
              <RiskDot group="red" /> มีปัญหา {totals.red.toLocaleString("th-TH")} คน
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  label,
  value,
  unit,
  note,
  tone,
}: {
  label: string;
  value: number;
  unit: string;
  note?: string;
  tone?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-[13px] font-semibold text-muted-foreground">{label}</div>
        <div className={`mt-2 text-3xl font-bold ${tone ?? ""}`}>
          {value.toLocaleString("th-TH")}{" "}
          <span className="text-[13px] font-medium text-muted-foreground">{unit}</span>
        </div>
        {note && <div className="mt-1 text-[12px] text-muted-foreground">{note}</div>}
      </CardContent>
    </Card>
  );
}
