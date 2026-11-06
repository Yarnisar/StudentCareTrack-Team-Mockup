"use client";

import { PageHeader } from "@/components/layout/page-header";
import { RiskBadge } from "@/components/shared/risk-badge";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { CURRENT_TERM } from "@/lib/mock-data";
import { draftKey, useStore } from "@/lib/store";
import { formatThaiDate, initialOf } from "@/lib/format";
import { DIMENSION_LABEL } from "@/lib/types";

export default function ScreeningListPage() {
  const store = useStore();

  return (
    <>
      <PageHeader
        title="การคัดกรองนักเรียน"
        subtitle={`ประเมินความเสี่ยง 6 มิติ ตามแนวทาง HERO OBEC CARE · ${CURRENT_TERM.label}`}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-1 text-[15.5px] font-bold">รายชื่อนักเรียนในห้องที่รับผิดชอบ</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              เลือกนักเรียนเพื่อเริ่มคัดกรอง หรือคัดกรองซ้ำในรอบภาคเรียนปัจจุบัน
            </p>

            <div className="divide-y divide-border">
              {store.students.map((student) => {
                const screening = store.latestScreening(student.studentId);
                const risk = store.overallRiskOf(student.studentId);
                const hasDraft = store.getDraft(draftKey("screening", student.studentId)) !== undefined;
                const flagged = screening?.results
                  .filter((r) => r.group !== "green")
                  .map((r) => DIMENSION_LABEL[r.dimension])
                  .join(", ");

                return (
                  <div key={student.studentId} className="flex items-center gap-3 py-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {initialOf(student.fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{student.fullName}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {student.roomName} เลขที่ {student.classNo}
                        {screening
                          ? ` · คัดกรองล่าสุด ${formatThaiDate(screening.screenedAt)}${flagged ? ` · พบ: ${flagged}` : ""}`
                          : " · ยังไม่เคยคัดกรอง"}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {risk ? (
                        <RiskBadge group={risk} />
                      ) : (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                          รอคัดกรอง
                        </span>
                      )}
                    </div>
                    <LinkButton
                      size="sm"
                      variant={screening && !hasDraft ? "outline" : "default"}
                      href={`/screening/${student.studentId}`}
                    >
                      {hasDraft ? "ทำต่อ" : screening ? "คัดกรองใหม่" : "เริ่มคัดกรอง"}
                    </LinkButton>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
