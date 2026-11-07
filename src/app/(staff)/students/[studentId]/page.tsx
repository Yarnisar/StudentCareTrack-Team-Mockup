"use client";

import { Suspense, use, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Download, Eye, EyeOff, Lock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { RiskBadge } from "@/components/shared/risk-badge";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { buildTimeline, termsWithData } from "@/lib/student-timeline";
import { termInfoOf } from "@/lib/terms";
import { ConductTab, GeneralTab, OverviewTab, ScreeningTab, CareTab, TimelineTab } from "./student-tabs";
import { BehaviorRecorder } from "../../behavior/behavior-recorder";
import { CURRENT_TERM } from "@/lib/mock-data";
import { downloadCsv } from "@/lib/csv";
import { formatThaiDate, formatThaiDateTime, maskCitizenId } from "@/lib/format";
import { canRevealCitizenId, canViewStudent } from "@/lib/roles";
import {
  APPOINTMENT_STATUS_LABEL,
  AssessmentOutcome,
  caseUrgencyText,
  DIMENSION_LABEL,
  NINE_S_CLUSTER_LABEL,
  NineSCluster,
  RISK_LABEL,
  SDQ_LEVEL_LABEL,
  SDQ_RATER_LABEL,
  SdqRater,
} from "@/lib/types";

const OUTCOME_LABEL: Record<AssessmentOutcome, string> = {
  normal: "ปกติ",
  needs_care: "ควรดูแล",
};

const TABS = [
  { key: "overview", label: "ภาพรวม" },
  { key: "screening", label: "คัดกรองและประเมิน" },
  { key: "conduct", label: "ความประพฤติ" },
  { key: "care", label: "การดูแลช่วยเหลือ" },
  { key: "general", label: "ข้อมูลทั่วไป" },
  { key: "timeline", label: "ไทม์ไลน์" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <StudentDetail params={params} />
    </Suspense>
  );
}

function StudentDetail({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const store = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
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
  const behaviorScore = store.behaviorScoreOf(studentId);
  const careCase = store.caseOf(studentId);
  // ส่งออกรายงานใช้ข้อมูลภาคเรียนปัจจุบัน
  const redFlag = store.redFlags.find((r) => r.studentId === studentId && r.termId === CURRENT_TERM.termId);
  const nineS = store.nineS.find((r) => r.studentId === studentId && r.termId === CURRENT_TERM.termId);

  // แท็บและตัวกรองภาคเรียน เก็บใน URL (?tab=&term=) เพื่อแชร์ลิงก์/กดย้อนกลับได้
  const events = buildTimeline(store, studentId);
  const allTerms = termsWithData(events, CURRENT_TERM.termId);
  const tabParam = search.get("tab");
  const tab: TabKey = TABS.some((t) => t.key === tabParam) ? (tabParam as TabKey) : "overview";
  const termParam = search.get("term");
  const selected = termParam === "all" || (termParam && allTerms.includes(termParam)) ? termParam! : tab === "timeline" ? "all" : CURRENT_TERM.termId;
  const shownTerms = selected === "all" ? allTerms : [selected];
  const setParams = (next: { tab?: string; term?: string }) => {
    const p = new URLSearchParams(search.toString());
    if (next.tab) p.set("tab", next.tab);
    if (next.term) p.set("term", next.term);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  };
  const pastTerm = selected !== "all" && selected !== CURRENT_TERM.termId;
  const dots: Partial<Record<TabKey, string>> = {
    conduct: store.isBehaviorWatch(studentId) ? "bg-risk-red" : "",
    care: careCase?.status === "active" ? "bg-primary" : "",
  };
  const visits = store.appointments
    .filter((a) => a.studentId === studentId)
    .sort((a, b) => b.proposedDate.localeCompare(a.proposedDate))
    .map((appointment) => ({
      appointment,
      record: store.homeVisitRecords.find((r) => r.appointmentId === appointment.appointmentId),
    }));

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
        `${careCase.status === "active" ? "กำลังดำเนินการ" : "ปิดแล้ว"} · ${caseUrgencyText(careCase)}`,
      ]);
    }
    rows.push(["ความประพฤติ", "คะแนนความประพฤติ", behaviorScore]);
    downloadCsv(`รายงานนักเรียน-${student.studentId}.csv`, ["หมวด", "รายการ", "ผล"], rows, store.logExport("ข้อมูลนักเรียนรายบุคคล 1 คน"));
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


        <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="ภาคเรียน">
            <span className="text-[13px] text-muted-foreground">ภาคเรียน</span>
            {["all", ...allTerms].map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={selected === t}
                onClick={() => setParams({ term: t })}
                className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium ${selected === t ? "border-primary bg-accent text-primary" : "border-border bg-card hover:bg-muted"}`}
              >
                {t === "all" ? "ทุกภาคเรียน" : termInfoOf(t).short}
                {t === CURRENT_TERM.termId && <span className="ml-1 text-[11px] font-normal">(ปัจจุบัน)</span>}
              </button>
            ))}
          </div>
        </div>
        {pastTerm && (
          <div className="mb-4 rounded-lg bg-muted px-4 py-2.5 text-[13px]">
            กำลังดูข้อมูลย้อนหลัง · {termInfoOf(selected).label}{" "}
            <button type="button" onClick={() => setParams({ term: CURRENT_TERM.termId })} className="ml-1 font-semibold text-primary hover:underline">
              กลับไปภาคเรียนปัจจุบัน
            </button>
          </div>
        )}

        <div role="tablist" aria-label="หมวดข้อมูลนักเรียน" className="mb-5 flex gap-1 overflow-x-auto border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setParams({ tab: t.key })}
              className={`relative -mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-[14px] font-semibold ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t.label}
              {dots[t.key] && <span className={`size-2 rounded-full ${dots[t.key]}`} />}
            </button>
          ))}
        </div>

        {tab === "overview" && <OverviewTab studentId={studentId} allTerms={allTerms} selected={selected} events={events} goTab={(k) => setParams({ tab: k })} />}
        {tab === "screening" && <ScreeningTab studentId={studentId} terms={shownTerms} />}
        {tab === "conduct" && <ConductTab studentId={studentId} terms={shownTerms} />}
        {tab === "care" && <CareTab studentId={studentId} terms={shownTerms} />}
        {tab === "general" && <GeneralTab studentId={studentId} info={<>
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
        </div>
      )}
    </CardContent>
  </Card>
</>} />}
        {tab === "timeline" && <TimelineTab events={events} terms={shownTerms} />}
      </div>
      {recording && <BehaviorRecorder studentId={studentId} onClose={() => setRecording(false)} />}
    </>
  );
}
