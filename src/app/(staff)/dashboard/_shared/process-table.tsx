"use client";

/**
 * ส่วนที่ภาพรวมของครูประจำชั้นและแอดมินใช้ร่วมกัน: ตารางสถานะ 4 กระบวนการที่มีรอบ + แถบสรุปความประพฤติและผลคัดกรอง (UC1 Subflow A)
 * ตารางเน้นตัวเลขที่ต้องลงมือ: ช่องว่างคือไม่มีงานค้าง ตัวเลขที่มีค่ากดได้เพื่อดูรายชื่อ
 * สถานะใช้สีกลาง เพราะสีเหลือง/แดงสงวนไว้สำหรับกลุ่มเสี่ยง/กลุ่มมีปัญหา
 */

import { RiskDot } from "@/components/shared/risk-badge";
import { formatThaiDate } from "@/lib/format";
import { DEMO_TODAY } from "@/lib/mock-data";
import { daysBetween, NEAR_DUE_DAYS } from "@/lib/periods";
import {
  PROCESS_LABEL,
  STATUS_LABEL,
  type ProcessKey,
  type ProcessSummary,
  type Status,
} from "../_homeroom/process-status";

const OPEN_COLUMNS = ["pending", "near_due", "overdue"] as const;

const COLUMN_HINT: Partial<Record<Status, string>> = {
  near_due: `เหลือไม่เกิน ${NEAR_DUE_DAYS} วันก่อนครบกำหนด`,
  overdue: "เลยวันครบกำหนดแล้วยังไม่เสร็จ",
};

const n = (v: number) => v.toLocaleString("th-TH");

