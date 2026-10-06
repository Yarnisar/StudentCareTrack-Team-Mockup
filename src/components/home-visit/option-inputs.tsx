"use client";

import { Check, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "cn";
import { AutoBadge, CarryBadge, FillSource } from "./field-shell";
import type { CarryState, CheckboxOption } from "@/lib/home-visit-form";

/* ------------------------------------------------------------------ */
/* หัวข้อของกลุ่มตัวเลือก                                              */
/* ------------------------------------------------------------------ */

function GroupHeader({
  label,
  source,
  carry,
  hint,
  selectedCount,
  actions,
}: {
  label: string;
  source?: FillSource;
  carry?: CarryState;
  hint?: string;
  selectedCount?: number;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13.5px] font-semibold">{label}</span>
        {source && <AutoBadge source={source} />}
        {carry && <CarryBadge state={carry} />}
        {selectedCount !== undefined && selectedCount > 0 && (
          <span className="rounded-full bg-accent px-2 py-0.5 text-[11.5px] font-semibold text-primary">
            เลือกแล้ว {selectedCount}
          </span>
        )}
        <span className="flex-1" />
        {actions}
      </div>
      {hint && <p className="mt-1 text-[12px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

const CHIP_BASE =
  "flex min-h-12 w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-[13.5px] leading-snug transition-colors";

/* ------------------------------------------------------------------ */
/* เลือกได้หลายข้อ                                                     */
/* ------------------------------------------------------------------ */

export function ChipGroup({
  label,
  options,
  selected,
  onToggle,
  onClear,
  source,
  carry,
  hint,
  columns = 2,
  /** ปุ่มทางลัดสำหรับหมวดความเสี่ยง: ยืนยันว่าไม่พบรายการใดในหมวดนี้ */
  noneLabel,
}: {
  label: string;
  options: CheckboxOption[];
  selected: string[];
  onToggle: (id: string) => void;
  onClear?: () => void;
  source?: FillSource;
  carry?: CarryState;
  hint?: string;
  columns?: number;
  noneLabel?: string;
}) {
  const none = selected.length === 0;

  return (
    <div>
      <GroupHeader
        label={label}
        source={source}
        carry={carry}
        hint={hint}
        selectedCount={selected.length}
        actions={
          <div className="flex items-center gap-2">
            {noneLabel && (
              <button
                type="button"
                onClick={onClear}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors",
                  none
                    ? "border-risk-green bg-risk-green-bg text-risk-green"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {none && <Check className="size-3.5" />}
                {noneLabel}
              </button>
            )}
            {!noneLabel && selected.length > 0 && onClear && (
              <button
                type="button"
                onClick={onClear}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-muted"
              >
                <X className="size-3.5" /> ล้าง
              </button>
            )}
          </div>
        }
      />

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {options.map((opt) => {
          const active = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(opt.id)}
              className={cn(
                CHIP_BASE,
                active
                  ? "border-primary bg-accent font-semibold text-primary"
                  : "border-border bg-card hover:border-primary/40 hover:bg-muted/60"
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-[6px] border",
                  active ? "border-primary bg-primary" : "border-input bg-card"
                )}
              >
                {active && <Check className="size-3.5 text-primary-foreground" strokeWidth={3} />}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* เลือกได้ข้อเดียว                                                    */
/* ------------------------------------------------------------------ */

export function ChipSelect({
  label,
  options,
  value,
  onChange,
  source,
  carry,
  hint,
  columns = 2,
}: {
  label: string;
  options: CheckboxOption[];
  value: string;
  onChange: (v: string) => void;
  source?: FillSource;
  carry?: CarryState;
  hint?: string;
  columns?: number;
}) {
  return (
    <div>
      <GroupHeader label={label} source={source} carry={carry} hint={hint} />
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? "" : opt.id)}
              className={cn(
                CHIP_BASE,
                active
                  ? "border-primary bg-accent font-semibold text-primary"
                  : "border-border bg-card hover:border-primary/40 hover:bg-muted/60"
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border",
                  active ? "border-primary" : "border-input"
                )}
              >
                {active && <span className="size-2.5 rounded-full bg-primary" />}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* แถวตัวเลือกแบบแบ่งช่อง (ใช้กับตารางความสัมพันธ์)                    */
/* ------------------------------------------------------------------ */

export function SegmentedRows({
  label,
  rows,
  choices,
  values,
  onChange,
  source,
  hint,
}: {
  label: string;
  rows: readonly string[];
  choices: readonly string[];
  values: Record<string, string>;
  onChange: (row: string, choice: string) => void;
  source?: FillSource;
  hint?: string;
}) {
  return (
    <div>
      <GroupHeader label={label} source={source} hint={hint} />
      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-2.5 sm:flex-row sm:items-center"
          >
            <span className="w-40 shrink-0 px-1 text-[13.5px] font-medium">{row}</span>
            <div className="flex flex-1 gap-1.5">
              {choices.map((choice) => {
                const active = values[row] === choice;
                return (
                  <button
                    key={choice}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChange(row, active ? "" : choice)}
                    className={cn(
                      "min-h-11 flex-1 rounded-lg border px-2 text-[13px] transition-colors",
                      active
                        ? "border-primary bg-primary font-semibold text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted"
                    )}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* แถวแบบ มี / ไม่มี (ใช้กับยานพาหนะ ตามแบบฟอร์มจริง)                   */
/* ------------------------------------------------------------------ */

export function YesNoRows({
  label,
  rows,
  values,
  onChange,
  source,
  carry,
}: {
  label: string;
  rows: CheckboxOption[];
  values: Record<string, boolean | undefined>;
  onChange: (id: string, value: boolean) => void;
  source?: FillSource;
  carry?: CarryState;
}) {
  return (
    <div>
      <GroupHeader label={label} source={source} carry={carry} />
      <div className="space-y-2">
        {rows.map((row) => {
          const value = values[row.id];
          return (
            <div
              key={row.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-2.5 sm:flex-row sm:items-center"
            >
              <span className="flex-1 px-1 text-[13.5px]">{row.label}</span>
              <div className="flex gap-1.5">
                {[
                  { v: true, label: "มี" },
                  { v: false, label: "ไม่มี" },
                ].map((opt) => {
                  const active = value === opt.v;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onChange(row.id, opt.v)}
                      className={cn(
                        "min-h-11 w-24 rounded-lg border text-[13px] transition-colors",
                        active
                          ? opt.v
                            ? "border-primary bg-primary font-semibold text-primary-foreground"
                            : "border-border bg-muted font-semibold text-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
