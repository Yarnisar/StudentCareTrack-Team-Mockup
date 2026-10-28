"use client";

/**
 * ภาพรวมของครูประจำชั้น (UC1): แต่ละกระบวนการไปถึงไหน และอะไรใกล้หมดเวลา
 * ตารางสถานะ 5 กระบวนการ → กดตัวเลขเพื่อดูรายชื่อ (Subflow B) → กดรายการเพื่อไปทำต่อ
 * ตัวกรองปีการศึกษา / ภาคเรียน / สถานะ และส่งออกตามตัวกรองปัจจุบัน (Subflow C)
 * สลับเป็นปฏิทินได้ เพื่อดูว่างานไหนต้องเสร็จเมื่อไร (homeroom-calendar.tsx)
 * ใช้ข้อมูลจริงใน store ตัวเลขจึงตรงกับหน้าอื่นและขยับตามงานที่ทำ
 * สถานะใช้สีกลาง เพราะสีเหลือง/แดงสงวนไว้สำหรับกลุ่มเสี่ยง/กลุ่มมีปัญหา
 */

import { useState } from "react";
import { CalendarDays, ChevronRight, Download, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { NativeSelect } from "@/components/ui/native-select";
import { downloadCsv } from "@/lib/csv";
import { formatThaiDate } from "@/lib/format";
import { CURRENT_TEACHER, CURRENT_TERM } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { Filter, ProcessTable, STATUS_TAG } from "../_shared/process-table";
import {
  PROCESS_LABEL,
  processStatus,
  STATUS_LABEL,
  type Item,
  type ProcessKey,
  type Status,
} from "./process-status";
import { calendarEvents } from "./calendar-events";
import { HomeroomCalendar } from "./homeroom-calendar";

/** "open" = ทุกอย่างที่ยังไม่เสร็จ (ค่าเริ่มต้น เพราะครูเปิดหน้านี้เพื่อหาว่าต้องทำอะไรต่อ) */
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

const matches = (item: Item, process: ProcessKey | "all", status: StatusFilter) =>
  (process === "all" || item.process === process) &&
  (status === "all" || (status === "open" ? item.status !== "done" : item.status === status));

export function HomeroomOverview() {
  const store = useStore();
  const [year, setYear] = useState(CURRENT_TERM.academicYear);
  const [semester, setSemester] = useState(CURRENT_TERM.semester);
  const [status, setStatus] = useState<StatusFilter>("open");
  const [process, setProcess] = useState<ProcessKey | "all">("all");
  const [view, setView] = useState<"table" | "calendar">("table");

  const termId = `T${year}-${semester}`;
  const termLabel = `ภาคเรียนที่ ${semester} ปีการศึกษา ${year}`;
  const { items, summaries } = processStatus(store, termId);
  const shown = items.filter((i) => matches(i, process, status));
  const noData = summaries.length === 0;
  const { events, periods } = calendarEvents(store, items, !noData);

  const pick = (p: ProcessKey | "all", s: StatusFilter) => {
    const same = p === process && s === status;
    setProcess(same ? "all" : p);
    setStatus(same ? "open" : s);
  };

  const resetTerm = () => {
    setYear(CURRENT_TERM.academicYear);
    setSemester(CURRENT_TERM.semester);
  };

  const exportCsv = () =>
    downloadCsv(
      `ภาพรวม-${CURRENT_TEACHER.roomName.replace("/", "-")}-${termId}.csv`,
      ["กระบวนการ", "สถานะ", "เลขที่", "ชื่อ-สกุล", "รายละเอียด", "ครบกำหนด"],
      shown.map((i) => [
        PROCESS_LABEL[i.process],
        STATUS_LABEL[i.status],
        i.student.classNo,
        i.student.fullName,
        i.detail,
        i.due ? formatThaiDate(i.due) : "",
      ])
    );

  const listTitle = [
    process === "all" ? "ทุกกระบวนการ" : PROCESS_LABEL[process],
    STATUS_FILTER_LABEL[status],
  ].join(" · ");

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="flex flex-wrap items-end gap-3">
        <Filter label="มุมมอง">
          <div className="flex h-10 rounded-lg border border-border p-1" role="group">
            <ViewButton active={view === "table"} onClick={() => setView("table")}>
              <Table2 className="size-4" /> ตารางสถานะ
            </ViewButton>
            <ViewButton active={view === "calendar"} onClick={() => setView("calendar")}>
              <CalendarDays className="size-4" /> ปฏิทิน
            </ViewButton>
          </div>
        </Filter>
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
        {view === "table" && (
          <Filter label="สถานะ">
            <NativeSelect
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className="w-48"
            >
              {(Object.keys(STATUS_FILTER_LABEL) as StatusFilter[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_FILTER_LABEL[s]}
                </option>
              ))}
            </NativeSelect>
          </Filter>
        )}
        <span className="flex-1" />
        {view === "table" && (
          <Button variant="outline" className="h-10" onClick={exportCsv} disabled={shown.length === 0}>
            <Download className="size-4" /> ส่งออกรายการ ({shown.length})
          </Button>
        )}
      </div>

      {view === "calendar" && !noData && <HomeroomCalendar events={events} periods={periods} />}

      {(view === "table" || noData) && (
        <Card className="mt-5">
          <CardContent className="p-6">
            <h2 className="text-[15.5px] font-bold">สถานะการดำเนินงาน</h2>

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
                onPick={(p, st) => pick(p, st)}
                risk={riskOf(store)}
              />
            )}
          </CardContent>
        </Card>
      )}

      {!noData && view === "table" && (
        <Card className="mt-5">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[15.5px] font-bold">
                {listTitle} · {shown.length} รายการ
              </h2>
              <span className="flex-1" />
              {(process !== "all" || status !== "open") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setProcess("all");
                    setStatus("open");
                  }}
                >
                  ล้างการเลือก
                </Button>
              )}
            </div>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              เรียงจากเกินกำหนดก่อน กดรายการเพื่อไปทำต่อ
            </p>

            <div className="mt-4 space-y-2">
              {shown.map((item, i) => (
                <ItemRow key={`${item.process}-${item.student.studentId}-${i}`} item={item} showProcess={process === "all"} />
              ))}
              {shown.length === 0 && (
                <p className="py-10 text-center text-[13px] text-muted-foreground">
                  ไม่มีรายการในสถานะนี้ ลองเปลี่ยนตัวกรอง
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ItemRow({ item, showProcess }: { item: Item; showProcess: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3.5">
      <span className={`w-28 shrink-0 rounded-md px-2.5 py-1 text-center text-[11.5px] font-semibold ${STATUS_TAG[item.status]}`}>
        {STATUS_LABEL[item.status]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold">
          {item.student.fullName}
          {showProcess && (
            <span className="ml-2 text-[12px] font-normal text-muted-foreground">{PROCESS_LABEL[item.process]}</span>
          )}
        </span>
        <span className="block text-[12px] text-muted-foreground">
          เลขที่ {item.student.classNo} · {item.detail}
          {item.due && item.status !== "done" && ` · ครบกำหนด ${formatThaiDate(item.due)}`}
        </span>
      </span>
      {item.href && item.action ? (
        <LinkButton href={item.href} variant="outline" size="sm">
          {item.action} <ChevronRight className="size-4" />
        </LinkButton>
      ) : item.href ? (
        <LinkButton href={item.href} variant="ghost" size="sm">
          ดูรายละเอียด
        </LinkButton>
      ) : (
        item.status !== "done" && <span className="text-[12px] text-muted-foreground">รอผู้อื่นดำเนินการ</span>
      )}
    </div>
  );
}

/** ผลคัดกรองเป็นข้อมูลรอง แสดงในแถบสรุปใต้ตารางสถานะงาน */
function riskOf(store: ReturnType<typeof useStore>) {
  const count = (g: "green" | "amber" | "red") =>
    store.students.filter((s) => store.overallRiskOf(s.studentId) === g).length;
  return { green: count("green"), amber: count("amber"), red: count("red") };
}

function ViewButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "flex items-center gap-1.5 rounded-md bg-accent px-3 text-[13px] font-semibold text-primary"
          : "flex items-center gap-1.5 rounded-md px-3 text-[13px] text-muted-foreground hover:bg-muted"
      }
    >
      {children}
    </button>
  );
}
