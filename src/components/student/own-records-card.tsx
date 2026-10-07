"use client";

import type { ReactNode } from "react";
import { RiskBadge } from "@/components/shared/risk-badge";
import { SdqLevelBadge } from "@/components/assessment/sdq-result";
import { formatThaiDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import {
  APPOINTMENT_STATUS_LABEL,
  CARE_METHOD_LABEL,
  CASE_CLOSE_REASON_LABEL,
  DIMENSION_LABEL,
  SDQ_RATER_LABEL,
  SUPPORT_TYPE_LABEL,
  VISIT_TYPE_LABEL,
} from "@/lib/types";
import { Chip, SectionCard, termLabelOf } from "./section-card";

const outcomeLabel = (r: "normal" | "needs_care") => (r === "needs_care" ? "ควรดูแล" : "ปกติ");

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-border pt-3 first:border-t-0 first:pt-0">
      <div className="mb-2 text-[12px] font-semibold text-muted-foreground">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="rounded-lg bg-surface px-3.5 py-2.5 text-[13px]">{children}</div>;
}

/**
 * ครูประจำชั้นคนเดิม (ปัจจุบันไม่ใช่ครูประจำชั้นของนักเรียนคนนี้) เห็นได้เฉพาะบันทึกที่ตัวเองบันทึกไว้ และแก้ไม่ได้
 * รวมทุกประเภท: คัดกรอง, Red Flag/9S, SDQ ฉบับที่ตัวเองประเมิน, การเยี่ยมบ้าน, care case/แผน/ติดตามผล
 * อ่านอย่างเดียวในหน้านี้ — ไม่เปิดเส้นทางเมนูของครูประจำชั้นให้
 */
