"use client";

/**
 * ส่วนที่ภาพรวมของครูประจำชั้นและแอดมินใช้ร่วมกัน: ตารางสถานะ 5 กระบวนการ (UC1 Subflow A)
 * ป้ายสถานะ ตัวกรอง และบรรทัดสรุปผลคัดกรอง
 * สถานะใช้สีกลาง เพราะสีเหลือง/แดงสงวนไว้สำหรับกลุ่มเสี่ยง/กลุ่มมีปัญหา
 */

import { RiskDot } from "@/components/shared/risk-badge";
import { formatThaiDate } from "@/lib/format";
import {
  PROCESS_LABEL,
  PROCESS_NOTE,
  STATUS_COLUMNS,
  STATUS_LABEL,
  type ProcessKey,
  type ProcessSummary,
  type Status,
} from "../_homeroom/process-status";

export function ProcessTable({
  summaries,
  selected,
  onPick,
  behaviorNote,
}: {
  summaries: ProcessSummary[];
  /** ช่องที่เลือกอยู่ (กระบวนการ + สถานะ) */
  selected: { process: ProcessKey; status: string } | null;
  onPick: (process: ProcessKey, status: Status) => void;
  /** ข้อความแถวความประพฤติ ถ้าไม่ระบุใช้ "บันทึก N รายการในภาคเรียนนี้" */
  behaviorNote?: string;
}) {
  return (
    <table className="mt-4 w-full text-[13.5px]">
      <thead>
        <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
          <th className="py-2 font-medium">กระบวนการ</th>
          <th className="w-44 py-2 font-medium">ปิดรอบ</th>
          {STATUS_COLUMNS.map((s) => (
            <th key={s} className="w-28 py-2 text-center font-medium">
              {STATUS_LABEL[s]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {summaries.map((row) => (
          <ProcessRow
            key={row.process}
            row={row}
            selected={selected?.process === row.process ? selected.status : null}
            onPick={(s) => onPick(row.process, s)}
            behaviorNote={behaviorNote}
          />
        ))}
      </tbody>
    </table>
  );
}

function ProcessRow({
  row,
  selected,
  onPick,
  behaviorNote,
}: {
  row: ProcessSummary;
  selected: string | null;
  onPick: (status: Status) => void;
  behaviorNote?: string;
}) {
  const name = (
    <td className="py-3 pr-4">
      <div className="font-semibold">{PROCESS_LABEL[row.process]}</div>
      <div className="text-[12px] text-muted-foreground">{PROCESS_NOTE[row.process]}</div>
    </td>
  );

  if (row.process === "behavior") {
    return (
      <tr className="border-b border-border">
        {name}
        <td className="py-3 text-muted-foreground">–</td>
        <td colSpan={STATUS_COLUMNS.length} className="py-3">
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
            {behaviorNote ?? `บันทึก ${(row.recorded ?? 0).toLocaleString("th-TH")} รายการในภาคเรียนนี้`}
            <span aria-hidden>·</span>
            <CountCell
              count={row.counts.watch}
              active={selected === "watch"}
              onClick={() => onPick("watch")}
              label={`ถึงเกณฑ์เฝ้าระวัง ${row.counts.watch.toLocaleString("th-TH")} คน`}
            />
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border">
      {name}
      <td className="py-3 text-[12.5px] text-muted-foreground">
        {row.process === "care"
          ? "ตามวันติดตามของแต่ละ case"
          : row.closes.length === 0
            ? "ยังไม่ได้ตั้งช่วงเวลา"
            : row.closes.map((c) => (
                <div key={c.label}>
                  {c.label} {formatThaiDate(c.date)}
                </div>
              ))}
      </td>
      {STATUS_COLUMNS.map((s) => (
        <td key={s} className="py-3 text-center">
          <CountCell
            count={row.counts[s]}
            active={selected === s}
            onClick={() => onPick(s)}
            emphasis={s === "overdue" || s === "near_due"}
            label={
              s === "done"
                ? `${row.counts.done.toLocaleString("th-TH")}/${row.total.toLocaleString("th-TH")}`
                : undefined
            }
          />
        </td>
      ))}
    </tr>
  );
}

function CountCell({
  count,
  active,
  onClick,
  emphasis,
  label,
}: {
  count: number;
  active: boolean;
  onClick: () => void;
  emphasis?: boolean;
  label?: string;
}) {
  if (count === 0) return <span className="text-muted-foreground">{label ?? "–"}</span>;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "min-w-12 rounded-lg border border-primary bg-accent px-2.5 py-1 font-semibold text-primary"
          : `min-w-12 rounded-lg border border-border px-2.5 py-1 hover:bg-muted ${emphasis ? "font-bold" : ""}`
      }
    >
      {label ?? count.toLocaleString("th-TH")}
    </button>
  );
}

/** สถานะของงาน แยกจากสีกลุ่มเสี่ยง: เกินกำหนดเข้มที่สุด ใกล้ครบกำหนดรองลงมา */
export const STATUS_TAG: Record<Status, string> = {
  overdue: "bg-foreground text-background",
  near_due: "border border-foreground/40 text-foreground",
  pending: "bg-muted text-muted-foreground",
  watch: "bg-muted text-foreground",
  done: "bg-muted text-muted-foreground",
};

/** ผลคัดกรองเป็นข้อมูลรอง ไว้ใต้ตารางสถานะงาน */
export function RiskSummary({ green, amber, red }: { green: number; amber: number; red: number }) {
  const n = (v: number) => v.toLocaleString("th-TH");
  return (
    <div className="mt-4 flex flex-wrap items-center gap-5 text-[13px] text-muted-foreground">
      <span className="font-semibold text-foreground">ผลคัดกรอง</span>
      <span className="flex items-center gap-1.5">
        <RiskDot group="green" /> ปกติ {n(green)} คน
      </span>
      <span className="flex items-center gap-1.5">
        <RiskDot group="amber" /> กลุ่มเสี่ยง {n(amber)} คน
      </span>
      <span className="flex items-center gap-1.5">
        <RiskDot group="red" /> กลุ่มมีปัญหา {n(red)} คน
      </span>
    </div>
  );
}

export function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[12px] font-medium text-muted-foreground">
      {label}
      {children}
    </label>
  );
}
