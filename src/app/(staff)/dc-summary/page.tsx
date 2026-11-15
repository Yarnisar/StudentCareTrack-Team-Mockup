"use client";

/**
 * สรุปผลคุณลักษณะอันพึงประสงค์ทั้งโรงเรียน (ผู้ดูแลระบบ)
 * ผู้ดูแลระบบเห็นเป็นจำนวนและสถิติรายห้องเท่านั้น ไม่เห็นชื่อนักเรียนและไม่มีลิงก์ไปหน้านักเรียน (หัวข้อ 3.4.1)
 * นับเฉพาะผลที่ครูที่ปรึกษาส่งแล้ว ร่างและที่ยังไม่ประเมินรวมเป็น "ยังไม่ส่งผล" เพื่อให้ตัวเลขรวมครบ
 * ส่งออกได้เฉพาะสถิติ ไม่มีชื่อนักเรียน และบันทึกลงประวัติการส่งออก
 * PROTOTYPE: ข้อมูลทั้งโรงเรียนเป็นข้อมูลจำลอง ไม่เชื่อมกับ store
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { ExportButton } from "@/components/shared/export-button";
import { formatThaiDate } from "@/lib/format";
import { CURRENT_TERM, DEMO_TODAY, SCHOOL_NAME, dcCriteria } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { DC_LEVEL_LABEL, type DcLevel } from "@/lib/types";
import { Filter } from "../dashboard/_shared/process-table";
import { PagerNumbered, usePagination } from "../dashboard/_admin/pagination";
import { allRooms } from "../dashboard/_admin/school-data";
import { CRITERIA_IDS, DC_TERMS, dcRoomsOf, type DcBucket } from "./dc-school-data";

const n = (v: number) => v.toLocaleString("th-TH");

/** ระดับผลใช้โทนม่วงไล่ความเข้ม (สีเขียว/เหลือง/แดงสงวนไว้ให้ผลคัดกรอง) */
const BUCKET: Record<DcBucket, { label: string; bar: string }> = {
  3: { label: DC_LEVEL_LABEL[3], bar: "bg-primary" },
  2: { label: DC_LEVEL_LABEL[2], bar: "bg-violet-400" },
  1: { label: DC_LEVEL_LABEL[1], bar: "bg-violet-200 ring-1 ring-violet-400 ring-inset" },
  0: { label: DC_LEVEL_LABEL[0], bar: "bg-foreground" },
  // ลายขีดเฉียงให้ต่างจากระดับผลด้วยรูปแบบ ไม่ใช่แค่สี
  none: { label: "ยังไม่ส่งผล", bar: "bg-[repeating-linear-gradient(135deg,#cbd5e1_0_2px,#f1f5f9_2px_6px)]" },
};
const BUCKET_ORDER: DcBucket[] = [3, 2, 1, 0, "none"];