export function OwnRecordsCard({ studentId }: { studentId: string }) {
  const store = useStore();
  const me = store.currentUser.userId;
  const mine = (by: string | null | undefined) => by === me && store.canViewRecord(studentId, by);

  const screenings = store.screenings.filter((s) => s.studentId === studentId && mine(s.screenedBy));
  const redFlags = store.redFlags.filter((r) => r.studentId === studentId && mine(r.assessedBy));
  const nineS = store.nineS.filter((r) => r.studentId === studentId && mine(r.assessedBy));
  const sdq = store.sdqOf(studentId).filter((s) => s.status === "submitted" && mine(s.raterUserId));
  const records = store.homeVisitRecords.filter(
    (r) => r.studentId === studentId && (mine(r.recordedBy) || mine(r.signedBy))
  );
  const recordAppointmentIds = new Set(records.map((r) => r.appointmentId));
  const appointments = store.appointments.filter(
    (a) => a.studentId === studentId && (mine(a.teacherId) || recordAppointmentIds.has(a.appointmentId))
  );
  const cases = store.careCases
    .filter((c) => c.studentId === studentId)
    .map((c) => ({
      careCase: c,
      opened: mine(c.openedBy),
      closed: mine(c.closedBy),
      plans: c.plans.filter((p) => mine(p.createdBy)),
      followups: c.followups.filter((f) => mine(f.recordedBy)),
      referrals: c.referrals.filter((r) => mine(r.createdBy)),
    }))
    .filter((c) => c.opened || c.closed || c.plans.length + c.followups.length + c.referrals.length > 0);

  const total =
    screenings.length + redFlags.length + nineS.length + sdq.length + appointments.length + cases.length;
  if (total === 0) return null;

  return (
    <SectionCard
      title="บันทึกที่คุณเคยบันทึกไว้"
      note="คุณเคยเป็นครูประจำชั้นของนักเรียนคนนี้ จึงเห็นเฉพาะบันทึกที่ตัวเองบันทึกไว้ และแก้ไขไม่ได้"
    >
      <div className="space-y-3">
        {screenings.length > 0 && (
          <Group title="การคัดกรอง 6 มิติ">
            {screenings.map((s) => (
              <Row key={s.screeningId}>
                <div className="mb-2 text-[12px] text-muted-foreground">
                  {termLabelOf(s.termId)} · {formatThaiDate(s.screenedAt)}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {s.results.map((r) => (
                    <div key={r.dimension} className="flex items-center justify-between gap-2">
                      <span>{DIMENSION_LABEL[r.dimension]}</span>
                      <RiskBadge group={r.group} />
                    </div>
                  ))}
                </div>
              </Row>
            ))}
          </Group>
        )}

        {(redFlags.length > 0 || nineS.length > 0) && (
          <Group title="แบบประเมินสุขภาพจิต (Red Flag / 9S)">
            {redFlags.map((r) => (
              <Row key={r.id}>
                Red Flag · {termLabelOf(r.termId)} · {formatThaiDate(r.assessedAt)} —{" "}
                <b>{outcomeLabel(r.result)}</b>
              </Row>
            ))}
            {nineS.map((r) => (
              <Row key={r.id}>
                9S · {termLabelOf(r.termId)} · {formatThaiDate(r.assessedAt)} — <b>{outcomeLabel(r.result)}</b>
              </Row>
            ))}
          </Group>
        )}

        {sdq.length > 0 && (
          <Group title="SDQ ที่คุณประเมิน">
            {sdq.map((s) => (
              <Row key={s.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {SDQ_RATER_LABEL[s.rater]} ครั้งที่ {s.round} · {termLabelOf(s.termId)}
                    {s.submittedAt ? ` · ส่งเมื่อ ${formatThaiDate(s.submittedAt)}` : ""}
                  </span>
                  <span className="flex items-center gap-2">
                    <b>{s.totalDifficulties} คะแนน</b>
                    {s.level && <SdqLevelBadge level={s.level} className="px-2 py-0.5 text-[11px]" />}
                  </span>
                </div>
              </Row>
            ))}
          </Group>
        )}

        {appointments.length > 0 && (
          <Group title="การเยี่ยมบ้าน">
            {appointments.map((a) => {
              const record = records.find((r) => r.appointmentId === a.appointmentId);
              return (
                <Row key={a.appointmentId}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      {VISIT_TYPE_LABEL[a.visitType]} ปี {a.academicYear} · นัด {formatThaiDate(a.proposedDate)}
                    </span>
                    <Chip>{APPOINTMENT_STATUS_LABEL[a.status]}</Chip>
                  </div>
                  {record && (
                    <div className="mt-1.5 text-[12px] text-muted-foreground">
                      {record.signedAt ? `รับรองเมื่อ ${formatThaiDate(record.signedAt)}` : "ร่างบันทึก"}
                      {record.livesWith ? ` · อาศัยอยู่กับ ${record.livesWith}` : ""}
                      {record.cannotAccessHome ? " · เข้าบ้านไม่ได้" : ""}
                    </div>
                  )}
                </Row>
              );
            })}
          </Group>
        )}

        {cases.length > 0 && (
          <Group title="การดูแลช่วยเหลือ (care case)">
            {cases.map(({ careCase: c, opened, closed, plans, followups, referrals }) => (
              <Row key={c.caseId}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">case {c.caseId}</span>
                  <Chip tone={c.status === "active" ? "amber" : "muted"}>
                    {c.status === "active" ? "เปิดอยู่" : "ปิดแล้ว"}
                  </Chip>
                </div>
                <ul className="mt-1.5 space-y-1 text-[12px] text-muted-foreground">
                  {opened && <li>คุณเปิด case เมื่อ {formatThaiDate(c.openedAt)}</li>}
                  {closed && c.closedAt && (
                    <li>
                      คุณปิด case เมื่อ {formatThaiDate(c.closedAt)}
                      {c.closeReason ? ` (${CASE_CLOSE_REASON_LABEL[c.closeReason]})` : ""}
                    </li>
                  )}
                  {plans.map((p) => (
                    <li key={p.planId}>
                      แผน: {SUPPORT_TYPE_LABEL[p.supportType]} ·{" "}
                      {p.careMethods.map((m) => CARE_METHOD_LABEL[m]).join(", ")} — {p.goal} (เป้าหมาย{" "}
                      {formatThaiDate(p.targetDate)})
                    </li>
                  ))}
                  {followups.map((f) => (
                    <li key={f.followupId}>
                      ติดตามผล {formatThaiDate(f.followupDate)}: {f.actionTaken} — {f.result}
                    </li>
                  ))}
                  {referrals.map((r) => (
                    <li key={r.referralId}>
                      ส่งต่อภายนอก: {r.externalAgency} ({formatThaiDate(r.createdAt)})
                    </li>
                  ))}
                </ul>
              </Row>
            ))}
          </Group>
        )}
      </div>
    </SectionCard>
  );
}
