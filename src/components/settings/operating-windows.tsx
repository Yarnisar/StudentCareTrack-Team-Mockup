"use client";

/**
 * ช่วงดำเนินงาน (operating_windows) — การ์ดเดียวต่อกิจกรรม แก้วันที่ในการ์ดแล้วบันทึกพร้อมยืนยันในที่
 * มีได้ 1 ช่วงต่อกิจกรรมต่อภาคเรียน และระบบล็อกหลังวันปิดเสมอ (ไม่มีตัวเลือกปิดการล็อก ไม่มีเพิ่ม/ลบ)
 */

import { useState } from "react";
import { BellRing, CircleCheck, CircleDashed, Clock, Lock } from "lucide-react";
import { InlineConfirm } from "@/components/settings/confirm";
import { windowSaveConfirm, type ImpactContext } from "@/components/settings/confirm-text";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addDaysThai, compareThaiDate, formatThaiDate, thaiDateOf } from "@/lib/format";
import { useStore } from "@/lib/store";
import {
  OPERATING_ACTIVITIES,
  OPERATING_ACTIVITY_LABEL,
  type OperatingActivity,
} from "@/lib/types";
import { PHASE_LABEL, phaseOf, termBar, type WindowPhase } from "./window-math";

const PHASE_CHIP: Record<WindowPhase, string> = {
  none: "bg-muted text-muted-foreground",
  upcoming: "bg-accent text-primary",
  open: "bg-risk-green-bg text-risk-green",
  closing: "bg-risk-amber-bg text-risk-amber",
  closed: "bg-muted text-muted-foreground",
};

const PHASE_BAR: Record<WindowPhase, string> = {
  none: "bg-muted-foreground/40",
  upcoming: "bg-primary/60",
  open: "bg-risk-green",
  closing: "bg-risk-amber",
  closed: "bg-muted-foreground/50",
};

const PHASE_ICON = {
  none: CircleDashed,
  upcoming: Clock,
  open: CircleCheck,
  closing: BellRing,
  closed: Lock,
} as const;

const ACTIVITY_HELP: Record<OperatingActivity, string> = {
  screening: "ครูประจำชั้นบันทึกและรับรองผลคัดกรอง",
  home_visit: "ครูประจำชั้นบันทึกการเยี่ยมบ้านประจำปี",
  sdq: "ผู้ประเมินทำแบบ SDQ ประจำภาคเรียน",
  care_record: "ครูบันทึกติดตามผลใน care case",
};

