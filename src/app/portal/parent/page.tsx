"use client";

import Link from "next/link";
import { ChevronRight, ClipboardList, Home } from "lucide-react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { dcSummaries } from "@/lib/store";
import { formatThaiDate, formatThaiTime } from "@/lib/format";
import { SDQ_LEVEL_LABEL } from "@/lib/types";

const DEMO_STUDENT_ID = "30125";

export default function ParentHomePage() {
  const store = useStore();
  const student = store.getStudent(DEMO_STUDENT_ID);
  const appointment = store.appointments.find(
    (a) => a.studentId === DEMO_STUDENT_ID && a.status !== "completed"
  );
  const parentSdq = store
    .sdqOf(DEMO_STUDENT_ID)
    .find((s) => s.rater === "parent" && s.round === 1);
  const teacherSdq = store
    .sdqOf(DEMO_STUDENT_ID)
    .find((s) => s.rater === "teacher" && s.round === 1);
  const dc = dcSummaries.find((d) => d.studentId === DEMO_STUDENT_ID);
  const dcLevels: number[] = dc
    ? Object.values(dc.levels).flatMap((l) => (l == null ? [] : [l as number]))
    : [];
  const dcLabel =
    dcLevels.length === 0
      ? "รอประเมิน"
      : dcLevels.reduce((a, b) => a + b, 0) / dcLevels.length >= 2.5
        ? "ระดับดีเยี่ยม"
        : "ระดับดี";

  if (!student) return null;

  return (
    <MobileShell
      title={`สวัสดี ${student.guardianName.replace("นางสาว", "คุณ").replace("นาง", "คุณ")}`}
      subtitle={`ผู้ปกครองของ ${student.fullName}`}
      role="parent"
      brand
    >
      <div className="space-y-4 p-5">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-base font-bold text-muted-foreground">
              {student.fullName.replace(/^(ด\.ช\.|ด\.ญ\.)\s*/, "").charAt(0)}
            </div>
            <div>
              <div className="text-[15.5px] font-bold">{student.fullName}</div>
              <div className="mt-0.5 text-[12.5px] text-muted-foreground">
                {student.roomName} เลขที่ {student.classNo}
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="pt-1 text-sm font-bold">สิ่งที่ต้องดำเนินการ</h2>

        {appointment && appointment.status === "pending" && (
          <ActionCard
            href="/portal/parent/appointment"
            tone="warn"
            icon={<Home className="size-5 text-risk-amber" />}
            title="นัดหมายเยี่ยมบ้าน รอการยืนยัน"
            description={`${appointment.teacherName} ขอนัดเยี่ยมบ้านวันที่ ${formatThaiDate(appointment.proposedDate)} เวลา ${formatThaiTime(appointment.proposedDate)}`}
            cta="ดูรายละเอียดและยืนยัน"
          />
        )}

        {appointment && appointment.status === "confirmed" && (
          <ActionCard
            href="/portal/parent/appointment"
            tone="info"
            icon={<Home className="size-5 text-primary" />}
            title="ยืนยันนัดหมายเยี่ยมบ้านแล้ว"
            description={`นัดหมายวันที่ ${formatThaiDate(appointment.proposedDate)} เวลา ${formatThaiTime(appointment.proposedDate)} · เพิ่มข้อมูลประกอบได้`}
            cta="ดูรายละเอียดนัดหมาย"
          />
        )}

        {parentSdq?.status === "pending" && (
          <ActionCard
            href="/portal/parent/results"
            tone="info"
            icon={<ClipboardList className="size-5 text-primary" />}
            title="แบบประเมิน SDQ ฉบับผู้ปกครอง"
            description="กรุณาทำแบบประเมินเพื่อให้ครูเห็นภาพรวมของบุตรหลานได้ครบถ้วน (ใช้เวลาประมาณ 10 นาที)"
            cta="ดูรายละเอียด"
          />
        )}

        <h2 className="pt-1 text-sm font-bold">ภาพรวมของบุตรหลาน</h2>

        <Link href="/portal/parent/results">
          <Card>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[13.5px] font-semibold text-muted-foreground">
                  ผลการประเมินล่าสุด
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
              <div className="flex gap-2.5">
                <div className="flex-1 rounded-xl bg-surface p-3">
                  <div className="text-[11.5px] text-muted-foreground">SDQ (ครูประเมิน)</div>
                  <div className="mt-1.5">
                    {teacherSdq?.level ? (
                      <span
                        className={
                          teacherSdq.level === "normal"
                            ? "rounded-full bg-risk-green-bg px-2.5 py-1 text-[11.5px] font-semibold text-risk-green"
                            : "rounded-full bg-risk-amber-bg px-2.5 py-1 text-[11.5px] font-semibold text-risk-amber"
                        }
                      >
                        {SDQ_LEVEL_LABEL[teacherSdq.level]}
                      </span>
                    ) : (
                      <span className="text-[12.5px] text-muted-foreground">รอผล</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 rounded-xl bg-surface p-3">
                  <div className="text-[11.5px] text-muted-foreground">คุณลักษณะฯ</div>
                  <div className="mt-1.5">
                    <span className="rounded-full bg-risk-green-bg px-2.5 py-1 text-[11.5px] font-semibold text-risk-green">
                      {dcLabel}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <p className="rounded-xl border border-dashed border-border bg-surface p-3.5 text-[12px] leading-relaxed text-muted-foreground">
          ผู้ปกครองสามารถดูข้อมูลของบุตรหลานตนเองได้เท่านั้น
          การแก้ไขข้อมูลทั้งหมดดำเนินการโดยครูประจำชั้น
        </p>
      </div>
    </MobileShell>
  );
}

function ActionCard({
  href,
  tone,
  icon,
  title,
  description,
  cta,
}: {
  href: string;
  tone: "warn" | "info";
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
}) {
  const styles =
    tone === "warn"
      ? "border-amber-200 bg-risk-amber-bg"
      : "border-blue-200 bg-accent";
  const ctaColor = tone === "warn" ? "text-risk-amber" : "text-primary";

  return (
    <Link href={href} className={`block rounded-2xl border p-4 ${styles}`}>
      <div className="flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white">
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-[14.5px] font-bold">{title}</div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>
          <div className={`mt-2.5 text-[13px] font-bold ${ctaColor}`}>{cta} →</div>
        </div>
      </div>
    </Link>
  );
}
