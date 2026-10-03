"use client";

/**
 * PROTOTYPE — แบบ C "ไทม์ไลน์ภาคเรียน + บอร์ดคะแนน"
 * แนวคิด: ปัญหาจริงของแอดมินไม่ใช่ "กรอกวันที่" แต่คือ "รอบไหนชนกัน ตอนนี้ครูต้องทำอะไรอยู่"
 * จึงวางช่วงเวลาทั้งภาคเรียนเป็นแถบบนแกนเวลาเดียวกัน เลื่อนวันด้วยปุ่ม
 * และจัดกฎความประพฤติเป็นบอร์ดแยกตามระดับความรุนแรง ปรับคะแนนด้วยปุ่ม +/-
 */

import { useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, TriangleAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatThaiDate } from "@/lib/format";
import { DEMO_TODAY } from "@/lib/mock-data";
import type { BehaviorRule, SdqRater } from "@/lib/types";
import { useConfirm } from "./confirm";
import {
  ruleActiveConfirm,
  windowEnabledConfirm,
  windowLockConfirm,
  type ImpactContext,
} from "./confirm-text";
import {
  RATER_LABEL,
  SEVERITY_LABEL,
  SEVERITY_ORDER,
  STATUS_META,
  TERM_END,
  TERM_START,
  overlappingPairs,
  shiftDate,
  termFraction,
  type SettingsPrototype,
  windowStatus,
} from "./state";

export const VARIANT_C_NAME = "ไทม์ไลน์ภาคเรียน + บอร์ดคะแนน";

const BAR_COLOR: Record<string, string> = {
  open: "bg-risk-green",
  upcoming: "bg-primary",
  closed: "bg-muted-foreground/40",
  disabled: "bg-risk-amber",
};

