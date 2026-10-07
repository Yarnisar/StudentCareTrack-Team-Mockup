"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PagerNumbered, usePagination } from "@/components/shared/pagination";
import { RiskBadge } from "@/components/shared/risk-badge";
import { WindowNotice } from "@/components/shared/window-notice";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { byClassNo, formatThaiDate, initialOf } from "@/lib/format";
import { overallRisk } from "@/lib/rules";
import { DIMENSION_LABEL, SCREENING_STATUS_LABEL } from "@/lib/types";

export default function ScreeningListPage() {
  const store = useStore();
  const students = store.students.filter((s) => store.canSeeSensitive(s.studentId)).sort(byClassNo);
  const certified = students.filter((s) => store.screeningOf(s.studentId)?.status === "certified").length;
  const [pageSize, setPageSize] = useState(10);
  const pager = usePagination(students, pageSize);

  return (
    <>
      <PageHeader
        title="การคัดกรองนักเรียน"
        subtitle={`คัดกรอง 6 มิติ · ${store.currentTerm.label}`}
      />

      <div className="flex-1 overflow-y-auto p-8">
        <WindowNotice activity="screening" className="mb-4" />

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="mb-1 text-[15px] font-bold">รายชื่อนักเรียนในห้องที่รับผิดชอบ</h2>
                <p className="text-xs text-muted-foreground">
                  ภาคเรียนละ 1 ครั้ง · ส่งแล้วเมื่อครูประจำชั้นรับรอง
                </p>
              </div>
              <div className="text-[13px] font-semibold text-primary">
                ส่งแล้ว {certified} / {students.length} คน
              </div>
            </div>

            {students.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                ไม่มีนักเรียนที่คุณมีสิทธิ์ดูข้อมูลการคัดกรอง
              </p>
            )}

            <div className="divide-y divide-border">
              {pager.slice.map((student) => {
                const screening = store.screeningOf(student.studentId);
                const blocked = store.screeningEditBlockReason(student.studentId);
                const risk = screening ? overallRisk(screening.results.map((r) => r.group)) : null;
                const flagged = screening?.results
                  .filter((r) => r.group === "amber" || r.group === "red")
                  .map((r) => DIMENSION_LABEL[r.dimension])
                  .join(", ");
                const href = screening
                  ? blocked
                    ? `/screening/${student.studentId}/result`
                    : `/screening/${student.studentId}`
                  : `/screening/${student.studentId}`;

                return (
                  <div key={student.studentId} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {initialOf(student.fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{student.fullName}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {student.roomName} เลขที่ {student.classNo}
                        {screening
                          ? ` · บันทึก ${formatThaiDate(screening.screenedAt)}${flagged ? ` · พบ: ${flagged}` : ""}`
                          : " · ยังไม่คัดกรองภาคเรียนนี้"}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {screening && (
                        <span
                          className={
                            screening.status === "certified"
                              ? "rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary"
                              : "rounded-full border border-dashed border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground"
                          }
                        >
                          {SCREENING_STATUS_LABEL[screening.status]}
                        </span>
                      )}
                      {risk ? (
                        <RiskBadge group={risk} />
                      ) : (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                          รอคัดกรอง
                        </span>
                      )}
                    </div>
                    {screening ? (
                      <LinkButton size="sm" variant="outline" href={href}>
                        {blocked ? (store.isScreeningLocked(screening) ? "ดู (ล็อกแล้ว)" : "ดูผล") : "แก้ไข"}
                      </LinkButton>
                    ) : (
                      <LinkButton size="sm" href={href} variant={blocked ? "outline" : "default"}>
                        {blocked ? "ดู" : "เริ่มคัดกรอง"}
                      </LinkButton>
                    )}
                  </div>
                );
              })}
            </div>

            <PagerNumbered
              page={pager.page}
              totalPages={pager.totalPages}
              setPage={pager.setPage}
              from={pager.from}
              to={pager.to}
              total={pager.total}
              pageSize={pageSize}
              onPageSize={(n) => {
                setPageSize(n);
                pager.reset();
              }}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
