"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { RiskBadge } from "@/components/shared/risk-badge";
import { Card, CardContent } from "@/components/ui/card";
import { CLASS_SIZE, CURRENT_TEACHER } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { initialOf } from "@/lib/format";
import { DIMENSION_LABEL } from "@/lib/types";

export default function StudentsPage() {
  const store = useStore();

  return (
    <>
      <PageHeader
        title="ข้อมูลนักเรียน"
        subtitle={`${CURRENT_TEACHER.role} · แสดง ${store.students.length} จาก ${CLASS_SIZE} คน`}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="mb-4 rounded-xl border border-border bg-card px-5 py-3 text-[13px] text-muted-foreground">
          ข้อมูลพื้นฐานของนักเรียนอ้างอิงจากงานทะเบียนนักเรียนของโรงเรียน — ระบบนี้อ่านอย่างเดียว
          ไม่มีการเพิ่มหรือแก้ไขข้อมูลทะเบียน
        </div>

        <Card>
          <CardContent className="divide-y divide-border p-6">
            {store.students.map((student) => {
              const risk = store.overallRiskOf(student.studentId);
              const screening = store.latestScreening(student.studentId);
              const flagged = screening?.results
                .filter((r) => r.group !== "green")
                .map((r) => DIMENSION_LABEL[r.dimension])
                .join(", ");

              return (
                <Link
                  key={student.studentId}
                  href={`/students/${student.studentId}`}
                  className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                    {initialOf(student.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{student.fullName}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {student.roomName} เลขที่ {student.classNo} · เลขประจำตัว {student.studentId}
                      {flagged ? ` · มิติที่พบ: ${flagged}` : ""}
                    </div>
                  </div>
                  {risk ? (
                    <RiskBadge group={risk} />
                  ) : (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                      ยังไม่คัดกรอง
                    </span>
                  )}
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
