"use client";

/**
 * ภาพรวมของแอดมินโรงเรียน (UC1) จัดลำดับการมอง 3 ชั้น
 * ① เรื่องที่ต้องตัดสินใจ (เช่น คัดกรองค้างหลังปิดรอบ → ขยายช่วงเวลา / เตือนครู)
 * ② การ์ด 4 กระบวนการ ตัวเลขใหญ่คืองานค้าง กดการ์ดเพื่อเรียงห้องตามกระบวนการนั้น
 * ③ ห้องที่ต้องตามก่อน 5 ห้อง + ผลคัดกรอง → ตารางทุกห้องเปิดดูเมื่อต้องการ
 * ตัวกรองปีการศึกษา / ภาคเรียน / ระดับชั้น / ห้อง (รายงาน 3.2.1) ซ่อนไว้หลังปุ่ม "ตัวกรอง" และส่งออกตามตัวกรองปัจจุบัน (Subflow C)
 * แอดมินเห็นเป็นจำนวนเท่านั้น ไม่เห็นชื่อนักเรียนหรือสถานะรายคน (UC1 Post-condition 3, หัวข้อ 3.4.1)
 * ส่งออกได้เฉพาะสถิติรายห้องที่ไม่มีชื่อนักเรียน (UC1 Scenario A ข้อ 3)
 */

