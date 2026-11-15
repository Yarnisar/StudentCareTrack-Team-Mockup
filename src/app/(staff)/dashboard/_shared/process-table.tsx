"use client";

/**
 * ส่วนที่ภาพรวมของครูประจำชั้นและผู้ดูแลระบบใช้ร่วมกัน (UC1 Subflow A) จัดลำดับการมอง 3 ชั้น
 * ① FocusBox: เรื่องที่ด่วนที่สุดเรื่องเดียว พื้นฟ้าอ่อน + แถบน้ำเงินซ้าย + ตัวเลขใหญ่สีน้ำเงินเป็นจุดนำสายตา พร้อมปุ่มลงมือ
 * ② ProcessCards: การ์ด 4 กระบวนการ ตัวเลขใหญ่คืองานค้าง ส่วนอื่นเป็นข้อมูลรอง
 * ③ RiskPanel: ผลคัดกรองเป็นแถบสีแถบเดียว + ความประพฤติ
 * สถานะงานใช้สีกลาง (พื้นเข้ม = ด่วน) เพราะสีเขียว/เหลือง/แดงสงวนไว้สำหรับผลคัดกรองเท่านั้น
 */

import { formatThaiDate } from "@/lib/format";
import { DEMO_TODAY } from "@/lib/mock-data";
import { daysBetween } from "@/lib/periods";
import { PROCESS_LABEL, type ProcessKey, type ProcessSummary, type Status } from "../_homeroom/process-status";

/** ตัวเลือกบนการ์ด: ทั้งงานค้างของกระบวนการ หรือสถานะเดียว */
export type PickStatus = Status | "open";

export const CARD_PROCESSES = ["screening", "assessment", "home_visit", "care"] as const;

const n = (v: number) => v.toLocaleString("th-TH");

export const openCount = (row: ProcessSummary) => row.counts.pending + row.counts.near_due + row.counts.overdue;

interface CloseInfo {
  text: string;
  /** ทุกรอบของกระบวนการนี้พ้นวันปิดแล้ว */
  closed: boolean;
  /** พ้นวันปิดและผู้ดูแลระบบตั้ง "ห้ามบันทึกย้อนหลัง" ไว้ → แบบฟอร์มปิดรับ ต้องขยายช่วงเวลาก่อน (UC9) */
  locked: boolean;
  /** ช่วงเวลาที่ปิดล่าสุด ใช้เปิดแผงในหน้าตั้งค่าตรงตัว */
  windowId?: string;
  date?: string;
  /** เหลือกี่วันก่อนปิดรอบ (ติดลบ = ปิดแล้ว ไม่มี = ไม่มีวันปิด) ใช้เรียงการ์ด */
  days?: number;
  detail: string;
}

/** วันปิดรอบที่ใกล้ที่สุดที่ยังไม่ผ่าน หรือวันปิดล่าสุดที่ผ่านไปแล้ว */
function closeInfo(row: ProcessSummary): CloseInfo {
  if (row.process === "care") return { text: "ตามวันนัดติดตามของแต่ละกรณี", closed: false, locked: false, detail: "" };
  if (row.closes.length === 0) return { text: "ยังไม่ตั้งช่วงเวลา", closed: false, locked: false, detail: "" };
  const detail = row.closes.map((c) => `${c.label} ${formatThaiDate(c.date)}`).join("\n");
  const sorted = [...row.closes].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = sorted.find((c) => c.date >= DEMO_TODAY);
  if (!upcoming) {
    // กระบวนการหนึ่งมีได้หลายช่วงเวลา (คัดกรอง = 6 มิติ → Red Flag → 9S): เลือกช่วงที่ปิดรับก่อน
    // ไม่มีช่วงไหนปิดรับ เลือกช่วงแรก (ขั้นหลักของกระบวนการ) ปุ่มขยายเวลาจะเปิดแผงของช่วงนั้น
    const target = sorted.find((c) => c.locked) ?? sorted[0];
    return {
      text: target.locked ? `ปิดรับแล้ว ${formatThaiDate(target.date)}` : `ปิดรอบแล้ว ${formatThaiDate(target.date)} · ส่งช้าได้`,
      closed: true,
      locked: target.locked,
      windowId: target.id,
      date: target.date,
      days: daysBetween(DEMO_TODAY, target.date),
      detail,
    };
  }
  const left = daysBetween(DEMO_TODAY, upcoming.date);
  return { text: left === 0 ? "ปิดรอบวันนี้" : `อีก ${left} วันปิดรอบ`, closed: false, locked: false, windowId: upcoming.id, days: left, detail };
}

