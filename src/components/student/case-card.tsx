"use client";

import { AlertTriangle } from "lucide-react";
import { CaseSuggestionBanner } from "@/components/care/case-suggestion-banner";
import { LinkButton } from "@/components/ui/link-button";
import { formatThaiDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { CASE_CLOSE_REASON_LABEL } from "@/lib/types";
import { Chip, SectionCard } from "./section-card";

const CONSENT_TEXT = {
  granted: { tone: "green", label: "ผู้ปกครองให้ความยินยอมแล้ว" },
  declined: { tone: "red", label: "ผู้ปกครองไม่ยินยอม" },
  none: { tone: "muted", label: "ผู้ปกครองยังไม่ตอบ" },
} as const;

/** สถานะ care case ของนักเรียน — ข้อมูลอ่อนไหว (ผู้เรียกตรวจ canSeeSensitive) */
export function CaseCard({ studentId }: { studentId: string }) {
  const store = useStore();
  const careCase = store.caseOf(studentId);
  const canManage = store.canManageCase(studentId);
  const consent = CONSENT_TEXT[store.consentStatusOf(studentId)];
  const href = `/care-cases?student=${studentId}`;
  const unplanned = careCase?.status === "active" ? careCase.triggers.filter((t) => t.planId === null).length : 0;

  const action = careCase ? (
    <LinkButton size="sm" variant="outline" href={href}>
      {canManage ? "ดู case ช่วยเหลือ" : "ดู case (อ่านอย่างเดียว)"}
    </LinkButton>
  ) : canManage ? (
    <LinkButton size="sm" href={href}>
      เปิด case ช่วยเหลือ
    </LinkButton>
  ) : null;

  return (
    <SectionCard title="Care case" aside={action}>
      <CaseSuggestionBanner studentId={studentId} className="mb-3" />
      {!careCase ? (
        <p className="text-[13px] text-muted-foreground">ยังไม่มี case ช่วยเหลือ</p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
            <span className="font-semibold text-foreground">{careCase.caseId}</span>
            {careCase.status === "active" ? (
              <Chip tone="blue">กำลังดูแล</Chip>
            ) : (
              <Chip tone="green">
                ปิดแล้ว
                {careCase.closeReason ? ` · ${CASE_CLOSE_REASON_LABEL[careCase.closeReason]}` : ""}
              </Chip>
            )}
            <span>
              เปิดเมื่อ {formatThaiDate(careCase.openedAt)} โดย{" "}
              {careCase.openedBy ? store.nameOf(careCase.openedBy) : "ระบบ"}
            </span>
            {careCase.closedAt && <span>· ปิดเมื่อ {formatThaiDate(careCase.closedAt)}</span>}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ["เหตุ", careCase.triggers.length],
              ["แผน", careCase.plans.length],
              ["ติดตามผล", careCase.followups.length],
            ].map(([label, n]) => (
              <div key={label} className="rounded-lg bg-surface px-3 py-2">
                <div className="text-lg font-bold">{n}</div>
                <div className="text-[12px] text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
          {unplanned > 0 && (
            <p className="flex items-center gap-2 rounded-lg bg-risk-amber-bg px-3 py-2 text-[12px] font-semibold text-risk-amber">
              <AlertTriangle className="size-4 shrink-0" />
              {unplanned} เหตุยังไม่มีแผน
            </p>
          )}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-[12px] text-muted-foreground">
        <span>ส่งต่อภายนอก {careCase?.referrals.length ?? 0} ครั้ง</span>
        <span>· ความยินยอมปีการศึกษา {store.currentTerm.academicYear}:</span>
        <Chip tone={consent.tone}>{consent.label}</Chip>
      </div>
    </SectionCard>
  );
}
