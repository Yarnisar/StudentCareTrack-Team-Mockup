"use client";

import { colorResults } from "@/lib/screening-view";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { RiskBadge } from "@/components/shared/risk-badge";
import { Card, CardContent } from "@/components/ui/card";
import { CLASS_SIZE, otherStudents, students as homeroomStudents } from "@/lib/mock-data";
import { ROLE_INFO, studentViewLevel } from "@/lib/roles";
import { useStore } from "@/lib/store";
import { DIMENSION_LABEL } from "@/lib/types";
import { StudentId } from "@/components/shared/student-id";

export default function StudentsPage() {
  const store = useStore();
  // ห้องที่ดูได้ตามการมอบหมาย: ครูประจำชั้นเห็นห้องตนเต็ม และห้องที่สอนแบบจำกัด ครูผู้สอนเห็นห้องที่สอนแบบจำกัด
  const list = [...homeroomStudents, ...otherStudents].filter((s) => studentViewLevel(store.role, s.roomName) !== "none");
  const isHomeroom = store.role === "homeroom";

  return (
    <>
      <PageHeader
        title="ข้อมูลนักเรียน"
        subtitle={isHomeroom ? `${ROLE_INFO.homeroom.user.title} · แสดง ${store.students.length} จาก ${CLASS_SIZE} คน` : `${ROLE_INFO[store.role].user.title} · ${list.length} คน`}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="mb-4 rounded-xl border border-border bg-card px-5 py-3 text-[13px] text-muted-foreground">
          ข้อมูลพื้นฐานของนักเรียนอ้างอิงจากงานทะเบียนนักเรียนของโรงเรียน — ระบบนี้อ่านอย่างเดียว
          ไม่มีการเพิ่มหรือแก้ไขข้อมูลทะเบียน
        </div>

        <Card>
          <CardContent className="divide-y divide-border p-6">
            {list.map((student) => {
              const full = studentViewLevel(store.role, student.roomName) === "full";
              const risk = full ? store.overallRiskOf(student.studentId) : null;
              const screening = full ? store.latestScreening(student.studentId) : undefined;
              const flagged = (screening ? colorResults(screening.results) : [])
                .filter((r) => r.group !== "green")
                .map((r) => DIMENSION_LABEL[r.dimension])
                .join(", ");

              return (
                <Link
                  key={student.studentId}
                  href={`/students/${student.studentId}`}
                  className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/40"
                >
                  <StudentId id={student.studentId} className="w-14 text-sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{student.fullName}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {student.roomName} เลขที่ {student.classNo}
                      {flagged ? ` · มิติที่พบ: ${flagged}` : ""}
                    </div>
                  </div>
                  {full &&
                    (risk ? (
                      <RiskBadge group={risk} />
                    ) : (
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                        ยังไม่คัดกรอง
                      </span>
                    ))}
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
