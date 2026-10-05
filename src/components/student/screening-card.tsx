"use client";

import Link from "next/link";
import { RiskBadge } from "@/components/shared/risk-badge";
import { LinkButton } from "@/components/ui/link-button";
import { formatThaiDate } from "@/lib/format";
import { SCREENING_ITEMS, screeningItemLabel } from "@/lib/rules";
import { useStore } from "@/lib/store";
import { DIMENSION_LABEL, DIMENSION_RESULT_LABEL, SCREENING_STATUS_LABEL } from "@/lib/types";
import { Chip, SectionCard, termLabelOf } from "./section-card";

/** ผลคัดกรอง 6 มิติ (ข้อมูลอ่อนไหว — ผู้เรียกต้องตรวจ canSeeSensitive ก่อน) */
export function ScreeningCard({ studentId }: { studentId: string }) {
  const store = useStore();
  const screening = store.latestScreening(studentId);
  const current = store.screeningOf(studentId);
  const editBlock = store.screeningEditBlockReason(studentId);
  const lateAlertThreshold = store.schoolSettings.lateAlertThreshold;

  const action =
    editBlock === null ? (
      <LinkButton variant="outline" size="sm" href={`/screening/${studentId}`}>
        {current ? "แก้ไข" : "คัดกรอง"}
      </LinkButton>
    ) : current ? (
      <LinkButton variant="outline" size="sm" href={`/screening/${studentId}`} title={editBlock}>
        ดู
      </LinkButton>
    ) : null;

  return (
    <SectionCard title="ผลการคัดกรอง 6 มิติ" aside={action}>
      {!screening ? (
        <p className="py-2 text-sm text-muted-foreground">ยังไม่มีข้อมูลการคัดกรอง</p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
            <Chip tone={screening.status === "certified" ? "green" : "amber"}>
              {SCREENING_STATUS_LABEL[screening.status]}
            </Chip>
            {screening.termId !== store.currentTerm.termId && <span>{termLabelOf(screening.termId)}</span>}
            <span>บันทึก {formatThaiDate(screening.screenedAt)} โดย {store.nameOf(screening.screenedBy)}</span>
            {screening.certifiedBy && screening.certifiedAt && (
              <span>
                · รับรองโดย {store.nameOf(screening.certifiedBy)} {formatThaiDate(screening.certifiedAt)}
              </span>
            )}
          </div>
          {editBlock && current && <p className="mb-3 text-[11.5px] text-muted-foreground">{editBlock}</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            {screening.results.map((r) => {
              const derived = SCREENING_ITEMS.filter((i) => r.derivedItemIds.includes(i.id));
              return (
                <div key={r.dimension} className="rounded-lg bg-surface px-3.5 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13.5px] font-medium">{DIMENSION_LABEL[r.dimension]}</span>
                    <RiskBadge group={r.group} />
                  </div>
                  {r.teacherGroup && (
                    <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
                      ระบบคำนวณ {DIMENSION_RESULT_LABEL[r.computedGroup]} → ครูปรับเป็น{" "}
                      {DIMENSION_RESULT_LABEL[r.teacherGroup]}
                      {r.adjustReason ? ` · เหตุผล: ${r.adjustReason}` : ""}
                    </p>
                  )}
                  {derived.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {derived.map((i) => (
                        <span
                          key={i.id}
                          className="rounded bg-accent px-1.5 py-0.5 text-[10.5px] font-semibold text-primary"
                          title={screeningItemLabel(i, { lateAlertThreshold })}
                        >
                          ระบบกำหนด · {screeningItemLabel(i, { lateAlertThreshold })}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {current && (
            <Link
              href={`/screening/${studentId}/result`}
              className="mt-3 inline-block text-[12.5px] font-semibold text-primary hover:underline"
            >
              ดูผลการคัดกรองและการรับรอง →
            </Link>
          )}
        </>
      )}
    </SectionCard>
  );
}
