"use client";

import { DcLevelChip } from "@/components/characteristics/dc-level";
import { passesAllCriteria } from "@/lib/dc-rules";
import { formatThaiDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { DC_LEVEL_LABEL } from "@/lib/types";
import { Chip, SectionCard, termLabelOf } from "./section-card";

/** คุณลักษณะอันพึงประสงค์ (ปพ.6) — ครูทุกคนเห็นได้; รายการเอกสาร ปพ. เฉพาะผู้เห็นข้อมูลอ่อนไหว */
export function DcCard({ studentId }: { studentId: string }) {
  const store = useStore();
  const dc = store.dcSummaryOf(studentId);
  const sensitive = store.canSeeSensitive(studentId);
  const documents = sensitive ? store.documentsOfStudent(studentId) : [];
  const levels = dc ? store.dcCriteria.map((c) => dc.levels[c.criteriaId]) : [];
  const passes = passesAllCriteria(levels);

  return (
    <SectionCard
      title="คุณลักษณะอันพึงประสงค์ (ปพ.6)"
      aside={dc && <Chip tone={passes ? "green" : "amber"}>{passes ? "ผ่านทุกด้าน" : "ยังไม่ผ่านทุกด้าน"}</Chip>}
      note={
        dc ? (
          <>
            {termLabelOf(dc.termId)}
            {dc.termId !== store.currentTerm.termId && " (ภาคเรียนนี้ยังไม่สรุป)"}
            {dc.summarizedAt &&
              ` · สรุปเมื่อ ${formatThaiDate(dc.summarizedAt)}${dc.summarizedBy ? ` โดย ${store.nameOf(dc.summarizedBy)}` : ""}`}
          </>
        ) : undefined
      }
    >
      {!dc ? (
        <p className="text-[13px] text-muted-foreground">ยังไม่มีการสรุปผลคุณลักษณะ</p>
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            {store.dcCriteria.map((c) => {
              const level = dc.levels[c.criteriaId];
              return (
                <div key={c.criteriaId} className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3.5 py-2">
                  <span className="text-[13px]">{c.name}</span>
                  <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    {level == null ? "รอประเมิน" : DC_LEVEL_LABEL[level]}
                    <DcLevelChip level={level} />
                  </span>
                </div>
              );
            })}
          </div>
          {dc.missingSubjects.length > 0 && (
            <p className="mt-3 text-[12px] text-risk-amber">
              สรุปขณะที่ยังไม่ได้รับคะแนนจาก: {dc.missingSubjects.join(", ")}
            </p>
          )}
        </>
      )}
      {documents.length > 0 && (
        <div className="mt-3 border-t border-border pt-3 text-[12px]">
          <div className="mb-1 font-semibold">เอกสารที่ออกแล้ว</div>
          {documents.map((d) => (
            <div key={d.docId} className="text-muted-foreground">
              {d.docType} · {termLabelOf(d.termId)} · ออกเมื่อ {formatThaiDate(d.generatedAt)} โดย {store.nameOf(d.generatedBy)}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
