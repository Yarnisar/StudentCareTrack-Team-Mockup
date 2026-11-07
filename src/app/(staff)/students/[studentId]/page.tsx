"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Download, Eye, EyeOff, Lock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { RiskBadge } from "@/components/shared/risk-badge";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { recordScoreDelta, recordScoreText, ruleKind } from "@/lib/behavior-rules";
import { useStore } from "@/lib/store";
import { WatchWithdrawal } from "@/components/behavior/watch-withdrawal";
import { BehaviorRecorder } from "../../behavior/behavior-recorder";
import { REVIEW_STATE_LABEL } from "@/lib/assessment-review";
import { dcCriteria, CURRENT_TERM } from "@/lib/mock-data";
import { downloadCsv } from "@/lib/csv";
import { formatThaiDate, formatThaiDateTime, maskCitizenId } from "@/lib/format";
import { canRevealCitizenId, canViewStudent } from "@/lib/roles";
import {
  APPOINTMENT_STATUS_LABEL,
  AssessmentOutcome,
  CARE_METHOD_LABEL,
  caseUrgencyText,
  DC_LEVEL_LABEL,
  DIMENSION_LABEL,
  NINE_S_CLUSTER_LABEL,
  NineSCluster,
  RISK_LABEL,
  SDQ_LEVEL_LABEL,
  SDQ_RATER_LABEL,
  SUPPORT_TYPE_LABEL,
  SdqRater,
} from "@/lib/types";

const OUTCOME_LABEL: Record<AssessmentOutcome, string> = {
  normal: "ปกติ",
  needs_care: "ควรดูแล",
};

