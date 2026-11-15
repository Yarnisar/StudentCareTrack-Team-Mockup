"use client";

/**
 * เลือกบทบาทที่บันทึกกฎข้อนี้ได้ (UC7 Scenario B ข้อ 9) ใช้ร่วมกันทุกแบบร่างของหน้าตั้งค่า
 * ตัวบันทึกพฤติกรรมอ่านค่านี้เพื่อตรวจสิทธิ์ก่อนให้เลือกกฎ (UC8 ข้อ 6, Alt-B ข้อ 5)
 */

import { RECORDER_LABEL, RECORDER_ORDER } from "@/lib/behavior-rules";
import type { BehaviorRule } from "@/lib/types";

export function RuleRecorderPicker({
  rule,
  onChange,
  compact = false,
}: {
  rule: BehaviorRule;
  onChange: (recordableBy: BehaviorRule["recordableBy"]) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`ผู้ที่บันทึกกฎ ${rule.name} ได้`}>
      {!compact && <span className="text-[12px] text-muted-foreground">บันทึกได้โดย:</span>}
      {RECORDER_ORDER.map((r) => {
        const on = rule.recordableBy.includes(r);
        // ต้องเหลืออย่างน้อย 1 บทบาท ไม่อย่างนั้นไม่มีใครบันทึกกฎนี้ได้
        const last = on && rule.recordableBy.length === 1;
        return (
          <button
            key={r}
            type="button"
            aria-pressed={on}
            disabled={last}
            title={last ? "ต้องมีผู้บันทึกได้อย่างน้อย 1 บทบาท" : undefined}
            onClick={() => onChange(on ? rule.recordableBy.filter((x) => x !== r) : [...rule.recordableBy, r])}
            className={`rounded-md border px-2 py-0.5 text-[11.5px] disabled:cursor-not-allowed ${
              on ? "border-primary bg-accent font-semibold text-primary" : "border-border hover:bg-muted"
            }`}
          >
            {RECORDER_LABEL[r]}
          </button>
        );
      })}
    </div>
  );
}
