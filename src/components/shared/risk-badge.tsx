import { cn } from "cn";
import { DIMENSION_RESULT_LABEL, type DimensionResult } from "@/lib/types";

const STYLES: Record<DimensionResult, string> = {
  green: "bg-risk-green-bg text-risk-green",
  amber: "bg-risk-amber-bg text-risk-amber",
  red: "bg-risk-red-bg text-risk-red",
  pending: "bg-muted text-muted-foreground",
};

/**
 * ผลรายมิติ / ผลรวม: ปกติ / เสี่ยง / มีปัญหา / รอผลประเมิน
 * (ไม่ใช้ชื่อสีในข้อความ ตาม CONTEXT.md)
 */
export function RiskBadge({
  group,
  className,
}: {
  group: DimensionResult;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        STYLES[group],
        className
      )}
    >
      {DIMENSION_RESULT_LABEL[group]}
    </span>
  );
}

const DOT: Record<DimensionResult, string> = {
  green: "bg-risk-green",
  amber: "bg-risk-amber",
  red: "bg-risk-red",
  pending: "bg-muted-foreground",
};

export function RiskDot({ group, className }: { group: DimensionResult; className?: string }) {
  return <span className={cn("inline-block size-2.5 rounded-full", DOT[group], className)} />;
}
