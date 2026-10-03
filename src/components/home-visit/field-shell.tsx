"use client";

import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

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
  screening: "bg-[#ede9fe] text-[#6d28d9]",
};

export function AutoBadge({ source }: { source: FillSource }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold ${SOURCE_STYLE[source]}`}
    >
      <Sparkles className="size-3" />
      {SOURCE_LABEL[source]}
    </span>
  );
}

/** ห่อหุ้มช่องกรอกหนึ่งช่อง พร้อมแสดงว่าถูกกรอกอัตโนมัติจากแหล่งใด */
export function Field({
  label,
  htmlFor,
  source,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  source?: FillSource;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <Label htmlFor={htmlFor} className="text-[12.5px] text-muted-foreground">
          {label}
        </Label>
        {source && <AutoBadge source={source} />}
      </div>
      {children}
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
        <h2 className="text-[15.5px] font-bold">
          <span className="mr-2 text-primary">{no}</span>
          {title}
        </h2>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}
