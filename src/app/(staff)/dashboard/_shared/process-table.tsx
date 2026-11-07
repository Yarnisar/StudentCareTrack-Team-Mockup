"use client";

/**
 * ส่วนที่ภาพรวมของครูประจำชั้นและแอดมินใช้ร่วมกัน (UC1 Subflow A) จัดลำดับการมอง 3 ชั้น
 * ① FocusBox: เรื่องที่ด่วนที่สุดเรื่องเดียว พื้นฟ้าอ่อน + แถบน้ำเงินซ้าย + ตัวเลขใหญ่สีน้ำเงินเป็นจุดนำสายตา พร้อมปุ่มลงมือ
 * ② ProcessCards: การ์ด 4 กระบวนการ ตัวเลขใหญ่คืองานค้าง ส่วนอื่นเป็นข้อมูลรอง
 * ③ RiskPanel: ผลคัดกรองเป็นแถบสีแถบเดียว + ความประพฤติ
 * สถานะงานใช้สีกลาง (พื้นเข้ม = ด่วน) เพราะสีเขียว/เหลือง/แดงสงวนไว้สำหรับผลคัดกรองเท่านั้น
 */

import { RiskDot } from "@/components/shared/risk-badge";
import { formatThaiDate } from "@/lib/format";
import { DEMO_TODAY } from "@/lib/mock-data";
import { daysBetween } from "@/lib/periods";
import { PROCESS_LABEL, type ProcessKey, type ProcessSummary, type Status } from "../_homeroom/process-status";

/** ตัวเลือกบนการ์ด: ทั้งงานค้างของกระบวนการ หรือสถานะเดียว */
export type PickStatus = Status | "open";

export const CARD_PROCESSES = ["screening", "assessment", "home_visit", "care"] as const;

const n = (v: number) => v.toLocaleString("th-TH");

export const openCount = (row: ProcessSummary) => row.counts.pending + row.counts.near_due + row.counts.overdue;

/** วันปิดรอบที่ใกล้ที่สุดที่ยังไม่ผ่าน หรือวันปิดล่าสุดที่ผ่านไปแล้ว */
function closeInfo(row: ProcessSummary): { text: string; closed: boolean; detail: string } {
  if (row.process === "care") return { text: "ตามวันนัดติดตามของแต่ละ case", closed: false, detail: "" };
  if (row.closes.length === 0) return { text: "ยังไม่ตั้งช่วงเวลา", closed: false, detail: "" };
  const detail = row.closes.map((c) => `${c.label} ${formatThaiDate(c.date)}`).join("\n");
  const sorted = [...row.closes].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = sorted.find((c) => c.date >= DEMO_TODAY);
  if (!upcoming) return { text: `ปิดรอบแล้ว ${formatThaiDate(sorted.at(-1)!.date)}`, closed: true, detail };
  const left = daysBetween(DEMO_TODAY, upcoming.date);
  return { text: left === 0 ? "ปิดรอบวันนี้" : `อีก ${left} วันปิดรอบ`, closed: false, detail };
}

/** เรื่องที่ต้องตามจากแต่ละกระบวนการ เรียงจากด่วนที่สุด: ค้างหลังปิดรอบ > เลยกำหนด > ใกล้ครบกำหนด */
export interface Concern {
  process: ProcessKey;
  status: Status;
  count: number;
  headline: string;
  note: string;
  /** รอบปิดแล้ว ทางแก้คือขยายช่วงเวลา */
  closed: boolean;
}

export function concernsOf(summaries: ProcessSummary[]): Concern[] {
  const list: (Concern & { rank: number })[] = [];
  for (const row of summaries) {
    if (row.process === "behavior") continue;
    const info = closeInfo(row);
    const label = PROCESS_LABEL[row.process];
    if (row.counts.overdue > 0) {
      const care = row.process === "care";
      list.push({
        process: row.process,
        status: "overdue",
        count: row.counts.overdue,
        headline: care ? `${label} เลยวันนัด` : `${label}ยังค้าง`,
        note: care ? "case ที่เลยวันนัดติดตามครั้งถัดไปแล้ว" : info.closed ? `${info.text} ยังทำไม่เสร็จ` : "เลยวันครบกำหนดแล้วยังไม่เสร็จ",
        closed: info.closed,
        rank: info.closed ? 0 : 1,
      });
    } else if (row.counts.near_due > 0) {
      list.push({
        process: row.process,
        status: "near_due",
        count: row.counts.near_due,
        headline: `${label}ใกล้ครบกำหนด`,
        note: row.process === "care" ? "case ที่ใกล้วันนัดติดตาม" : `${info.text} ยังทำไม่เสร็จ`,
        closed: false,
        rank: 2,
      });
    }
  }
  list.sort((a, b) => a.rank - b.rank || b.count - a.count);
  return list;
}