function OutcomeChip({ outcome }: { outcome: AssessmentOutcome }) {
  return (
    <span
      className={
        outcome === "normal"
          ? "rounded-full bg-risk-green-bg px-2.5 py-1 text-xs font-semibold text-risk-green"
          : "rounded-full bg-risk-amber-bg px-2.5 py-1 text-xs font-semibold text-risk-amber"
      }
    >
      {OUTCOME_LABEL[outcome]}
    </span>
  );
}

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const store = useStore();
  const student = store.getStudent(studentId);
  // เปิดดูเลขบัตรเต็มเป็นรายครั้ง (ออกจากหน้านี้แล้วกลับมาจะซ่อนอีก)
  const [citizenIdRevealed, setCitizenIdRevealed] = useState(false);
  const [recording, setRecording] = useState(false);

  if (!student) return <p className="p-8 text-sm text-muted-foreground">ไม่พบข้อมูลนักเรียน</p>;

  // UC2 Alternate: ไม่มีสิทธิ์ → ไม่แสดงข้อมูลใด ๆ ของนักเรียน
  if (!canViewStudent(store.role, student.roomName)) {
    return (
      <>
        <PageHeader title="ข้อมูลนักเรียนรายบุคคล" subtitle={CURRENT_TERM.label} />
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
              <Lock className="size-5 text-muted-foreground" />
            </div>
            <h1 className="text-lg font-bold">ไม่มีสิทธิ์เข้าถึงข้อมูลนักเรียนคนนี้</h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
              ดูได้เฉพาะนักเรียนในห้องที่รับผิดชอบ หากต้องการสิทธิ์เพิ่มเติม
              กรุณาติดต่อผู้ดูแลระบบของโรงเรียน
            </p>
            <LinkButton href="/students" variant="outline" className="mt-5">
              กลับไปรายชื่อนักเรียน
            </LinkButton>
          </div>
        </div>
      </>
    );
  }

  const risk = store.overallRiskOf(studentId);
  const screening = store.latestScreening(studentId);
  const sdqSet = store.sdqSetOf(studentId);
  const behaviors = store.behaviorOf(studentId).slice(0, 5);
  const behaviorScore = store.behaviorScoreOf(studentId);
  const careCase = store.caseOf(studentId);
  const dc = store.dcResultOf(studentId);
  // store เก็บรายการใหม่ไว้หน้าสุด
  const redFlag = store.redFlags.find((r) => r.studentId === studentId);
  const nineS = store.nineS.find((r) => r.studentId === studentId);
  const visits = store.appointments
    .filter((a) => a.studentId === studentId)
    .sort((a, b) => b.proposedDate.localeCompare(a.proposedDate))
    .map((appointment) => ({
      appointment,
      record: store.homeVisitRecords.find((r) => r.appointmentId === appointment.appointmentId),
    }));
  const latestFollowups = careCase ? careCase.followups.slice(-3).reverse() : [];

  // เลขบัตรประชาชนซ่อนเป็นค่าเริ่มต้น เปิดดูเต็มได้เฉพาะบทบาทที่มีสิทธิ์ และทุกครั้งมีบันทึก (ข้อ 2.1.10)
  const maskedCitizenId = maskCitizenId(student.citizenId);
  const canReveal = canRevealCitizenId(store.role);
  const showFull = canReveal && citizenIdRevealed;
  const accessLogs = store.accessLogs.filter((l) => l.studentId === studentId);

  const toggleCitizenId = () => {
    if (citizenIdRevealed) {
      setCitizenIdRevealed(false);
    } else if (store.logCitizenIdView(studentId)) {
      setCitizenIdRevealed(true);
    }
  };

  const info: [string, string][] = [
    ["เลขประจำตัวนักเรียน", student.studentId],
    ["เลขบัตรประชาชน", showFull ? student.citizenId : maskedCitizenId],
    ["ชั้น / ห้อง", `${student.roomName} เลขที่ ${student.classNo}`],
    ["ผู้ปกครอง", `${student.guardianName} (${student.guardianRelation})`],
    ["เบอร์ติดต่อ", student.guardianPhone],
    ["ที่อยู่", student.address],
  ];

  /** ส่งออกรายงานรายบุคคล (Subflow: Export) ข้อมูลเท่ากับที่หน้านี้แสดงให้บทบาทนี้เห็น */
  const exportReport = () => {
    // ไฟล์ส่งออกไม่ใส่เลขบัตรเต็มเสมอ แม้กำลังเปิดดูอยู่ เพราะไฟล์หลุดออกนอกระบบได้
    const rows: (string | number)[][] = info.map(([label, value]) => [
      "ข้อมูลพื้นฐาน",
      label,
      label === "เลขบัตรประชาชน" ? maskedCitizenId : value,
    ]);
    screening?.results.forEach((r) =>
      rows.push(["ผลคัดกรอง 6 มิติ", DIMENSION_LABEL[r.dimension], RISK_LABEL[r.group]]),
    );
    if (redFlag) rows.push(["Red Flag", formatThaiDate(redFlag.assessedAt), OUTCOME_LABEL[redFlag.result]]);
    if (nineS) {
      (Object.keys(nineS.clusterResults) as NineSCluster[]).forEach((c) =>
        rows.push([
          "9S",
          NINE_S_CLUSTER_LABEL[c],
          `${nineS.clusterScores[c]} คะแนน · ${OUTCOME_LABEL[nineS.clusterResults[c]]}`,
        ]),
      );
    }
    (["teacher", "student", "parent"] as SdqRater[]).forEach((rater) => {
      const rec = sdqSet.find((s) => s.rater === rater);
      rows.push([
        "SDQ",
        SDQ_RATER_LABEL[rater],
        rec?.status === "completed" && rec.level
          ? `${rec.totalDifficulties} คะแนน · ${SDQ_LEVEL_LABEL[rec.level]}`
          : "ยังไม่ได้ทำ",
      ]);
    });
    visits.forEach(({ appointment, record }) =>
      rows.push([
        "เยี่ยมบ้าน",
        formatThaiDate(appointment.proposedDate),
        record
          ? `${APPOINTMENT_STATUS_LABEL[appointment.status]} · พบความเสี่ยง ${record.riskFindings.length} ข้อ`
          : APPOINTMENT_STATUS_LABEL[appointment.status],
      ]),
    );
    if (careCase) {
      rows.push([
        "case ช่วยเหลือ",
        careCase.caseId,
        `${careCase.status === "active" ? "กำลังดำเนินการ" : "ปิดแล้ว"} · ${SUPPORT_TYPE_LABEL[careCase.supportType]} · ${caseUrgencyText(careCase)}`,
      ]);
    }
    rows.push(["ความประพฤติ", "คะแนนความประพฤติ", behaviorScore]);
    downloadCsv(`รายงานนักเรียน-${student.studentId}.csv`, ["หมวด", "รายการ", "ผล"], rows);
  };

  return (
    <>
      <PageHeader title="ข้อมูลนักเรียนรายบุคคล" subtitle={CURRENT_TERM.label} />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/students"
            className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" /> กลับไปรายชื่อนักเรียน
          </Link>
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="size-4" /> ส่งออกรายงานรายบุคคล
          </Button>
        </div>

        <Card className="mb-5">
          <CardContent className="flex flex-wrap items-center gap-4 p-5 sm:p-6">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted text-xl font-bold text-muted-foreground">
              {student.fullName.replace(/^(ด\.ช\.|ด\.ญ\.)\s*/, "").charAt(0)}
            </div>
            <div className="min-w-0 flex-1 basis-56">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold">{student.fullName}</h2>
                {risk && <RiskBadge group={risk} />}
                {store.caseConsiderations[studentId] && !store.caseOf(studentId) && (
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[12px] font-semibold">
                    พิจารณาแล้วยังไม่เปิด case · {store.caseConsiderations[studentId].reason}
                  </span>
                )}
                {store.screeningWatch[studentId] && (
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[12px] font-semibold">
                    เฝ้าดูผลคัดกรอง · {store.screeningWatch[studentId].reason}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[13.5px] text-muted-foreground">
                {student.roomName} เลขที่ {student.classNo} · เลขประจำตัว {student.studentId}
                {screening ? ` · คัดกรองล่าสุด ${formatThaiDate(screening.screenedAt)}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <LinkButton variant="outline" href={`/screening/${studentId}`}>
                คัดกรองใหม่
              </LinkButton>
              <Button variant="outline" onClick={() => setRecording(true)}>
                บันทึกพฤติกรรม
              </Button>
              <LinkButton href={`/care-cases?student=${studentId}`}>
                {careCase ? "ดู case ช่วยเหลือ" : "เปิด case ช่วยเหลือ"}
              </LinkButton>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[1fr_1.45fr]">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-[15.5px] font-bold">ข้อมูลพื้นฐาน</h3>
              <p className="mt-1 mb-3 text-[11.5px] text-muted-foreground">
                อ้างอิงจากงานทะเบียนนักเรียนของโรงเรียน — อ่านอย่างเดียว
              </p>
              <dl className="divide-y divide-border">
                {info.map(([label, value]) => (
                  <div key={label} className="flex gap-3 py-2.5">
                    <dt className="w-36 shrink-0 text-[13px] text-muted-foreground">{label}</dt>
                    <dd className="flex flex-1 items-center gap-2 text-[13.5px] font-medium">
                      {value}
                      {label === "เลขบัตรประชาชน" && (
                        <button
                          type="button"
                          onClick={toggleCitizenId}
                          disabled={!canReveal}
                          aria-label={
                            !canReveal
                              ? "เลขบัตรประชาชนเปิดดูได้เฉพาะครูประจำชั้น"
                              : citizenIdRevealed
                                ? "ซ่อนเลขบัตรประชาชน"
                                : "แสดงเลขบัตรประชาชน"
                          }
                          title={
                            !canReveal
                              ? "เปิดดูเลขเต็มได้เฉพาะครูประจำชั้น"
                              : citizenIdRevealed
                                ? "ซ่อนเลขบัตรประชาชน"
                                : "แสดงเลขบัตรประชาชน (ระบบจะบันทึกว่าคุณเปิดดู)"
                          }
                          className="rounded-md p-1 text-muted-foreground enabled:hover:bg-muted enabled:hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {!canReveal ? (
                            <Lock className="size-4" />
                          ) : citizenIdRevealed ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              {canReveal && (
                <div className="mt-3 rounded-lg bg-surface px-3.5 py-3">
                  <div className="mb-1 text-[12.5px] font-semibold">ประวัติการเปิดดูเลขบัตร</div>
                  {accessLogs.length > 0 ? (
                    <ul className="space-y-1">
                      {accessLogs.slice(0, 5).map((log) => (
                        <li key={log.logId} className="text-[12px] text-muted-foreground">
                          {formatThaiDateTime(log.at)} · {log.actorName} ({log.actorRole})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[12px] text-muted-foreground">ยังไม่มีการเปิดดูในรอบนี้</p>
                  )}
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    ต้นแบบเก็บประวัติในหน่วยความจำ รีเฟรชแล้วหาย
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardContent className="p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[15.5px] font-bold">ผลการคัดกรอง 6 มิติ</h3>
                  {screening && (
                    <span className="text-[12.5px] text-muted-foreground">
                      ล่าสุด {formatThaiDate(screening.screenedAt)}
                    </span>
                  )}
                </div>
                {screening ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {screening.results.map((r) => (
                      <div
                        key={r.dimension}
                        className="flex items-center justify-between rounded-lg bg-surface px-3.5 py-2.5"
                      >
                        <span className="text-[13.5px] font-medium">
                          {DIMENSION_LABEL[r.dimension]}
                        </span>
                        <RiskBadge group={r.group} short />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-sm text-muted-foreground">ยังไม่มีข้อมูลการคัดกรอง</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-[15.5px] font-bold">สุขภาพจิต: Red Flag และ 9S</h3>
                {redFlag || nineS ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-surface px-3.5 py-2.5">
                      <div>
                        <div className="text-[13.5px] font-medium">Red Flag</div>
                        <div className="text-[12px] text-muted-foreground">
                          {redFlag ? formatThaiDate(redFlag.assessedAt) : ""}
                        </div>
                      </div>
                      {redFlag ? (
                        <OutcomeChip outcome={redFlag.result} />
                      ) : (
                        <span className="text-[12.5px] font-semibold text-muted-foreground">
                          ยังไม่ได้ประเมิน
                        </span>
                      )}
                    </div>
                    {nineS ? (
                      <div className="rounded-lg bg-surface px-3.5 py-2.5">
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <div className="text-[13.5px] font-medium">9S</div>
                            <div className="text-[12px] text-muted-foreground">
                              {formatThaiDate(nineS.assessedAt)}
                            </div>
                          </div>
                          <OutcomeChip outcome={nineS.result} />
                        </div>
                        <div className="divide-y divide-border">
                          {(Object.keys(nineS.clusterResults) as NineSCluster[]).map((c) => (
                            <div key={c} className="flex items-center justify-between py-1.5">
                              <span className="text-[13px]">{NINE_S_CLUSTER_LABEL[c]}</span>
                              <span className="flex items-center gap-2.5 text-[12.5px] text-muted-foreground">
                                {nineS.clusterScores[c]} คะแนน
                                <OutcomeChip outcome={nineS.clusterResults[c]} />
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="px-1 text-[12.5px] text-muted-foreground">
                        9S: ยังไม่ได้ประเมิน (ทำเมื่อ Red Flag ปกติ)
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="py-4 text-sm text-muted-foreground">
                    ยังไม่มีผล Red Flag และ 9S
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h3 className="text-[15.5px] font-bold">ผลการประเมิน SDQ รอบที่ {store.sdqRound} (3 ผู้ประเมิน)</h3>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[11.5px] font-semibold text-muted-foreground">
                    {REVIEW_STATE_LABEL[store.sdqReview(studentId).state]}
                  </span>
                  <span className="flex-1" />
                  <LinkButton variant="outline" href={`/assessment/review/${studentId}`}>
                    ตรวจผล SDQ / EQ
                  </LinkButton>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(["teacher", "student", "parent"] as SdqRater[]).map((rater) => {
                    const rec = sdqSet.find((s) => s.rater === rater);
                    const done = rec?.status === "completed";
                    return (
                      <div
                        key={rater}
                        className={
                          done
                            ? "rounded-xl border border-border p-4"
                            : "rounded-xl border border-dashed border-border bg-surface p-4"
                        }
                      >
                        <div className="text-[12.5px] text-muted-foreground">
                          {SDQ_RATER_LABEL[rater]}
                        </div>
                        {done ? (
                          <>
                            <div className="my-1.5 text-2xl font-bold">
                              {rec.totalDifficulties}
                              <span className="ml-1 text-xs font-medium text-muted-foreground">
                                คะแนน
                              </span>
                            </div>
                            <span
                              className={
                                rec.level === "normal"
                                  ? "rounded-full bg-risk-green-bg px-2.5 py-1 text-xs font-semibold text-risk-green"
                                  : rec.level === "risk"
                                    ? "rounded-full bg-risk-amber-bg px-2.5 py-1 text-xs font-semibold text-risk-amber"
                                    : "rounded-full bg-risk-red-bg px-2.5 py-1 text-xs font-semibold text-risk-red"
                              }
                            >
                              {rec.level ? SDQ_LEVEL_LABEL[rec.level] : ""}
                            </span>
                          </>
                        ) : (
                          <div className="mt-3 text-[13px] font-medium text-muted-foreground">
                            {rec ? "รอทำแบบประเมิน" : "ยังไม่เปิดแบบประเมิน"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* ประวัติรอบก่อน (รอบ 1 / รอบ 2 ตามช่วงเวลาในหน้าตั้งค่า) */}
                {([1, 2] as const)
                  .filter((r) => r !== store.sdqRound && store.sdqSetOf(studentId, r).some((x) => x.status === "completed"))
                  .map((r) => (
                    <p key={r} className="mt-3 rounded-lg bg-surface px-3 py-2 text-[12.5px] text-muted-foreground">
                      <b className="text-foreground">รอบที่ {r}:</b>{" "}
                      {(["teacher", "student", "parent"] as SdqRater[])
                        .map((rater) => {
                          const rec = store.sdqSetOf(studentId, r).find((x) => x.rater === rater);
                          const who = SDQ_RATER_LABEL[rater].replace("ประเมินตนเอง", "").replace("ประเมิน", "");
                          return rec?.status === "completed" && rec.level
                            ? `${who} ${rec.totalDifficulties} (${SDQ_LEVEL_LABEL[rec.level]})`
                            : `${who} ไม่ได้ตอบ`;
                        })
                        .join(" · ")}
                    </p>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-[15.5px] font-bold">การเยี่ยมบ้าน</h3>
                {visits.length > 0 ? (
                  <div className="divide-y divide-border">
                    {visits.map(({ appointment, record }) => (
                      <div key={appointment.appointmentId} className="flex items-center gap-3 py-2.5">
                        <div className="flex-1">
                          <div className="text-[13.5px] font-medium">
                            {formatThaiDate(appointment.proposedDate)} ·{" "}
                            {APPOINTMENT_STATUS_LABEL[appointment.status]}
                          </div>
                          {record && (
                            <div className="text-[12px] text-muted-foreground">
                              บันทึกโดย {record.signedBy} · ผู้ให้ข้อมูล {record.informantName} · พบความเสี่ยง{" "}
                              {record.riskFindings.length} ข้อ
                            </div>
                          )}
                        </div>
                        {record && (
                          <LinkButton
                            variant="outline"
                            href={`/home-visits/${appointment.appointmentId}/record`}
                          >
                            ดูผลการเยี่ยม
                          </LinkButton>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-sm text-muted-foreground">ยังไม่มีนัดเยี่ยมบ้าน</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[15.5px] font-bold">การดูแลช่วยเหลือ (case)</h3>
                  {careCase && (
                    <LinkButton variant="outline" href={`/care-cases?student=${studentId}`}>
                      เปิดหน้า case
                    </LinkButton>
                  )}
                </div>
                {careCase ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-[13px]">
                      <span className="font-semibold">{careCase.caseId}</span>
                      <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">
                        {careCase.status === "active" ? "กำลังดำเนินการ" : "ปิดแล้ว"}
                      </span>
                      <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold">
                        {caseUrgencyText(careCase)}
                      </span>
                    </div>
                    <dl className="divide-y divide-border text-[13.5px]">
                      {(
                        [
                          ["ประเภท", SUPPORT_TYPE_LABEL[careCase.supportType]],
                          ["วิธีการดูแล", careCase.careMethods.map((m) => CARE_METHOD_LABEL[m]).join(", ") || "-"],
                          ["เป้าหมาย", careCase.goal || "ยังไม่วางแผนช่วยเหลือ"],
                          [
                            "ติดตามครั้งถัดไป",
                            careCase.nextFollowupDate ? formatThaiDate(careCase.nextFollowupDate) : "ยังไม่กำหนด",
                          ],
                        ] as [string, string][]
                      ).map(([label, value]) => (
                        <div key={label} className="flex gap-3 py-2">
                          <dt className="w-32 shrink-0 text-[13px] text-muted-foreground">{label}</dt>
                          <dd className="flex-1 font-medium">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    {latestFollowups.length > 0 && (
                      <div>
                        <div className="mb-1 text-[12.5px] font-semibold text-muted-foreground">
                          ผลติดตามล่าสุด
                        </div>
                        {latestFollowups.map((f) => (
                          <div key={f.followupId} className="py-1.5 text-[13px]">
                            <span className="text-muted-foreground">{formatThaiDate(f.followupDate)} · </span>
                            {f.actionTaken}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="py-4 text-sm text-muted-foreground">ยังไม่มี case ช่วยเหลือ</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-[15.5px] font-bold">ประวัติความประพฤติล่าสุด</h3>
                  <span className="text-[13px] font-semibold">
                    คะแนนความประพฤติ {behaviorScore}
                    {store.behaviorScoreConfig.ceiling !== null && (
                      <span className="font-normal text-muted-foreground"> / {store.behaviorScoreConfig.ceiling}</span>
                    )}
                    {store.isBehaviorWatch(studentId) && (
                      <span className="ml-2 rounded-md bg-muted px-2 py-0.5 text-[12px]">
                        เฝ้าระวังระดับ {store.behaviorWatchLevelOf(studentId)}
                      </span>
                    )}
                  </span>
                </div>
                {store.watchWithdrawalPending(studentId) && <WatchWithdrawal studentId={studentId} />}
                <div className="divide-y divide-border">
                  {behaviors.map((rec) => {
                    const rule = store.behaviorRules.find((r) => r.ruleId === rec.ruleId);
                    const positive = recordScoreDelta(rec, rule) > 0;
                    const refer = rule ? ruleKind(rule) === "refer" : false;
                    return (
                      <div key={rec.recordId} className="flex items-center gap-3 py-2.5">
                        <span className="w-32 shrink-0 text-[12.5px] text-muted-foreground">
                          {formatThaiDateTime(rec.occurredAt)}
                        </span>
                        <span className="flex-1 text-[13.5px]">
                          <span className={rec.cancelled ? "text-muted-foreground line-through" : ""}>{rule?.name}</span>
                          {(rule?.cancelled || rec.cancelled) && (
                            <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground">
                              {rec.cancelled ? "ยกเลิกแล้ว ไม่นับคะแนน" : "กฎถูกยกเลิก"}
                            </span>
                          )}
                        </span>
                        {rec.source === "card_scan" && (
                          <span className="rounded bg-accent px-2 py-0.5 text-[11px] font-semibold text-primary">
                            สแกนบัตร
                          </span>
                        )}
                        <span
                          className={
                            refer || rec.cancelled
                              ? "w-10 text-right text-[12px] font-semibold text-muted-foreground line-through"
                              : positive
                                ? "w-10 text-right text-sm font-bold text-risk-green"
                                : "w-10 text-right text-sm font-bold text-risk-red"
                          }
                        >
                          {rule ? recordScoreText(rec, rule) : ""}
                        </span>
                      </div>
                    );
                  })}
                  {behaviors.length === 0 && (
                    <p className="py-4 text-sm text-muted-foreground">ยังไม่มีบันทึกความประพฤติ</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {dc && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-3 text-[15.5px] font-bold">
                    คุณลักษณะอันพึงประสงค์ (ปพ.6)
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {dcCriteria.map((c) => {
                      const level = dc.levels[c.criteriaId];
                      return (
                        <div
                          key={c.criteriaId}
                          className="flex items-center justify-between rounded-lg bg-surface px-3.5 py-2"
                        >
                          <span className="text-[13px]">{c.name}</span>
                          <span
                            className={
                              level === null || level === undefined
                                ? "text-[12.5px] font-semibold text-muted-foreground"
                                : level >= 3
                                  ? "text-[12.5px] font-semibold text-risk-green"
                                  : level === 2
                                    ? "text-[12.5px] font-semibold text-primary"
                                    : level === 1
                                      ? "text-[12.5px] font-semibold text-risk-amber"
                                      : "text-[12.5px] font-semibold text-risk-red"
                            }
                          >
                            {level === null || level === undefined
                              ? "รอประเมิน"
                              : DC_LEVEL_LABEL[level]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      {recording && <BehaviorRecorder studentId={studentId} onClose={() => setRecording(false)} />}
    </>
  );
}
