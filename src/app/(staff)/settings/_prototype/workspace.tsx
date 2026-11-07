"use client";

/**
 * หน้าตั้งค่าแบบเดียว (รวมแบบร่าง A, B, C)
 * ปัญหาเดิม: ทุกเรื่องเรียงต่อกันในหน้าเดียว และกฎทุกข้อเปิดฟอร์มแก้ไขไว้ตลอด ต้องเลื่อนยาวกว่าจะถึงเรื่องที่จะแก้
 * - แบ่งเป็นแท็บตามเรื่อง เก็บแท็บใน URL (?tab=) ลิงก์ตรงมาที่แท็บได้
 * - รายการแสดงเป็นแถวสรุปบรรทัดเดียว กดแถวแล้วแก้ในแผงด้านข้าง (มือถือเป็นแผ่นเต็มจอ) ฟอร์มจึงมีที่เดียว
 * - กฎจัดกลุ่มตามชนิด ตัดคะแนน / เพิ่มคะแนน / ส่งต่อ (UC7 Scenario B ข้อ 7)
 * PROTOTYPE: ค่าที่แก้เก็บใน store มีผลทันทีกับทุกหน้า ยังไม่มีฉบับร่างและการเผยแพร่พร้อมวันเริ่มใช้ (UC7 Scenario E)
 */

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, Gavel, Gauge, History, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RULE_KIND_LABEL,
  RULE_LEVEL_LABEL,
  recordersText,
  ruleKind,
  ruleScoreText,
  type RuleKind,
} from "@/lib/behavior-rules";
import { formatThaiDate } from "@/lib/format";
import type { BehaviorRule, SdqRater } from "@/lib/types";
import { AuditLogList, useAuditEntries } from "./audit-log";
import { BehaviorScoreCard } from "./behavior-score-card";
import { useConfirm } from "./confirm";
import { windowEnabledConfirm, windowLockConfirm, type ImpactContext } from "./confirm-text";
import { RuleRecorderPicker } from "./rule-recorder-picker";
import { RATER_LABEL, STATUS_META, type SettingsPrototype, windowStatus } from "./state";

type Tab = "windows" | "rules" | "score" | "audit";
const TABS: { key: Tab; label: string; icon: typeof CalendarClock }[] = [
  { key: "windows", label: "ช่วงเวลาประเมิน", icon: CalendarClock },
  { key: "rules", label: "กฎความประพฤติ", icon: Gavel },
  { key: "score", label: "คะแนนและเกณฑ์เฝ้าระวัง", icon: Gauge },
  { key: "audit", label: "ประวัติการใช้งาน", icon: History },
];
const KIND_ORDER: RuleKind[] = ["deduct", "add", "refer"];
/** ระดับของกฎตามชนิด: ชนิดตัดคะแนนมี 3 ระดับการดำเนินการ (ภาคผนวก ข) */
const LEVELS_OF: Record<RuleKind, BehaviorRule["severity"][]> = {
  deduct: ["minor", "moderate", "severe"],
  add: ["positive"],
  refer: ["refer"],
};
const SCORE_STEP = 5;