export function VariantC({
  proto,
  ruleUsage,
  impact,
}: {
  proto: SettingsPrototype;
  ruleUsage: Record<string, number>;
  impact: ImpactContext;
}) {
  const confirm = useConfirm();
  const [selected, setSelected] = useState<string | null>(null);
  const win = proto.windows.find((w) => w.id === selected) ?? null;
  const overlaps = overlappingPairs(proto.windows);
  const overlapIds = new Set(overlaps.flat());
  const todayPct = termFraction(DEMO_TODAY) * 100;

  return (
    <div className="flex-1 overflow-y-auto p-8 pb-24">
      <Card>
        <CardContent className="p-6">
          <div className="mb-1 flex items-center gap-3">
            <h2 className="text-[15.5px] font-bold">ปฏิทินการประเมินตลอดภาคเรียน</h2>
            <span className="flex-1" />
            <Button variant="outline" size="lg" onClick={() => setSelected(proto.addWindow())}>
              <Plus className="size-4" /> เพิ่มช่วงเวลา
            </Button>
          </div>
          <p className="mb-5 text-[12.5px] text-muted-foreground">
            {formatThaiDate(TERM_START)} – {formatThaiDate(TERM_END)} · เส้นสีแดงคือวันนี้ (
            {formatThaiDate(DEMO_TODAY)}) · คลิกแถบเพื่อปรับช่วงเวลา
          </p>

          <div className="relative">
            {/* เส้น "วันนี้" วางทับเฉพาะพื้นที่แกนเวลา (หลังคอลัมน์ชื่อ w-56 และก่อนคอลัมน์สถานะ) */}
            <div className="pointer-events-none absolute inset-y-0 right-[7.75rem] left-56 z-10">
              <div
                className="absolute inset-y-0 w-px bg-risk-red"
                style={{ left: `${todayPct}%` }}
              />
            </div>
            <div className="space-y-2">
              {proto.windows.map((w) => {
                const status = windowStatus(w);
                const left = termFraction(w.openDate) * 100;
                const right = termFraction(w.closeDate) * 100;
                const clash = overlapIds.has(w.id);
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelected(selected === w.id ? null : w.id)}
                    className={`flex w-full items-center rounded-lg py-1.5 text-left hover:bg-muted/50 ${
                      selected === w.id ? "bg-accent" : ""
                    }`}
                  >
                    <span className="flex w-56 shrink-0 items-center gap-1.5 pr-3 text-[13px]">
                      <span className="truncate">{w.label}</span>
                      {clash && <TriangleAlert className="size-3.5 shrink-0 text-risk-amber" />}
                    </span>
                    <span className="relative h-7 flex-1 rounded-md bg-surface">
                      <span
                        className={`absolute inset-y-1 rounded-sm ${BAR_COLOR[status]}`}
                        style={{
                          left: `${left}%`,
                          width: `${Math.max(1.5, right - left)}%`,
                        }}
                      />
                    </span>
                    <span
                      className={`ml-3 w-28 shrink-0 rounded-full px-2 py-1 text-center text-[11px] font-semibold ${STATUS_META[status].className}`}
                    >
                      {STATUS_META[status].label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex text-[11.5px] text-muted-foreground">
              <span className="w-56 shrink-0" />
              <span className="flex flex-1 justify-between">
                <span>พ.ย. 69</span>
                <span>ธ.ค. 69</span>
                <span>ม.ค. 70</span>
                <span>ก.พ. 70</span>
                <span>มี.ค. 70</span>
              </span>
              <span className="ml-3 w-28 shrink-0" />
            </div>
          </div>

          {overlaps.length > 0 && (
            <p className="mt-4 flex gap-2 rounded-lg bg-risk-amber-bg px-3 py-2.5 text-[12px] leading-relaxed text-risk-amber">
              <TriangleAlert className="size-4 shrink-0" />
              มีช่วงเวลาที่ทับซ้อนกัน {overlaps.length} คู่ — ครูจะมีแบบประเมินค้างพร้อมกันหลายชุด
              ตรวจสอบว่าตั้งใจให้ทับกันหรือไม่
            </p>
          )}

          {win && (
            <div className="mt-5 rounded-xl border border-primary bg-accent/40 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Input
                  value={win.label}
                  onChange={(e) => proto.updateWindow(win.id, { label: e.target.value })}
                  className="h-9 max-w-md font-semibold"
                />
                <span className="flex-1" />
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => {
                    proto.removeWindow(win.id);
                    setSelected(null);
                  }}
                >
                  <Trash2 className="size-4" /> ลบช่วงเวลานี้
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <DateNudger
                  label="วันเปิดให้ทำ"
                  value={win.openDate}
                  onChange={(v) => proto.updateWindow(win.id, { openDate: v })}
                />
                <DateNudger
                  label="วันปิดรับ"
                  value={win.closeDate}
                  onChange={(v) => proto.updateWindow(win.id, { closeDate: v })}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-[12.5px] text-muted-foreground">ผู้ที่ต้องทำ:</span>
                {(["teacher", "student", "parent"] as SdqRater[]).map((r) => {
                  const on = win.raters.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        proto.updateWindow(win.id, {
                          raters: on ? win.raters.filter((x) => x !== r) : [...win.raters, r],
                        })
                      }
                      className={`h-9 rounded-lg border px-3.5 text-[12.5px] ${
                        on
                          ? "border-primary bg-primary font-semibold text-primary-foreground"
                          : "border-border bg-card text-muted-foreground"
                      }`}
                    >
                      {RATER_LABEL[r]}
                    </button>
                  );
                })}
                <span className="flex-1" />
                <button
                  type="button"
                  onClick={() =>
                    confirm.request({
                      id: `win-${win.id}-enabled`,
                      ...windowEnabledConfirm(win, impact),
                      apply: () => proto.updateWindow(win.id, { enabled: !win.enabled }),
                      undo: () => proto.updateWindow(win.id, { enabled: win.enabled }),
                    })
                  }
                  className={`h-9 rounded-lg border px-3.5 text-[12.5px] font-semibold ${
                    win.enabled
                      ? "border-risk-green bg-risk-green-bg text-risk-green"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {win.enabled ? "เปิดใช้งานอยู่" : "ปิดใช้งานอยู่"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    confirm.request({
                      id: `win-${win.id}-lock`,
                      ...windowLockConfirm(win),
                      apply: () =>
                        proto.updateWindow(win.id, { lockAfterClose: !win.lockAfterClose }),
                      undo: () =>
                        proto.updateWindow(win.id, { lockAfterClose: win.lockAfterClose }),
                    })
                  }
                  className={`h-9 rounded-lg border px-3.5 text-[12.5px] font-semibold ${
                    win.lockAfterClose
                      ? "border-primary bg-accent text-primary"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {win.lockAfterClose ? "ล็อกหลังปิดรอบ" : "กรอกย้อนหลังได้"}
                </button>
              </div>
              {confirm.inlineFor(`win-${win.id}-enabled`)}
              {confirm.inlineFor(`win-${win.id}-lock`)}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardContent className="p-6">
          <h2 className="text-[15.5px] font-bold">กฎความประพฤติ แยกตามระดับ</h2>
          <p className="mt-0.5 mb-4 text-[12.5px] text-muted-foreground">
            ปรับคะแนนด้วยปุ่ม +/- · ย้ายระดับด้วยลูกศร · เพิ่มกฎใหม่ได้จากหัวคอลัมน์
          </p>

          <div className="grid gap-3 lg:grid-cols-4">
            {SEVERITY_ORDER.map((sev) => {
              const list = proto.rules.filter((r) => r.severity === sev);
              return (
                <div key={sev} className="rounded-xl bg-surface p-3">
                  <div className="mb-2.5 flex items-center gap-2">
                    <span className="flex-1 text-[13px] font-bold">{SEVERITY_LABEL[sev]}</span>
                    <span className="text-[11.5px] text-muted-foreground">{list.length}</span>
                    <button
                      type="button"
                      onClick={() => proto.addRule(sev)}
                      aria-label={`เพิ่มกฎระดับ${SEVERITY_LABEL[sev]}`}
                      className="flex size-7 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {list.map((rule) => {
                      const used = ruleUsage[rule.ruleId] ?? 0;
                      const idx = SEVERITY_ORDER.indexOf(sev);
                      return (
                        <div
                          key={rule.ruleId}
                          className={`rounded-lg border bg-card p-2.5 ${
                            rule.isActive ? "border-border" : "border-dashed border-border opacity-60"
                          }`}
                        >
                          <Input
                            value={rule.name}
                            placeholder="ชื่อกฎ"
                            onChange={(e) =>
                              proto.updateRule(rule.ruleId, { name: e.target.value })
                            }
                            className="h-8 border-transparent bg-transparent px-1 text-[13px] font-medium shadow-none"
                          />

                          <div className="mt-1.5 flex items-center gap-1">
                            <button
                              type="button"
                              aria-label="ลดคะแนน"
                              onClick={() =>
                                proto.updateRule(rule.ruleId, { scoreDelta: rule.scoreDelta - 1 })
                              }
                              className="flex size-7 items-center justify-center rounded-md border border-border hover:bg-muted"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span
                              className={`flex-1 text-center text-[15px] font-bold ${
                                rule.scoreDelta > 0 ? "text-risk-green" : "text-risk-red"
                              }`}
                            >
                              {rule.scoreDelta > 0 ? `+${rule.scoreDelta}` : rule.scoreDelta}
                            </span>
                            <button
                              type="button"
                              aria-label="เพิ่มคะแนน"
                              onClick={() =>
                                proto.updateRule(rule.ruleId, { scoreDelta: rule.scoreDelta + 1 })
                              }
                              className="flex size-7 items-center justify-center rounded-md border border-border hover:bg-muted"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>

                          <div className="mt-1.5 flex items-center gap-1 border-t border-border pt-1.5">
                            <button
                              type="button"
                              aria-label="ย้ายไประดับก่อนหน้า"
                              disabled={idx === 0}
                              onClick={() =>
                                proto.updateRule(rule.ruleId, {
                                  severity: SEVERITY_ORDER[idx - 1] as BehaviorRule["severity"],
                                })
                              }
                              className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-25"
                            >
                              <ChevronLeft className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label="ย้ายไประดับถัดไป"
                              disabled={idx === SEVERITY_ORDER.length - 1}
                              onClick={() =>
                                proto.updateRule(rule.ruleId, {
                                  severity: SEVERITY_ORDER[idx + 1] as BehaviorRule["severity"],
                                })
                              }
                              className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-25"
                            >
                              <ChevronRight className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                confirm.request({
                                  id: `rule-${rule.ruleId}-active`,
                                  ...ruleActiveConfirm(rule, used),
                                  apply: () =>
                                    proto.updateRule(rule.ruleId, { isActive: !rule.isActive }),
                                  undo: () =>
                                    proto.updateRule(rule.ruleId, { isActive: rule.isActive }),
                                })
                              }
                              className="rounded px-1.5 text-[11px] text-muted-foreground hover:bg-muted"
                            >
                              {rule.isActive ? "ปิดใช้" : "เปิดใช้"}
                            </button>
                            <span className="flex-1" />
                            <span className="text-[10.5px] text-muted-foreground">{used} ครั้ง</span>
                            <button
                              type="button"
                              aria-label={`ลบกฎ ${rule.name}`}
                              disabled={used > 0}
                              onClick={() => proto.removeRule(rule.ruleId)}
                              className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-risk-red-bg hover:text-risk-red disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                          {confirm.inlineFor(`rule-${rule.ruleId}-active`)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DateNudger({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div className="mt-1.5 flex items-center gap-2">
        <button
          type="button"
          aria-label={`${label} ถอยหลัง 7 วัน`}
          onClick={() => onChange(shiftDate(value, -7))}
          className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-muted"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="flex-1 text-center text-[14px] font-semibold">
          {formatThaiDate(value)}
        </span>
        <button
          type="button"
          aria-label={`${label} เดินหน้า 7 วัน`}
          onClick={() => onChange(shiftDate(value, 7))}
          className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-muted"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
