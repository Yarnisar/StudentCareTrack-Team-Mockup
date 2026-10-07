"use client";

/**
 * ภาพรวมระดับโรงเรียน (ผู้ดูแลระบบ) — "ตัวเลขรวม + ตารางรายห้อง"
 * ทุกตัวเลขมาจาก store จริง:
 * - จำนวนนักเรียน: studentsOfRoom(roomId) (เฉพาะที่กำลังศึกษา)
 * - คัดกรองแล้ว: screeningOf(studentId) ที่ status = "certified" ของภาคเรียนปัจจุบัน
 * - ปกติ/เสี่ยง/มีปัญหา: overallRiskOf(studentId) (ฉบับล่าสุดที่รับรองแล้ว)
 * - เคสที่เปิด: activeCaseOf(studentId)
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { RiskDot } from "@/components/shared/risk-badge";
import { PagerNumbered, usePagination } from "@/components/shared/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import type { DimensionResult } from "@/lib/types";

type SortKey = "room" | "progress" | "red";

interface RoomRow {
  roomId: string;
  roomName: string;
  teachers: string;
  total: number;
  screened: number;
  green: number;
  amber: number;
  red: number;
  pending: number;
  openCases: number;
}

export function SchoolOverview() {
  const store = useStore();
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<SortKey>("red");
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);

  const termId = store.currentTerm.termId;
  const academicYear = store.currentTerm.academicYear;

  const allRooms = useMemo<RoomRow[]>(() => {
    return store.classrooms.map((room) => {
      const students = store.studentsOfRoom(room.roomId);
      const teachers = store.homerooms
        .filter((h) => h.roomId === room.roomId && h.academicYear === academicYear && h.endedAt === null)
        .map((h) => store.users.find((u) => u.refId === h.staffId)?.name ?? h.staffId)
        .join(" · ");

      const counts: Record<DimensionResult, number> = { green: 0, amber: 0, red: 0, pending: 0 };
      let screened = 0;
      let openCases = 0;
      for (const s of students) {
        if (store.screeningOf(s.studentId, termId)?.status === "certified") screened += 1;
        const risk = store.overallRiskOf(s.studentId);
        if (risk) counts[risk] += 1;
        if (store.activeCaseOf(s.studentId)) openCases += 1;
      }

      return {
        roomId: room.roomId,
        roomName: room.roomName,
        teachers: teachers || "ยังไม่กำหนด",
        total: students.length,
        screened,
        green: counts.green,
        amber: counts.amber,
        red: counts.red,
        pending: counts.pending,
        openCases,
      };
    });
  }, [store, termId, academicYear]);

  // ห้องที่ยังไม่มีนักเรียนในระบบไม่ต้องแสดง (ข้อมูลทะเบียนของต้นแบบมีเฉพาะบางห้อง)
  const rooms = useMemo(() => allRooms.filter((r) => r.total > 0), [allRooms]);

  const totals = useMemo(() => {
    const sum = (pick: (r: RoomRow) => number) => rooms.reduce((acc, r) => acc + pick(r), 0);
    return {
      total: sum((r) => r.total),
      screened: sum((r) => r.screened),
      green: sum((r) => r.green),
      amber: sum((r) => r.amber),
      red: sum((r) => r.red),
      openCases: sum((r) => r.openCases),
      incompleteRooms: rooms.filter((r) => r.screened < r.total).length,
    };
  }, [rooms]);

  const visible = useMemo(() => {
    const list = rooms.filter((r) => !onlyIncomplete || r.screened < r.total);
    return [...list].sort((a, b) => {
      if (sort === "room") return a.roomName.localeCompare(b.roomName, "th");
      if (sort === "progress") return a.screened / a.total - b.screened / b.total;
      return b.red - a.red;
    });
  }, [rooms, sort, onlyIncomplete]);

  const pager = usePagination(visible, pageSize);
  const rated = totals.green + totals.amber + totals.red;
  const screenedPct = totals.total === 0 ? 0 : Math.round((totals.screened / totals.total) * 100);

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <Kpi label="นักเรียนทั้งหมด" value={totals.total} unit="คน" />
        <Kpi
          label="รับรองผลคัดกรองแล้ว"
          value={screenedPct}
          unit="%"
          note={`${totals.screened.toLocaleString("th-TH")} คน · ${store.currentTerm.label}`}
          tone="text-primary"
        />
        <Kpi label="กลุ่มเสี่ยง" value={totals.amber} unit="คน" tone="text-risk-amber" />
        <Kpi label="กลุ่มมีปัญหา" value={totals.red} unit="คน" tone="text-risk-red" />
        <Kpi
          label="เคสที่เปิดอยู่"
          value={totals.openCases}
          unit="เคส"
          note={`${totals.incompleteRooms} ห้องยังคัดกรองไม่ครบ`}
        />
      </div>

      <Card className="mt-5">
        <CardContent className="p-6">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="text-[15px] font-bold">ความคืบหน้ารายห้องเรียน</h2>
            <span className="flex-1" />
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
              <input
                type="checkbox"
                checked={onlyIncomplete}
                onChange={(e) => {
                  setOnlyIncomplete(e.target.checked);
                  pager.reset();
                }}
              />
              เฉพาะห้องที่ยังคัดกรองไม่ครบ
            </label>
            <label className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <span className="sr-only">การเรียงลำดับ</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortKey);
                  pager.reset();
                }}
                className="h-9 rounded-lg border border-border bg-card px-2.5 text-[13px]"
              >
                <option value="red">เรียงตามกลุ่มมีปัญหามากสุด</option>
                <option value="progress">เรียงตามคัดกรองน้อยสุด</option>
                <option value="room">เรียงตามชื่อห้อง</option>
              </select>
            </label>
          </div>

          {rooms.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted-foreground">
              ยังไม่มีข้อมูลนักเรียนจากงานทะเบียน
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-[13px]">
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
                      const pct = r.total === 0 ? 0 : Math.round((r.screened / r.total) * 100);
                      const incomplete = r.screened < r.total;
                      return (
                        <tr key={r.roomId} className="border-b border-border">
                          <td className="py-2.5 font-semibold">{r.roomName}</td>
                          <td className="py-2.5 text-muted-foreground">{r.teachers}</td>
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
                                  incomplete ? "font-semibold text-risk-amber" : "text-muted-foreground"
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
              </div>

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
            </>
          )}
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardContent className="p-6">
          <h2 className="text-[15px] font-bold">ผลคัดกรองล่าสุด</h2>
          <p className="mt-0.5 mb-3 text-[12px] text-muted-foreground">
            {rated.toLocaleString("th-TH")} คน
            {totals.total - rated > 0 && ` · ยังไม่มีผล ${(totals.total - rated).toLocaleString("th-TH")} คน`}
          </p>
          {rated === 0 ? (
            <p className="text-[13px] text-muted-foreground">ยังไม่มีผลคัดกรองที่รับรองแล้ว</p>
          ) : (
            <>
              <div
                className="flex h-5 overflow-hidden rounded-full bg-muted"
                role="img"
                aria-label={`ปกติ ${totals.green} คน เสี่ยง ${totals.amber} คน มีปัญหา ${totals.red} คน`}
              >
                <div className="bg-risk-green" style={{ width: `${(totals.green / rated) * 100}%` }} />
                <div className="bg-risk-amber" style={{ width: `${(totals.amber / rated) * 100}%` }} />
                <div className="bg-risk-red" style={{ width: `${(totals.red / rated) * 100}%` }} />
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
            </>
          )}
          <Link
            href="/screening"
            className="mt-4 inline-flex text-[13px] font-semibold text-primary hover:underline"
          >
            ไปหน้าการคัดกรอง
          </Link>
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
