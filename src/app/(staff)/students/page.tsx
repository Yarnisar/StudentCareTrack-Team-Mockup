"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PagerNumbered, usePagination } from "@/components/shared/pagination";
import { RiskBadge } from "@/components/shared/risk-badge";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { byClassNo, initialOf } from "@/lib/format";
import { DIMENSION_LABEL } from "@/lib/types";

export default function StudentsPage() {
  const store = useStore();
  const anySensitive = store.students.some((s) => store.canSeeSensitive(s.studentId));
  const [pageSize, setPageSize] = useState(10);
  const sorted = useMemo(() => [...store.students].sort(byClassNo), [store.students]);
  const pager = usePagination(sorted, pageSize);

  return (
    <>
      <PageHeader
        title="ข้อมูลนักเรียน"
        subtitle={`นักเรียน ${store.students.length} คน`}
      />

      <div className="flex-1 overflow-y-auto p-8">
        {!anySensitive && (
          <div className="mb-4 rounded-xl border border-border bg-card px-5 py-3 text-[13px] text-muted-foreground">
            คุณเห็นเฉพาะชื่อ ห้อง ความประพฤติ และคุณลักษณะฯ ของนักเรียนกลุ่มนี้
          </div>
        )}

        <Card>
          <CardContent className="divide-y divide-border p-6">
            {pager.slice.map((student) => {
              const sensitive = store.canSeeSensitive(student.studentId);
              const risk = sensitive ? store.overallRiskOf(student.studentId) : null;
              const screening = sensitive ? store.latestScreening(student.studentId) : undefined;
              const flagged = screening?.results
                .filter((r) => r.group === "amber" || r.group === "red")
                .map((r) => DIMENSION_LABEL[r.dimension])
                .join(", ");

              return (
                <Link
                  key={student.studentId}
                  href={`/students/${student.studentId}`}
                  className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-[13px] font-bold text-muted-foreground">
                    {initialOf(student.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold">{student.fullName}</div>
                    <div className="truncate text-[12px] text-muted-foreground">
                      {student.roomName} เลขที่ {student.classNo}
                      {sensitive ? ` · เลขประจำตัว ${student.studentId}` : ""}
                      {flagged ? ` · ${flagged}` : ""}
                    </div>
                  </div>
                  {!sensitive ? null : risk ? (
                    <RiskBadge group={risk} />
                  ) : (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[12px] font-semibold text-muted-foreground">
                      ยังไม่คัดกรอง
                    </span>
                  )}
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              );
            })}
          </CardContent>
        </Card>

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
      </div>
    </>
  );
}
