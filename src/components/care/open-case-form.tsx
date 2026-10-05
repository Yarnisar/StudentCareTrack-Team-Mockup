"use client";

import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import type { CareCase, CaseSuggestion } from "@/lib/types";
import { CASE_TRIGGER_SOURCE_LABEL } from "@/lib/types";
import { EMPTY_PLAN, isPlanDraftComplete, PlanFields, type PlanDraft } from "./plan-fields";

/**
 * ฟอร์มเปิด care case โดยครูประจำชั้น
 * - ไม่ส่ง suggestion: ครูเปิดเอง (source = manual) ต้องระบุเหตุที่พบ
 * - ส่ง suggestion: เปิดจากคำแนะนำ (คะแนนความประพฤติ → behavior, ผล "เสี่ยง" → manual)
 * จัดทำแผนแรกพร้อมกันได้ (ไม่บังคับ — ยังไม่มีแผนจะบันทึกการติดตามผลไม่ได้)
 */
export function OpenCaseForm({
  studentId,
  suggestion,
  onOpened,
  onCancel,
}: {
  studentId: string;
  suggestion?: CaseSuggestion;
  onOpened?: (careCase: CareCase) => void;
  onCancel?: () => void;
}) {
  const store = useStore();
  const [summary, setSummary] = useState("");
  const [withPlan, setWithPlan] = useState(false);
  const [plan, setPlan] = useState<PlanDraft>(EMPTY_PLAN);
  const [error, setError] = useState<string | null>(null);

  const student = store.getStudent(studentId);
  const active = store.activeCaseOf(studentId);
  if (!student) return null;
  if (active) {
    return <p className="text-sm text-muted-foreground">นักเรียนมี case ที่เปิดอยู่แล้ว ({active.caseId})</p>;
  }
  if (!store.canManageCase(studentId)) {
    return <p className="text-sm text-muted-foreground">เฉพาะครูประจำชั้นของนักเรียนเปิด case ได้</p>;
  }

  const canSubmit = (suggestion || summary.trim() !== "") && (!withPlan || isPlanDraftComplete(plan));

  const submit = () => {
    const planInput = withPlan ? plan : undefined;
    const res = suggestion
      ? store.acceptSuggestion(suggestion.suggestionId, planInput)
      : store.openCase(studentId, { source: "manual", summary, plan: planInput });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onOpened?.(res.careCase);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[15.5px] font-bold">เปิด care case · {student.fullName}</h3>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">
          case ผูกกับนักเรียน ครูประจำชั้นทั้ง 2 คนของห้องดำเนินการได้เท่ากัน
        </p>
      </div>

      {suggestion ? (
        <div className="rounded-lg bg-surface p-3.5 text-[13.5px]">
          <div className="text-[12px] text-muted-foreground">เหตุเปิด case (ระบบแนะนำ)</div>
          <div className="font-semibold">{CASE_TRIGGER_SOURCE_LABEL[suggestion.source]}</div>
          {suggestion.summary && <div className="text-muted-foreground">{suggestion.summary}</div>}
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="open-summary" className="text-[13px]">
            เหตุที่พบ
          </Label>
          <Textarea
            id="open-summary"
            rows={2}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="สิ่งที่ครูประจำชั้นสังเกตเห็น เช่น นักเรียนเก็บตัวและขาดเรียนบ่อยขึ้น"
          />
        </div>
      )}

      <label htmlFor="open-with-plan" className="flex cursor-pointer items-center gap-3">
        <Checkbox id="open-with-plan" checked={withPlan} onCheckedChange={(c) => setWithPlan(c === true)} />
        <span className="text-[13.5px]">จัดทำแผนช่วยเหลือแผนแรกพร้อมกัน</span>
      </label>
      {withPlan && (
        <div className="rounded-xl border border-border p-4">
          <PlanFields value={plan} onChange={setPlan} idPrefix="open-plan" />
        </div>
      )}

      {error && <p className="text-[13px] text-risk-red">{error}</p>}

      <div className="flex gap-2">
        <Button disabled={!canSubmit} onClick={submit}>
          <FolderPlus className="size-4" /> เปิด case
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            ยกเลิก
          </Button>
        )}
      </div>
    </div>
  );
}
