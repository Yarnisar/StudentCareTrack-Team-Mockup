"use client";

/**
 * เนื้อหาของแต่ละแท็บในหน้าข้อมูลนักเรียน: ภาพรวม / คัดกรองและประเมิน / ความประพฤติ / การดูแลช่วยเหลือ / ข้อมูลทั่วไป / ไทม์ไลน์
 * ทุกแท็บรับรายการภาคเรียนที่เลือกจากตัวกรองที่หัวหน้า (เลือก "ทุกภาคเรียน" แสดงเรียงตามภาคเรียน)
 * สีกลุ่มเสี่ยง (เขียว/เหลือง/แดง) ใช้กับผลคัดกรองและผล SDQ/ความเสี่ยงเท่านั้น สถานะอื่นใช้สีกลาง ยกเว้นเฝ้าระวังด้านความประพฤติที่ใช้สีแดงตามที่กำหนด
 */

import { colorResults, MENTAL_STATUS_LABEL } from "@/lib/screening-view";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { WatchWithdrawal } from "@/components/behavior/watch-withdrawal";
import { RiskBadge } from "@/components/shared/risk-badge";
import { Card, CardContent } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { recordScoreDelta, recordScoreText, ruleKind } from "@/lib/behavior-rules";
import { EQ_DOMAIN_LABEL, EQ_DOMAINS, EQ_LEVEL_LABEL } from "@/lib/eq";
import { formatThaiDate, formatThaiDateTime } from "@/lib/format";
import { CURRENT_TERM, DEMO_TODAY, dcCriteria } from "@/lib/mock-data";
import { REVIEW_STATE_LABEL } from "@/lib/assessment-review";
import { type TimelineEvent, type TimelineKind, TIMELINE_KIND_LABEL } from "@/lib/student-timeline";
import { useStore } from "@/lib/store";
import { termInfoOf, termOfDate } from "@/lib/terms";
import {
  APPOINTMENT_STATUS_LABEL,
  AssessmentOutcome,
  CARE_METHOD_LABEL,
  caseUrgencyText,
  DC_LEVEL_LABEL,
  DIMENSION_LABEL,
  NINE_S_CLUSTER_LABEL,
  NineSCluster,
  SDQ_LEVEL_LABEL,
  SDQ_RATER_LABEL,
  type RiskGroup,
  type SdqLevel,
  type SdqRater,
} from "@/lib/types";

const OUTCOME_LABEL: Record<AssessmentOutcome, string> = { normal: "ปกติ", needs_care: "ควรดูแล" };

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

function LevelChip({ level }: { level: SdqLevel }) {
  return (
    <span
      className={
        level === "normal"
          ? "rounded-full bg-risk-green-bg px-2.5 py-1 text-xs font-semibold text-risk-green"
          : level === "risk"
            ? "rounded-full bg-risk-amber-bg px-2.5 py-1 text-xs font-semibold text-risk-amber"
            : "rounded-full bg-risk-red-bg px-2.5 py-1 text-xs font-semibold text-risk-red"
      }
    >
      {SDQ_LEVEL_LABEL[level]}
    </span>
  );
}

/** หัวข้อภาคเรียน แสดงเมื่อดูหลายภาคเรียนพร้อมกัน หรือดูภาคที่ไม่ใช่ปัจจุบัน */
function TermHeading({ termId, show }: { termId: string; show: boolean }) {
  if (!show) return null;
  return (
    <h2 className="mb-3 flex items-center gap-2 text-[14px] font-bold">
      {termInfoOf(termId).label}
      {termId === CURRENT_TERM.termId && <span className="rounded-md bg-accent px-2 py-0.5 text-[11.5px] font-semibold text-primary">ภาคเรียนปัจจุบัน</span>}
    </h2>
  );
}

const SDQ_ORDER: Record<SdqLevel, number> = { normal: 0, risk: 1, problem: 2 };

