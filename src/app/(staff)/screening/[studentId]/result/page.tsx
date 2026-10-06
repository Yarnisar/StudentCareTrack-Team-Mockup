"use client";

import { use, useState } from "react";
import Link from "next/link";
import { BadgeCheck, ChevronLeft, LockOpen, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AssessmentRouteDiagram } from "@/components/assessment/route-diagram";
import { CaseTriggerOutcome } from "@/components/assessment/trigger-outcome";
import { RiskBadge } from "@/components/shared/risk-badge";
import { WindowNotice } from "@/components/shared/window-notice";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatThaiDateTime } from "@/lib/format";
import { overallRisk, SCREENING_ITEMS, screeningItemLabel } from "@/lib/rules";
import { useStore, type RaiseTriggerResult } from "@/lib/store";
import { ASSESSMENT_NEXT_STEP_LABEL, DIMENSION_LABEL, RISK_LABEL, SCREENING_STATUS_LABEL } from "@/lib/types";

const CONSENT_LABEL = { granted: "ผู้ปกครองให้ความยินยอมแล้ว", declined: "ผู้ปกครองไม่ยินยอม", none: "ผู้ปกครองยังไม่ตอบความยินยอม" };

export default function ScreeningResultPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const store = useStore();
  const student = store.getStudent(studentId);
  const screening = store.screeningOf(studentId);
  const [trigger, setTrigger] = useState<RaiseTriggerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unlockReason, setUnlockReason] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  if (!student) return <p className="p-8 text-sm text-muted-foreground">ไม่พบข้อมูลนักเรียน</p>;
  if (!store.canSeeSensitive(studentId))
    return <p className="p-8 text-sm text-muted-foreground">ผลการคัดกรองเป็นข้อมูลอ่อนไหว — ดูได้เฉพาะครูประจำชั้นและแอดมิน</p>;

  const plan = store.assessmentPlanOf(studentId);
  const lateThreshold = store.schoolSettings.lateAlertThreshold;
  const consent = store.consentStatusOf(studentId);

  const back = (
    <Link
      href="/screening"
      className="mb-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="size-4" /> กลับไปรายชื่อนักเรียน
    </Link>
  );

  if (!screening) {
    return (
      <>
        <PageHeader title="ผลการคัดกรอง" subtitle={store.currentTerm.label} />
        <div className="flex-1 overflow-y-auto p-8">
          {back}
          <p className="text-sm text-muted-foreground">ยังไม่มีการคัดกรองของภาคเรียนนี้</p>
        </div>
      </>
    );
  }

  const editBlocked = store.screeningEditBlockReason(studentId);
  const certifyBlocked = store.certifyBlockReason(screening.screeningId);
  const unlockBlocked = store.unlockBlockReason(screening.screeningId);
  const isAdmin = store.currentUser.role === "admin_school";
  const locked = store.isScreeningLocked(screening);

  const certify = () => {
    const res = store.certifyScreening(screening.screeningId);
    if (!res.ok) return setError(res.error);
    setError(null);
    setTrigger(res.trigger);
  };
  const unlock = () => {
    const res = store.unlockScreening(screening.screeningId, unlockReason);
    if (!res.ok) return setError(res.error);
    setError(null);
    setUnlocking(false);
    setUnlockReason("");
  };

  const nextStep =
    plan.next === "red_flag"
      ? { href: `/assessment/red-flag/${studentId}`, label: "ทำแบบคัดกรอง Red Flag", text: "นักเรียนยังไม่เคยประเมินสุขภาพจิตในปีการศึกษานี้" }
      : plan.next === "nine_s"
        ? { href: `/assessment/nine-s/${studentId}`, label: "ทำแบบประเมิน 9S", text: "ผล Red Flag ปกติ — ทำ 9S ต่อ" }
        : plan.next === "open_sdq" || plan.next === "sdq" || plan.next === "wait_sdq_window"
          ? {
              href: `/assessment/sdq/${studentId}`,
              label: `ไปที่ SDQ ครั้งที่ ${plan.round}`,
              text:
                plan.next === "sdq"
                  ? "มีแบบ SDQ ที่รอส่ง"
                  : plan.next === "wait_sdq_window"
                    ? `ต้องทำ SDQ ครั้งที่ ${plan.round} — รอเปิดช่วงทำ SDQ`
                    : `ต้องทำ SDQ ครั้งที่ ${plan.round}`,
            }
          : null;

  return (
    <>
      <PageHeader title="ผลการคัดกรอง" subtitle={`คัดกรอง 6 มิติ · ${store.currentTerm.label}`} />

      <div className="flex-1 overflow-y-auto p-8">
        {back}
        <WindowNotice activity="screening" className="mb-4" />

        <Card className="mb-4">
          <CardContent className="flex flex-wrap items-center gap-4 p-5">
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold">
                {student.fullName} · {student.roomName} เลขที่ {student.classNo}
              </div>
              <div className="mt-0.5 text-[13px] text-muted-foreground">
                บันทึกล่าสุดโดย {store.nameOf(screening.screenedBy)} · {formatThaiDateTime(screening.screenedAt)}
                {screening.certifiedBy && screening.certifiedAt
                  ? ` · รับรองโดย ${store.nameOf(screening.certifiedBy)} ${formatThaiDateTime(screening.certifiedAt)}`
                  : ""}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[12px]">
                <span
                  className={
                    screening.status === "certified"
                      ? "rounded-full bg-accent px-2.5 py-1 font-semibold text-primary"
                      : "rounded-full border border-dashed border-border px-2.5 py-1 font-semibold text-muted-foreground"
                  }
                >
                  {SCREENING_STATUS_LABEL[screening.status]}
                </span>
                {locked && <span className="rounded-full bg-muted px-2.5 py-1 font-semibold text-muted-foreground">ล็อกแล้ว</span>}
                {screening.unlock && (
                  <span className="rounded-full bg-risk-amber-bg px-2.5 py-1 font-semibold text-risk-amber">
                    ปลดล็อกโดย {store.nameOf(screening.unlock.by)}: {screening.unlock.reason}
                  </span>
                )}
                <span className="rounded-full bg-surface px-2.5 py-1 text-muted-foreground">{CONSENT_LABEL[consent]}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="mb-1.5 text-[12.5px] text-muted-foreground">ผลรวม</div>
              <RiskBadge group={overallRisk(screening.results.map((r) => r.group))} />
            </div>
          </CardContent>
        </Card>

        <CaseTriggerOutcome studentId={studentId} result={trigger} className="mb-4" />

        <div className="grid gap-4 xl:grid-cols-2">
          {screening.results.map((r) => {
            const items = SCREENING_ITEMS.filter((i) => r.checkedItemIds.includes(i.id) || r.derivedItemIds.includes(i.id));
            return (
              <Card key={r.dimension}>
                <CardContent className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-[15px] font-bold">{DIMENSION_LABEL[r.dimension]}</h3>
                    <RiskBadge group={r.group} />
                  </div>
                  {r.teacherGroup && (
                    <p className="mb-2 rounded-lg bg-surface px-3 py-2 text-[12.5px] text-muted-foreground">
                      ครูปรับผลจาก <b>{r.computedGroup === "pending" ? "รอผลประเมิน" : RISK_LABEL[r.computedGroup]}</b> เป็น{" "}
                      <b>{RISK_LABEL[r.teacherGroup]}</b> · เหตุผล: {r.adjustReason}
                    </p>
                  )}
                  {items.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground">
                      {r.computedGroup === "pending" ? "รอผลแบบคัดกรอง Red Flag / 9S" : "ไม่พบรายการ"}
                    </p>
                  ) : (
                    <ul className="space-y-1.5 text-[13px]">
                      {items.map((i) => (
                        <li key={i.id} className="flex items-center gap-2">
                          <span className={i.severity === "problem" ? "size-1.5 rounded-full bg-risk-red" : "size-1.5 rounded-full bg-risk-amber"} />
                          <span className="flex-1">{screeningItemLabel(i, { lateAlertThreshold: lateThreshold })}</span>
                          {r.derivedItemIds.includes(i.id) && (
                            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">ระบบกำหนด</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-4">
          <CardContent className="p-5">
            <h2 className="mb-3 text-[15px] font-bold">เส้นทางการประเมินสุขภาพจิต</h2>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_1fr]">
              <AssessmentRouteDiagram studentId={studentId} />
              <div className="content-start">
                {nextStep ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-accent px-4 py-3 text-[13px] text-accent-foreground">
                    <span className="flex-1">
                      <b>ขั้นถัดไปด้านสุขภาพจิต:</b> {nextStep.text}
                    </span>
                    <LinkButton size="sm" href={nextStep.href}>
                      {nextStep.label}
                    </LinkButton>
                  </div>
                ) : (
                  <p className="rounded-xl bg-surface px-4 py-3 text-[13px] text-muted-foreground">
                    ไม่มีขั้นถัดไปด้านสุขภาพจิตในรอบนี้ — {ASSESSMENT_NEXT_STEP_LABEL[plan.next]}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {error && <p className="mt-4 text-[13px] text-risk-red">{error}</p>}

        {isAdmin && !unlockBlocked && (
          <Card className="mt-4">
            <CardContent className="p-5">
              {unlocking ? (
                <div className="space-y-2">
                  <div className="text-[13.5px] font-semibold">ปลดล็อกการคัดกรองฉบับนี้</div>
                  <Textarea
                    value={unlockReason}
                    onChange={(e) => setUnlockReason(e.target.value)}
                    placeholder="เหตุผลการปลดล็อก (จำเป็น) — บันทึกใน audit log"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setUnlocking(false)}>
                      ยกเลิก
                    </Button>
                    <Button size="sm" onClick={unlock} disabled={!unlockReason.trim()}>
                      ยืนยันปลดล็อก
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <LockOpen className="size-4 text-muted-foreground" />
                  <span className="flex-1 text-[13px] text-muted-foreground">
                    ปิดช่วงดำเนินงานคัดกรองแล้ว — แอดมินปลดล็อกให้ครูประจำชั้นแก้ไขฉบับนี้ได้จนกว่าจะรับรองข้อมูลอีกครั้ง
                  </span>
                  <Button size="sm" variant="outline" onClick={() => setUnlocking(true)}>
                    ปลดล็อก
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 pb-4">
          {screening.status === "draft" && certifyBlocked && (
            <span className="mr-auto text-[13px] text-muted-foreground">{certifyBlocked}</span>
          )}
          {!editBlocked && (
            <LinkButton variant="outline" href={`/screening/${studentId}`}>
              แก้ไข
            </LinkButton>
          )}
          {screening.status === "draft" ? (
            <Button onClick={certify} disabled={!!certifyBlocked}>
              <ShieldCheck className="size-4" /> รับรองข้อมูล
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary">
              <BadgeCheck className="size-4" /> ส่งแล้ว (รับรองข้อมูลแล้ว)
            </span>
          )}
        </div>
      </div>
    </>
  );
}