export function SettingsWorkspace({
  proto,
  ruleUsage,
  impact,
}: {
  proto: SettingsPrototype;
  ruleUsage: Record<string, number>;
  impact: ImpactContext;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tabParam = params.get("tab");
  const tab: Tab = TABS.some((t) => t.key === tabParam) ? (tabParam as Tab) : "windows";

  const [selectedWindow, setSelectedWindow] = useState<string | null>(null);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const entries = useAuditEntries();
  const confirm = useConfirm();

  const win = proto.windows.find((w) => w.id === selectedWindow) ?? null;
  const rule = proto.rules.find((r) => r.ruleId === selectedRule) ?? null;
  const closePanel = () => {
    setSelectedWindow(null);
    setSelectedRule(null);
  };
  /** ข้อมูลไม่ถูกต้องของแผงที่เปิดอยู่ (UC7 Alt-B, UC9 Alt-A) */
  const panelError =
    win && win.openDate > win.closeDate
      ? "วันเปิดให้ทำต้องไม่หลังวันปิดรับ"
      : win && win.label.trim() === ""
        ? "ต้องระบุชื่อที่แสดง"
        : rule && !rule.cancelled && rule.name.trim() === ""
          ? "ต้องระบุชื่อพฤติกรรม"
          : "";
  /** ปิดแผง: กฎใหม่ที่ยังไม่ตั้งชื่อและไม่เคยใช้ ถือว่ายกเลิกการเพิ่ม ส่วนข้อมูลผิดอื่นต้องแก้ก่อน */
  const requestClose = () => {
    if (rule && !rule.cancelled && rule.name.trim() === "" && !(ruleUsage[rule.ruleId] ?? 0)) {
      proto.removeRule(rule.ruleId);
      closePanel();
      return;
    }
    if (panelError) return;
    closePanel();
  };
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const goTab = (key: Tab) => {
    closePanel();
    const sp = new URLSearchParams(params.toString());
    sp.set("tab", key);
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  };

  const requestCloseRef = useRef(requestClose);
  useEffect(() => {
    requestCloseRef.current = requestClose;
  });
  useEffect(() => {
    if (!win && !rule) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [win, rule]);

  const counts: Record<Tab, string> = {
    windows: String(proto.windows.length),
    rules: String(proto.rules.length),
    score: "",
    audit: String(entries.length),
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div role="tablist" aria-label="หมวดการตั้งค่า" className="flex gap-1 overflow-x-auto border-b border-border bg-card px-4 sm:px-8">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => goTab(t.key)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-[13.5px] ${
                active ? "border-primary font-semibold text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {t.label}
              {counts[t.key] && <span className="text-[11.5px] text-muted-foreground">{counts[t.key]}</span>}
            </button>
          );
        })}
      </div>

      <div className="mx-auto max-w-5xl p-4 pb-28 sm:p-8 sm:pb-28">
        {tab === "windows" && (
          <section>
            <SectionHead
              title="ช่วงเวลาดำเนินงาน"
              hint="นอกช่วงเวลาที่กำหนด ระบบไม่เปิดให้ทำแบบประเมินรอบนั้น · กดแถวเพื่อแก้ไข"
              action={
                <Button onClick={() => setSelectedWindow(proto.addWindow())}>
                  <Plus className="size-4" /> เพิ่มช่วงเวลา
                </Button>
              }
            />
            <div className="divide-y divide-border rounded-xl border border-border bg-card">
              {proto.windows.map((w) => {
                const meta = STATUS_META[windowStatus(w)];
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelectedWindow(w.id)}
                    className={`flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left hover:bg-muted/50 ${
                      selectedWindow === w.id ? "bg-accent" : ""
                    }`}
                  >
                    <span className="min-w-0 flex-1 text-[13.5px] font-medium">{w.label}</span>
                    <span className="text-[12.5px] text-muted-foreground">
                      {formatThaiDate(w.openDate)} – {formatThaiDate(w.closeDate)}
                    </span>
                    <span className="w-36 text-[12.5px] text-muted-foreground">
                      {w.raters.map((r) => RATER_LABEL[r]).join(" · ") || "-"}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${meta.className}`}>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {tab === "rules" && (
          <section>
            <SectionHead
              title="กฎความประพฤติ"
              hint="รายการที่ครูเลือกตอนบันทึกพฤติกรรม กฎที่ยกเลิกแล้วไม่อยู่ในตัวเลือกของครู และรายการเดิมไม่นับคะแนน · กดแถวเพื่อแก้ไข"
              action={
                <Button onClick={() => setSelectedRule(proto.addRule())}>
                  <Plus className="size-4" /> เพิ่มกฎ
                </Button>
              }
            />
            <div className="space-y-4">
              {[...KIND_ORDER, "cancelled" as const].map((kind) => {
                const list =
                  kind === "cancelled"
                    ? proto.rules.filter((r) => r.cancelled)
                    : proto.rules.filter((r) => !r.cancelled && ruleKind(r) === kind);
                if (kind === "cancelled" && list.length === 0) return null;
                return (
                  <div key={kind}>
                    <div className="mb-1.5 flex items-center gap-2">
                      <h3 className="text-[13px] font-bold">{kind === "cancelled" ? "ยกเลิกแล้ว" : RULE_KIND_LABEL[kind]}</h3>
                      <span className="text-[12px] text-muted-foreground">{list.length} ข้อ</span>
                      <span className="flex-1" />
                      {kind !== "cancelled" && (
                      <button
                        type="button"
                        onClick={() => setSelectedRule(proto.addRule(LEVELS_OF[kind as RuleKind][0]))}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-muted-foreground hover:bg-muted"
                      >
                        <Plus className="size-3.5" /> เพิ่มในกลุ่มนี้
                      </button>
                      )}
                    </div>
                    <div className="divide-y divide-border rounded-xl border border-border bg-card">
                      {list.length === 0 && <p className="px-4 py-3 text-[12.5px] text-muted-foreground">ยังไม่มีกฎในกลุ่มนี้</p>}
                      {list.map((r) => (
                        <button
                          key={r.ruleId}
                          type="button"
                          onClick={() => {
                            setSelectedRule(r.ruleId);
                            setCancelling(false);
                            setCancelReason("");
                          }}
                          className={`flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left hover:bg-muted/50 ${
                            selectedRule === r.ruleId ? "bg-accent" : ""
                          } ${r.isActive ? "" : "text-muted-foreground"}`}
                        >
                          <span className="min-w-0 flex-1 text-[13.5px] font-medium">
                            {r.name || <span className="text-muted-foreground">(ยังไม่ตั้งชื่อ)</span>}
                          </span>
                          {ruleKind(r) === "deduct" && (
                            <span className="text-[12px] text-muted-foreground">{RULE_LEVEL_LABEL[r.severity]}</span>
                          )}
                          <span className="w-14 text-right text-[13.5px] font-bold tabular-nums">{ruleScoreText(r)}</span>
                          <span className="w-40 text-[12px] text-muted-foreground">{recordersText(r)}</span>
                          <span className="w-16 text-right text-[12px] text-muted-foreground">ใช้ {ruleUsage[r.ruleId] ?? 0} ครั้ง</span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
                              r.isActive ? "bg-accent text-primary" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {r.cancelled ? "ยกเลิกแล้ว" : r.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {tab === "score" && <BehaviorScoreCard />}

        {tab === "audit" && (
          <section>
            <SectionHead title="ประวัติการดำเนินงานในระบบ (Audit Log)" hint="ทุกการกระทำที่เปลี่ยนข้อมูล พร้อมผู้กระทำและเวลา" />
            <div className="overflow-x-auto rounded-xl border border-border bg-card px-4">
              <AuditLogList entries={entries} />
            </div>
          </section>
        )}
      </div>

      {(win || rule) && (
        <>
          <div aria-hidden className="fixed inset-0 z-40 bg-foreground/10" onClick={requestClose} />
          <aside
            role="dialog"
            aria-label={win ? "แก้ไขช่วงเวลา" : "แก้ไขกฎความประพฤติ"}
            className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-card shadow-lg sm:w-[420px]"
          >
            <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
              <h3 className="flex-1 text-[15px] font-bold">{win ? "แก้ไขช่วงเวลา" : "แก้ไขกฎความประพฤติ"}</h3>
              <button
                type="button"
                aria-label="ปิดแผง"
                onClick={requestClose}
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {win && (
                <>
                  <Field label="ชื่อที่แสดง">
                    <Input value={win.label} onChange={(e) => proto.updateWindow(win.id, { label: e.target.value })} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="เปิดให้ทำ">
                      <Input type="date" value={win.openDate} onChange={(e) => proto.updateWindow(win.id, { openDate: e.target.value })} />
                    </Field>
                    <Field label="ปิดรับ">
                      <Input type="date" value={win.closeDate} onChange={(e) => proto.updateWindow(win.id, { closeDate: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="แจ้งเตือนล่วงหน้าก่อนปิด">
                    <Stepper
                      value={win.remindDaysBefore}
                      unit="วัน"
                      step={1}
                      min={0}
                      onChange={(v) => proto.updateWindow(win.id, { remindDaysBefore: v })}
                    />
                  </Field>
                  {win.kind === "home_visit" && (
                    <Field label="ระยะเวลารอนักเรียนหรือผู้ปกครองยืนยันผลการเยี่ยมบ้าน">
                      <Stepper
                        value={win.confirmWaitDays ?? 3}
                        unit="วัน"
                        step={1}
                        min={1}
                        onChange={(v) => proto.updateWindow(win.id, { confirmWaitDays: v })}
                      />
                    </Field>
                  )}
                  <Field label="ผู้ที่ต้องทำแบบประเมินรอบนี้">
                    <div className="flex flex-wrap gap-1.5">
                      {(["teacher", "student", "parent"] as SdqRater[]).map((r) => {
                        const on = win.raters.includes(r);
                        return (
                          <ChoiceChip
                            key={r}
                            on={on}
                            onClick={() =>
                              proto.updateWindow(win.id, { raters: on ? win.raters.filter((x) => x !== r) : [...win.raters, r] })
                            }
                          >
                            {RATER_LABEL[r]}
                          </ChoiceChip>
                        );
                      })}
                    </div>
                  </Field>
                  <CheckRow
                    checked={win.enabled}
                    label="เปิดใช้งานรอบนี้"
                    onChange={() =>
                      confirm.request({
                        id: `win-${win.id}-enabled`,
                        ...windowEnabledConfirm(win, impact),
                        apply: () => proto.updateWindow(win.id, { enabled: !win.enabled }),
                        undo: () => proto.updateWindow(win.id, { enabled: win.enabled }),
                      })
                    }
                  />
                  {confirm.inlineFor(`win-${win.id}-enabled`)}
                  <CheckRow
                    checked={win.lockAfterClose}
                    label="ปิดรอบแล้วห้ามบันทึกย้อนหลัง"
                    onChange={() =>
                      confirm.request({
                        id: `win-${win.id}-lock`,
                        ...windowLockConfirm(win),
                        apply: () => proto.updateWindow(win.id, { lockAfterClose: !win.lockAfterClose }),
                        undo: () => proto.updateWindow(win.id, { lockAfterClose: win.lockAfterClose }),
                      })
                    }
                  />
                  {confirm.inlineFor(`win-${win.id}-lock`)}
                </>
              )}

              {rule?.cancelled && (
                <p className="rounded-lg bg-surface px-3 py-2.5 text-[13px] leading-relaxed">
                  ยกเลิกกฎนี้แล้วเมื่อ {formatThaiDate(rule.cancelled.at)} · เหตุผล: {rule.cancelled.reason}
                  <br />
                  <span className="text-[12px] text-muted-foreground">
                    รายการเดิม {ruleUsage[rule.ruleId] ?? 0} รายการไม่นับคะแนน และแสดงในประวัติว่า “กฎถูกยกเลิก”
                  </span>
                </p>
              )}
              {rule && (
                <fieldset disabled={!!rule.cancelled} className="space-y-4 disabled:opacity-60">
                  <Field label="ชื่อพฤติกรรม">
                    <Input
                      value={rule.name}
                      placeholder="เช่น มาสาย"
                      onChange={(e) => proto.updateRule(rule.ruleId, { name: e.target.value })}
                    />
                  </Field>
                  <Field label="ชนิดของกฎ">
                    <div className="flex flex-wrap gap-1.5">
                      {KIND_ORDER.map((k) => (
                        <ChoiceChip
                          key={k}
                          on={ruleKind(rule) === k}
                          onClick={() => proto.updateRule(rule.ruleId, { severity: LEVELS_OF[k][0] })}
                        >
                          {RULE_KIND_LABEL[k]}
                        </ChoiceChip>
                      ))}
                    </div>
                  </Field>
                  {ruleKind(rule) === "deduct" && (
                    <Field label="ระดับการดำเนินการ">
                      <div className="flex flex-wrap gap-1.5">
                        {LEVELS_OF.deduct.map((lv) => (
                          <ChoiceChip key={lv} on={rule.severity === lv} onClick={() => proto.updateRule(rule.ruleId, { severity: lv })}>
                            {RULE_LEVEL_LABEL[lv]}
                          </ChoiceChip>
                        ))}
                      </div>
                    </Field>
                  )}
                  {ruleKind(rule) === "refer" ? (
                    <p className="rounded-lg bg-surface px-3 py-2.5 text-[12px] leading-relaxed text-muted-foreground">
                      กฎส่งต่อไม่มีคะแนน บันทึกแล้วระบบแจ้งครูที่ปรึกษาให้พิจารณาเปิดกรณีช่วยเหลือ
                    </p>
                  ) : (
                    <Field label={ruleKind(rule) === "add" ? "คะแนนที่เพิ่ม" : "คะแนนที่ตัด"}>
                      <Stepper
                        value={Math.abs(rule.scoreDelta)}
                        step={SCORE_STEP}
                        min={1}
                        unit="คะแนน"
                        onChange={(v) =>
                          proto.updateRule(rule.ruleId, { scoreDelta: ruleKind(rule) === "add" ? v : -v })
                        }
                      />
                    </Field>
                  )}
                  <Field label="ผู้ที่บันทึกกฎนี้ได้">
                    <RuleRecorderPicker
                      rule={rule}
                      compact
                      onChange={(recordableBy) => proto.updateRule(rule.ruleId, { recordableBy })}
                    />
                  </Field>
                </fieldset>
              )}
              {rule && !rule.cancelled && (
                <div className="rounded-lg border border-border p-3">
                  {!cancelling ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex-1 text-[12.5px] text-muted-foreground">
                        ถูกใช้บันทึกแล้ว <b className="text-foreground">{ruleUsage[rule.ruleId] ?? 0}</b> ครั้ง
                      </span>
                      <Button size="sm" variant="outline" onClick={() => setCancelling(true)}>
                        ยกเลิกกฎนี้
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[13px] font-semibold">ยกเลิกกฎ “{rule.name}”</p>
                      <p className="text-[12px] leading-relaxed text-muted-foreground">
                        ครูจะเลือกกฎนี้ไม่ได้อีก รายการเดิม {ruleUsage[rule.ruleId] ?? 0} รายการไม่นับคะแนน
                        คะแนนนักเรียนคำนวณใหม่ และเก็บรายการไว้ในประวัติพร้อมระบุว่า “กฎถูกยกเลิก” ย้อนกลับไม่ได้
                      </p>
                      <Input
                        aria-label="เหตุผลในการยกเลิก"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="เหตุผลในการยกเลิก (จำเป็น)"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setCancelling(false)}>
                          ไม่ยกเลิก
                        </Button>
                        <Button
                          size="sm"
                          disabled={cancelReason.trim() === ""}
                          onClick={() => {
                            proto.cancelRule(rule.ruleId, cancelReason.trim());
                            setCancelling(false);
                            setCancelReason("");
                          }}
                        >
                          ยืนยันยกเลิกกฎ
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {panelError && <p className="text-[12.5px] text-destructive">{panelError}</p>}
            </div>
            <div className="flex gap-2 border-t border-border px-5 py-3.5">
              <Button size="lg" className="flex-1" disabled={!!panelError} onClick={closePanel}>
                เสร็จ
              </Button>
              {win && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    if (!window.confirm(`ลบช่วงเวลา "${win.label}" ไหม`)) return;
                    proto.removeWindow(win.id);
                    closePanel();
                  }}
                >
                  ลบ
                </Button>
              )}
              {rule && !rule.cancelled && !(ruleUsage[rule.ruleId] ?? 0) && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    if (!window.confirm(`ลบกฎ "${rule.name || "ที่ยังไม่ตั้งชื่อ"}" ไหม`)) return;
                    proto.removeRule(rule.ruleId);
                    closePanel();
                  }}
                >
                  ลบ
                </Button>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

function SectionHead({ title, hint, action }: { title: string; hint: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1">
        <h2 className="text-[15.5px] font-bold">{title}</h2>
        <p className="text-[12.5px] text-muted-foreground">{hint}</p>
      </div>
      {action}
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

function ChoiceChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={
        on
          ? "rounded-lg border border-primary bg-accent px-3 py-1.5 text-[13px] font-semibold text-primary"
          : "rounded-lg border border-border px-3 py-1.5 text-[13px] hover:bg-muted"
      }
    >
      {children}
    </button>
  );
}

function CheckRow({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

function Stepper({
  value,
  onChange,
  step,
  min,
  unit,
}: {
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  unit: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`ลด ${step}`}
        disabled={value - step < min}
        onClick={() => onChange(value - step)}
        className="flex size-10 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-30"
      >
        <Minus className="size-4" />
      </button>
      <span className="w-24 text-center text-[16px] font-semibold tabular-nums">
        {value} <span className="text-[12.5px] font-normal text-muted-foreground">{unit}</span>
      </span>
      <button
        type="button"
        aria-label={`เพิ่ม ${step}`}
        onClick={() => onChange(value + step)}
        className="flex size-10 items-center justify-center rounded-lg border border-border hover:bg-muted"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