// ---------------------------------------------------------------- ข้อมูลของภาคเรียนหนึ่ง (ใช้ซ้ำทั้งภาพรวมและแท็บอื่น)
function useTermData(studentId: string, termId: string) {
  const store = useStore();
  const screening = store.screenings
    .filter((s) => s.studentId === studentId && s.termId === termId)
    .sort((a, b) => b.screenedAt.localeCompare(a.screenedAt))[0];
  const overall: RiskGroup | null = screening
    ? colorResults(screening.results).some((r) => r.group === "red")
      ? "red"
      : colorResults(screening.results).some((r) => r.group === "amber")
        ? "amber"
        : "green"
    : null;
  const sdq = store.sdqOf(studentId).filter((s) => s.termId === termId);
  const sdqRounds = ([1, 2] as const).filter((r) => sdq.some((s) => s.round === r));
  const latestRound = sdqRounds.at(-1);
  const latestSdq = sdq.filter((s) => s.round === latestRound && s.status === "completed");
  const sdqWorst = latestSdq.reduce<SdqLevel | null>((w, s) => (s.level && (w === null || SDQ_ORDER[s.level] > SDQ_ORDER[w]) ? s.level : w), null);
  const info = termInfoOf(termId);
  const endAt = `${info.end < DEMO_TODAY ? info.end : DEMO_TODAY}T23:59:59`;
  const endScore = store.behaviorScoreAt(studentId, endAt);
  const records = store.behaviorOf(studentId).filter((r) => termOfDate(r.occurredAt).termId === termId && store.behaviorVisible(r));
  const visits = store.appointments
    .filter((a) => a.studentId === studentId && termOfDate(a.proposedDate).termId === termId)
    .sort((a, b) => b.proposedDate.localeCompare(a.proposedDate));
  return { screening, overall, sdq, sdqRounds, latestRound, latestSdq, sdqWorst, endScore, records, visits, info };
}

