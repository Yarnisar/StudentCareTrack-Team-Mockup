"use client";

/**
 * กฎความประพฤติ (behavior_rules) — รายการ + แผงแก้ไขด้านขวา
 * แก้ไขรายละเอียด = ยืนยันในที่ · ปิดใช้งานกฎ = กล่องยืนยันกลางจอ (กระทบตัวเลือกของครูทุกคน)
 * ไม่มีการลบกฎ บันทึกเดิมอ้างอิงกฎอยู่ — ใช้การปิดใช้งานแทนเสมอ
 */

import { useMemo, useState } from "react";
import { CircleCheck, CircleOff, Plus } from "lucide-react";
import { ConfirmModal, InlineConfirm } from "@/components/settings/confirm";
import { ruleActiveConfirm, ruleSaveConfirm } from "@/components/settings/confirm-text";
import { SideDrawer } from "@/components/settings/drawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import {
  BEHAVIOR_SEVERITY_LABEL,
  DEFAULT_NOTIFY_GUARDIAN,
  type BehaviorRule,
} from "@/lib/types";

/** ป้ายระดับ — แหล่งเดียวอยู่ที่ lib/types */
export const SEVERITY_LABEL = BEHAVIOR_SEVERITY_LABEL;

export const SEVERITY_ORDER: BehaviorRule["severity"][] = [
  "minor",
  "moderate",
  "severe",
  "positive",
];

const DEFAULT_DELTA: Record<BehaviorRule["severity"], number> = {
  minor: -1,
  moderate: -3,
  severe: -10,
  positive: 3,
};

const NEW_RULE = "__new__";

interface Draft {
  name: string;
  severity: BehaviorRule["severity"];
  scoreDelta: number;
  notifyGuardian: boolean;
}