/** เรื่องที่ต้องตามจากแต่ละกระบวนการ เรียงจากด่วนที่สุด: ปิดรับแล้ว > ยังไม่เริ่มช่วยเหลือ / เลยกำหนด > ใกล้ครบกำหนด */
export interface Concern {
  process: ProcessKey;
  status: Status;
  count: number;
  headline: string;
  note: string;
  /** พ้นวันปิดแล้ว */
  closed: boolean;
  /** ปิดรับแล้ว ส่งเพิ่มไม่ได้ ทางแก้คือขยายช่วงเวลา */
  locked: boolean;
  windowId?: string;
}

/** ผู้ดูแลระบบแก้ได้ด้วยการขยายช่วงเวลา ส่วนครูทำได้แค่ติดต่อผู้ดูแลระบบ ข้อความจึงต่างกัน */
export function concernsOf(summaries: ProcessSummary[], audience: "admin" | "teacher" = "admin"): Concern[] {
  const list: (Concern & { rank: number })[] = [];
  for (const row of summaries) {
    if (row.process === "behavior") continue;
    const info = closeInfo(row);
    const label = PROCESS_LABEL[row.process];
    const care = row.process === "care";
    const base = { process: row.process, closed: info.closed, locked: info.locked, windowId: info.windowId };
    if (row.counts.overdue > 0) {
      const date = info.date ? formatThaiDate(info.date) : "";
      list.push({
        ...base,
        status: "overdue",
        count: row.counts.overdue,
        headline: care ? `${label} เลยวันนัด` : `${label}เลยกำหนด`,
        note: care
          ? "กรณีที่เลยวันนัดติดตามครั้งถัดไปแล้ว"
          : info.locked
            ? audience === "admin"
              ? `ปิดรับแล้วเมื่อ ${date} ครูส่งเพิ่มไม่ได้จนกว่าจะขยายช่วงเวลา`
              : `ปิดรับแล้วเมื่อ ${date} ส่งเพิ่มไม่ได้ ติดต่อผู้ดูแลระบบเพื่อขอขยายช่วงเวลา`
            : info.closed
              ? `ปิดรอบแล้วเมื่อ ${date} แต่ยังรับส่งช้าได้`
              : "เลยวันครบกำหนดแล้ว",
        rank: info.locked ? 0 : 1,
      });
    } else if (row.counts.near_due > 0) {
      list.push({
        ...base,
        status: "near_due",
        count: row.counts.near_due,
        headline: `${label}ใกล้ครบกำหนด`,
        note: care ? "กรณีที่ใกล้วันนัดติดตาม" : `${info.text} ยังทำไม่เสร็จ`,
        rank: 2,
      });
    }
    // กลุ่มมีปัญหาที่ยังไม่เริ่มช่วยเหลือ ด่วนพอ ๆ กับการเลยวันนัด แม้ยังไม่มีวันครบกำหนด
    if (care && row.counts.pending > 0) {
      list.push({
        ...base,
        status: "pending",
        count: row.counts.pending,
        headline: "การช่วยเหลือที่ยังไม่เริ่ม",
        note: "รวมคนที่ยังไม่เปิดกรณี กรณีที่ยังไม่วางแผน และกรณีที่ยังไม่กำหนดวันติดตาม",
        rank: 1,
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
  "inline-flex h-10 items-center gap-1.5 rounded-lg border border-primary/30 bg-white px-4 text-[13.5px] font-semibold text-primary hover:bg-violet-50 disabled:opacity-60";

/** ① กล่องโฟกัส: เรื่องเดียวที่ด่วนที่สุด ที่เหลือเป็นบรรทัด "ถัดไป" */
export function FocusBox({
  concerns,
  unit,
  actions,
  onPickOther,
  audience = "admin",
}: {
  concerns: Concern[];
  unit: (c: Concern) => string;
  actions: (c: Concern) => React.ReactNode;
  onPickOther: (c: Concern) => void;
  audience?: "admin" | "teacher";
}) {
  const [top, ...rest] = concerns;
  const urgent = audience === "admin" ? "ต้องตัดสินใจ" : "ต้องรีบทำ";
  if (!top) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-5">
        <div className="text-[12.5px] font-semibold text-muted-foreground">{urgent}</div>
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
        {top.status === "near_due" ? "ใกล้ครบกำหนด" : urgent}
      </div>
      <div className="mt-1 flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1 basis-60">
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
          เรื่องอื่นที่ใกล้ครบกำหนด
          {rest.map((c) => (
            <button
              key={`${c.process}-${c.status}`}
              type="button"
              onClick={() => onPickOther(c)}
              className="rounded-full border border-primary/25 bg-white px-2.5 py-0.5 font-medium text-primary hover:bg-violet-50"
            >
              {c.headline} {n(c.count)}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

/** ② การ์ด 4 กระบวนการ กดเพื่อเลือกกระบวนการนั้น (ครู: ดูรายชื่อ / ผู้ดูแลระบบ: เรียงห้อง) */
export function ProcessCards({
  summaries,
  selected,
  onPick,
  totalNote,
  audience = "admin",
}: {
  summaries: ProcessSummary[];
  selected: ProcessKey | null;
  onPick: (process: ProcessKey, status: PickStatus) => void;
  /** คำอธิบายตัวหาร เช่น "จาก 308 คนที่ต้องทำ SDQ" */
  totalNote: (row: ProcessSummary) => string;
  /** ครู: ตัวเลขใหญ่คืองานที่ครูลงมือได้ และเรียงการ์ดตามวันปิดรอบที่ใกล้สุด */
  audience?: "admin" | "teacher";
}) {
  const teacher = audience === "teacher";
  // ครู: เรียงการ์ดตามวันปิดรอบ ใกล้สุดก่อน (ปิดแล้วขึ้นก่อน) การติดตามช่วยเหลือไม่มีวันปิดรอบ ไว้ท้าย
  const order = teacher
    ? [...CARD_PROCESSES].sort((a, b) => {
        const da = summaries.find((r) => r.process === a);
        const db = summaries.find((r) => r.process === b);
        const ka = da ? (closeInfo(da).days ?? 9999) : 9999;
        const kb = db ? (closeInfo(db).days ?? 9999) : 9999;
        return ka - kb;
      })
    : [...CARD_PROCESSES];
  const nearestId = teacher
    ? order.find((p) => {
        const r = summaries.find((x) => x.process === p);
        return r && r.process !== "care" && r.actionable > 0 && (closeInfo(r).days ?? 9999) <= 14;
      })
    : undefined;
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {order.map((p) => {
        const row = summaries.find((r) => r.process === p);
        if (!row) return null;
        const active = selected === p;
        const open = openCount(row);
        const info = closeInfo(row);
        const care = p === "care";
        const pct = row.total === 0 ? 0 : Math.round((row.counts.done / row.total) * 100);
        // การติดตามช่วยเหลือไม่มีรอบให้ทำครบ ตัวเลขหลักจึงเป็น case ที่เลยวันนัด แทนแถบความคืบหน้า
        const big = teacher ? row.actionable : care ? (row.counts.overdue > 0 ? row.counts.overdue : open) : open;
        const bigLabel = teacher
          ? care
            ? "กรณีที่ต้องลงมือ"
            : "คนที่ทำได้เลย"
          : care
            ? row.counts.overdue > 0
              ? "เลยวันนัด"
              : "กรณีเปิดอยู่"
            : "ต้องทำ";
        const nearest = p === nearestId;
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
                {/* ตัวเลขหลักเป็น "กรณีเปิดอยู่" แล้ว ไม่พูดซ้ำ */}
                {[
                  teacher && row.counts.done > 0 && `ปิดแล้ว ${n(row.counts.done)}`,
                  !teacher && row.counts.overdue > 0 && `เปิดอยู่ ${n(open)}`,
                  row.counts.overdue > 0 && teacher && `เลยวันนัด ${n(row.counts.overdue)}`,
                  row.counts.pending > 0 && `ยังไม่เริ่ม ${n(row.counts.pending)}`,
                  row.counts.near_due > 0 && `ใกล้วันนัด ${n(row.counts.near_due)}`,
                  !teacher && row.counts.done > 0 && `ปิดแล้ว ${n(row.counts.done)}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            ) : (
              <>
                <span className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </span>
                {teacher && row.waiting > 0 && (
                  <span className="mt-2 text-[12px] text-muted-foreground tabular-nums">รอผู้อื่น {n(row.waiting)}</span>
                )}
                <span className="mt-1.5 text-[12px] text-muted-foreground tabular-nums">
                  {row.total === 0 ? "ยังไม่มีคนที่ต้องทำในรอบนี้" : <>ทำแล้ว {n(row.counts.done)} {totalNote(row)}</>}
                </span>
              </>
            )}
            <span
              title={info.detail || undefined}
              className={`mt-auto pt-3 text-[12px] ${info.locked || nearest ? "font-semibold text-foreground" : "text-muted-foreground"}`}
            >
              {nearest && (
                <span className="mr-1.5 rounded-full bg-foreground px-2 py-0.5 text-[11px] font-semibold text-background">
                  ใกล้ปิดที่สุด
                </span>
              )}
              {info.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * ③ ผลคัดกรองของทั้งโรงเรียน (ผู้ดูแลระบบ เป็นจำนวน): ตัวเลขนำ "คนต้องดูแล" แล้วเป็นแถบบางเรียงหนัก → เบา
 * แดงอิ่มสีเดียว เหลืองและเขียวเป็นโทนอ่อน มีช่องขาวคั่น (ฝั่งครูใช้ RiskPanelByDimension) เฝ้าระวังที่ถึงเกณฑ์ใช้แดงตามกฎ
 */
/** จำนวนนักเรียนที่ผลไม่ปกติในแต่ละมิติ (ผู้ดูแลระบบเห็นเป็นจำนวนเท่านั้น ไม่มีรายชื่อ) */
export interface DimensionTally {
  key: string;
  label: string;
  red: number;
  amber: number;
}

export function RiskPanel({
  risk,
  total,
  dimensions,
  behavior,
  watchActive,
  onPickWatch,
}: {
  risk: { green: number; amber: number; red: number };
  total: number;
  /** ผลรายมิติ (ไม่รวมสุขภาพจิต) ฐานคือคนที่คัดกรองแล้ว เรียงมิติที่มีปัญหามากไว้ก่อน */
  dimensions?: DimensionTally[];
  behavior?: ProcessSummary;
  watchActive?: boolean;
  onPickWatch?: () => void;
}) {
  const screened = risk.green + risk.amber + risk.red;
  const dimRows = [...(dimensions ?? [])].sort((a, b) => b.red - a.red || b.amber - a.amber);
  const none = Math.max(0, total - screened);
  const need = risk.red + risk.amber;
  const segs = [
    { key: "red", value: risk.red, className: "bg-risk-red" },
    { key: "amber", value: risk.amber, className: "bg-risk-amber-soft" },
    { key: "green", value: risk.green, className: "bg-risk-green-soft" },
    { key: "none", value: none, className: "bg-risk-none" },
  ];
  const watch = behavior?.counts.watch ?? 0;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-[15px] font-bold">ผลคัดกรอง</h2>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
        <span className="text-[34px] leading-none font-bold tabular-nums">{n(need)}</span>
        <span className="text-[14px] font-semibold">คนต้องดูแล</span>
        <span className="ml-auto text-[12px] text-muted-foreground">จาก {n(screened)} คนที่คัดกรองแล้ว</span>
      </div>
      <div className="mt-3 flex h-1.5 gap-[2px]" role="img" aria-label="สัดส่วนผลคัดกรอง">
        {total > 0 &&
          segs.map((s) =>
            s.value > 0 ? <span key={s.key} className={`rounded-full ${s.className}`} style={{ width: `${(s.value / total) * 100}%` }} /> : null
          )}
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block size-2.5 rounded-full bg-risk-red" /> มีปัญหา <b className="text-foreground tabular-nums">{n(risk.red)}</b>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block size-2.5 rounded-full bg-risk-amber-soft" /> เสี่ยง <b className="text-foreground tabular-nums">{n(risk.amber)}</b>
        </span>
        <span className="tabular-nums">ปกติ {n(risk.green)}</span>
        {none > 0 && <span className="tabular-nums">ยังไม่คัดกรอง {n(none)}</span>}
      </p>
      {dimRows.length > 0 && screened > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <h3 className="text-[13px] font-semibold">รายมิติ</h3>
          <ul className="mt-1.5 space-y-1.5">
            {dimRows.map((d) => (
              <li key={d.key} className="grid grid-cols-[104px_minmax(0,1fr)] items-center gap-x-2.5 gap-y-0.5 sm:grid-cols-[104px_minmax(0,1fr)_auto]">
                <span className="text-[12.5px] leading-tight">{d.label}</span>
                <span className="flex h-2 gap-[2px] overflow-hidden rounded-full bg-risk-none" role="img" aria-label={`${d.label} มีปัญหา ${d.red} เสี่ยง ${d.amber}`}>
                  {d.red > 0 && <i className="bg-risk-red" style={{ width: `${(d.red / screened) * 100}%` }} />}
                  {d.amber > 0 && <i className="bg-risk-amber-soft" style={{ width: `${(d.amber / screened) * 100}%` }} />}
                </span>
                <span className="col-start-2 text-[11.5px] tabular-nums text-muted-foreground sm:col-start-auto sm:min-w-[92px] sm:text-right">
                  {d.red > 0 || d.amber > 0 ? (
                    <>
                      {d.red > 0 && <b className="text-foreground">มีปัญหา {n(d.red)}</b>}
                      {d.red > 0 && d.amber > 0 && " · "}
                      {d.amber > 0 && <>เสี่ยง {n(d.amber)}</>}
                    </>
                  ) : (
                    "–"
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[11.5px] text-muted-foreground">นับเฉพาะคนที่คัดกรองแล้ว คนเดียวติดได้หลายมิติ จึงไม่รวมตัวเลขข้ามมิติ</p>
        </div>
      )}
      {behavior && (
        <div className="mt-4 border-t border-border pt-3 text-[13px]">
          <div>
            <span className="font-semibold">ความประพฤติ</span>
            <span className="ml-2 text-muted-foreground">บันทึก {n(behavior.recorded ?? 0)} รายการ</span>
          </div>
          <div className="mt-2">
            {watch > 0 && onPickWatch ? (
              <button
                type="button"
                aria-pressed={watchActive}
                onClick={onPickWatch}
                className={`rounded-lg bg-risk-red px-2.5 py-0.5 font-semibold text-white tabular-nums ${watchActive ? "ring-2 ring-primary/40" : ""}`}
              >
                เฝ้าระวัง {n(watch)}
              </button>
            ) : (
              <span className="text-muted-foreground">ไม่มีผู้เฝ้าระวัง</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** สถานะของงาน แยกจากสีกลุ่มเสี่ยง: เกินกำหนดเข้มที่สุด ใกล้ครบกำหนดรองลงมา */
/** เฝ้าระวังในเกณฑ์จริง = สีแดง (ข้อยกเว้นที่ตกลงไว้ว่าถึงเกณฑ์ความประพฤติใช้แดง) */
export const WATCH_ACTIVE_TAG = "bg-risk-red text-white";

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
