import { cn } from "cn";
import { RiskGroup } from "@/lib/types";

const STYLES: Record<RiskGroup, { label: string; className: string }> = {
  green: {
    label: "ปกติ (เขียว)",
    className: "bg-risk-green-bg text-risk-green",
  },
  amber: {
    label: "เสี่ยง (เหลือง)",
    className: "bg-risk-amber-bg text-risk-amber",
  },
  red: {
    label: "มีปัญหา (แดง)",
    className: "bg-risk-red-bg text-risk-red",
  },
};

export function RiskBadge({
  group,
  short = false,
  className,
}: {
  group: RiskGroup;
  short?: boolean;
  className?: string;
}) {
  const style = STYLES[group];
  const label = short ? style.label.split(" ")[0] : style.label;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        style.className,
        className
      )}
    >
      {label}
    </span>
  );
}

export function RiskDot({ group, className }: { group: RiskGroup; className?: string }) {
  const color =
    group === "green" ? "bg-risk-green" : group === "amber" ? "bg-risk-amber" : "bg-risk-red";
  return <span className={cn("inline-block size-2.5 rounded-full", color, className)} />;
}
