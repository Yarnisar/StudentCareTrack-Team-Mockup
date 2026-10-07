"use client";

/**
 * ช่วงดำเนินงาน (operating_windows) — ตารางหนึ่งแถวต่อกิจกรรมในภาคเรียนปัจจุบัน
 * คลิกแถวเพื่อแก้ในแผงด้านขวา กดบันทึกแล้วยืนยันในที่ก่อนมีผล
 * มีได้ 1 ช่วงต่อกิจกรรมต่อภาคเรียน และระบบล็อกหลังวันปิดเสมอ (ไม่มีตัวเลือกปิดการล็อก)
 */

import { useState } from "react";
import { X } from "lucide-react";
import { InlineConfirm } from "@/components/settings/confirm";
import { windowSaveConfirm, type ImpactContext } from "@/components/settings/confirm-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OperatingWindowCards } from "./operating-window-cards";
import { OperatingWindowsTimeline } from "./operating-windows-timeline";
import { addDaysThai, compareThaiDate, formatThaiDate, thaiDateOf } from "@/lib/format";
import { useStore } from "@/lib/store";
import {
  OPERATING_ACTIVITY_LABEL,
  type OperatingActivity,
} from "@/lib/types";

interface Draft {
  opensAt: string;
  closesAt: string;
  remindDaysBefore: number;
}

export function OperatingWindowsPanel({ impact }: { impact: ImpactContext }) {
  const [selected, setSelected] = useState<OperatingActivity | null>(null);

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1">
      <div className="min-w-0 flex-1 overflow-y-auto p-6">
        <h2 className="text-[15.5px] font-bold">ช่วงดำเนินงาน</h2>
        <p className="mt-0.5 mb-3 text-[12.5px] text-muted-foreground">
          มีได้ 1 ช่วงต่อกิจกรรมต่อภาคเรียน · หลังวันปิดระบบล็อกการบันทึกเสมอ
          ดูข้อมูลเดิมได้แต่บันทึกเพิ่มไม่ได้
        </p>

        <OperatingWindowsTimeline today={impact.today} selected={selected} onSelect={setSelected} />
        <OperatingWindowCards impact={impact} onEdit={setSelected} />
      </div>

      {selected && (
        <WindowDrawer
          key={selected}
          activity={selected}
          impact={impact}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function WindowDrawer({
  activity,
  impact,
  onClose,
}: {
  activity: OperatingActivity;
  impact: ImpactContext;
  onClose: () => void;
}) {
  const store = useStore();
  const existing = store.windowOf(activity);
  const [draft, setDraft] = useState<Draft>({
    opensAt: existing?.opensAt ?? impact.today,
    closesAt: existing?.closesAt ?? impact.today,
    remindDaysBefore: existing?.remindDaysBefore ?? 7,
  });
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setConfirming(false);
    setError(null);
    setSavedAt(null);
  };

  const dirty =
    !existing ||
    draft.opensAt !== existing.opensAt ||
    draft.closesAt !== existing.closesAt ||
    draft.remindDaysBefore !== existing.remindDaysBefore;
  const valid =
    draft.opensAt !== "" &&
    draft.closesAt !== "" &&
    compareThaiDate(thaiDateOf(draft.opensAt), thaiDateOf(draft.closesAt)) <= 0 &&
    draft.remindDaysBefore >= 0;

  const save = () => {
    const result = store.saveOperatingWindow(activity, draft);
    setConfirming(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setSavedAt(result.window.closesAt);
  };

  return (
    <aside className="absolute inset-y-0 right-0 z-20 w-96 max-w-full shrink-0 overflow-y-auto border-l border-border bg-card p-5 shadow-xl xl:static xl:z-auto xl:shadow-none">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="flex-1 text-[14.5px] font-bold">
          {OPERATING_ACTIVITY_LABEL[activity]}
        </h3>
        <button
          type="button"
          aria-label="ปิดแผง"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="เปิดให้บันทึก" id="win-open">
            <Input
              id="win-open"
              type="date"
              value={draft.opensAt}
              onChange={(e) => set("opensAt", e.target.value)}
            />
          </Field>
          <Field label="ปิดรับ (รวมวันนี้)" id="win-close">
            <Input
              id="win-close"
              type="date"
              value={draft.closesAt}
              onChange={(e) => set("closesAt", e.target.value)}
            />
          </Field>
        </div>
        <Field label="แจ้งเตือนครูล่วงหน้าก่อนปิด (วัน)" id="win-remind">
          <Input
            id="win-remind"
            type="number"
            min={0}
            value={draft.remindDaysBefore}
            onChange={(e) =>
              set("remindDaysBefore", e.target.value === "" ? 0 : Math.round(Number(e.target.value)))
            }
          />
        </Field>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] text-muted-foreground">ทางลัดวันปิด:</span>
          {[7, 14].map((d) => (
            <Button
              key={d}
              type="button"
              size="sm"
              variant="outline"
              disabled={!draft.closesAt}
              onClick={() => set("closesAt", addDaysThai(draft.closesAt, d))}
            >
              +{d} วัน
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => set("closesAt", store.currentTerm.endDate)}
          >
            ปิดสิ้นภาคเรียน
          </Button>
        </div>

        {!valid && (
          <p className="text-[12.5px] text-risk-red">วันเปิดต้องไม่อยู่หลังวันปิด</p>
        )}
        {error && <p className="text-[12.5px] text-risk-red">{error}</p>}
        {savedAt && (
          <p className="text-[12.5px] text-risk-green">
            บันทึกแล้ว · ปิดรับ {formatThaiDate(savedAt)}
          </p>
        )}

        {confirming ? (
          <InlineConfirm
            content={windowSaveConfirm(activity, existing, draft, impact)}
            onConfirm={save}
            onCancel={() => setConfirming(false)}
          />
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled={!dirty || !valid}
            onClick={() => setConfirming(true)}
          >
            {existing ? "บันทึกการแก้ไข" : "กำหนดช่วงเวลา"}
          </Button>
        )}

        <p className="rounded-lg bg-surface px-3 py-2.5 text-[12px] leading-relaxed text-muted-foreground">
          ช่วงดำเนินงานไม่มีการลบ — ถ้าต้องการปิดการบันทึกให้เลื่อนวันปิดมาเป็นวันก่อนหน้า
          ทุกการแก้ไขถูกบันทึกไว้ในประวัติการใช้งานพร้อมค่าก่อน/หลัง
        </p>
      </div>
    </aside>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-[12px] text-muted-foreground">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
