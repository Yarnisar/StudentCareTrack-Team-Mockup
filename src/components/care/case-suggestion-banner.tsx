"use client";

import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { useStore } from "@/lib/store";
import { formatThaiDate } from "@/lib/format";
import { CASE_TRIGGER_SOURCE_LABEL } from "@/lib/types";

/**
 * แถบแนะนำให้เปิด care case ของนักเรียน 1 คน (ผล "เสี่ยง" หรือคะแนนความประพฤติต่ำกว่าเกณฑ์)
 * วางได้ในหน้าผลคัดกรอง หน้านักเรียน และหน้าความประพฤติ — ไม่แสดงอะไรถ้าไม่มีคำแนะนำ
 * หรือผู้ใช้ไม่มีสิทธิ์เห็นข้อมูลอ่อนไหวของนักเรียน
 * ปุ่มดำเนินการแสดงเฉพาะครูประจำชั้น
 */
export function CaseSuggestionBanner({ studentId, className }: { studentId: string; className?: string }) {
  const store = useStore();
  if (!store.canSeeSensitive(studentId)) return null;
  const suggestions = store.pendingSuggestionsOf(studentId);
  if (suggestions.length === 0) return null;
  const canManage = store.canManageCase(studentId);
  const active = store.activeCaseOf(studentId);

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      {suggestions.map((s) => (
        <div
          key={s.suggestionId}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-risk-amber-bg px-4 py-3 text-[13px] text-risk-amber"
        >
          <Lightbulb className="size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold">
              {active ? "ระบบแนะนำให้เพิ่มเหตุใน care case ที่เปิดอยู่" : "ระบบแนะนำให้พิจารณาเปิด care case"}
            </div>
            <div className="text-[12.5px]">
              {CASE_TRIGGER_SOURCE_LABEL[s.source]}
              {s.summary ? ` · ${s.summary}` : ""} · {formatThaiDate(s.detectedAt)}
            </div>
          </div>
          {canManage && (
            <div className="flex gap-2">
              {active ? (
                <Button size="sm" onClick={() => store.acceptSuggestion(s.suggestionId)}>
                  เพิ่มเป็นเหตุใน case
                </Button>
              ) : (
                <LinkButton
                  size="sm"
                  href={`/care-cases?student=${studentId}&suggestion=${encodeURIComponent(s.suggestionId)}`}
                >
                  เปิด case
                </LinkButton>
              )}
              <Button size="sm" variant="outline" onClick={() => store.dismissSuggestion(s.suggestionId)}>
                {active ? "ไม่เพิ่ม" : "ไม่ต้องเปิด"}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
