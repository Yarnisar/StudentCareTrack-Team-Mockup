"use client";

import Link from "next/link";
import { ChevronRight, ClipboardList, FileSignature, Home } from "lucide-react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { usePortalStudent } from "@/lib/portal";
import { ChildSwitcher } from "@/components/portal/child-switcher";
import { ConsentCard } from "@/components/portal/consent-card";
import { openAppointmentOf } from "@/components/portal/portal-data";
import { SdqLevelBadge } from "@/components/assessment/sdq-result";
import { passesAllCriteria } from "@/lib/dc-rules";
import { formatThaiDate, formatThaiTime } from "@/lib/format";
import { combinedSdqBasisLabel } from "@/lib/rules";
import { termLabelOf } from "@/lib/terms";
import { APPOINTMENT_STATUS_LABEL, BEHAVIOR_SCORE_BASE, VISIT_TYPE_LABEL } from "@/lib/types";


export default function ParentHomePage() {
  const store = useStore();
  const portalStudentId = usePortalStudent().studentId ?? "";
  const student = store.getStudent(portalStudentId);
  const appointment = openAppointmentOf(store, portalStudentId);
  const parentSdq = store.sdqFormFor(portalStudentId, "parent");
  const canTakeSdq = parentSdq?.status === "pending" && store.sdqBlockReason(portalStudentId, "parent") === null;
  const sdq = store.latestCombinedSdqOf(portalStudentId);
  const dc = store.dcSummaryOf(portalStudentId);
  const dcLevels = dc ? store.dcCriteria.map((c) => dc.levels[c.criteriaId]) : [];
  const dcFailed = dcLevels.filter((l) => l != null && l < 1).length;
  const behaviorScore = store.behaviorScoreOf(portalStudentId);
  const answeredConsent = Boolean(store.consentOf(portalStudentId));
  const pendingSignatures = store.myPendingSignatures;
  const guardian =
    store.currentUser.role === "parent" ? store.currentUser : store.guardiansOf(portalStudentId)[0]?.user;

  if (!student) return null;

  return (
    <MobileShell
      title={`สวัสดี ${(guardian?.name ?? "ผู้ปกครอง").replace("นางสาว", "คุณ").replace("นาง", "คุณ")}`}
      subtitle={`ผู้ปกครองของ ${student.fullName}`}
      role="parent"
      brand
    >
      <div className="space-y-4 p-5">
        <ChildSwitcher />
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-base font-bold text-muted-foreground">
              {student.fullName.replace(/^(ด\.ช\.|ด\.ญ\.)\s*/, "").charAt(0)}
            </div>
            <div>
              <div className="text-[15px] font-bold">{student.fullName}</div>
              <div className="mt-0.5 text-[12px] text-muted-foreground">
                {student.roomName} เลขที่ {student.classNo}
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="pt-1 text-[15px] font-bold">ต้องทำ</h2>

        {appointment && appointment.status === "pending" && (
          <ActionCard
            href="/portal/parent/appointment"
            tone="warn"
            icon={<Home className="size-5 text-risk-amber" />}
            title={`${VISIT_TYPE_LABEL[appointment.visitType]} รอการยืนยัน`}
            description={`${formatThaiDate(appointment.proposedDate)} เวลา ${formatThaiTime(appointment.proposedDate)}`}
            cta="ยืนยันนัดหมาย"
          />
        )}

        {appointment && appointment.status !== "pending" && (
          <ActionCard
            href="/portal/parent/appointment"
            tone="info"
            icon={<Home className="size-5 text-primary" />}
            title={`${VISIT_TYPE_LABEL[appointment.visitType]} · ${APPOINTMENT_STATUS_LABEL[appointment.status]}`}
            description={`${formatThaiDate(appointment.proposedDate)} เวลา ${formatThaiTime(appointment.proposedDate)}`}
            cta="ดูนัดหมาย"
          />
        )}

        {canTakeSdq && (
          <ActionCard
            href="/portal/parent/results"
            tone="info"
            icon={<ClipboardList className="size-5 text-primary" />}
            title="แบบประเมิน SDQ ฉบับผู้ปกครอง"
            description="ใช้เวลาประมาณ 10 นาที ผู้ปกครองคนใดทำก็ได้"
            cta="ทำแบบประเมิน"
          />
        )}

        {pendingSignatures.length > 0 && (
          <ActionCard
            href="/portal/parent/referrals"
            tone="warn"
            icon={<FileSignature className="size-5 text-risk-amber" />}
            title={`เอกสารส่งต่อรอลงนาม ${pendingSignatures.length} ฉบับ`}
            description="ตรวจเนื้อหาก่อนส่งหน่วยงานภายนอก"
            cta="ตรวจและลงนาม"
          />
        )}

        {!answeredConsent && <ConsentCard studentId={portalStudentId} />}

        {!appointment && !canTakeSdq && answeredConsent && pendingSignatures.length === 0 && (
          <p className="rounded-xl bg-card px-4 py-3 text-[12px] text-muted-foreground">ไม่มีรายการค้าง</p>
        )}

        <h2 className="pt-1 text-[15px] font-bold">ภาพรวม</h2>

        <Link href="/portal/parent/results">
          <Card>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-muted-foreground">ผลล่าสุด</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-xl bg-surface p-3">
                  <div className="text-[12px] text-muted-foreground">SDQ</div>
                  <div className="mt-1.5">
                    {sdq?.level ? (
                      <SdqLevelBadge level={sdq.level} className="text-[12px]" />
                    ) : (
                      <span className="text-[12px] text-muted-foreground">ยังไม่มีผล</span>
                    )}
                  </div>
                  {sdq && <div className="mt-1 text-[11px] text-muted-foreground">{combinedSdqBasisLabel(sdq)}</div>}
                </div>
                <div className="rounded-xl bg-surface p-3">
                  <div className="text-[12px] text-muted-foreground">คุณลักษณะฯ</div>
                  <div className="mt-1.5 text-[13px] font-semibold">
                    {!dc ? (
                      <span className="font-normal text-muted-foreground">รอสรุปผล</span>
                    ) : passesAllCriteria(dcLevels) ? (
                      <span className="text-risk-green">ผ่านทุกด้าน</span>
                    ) : (
                      <span className="text-risk-amber">ไม่ผ่าน {dcFailed} ด้าน</span>
                    )}
                  </div>
                  {dc && <div className="mt-1 text-[11px] text-muted-foreground">{termLabelOf(dc.termId)}</div>}
                </div>
                <div className="rounded-xl bg-surface p-3">
                  <div className="text-[12px] text-muted-foreground">ความประพฤติ</div>
                  <div className="mt-1.5 text-[15px] font-bold">
                    {behaviorScore}
                    <span className="text-[11px] font-normal text-muted-foreground">/{BEHAVIOR_SCORE_BASE}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {answeredConsent && <ConsentCard studentId={portalStudentId} />}

        <p className="px-1 text-[12px] text-muted-foreground">แก้ไขข้อมูลได้ที่ครูประจำชั้น</p>
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
          <div className="text-[15px] font-bold">{title}</div>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{description}</p>
          <div className={`mt-2.5 text-[13px] font-bold ${ctaColor}`}>{cta} →</div>
        </div>
      </div>
    </Link>
  );
}
