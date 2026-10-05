import type { DcLevel } from "@/lib/types";

export const DC_LEVEL_STYLE: Record<DcLevel, string> = {
  3: "bg-risk-green-bg text-risk-green",
  2: "bg-accent text-primary",
  1: "bg-risk-amber-bg text-risk-amber",
  0: "bg-risk-red-bg text-risk-red",
};

/** ป้ายตัวเลขระดับคุณภาพ 0–3 — dashed = ค่าที่ระบบเสนอ (ยังไม่สรุป) */
export function DcLevelChip({
  level,
  dashed = false,
  marked = false,
}: {
  level: DcLevel | null | undefined;
  dashed?: boolean;
  /** มีการแก้จากค่าที่ระบบเสนอ */
  marked?: boolean;
}) {
  if (level == null) {
    return (
      <span className="inline-flex h-6 w-8 items-center justify-center rounded-md border border-dashed border-border text-[12px] text-muted-foreground">
        –
      </span>
    );
  }
  return (
    <span
      className={`relative inline-flex h-6 w-8 items-center justify-center rounded-md text-[13px] font-bold ${DC_LEVEL_STYLE[level]} ${
        dashed ? "border border-dashed border-current opacity-70" : ""
      }`}
    >
      {level}
      {marked && <span className="absolute -top-1 -right-1 size-2 rounded-full bg-primary" />}
    </span>
  );
}
