"use client";

import { FolderOpen, FolderPlus } from "lucide-react";
import { CaseSuggestionBanner } from "@/components/care/case-suggestion-banner";
import { LinkButton } from "@/components/ui/link-button";
import type { RaiseTriggerResult } from "@/lib/store";
import { useStore } from "@/lib/store";

/**
 * ผลของการส่งเหตุเปิด case หลังบันทึกผลคัดกรอง / Red Flag / SDQ
 * - opened: ระบบเปิด case ให้แล้ว · appended: เพิ่มเหตุเข้า case ที่เปิดอยู่
 * - suggested / มีคำแนะนำค้าง: แสดง CaseSuggestionBanner ให้ครูประจำชั้นตัดสินใจ
 * ไม่แสดงอะไรถ้าผู้ใช้ไม่มีสิทธิ์เห็นข้อมูลอ่อนไหวของนักเรียน
 */
export function CaseTriggerOutcome({
  studentId,
  result,
  className,
}: {
  studentId: string;
  result: RaiseTriggerResult | null;
  className?: string;
}) {
  const store = useStore();
  if (!store.canSeeSensitive(studentId)) return null;
  const active = store.activeCaseOf(studentId);
  const opened = result?.kind === "opened";
  const appended = result?.kind === "appended";
  const duplicate = result?.kind === "ignored" && result.reason === "duplicate" && !!active;

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      {(opened || appended || duplicate) && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-risk-red-bg px-4 py-3 text-[13px] text-risk-red">
          {opened ? <FolderPlus className="size-4 shrink-0" /> : <FolderOpen className="size-4 shrink-0" />}
          <div className="min-w-0 flex-1">
            <div className="font-semibold">
              {opened
                ? "เปิด care case อัตโนมัติแล้ว"
                : appended
                  ? "เพิ่มเหตุใหม่เข้า care case ที่เปิดอยู่แล้ว"
                  : "เหตุนี้อยู่ใน care case ที่เปิดอยู่แล้ว"}
            </div>
            <div className="text-[12px]">
              {opened || appended
                ? "แจ้งครูประจำชั้นแล้ว"
                : "ไม่ได้เพิ่มซ้ำ"}
            </div>
          </div>
          <LinkButton size="sm" variant="outline" href={`/care-cases?student=${studentId}`}>
            ดู care case
          </LinkButton>
        </div>
      )}
      <CaseSuggestionBanner studentId={studentId} />
    </div>
  );
}
