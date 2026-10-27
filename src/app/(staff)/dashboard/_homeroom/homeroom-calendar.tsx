"use client";

/**
 * ปฏิทินของภาพรวมครูประจำชั้น: ตอบว่า "งานไหนต้องเสร็จเมื่อไร" (รายงานหัวข้อ 3.1.3)
 * แถบช่วงเวลาของแต่ละกระบวนการด้านบน → ตารางรายเดือน → กดวันเพื่อดูรายการและไปทำต่อ
 * บนจอเล็กแสดงเป็นรายการตามวันแทนตารางรายเดือน
 * วันที่ทั้งหมดเป็น พ.ศ. แปลงเป็น ค.ศ. (-543) เฉพาะตอนคำนวณวันในสัปดาห์
 */

import { useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, Flag, House, Target, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { formatThaiDate } from "@/lib/format";
import { DEMO_TODAY } from "@/lib/mock-data";
import {
  EVENT_KINDS,
  EVENT_LABEL,
  type CalendarEvent,
  type EventKind,
  type PeriodRange,
} from "./calendar-events";

const MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const WEEKDAYS_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const WEEKDAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

const EVENT_ICON: Record<EventKind, LucideIcon> = {
  visit: House,
  case_followup: CalendarClock,
  close: Flag,
  case_target: Target,
};

const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (year: number, month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`;
const parse = (date: string) => date.split("-").map(Number) as [number, number, number];
const daysIn = (year: number, month: number) => new Date(year - 543, month, 0).getDate();
const weekdayOf = (date: string) => {
  const [y, m, d] = parse(date);
  return new Date(y - 543, m - 1, d).getDay();
};

export function HomeroomCalendar({ events, periods }: { events: CalendarEvent[]; periods: PeriodRange[] }) {
  const [todayYear, todayMonth] = parse(DEMO_TODAY);
  const [month, setMonth] = useState({ year: todayYear, month: todayMonth });
  const [selected, setSelected] = useState(DEMO_TODAY);
  const [kinds, setKinds] = useState<EventKind[]>(EVENT_KINDS);

  const shown = events.filter((e) => kinds.includes(e.kind));
  const prefix = `${month.year}-${pad(month.month)}`;
  const inMonth = shown.filter((e) => e.date.startsWith(prefix));
  const onDay = (date: string) => shown.filter((e) => e.date === date);

  const move = (delta: number) => {
    const index = month.month - 1 + delta;
    setMonth({ year: month.year + Math.floor(index / 12), month: ((index % 12) + 12) % 12 + 1 });
  };
  const goToday = () => {
    setMonth({ year: todayYear, month: todayMonth });
    setSelected(DEMO_TODAY);
  };
  const toggleKind = (kind: EventKind) =>
    setKinds(kinds.includes(kind) ? kinds.filter((k) => k !== kind) : [...kinds, kind]);

  const total = daysIn(month.year, month.month);
  const lead = weekdayOf(keyOf(month.year, month.month, 1));
  const cells = [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  const monthStart = keyOf(month.year, month.month, 1);
  const monthEnd = keyOf(month.year, month.month, total);
  const openPeriods = periods.filter((p) => p.opensAt <= monthEnd && p.closesAt >= monthStart);
  const selectedEvents = onDay(selected);

  return (
    <>
      <Card className="mt-5">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mr-2 text-[15.5px] font-bold">
              {MONTHS[month.month - 1]} {month.year}
            </h2>
            <Button variant="outline" size="icon-sm" aria-label="เดือนก่อน" onClick={() => move(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon-sm" aria-label="เดือนถัดไป" onClick={() => move(1)}>
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToday}>
              วันนี้
            </Button>
            <span className="flex-1" />
            {EVENT_KINDS.map((kind) => {
              const Icon = EVENT_ICON[kind];
              const active = kinds.includes(kind);
              return (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleKind(kind)}
                  className={
                    active
                      ? "flex h-8 items-center gap-1.5 rounded-lg border border-primary bg-accent px-3 text-[12.5px] font-semibold text-primary"
                      : "flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-[12.5px] text-muted-foreground hover:bg-muted"
                  }
                >
                  <Icon className="size-3.5" /> {EVENT_LABEL[kind]}
                </button>
              );
            })}
          </div>

          {openPeriods.length > 0 && (
            <div className="mt-4 space-y-1.5">
              {openPeriods.map((p) => (
                <PeriodBar key={p.id} period={p} monthStart={monthStart} monthEnd={monthEnd} total={total} />
              ))}
            </div>
          )}

          <div className="mt-4 hidden md:block">
            <div className="grid grid-cols-7 text-center text-[12px] font-medium text-muted-foreground">
              {WEEKDAYS_SHORT.map((d) => (
                <div key={d} className="py-1.5">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) =>
                day === null ? (
                  <div key={`blank-${i}`} />
                ) : (
                  <DayCell
                    key={day}
                    day={day}
                    date={keyOf(month.year, month.month, day)}
                    events={onDay(keyOf(month.year, month.month, day))}
                    selected={selected === keyOf(month.year, month.month, day)}
                    onSelect={setSelected}
                  />
                )
              )}
            </div>
          </div>

          <div className="mt-4 space-y-4 md:hidden">
            {[...new Set(inMonth.map((e) => e.date))].map((date) => (
              <div key={date}>
                <div className="mb-1.5 text-[13px] font-semibold">{dayTitle(date)}</div>
                <div className="space-y-2">
                  {onDay(date).map((e, i) => (
                    <EventRow key={i} event={e} />
                  ))}
                </div>
              </div>
            ))}
            {inMonth.length === 0 && (
              <p className="py-8 text-center text-[13px] text-muted-foreground">ไม่มีรายการในเดือนนี้</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-5 hidden md:block">
        <CardContent className="p-6">
          <h2 className="text-[15.5px] font-bold">
            {dayTitle(selected)} · {selectedEvents.length} รายการ
          </h2>
          <div className="mt-4 space-y-2">
            {selectedEvents.map((e, i) => (
              <EventRow key={i} event={e} />
            ))}
            {selectedEvents.length === 0 && (
              <p className="py-8 text-center text-[13px] text-muted-foreground">
                ไม่มีรายการในวันนี้ เลือกวันอื่นในปฏิทิน
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

const dayTitle = (date: string) =>
  `${date === DEMO_TODAY ? "วันนี้ · " : ""}วัน${WEEKDAYS[weekdayOf(date)]}ที่ ${formatThaiDate(date)}`;

function DayCell({
  day,
  date,
  events,
  selected,
  onSelect,
}: {
  day: number;
  date: string;
  events: CalendarEvent[];
  selected: boolean;
  onSelect: (date: string) => void;
}) {
  const visible = events.slice(0, 2);
  return (
    <button
      type="button"
      onClick={() => onSelect(date)}
      aria-pressed={selected}
      aria-label={`${dayTitle(date)} ${events.length} รายการ`}
      className={`flex min-h-24 flex-col gap-1 rounded-lg border p-1.5 text-left ${
        selected ? "border-primary bg-accent" : "border-border hover:bg-muted"
      }`}
    >
      <span
        className={
          date === DEMO_TODAY
            ? "flex size-6 items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground"
            : "flex size-6 items-center justify-center text-[12px] text-muted-foreground"
        }
      >
        {day}
      </span>
      {visible.map((e, i) => {
        const Icon = EVENT_ICON[e.kind];
        return (
          <span
            key={i}
            className={`flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-[11px] ${
              e.attention ? "border border-foreground/40 font-semibold text-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            <Icon className="size-3 shrink-0" />
            <span className="truncate">{e.title}</span>
          </span>
        );
      })}
      {events.length > visible.length && (
        <span className="px-1.5 text-[11px] text-muted-foreground">อีก {events.length - visible.length} รายการ</span>
      )}
    </button>
  );
}

