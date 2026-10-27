"use client";

/**
 * PROTOTYPE — แบบ A "ฟอร์มเรียงเดี่ยว + แถบบันทึก"
 * แนวคิด: ตั้งค่าทั้งหน้าเป็นแบบฟอร์มเดียวเรียงลงมา พิมพ์แก้ได้ทันทีทุกช่อง
 * แล้วกดบันทึกครั้งเดียวจากแถบล่าง (draft → commit) เหมือนหน้า "ตั้งค่าโรงเรียน" ทั่วไป
 */

import { Plus, RotateCcw, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatThaiDate } from "@/lib/format";
import { SCHOOL_NAME, CURRENT_TERM } from "@/lib/mock-data";
import type { BehaviorRule, SdqRater } from "@/lib/types";
import { AuditLogList, useAuditEntries } from "./audit-log";
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
  type SettingsPrototype,
  windowStatus,
} from "./state";

export const VARIANT_A_NAME = "ฟอร์มเรียงเดี่ยว + แถบบันทึก";

export function VariantA({
  proto,
  ruleUsage,
  impact,
}: {
  proto: SettingsPrototype;
  ruleUsage: Record<string, number>;
  impact: ImpactContext;
}) {
  const entries = useAuditEntries();
  const confirm = useConfirm();

  return (
    <div className="relative flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-5 p-8 pb-28">
        <Card>
          <CardContent className="space-y-1 p-6">
            <h2 className="text-[15.5px] font-bold">ข้อมูลสถานศึกษา</h2>
            <p className="text-[13px] text-muted-foreground">
              {SCHOOL_NAME} · {CURRENT_TERM.label}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-[15.5px] font-bold">ช่วงเวลาดำเนินงาน</h2>
            <p className="mt-0.5 mb-4 text-[12.5px] text-muted-foreground">
              นอกช่วงเวลาที่กำหนด ระบบจะไม่เปิดให้ครู นักเรียน หรือผู้ปกครองทำแบบประเมินรอบนั้น
            </p>

            <div className="space-y-3">
              {proto.windows.map((w) => {
                const status = windowStatus(w);
                const meta = STATUS_META[status];
                return (
                  <div key={w.id} className="rounded-xl border border-border p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Input
                        value={w.label}
                        onChange={(e) => proto.updateWindow(w.id, { label: e.target.value })}
                        className="h-9 flex-1 font-semibold"
                      />
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => proto.removeWindow(w.id)}
                        aria-label={`ลบช่วงเวลา ${w.label}`}
                        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-risk-red-bg hover:text-risk-red"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <DateField
                        label="เปิดให้ทำ"
                        value={w.openDate}
                        onChange={(v) => proto.updateWindow(w.id, { openDate: v })}
                      />
                      <DateField
                        label="ปิดรับ"
                        value={w.closeDate}
                        onChange={(v) => proto.updateWindow(w.id, { closeDate: v })}
                      />
                      <div>
                        <Label className="text-[12px] text-muted-foreground">
                          เตือนล่วงหน้า (วัน)
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          max={30}
                          value={w.remindDaysBefore}
                          onChange={(e) =>
                            proto.updateWindow(w.id, {
                              remindDaysBefore: Number(e.target.value),
                            })
                          }
                          className="mt-1.5 h-10"
                        />
                      </div>
                      <div>
                        <Label className="text-[12px] text-muted-foreground">ผู้ที่ต้องทำ</Label>
                        <div className="mt-1.5 flex gap-1.5">
                          {(["teacher", "student", "parent"] as SdqRater[]).map((r) => {
                            const on = w.raters.includes(r);
                            return (
                              <button
                                key={r}
                                type="button"
                                aria-pressed={on}
                                onClick={() =>
                                  proto.updateWindow(w.id, {
                                    raters: on
                                      ? w.raters.filter((x) => x !== r)
                                      : [...w.raters, r],
                                  })
                                }
                                className={`h-10 flex-1 rounded-lg border text-[12.5px] ${
                                  on
                                    ? "border-primary bg-accent font-semibold text-primary"
                                    : "border-border text-muted-foreground"
                                }`}
                              >
                                {RATER_LABEL[r]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-border pt-3">
                      <Toggle
                        label="เปิดใช้งานรอบนี้"
                        checked={w.enabled}
                        onChange={() =>
                          confirm.request({
                            id: `win-${w.id}-enabled`,
                            ...windowEnabledConfirm(w, impact),
                            apply: () => proto.updateWindow(w.id, { enabled: !w.enabled }),
                            undo: () => proto.updateWindow(w.id, { enabled: w.enabled }),
                          })
                        }
                      />
                      <Toggle
                        label="ปิดรอบแล้วห้ามบันทึกย้อนหลัง"
                        checked={w.lockAfterClose}
                        onChange={() =>
                          confirm.request({
                            id: `win-${w.id}-lock`,
                            ...windowLockConfirm(w),
                            apply: () =>
                              proto.updateWindow(w.id, { lockAfterClose: !w.lockAfterClose }),
                            undo: () =>
                              proto.updateWindow(w.id, { lockAfterClose: w.lockAfterClose }),
                          })
                        }
                      />
                      <span className="ml-auto text-[12px] text-muted-foreground">
                        {formatThaiDate(w.openDate)} – {formatThaiDate(w.closeDate)}
                      </span>
                    </div>
                    {confirm.inlineFor(`win-${w.id}-enabled`)}
                    {confirm.inlineFor(`win-${w.id}-lock`)}
                  </div>
                );
              })}
            </div>

            <Button variant="outline" className="mt-3 w-full" onClick={proto.addWindow}>
              <Plus className="size-4" /> เพิ่มช่วงเวลาประเมิน
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-[15.5px] font-bold">กฎความประพฤติ</h2>
            <p className="mt-0.5 mb-4 text-[12.5px] text-muted-foreground">
              รายการนี้คือตัวเลือกที่ครูเห็นตอนบันทึกพฤติกรรม แก้ชื่อหรือคะแนนได้โดยตรงในช่อง
            </p>

            <div className="space-y-2">
              {proto.rules.map((rule) => {
                const used = ruleUsage[rule.ruleId] ?? 0;
                return (
                  <div key={rule.ruleId} className="rounded-xl border border-border p-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={rule.name}
                      placeholder="ชื่อกฎความประพฤติ"
                      onChange={(e) => proto.updateRule(rule.ruleId, { name: e.target.value })}
                      className="h-10 min-w-56 flex-1"
                    />
                    <select
                      value={rule.severity}
                      onChange={(e) =>
                        proto.updateRule(rule.ruleId, {
                          severity: e.target.value as BehaviorRule["severity"],
                        })
                      }
                      className="h-10 w-32 rounded-lg border border-border bg-card px-2.5 text-[13px]"
                    >
                      {SEVERITY_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {SEVERITY_LABEL[s]}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      value={rule.scoreDelta}
                      onChange={(e) =>
                        proto.updateRule(rule.ruleId, { scoreDelta: Number(e.target.value) })
                      }
                      className={`h-10 w-20 text-center font-bold ${
                        rule.scoreDelta > 0 ? "text-risk-green" : "text-risk-red"
                      }`}
                    />
                    <Toggle
                      label="ใช้งาน"
                      checked={rule.isActive}
                      onChange={() =>
                        confirm.request({
                          id: `rule-${rule.ruleId}-active`,
                          ...ruleActiveConfirm(rule, used),
                          apply: () =>
                            proto.updateRule(rule.ruleId, { isActive: !rule.isActive }),
                          undo: () =>
                            proto.updateRule(rule.ruleId, { isActive: rule.isActive }),
                        })
                      }
                    />
                    <span className="w-24 text-right text-[11.5px] text-muted-foreground">
                      ใช้แล้ว {used} ครั้ง
                    </span>
                    <button
                      type="button"
                      disabled={used > 0}
                      onClick={() => proto.removeRule(rule.ruleId)}
                      aria-label={`ลบกฎ ${rule.name}`}
                      title={
                        used > 0
                          ? "ลบไม่ได้เพราะมีบันทึกความประพฤติอ้างอิงอยู่ ให้ปิดการใช้งานแทน"
                          : "ลบกฎนี้"
                      }
                      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-risk-red-bg hover:text-risk-red disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                    >
                      <Trash2 className="size-4" />
                    </button>
                    </div>
                    {confirm.inlineFor(`rule-${rule.ruleId}-active`)}
                  </div>
                );
              })}
            </div>

            <Button variant="outline" className="mt-3 w-full" onClick={() => proto.addRule()}>
              <Plus className="size-4" /> เพิ่มกฎความประพฤติ
            </Button>

            <p className="mt-3 flex gap-2 rounded-lg bg-risk-amber-bg px-3 py-2.5 text-[12px] leading-relaxed text-risk-amber">
              <TriangleAlert className="size-4 shrink-0" />
              กฎที่เคยถูกใช้บันทึกไปแล้วจะลบไม่ได้ เพราะบันทึกเก่าจะหาที่มาของคะแนนไม่เจอ —
              ให้ปิดการใช้งานแทน กฎนั้นจะหายจากตัวเลือกของครูแต่บันทึกเดิมยังอ่านได้
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-[15.5px] font-bold">ประวัติการดำเนินงานในระบบ (Audit Log)</h2>
            <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
              บันทึกทุกการกระทำที่เปลี่ยนแปลงข้อมูล พร้อมผู้กระทำและเวลา
            </p>
            <AuditLogList entries={entries} />
          </CardContent>
        </Card>
      </div>

      <div className="sticky bottom-0 border-t border-border bg-card/95 px-8 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <span className="text-[13px] font-medium">
            {proto.dirty ? "มีการแก้ไขที่ยังไม่ได้บันทึก" : "ยังไม่มีการแก้ไข"}
          </span>
          <span className="text-[12.5px] text-muted-foreground">
            {proto.windows.length} ช่วงเวลา · {proto.rules.length} กฎความประพฤติ
          </span>
          <span className="flex-1" />
          <Button variant="ghost" onClick={proto.reset} disabled={!proto.dirty}>
            <RotateCcw className="size-4" /> คืนค่าเดิม
          </Button>
          <Button disabled={!proto.dirty}>บันทึกการตั้งค่า</Button>
        </div>
      </div>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-[12px] text-muted-foreground">{label}</Label>
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-10"
      />
      <p className="mt-1 text-[11.5px] text-muted-foreground">{formatThaiDate(value)}</p>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-[12.5px]"
    >
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-input"
        }`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${
            checked ? "left-4.5" : "left-0.5"
          }`}
        />
      </span>
      {label}
    </button>
  );
}