export default function DcSummaryPage() {
  const { dcRounds } = useStore();
  const [termId, setTermId] = useState<string>(CURRENT_TERM.termId);
  const [level, setLevel] = useState<number | "all">("all");
  const [pageSize, setPageSize] = useState(10);
  // PROTOTYPE: การเตือนครูเป็นการจำลอง เก็บไว้ในหน้านี้เท่านั้น
  const [reminded, setReminded] = useState<string[]>([]);

  const term = DC_TERMS.find((t) => t.termId === termId) ?? DC_TERMS[0];
  const round = dcRounds.find((r) => r.termId === termId);
  const isCurrent = termId === CURRENT_TERM.termId;
  const closed = !isCurrent || (round ? DEMO_TODAY > round.deadline : false);

  const rooms = useMemo(() => dcRoomsOf(termId).filter((r) => level === "all" || r.level === level), [termId, level]);
  const total = rooms.reduce((s, r) => s + r.total, 0);
  const submitted = rooms.reduce((s, r) => s + r.submitted, 0);
  const failed = rooms.reduce((s, r) => s + r.failed, 0);
  const completeRooms = rooms.filter((r) => r.notSubmitted === 0).length;

  // รายข้อ: เรียงข้อที่มีคนต่ำกว่าดีขึ้นก่อน
  const items = useMemo(() => {
    const rows = CRITERIA_IDS.map((id) => {
      const counts: Record<DcBucket, number> = { 0: 0, 1: 0, 2: 0, 3: 0, none: total - submitted };
      for (const r of rooms) for (const lv of [0, 1, 2, 3] as DcLevel[]) counts[lv] += r.items[id][lv];
      return { id, name: dcCriteria.find((c) => c.criteriaId === id)?.name ?? "", counts };
    });
    return rows.sort((a, b) => b.counts[0] - a.counts[0] || b.counts[1] - a.counts[1] || a.id - b.id);
  }, [rooms, total, submitted]);

  const roomRows = useMemo(
    () => [...rooms].sort((a, b) => b.notSubmitted - a.notSubmitted || b.failed - a.failed || a.room.localeCompare(b.room, "th")),
    [rooms]
  );
  const pager = usePagination(roomRows, pageSize);
  const pending = roomRows.filter((r) => r.notSubmitted > 0);
  const allReminded = pending.length > 0 && pending.every((r) => reminded.includes(r.room));

  const remind = (list: string[]) => setReminded((prev) => [...new Set([...prev, ...list])]);

  const scopeName = level === "all" ? "ทั้งโรงเรียน" : `ม.${level}`;

  return (
    <>
      <PageHeader title="สรุปคุณลักษณะอันพึงประสงค์" subtitle={`${SCHOOL_NAME} · ${term.label}`} />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="flex flex-wrap items-end gap-3">
          <Filter label="ภาคเรียน">
            <NativeSelect value={termId} onChange={(e) => setTermId(e.target.value)} className="w-64 max-w-full">
              {DC_TERMS.map((t) => (
                <option key={t.termId} value={t.termId}>
                  {t.label}
                </option>
              ))}
            </NativeSelect>
          </Filter>
          <Filter label="ระดับชั้น">
            <NativeSelect
              value={level}
              onChange={(e) => {
                setLevel(e.target.value === "all" ? "all" : Number(e.target.value));
                pager.reset();
              }}
              className="w-36"
            >
              <option value="all">ทั้งโรงเรียน</option>
              {[...new Set(allRooms.map((r) => r.level))].map((l) => (
                <option key={l} value={l}>
                  ม.{l}
                </option>
              ))}
            </NativeSelect>
          </Filter>
          <span className="flex-1" />
          <ExportButton
            label="ส่งออกสถิติ"
            filename={`คุณลักษณะฯ-${scopeName}-${termId}`}
            scope={`สรุปคุณลักษณะอันพึงประสงค์ ${scopeName} · ${term.label} (ไม่มีชื่อนักเรียน)`}
            header={[
              "ห้อง",
              "ครูประจำชั้น",
              "นักเรียน",
              "ส่งผลแล้ว",
              "ยังไม่ส่งผล",
              "ผลรวมไม่ผ่าน",
              ...CRITERIA_IDS.flatMap((id) => ([3, 2, 1, 0] as DcLevel[]).map((lv) => `ข้อ ${id} ${DC_LEVEL_LABEL[lv]}`)),
            ]}
            rows={() =>
              roomRows.map((r) => [
                r.room,
                r.teacher,
                r.total,
                r.submitted,
                r.notSubmitted,
                r.failed,
                ...CRITERIA_IDS.flatMap((id) => ([3, 2, 1, 0] as DcLevel[]).map((lv) => r.items[id][lv])),
              ])
            }
          />
        </div>

        {/* ① สรุปบนสุด */}
        <div className="mt-5 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-[34px] leading-none font-bold tabular-nums">{n(submitted)}</span>
            <span className="text-[14px] font-semibold">คนส่งผลแล้ว</span>
            <span className="ml-auto text-[12.5px] text-muted-foreground">จากนักเรียน {n(total)} คน</span>
          </div>
          <div className="mt-3 flex h-1.5 gap-[2px]" role="img" aria-label="สัดส่วนที่ส่งผลแล้ว">
            {total > 0 && submitted > 0 && <span className="rounded-full bg-primary" style={{ width: `${(submitted / total) * 100}%` }} />}
            {total > submitted && <span className="rounded-full bg-risk-none" style={{ width: `${((total - submitted) / total) * 100}%` }} />}
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-muted-foreground">
            <span>
              ผลรวมไม่ผ่าน <b className="text-[15px] text-foreground tabular-nums">{n(failed)}</b> คน
            </span>
            <span>
              ยังไม่ส่งผล <b className="text-[15px] text-foreground tabular-nums">{n(total - submitted)}</b> คน
            </span>
            <span>
              ส่งครบ <b className="text-[15px] text-foreground tabular-nums">{n(completeRooms)}</b> จาก {n(rooms.length)} ห้อง
            </span>
            {round && (
              <span>
                {closed ? "ปิดรับผลแล้ว" : "ส่งผลได้ถึง"} {formatThaiDate(round.deadline)}
              </span>
            )}
          </p>
          {isCurrent && closed && total > submitted && (
            <Link href="/settings?tab=dc" className="mt-3 inline-flex text-[13px] font-semibold text-primary hover:underline">
              เลื่อนวันปิดส่งผล
            </Link>
          )}
        </div>

        {/* ② รายข้อ */}
        <div className="mt-4 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-[15px] font-bold">รายข้อ</h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">เรียงข้อที่มีนักเรียนไม่ผ่านหรือเพียงผ่านขึ้นก่อน</p>
          <div className="mt-3 space-y-2.5">
            {items.map((it) => (
              <div key={it.id} className="grid grid-cols-[minmax(0,1fr)] items-center gap-x-3 gap-y-1 sm:grid-cols-[170px_minmax(0,1fr)_150px]">
                <span className="text-[13px]">
                  {it.id}. {it.name}
                </span>
                <span className="flex h-3 gap-[2px]" role="img" aria-label={`ผลข้อ ${it.id}`}>
                  {BUCKET_ORDER.map((b) =>
                    it.counts[b] > 0 && total > 0 ? (
                      <i key={b} className={`rounded-[3px] ${BUCKET[b].bar}`} style={{ width: `${(it.counts[b] / total) * 100}%` }} />
                    ) : null
                  )}
                </span>
                <span className="text-[12px] text-muted-foreground tabular-nums">
                  {it.counts[0] > 0 && <b className="text-foreground">ไม่ผ่าน {n(it.counts[0])}</b>}
                  {it.counts[0] > 0 && it.counts[1] > 0 && " · "}
                  {it.counts[1] > 0 && <>ผ่าน {n(it.counts[1])}</>}
                  {it.counts[0] === 0 && it.counts[1] === 0 && "ทุกคนดีขึ้นไป"}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
            {BUCKET_ORDER.map((b) => (
              <span key={b} className="inline-flex items-center gap-1.5">
                <i className={`inline-block size-2.5 rounded-[3px] ${BUCKET[b].bar}`} /> {BUCKET[b].label}
              </span>
            ))}
          </p>
        </div>

        {/* ③ รายห้อง */}
        <Card className="mt-4">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="min-w-0 flex-1 text-[15px] font-bold">
                รายห้อง · {n(rooms.length)} ห้อง
              </h2>
              {isCurrent && !closed && pending.length > 0 && (
                <Button size="sm" variant="outline" disabled={allReminded} onClick={() => remind(pending.map((r) => r.room))}>
                  {allReminded ? <Check className="size-3.5" /> : <Bell className="size-3.5" />}
                  {allReminded ? `เตือนครูแล้ว ${n(pending.length)} ห้อง` : `เตือนครูห้องที่ยังไม่ครบ ${n(pending.length)} ห้อง`}
                </Button>
              )}
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-[13.5px]">
                <thead>
                  <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
                    <th className="w-20 py-2 font-medium">ห้อง</th>
                    <th className="py-2 font-medium">ครูประจำชั้น</th>
                    <th className="w-20 py-2 text-center font-medium">นักเรียน</th>
                    <th className="w-24 py-2 text-center font-medium">ส่งผลแล้ว</th>
                    <th className="w-24 py-2 text-center font-medium">ไม่ผ่าน</th>
                    <th className="w-28 py-2 text-center font-medium">ยังไม่ส่งผล</th>
                    <th className="w-28" />
                  </tr>
                </thead>
                <tbody>
                  {pager.slice.map((r) => (
                    <tr key={r.room} className="border-b border-border">
                      <td className="py-2.5 font-semibold">{r.room}</td>
                      <td className="py-2.5 text-muted-foreground">{r.teacher}</td>
                      <td className="py-2.5 text-center text-muted-foreground tabular-nums">{n(r.total)}</td>
                      <td className="py-2.5 text-center tabular-nums">{n(r.submitted)}</td>
                      <td className={`py-2.5 text-center tabular-nums ${r.failed > 0 ? "font-bold" : "text-muted-foreground"}`}>
                        {r.failed > 0 ? n(r.failed) : "–"}
                      </td>
                      <td className={`py-2.5 text-center tabular-nums ${r.notSubmitted > 0 ? "font-bold" : "text-muted-foreground"}`}>
                        {r.notSubmitted > 0 ? n(r.notSubmitted) : "–"}
                      </td>
                      <td className="py-2 text-right">
                        {isCurrent && !closed && r.notSubmitted > 0 && (
                          <Button size="sm" variant="outline" disabled={reminded.includes(r.room)} onClick={() => remind([r.room])}>
                            {reminded.includes(r.room) ? <Check className="size-3.5" /> : <Bell className="size-3.5" />}
                            {reminded.includes(r.room) ? "เตือนแล้ว" : "เตือนครู"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
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
              onPageSize={(size) => {
                setPageSize(size);
                pager.reset();
              }}
            />
          </CardContent>
        </Card>

        <p className="mt-4 text-[12px] text-muted-foreground">
          แสดงเป็นจำนวนเท่านั้น ไม่มีชื่อนักเรียน · ข้อมูลทั้งโรงเรียนในต้นแบบเป็นข้อมูลจำลอง ทำงานในหน้าอื่นแล้วตัวเลขตรงนี้ไม่เปลี่ยน
        </p>
      </div>
    </>
  );
}
