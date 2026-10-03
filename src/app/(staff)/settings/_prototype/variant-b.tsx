"use client";

/**
 * PROTOTYPE — แบบ B "พื้นที่ทำงานแบบแท็บ + ตาราง + แผงข้าง"
 * แนวคิด: ตั้งค่าเป็นงานของแอดมินที่ต้องกวาดสายตาหาแถวที่ต้องแก้ ไม่ใช่ฟอร์มที่ไล่กรอกทีละช่อง
 * จึงใช้ตารางแน่น ๆ เป็นหลัก คลิกแถวแล้วแก้ในแผงด้านขวา บันทึกทีละรายการทันที
 */

import { useState } from "react";
import { CalendarClock, Gavel, History, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatThaiDate } from "@/lib/format";
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

export const VARIANT_B_NAME = "แท็บ + ตาราง + แผงข้าง";

type Tab = "windows" | "rules" | "audit";

export function VariantB({
  proto,
  ruleUsage,
  impact,
}: {
  proto: SettingsPrototype;
  ruleUsage: Record<string, number>;
  impact: ImpactContext;
}) {
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>("windows");
  const [selectedWindow, setSelectedWindow] = useState<string | null>(null);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const entries = useAuditEntries();

  const win = proto.windows.find((w) => w.id === selectedWindow) ?? null;
  const rule = proto.rules.find((r) => r.ruleId === selectedRule) ?? null;

  const tabs: { key: Tab; label: string; icon: typeof CalendarClock; count: number }[] = [
    { key: "windows", label: "ช่วงเวลาประเมิน", icon: CalendarClock, count: proto.windows.length },
    { key: "rules", label: "กฎความประพฤติ", icon: Gavel, count: proto.rules.length },
    { key: "audit", label: "ประวัติการใช้งาน", icon: History, count: entries.length },
  ];

  return (
    <div className="flex flex-1 overflow-hidden">
      <nav className="w-56 shrink-0 space-y-1 border-r border-border bg-surface p-4">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setSelectedWindow(null);
                setSelectedRule(null);
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13.5px] ${
                active
                  ? "bg-primary font-semibold text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="size-4" />
              <span className="flex-1">{t.label}</span>
              <span className={`text-[11.5px] ${active ? "opacity-80" : ""}`}>{t.count}</span>
            </button>
          );
        })}
      </nav>

      <div className="min-w-0 flex-1 overflow-y-auto p-6">
        {tab === "windows" && (
          <>
            <div className="mb-3 flex items-center gap-3">
              <div>
                <h2 className="text-[15.5px] font-bold">ช่วงเวลาการทำแบบประเมิน</h2>
                <p className="text-[12.5px] text-muted-foreground">
                  คลิกแถวเพื่อแก้ไข · การแก้ไขมีผลทันทีเมื่อกดบันทึกในแผงด้านขวา
                </p>
              </div>
              <span className="flex-1" />
              <Button size="lg" onClick={() => setSelectedWindow(proto.addWindow())}>
                <Plus className="size-4" /> เพิ่มช่วงเวลา
              </Button>
            </div>

            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
                  <th className="py-2 font-medium">แบบประเมิน</th>
                  <th className="py-2 font-medium">เปิด</th>
                  <th className="py-2 font-medium">ปิด</th>
                  <th className="py-2 font-medium">ผู้ที่ต้องทำ</th>
                  <th className="py-2 font-medium">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {proto.windows.map((w) => {
                  const meta = STATUS_META[windowStatus(w)];
                  return (
                    <tr
                      key={w.id}
                      onClick={() => setSelectedWindow(w.id)}
                      className={`cursor-pointer border-b border-border hover:bg-muted/50 ${
                        selectedWindow === w.id ? "bg-accent" : ""
                      }`}
                    >
                      <td className="py-2.5 font-medium">{w.label}</td>
                      <td className="py-2.5 text-muted-foreground">{formatThaiDate(w.openDate)}</td>
                      <td className="py-2.5 text-muted-foreground">
                        {formatThaiDate(w.closeDate)}
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {w.raters.map((r) => RATER_LABEL[r]).join(" · ") || "-"}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {tab === "rules" && (
          <>
            <div className="mb-3 flex items-center gap-3">
              <div>
                <h2 className="text-[15.5px] font-bold">กฎความประพฤติ</h2>
                <p className="text-[12.5px] text-muted-foreground">
                  กฎที่ปิดใช้งานจะไม่ปรากฏในตัวเลือกของครู แต่บันทึกเดิมยังคงอยู่
                </p>
              </div>
              <span className="flex-1" />
              <Button size="lg" onClick={() => setSelectedRule(proto.addRule())}>
                <Plus className="size-4" /> เพิ่มกฎ
              </Button>
            </div>

            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
                  <th className="py-2 font-medium">ชื่อกฎ</th>
                  <th className="py-2 font-medium">ระดับ</th>
                  <th className="py-2 text-center font-medium">คะแนน</th>
                  <th className="py-2 text-center font-medium">ถูกใช้</th>
                  <th className="py-2 font-medium">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {proto.rules.map((r) => {
                  const used = ruleUsage[r.ruleId] ?? 0;
                  return (
                    <tr
                      key={r.ruleId}
                      onClick={() => setSelectedRule(r.ruleId)}
                      className={`cursor-pointer border-b border-border hover:bg-muted/50 ${
                        selectedRule === r.ruleId ? "bg-accent" : ""
                      }`}
                    >
                      <td className="py-2.5 font-medium">
                        {r.name || <span className="text-muted-foreground">(ยังไม่ตั้งชื่อ)</span>}
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {SEVERITY_LABEL[r.severity]}
                      </td>
                      <td
                        className={`py-2.5 text-center font-bold ${
                          r.scoreDelta > 0 ? "text-risk-green" : "text-risk-red"
                        }`}
                      >
                        {r.scoreDelta > 0 ? `+${r.scoreDelta}` : r.scoreDelta}
                      </td>
                      <td className="py-2.5 text-center text-muted-foreground">{used}</td>
                      <td className="py-2.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
                            r.isActive
                              ? "bg-risk-green-bg text-risk-green"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {r.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {tab === "audit" && (
          <>
            <h2 className="text-[15.5px] font-bold">ประวัติการดำเนินงานในระบบ (Audit Log)</h2>
            <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
              บันทึกทุกการกระทำที่เปลี่ยนแปลงข้อมูล พร้อมผู้กระทำและเวลา
            </p>
            <AuditLogList entries={entries} />
          </>
        )}
      </div>

      {(win || rule) && (
        <aside className="w-96 shrink-0 overflow-y-auto border-l border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <h3 className="flex-1 text-[14.5px] font-bold">
              {win ? "แก้ไขช่วงเวลา" : "แก้ไขกฎความประพฤติ"}
            </h3>
            <button
              type="button"
              aria-label="ปิดแผง"
              onClick={() => {
                setSelectedWindow(null);
                setSelectedRule(null);
              }}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          </div>

          {win && (
            <div className="space-y-3.5">
              <Field label="ชื่อที่แสดง">
                <Input
                  value={win.label}
                  onChange={(e) => proto.updateWindow(win.id, { label: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="เปิดให้ทำ">
                  <Input
                    type="date"
                    value={win.openDate}
                    onChange={(e) => proto.updateWindow(win.id, { openDate: e.target.value })}
                  />
                </Field>
                <Field label="ปิดรับ">
                  <Input
                    type="date"
                    value={win.closeDate}
                    onChange={(e) => proto.updateWindow(win.id, { closeDate: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="แจ้งเตือนล่วงหน้าก่อนปิด (วัน)">
                <Input
                  type="number"
                  value={win.remindDaysBefore}
                  onChange={(e) =>
                    proto.updateWindow(win.id, { remindDaysBefore: Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="ผู้ที่ต้องทำแบบประเมินรอบนี้">
                <div className="space-y-1.5">
                  {(["teacher", "student", "parent"] as SdqRater[]).map((r) => {
                    const on = win.raters.includes(r);
                    return (
                      <label
                        key={r}
                        className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-[13px]"
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() =>
                            proto.updateWindow(win.id, {
                              raters: on ? win.raters.filter((x) => x !== r) : [...win.raters, r],
                            })
                          }
                        />
                        {RATER_LABEL[r]}
                      </label>
                    );
                  })}
                </div>
              </Field>
              <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
                <input
                  type="checkbox"
                  checked={win.enabled}
                  onChange={() =>
                    confirm.request({
                      id: `win-${win.id}-enabled`,
                      ...windowEnabledConfirm(win, impact),
                      apply: () => proto.updateWindow(win.id, { enabled: !win.enabled }),
                      undo: () => proto.updateWindow(win.id, { enabled: win.enabled }),
                    })
                  }
                />
                เปิดใช้งานรอบนี้
              </label>
              {confirm.inlineFor(`win-${win.id}-enabled`)}
              <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
                <input
                  type="checkbox"
                  checked={win.lockAfterClose}
                  onChange={() =>
                    confirm.request({
                      id: `win-${win.id}-lock`,
                      ...windowLockConfirm(win),
                      apply: () =>
                        proto.updateWindow(win.id, { lockAfterClose: !win.lockAfterClose }),
                      undo: () =>
                        proto.updateWindow(win.id, { lockAfterClose: win.lockAfterClose }),
                    })
                  }
                />
                ปิดรอบแล้วห้ามบันทึกย้อนหลัง
              </label>
              {confirm.inlineFor(`win-${win.id}-lock`)}

              <div className="flex gap-2 border-t border-border pt-4">
                <Button size="lg" className="flex-1" onClick={() => setSelectedWindow(null)}>
                  บันทึกรายการนี้
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={() => {
                    proto.removeWindow(win.id);
                    setSelectedWindow(null);
                  }}
                >
                  ลบ
                </Button>
              </div>
            </div>
          )}

          {rule && (
            <div className="space-y-3.5">
              <Field label="ชื่อกฎ">
                <Input
                  value={rule.name}
                  placeholder="เช่น มาสาย"
                  onChange={(e) => proto.updateRule(rule.ruleId, { name: e.target.value })}
                />
              </Field>
              <Field label="ระดับความรุนแรง">
                <select
                  value={rule.severity}
                  onChange={(e) =>
                    proto.updateRule(rule.ruleId, {
                      severity: e.target.value as BehaviorRule["severity"],
                    })
                  }
                  className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                >
                  {SEVERITY_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {SEVERITY_LABEL[s]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="คะแนนที่เปลี่ยนแปลง (ติดลบคือหัก)">
                <Input
                  type="number"
                  value={rule.scoreDelta}
                  onChange={(e) =>
                    proto.updateRule(rule.ruleId, { scoreDelta: Number(e.target.value) })
                  }
                />
              </Field>
              <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
                <input
                  type="checkbox"
                  checked={rule.isActive}
                  onChange={() =>
                    confirm.request({
                      id: `rule-${rule.ruleId}-active`,
                      ...ruleActiveConfirm(rule, ruleUsage[rule.ruleId] ?? 0),
                      apply: () => proto.updateRule(rule.ruleId, { isActive: !rule.isActive }),
                      undo: () => proto.updateRule(rule.ruleId, { isActive: rule.isActive }),
                    })
                  }
                />
                เปิดใช้งาน (ครูเลือกกฎนี้ได้)
              </label>
              {confirm.inlineFor(`rule-${rule.ruleId}-active`)}

              <div className="rounded-lg bg-surface px-3 py-2.5 text-[12px] leading-relaxed text-muted-foreground">
                กฎนี้ถูกใช้บันทึกไปแล้ว <b>{ruleUsage[rule.ruleId] ?? 0}</b> ครั้ง
                {(ruleUsage[rule.ruleId] ?? 0) > 0
                  ? " — ลบถาวรไม่ได้ ให้ปิดใช้งานแทน บันทึกเดิมจะยังคงคะแนนตามค่าที่บันทึกไว้ ณ ตอนนั้น"
                  : " — ยังไม่มีบันทึกอ้างอิง ลบถาวรได้"}
              </div>

              <div className="flex gap-2 border-t border-border pt-4">
                <Button size="lg" className="flex-1" onClick={() => setSelectedRule(null)}>
                  บันทึกรายการนี้
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  disabled={(ruleUsage[rule.ruleId] ?? 0) > 0}
                  onClick={() => {
                    proto.removeRule(rule.ruleId);
                    setSelectedRule(null);
                  }}
                >
                  ลบถาวร
                </Button>
              </div>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[12px] text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
