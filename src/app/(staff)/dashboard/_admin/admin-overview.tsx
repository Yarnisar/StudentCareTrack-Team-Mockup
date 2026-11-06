"use client";

/**
 * ภาพรวมของแอดมินโรงเรียน (UC1): โครงเดียวกับภาพรวมของครูประจำชั้น ต่างกันที่ขอบเขต
 * ตารางสถานะ 5 กระบวนการ → ตารางรายห้อง → กดห้องเพื่อดูตัวเลขของห้องนั้น
 * ตัวกรองปีการศึกษา / ภาคเรียน / ระดับชั้น / ห้อง / สถานะ (รายงาน 3.2.1) และส่งออกตามตัวกรองปัจจุบัน (Subflow C)
 * แอดมินเห็นเป็นจำนวนเท่านั้น ไม่เห็นชื่อนักเรียนหรือสถานะรายคน (UC1 Post-condition 3, หัวข้อ 3.4.1)
 * ส่งออกได้เฉพาะสถิติรายห้องที่ไม่มีชื่อนักเรียน (UC1 Scenario A ข้อ 3)
 */

import { useState } from "react";
import { ChevronLeft, ChevronRight, Download, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { downloadCsv } from "@/lib/csv";
import { CURRENT_TERM } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { Filter, ProcessTable } from "../_shared/process-table";
import { PROCESS_LABEL, STATUS_LABEL, type ProcessKey, type Status } from "../_homeroom/process-status";
import { PagerNumbered, usePagination } from "./pagination";
import {
  adminItems,
  adminSummaries,
  allRooms,
  allStudents,
  LEVELS,
  riskCounts,
  type AdminItem,
  type Room,
} from "./school-data";

type StatusFilter = Status | "open" | "all";

const STATUS_FILTER_LABEL: Record<StatusFilter, string> = {
  open: "ยังไม่เสร็จทั้งหมด",
  overdue: STATUS_LABEL.overdue,
  near_due: STATUS_LABEL.near_due,
  pending: STATUS_LABEL.pending,
  watch: STATUS_LABEL.watch,
  done: STATUS_LABEL.done,
  all: "ทุกสถานะ",
};

const YEARS = [CURRENT_TERM.academicYear, CURRENT_TERM.academicYear - 1];
const SEMESTERS = [1, 2];

const matches = (item: AdminItem, process: ProcessKey | "all", status: StatusFilter) =>
  (process === "all" || item.process === process) &&
  (status === "all" || (status === "open" ? item.status !== "done" : item.status === status));

const n = (v: number) => v.toLocaleString("th-TH");

export function AdminOverview() {
  const { assessmentWindows: windows } = useStore();
  const [year, setYear] = useState(CURRENT_TERM.academicYear);
  const [semester, setSemester] = useState(CURRENT_TERM.semester);
  const [level, setLevel] = useState<number | "all">("all");
  const [room, setRoom] = useState<string | "all">("all");
  const [status, setStatus] = useState<StatusFilter>("open");
  const [process, setProcess] = useState<ProcessKey | "all">("all");
  const [pageSize, setPageSize] = useState(10);

  // PROTOTYPE: ข้อมูลจำลองมีเฉพาะภาคเรียนปัจจุบัน ภาคเรียนอื่นจึงไม่พบข้อมูล (UC1 Alternate Flow)
  const termLabel = `ภาคเรียนที่ ${semester} ปีการศึกษา ${year}`;
  const noData = year !== CURRENT_TERM.academicYear || semester !== CURRENT_TERM.semester;

  const students = noData
    ? []
    : allStudents.filter((s) => (level === "all" || s.level === level) && (room === "all" || s.room === room));
  const rooms = allRooms.filter((r) => (level === "all" || r.level === level) && (room === "all" || r.room === room));
  const items = adminItems(students, windows);
  const summaries = adminSummaries(items, students, windows);
  const selectedRoom = room === "all" ? null : allRooms.find((r) => r.room === room);

  const scopeLabel = selectedRoom
    ? `${selectedRoom.room} · ${selectedRoom.teacher}`
    : level === "all"
      ? "ทั้งโรงเรียน"
      : `ม.${level} ทุกห้อง`;
  const selectionLabel = [process === "all" ? null : PROCESS_LABEL[process], STATUS_FILTER_LABEL[status]]
    .filter(Boolean)
    .join(" · ");

  // ตารางรายห้อง: เรียงจากห้องที่มีงานตรงตัวกรองมากที่สุด
  const roomRows = rooms
    .map((r) => ({ room: r, own: items.filter((i) => i.student.room === r.room) }))
    .map(({ room: r, own }) => ({ room: r, own, selected: own.filter((i) => matches(i, process, status)).length }))
    .sort((a, b) => b.selected - a.selected || a.room.room.localeCompare(b.room.room, "th"));
  const roomPager = usePagination(roomRows, pageSize);

  const pick = (p: ProcessKey, s: Status) => {
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

  const exportCsv = () => {
    const count = (own: AdminItem[], p: ProcessKey, s: Status) => own.filter((i) => i.process === p && i.status === s).length;
    downloadCsv(
      `ภาพรวม-${selectedRoom ? selectedRoom.room.replace("/", "-") : level === "all" ? "ทั้งโรงเรียน" : `ม${level}`}-${CURRENT_TERM.termId}.csv`,
      [
        "ห้อง",
        "ครูประจำชั้น",
        "นักเรียน",
        ...(["screening", "assessment", "home_visit", "care"] as ProcessKey[]).flatMap((p) =>
          (["done", "pending", "near_due", "overdue"] as Status[]).map((s) => `${PROCESS_LABEL[p]}: ${STATUS_LABEL[s]}`)
        ),
        "ความประพฤติ: ถึงเกณฑ์เฝ้าระวัง",
      ],
      roomRows.map(({ room: r, own }) => [
        r.room,
        r.teacher,
        r.total,
        ...(["screening", "assessment", "home_visit", "care"] as ProcessKey[]).flatMap((p) =>
          (["done", "pending", "near_due", "overdue"] as Status[]).map((s) => count(own, p, s))
        ),
        count(own, "behavior", "watch"),
      ])
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8">
      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-border bg-surface px-4 py-3 text-[13px] text-muted-foreground">
        <FlaskConical className="mt-0.5 size-4 shrink-0" />
        <p>
          <b className="text-foreground">ข้อมูลจำลองทั้งโรงเรียน {n(allStudents.length)} คน</b>{" "}
          ใช้ทดสอบการแสดงข้อมูลจำนวนมาก ยังไม่เชื่อมกับข้อมูลในระบบ ทำงานในหน้าอื่นแล้วตัวเลขตรงนี้จะไม่เปลี่ยน
          ยกเว้นวันครบกำหนดที่อ่านจากช่วงเวลาในหน้าตั้งค่า
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
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
        <Filter label="สถานะ">
          <NativeSelect
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusFilter);
              roomPager.reset();
                      }}
            className="w-48"
          >
            {(Object.keys(STATUS_FILTER_LABEL) as StatusFilter[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_FILTER_LABEL[s]}
              </option>
            ))}
          </NativeSelect>
        </Filter>
        <span className="flex-1" />
        <Button variant="outline" className="h-10" onClick={exportCsv} disabled={noData}>
          <Download className="size-4" /> ส่งออกสรุปรายห้อง
        </Button>
      </div>

      <Card className="mt-5">
        <CardContent className="p-6">
          {selectedRoom && (
            <button
              type="button"
              onClick={backToSchool}
              className="mb-2 flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" /> {level === "all" ? "ทั้งโรงเรียน" : `ม.${level} ทุกห้อง`}
            </button>
          )}
          <h2 className="text-[15.5px] font-bold">
            สถานะการดำเนินงาน · {scopeLabel}
            {!noData && (
              <span className="ml-2 text-[13px] font-normal text-muted-foreground">{n(students.length)} คน</span>
            )}
          </h2>

          {noData ? (
            <div className="py-12 text-center text-[13px] text-muted-foreground">
              <p>ไม่พบข้อมูลของ{termLabel} ลองเปลี่ยนตัวกรอง</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={resetTerm}>
                กลับไปภาคเรียนปัจจุบัน
              </Button>
            </div>
          ) : (
            <ProcessTable
              summaries={summaries}
              selected={process === "all" ? null : { process, status }}
              onPick={pick}
              risk={riskCounts(students)}
            />
          )}
        </CardContent>
      </Card>

      {!noData && (
        <Card className="mt-5">
          <CardContent className="p-6">
            <h2 className="text-[15.5px] font-bold">ห้องเรียน · {n(rooms.length)} ห้อง</h2>
            <p className="mt-0.5 mb-3 text-[12.5px] text-muted-foreground">
              เรียงจากห้องที่มีงาน “{selectionLabel}” มากที่สุด · กดห้องเพื่อดูตัวเลขของห้องนั้น
            </p>
            <table className="w-full text-[13.5px]">
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
                  <tr
                    key={r.room}
                    onClick={() => openRoom(r)}
                    className="cursor-pointer border-b border-border hover:bg-muted/50"
                  >
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
            {roomPager.slice.length === 0 && (
              <p className="py-8 text-center text-[13px] text-muted-foreground">ไม่มีห้องตรงเงื่อนไข ลองเปลี่ยนตัวกรอง</p>
            )}
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
    </div>
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