export function ProcessTable({
  summaries,
  selected,
  onPick,
  risk,
}: {
  summaries: ProcessSummary[];
  /** ช่องที่เลือกอยู่ (กระบวนการ + สถานะ) */
  selected: { process: ProcessKey; status: string } | null;
  onPick: (process: ProcessKey, status: Status) => void;
  risk: { green: number; amber: number; red: number };
}) {
  const isSelected = (p: ProcessKey, s: Status) => selected?.process === p && selected.status === s;
  const behavior = summaries.find((r) => r.process === "behavior");

  return (
    <>
      <table className="mt-3 w-full table-fixed text-[13.5px]">
        <colgroup>
          <col className="w-[20%]" />
          <col className="w-[26%]" />
          <col />
          <col />
          <col />
          <col className="w-[16%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
            <th className="py-2 font-medium">กระบวนการ</th>
            <th className="py-2 font-medium">ความคืบหน้า</th>
            {OPEN_COLUMNS.map((s) => (
              <th key={s} className="py-2 text-center font-medium">
                <span
                  title={COLUMN_HINT[s]}
                  className={COLUMN_HINT[s] ? "cursor-help underline decoration-dotted underline-offset-4" : undefined}
                >
                  {STATUS_LABEL[s]}
                </span>
              </th>
            ))}
            <th className="py-2 text-right font-medium">ปิดรอบ</th>
          </tr>
        </thead>
        <tbody>
          {summaries
            .filter((r) => r.process !== "behavior")
            .map((row) => (
              <tr key={row.process} className="border-b border-border last:border-0">
                <td className="py-3 font-semibold">{PROCESS_LABEL[row.process]}</td>
                <td className="py-3 pr-6">
                  <Progress
                    done={row.counts.done}
                    total={row.total}
                    active={isSelected(row.process, "done")}
                    onClick={() => onPick(row.process, "done")}
                  />
                </td>
                {OPEN_COLUMNS.map((s) => (
                  <td key={s} className="py-3 text-center">
                    {row.counts[s] > 0 && (
                      <CountButton
                        count={row.counts[s]}
                        active={isSelected(row.process, s)}
                        strong={s !== "pending"}
                        onClick={() => onPick(row.process, s)}
                        label={`${PROCESS_LABEL[row.process]} ${STATUS_LABEL[s]} ${row.counts[s]}`}
                      />
                    )}
                  </td>
                ))}
                <td className="py-3 text-right text-[12.5px] text-muted-foreground">
                  <CloseLabel row={row} />
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-3 text-[13px] text-muted-foreground">
        {behavior && (
          <span className="flex items-center gap-2">
            <span className="font-semibold text-foreground">ความประพฤติ</span>
            บันทึก {n(behavior.recorded ?? 0)}
            <span aria-hidden>·</span>
            {behavior.counts.watch > 0 ? (
              <CountButton
                count={behavior.counts.watch}
                active={isSelected("behavior", "watch")}
                onClick={() => onPick("behavior", "watch")}
                prefix="เฝ้าระวัง "
                label={`ถึงเกณฑ์เฝ้าระวัง ${behavior.counts.watch} คน`}
              />
            ) : (
              "เฝ้าระวัง 0"
            )}
          </span>
        )}
        <span className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-foreground">ผลคัดกรอง</span>
          <span className="flex items-center gap-1.5">
            <RiskDot group="green" /> ปกติ {n(risk.green)}
          </span>
          <span className="flex items-center gap-1.5">
            <RiskDot group="amber" /> กลุ่มเสี่ยง {n(risk.amber)}
          </span>
          <span className="flex items-center gap-1.5">
            <RiskDot group="red" /> กลุ่มมีปัญหา {n(risk.red)}
          </span>
        </span>
      </div>
    </>
  );
}

/** แถบความคืบหน้า + จำนวนที่ทำเสร็จ กดเพื่อดูรายชื่อที่ทำแล้ว */
function Progress({
  done,
  total,
  active,
  onClick,
}: {
  done: number;
  total: number;
  active: boolean;
  onClick: () => void;
}) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const text = `${n(done)}/${n(total)}`;
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      {done > 0 ? (
        <button
          type="button"
          onClick={onClick}
          aria-pressed={active}
          aria-label={`ดำเนินการแล้ว ${text}`}
          className={`w-16 shrink-0 rounded-md text-right tabular-nums hover:text-primary ${
            active ? "font-semibold text-primary" : "text-muted-foreground"
          }`}
        >
          {text}
        </button>
      ) : (
        <span className="w-16 shrink-0 text-right text-muted-foreground tabular-nums">{text}</span>
      )}
    </div>
  );
}

function CountButton({
  count,
  active,
  strong,
  onClick,
  prefix,
  label,
}: {
  count: number;
  active: boolean;
  strong?: boolean;
  onClick: () => void;
  prefix?: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={
        active
          ? "min-w-10 rounded-lg border border-primary bg-accent px-2.5 py-0.5 font-semibold text-primary tabular-nums"
          : `min-w-10 rounded-lg border border-border px-2.5 py-0.5 text-foreground tabular-nums hover:bg-muted ${
              strong ? "font-bold" : ""
            }`
      }
    >
      {prefix}
      {n(count)}
    </button>
  );
}

/** ปิดรอบบรรทัดเดียว: รอบที่ยังเปิดและใกล้ปิดที่สุด หรือ "ปิดแล้ว" — วันที่เต็มแต่ละรอบดูได้เมื่อชี้ */
function CloseLabel({ row }: { row: ProcessSummary }) {
  if (row.process === "care") return <>ตามวันนัดติดตาม</>;
  if (row.closes.length === 0) return <>ยังไม่ตั้งช่วงเวลา</>;
  const detail = row.closes.map((c) => `${c.label} ${formatThaiDate(c.date)}`).join("\n");
  const upcoming = row.closes
    .filter((c) => c.date >= DEMO_TODAY)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const left = upcoming ? daysBetween(DEMO_TODAY, upcoming.date) : null;
  return (
    <span title={detail} className="cursor-help">
      {left === null ? "ปิดแล้ว" : left === 0 ? "ปิดวันนี้" : `อีก ${left} วัน`}
    </span>
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

export function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[12px] font-medium text-muted-foreground">
      {label}
      {children}
    </label>
  );
}