// ---------------------------------------------------------------- ภาพรวม
export function OverviewTab({
  studentId,
  allTerms,
  selected,
  events,
  goTab,
}: {
  studentId: string;
  allTerms: string[];
  /** ภาคเรียนที่เลือก (ทุกภาคเรียน = ใช้ภาคปัจจุบันเป็นสรุป) */
  selected: string;
  events: TimelineEvent[];
  goTab: (tab: string) => void;
}) {
  const store = useStore();
  const termId = selected === "all" ? CURRENT_TERM.termId : selected;
  const d = useTermData(studentId, termId);
  const active = store.careCases.find((c) => c.studentId === studentId && c.status === "active");
  const isCurrent = termId === CURRENT_TERM.termId;
  const watch = isCurrent && store.isBehaviorWatch(studentId);
  const lastVisit = d.visits[0];

  const rows: { label: string; tab: string; value: ReactNode }[] = [
    { label: "ผลคัดกรอง 6 มิติ", tab: "screening", value: d.overall ? <RiskBadge group={d.overall} /> : <span className="text-muted-foreground">ยังไม่ได้คัดกรอง</span> },
    {
      label: "SDQ",
      tab: "screening",
      value: d.latestSdq.length > 0 ? (
        <span className="flex flex-wrap items-center gap-2">
          {d.sdqWorst && <LevelChip level={d.sdqWorst} />}
          <span className="text-[12.5px] text-muted-foreground">
            รอบที่ {d.latestRound} · ตอบแล้ว {d.latestSdq.length} จาก 3 ฝ่าย
          </span>
        </span>
      ) : (
        <span className="text-muted-foreground">ยังไม่มีผล</span>
      ),
    },
    {
      label: isCurrent ? "ความประพฤติ" : "ความประพฤติ (ปลายภาค)",
      tab: "conduct",
      value: (
        <span className="flex flex-wrap items-center gap-2">
          <b className="text-[16px] tabular-nums">{d.endScore}</b>
          <span className="text-[12.5px] text-muted-foreground">/ {store.behaviorScoreConfig.ceiling ?? store.behaviorScoreConfig.startScore}</span>
          {watch && <span className="rounded-md bg-risk-red px-2 py-0.5 text-[11.5px] font-semibold text-white">เฝ้าระวังระดับ {store.behaviorWatchLevelOf(studentId)}</span>}
        </span>
      ),
    },
    {
      label: "การดูแลช่วยเหลือ",
      tab: "care",
      value: active ? (
        <span>
          {active.caseId} · กำลังดำเนินการ <span className="text-muted-foreground">· {caseUrgencyText(active)}</span>
        </span>
      ) : (
        <span className="text-muted-foreground">ไม่มีกรณีที่เปิดอยู่</span>
      ),
    },
    {
      label: "เยี่ยมบ้าน",
      tab: "care",
      value: lastVisit ? (
        <span>
          {formatThaiDate(lastVisit.proposedDate)} <span className="text-muted-foreground">· {APPOINTMENT_STATUS_LABEL[lastVisit.status]}</span>
        </span>
      ) : (
        <span className="text-muted-foreground">ไม่มีนัดในภาคเรียนนี้</span>
      ),
    },
  ];

  // ตารางเปรียบเทียบ: ภาคเรียนเก่า → ใหม่
  const cols = [...allTerms].sort().slice(-4);

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-3 text-[15.5px] font-bold">สรุป · {termInfoOf(termId).label}</h2>
          <div className="divide-y divide-border">
            {rows.map((r) => (
              <button key={r.label} type="button" onClick={() => goTab(r.tab)} className="flex w-full items-center gap-3 py-3 text-left hover:bg-muted/40">
                <span className="w-40 shrink-0 text-[13px] text-muted-foreground">{r.label}</span>
                <span className="flex-1 text-[13.5px] font-medium">{r.value}</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-[15.5px] font-bold">เปลี่ยนแปลงตามภาคเรียน</h2>
          <p className="mt-0.5 mb-3 text-[12px] text-muted-foreground">เรียงจากภาคเรียนเก่าไปใหม่ คะแนนความประพฤติเริ่มใหม่ทุกปีการศึกษา ภาคเรียนในปีเดียวกันคะแนนสะสมต่อกัน</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-[13.5px]">
              <thead>
                <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
                  <th className="w-40 py-2 font-medium" />
                  {cols.map((t) => (
                    <th key={t} className={`py-2 font-medium ${t === termId ? "text-primary" : ""}`}>
                      {termInfoOf(t).short}
                      {t === CURRENT_TERM.termId && <span className="ml-1 text-[11px] font-normal">(ปัจจุบัน)</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <CompareRow label="ผลคัดกรอง" cols={cols} studentId={studentId} cell={(x) => (x.overall ? <RiskBadge group={x.overall} short /> : <span className="text-muted-foreground">–</span>)} />
                <CompareRow label="SDQ" cols={cols} studentId={studentId} cell={(x) => (x.sdqWorst ? <LevelChip level={x.sdqWorst} /> : <span className="text-muted-foreground">–</span>)} />
                <CompareRow label="คะแนนความประพฤติ (ปลายภาค)" cols={cols} studentId={studentId} cell={(x) => <b className="tabular-nums">{x.endScore}</b>} />
                <CompareRow label="บันทึกพฤติกรรม" cols={cols} studentId={studentId} cell={(x) => <span className="tabular-nums">{x.records.filter((r) => !r.cancelled).length} รายการ</span>} />
                <tr>
                  <td className="py-2.5 pr-3 text-[13px] text-muted-foreground">เหตุการณ์สำคัญ</td>
                  {cols.map((t) => {
                    const key = events.filter((e) => e.termId === t && e.alert);
                    return (
                      <td key={t} className="py-2.5 pr-3 text-[12.5px]">
                        {key.length > 0 ? key.map((e) => e.title).slice(0, 2).join(" · ") : <span className="text-muted-foreground">–</span>}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          {cols.length < 2 && <p className="mt-3 text-[12.5px] text-muted-foreground">ยังมีข้อมูลภาคเรียนเดียว เมื่อมีหลายภาคเรียนจะเห็นการเปลี่ยนแปลงเทียบกัน</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function CompareRow({
  label,
  cols,
  studentId,
  cell,
}: {
  label: string;
  cols: string[];
  studentId: string;
  cell: (d: ReturnType<typeof useTermData>) => ReactNode;
}) {
  return (
    <tr>
      <td className="py-2.5 pr-3 text-[13px] text-muted-foreground">{label}</td>
      {cols.map((t) => (
        <CompareCell key={t} studentId={studentId} termId={t} cell={cell} />
      ))}
    </tr>
  );
}

function CompareCell({ studentId, termId, cell }: { studentId: string; termId: string; cell: (d: ReturnType<typeof useTermData>) => ReactNode }) {
  const d = useTermData(studentId, termId);
  return <td className="py-2.5 pr-3">{cell(d)}</td>;
}

// ---------------------------------------------------------------- คัดกรองและประเมิน
export function ScreeningTab({ studentId, terms }: { studentId: string; terms: string[] }) {
  return (
    <div className="space-y-8">
      {terms.map((t) => (
        <section key={t}>
          <TermHeading termId={t} show={terms.length > 1} />
          <ScreeningTerm studentId={studentId} termId={t} />
        </section>
      ))}
    </div>
  );
}

function ScreeningTerm({ studentId, termId }: { studentId: string; termId: string }) {
  const store = useStore();
  const d = useTermData(studentId, termId);
  const mental = store.mentalStatusOf(studentId, termId);
  const redFlag = store.redFlags.find((r) => r.studentId === studentId && r.termId === termId);
  const nineS = store.nineS.find((r) => r.studentId === studentId && r.termId === termId);
  const eq = store.eq.find((e) => e.studentId === studentId && e.termId === termId);
  const isCurrent = termId === CURRENT_TERM.termId;

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15.5px] font-bold">ผลการคัดกรอง 6 มิติ</h3>
            {d.screening && <span className="text-[12.5px] text-muted-foreground">คัดกรองเมื่อ {formatThaiDate(d.screening.screenedAt)}</span>}
          </div>
          {d.screening ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {colorResults(d.screening.results).map((r) => (
                <div key={r.dimension} className="flex items-center justify-between rounded-lg bg-surface px-3.5 py-2.5">
                  <span className="text-[13.5px] font-medium">{DIMENSION_LABEL[r.dimension]}</span>
                  <RiskBadge group={r.group} short />
                </div>
              ))}
              {/* มิติที่ 6 สุขภาพจิต ไม่ใช้สี เขียว เหลือง แดง (UC6 สถานการณ์ B) */}
              <div className="flex items-center justify-between rounded-lg bg-surface px-3.5 py-2.5">
                <span className="text-[13.5px] font-medium">{DIMENSION_LABEL.mental}</span>
                {mental && (
                  <span
                    className={
                      mental === "needs_care"
                        ? "rounded-full bg-foreground px-2.5 py-1 text-xs font-semibold text-background"
                        : "rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground"
                    }
                  >
                    {MENTAL_STATUS_LABEL[mental]}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">ยังไม่มีข้อมูลการคัดกรองในภาคเรียนนี้</p>
          )}
        </CardContent>
      </Card>

      {(redFlag || nineS || isCurrent) && (
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-3 text-[15.5px] font-bold">สุขภาพจิต: Red Flag และ 9S</h3>
            {redFlag || nineS ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-surface px-3.5 py-2.5">
                  <div>
                    <div className="text-[13.5px] font-medium">Red Flag</div>
                    <div className="text-[12px] text-muted-foreground">{redFlag ? formatThaiDate(redFlag.assessedAt) : ""}</div>
                  </div>
                  {redFlag ? <OutcomeChip outcome={redFlag.result} /> : <span className="text-[12.5px] font-semibold text-muted-foreground">ยังไม่ได้ประเมิน</span>}
                </div>
                {nineS ? (
                  <div className="rounded-lg bg-surface px-3.5 py-2.5">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <div className="text-[13.5px] font-medium">9S</div>
                        <div className="text-[12px] text-muted-foreground">{formatThaiDate(nineS.assessedAt)}</div>
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
                  <p className="px-1 text-[12.5px] text-muted-foreground">9S: ยังไม่ได้ประเมิน (ทำเมื่อ Red Flag ปกติ)</p>
                )}
              </div>
            ) : (
              <p className="py-4 text-sm text-muted-foreground">ยังไม่มีผล Red Flag และ 9S</p>
            )}
          </CardContent>
        </Card>
      )}

      {d.sdqRounds.length > 0 &&
        d.sdqRounds.map((round) => (
          <Card key={round}>
            <CardContent className="p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h3 className="text-[15.5px] font-bold">ผลการประเมิน SDQ รอบที่ {round} (3 ผู้ประเมิน)</h3>
                {isCurrent && round === store.sdqRound && (
                  <>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11.5px] font-semibold text-muted-foreground">{REVIEW_STATE_LABEL[store.sdqReview(studentId).state]}</span>
                    <span className="flex-1" />
                    <LinkButton variant="outline" href={`/assessment/review/${studentId}`}>
                      ตรวจผล SDQ / EQ
                    </LinkButton>
                  </>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {(["teacher", "student", "parent"] as SdqRater[]).map((rater) => {
                  const rec = d.sdq.find((s) => s.round === round && s.rater === rater);
                  const done = rec?.status === "completed";
                  return (
                    <div key={rater} className={done ? "rounded-xl border border-border p-4" : "rounded-xl border border-dashed border-border bg-surface p-4"}>
                      <div className="text-[12.5px] text-muted-foreground">{SDQ_RATER_LABEL[rater]}</div>
                      {done && rec ? (
                        <>
                          <div className="my-1.5 text-2xl font-bold">
                            {rec.totalDifficulties}
                            <span className="ml-1 text-xs font-medium text-muted-foreground">คะแนน</span>
                          </div>
                          {rec.level && <LevelChip level={rec.level} />}
                        </>
                      ) : (
                        <div className="mt-3 text-[13px] font-medium text-muted-foreground">{rec ? "รอทำแบบประเมิน" : "ไม่ได้ตอบ"}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

      {eq && (
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-3 text-[15.5px] font-bold">EQ (นักเรียนประเมินตนเอง)</h3>
            {eq.status === "completed" && eq.levels ? (
              <div className="grid gap-2 sm:grid-cols-3">
                {EQ_DOMAINS.map((dm) => (
                  <div key={dm} className="rounded-lg bg-surface px-3.5 py-2.5">
                    <div className="text-[12.5px] text-muted-foreground">ด้าน{EQ_DOMAIN_LABEL[dm]}</div>
                    <div className="mt-0.5 text-[13.5px] font-semibold">{EQ_LEVEL_LABEL[eq.levels![dm]]}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{eq.status === "declined" ? "นักเรียนเลือกไม่ทำ EQ ในภาคเรียนนี้" : "นักเรียนยังไม่ได้ทำ"}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- ความประพฤติ
export function ConductTab({ studentId, terms }: { studentId: string; terms: string[] }) {
  const store = useStore();
  const cfg = store.behaviorScoreConfig;
  const includesCurrent = terms.includes(CURRENT_TERM.termId);
  const head = useTermData(studentId, terms[0]);
  const score = includesCurrent ? store.behaviorScoreOf(studentId) : head.endScore;
  const year = (includesCurrent ? CURRENT_TERM : termInfoOf(terms[0])).academicYear;

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <div className="text-[12.5px] text-muted-foreground">
                {includesCurrent ? "คะแนนความประพฤติ" : "คะแนนความประพฤติปลายภาค"} · ปีการศึกษา {year}
              </div>
              <div className="text-3xl font-bold tabular-nums">
                {score}
                <span className="ml-1 text-base font-normal text-muted-foreground">/ {cfg.ceiling ?? cfg.startScore}</span>
              </div>
            </div>
            {includesCurrent && store.isBehaviorWatch(studentId) && (
              <span className="rounded-md bg-risk-red px-2.5 py-1 text-[12.5px] font-semibold text-white">เฝ้าระวังระดับ {store.behaviorWatchLevelOf(studentId)}</span>
            )}
          </div>
          <p className="mt-2 text-[12px] text-muted-foreground">คะแนนเริ่มที่ {cfg.startScore} ใหม่ทุกปีการศึกษา ภาคเรียนในปีเดียวกันคะแนนสะสมต่อกัน</p>
          {includesCurrent && store.watchWithdrawalPending(studentId) && <WatchWithdrawal studentId={studentId} className="mt-3" />}
        </CardContent>
      </Card>

      {terms.map((t) => (
        <ConductTerm key={t} studentId={studentId} termId={t} showHeading={terms.length > 1} />
      ))}
    </div>
  );
}

function ConductTerm({ studentId, termId, showHeading }: { studentId: string; termId: string; showHeading: boolean }) {
  const store = useStore();
  const d = useTermData(studentId, termId);
  return (
    <section>
      <TermHeading termId={termId} show={showHeading} />
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-2 text-[15.5px] font-bold">ประวัติความประพฤติ · {d.records.length} รายการ</h3>
          <div className="divide-y divide-border">
            {d.records.map((rec) => {
              const rule = store.behaviorRules.find((r) => r.ruleId === rec.ruleId);
              const positive = recordScoreDelta(rec, rule) > 0;
              const refer = rule ? ruleKind(rule) === "refer" : false;
              return (
                <div key={rec.recordId} className="flex items-center gap-3 py-2.5">
                  <span className="w-32 shrink-0 text-[12.5px] text-muted-foreground">{formatThaiDateTime(rec.occurredAt)}</span>
                  <span className="min-w-0 flex-1 text-[13.5px]">
                    <span className={rec.cancelled ? "text-muted-foreground line-through" : ""}>{rule?.name}</span>
                    {(rule?.cancelled || rec.cancelled) && (
                      <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground">{rec.cancelled ? "ยกเลิกแล้ว ไม่นับคะแนน" : "กฎถูกยกเลิก"}</span>
                    )}
                    {rec.description !== "-" && <span className="block text-[12px] text-muted-foreground">{rec.description}</span>}
                  </span>
                  <span
                    className={
                      refer || rec.cancelled
                        ? "w-12 text-right text-[12px] font-semibold text-muted-foreground line-through"
                        : positive
                          ? "w-12 text-right text-sm font-bold text-risk-green"
                          : "w-12 text-right text-sm font-bold text-risk-red"
                    }
                  >
                    {rule ? recordScoreText(rec, rule) : ""}
                  </span>
                  <span className="w-14 text-right text-[12.5px] text-muted-foreground tabular-nums" title="คะแนนคงเหลือหลังรายการนี้">
                    → {store.behaviorScoreAt(studentId, rec.occurredAt)}
                  </span>
                </div>
              );
            })}
            {d.records.length === 0 && <p className="py-4 text-sm text-muted-foreground">ไม่มีบันทึกความประพฤติในภาคเรียนนี้</p>}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

// ---------------------------------------------------------------- การดูแลช่วยเหลือ (เยี่ยมบ้าน + case)
export function CareTab({ studentId, terms }: { studentId: string; terms: string[] }) {
  const store = useStore();
  const ranges = terms.map((t) => termInfoOf(t));
  // case ที่ช่วงเวลา (เปิด → ปิดหรือวันนี้) ทับกับภาคเรียนที่เลือก
  const cases = store.careCases
    .filter((c) => c.studentId === studentId)
    .filter((c) => ranges.some((r) => c.openedAt.slice(0, 10) <= r.end && (c.closedAt ?? DEMO_TODAY).slice(0, 10) >= r.start))
    .sort((a, b) => (a.status === b.status ? b.openedAt.localeCompare(a.openedAt) : a.status === "active" ? -1 : 1));
  const visits = store.appointments
    .filter((a) => a.studentId === studentId && terms.includes(termOfDate(a.proposedDate).termId))
    .sort((a, b) => b.proposedDate.localeCompare(a.proposedDate))
    .map((appointment) => ({ appointment, record: store.homeVisitRecords.find((r) => r.appointmentId === appointment.appointmentId) }));

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15.5px] font-bold">การดูแลช่วยเหลือ (กรณี) · {cases.length}</h3>
            <LinkButton variant="outline" href={`/care-cases?student=${studentId}`}>
              เปิดหน้ากรณี
            </LinkButton>
          </div>
          {cases.length > 0 ? (
            <div className="space-y-5 divide-y divide-border">
              {cases.map((c) => (
                <div key={c.caseId} className="pt-5 first:pt-0">
                  <div className="flex flex-wrap items-center gap-2 text-[13px]">
                    <span className="font-semibold">{c.caseId}</span>
                    <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">{c.status === "active" ? "กำลังดำเนินการ" : "ปิดแล้ว"}</span>
                    <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold">{caseUrgencyText(c)}</span>
                    <span className="text-[12px] text-muted-foreground">เปิด {formatThaiDate(c.openedAt)}</span>
                  </div>
                  <dl className="mt-2 divide-y divide-border text-[13.5px]">
                    {(
                      [
                        ["ที่มา", c.triggerSource],
                        ["วิธีการดูแล", c.careMethods.map((m) => CARE_METHOD_LABEL[m]).join(", ") || "-"],
                        ["เป้าหมาย", c.goal || "ยังไม่วางแผนช่วยเหลือ"],
                        [c.status === "active" ? "ติดตามครั้งถัดไป" : "ผลสรุป", c.status === "active" ? (c.nextFollowupDate ? formatThaiDate(c.nextFollowupDate) : "ยังไม่กำหนด") : (c.closingSummary ?? "-")],
                      ] as [string, string][]
                    ).map(([label, value]) => (
                      <div key={label} className="flex gap-3 py-2">
                        <dt className="w-32 shrink-0 text-[13px] text-muted-foreground">{label}</dt>
                        <dd className="flex-1 font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {c.followups.length > 0 && (
                    <div className="mt-2">
                      <div className="mb-1 text-[12.5px] font-semibold text-muted-foreground">ผลติดตาม ({c.followups.length} ครั้ง)</div>
                      {[...c.followups].reverse().slice(0, 3).map((f) => (
                        <div key={f.followupId} className="py-1.5 text-[13px]">
                          <span className="text-muted-foreground">{formatThaiDate(f.followupDate)} · </span>
                          {f.actionTaken}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">ไม่มีกรณีช่วยเหลือในภาคเรียนที่เลือก</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="mb-3 text-[15.5px] font-bold">การเยี่ยมบ้าน · {visits.length}</h3>
          {visits.length > 0 ? (
            <div className="divide-y divide-border">
              {visits.map(({ appointment, record }) => (
                <div key={appointment.appointmentId} className="flex items-center gap-3 py-2.5">
                  <div className="flex-1">
                    <div className="text-[13.5px] font-medium">
                      {formatThaiDate(appointment.proposedDate)} · {APPOINTMENT_STATUS_LABEL[appointment.status]}
                    </div>
                    {record && (
                      <div className="text-[12px] text-muted-foreground">
                        บันทึกโดย {record.signedBy} · ผู้ให้ข้อมูล {record.informantName} · พบความเสี่ยง {record.riskFindings.length} ข้อ
                      </div>
                    )}
                  </div>
                  {record && (
                    <LinkButton variant="outline" href={`/home-visits/${appointment.appointmentId}/record`}>
                      ดูผลการเยี่ยม
                    </LinkButton>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">ไม่มีนัดเยี่ยมบ้านในภาคเรียนที่เลือก</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- ข้อมูลทั่วไป (ไม่ขึ้นกับภาคเรียน)
export function GeneralTab({ info, studentId, showDc = true }: { info: ReactNode; studentId: string; showDc?: boolean }) {
  const store = useStore();
  const dc = showDc ? store.dcResultOf(studentId) : undefined;
  return (
    <div className="space-y-5">
      {info}
      {dc && (
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-3 text-[15.5px] font-bold">คุณลักษณะอันพึงประสงค์ (ปพ.6)</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {dcCriteria.map((c) => {
                const level = dc.levels[c.criteriaId];
                return (
                  <div key={c.criteriaId} className="flex items-center justify-between rounded-lg bg-surface px-3.5 py-2">
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
                      {level === null || level === undefined ? "รอประเมิน" : DC_LEVEL_LABEL[level]}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11.5px] text-muted-foreground">ผลคุณลักษณะฯ ยังไม่ผูกกับภาคเรียน จึงไม่เปลี่ยนตามตัวกรอง</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- ไทม์ไลน์
export function TimelineTab({ events, terms }: { events: TimelineEvent[]; terms: string[] }) {
  const [kind, setKind] = useState<TimelineKind | "all">("all");
  const kinds = (Object.keys(TIMELINE_KIND_LABEL) as TimelineKind[]).filter((k) => events.some((e) => e.kind === k));
  const shown = events.filter((e) => terms.includes(e.termId) && (kind === "all" || e.kind === kind));

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="ประเภทเหตุการณ์">
        {(["all", ...kinds] as (TimelineKind | "all")[]).map((k) => {
          const n = events.filter((e) => terms.includes(e.termId) && (k === "all" || e.kind === k)).length;
          return (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium ${kind === k ? "border-primary bg-accent text-primary" : "border-border bg-card hover:bg-muted"}`}
            >
              {k === "all" ? "ทั้งหมด" : TIMELINE_KIND_LABEL[k]} <span className="tabular-nums text-muted-foreground">{n}</span>
            </button>
          );
        })}
      </div>

      {terms.map((t) => {
        const list = shown.filter((e) => e.termId === t);
        if (list.length === 0 && terms.length > 1) return null;
        return (
          <section key={t} className="mb-6">
            <h2 className="mb-3 text-[14px] font-bold">
              {termInfoOf(t).label} <span className="ml-1 text-[12px] font-normal text-muted-foreground">{list.length} เหตุการณ์</span>
            </h2>
            {list.length === 0 ? (
              <p className="text-sm text-muted-foreground">ไม่มีเหตุการณ์ในภาคเรียนนี้</p>
            ) : (
              <ol className="relative ml-2 space-y-4 border-l border-border pl-6">
                {list.map((e) => (
                  <li key={e.id} className="relative">
                    <span className={`absolute top-1.5 -left-[31px] size-2.5 rounded-full border-2 border-card ${e.alert ? "bg-risk-red" : "bg-muted-foreground/50"}`} />
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-[12px] text-muted-foreground">{formatThaiDateTime(e.at).replace(/\s*·\s*00:00 น\.$/, "")}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{TIMELINE_KIND_LABEL[e.kind]}</span>
                    </div>
                    <div className={`mt-0.5 flex flex-wrap items-center gap-2 text-[14px] font-semibold ${e.strike ? "text-muted-foreground line-through" : ""}`}>
                      {e.href ? (
                        <Link href={e.href} className="hover:text-primary hover:underline">
                          {e.title}
                        </Link>
                      ) : (
                        e.title
                      )}
                      {e.risk && <RiskBadge group={e.risk} short />}
                    </div>
                    {e.detail && <div className="text-[12.5px] text-muted-foreground">{e.detail}</div>}
                  </li>
                ))}
              </ol>
            )}
          </section>
        );
      })}
      {shown.length === 0 && terms.length === 1 && null}
    </div>
  );
}
