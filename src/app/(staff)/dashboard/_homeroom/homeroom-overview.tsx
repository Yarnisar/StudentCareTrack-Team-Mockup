"use client";

/**
 * ภาพรวมของครูประจำชั้น (UC1): แต่ละกระบวนการไปถึงไหน และอะไรใกล้หมดเวลา
 * ① เรื่องที่ด่วนที่สุด → ② การ์ด 4 กระบวนการ กดเพื่อดูรายชื่อ (Subflow B) → ③ รายการ กดเพื่อไปทำต่อ + ผลคัดกรอง
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
import {
  concernsOf,
  FOCUS_PRIMARY,
  FOCUS_SECONDARY,
  Filter,
  FocusBox,
  ProcessCards,
  RiskPanel,
  STATUS_TAG,
  WATCH_ACTIVE_TAG,
} from "../_shared/process-table";
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
import { StudentId } from "@/components/shared/student-id";

/** "open" = ทุกอย่างที่ยังไม่เสร็จ (ค่าเริ่มต้น เพราะครูเปิดหน้านี้เพื่อหาว่าต้องทำอะไรต่อ) */
type StatusFilter = Status | "open" | "all";

const STATUS_FILTER_LABEL: Record<StatusFilter, string> = {
  open: "ที่ต้องทำ",
  overdue: STATUS_LABEL.overdue,
  near_due: STATUS_LABEL.near_due,
  pending: STATUS_LABEL.pending,
  watch: "เฝ้าระวังความประพฤติ",
  done: STATUS_LABEL.done,
  all: "ทุกสถานะ",
};

const YEARS = [CURRENT_TERM.academicYear, CURRENT_TERM.academicYear - 1];
const SEMESTERS = [1, 2];

const matches = (item: Item, process: ProcessKey | "all", status: StatusFilter) =>
  (process === "all" || item.process === process) &&
  (status === "all" || (status === "open" ? item.status !== "done" && item.status !== "watch" : item.status === status));

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
  /** จากกล่องโฟกัส: เลือกแล้วเลื่อนไปที่รายชื่อ */
  const showList = (p: ProcessKey, s: StatusFilter) => {
    setProcess(p);
    setStatus(s);
    document.getElementById("overview-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      ]),
      store.logExport(`ภาพรวมห้อง ${CURRENT_TEACHER.roomName} · ${shown.length} รายการ`)
    );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8">
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
        <span className="flex-1" />
        {view === "table" && (
          <Button variant="outline" className="h-10" onClick={exportCsv} disabled={shown.length === 0}>
            <Download className="size-4" /> ส่งออกรายการ ({shown.length})
          </Button>
        )}
      </div>

      {view === "calendar" && !noData && <HomeroomCalendar events={events} periods={periods} />}

      {noData && (
        <Card className="mt-5">
          <CardContent className="py-12 text-center text-[13px] text-muted-foreground">
            <p>ไม่พบข้อมูลของ{termLabel} ลองเปลี่ยนตัวกรอง</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={resetTerm}>
              กลับไปภาคเรียนปัจจุบัน
            </Button>
          </CardContent>
        </Card>
      )}

      {!noData && view === "table" && (
        <>
          {/* ① เรื่องที่ด่วนที่สุด */}
          <div className="mt-5">
            <FocusBox
              audience="teacher"
              concerns={concernsOf(summaries, "teacher")}
              unit={(c) => (c.process === "care" ? "กรณี" : "คน")}
              onPickOther={(c) => showList(c.process, c.status)}
              actions={(c) => (
                <button
                  type="button"
                  className={c.locked ? FOCUS_SECONDARY : FOCUS_PRIMARY}
                  onClick={() => showList(c.process, c.status)}
                >
                  {c.locked ? "ดูรายชื่อ" : "ดูรายชื่อและทำต่อ"} <ChevronRight className="size-4" />
                </button>
              )}
            />
          </div>

          {/* ② การ์ดกระบวนการ */}
          <div className="mt-4">
            <ProcessCards
              audience="teacher"
              summaries={summaries}
              selected={process === "all" ? null : process}
              onPick={(p, st) => pick(p, st)}
              totalNote={(row) =>
                row.process === "assessment" ? `จาก ${row.total} รายการ (SDQ และ EQ)` : `จาก ${row.total} ${row.unit}`
              }
            />
          </div>

          {/* ③ รายการ + ผลคัดกรอง */}
          <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <Card id="overview-list" className="scroll-mt-4">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[15px] font-bold">
                      รายการที่ต้องทำ <span className="font-normal text-muted-foreground">· {shown.length} รายการ</span>
                    </h2>
                  </div>
                  <Filter label="สถานะ">
                    <NativeSelect
                      value={status}
                      onChange={(e) => setStatus(e.target.value as StatusFilter)}
                      className="w-44"
                    >
                      {(Object.keys(STATUS_FILTER_LABEL) as StatusFilter[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_FILTER_LABEL[s]}
                        </option>
                      ))}
                    </NativeSelect>
                  </Filter>
                  {(process !== "all" || status !== "open") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setProcess("all");
                        setStatus("open");
                      }}
                    >
                      ล้างตัวกรอง
                    </Button>
                  )}
                </div>
                {process !== "all" && (
                  <p className="mt-2 text-[12.5px] text-muted-foreground">เฉพาะ {PROCESS_LABEL[process]}</p>
                )}

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
            <div className="lg:sticky lg:top-4">
              <RiskPanel
                risk={riskOf(store)}
                total={store.students.length}
                behavior={summaries.find((r) => r.process === "behavior")}
                watchActive={process === "behavior"}
                onPickWatch={() => pick("behavior", "watch")}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const CONSIDER_REASONS = ["ติดตามดูอาการก่อน", "คุยกับนักเรียน/ผู้ปกครองแล้ว", "มีการดูแลอยู่แล้วนอกระบบ"];

