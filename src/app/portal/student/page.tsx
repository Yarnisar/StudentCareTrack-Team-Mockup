"use client";

import Link from "next/link";
import { ChevronRight, ClipboardList, QrCode } from "lucide-react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { HelpBlock } from "@/components/portal/help-block";
import { Card, CardContent } from "@/components/ui/card";
import { formatThaiDate } from "@/lib/format";
import { usePortalStudent } from "@/lib/portal";
import { isPrimaryGrade } from "@/lib/rules";
import { useStore } from "@/lib/store";

export default function StudentHomePage() {
  const store = useStore();
  const studentId = usePortalStudent().studentId ?? "";
  const student = store.getStudent(studentId);
  if (!student) return null;

  const sdq = isPrimaryGrade(student.gradeLevel) ? undefined : store.sdqFormFor(studentId, "student");
  const canTakeSdq = sdq?.status === "pending" && store.sdqBlockReason(studentId, "student") === null;

  return (
    <MobileShell
      title={`สวัสดี ${student.fullName.replace(/^(ด\.ช\.|ด\.ญ\.|นาย|นางสาว)\s*/, "").split(" ")[0]}`}
      subtitle={`${student.roomName} เลขที่ ${student.classNo}`}
      role="student"
      brand
    >
      <div className="space-y-4 p-5">
        {canTakeSdq && (
          <Link href="/portal/student/sdq" className="block rounded-2xl border border-blue-200 bg-card p-4">
            <div className="flex gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent">
                <ClipboardList className="size-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-[14.5px] font-bold">แบบประเมิน SDQ ฉบับนักเรียน</div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  ครูขอให้ช่วยตอบแบบประเมินตนเอง 25 ข้อ (ประมาณ 10 นาที)
                </p>
                <div className="mt-2 text-[13px] font-bold text-primary">เริ่มทำแบบประเมิน →</div>
              </div>
            </div>
          </Link>
        )}
        {sdq?.status === "submitted" && sdq.submittedAt && (
          <p className="rounded-xl bg-card px-4 py-3 text-[12.5px] text-muted-foreground">
            แบบประเมิน SDQ: <b className="text-foreground">ส่งแล้ว</b> เมื่อ {formatThaiDate(sdq.submittedAt)}
          </p>
        )}

        <Link href="/portal/student/card">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <QrCode className="size-6 text-primary" />
              <span className="flex-1 text-[14px] font-semibold">บัตรนักเรียนสำหรับเช็คอิน</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <HelpBlock />
      </div>
    </MobileShell>
  );
}
