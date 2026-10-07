"use client";

/**
 * ไทม์ไลน์ภาคเรียน — แกนเวลาเดียวของทั้งภาคเรียน หนึ่งแถบต่อกิจกรรม
 * สีแถบ + ไอคอน + ข้อความสถานะ (ไม่ใช้สีอย่างเดียว) คลิกหรือกด Enter ที่แถบเพื่อเปิดแผงแก้ไข
 */

import { AlertTriangle, BellRing, CircleCheck, CircleDashed, Clock, Lock } from "lucide-react";
import { formatThaiDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import {
  OPERATING_ACTIVITIES,
  OPERATING_ACTIVITY_LABEL,
  type OperatingActivity,
  type OperatingWindow,
} from "@/lib/types";
import {
  PHASE_LABEL,
  barSpan,
  countdownText,
  monthTicks,
  phaseOf,
  remindDateOf,
  termPosition,
  windowWarnings,
  type WindowPhase,
} from "./window-math";

export const PHASE_CHIP: Record<WindowPhase, string> = {
  none: "bg-muted text-muted-foreground",
  upcoming: "bg-accent text-primary",
  open: "bg-risk-green-bg text-risk-green",
  closing: "bg-risk-amber-bg text-risk-amber",
  closed: "bg-muted text-muted-foreground",
};

const PHASE_BAR: Record<WindowPhase, string> = {
  none: "",
  upcoming: "border-2 border-dashed border-primary bg-accent",
  open: "bg-risk-green",
  closing: "bg-risk-amber",
  closed: "bg-muted-foreground/40",
};

export const PHASE_ICON = {
  none: CircleDashed,
  upcoming: Clock,
  open: CircleCheck,
  closing: BellRing,
  closed: Lock,
} as const;

export function PhaseChip({ phase }: { phase: WindowPhase }) {
  const Icon = PHASE_ICON[phase];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${PHASE_CHIP[phase]}`}
    >
      <Icon className="size-3.5" aria-hidden />
      {PHASE_LABEL[phase]}
    </span>
  );
}

export function OperatingWindowsTimeline({
  today,
  selected,
  onSelect,
}: {
  today: string;
  selected: OperatingActivity | null;
  onSelect: (activity: OperatingActivity) => void;
}) {
  const store = useStore();
  const term = store.currentTerm;
  const windows: Partial<Record<OperatingActivity, OperatingWindow>> = {};
  for (const a of OPERATING_ACTIVITIES) {
    const w = store.windowOf(a);
    if (w) windows[a] = w;
  }
  const warnings = windowWarnings(term, windows, today);
  const ticks = monthTicks(term);
  const todayPct = termPosition(term, today) * 100;
  const todayInTerm = todayPct >= 0 && todayPct <= 100;

  return (
    <section aria-labelledby="win-timeline-h" className="rounded-xl border border-border bg-card p-4">
      <h3 id="win-timeline-h" className="text-[14px] font-bold">
        ไทม์ไลน์ภาคเรียน
      </h3>
      <p className="mt-0.5 mb-3 text-[12.5px] text-muted-foreground">
        {term.label} · {formatThaiDate(term.startDate)} – {formatThaiDate(term.endDate)} · เส้นแดงคือวันนี้ (
        {formatThaiDate(today)}) · คลิกแถบเพื่อแก้ไขช่วงเวลา
      </p>

      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="ไทม์ไลน์ช่วงดำเนินงาน เลื่อนซ้ายขวาได้">
        <div className="relative min-w-[680px]">
          {/* ชั้นเส้นเดือนและเส้น "วันนี้" ทับเฉพาะพื้นที่แกนเวลา */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-[8.5rem] left-[9.5rem]">
            {ticks.map((t) => (
              <span key={t.key} className="absolute inset-y-0 w-px bg-border" style={{ left: `${t.pos * 100}%` }} />
            ))}
            {todayInTerm && (
              <span className="absolute inset-y-0 z-10 w-0.5 bg-risk-red" style={{ left: `${todayPct}%` }}>
                <span className="absolute -top-0.5 left-1 rounded bg-risk-red px-1 text-[10.5px] font-semibold whitespace-nowrap text-white">
                  วันนี้
                </span>
              </span>
            )}
          </div>

          <div className="flex h-5 text-[11.5px] text-muted-foreground">
            <span className="w-[9.5rem] shrink-0" />
            <span className="relative flex-1">
              {ticks.map((t) => (
                <span key={t.key} className="absolute whitespace-nowrap" style={{ left: `${t.pos * 100}%` }}>
                  <span className="pl-1">{t.label}</span>
                </span>
              ))}
            </span>
            <span className="w-[8.5rem] shrink-0" />
          </div>

          <div className="space-y-1.5 pt-3">
            {OPERATING_ACTIVITIES.map((a) => {
              const w = windows[a];
              const phase = phaseOf(store.windowStatusOf(a), store.isWindowClosingSoon(a));
              const warn = warnings[a] ?? [];
              const span = w ? barSpan(term, w) : null;
              const remindPos = w ? termPosition(term, remindDateOf(w)) : 0;
              return (
                <div key={a} className={`flex items-center rounded-lg ${selected === a ? "bg-accent/60" : ""}`}>
                  <span className="flex w-[9.5rem] shrink-0 items-center gap-1.5 pr-2 text-[13px]">
                    <span className="truncate">{OPERATING_ACTIVITY_LABEL[a]}</span>
                    {warn.length > 0 && (
                      <span title={warn.join("\n")} role="img" aria-label={`คำเตือน: ${warn.join(" ")}`}>
                        <AlertTriangle className="size-3.5 shrink-0 text-risk-amber" />
                      </span>
                    )}
                  </span>
                  <span className="relative h-9 flex-1">
                    {w && span ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onSelect(a)}
                          aria-label={`${OPERATING_ACTIVITY_LABEL[a]} ${PHASE_LABEL[phase]} ${formatThaiDate(w.opensAt)} ถึง ${formatThaiDate(w.closesAt)} — แก้ไขช่วงเวลา`}
                          title={`${formatThaiDate(w.opensAt)} – ${formatThaiDate(w.closesAt)}`}
                          className={`absolute inset-y-1.5 rounded-md outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring ${PHASE_BAR[phase]}`}
                          style={{ left: `${span.left * 100}%`, width: `${span.width * 100}%` }}
                        />
                        {w.remindDaysBefore > 0 && phase !== "closed" && remindPos >= 0 && (
                          <span
                            aria-hidden
                            title={`แจ้งเตือนล่วงหน้า ${w.remindDaysBefore} วัน (${formatThaiDate(remindDateOf(w))})`}
                            className="pointer-events-none absolute top-0.5 bottom-0.5 z-[5] flex flex-col items-center"
                            style={{ left: `${Math.min(1, remindPos) * 100}%` }}
                          >
                            <BellRing className="size-3 text-foreground" />
                            <span className="w-0.5 flex-1 bg-foreground" />
                          </span>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelect(a)}
                        className="absolute inset-y-1.5 left-0 rounded-md border border-dashed border-border px-2 text-[12px] text-muted-foreground hover:bg-muted"
                      >
                        ยังไม่กำหนด — คลิกเพื่อกำหนดช่วงเวลา
                      </button>
                    )}
                  </span>
                  <span className="flex w-[8.5rem] shrink-0 justify-end pl-2">
                    <PhaseChip phase={phase} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
        <BellRing className="size-3" aria-hidden /> เครื่องหมายระฆังบนแถบ = วันที่เริ่มแจ้งเตือนครูล่วงหน้าก่อนปิดรับ
      </p>

      {Object.keys(warnings).length > 0 && (
        <ul className="mt-3 space-y-1 rounded-lg bg-risk-amber-bg px-3 py-2.5 text-[12px] leading-relaxed text-risk-amber">
          {OPERATING_ACTIVITIES.flatMap((a) =>
            (warnings[a] ?? []).map((m) => (
              <li key={`${a}-${m}`} className="flex gap-2">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>
                  <b>{OPERATING_ACTIVITY_LABEL[a]}</b> · {m}
                </span>
              </li>
            ))
          )}
        </ul>
      )}

      {/* ทางเลือกข้อความสำหรับโปรแกรมอ่านหน้าจอ */}
      <ul className="sr-only" aria-label="สรุปช่วงดำเนินงานของภาคเรียนเป็นข้อความ">
        {OPERATING_ACTIVITIES.map((a) => {
          const w = windows[a];
          const phase = phaseOf(store.windowStatusOf(a), store.isWindowClosingSoon(a));
          return (
            <li key={a}>
              {OPERATING_ACTIVITY_LABEL[a]}: {PHASE_LABEL[phase]}
              {w
                ? ` เปิด ${formatThaiDate(w.opensAt)} ปิด ${formatThaiDate(w.closesAt)} แจ้งเตือนล่วงหน้า ${w.remindDaysBefore} วัน ${countdownText(w, today)}`
                : ""}
              {(warnings[a] ?? []).map((m) => ` คำเตือน: ${m}`)}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