/** แถบช่วงเวลาของกระบวนการในเดือนที่ดูอยู่ ปลายแถบคือวันปิดรอบ */
function PeriodBar({
  period,
  monthStart,
  monthEnd,
  total,
}: {
  period: PeriodRange;
  monthStart: string;
  monthEnd: string;
  total: number;
}) {
  const from = period.opensAt < monthStart ? 1 : parse(period.opensAt)[2];
  const to = period.closesAt > monthEnd ? total : parse(period.closesAt)[2];
  const closesHere = period.closesAt <= monthEnd;
  return (
    <div className="flex items-center gap-3 text-[12px]">
      <span className="w-24 shrink-0 font-medium sm:w-40">{period.label}</span>
      <div className="relative h-2 flex-1 rounded-full bg-muted">
        <div
          className="absolute inset-y-0 rounded-full bg-primary/30"
          style={{ left: `${((from - 1) / total) * 100}%`, width: `${((to - from + 1) / total) * 100}%` }}
        />
      </div>
      <span className={`shrink-0 text-right sm:w-44 ${closesHere ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
        {closesHere ? `ปิดรอบ ${formatThaiDate(period.closesAt)}` : `ถึง ${formatThaiDate(period.closesAt)}`}
      </span>
    </div>
  );
}

function EventRow({ event }: { event: CalendarEvent }) {
  const Icon = EVENT_ICON[event.kind];
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3.5">
      <span
        className={`flex w-36 shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px] font-semibold ${
          event.attention ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="size-3.5" /> {EVENT_LABEL[event.kind]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold">{event.title}</span>
        <span className="block text-[12px] text-muted-foreground">
          {event.student && `เลขที่ ${event.student.classNo} · `}
          {event.detail}
        </span>
      </span>
      {event.href && event.action && (
        <LinkButton href={event.href} variant="outline" size="sm">
          {event.action} <ChevronRight className="size-4" />
        </LinkButton>
      )}
    </div>
  );
}
