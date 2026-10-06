"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { RiskBadge } from "@/components/shared/risk-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BehaviorCard } from "@/components/student/behavior-card";
import { CaseCard } from "@/components/student/case-card";
import { DcCard } from "@/components/student/dc-card";
import { HomeVisitCard } from "@/components/student/home-visit-card";
import { OwnRecordsCard } from "@/components/student/own-records-card";
import { ScreeningCard } from "@/components/student/screening-card";
import { SdqCard } from "@/components/student/sdq-card";
import { useSensitiveView, useStore } from "@/lib/store";
import { CURRENT_TERM } from "@/lib/mock-data";
import { formatThaiDate } from "@/lib/format";

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const store = useStore();
  const student = store.getStudent(studentId);

  // ผู้ดูแลระบบเปิดข้อมูลรายคน → VIEW_SENSITIVE (ข้ามเองถ้าไม่ใช่แอดมิน)
  useSensitiveView("students", student ? studentId : null, { note: "เปิดหน้าข้อมูลนักเรียนรายคน" });

  if (!student) return <p className="p-8 text-sm text-muted-foreground">ไม่พบข้อมูลนักเรียน</p>;

  // ครูทั่วไปเห็นเฉพาะ ชื่อ ห้อง ความประพฤติ และคุณลักษณะอันพึงประสงค์
  const sensitive = store.canSeeSensitive(studentId);
  const previousHomeroom = store.isPreviousHomeroomOf(studentId);
  const risk = store.overallRiskOf(studentId);
  const screening = store.latestCertifiedScreening(studentId);
  const guardians = store.guardiansOf(studentId);

  const info: [string, string][] = sensitive
    ? [
        ["เลขประจำตัวนักเรียน", student.studentId],
        ["เลขบัตรประชาชน", student.citizenId],
        ["ชั้น / ห้อง", `${student.roomName} เลขที่ ${student.classNo}`],
        [
          "ผู้ปกครอง",
          guardians.map((g) => `${g.user.name} (${g.relation})`).join(", ") || "-",
        ],
        [
          "เบอร์ติดต่อ",
          guardians
            .map((g) => g.user.phone)
            .filter(Boolean)
            .join(", ") || "-",
        ],
        ["ที่อยู่", student.address],
      ]
    : [["ชั้น / ห้อง", `${student.roomName} เลขที่ ${student.classNo}`]];

  return (
    <>
      <PageHeader title="ข้อมูลนักเรียนรายบุคคล" subtitle={CURRENT_TERM.label} />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/students"
            className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" /> กลับไปรายชื่อนักเรียน
          </Link>
          {sensitive && (
            <Button variant="outline" size="sm">
              <Download className="size-4" /> ส่งออกรายงานรายบุคคล
            </Button>
          )}
        </div>

        <Card className="mb-5">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex size-16 items-center justify-center rounded-xl bg-muted text-xl font-bold text-muted-foreground">
              {student.fullName.replace(/^(ด\.ช\.|ด\.ญ\.)\s*/, "").charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold">{student.fullName}</h2>
                {sensitive && risk && <RiskBadge group={risk} />}
              </div>
              <p className="mt-1 text-[13.5px] text-muted-foreground">
                {student.roomName} เลขที่ {student.classNo}
                {sensitive ? ` · เลขประจำตัว ${student.studentId}` : ""}
                {sensitive && screening ? ` · คัดกรอง (รับรองแล้ว) ล่าสุด ${formatThaiDate(screening.screenedAt)}` : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[1fr_1.45fr]">
          <Card className="self-start">
            <CardContent className="p-6">
              <h3 className="text-[15.5px] font-bold">ข้อมูลพื้นฐาน</h3>
              <p className="mt-1 mb-3 text-[11.5px] text-muted-foreground">
                อ้างอิงจากงานทะเบียนนักเรียนของโรงเรียน — อ่านอย่างเดียว
                {!sensitive && " · ข้อมูลอื่นเปิดให้เฉพาะครูประจำชั้นของห้องนี้และแอดมิน"}
              </p>
              <dl className="divide-y divide-border">
                {info.map(([label, value]) => (
                  <div key={label} className="flex gap-3 py-2.5">
                    <dt className="w-36 shrink-0 text-[13px] text-muted-foreground">{label}</dt>
                    <dd className="flex-1 text-[13.5px] font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <div className="space-y-5">
            {previousHomeroom && <OwnRecordsCard studentId={studentId} />}

            {sensitive && (
              <>
                <CaseCard studentId={studentId} />
                <ScreeningCard studentId={studentId} />
                <SdqCard studentId={studentId} />
              </>
            )}
            <BehaviorCard studentId={studentId} />
            <DcCard studentId={studentId} />
            {sensitive && <HomeVisitCard studentId={studentId} />}
          </div>
        </div>
      </div>
    </>
  );
}