import { useState } from "react";
import Link from "next/link";
import { Bell, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { ExportButton } from "@/components/shared/export-button";
import { CURRENT_TERM } from "@/lib/mock-data";
import { RISK_LABEL } from "@/lib/types";
import { useStore } from "@/lib/store";
import {
  concernsOf,
  FOCUS_PRIMARY,
  FOCUS_SECONDARY,
  Filter,
  FocusBox,
  ProcessCards,
  RiskPanel,
  type Concern,
  type PickStatus,
} from "../_shared/process-table";
import { PROCESS_LABEL, PROCESS_ORDER, STATUS_LABEL, type ProcessKey, type Status } from "../_homeroom/process-status";
import { PagerNumbered, usePagination } from "./pagination";
import { RiskByLevel } from "./risk-by-level";
import {
  adminItems,
  adminSummaries,
  allRooms,
  allStudents,
  dimensionTallies,
  LEVELS,
  riskCounts,
  type AdminItem,
  type Room,
} from "./school-data";

type StatusFilter = PickStatus | "all";

const STATUS_FILTER_LABEL: Record<StatusFilter, string> = {
  open: "งานที่ต้องทำ",
  overdue: STATUS_LABEL.overdue,
  near_due: STATUS_LABEL.near_due,
  pending: STATUS_LABEL.pending,
  watch: STATUS_LABEL.watch,
  done: STATUS_LABEL.done,
  all: "ทุกสถานะ",
};

const YEARS = [CURRENT_TERM.academicYear, CURRENT_TERM.academicYear - 1];
const SEMESTERS = [1, 2];
const TOP_ROOMS = 5;

const matches = (item: AdminItem, process: ProcessKey | "all", status: StatusFilter) =>
  (process === "all" || item.process === process) &&
  (status === "all" || (status === "open" ? item.status !== "done" && item.status !== "watch" : item.status === status));

const n = (v: number) => v.toLocaleString("th-TH");

export function AdminOverview() {
  const { assessmentWindows: windows } = useStore();
  const [year, setYear] = useState(CURRENT_TERM.academicYear);
  const [semester, setSemester] = useState(CURRENT_TERM.semester);
  const [level, setLevel] = useState<number | "all">("all");
  const [room, setRoom] = useState<string | "all">("all");
  const [status, setStatus] = useState<StatusFilter>("open");
  const [process, setProcess] = useState<ProcessKey | "all">("all");
  // กระบวนการที่จะส่งออก แยกจากตัวกรองบนหน้าจอ เพื่อเลือกส่งเฉพาะเรื่องที่ต้องการได้
  const [exportProcess, setExportProcess] = useState<ProcessKey | "all">("all");
  const [pageSize, setPageSize] = useState(10);
  const [showAllRooms, setShowAllRooms] = useState(false);
  // เรียงห้องที่ต้องตามก่อนตาม "งานค้าง" (ตามการ์ดที่เลือก) หรือ "กลุ่มมีปัญหา" (ผลคัดกรอง)
  const [rankBy, setRankBy] = useState<"backlog" | "red">("backlog");
  // PROTOTYPE: การเตือนครูเป็นการจำลอง เก็บไว้ในหน้านี้เท่านั้น (room → เรื่องที่เตือน)
  const [reminded, setReminded] = useState<Record<string, string>>({});

  // PROTOTYPE: ข้อมูลจำลองมีเฉพาะภาคเรียนปัจจุบัน ภาคเรียนอื่นจึงไม่พบข้อมูล (UC1 Alternate Flow)
  const termLabel = `ภาคเรียนที่ ${semester}/${year}`;
  const noData = year !== CURRENT_TERM.academicYear || semester !== CURRENT_TERM.semester;

  const students = noData
    ? []
    : allStudents.filter((s) => (level === "all" || s.level === level) && (room === "all" || s.room === room));
  const rooms = allRooms.filter((r) => (level === "all" || r.level === level) && (room === "all" || r.room === room));
  const items = adminItems(students, windows);
  const summaries = adminSummaries(items, students, windows);
  const concerns = concernsOf(summaries);
  const selectedRoom = room === "all" ? null : allRooms.find((r) => r.room === room);

  const scopeLabel = selectedRoom ? selectedRoom.room : level === "all" ? "ทั้งโรงเรียน" : `ม.${level} ทุกห้อง`;
  const selectionLabel = [process === "all" ? null : PROCESS_LABEL[process], STATUS_FILTER_LABEL[status]]
    .filter(Boolean)
    .join(" · ");
  // เรียงห้องจากงานที่ตรงกับการเลือกมากที่สุด
  const roomRows = rooms
    .map((r) => ({ room: r, own: items.filter((i) => i.student.room === r.room) }))
    .map(({ room: r, own }) => ({ room: r, own, selected: own.filter((i) => matches(i, process, status)).length }))
    .sort((a, b) => b.selected - a.selected || a.room.room.localeCompare(b.room.room, "th"));
  // ทุกกระบวนการรวมกัน คนเดียวนับได้หลายงาน จึงไม่ใช้หน่วย "คน"
  const roomUnit = process === "all" ? "งาน" : process === "care" ? "กรณี" : "คน";
  const topRooms = roomRows.filter((r) => r.selected > 0).slice(0, TOP_ROOMS);
  const roomPager = usePagination(roomRows, pageSize);
  // เรียงตามจำนวนนักเรียนกลุ่มมีปัญหาของห้อง (เป็นจำนวนเท่านั้น)
  const redRows = rooms
    .map((r) => {
      const own = students.filter((s) => s.room === r.room);
      return { room: r, red: own.filter((s) => s.risk === "red").length, total: own.length };
    })
    .filter((r) => r.red > 0)
    .sort((a, b) => b.red - a.red || a.room.room.localeCompare(b.room.room, "th"))
    .slice(0, TOP_ROOMS);

  const pick = (p: ProcessKey, s: PickStatus) => {
    const same = p === process && s === status;
    setProcess(same ? "all" : p);
    setStatus(same ? "open" : s);
    roomPager.reset();
  };
  const openRoom = (r: Room) => {
    setLevel(r.level);
    setRoom(r.room);
  };
  const backToSchool = () => {
    setRoom("all");
    roomPager.reset();
  };
  const resetTerm = () => {
    setYear(CURRENT_TERM.academicYear);
    setSemester(CURRENT_TERM.semester);
  };

  /** ห้องที่มีงานค้างตามเรื่องนั้น */
  const roomsWith = (c: Concern) =>
    rooms.filter((r) => items.some((i) => i.student.room === r.room && i.process === c.process && i.status === c.status));
  const remind = (list: Room[], topic: string) =>
    setReminded((prev) => ({ ...prev, ...Object.fromEntries(list.map((r) => [r.room, topic])) }));

  const count = (own: AdminItem[], p: ProcessKey, s: Status) => own.filter((i) => i.process === p && i.status === s).length;
  const scopeText = selectedRoom ? `สรุปห้อง ${selectedRoom.room}` : level === "all" ? "สรุปทั้งโรงเรียน" : `สรุป ม.${level}`;

  const exportProcesses: ProcessKey[] = exportProcess === "all" ? PROCESS_ORDER : [exportProcess];
  const statusesOf = (p: ProcessKey): Status[] => (p === "behavior" ? ["watch"] : ["done", "pending", "near_due", "overdue"]);
  // ผลคัดกรองและรายมิติรวมอยู่ในกระบวนการคัดกรอง
  const withRisk = exportProcess === "all" || exportProcess === "screening";
  const exportTopic = exportProcess === "all" ? "ทุกกระบวนการ" : PROCESS_LABEL[exportProcess];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8">
      {/* หัว: ขอบเขตที่กำลังดู + ปุ่มตัวกรอง/ส่งออก */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          {selectedRoom && (
            <button
              type="button"
              onClick={backToSchool}
              className="mb-1 flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" /> {level === "all" ? "ทั้งโรงเรียน" : `ม.${level} ทุกห้อง`}
            </button>
          )}
          <h2 className="text-[22px] leading-tight font-bold">{scopeLabel}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
            {termLabel}
            {!noData && <> · {n(students.length)} คน</>}
            {selectedRoom && <> · {selectedRoom.teacher}</>}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
          <Filter label="ปีการศึกษา">
            <NativeSelect value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-32">
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </NativeSelect>
          </Filter>
          <Filter label="ภาคเรียน">
            <NativeSelect value={semester} onChange={(e) => setSemester(Number(e.target.value))} className="w-28">
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </NativeSelect>
          </Filter>
          <Filter label="ระดับชั้น">
            <NativeSelect
              value={level}
              onChange={(e) => {
                setLevel(e.target.value === "all" ? "all" : Number(e.target.value));
                setRoom("all");
                roomPager.reset();
              }}
              className="w-32"
            >
              <option value="all">ทุกระดับชั้น</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  ม.{l}
                </option>
              ))}
            </NativeSelect>
          </Filter>
          <Filter label="ห้องเรียน">
            <NativeSelect
              value={room}
              onChange={(e) => {
                const next = allRooms.find((r) => r.room === e.target.value);
                if (next) openRoom(next);
                else backToSchool();
              }}
              className="w-32"
            >
              <option value="all">ทุกห้อง</option>
              {allRooms
                .filter((r) => level === "all" || r.level === level)
                .map((r) => (
                  <option key={r.room} value={r.room}>
                    {r.room}
                  </option>
                ))}
            </NativeSelect>
          </Filter>
        <span className="flex-1" />
        <Filter label="ส่งออก">
          <NativeSelect
            value={exportProcess}
            onChange={(e) => setExportProcess(e.target.value as ProcessKey | "all")}
            className="w-44"
            aria-label="กระบวนการที่จะส่งออก"
          >
            <option value="all">ทุกกระบวนการ</option>
            {PROCESS_ORDER.map((p) => (
              <option key={p} value={p}>
                {PROCESS_LABEL[p]}
              </option>
            ))}
          </NativeSelect>
        </Filter>
        <ExportButton
          label="ส่งออกสรุป"
          disabled={noData}
          filename={`สรุป${exportProcess === "all" ? "" : `${PROCESS_LABEL[exportProcess]}`}-${selectedRoom ? selectedRoom.room.replace("/", "-") : level === "all" ? "ทั้งโรงเรียน" : `ม${level}`}-${CURRENT_TERM.termId}`}
          scope={`${scopeText} · ${exportTopic} · ${CURRENT_TERM.label} (ไม่มีชื่อนักเรียน)`}
          header={[
            "ห้อง",
            "ครูประจำชั้น",
            "นักเรียน",
            ...exportProcesses.flatMap((p) => statusesOf(p).map((s) => `${PROCESS_LABEL[p]}: ${STATUS_LABEL[s]}`)),
          ]}
          summary={() => {
            const risk = riskCounts(students);
            const screened = risk.green + risk.amber + risk.red;
            return [
              [`สรุป${exportProcess === "all" ? "รวม" : exportTopic}: ${scopeLabel}`, termLabel],
              ["หัวข้อ", "รายการ", "จำนวน"],
              ["นักเรียน", "ทั้งหมด", students.length],
              ...(withRisk
                ? [
                    ["ผลคัดกรอง", "คัดกรองแล้ว", screened],
                    ...(["green", "amber", "red"] as const).map((g) => ["ผลคัดกรอง", RISK_LABEL[g], risk[g]]),
                    ["ผลคัดกรอง", "ยังไม่คัดกรอง", students.length - screened],
                    ...dimensionTallies(students).flatMap((d) => [
                      [`รายมิติ: ${d.label}`, "มีปัญหา", d.red],
                      [`รายมิติ: ${d.label}`, "เสี่ยง", d.amber],
                    ]),
                  ]
                : []),
              ...summaries
                .filter((p) => exportProcesses.includes(p.process))
                .flatMap((p) => statusesOf(p.process).map((st) => [PROCESS_LABEL[p.process], STATUS_LABEL[st], p.counts[st]])),
              [],
              [`สถิติรายห้อง: ${rooms.length} ห้อง`],
            ];
          }}
          rows={() =>
            roomRows.map(({ room: r, own }) => [
              r.room,
              r.teacher,
              r.total,
              ...exportProcesses.flatMap((p) => statusesOf(p).map((s) => count(own, p, s))),
            ])
          }
        />
      </div>

      {noData ? (
        <Card className="mt-5">
          <CardContent className="py-12 text-center text-[13px] text-muted-foreground">
            <p>ไม่พบข้อมูลของ{termLabel} ลองเปลี่ยนตัวกรอง</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={resetTerm}>
              กลับไปภาคเรียนปัจจุบัน
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ① เรื่องที่ต้องตัดสินใจ */}
          <div className="mt-5">
            <FocusBox
              concerns={concerns}
              unit={(c) => (c.process === "care" ? "กรณี" : "คน")}
              onPickOther={(c) => pick(c.process, c.status)}
              actions={(c) => {
                const list = roomsWith(c);
                const topic = `${PROCESS_LABEL[c.process]}${STATUS_LABEL[c.status]}`;
                const allSent = list.length > 0 && list.every((r) => reminded[r.room] === topic);
                const extend = (primary: boolean) => (
                  <Link
                    href={`/settings?tab=windows${c.windowId ? `&window=${c.windowId}` : ""}`}
                    className={primary ? FOCUS_PRIMARY : FOCUS_SECONDARY}
                  >
                    ขยายช่วงเวลา <ChevronRight className="size-4" />
                  </Link>
                );
                return (
                  <>
                    {/* ปิดรับแล้ว: ครูส่งไม่ได้ เตือนไปก็ไม่มีประโยชน์ ต้องขยายช่วงเวลาก่อน */}
                    {c.locked ? (
                      extend(true)
                    ) : (
                      <>
                        <button
                          type="button"
                          className={FOCUS_PRIMARY}
                          disabled={allSent || list.length === 0}
                          onClick={() => remind(list, topic)}
                        >
                          {allSent ? <Check className="size-4" /> : <Bell className="size-4" />}
                          {allSent ? `เตือนครูแล้ว ${n(list.length)} ห้อง` : `เตือนครู ${n(list.length)} ห้อง`}
                        </button>
                        {c.closed && extend(false)}
                      </>
                    )}
                    {!selectedRoom && (
                      <button type="button" className={FOCUS_SECONDARY} onClick={() => pick(c.process, c.status)}>
                        ดูห้องที่เกี่ยวข้อง
                      </button>
                    )}
                  </>
                );
              }}
            />
          </div>

          {/* ② การ์ดกระบวนการ */}
          <div className="mt-4">
            <ProcessCards
              summaries={summaries}
              selected={process === "all" ? null : process}
              onPick={pick}
              totalNote={(row) =>
                row.process === "assessment" ? `จาก ${n(row.total)} คนที่ต้องทำ SDQ` : `จาก ${n(row.total)} ${row.unit}`
              }
            />
          </div>

          {/* ③ ห้องที่ต้องตามก่อน + ผลคัดกรอง */}
          <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
            {selectedRoom ? (
              <RoomContact
                room={selectedRoom}
                open={roomRows[0]?.own.filter((i) => matches(i, "all", "open")).length ?? 0}
                reminded={reminded[selectedRoom.room]}
                onRemind={() => remind([selectedRoom], "งานที่ต้องทำของห้อง")}
              />
            ) : (
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <h2 className="text-[15px] font-bold">ห้องที่ต้องตามก่อน</h2>
                  <span className="text-[12.5px] text-muted-foreground">
                    เรียงตาม “{rankBy === "red" ? "จำนวนกลุ่มมีปัญหา" : selectionLabel}”
                  </span>
                  {rankBy === "backlog" && process !== "all" && (
                    <button
                      type="button"
                      onClick={() => {
                        setProcess("all");
                        setStatus("open");
                      }}
                      className="ml-auto text-[12.5px] font-semibold text-primary hover:underline"
                    >
                      ดูทุกกระบวนการ
                    </button>
                  )}
                </div>
                <div className="mt-3 inline-flex rounded-lg bg-muted p-0.5 text-[12.5px] font-semibold" role="group" aria-label="เรียงห้องตาม">
                  {(
                    [
                      ["backlog", "งานที่ต้องทำ"],
                      ["red", "กลุ่มมีปัญหา"],
                    ] as const
                  ).map(([key, text]) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={rankBy === key}
                      onClick={() => setRankBy(key)}
                      className={`rounded-md px-3 py-1 ${rankBy === key ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {text}
                    </button>
                  ))}
                </div>
                <ul className="mt-2 divide-y divide-border">
                  {rankBy === "red" &&
                    redRows.map(({ room: r, red, total }) => (
                      <li key={r.room} className="flex items-center gap-3 py-2.5">
                        <button type="button" onClick={() => openRoom(r)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                          <span className="w-14 shrink-0 text-[15px] font-bold">{r.room}</span>
                          <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">{r.teacher}</span>
                          <span className="shrink-0 text-[13px]">
                            มีปัญหา <b className="text-[17px] tabular-nums">{n(red)}</b> จาก {n(total)} คน
                          </span>
                        </button>
                        <RemindButton sent={reminded[r.room] !== undefined} onClick={() => remind([r], "นักเรียนกลุ่มมีปัญหา")} />
                      </li>
                    ))}
                  {rankBy === "red" && redRows.length === 0 && (
                    <li className="py-6 text-center text-[13px] text-muted-foreground">ไม่มีห้องที่มีนักเรียนกลุ่มมีปัญหา</li>
                  )}
                  {rankBy === "backlog" && topRooms.map(({ room: r, selected }) => (
                    <li key={r.room} className="flex items-center gap-3 py-2.5">
                      <button type="button" onClick={() => openRoom(r)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span className="w-14 shrink-0 text-[15px] font-bold">{r.room}</span>
                        <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">{r.teacher}</span>
                        <span className="shrink-0 text-[13px]">
                          {status === "done" ? "ทำแล้ว" : status === "watch" ? "เฝ้าระวัง" : "ต้องทำ"}{" "}
                          {/* เฝ้าระวังที่ถึงเกณฑ์ใช้สีแดงตามกฎความประพฤติ */}
                          <b className={`text-[17px] tabular-nums ${status === "watch" ? "text-risk-red" : ""}`}>{n(selected)}</b> {roomUnit}
                        </span>
                      </button>
                      <RemindButton
                        sent={reminded[r.room] !== undefined}
                        onClick={() => remind([r], selectionLabel)}
                      />
                    </li>
                  ))}
                  {rankBy === "backlog" && topRooms.length === 0 && (
                    <li className="py-6 text-center text-[13px] text-muted-foreground">ทุกห้องทำงานนี้เสร็จแล้ว</li>
                  )}
                </ul>
                <button
                  type="button"
                  aria-expanded={showAllRooms}
                  onClick={() => setShowAllRooms((v) => !v)}
                  className="mt-2 flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
                >
                  {showAllRooms ? "ซ่อนตารางทุกห้อง" : `ดูทุกห้อง (${n(rooms.length)} ห้อง)`}
                  <ChevronRight className={`size-4 transition-transform ${showAllRooms ? "rotate-90" : ""}`} />
                </button>
              </div>
            )}
            {!selectedRoom && (
              <RiskByLevel
                students={allStudents}
                level={level}
                onPick={(l) => {
                  setLevel(l);
                  setRoom("all");
                  roomPager.reset();
                }}
              />
            )}
            </div>
            <RiskPanel
              risk={riskCounts(students)}
              total={students.length}
              dimensions={dimensionTallies(students)}
              behavior={summaries.find((r) => r.process === "behavior")}
              watchActive={process === "behavior"}
              onPickWatch={() => pick("behavior", "watch")}
            />
          </div>

          {/* ตารางทุกห้อง เปิดเมื่อต้องการ */}
          {!selectedRoom && showAllRooms && (
            <Card className="mt-4">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[15px] font-bold">ทุกห้อง · {n(rooms.length)} ห้อง</h2>
                  </div>
                  <Filter label="เรียงตามสถานะ">
                    <NativeSelect
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value as StatusFilter);
                        roomPager.reset();
                      }}
                      className="w-44"
                    >
                      {(Object.keys(STATUS_FILTER_LABEL) as StatusFilter[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_FILTER_LABEL[s]}
                        </option>
                      ))}
                    </NativeSelect>
                  </Filter>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-[13.5px]">
                    <thead>
                      <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
                        <th className="w-20 py-2 font-medium">ห้อง</th>
                        <th className="py-2 font-medium">ครูประจำชั้น</th>
                        <th className="w-28 py-2 text-center font-medium">คัดกรองครบ</th>
                        <th className="w-28 py-2 text-center font-medium">SDQ ครบ</th>
                        <th className="w-28 py-2 text-center font-medium">เยี่ยมบ้านแล้ว</th>
                        <th className="w-36 py-2 text-center font-medium">{selectionLabel}</th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {roomPager.slice.map(({ room: r, own, selected }) => (
                        <tr key={r.room} onClick={() => openRoom(r)} className="cursor-pointer border-b border-border hover:bg-muted/50">
                          <td className="py-2.5 font-semibold">
                            <button
                              type="button"
                              className="hover:text-primary"
                              onClick={(e) => {
                                // ทั้งแถวกดได้ ปุ่มนี้มีไว้ให้ใช้คีย์บอร์ดได้
                                e.stopPropagation();
                                openRoom(r);
                              }}
                            >
                              {r.room}
                            </button>
                          </td>
                          <td className="py-2.5 text-muted-foreground">{r.teacher}</td>
                          <Progress own={own} process="screening" />
                          <Progress own={own} process="assessment" />
                          <Progress own={own} process="home_visit" />
                          <td className={`py-2.5 text-center ${selected > 0 ? "font-bold" : "text-muted-foreground"}`}>
                            {selected > 0 ? n(selected) : "–"}
                          </td>
                          <td className="py-2.5 text-muted-foreground">
                            <ChevronRight className="size-4" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PagerNumbered
                  page={roomPager.page}
                  totalPages={roomPager.totalPages}
                  setPage={roomPager.setPage}
                  from={roomPager.from}
                  to={roomPager.to}
                  total={roomPager.total}
                  pageSize={pageSize}
                  onPageSize={(size) => {
                    setPageSize(size);
                    roomPager.reset();
                  }}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/** ดูห้องเดียว: ผู้รับผิดชอบ + เตือนครู */
function RoomContact({
  room,
  open,
  reminded,
  onRemind,
}: {
  room: Room;
  open: number;
  reminded?: string;
  onRemind: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-[15px] font-bold">ผู้รับผิดชอบห้องนี้</h2>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-bold">{room.teacher}</div>
          <div className="text-[13px] text-muted-foreground">
            ครูประจำชั้น {room.room} · ต้องทำ {n(open)} รายการ
          </div>
        </div>
        <RemindButton sent={reminded !== undefined} onClick={onRemind} label="เตือนครูเรื่องงานที่ต้องทำ" />
      </div>
      {reminded && <p className="mt-2 text-[12px] text-muted-foreground">ส่งเตือนเรื่อง “{reminded}” แล้ววันนี้</p>}
    </div>
  );
}

function RemindButton({ sent, onClick, label = "เตือนครู" }: { sent: boolean; onClick: () => void; label?: string }) {
  return (
    <Button size="sm" variant="outline" disabled={sent} onClick={onClick} className="shrink-0">
      {sent ? <Check className="size-3.5" /> : <Bell className="size-3.5" />}
      {sent ? "เตือนแล้ว" : label}
    </Button>
  );
}

/** ความคืบหน้ารายห้อง: ทำครบกี่คนจากที่ต้องทำ สีกลางตามกติกาเดิม */
function Progress({ own, process }: { own: AdminItem[]; process: ProcessKey }) {
  const relevant = own.filter((i) => i.process === process);
  const done = relevant.filter((i) => i.status === "done").length;
  const overdue = relevant.some((i) => i.status === "overdue");
  return (
    <td className="py-2.5 text-center">
      {relevant.length === 0 ? (
        <span className="text-muted-foreground">–</span>
      ) : (
        <span className={overdue ? "font-semibold text-foreground" : "text-muted-foreground"}>
          {done}/{relevant.length}
        </span>
      )}
    </td>
  );
}
