"use client";

import { Copy, History, PencilLine, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import type { CarryState } from "@/lib/home-visit-form";

/** แหล่งข้อมูลที่ระบบใช้กรอกอัตโนมัติ */
export type FillSource = "registry" | "guardian" | "previous" | "screening";

export const SOURCE_LABEL: Record<FillSource, string> = {
  registry: "ทะเบียนนักเรียน",
  guardian: "ผู้ปกครองกรอกล่วงหน้า",
  previous: "การเยี่ยมบ้านครั้งก่อน",
  screening: "ผลการคัดกรอง",
};

export const SOURCE_STYLE: Record<FillSource, string> = {
  registry: "bg-accent text-primary",
  guardian: "bg-risk-green-bg text-risk-green",
  previous: "bg-risk-amber-bg text-risk-amber",
  screening: "bg-accent text-accent-foreground",
};

export function AutoBadge({ source }: { source: FillSource }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] ${SOURCE_STYLE[source]}`}
    >
      <Sparkles className="size-3" />
      {SOURCE_LABEL[source]}
    </span>
  );
}

/**
 * ข้อมูลที่ยกมาจากการเยี่ยมบ้านครั้งก่อน
 * - same    = ยังเป็นค่าเดิมจากภาคเรียนก่อน
 * - changed = ครูแก้ไขให้ต่างจากภาคเรียนก่อนแล้ว
 */
export function CarryBadge({ state }: { state: CarryState }) {
  if (state === "changed") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-risk-amber">
        <PencilLine className="size-3" />
        แก้จากภาคเรียนก่อน
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
      <History className="size-3" />
      ข้อมูลจากภาคเรียนก่อน
    </span>
  );
}

/** ปุ่มคัดลอกข้อมูลจากแหล่งอื่นในระบบ (ทะเบียนบ้าน / ข้อมูลบิดา-มารดา) */
export function CopyButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-primary transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
    >
      <Copy className="size-3.5" />
      {label}
    </button>
  );
}

/** ห่อหุ้มช่องกรอกหนึ่งช่อง พร้อมแสดงว่าถูกกรอกอัตโนมัติจากแหล่งใด */
export function Field({
  label,
  htmlFor,
  source,
  carry,
  action,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  source?: FillSource;
  carry?: CarryState;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <Label htmlFor={htmlFor} className="text-[13px] text-muted-foreground">
          {label}
        </Label>
        {source && !(carry && source === "previous") && <AutoBadge source={source} />}
        {carry && <CarryBadge state={carry} />}
        {action && (
          <>
            <span className="flex-1" />
            {action}
          </>
        )}
      </div>
      {children}
    </div>
  );
}

/** ช่องข้อมูลที่ระบบกรอกให้และแก้ไขในแบบฟอร์มนี้ไม่ได้ */
export function ReadOnly({ value }: { value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[13px] font-medium">
      {value}
    </div>
  );
}

export function SectionCard({
  no,
  title,
  description,
  children,
}: {
  no: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4">
        <h2 className="text-[15px] font-bold">
          <span className="mr-2 text-primary">{no}</span>
          {title}
        </h2>
        {description && <p className="mt-1 text-[12px] text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}