export function BehaviorRulesSection({ ruleUsage }: { ruleUsage: Record<string, number> }) {
  const store = useStore();
  const [selected, setSelected] = useState<string | null>(null);

  const rule = store.behaviorRules.find((r) => r.ruleId === selected) ?? null;
  const creating = selected === NEW_RULE;

  return (
    <Card>
      <CardContent className="p-5 lg:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-bold">กฎความประพฤติ</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              กฎที่ปิดใช้งานจะไม่แสดงให้ครูเลือก บันทึกเดิมยังอยู่
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSelected(NEW_RULE)}>
            <Plus className="size-4" /> เพิ่มกฎ
          </Button>
        </div>

        <ul className="divide-y divide-border rounded-xl border border-border">
          {store.behaviorRules.map((r) => (
            <li key={r.ruleId} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
              <span className="min-w-0 flex-1 basis-40 text-[13px] font-medium">
                {r.name || <span className="text-muted-foreground">(ยังไม่ตั้งชื่อ)</span>}
              </span>
              <span className="w-16 text-[12px] text-muted-foreground">{SEVERITY_LABEL[r.severity]}</span>
              <span
                className={`w-9 text-right text-[13px] font-bold ${
                  r.scoreDelta > 0 ? "text-risk-green" : "text-risk-red"
                }`}
              >
                {r.scoreDelta > 0 ? `+${r.scoreDelta}` : r.scoreDelta}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
                  r.isActive ? "bg-risk-green-bg text-risk-green" : "bg-muted text-muted-foreground"
                }`}
              >
                {r.isActive ? (
                  <CircleCheck className="size-3.5" aria-hidden />
                ) : (
                  <CircleOff className="size-3.5" aria-hidden />
                )}
                {r.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
              </span>
              <Button size="sm" variant="ghost" onClick={() => setSelected(r.ruleId)}>
                แก้ไข
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>

      {(rule || creating) && (
        <RuleDrawer
          key={selected}
          rule={rule}
          usedCount={rule ? (ruleUsage[rule.ruleId] ?? 0) : 0}
          onClose={() => setSelected(null)}
          onCreated={(ruleId) => setSelected(ruleId)}
        />
      )}
    </Card>
  );
}

function RuleDrawer({
  rule,
  usedCount,
  onClose,
  onCreated,
}: {
  rule: BehaviorRule | null;
  usedCount: number;
  onClose: () => void;
  onCreated: (ruleId: string) => void;
}) {
  const store = useStore();
  const [draft, setDraft] = useState<Draft>(() => ({
    name: rule?.name ?? "",
    severity: rule?.severity ?? "minor",
    scoreDelta: rule?.scoreDelta ?? DEFAULT_DELTA.minor,
    notifyGuardian: rule?.notifyGuardian ?? DEFAULT_NOTIFY_GUARDIAN.minor,
  }));
  const [confirmingSave, setConfirmingSave] = useState(false);
  const [confirmingActive, setConfirmingActive] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setConfirmingSave(false);
    setSaved(false);
  };

  const pickSeverity = (severity: BehaviorRule["severity"]) => {
    setDraft((d) => ({
      ...d,
      severity,
      // กฎใหม่เติมค่าแนะนำให้ กฎเดิมคงค่าที่แอดมินตั้งไว้
      scoreDelta: rule ? d.scoreDelta : DEFAULT_DELTA[severity],
      notifyGuardian: rule ? d.notifyGuardian : DEFAULT_NOTIFY_GUARDIAN[severity],
    }));
    setConfirmingSave(false);
    setSaved(false);
  };

  const dirty = useMemo(
    () =>
      !rule ||
      draft.name !== rule.name ||
      draft.severity !== rule.severity ||
      draft.scoreDelta !== rule.scoreDelta ||
      draft.notifyGuardian !== rule.notifyGuardian,
    [draft, rule]
  );
  const valid = draft.name.trim() !== "" && Number.isFinite(draft.scoreDelta);

  const save = () => {
    setConfirmingSave(false);
    if (rule) {
      store.updateBehaviorRule(rule.ruleId, { ...draft, name: draft.name.trim() });
      setSaved(true);
      return;
    }
    const created = store.addBehaviorRule({
      name: draft.name.trim(),
      severity: draft.severity,
      scoreDelta: draft.scoreDelta,
      notifyGuardian: draft.notifyGuardian,
    });
    if (created) onCreated(created.ruleId);
  };

  const toggleActive = () => {
    if (!rule) return;
    setConfirmingActive(false);
    store.setBehaviorRuleActive(rule.ruleId, !rule.isActive);
  };

  return (
    <SideDrawer title={rule ? "แก้ไขกฎ" : "เพิ่มกฎ"} onClose={onClose}>
      <div className="space-y-3.5">
        <div>
          <Label htmlFor="rule-name" className="text-[12px] text-muted-foreground">
            ชื่อกฎ
          </Label>
          <Input
            id="rule-name"
            className="mt-1.5"
            value={draft.name}
            placeholder="เช่น มาสาย"
            onChange={(e) => set("name", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="rule-severity" className="text-[12px] text-muted-foreground">
            ระดับ
          </Label>
          <select
            id="rule-severity"
            value={draft.severity}
            onChange={(e) => pickSeverity(e.target.value as BehaviorRule["severity"])}
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            {SEVERITY_ORDER.map((s) => (
              <option key={s} value={s}>
                {SEVERITY_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="rule-delta" className="text-[12px] text-muted-foreground">
            คะแนนต่อครั้ง (ติดลบ = หัก)
          </Label>
          <Input
            id="rule-delta"
            className="mt-1.5"
            type="number"
            value={draft.scoreDelta}
            onChange={(e) => set("scoreDelta", e.target.value === "" ? 0 : Math.round(Number(e.target.value)))}
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={draft.notifyGuardian}
            onChange={(e) => set("notifyGuardian", e.target.checked)}
          />
          แจ้งผู้ปกครองเมื่อยืนยันบันทึก
        </label>

        {saved && <p className="text-[12px] text-risk-green">บันทึกการแก้ไขแล้ว</p>}

        {confirmingSave ? (
          <InlineConfirm
            content={ruleSaveConfirm(draft.name.trim(), draft.scoreDelta, usedCount, !rule)}
            onConfirm={save}
            onCancel={() => setConfirmingSave(false)}
          />
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled={!dirty || !valid}
            onClick={() => setConfirmingSave(true)}
          >
            {rule ? "บันทึกการแก้ไข" : "เพิ่มกฎ"}
          </Button>
        )}

        {rule && (
          <>
            <p className="text-[12px] text-muted-foreground">
              ใช้บันทึกไปแล้ว {usedCount} ครั้ง · ไม่มีการลบกฎ ให้ปิดใช้งานแทน
            </p>
            <Button
              size="lg"
              variant={rule.isActive ? "destructive" : "outline"}
              className="w-full"
              onClick={() => setConfirmingActive(true)}
            >
              {rule.isActive ? "ปิดใช้งานกฎนี้" : "เปิดใช้งานกฎนี้"}
            </Button>
          </>
        )}
      </div>

      {rule && confirmingActive && (
        <ConfirmModal
          content={ruleActiveConfirm(rule, usedCount)}
          onConfirm={toggleActive}
          onCancel={() => setConfirmingActive(false)}
        />
      )}
    </SideDrawer>
  );
}