export function OperatingWindowsSection({ impact }: { impact: ImpactContext }) {
  return (
    <Card>
      <CardContent className="p-5 lg:p-6">
        <h2 className="text-[15px] font-bold">ช่วงดำเนินงาน</h2>
        <p className="mt-0.5 mb-4 text-[12px] text-muted-foreground">
          หลังวันปิด ระบบล็อกการบันทึก ดูข้อมูลเดิมได้
        </p>
        <div className="space-y-3">
          {OPERATING_ACTIVITIES.map((a) => (
            <WindowCard key={a} activity={a} impact={impact} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function WindowCard({ activity, impact }: { activity: OperatingActivity; impact: ImpactContext }) {
  const store = useStore();
  const term = store.currentTerm;
  const existing = store.windowOf(activity);
  const phase = phaseOf(store.windowStatusOf(activity), store.isWindowClosingSoon(activity));
  const Icon = PHASE_ICON[phase];

  const [opensAt, setOpensAt] = useState(existing?.opensAt ?? impact.today);
  const [closesAt, setClosesAt] = useState(existing?.closesAt ?? impact.today);
  const [remind, setRemind] = useState(existing?.remindDaysBefore ?? 7);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const draft = { opensAt, closesAt, remindDaysBefore: remind };
  const touch = () => {
    setConfirming(false);
    setError(null);
    setSaved(false);
  };

  const dirty =
    !existing ||
    opensAt !== existing.opensAt ||
    closesAt !== existing.closesAt ||
    remind !== existing.remindDaysBefore;
  const valid =
    opensAt !== "" &&
    closesAt !== "" &&
    compareThaiDate(thaiDateOf(opensAt), thaiDateOf(closesAt)) <= 0 &&
    remind >= 0;

  const save = () => {
    const result = store.saveOperatingWindow(activity, draft);
    setConfirming(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setSaved(true);
  };

  const bar = existing ? termBar(term, existing, impact.today) : null;
  const id = `win-${activity}`;

  return (
    <article className="rounded-xl border border-border p-4">
      <div className="flex items-center gap-2">
        <h3 className="flex-1 text-[15px] font-bold">{OPERATING_ACTIVITY_LABEL[activity]}</h3>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${PHASE_CHIP[phase]}`}
        >
          <Icon className="size-3.5" aria-hidden />
          {PHASE_LABEL[phase]}
        </span>
      </div>
      <p className="mt-0.5 text-[12px] text-muted-foreground">{ACTIVITY_HELP[activity]}</p>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div>
          <Label htmlFor={`${id}-open`} className="text-[12px] text-muted-foreground">
            เปิดให้ทำ
          </Label>
          <Input
            id={`${id}-open`}
            type="date"
            className="mt-1.5"
            value={opensAt}
            onChange={(e) => {
              setOpensAt(e.target.value);
              touch();
            }}
          />
        </div>
        <div>
          <Label htmlFor={`${id}-close`} className="text-[12px] text-muted-foreground">
            ปิดรับ
          </Label>
          <Input
            id={`${id}-close`}
            type="date"
            className="mt-1.5"
            value={closesAt}
            onChange={(e) => {
              setClosesAt(e.target.value);
              touch();
            }}
          />
          <div className="mt-1 flex flex-wrap gap-x-3 text-[12px]">
            {[7, 14].map((d) => (
              <button
                key={d}
                type="button"
                disabled={!closesAt}
                onClick={() => {
                  setClosesAt(addDaysThai(closesAt, d));
                  touch();
                }}
                className="text-primary hover:underline disabled:opacity-40"
              >
                +{d} วัน
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setClosesAt(term.endDate);
                touch();
              }}
              className="text-primary hover:underline"
            >
              ปิดสิ้นภาคเรียน
            </button>
          </div>
        </div>
        <div>
          <Label htmlFor={`${id}-remind`} className="text-[12px] text-muted-foreground">
            เตือนล่วงหน้า (วัน)
          </Label>
          <Input
            id={`${id}-remind`}
            type="number"
            min={0}
            className="mt-1.5"
            value={remind}
            onChange={(e) => {
              setRemind(e.target.value === "" ? 0 : Math.round(Number(e.target.value)));
              touch();
            }}
          />
        </div>
      </div>

      {(!valid || error || saved) && (
        <p className={`mt-2 text-[12px] ${saved && valid && !error ? "text-risk-green" : "text-risk-red"}`}>
          {error ?? (!valid ? "วันเปิดต้องไม่อยู่หลังวันปิด" : `บันทึกแล้ว · ปิดรับ ${formatThaiDate(closesAt)}`)}
        </p>
      )}

      <div className="mt-3 flex items-center gap-4">
        <div className="min-w-0 flex-1">
          {bar ? (
            <div
              role="img"
              aria-label={`ตำแหน่งของช่วงในภาคเรียน ${formatThaiDate(existing!.opensAt)} ถึง ${formatThaiDate(existing!.closesAt)}`}
              className="relative h-1.5 rounded-full bg-muted"
            >
              <div
                className={`absolute inset-y-0 rounded-full ${PHASE_BAR[phase]}`}
                style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
              />
              <div
                className="absolute -top-1 h-3.5 w-0.5 rounded-full bg-foreground"
                style={{ left: `${bar.today}%` }}
                title="วันนี้"
              />
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground">ยังไม่กำหนด ครูจะบันทึกไม่ได้</p>
          )}
        </div>
        {!confirming && (
          <Button disabled={!dirty || !valid} onClick={() => setConfirming(true)}>
            บันทึก
          </Button>
        )}
      </div>

      {confirming && (
        <div className="mt-3">
          <InlineConfirm
            content={windowSaveConfirm(activity, existing, draft, impact)}
            onConfirm={save}
            onCancel={() => setConfirming(false)}
          />
        </div>
      )}
    </article>
  );
}