/** ปุ่มบนกล่องโฟกัส (พื้นฟ้าอ่อน) */
export const FOCUS_PRIMARY =
  "inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13.5px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60";
export const FOCUS_SECONDARY =
  "inline-flex h-10 items-center gap-1.5 rounded-lg border border-primary/30 bg-white px-4 text-[13.5px] font-semibold text-primary hover:bg-blue-50 disabled:opacity-60";

/** ① กล่องโฟกัส: เรื่องเดียวที่ด่วนที่สุด ที่เหลือเป็นบรรทัด "ถัดไป" */
export function FocusBox({
  concerns,
  unit,
  actions,
  onPickOther,
}: {
  concerns: Concern[];
  unit: (c: Concern) => string;
  actions: (c: Concern) => React.ReactNode;
  onPickOther: (c: Concern) => void;
}) {
  const [top, ...rest] = concerns;
  if (!top) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-5">
        <div className="text-[12.5px] font-semibold text-muted-foreground">ต้องตัดสินใจ</div>
        <p className="mt-1 text-[17px] font-bold">ยังไม่มีงานที่ใกล้ครบหรือเลยกำหนด</p>
      </div>
    );
  }
  return (
    <section
      aria-label="เรื่องที่ต้องตัดสินใจ"
      className="rounded-2xl border border-primary/20 border-l-4 border-l-primary bg-accent px-6 py-5"
    >
      <div className="text-[12.5px] font-semibold text-primary">
        {top.status === "overdue" ? "ต้องตัดสินใจ" : "ใกล้ครบกำหนด"}
      </div>
      <div className="mt-1 flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <span className="text-[17px] font-semibold">{top.headline}</span>
            <span className="text-[40px] leading-none font-bold text-primary tabular-nums">{n(top.count)}</span>
            <span className="text-[15px] font-semibold">{unit(top)}</span>
          </div>
          <p className="mt-2 text-[13px] text-muted-foreground">{top.note}</p>
        </div>
        <div className="flex flex-wrap gap-2">{actions(top)}</div>
      </div>
      {rest.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 border-t border-primary/15 pt-3 text-[12.5px] text-muted-foreground">
          ถัดไป
          {rest.map((c) => (
            <button
              key={c.process}
              type="button"
              onClick={() => onPickOther(c)}
              className="rounded-full border border-primary/25 bg-white px-2.5 py-0.5 font-medium text-primary hover:bg-blue-50"
            >
              {c.headline} {n(c.count)}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

/** ② การ์ด 4 กระบวนการ กดเพื่อเลือกกระบวนการนั้น (ครู: ดูรายชื่อ / แอดมิน: เรียงห้อง) */
export function ProcessCards({
  summaries,
  selected,
  onPick,
  totalNote,
}: {
  summaries: ProcessSummary[];
  selected: ProcessKey | null;
  onPick: (process: ProcessKey, status: PickStatus) => void;
  /** คำอธิบายตัวหาร เช่น "จาก 308 คนที่ต้องทำ SDQ" */
  totalNote: (row: ProcessSummary) => string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {CARD_PROCESSES.map((p) => {
        const row = summaries.find((r) => r.process === p);
        if (!row) return null;
        const active = selected === p;
        const open = openCount(row);
        const info = closeInfo(row);
        const care = p === "care";
        const pct = row.total === 0 ? 0 : Math.round((row.counts.done / row.total) * 100);
        // การติดตามช่วยเหลือไม่มีรอบให้ทำครบ ตัวเลขหลักจึงเป็น case ที่เลยวันนัด แทนแถบความคืบหน้า
        const big = care ? (row.counts.overdue > 0 ? row.counts.overdue : open) : open;
        const bigLabel = care ? (row.counts.overdue > 0 ? "เลยวันนัด" : "case เปิดอยู่") : "ค้าง";
        return (
          <button
            key={p}
            type="button"
            aria-pressed={active}
            onClick={() => onPick(p, care && row.counts.overdue > 0 ? "overdue" : "open")}
            className={`flex flex-col rounded-2xl border bg-card p-4 text-left sm:p-5 transition-colors hover:border-foreground/30 ${
              active ? "border-primary ring-2 ring-primary/20" : "border-border"
            }`}
          >
            <span className="text-[13.5px] font-semibold text-muted-foreground">{PROCESS_LABEL[p]}</span>
            <span className="mt-2 flex items-baseline gap-2">
              <span className={`text-[28px] leading-none font-bold tabular-nums sm:text-[34px] ${big === 0 ? "text-muted-foreground" : ""}`}>
                {n(big)}
              </span>
              <span className="text-[13.5px] font-semibold">{bigLabel}</span>
            </span>
            {care ? (
              <span className="mt-3 text-[12.5px] text-muted-foreground">
                เปิดอยู่ {n(open)} case
                {row.counts.near_due > 0 && ` · ใกล้วันนัด ${n(row.counts.near_due)}`}
                {row.counts.done > 0 && ` · ปิดแล้ว ${n(row.counts.done)}`}
              </span>
            ) : (
              <>
                <span className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </span>
                <span className="mt-1.5 text-[12px] text-muted-foreground tabular-nums">
                  {row.total === 0 ? "ยังไม่มีคนที่ต้องทำในรอบนี้" : <>ทำแล้ว {n(row.counts.done)} {totalNote(row)}</>}
                </span>
              </>
            )}
            <span
              title={info.detail || undefined}
              className={`mt-auto pt-3 text-[12px] ${info.closed ? "font-semibold text-foreground" : "text-muted-foreground"}`}
            >
              {info.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** ③ ผลคัดกรองเป็นแถบสีแถบเดียว (จุดเดียวในหน้าที่ใช้สีกลุ่มเสี่ยง) + ความประพฤติ */
export function RiskPanel({
  risk,
  total,
  behavior,
  watchActive,
  onPickWatch,
}: {
  risk: { green: number; amber: number; red: number };
  total: number;
  behavior?: ProcessSummary;
  watchActive?: boolean;
  onPickWatch?: () => void;
}) {
  const none = Math.max(0, total - risk.green - risk.amber - risk.red);
  const segs = [
    { key: "green", value: risk.green, className: "bg-risk-green" },
    { key: "amber", value: risk.amber, className: "bg-risk-amber" },
    { key: "red", value: risk.red, className: "bg-risk-red" },
    { key: "none", value: none, className: "bg-muted" },
  ];
  const watch = behavior?.counts.watch ?? 0;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-[15px] font-bold">ผลคัดกรอง</h2>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label="สัดส่วนผลคัดกรอง">
        {total > 0 &&
          segs.map((s) =>
            s.value > 0 ? <span key={s.key} className={s.className} style={{ width: `${(s.value / total) * 100}%` }} /> : null
          )}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        <Legend dot={<RiskDot group="red" />} label="กลุ่มมีปัญหา" value={risk.red} strong />
        <Legend dot={<RiskDot group="amber" />} label="กลุ่มเสี่ยง" value={risk.amber} strong />
        <Legend dot={<RiskDot group="green" />} label="ปกติ" value={risk.green} />
        <Legend dot={<span className="inline-block size-2.5 rounded-full bg-muted-foreground/30" />} label="ยังไม่มีผล" value={none} />
      </dl>
      {behavior && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3 text-[13px]">
          <span>
            <span className="font-semibold">ความประพฤติ</span>
            <span className="ml-2 text-muted-foreground">บันทึก {n(behavior.recorded ?? 0)} รายการ</span>
          </span>
          {watch > 0 && onPickWatch ? (
            <button
              type="button"
              aria-pressed={watchActive}
              onClick={onPickWatch}
              className={`rounded-lg border px-2.5 py-0.5 font-semibold tabular-nums ${
                watchActive ? "border-primary bg-accent text-primary" : "border-border hover:bg-muted"
              }`}
            >
              เฝ้าระวัง {n(watch)}
            </button>
          ) : (
            <span className="text-muted-foreground">เฝ้าระวัง {n(watch)}</span>
          )}
        </div>
      )}
    </div>
  );
}

function Legend({ dot, label, value, strong }: { dot: React.ReactNode; label: string; value: number; strong?: boolean }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        {dot} {label}
      </dt>
      <dd className={`mt-0.5 text-[20px] leading-tight tabular-nums ${strong ? "font-bold" : "font-semibold text-muted-foreground"}`}>
        {n(value)}
      </dd>
    </div>
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
