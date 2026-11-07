"use client";

import { PageHeader } from "@/components/layout/page-header";
import { RiskBadge } from "@/components/shared/risk-badge";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { CURRENT_TERM } from "@/lib/mock-data";
import { draftKey, useStore } from "@/lib/store";
import { formatThaiDate } from "@/lib/format";
import { DIMENSION_LABEL } from "@/lib/types";
import { StudentId } from "@/components/shared/student-id";

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
                    <StudentId id={student.studentId} className="w-14 text-sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{student.fullName}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {student.roomName} เลขที่ {student.classNo}
                        {screening
                          ? ` · คัดกรองล่าสุด ${formatThaiDate(screening.screenedAt)}${flagged ? ` · พบ: ${flagged}` : ""}`
                          : " · ยังไม่เคยคัดกรอง"}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {store.screeningWatch[student.studentId] && (
                        <span
                          title={`ไม่เปิด case: ${store.screeningWatch[student.studentId].reason}`}
                          className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold"
                        >
                          เฝ้าดูผลคัดกรอง
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
