"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatThaiDate } from "@/lib/format";
import {
  CARE_METHOD_LABEL,
  CARE_METHODS_MAX,
  CARE_METHODS_MIN,
  SUPPORT_TYPE_LABEL,
  type CareMethod,
  type SupportType,
} from "@/lib/types";

export const SUPPORT_TYPES = Object.keys(SUPPORT_TYPE_LABEL) as SupportType[];
export const CARE_METHODS = Object.keys(CARE_METHOD_LABEL) as CareMethod[];

export interface PlanDraft {
  supportType: SupportType;
  careMethods: CareMethod[];
  goal: string;
  targetDate: string;
}

export const EMPTY_PLAN: PlanDraft = { supportType: "prevent", careMethods: [], goal: "", targetDate: "" };

export function isPlanDraftComplete(p: PlanDraft): boolean {
  return (
    p.careMethods.length >= CARE_METHODS_MIN &&
    p.careMethods.length <= CARE_METHODS_MAX &&
    p.goal.trim() !== "" &&
    p.targetDate !== ""
  );
}

export function usePlanDraft() {
  return useState<PlanDraft>(EMPTY_PLAN);
}

/** ช่องกรอกแผนช่วยเหลือ: ประเภทการช่วยเหลือ วิธีการดูแล 1–5 วิธี เป้าหมาย และวันที่คาดว่าจะบรรลุ */
export function PlanFields({
  value,
  onChange,
  idPrefix,
}: {
  value: PlanDraft;
  onChange: (next: PlanDraft) => void;
  idPrefix: string;
}) {
  const toggleMethod = (m: CareMethod, on: boolean) =>
    onChange({
      ...value,
      careMethods: on ? [...value.careMethods, m] : value.careMethods.filter((x) => x !== m),
    });

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 text-[13px] font-semibold">ประเภทการช่วยเหลือ</div>
        <div className="flex flex-wrap gap-2">
          {SUPPORT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={value.supportType === t}
              onClick={() => onChange({ ...value, supportType: t })}
              className={
                value.supportType === t
                  ? "rounded-lg border border-primary bg-accent px-3.5 py-2 text-[13px] font-semibold text-primary"
                  : "rounded-lg border border-border px-3.5 py-2 text-[13px] text-muted-foreground hover:bg-muted/50"
              }
            >
              {SUPPORT_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1 text-[13px] font-semibold">
          วิธีการดูแล <span className="font-normal text-muted-foreground">(เลือก 1–5 วิธี)</span>
        </div>
        {CARE_METHODS.map((m) => (
          <label key={m} htmlFor={`${idPrefix}-m-${m}`} className="flex cursor-pointer items-center gap-3 py-1.5">
            <Checkbox
              id={`${idPrefix}-m-${m}`}
              checked={value.careMethods.includes(m)}
              onCheckedChange={(checked) => toggleMethod(m, checked === true)}
            />
            <span className="text-[13px]">{CARE_METHOD_LABEL[m]}</span>
          </label>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-goal`} className="text-[13px]">
          เป้าหมายของแผน
        </Label>
        <Textarea
          id={`${idPrefix}-goal`}
          rows={2}
          value={value.goal}
          onChange={(e) => onChange({ ...value, goal: e.target.value })}
          placeholder="เช่น ลดการมาสายให้เหลือไม่เกินสัปดาห์ละ 1 ครั้ง ภายในสิ้นภาคเรียน"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-target`} className="text-[13px]">
          วันที่คาดว่าจะบรรลุเป้าหมาย
        </Label>
        <Input
          id={`${idPrefix}-target`}
          type="date"
          value={value.targetDate}
          onChange={(e) => onChange({ ...value, targetDate: e.target.value })}
          className="h-10 max-w-56"
        />
        {value.targetDate && (
          <p className="text-[12px] text-muted-foreground">{formatThaiDate(value.targetDate)}</p>
        )}
      </div>
    </div>
  );
}