function ItemRow({ item, showProcess }: { item: Item; showProcess: boolean }) {
  const store = useStore();
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [other, setOther] = useState("");
  const finalReason = reason === "อื่น ๆ" ? other.trim() : reason;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3.5">
      {item.watch ? (
        <span
          className={`w-28 shrink-0 rounded-md px-2.5 py-1 text-center text-[11.5px] font-semibold ${
            item.watch.pendingWithdrawal ? STATUS_TAG.watch : WATCH_ACTIVE_TAG
          }`}
        >
          {item.watch.pendingWithdrawal ? "รอยืนยันถอน" : `เฝ้าระวังระดับ ${item.watch.level}`}
        </span>
      ) : (
        <span className={`w-28 shrink-0 rounded-md px-2.5 py-1 text-center text-[11.5px] font-semibold ${STATUS_TAG[item.status]}`}>
          {STATUS_LABEL[item.status]}
        </span>
      )}
      <span className="flex min-w-0 flex-1 items-start gap-2.5">
        <StudentId id={item.student.studentId} className="pt-0.5" />
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold">
            {item.student.fullName}
            {showProcess && (
              <span className="ml-2 text-[12px] font-normal text-muted-foreground">{PROCESS_LABEL[item.process]}</span>
            )}
          </span>
          <span className="block text-[12px] text-muted-foreground">
            เลขที่ {item.student.classNo} ·{" "}
            <span className={item.watch?.overdueDays ? "font-semibold text-foreground" : undefined}>{item.detail}</span>
            {item.due && item.status !== "done" && ` · ครบกำหนด ${formatThaiDate(item.due)}`}
          </span>
        </span>
      </span>
      {item.href && item.action ? (
        <span className="flex shrink-0 items-center gap-1.5">
          {item.consider && (
            <Button variant="ghost" size="sm" aria-expanded={asking} onClick={() => setAsking((v) => !v)}>
              ยังไม่เปิด
            </Button>
          )}
          <LinkButton href={item.href} variant="outline" size="sm">
            {item.action} <ChevronRight className="size-4" />
          </LinkButton>
        </span>
      ) : item.href ? (
        <LinkButton href={item.href} variant="ghost" size="sm">
          ดูรายละเอียด
        </LinkButton>
      ) : item.locked ? (
        <span className="text-right text-[12px] text-muted-foreground">
          ปิดรับแล้ว
          <br />
          ติดต่อแอดมินเพื่อขยายเวลา
        </span>
      ) : (
        item.status !== "done" && <span className="text-[12px] text-muted-foreground">รอผู้อื่นดำเนินการ</span>
      )}
      {asking && item.consider && (
        <div className="w-full rounded-lg bg-surface px-3.5 py-3">
          <div className="text-[12.5px] font-semibold">เหตุผลที่ยังไม่เปิดกรณี</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {[...CONSIDER_REASONS, "อื่น ๆ"].map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={reason === r}
                onClick={() => setReason(r)}
                className={
                  reason === r
                    ? "rounded-lg border border-primary bg-accent px-3 py-1.5 text-[12.5px] font-semibold text-primary"
                    : "rounded-lg border border-border bg-card px-3 py-1.5 text-[12.5px] hover:bg-muted"
                }
              >
                {r}
              </button>
            ))}
          </div>
          {reason === "อื่น ๆ" && (
            <input
              aria-label="เหตุผลอื่น"
              value={other}
              onChange={(e) => setOther(e.target.value)}
              placeholder="ระบุเหตุผล"
              className="mt-2 h-9 w-full rounded-lg border border-border bg-card px-3 text-[13px] outline-none focus:border-primary"
            />
          )}
          <div className="mt-2.5 flex items-center gap-2">
            <Button
              size="sm"
              disabled={finalReason === ""}
              onClick={() => store.considerCase(item.student.studentId, item.consider!.basis, finalReason)}
            >
              บันทึกเหตุผล
            </Button>
            <span className="text-[12px] text-muted-foreground">ถ้ามีเหตุใหม่ เช่น ระดับเฝ้าระวังเพิ่ม งานนี้จะกลับมาให้พิจารณาอีก</span>
          </div>
        </div>
      )}
    </div>
  );
}

/** ผลคัดกรองของห้อง แสดงเป็นแถบสีข้างรายการ */
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
