/**
 * ไทม์ไลน์ของนักเรียนคนหนึ่ง: รวมเหตุการณ์จากทุกหมวดเรียงตามเวลา ใช้ติดตามการเปลี่ยนแปลงข้ามภาคเรียน
 * ข้อมูลเดียวกับที่แต่ละแท็บในหน้านักเรียนแสดง ไม่มีข้อมูลใหม่ จึงอยู่ในขอบเขตสิทธิ์เดียวกัน (เฉพาะครูที่ปรึกษาของห้อง)
 */

import { EQ_DOMAIN_LABEL, EQ_DOMAINS, EQ_LEVEL_LABEL } from "./eq";
import { recordScoreDelta, ruleKind, recordScoreText } from "./behavior-rules";
import { clampScore, watchLevelOf } from "./behavior-score";
import type { useStore } from "./store";
import { termOfDate } from "./terms";
import {
  APPOINTMENT_STATUS_LABEL,
  DIMENSION_LABEL,
  SDQ_LEVEL_LABEL,
  SDQ_RATER_LABEL,
  type BehaviorRecord,
  type RiskGroup,
  type SdqRater,
} from "./types";

type Store = ReturnType<typeof useStore>;

export type TimelineKind = "assessment" | "behavior" | "visit" | "care";

export const TIMELINE_KIND_LABEL: Record<TimelineKind, string> = {
  assessment: "คัดกรองและประเมิน",
  behavior: "ความประพฤติ",
  visit: "เยี่ยมบ้าน",
  care: "การช่วยเหลือ",
};

export interface TimelineEvent {
  id: string;
  /** วันเวลา (ISO พ.ศ.) */
  at: string;
  termId: string;
  kind: TimelineKind;
  title: string;
  detail?: string;
  /** ผลคัดกรองของเหตุการณ์นี้ (ใช้สีกลุ่มเสี่ยงเฉพาะผลคัดกรอง) */
  risk?: RiskGroup;
  /** เหตุการณ์ที่ควรสังเกต เช่น เข้าสถานะเฝ้าระวัง */
  alert?: boolean;
  strike?: boolean;
  href?: string;
}

const iso = (d: string) => (d.length === 10 ? `${d}T00:00:00` : d);
const rater = (r: SdqRater) => SDQ_RATER_LABEL[r].replace("ประเมินตนเอง", "").replace("ประเมิน", "");

export function buildTimeline(store: Store, studentId: string): TimelineEvent[] {
  const out: TimelineEvent[] = [];
  const push = (e: Omit<TimelineEvent, "termId" | "at"> & { at: string; termId?: string }) =>
    out.push({ ...e, at: iso(e.at), termId: e.termId ?? termOfDate(e.at).termId });
  const tab = (t: string) => `/students/${studentId}?tab=${t}`;

  // ---- คัดกรอง / ประเมิน
  for (const sc of store.screenings.filter((s) => s.studentId === studentId)) {
    const groups = sc.results.map((r) => r.group);
    const flagged = sc.results.filter((r) => r.group !== "green").map((r) => DIMENSION_LABEL[r.dimension]);
    push({
      id: `sc-${sc.screeningId}`,
      at: sc.screenedAt,
      termId: sc.termId,
      kind: "assessment",
      title: "คัดกรอง 6 มิติ",
      detail: flagged.length > 0 ? `พบ: ${flagged.join(", ")}` : "ไม่พบมิติที่เสี่ยง",
      risk: groups.includes("red") ? "red" : groups.includes("amber") ? "amber" : "green",
      href: tab("screening"),
    });
  }
  for (const r of store.redFlags.filter((x) => x.studentId === studentId))
    push({ id: `rf-${r.id}`, at: r.assessedAt, termId: r.termId, kind: "assessment", title: "Red Flag", detail: r.result === "needs_care" ? "ควรดูแล" : "ปกติ", alert: r.result === "needs_care", href: tab("screening") });
  for (const n of store.nineS.filter((x) => x.studentId === studentId))
    push({ id: `ns-${n.id}`, at: n.assessedAt, termId: n.termId, kind: "assessment", title: "9S", detail: n.result === "needs_care" ? "ควรดูแล" : "ปกติ", alert: n.result === "needs_care", href: tab("screening") });

  const sdqGroups = new Map<string, ReturnType<Store["sdqOf"]>>();
  for (const s of store.sdqOf(studentId).filter((x) => x.status === "completed")) {
    const k = `${s.termId}|${s.round}`;
    sdqGroups.set(k, [...(sdqGroups.get(k) ?? []), s]);
  }
  for (const [k, list] of sdqGroups) {
    const [termId, round] = k.split("|");
    const at = list.map((s) => s.assessedAt ?? "").sort().at(-1) ?? "";
    push({
      id: `sdq-${k}`,
      at,
      termId,
      kind: "assessment",
      title: `SDQ รอบที่ ${round}`,
      detail: (["teacher", "student", "parent"] as SdqRater[])
        .map((r) => {
          const rec = list.find((x) => x.rater === r);
          return rec?.level ? `${rater(r)} ${rec.totalDifficulties} (${SDQ_LEVEL_LABEL[rec.level]})` : `${rater(r)} –`;
        })
        .join(" · "),
      href: tab("screening"),
    });
  }
  for (const e of store.eq.filter((x) => x.studentId === studentId && x.assessedAt)) {
    push({
      id: `eq-${e.id}`,
      at: e.assessedAt!,
      termId: e.termId,
      kind: "assessment",
      title: "EQ",
      detail:
        e.status === "declined"
          ? "นักเรียนเลือกไม่ทำ"
          : e.levels
            ? EQ_DOMAINS.map((d) => `${EQ_DOMAIN_LABEL[d]}: ${EQ_LEVEL_LABEL[e.levels![d]]}`).join(" · ")
            : undefined,
      href: tab("screening"),
    });
  }

  // ---- ประวัติการแก้ไขผลคัดกรองและคำตอบแบบประเมิน (UC6, UC10)
  for (const c of store.changeLog.filter((x) => x.ref === studentId && x.entity !== "rule"))
    push({
      id: `chg-${c.id}`,
      at: c.at,
      kind: "assessment",
      title: c.summary,
      detail: `${c.by} · ${c.changes.map((x) => `${x.label} ${x.from} → ${x.to}`).join(", ")}`,
      href: tab("screening"),
    });

  // ---- ความประพฤติ: ทุกรายการ + เหตุการณ์เฝ้าระวัง (คะแนนเริ่มใหม่ทุกปีการศึกษา)
  const cfg = store.behaviorScoreConfig;
  const first = cfg.watchLevels[0]?.atOrBelow;
  const records = store.behaviorOf(studentId);
  const ruleOf = (id: string) => store.behaviorRules.find((r) => r.ruleId === id);
  const deltaOf = (rec: BehaviorRecord) => {
    const rule = ruleOf(rec.ruleId);
    return rec.cancelled || !rule || rule.cancelled ? 0 : recordScoreDelta(rec, rule);
  };
  for (const rec of records) {
    const rule = ruleOf(rec.ruleId);
    const refer = !!rule && ruleKind(rule) === "refer";
    push({
      id: `bh-${rec.recordId}`,
      at: rec.occurredAt,
      kind: "behavior",
      title: rule?.name ?? "พฤติกรรม",
      strike: !!rec.cancelled,
      detail: rec.cancelled
        ? `ยกเลิกแล้ว: ${rec.cancelled.reason}`
        : refer
          ? `ส่งต่อ · ไม่ปรับคะแนน · ${rec.recordedByName}`
          : `${rule ? recordScoreText(rec, rule) : ""} → คงเหลือ ${store.behaviorScoreAt(studentId, rec.occurredAt)} · ${rec.recordedByName}`,
      href: tab("conduct"),
    });
  }
  const decisions = store.watchDecisions.filter((d) => d.studentId === studentId);
  for (const d of decisions)
    push({
      id: `wd-${d.at}`,
      at: d.at,
      kind: "behavior",
      title: d.withdraw ? "ครูที่ปรึกษายืนยันถอนสถานะเฝ้าระวัง" : "ครูที่ปรึกษาคงสถานะเฝ้าระวังไว้",
      detail: d.withdraw ? undefined : d.reason,
      href: tab("conduct"),
    });
  const years = [...new Set(records.map((r) => termOfDate(r.occurredAt).academicYear))];
  for (const year of years) {
    type Step = { at: string; rec?: BehaviorRecord; withdraw?: boolean };
    const steps: Step[] = [
      ...records.filter((r) => termOfDate(r.occurredAt).academicYear === year).map((rec) => ({ at: rec.occurredAt, rec })),
      ...decisions.filter((d) => d.withdraw && termOfDate(d.at).academicYear === year).map((d) => ({ at: d.at, withdraw: true })),
    ].sort((a, b) => a.at.localeCompare(b.at));
    let score = cfg.startScore;
    let peak = 0;
    for (const step of steps) {
      if (step.withdraw) {
        peak = 0;
        continue;
      }
      const before = score;
      score = clampScore(score + deltaOf(step.rec!), cfg);
      const level = watchLevelOf(score, cfg);
      if (level > peak) {
        push({
          id: `wr-${step.rec!.recordId}`,
          at: step.at,
          kind: "behavior",
          title: peak === 0 ? `เข้าสถานะเฝ้าระวังระดับ ${level}` : `ขึ้นเป็นเฝ้าระวังระดับ ${level}`,
          detail: `คะแนนคงเหลือ ${score}`,
          alert: true,
          href: tab("conduct"),
        });
        peak = level;
      }
      if (first !== undefined && before <= first && score > first && peak > 0)
        push({
          id: `wc-${step.rec!.recordId}`,
          at: step.at,
          kind: "behavior",
          title: "คะแนนกลับเข้าเกณฑ์",
          detail: `คะแนนคงเหลือ ${score} · รอครูที่ปรึกษายืนยันถอนสถานะ`,
          href: tab("conduct"),
        });
    }
  }

  // ---- เยี่ยมบ้าน
  for (const a of store.appointments.filter((x) => x.studentId === studentId)) {
    const record = store.homeVisitRecords.find((r) => r.appointmentId === a.appointmentId);
    push({
      id: `hv-${a.appointmentId}`,
      at: a.proposedDate,
      kind: "visit",
      title: "เยี่ยมบ้าน",
      detail: record
        ? `${APPOINTMENT_STATUS_LABEL[a.status]} · พบความเสี่ยง ${record.riskFindings.length} ข้อ · บันทึกโดย ${record.signedBy}`
        : APPOINTMENT_STATUS_LABEL[a.status],
      href: record ? `/home-visits/${a.appointmentId}/record` : "/home-visits",
    });
  }

  // ---- การช่วยเหลือ
  for (const c of store.careCases.filter((x) => x.studentId === studentId)) {
    const href = `/care-cases?student=${studentId}`;
    push({ id: `cc-${c.caseId}-open`, at: c.openedAt, kind: "care", title: `เปิด case ${c.caseId}`, detail: `ที่มา: ${c.triggerSource}`, alert: true, href });
    for (const f of c.followups) push({ id: `cf-${f.followupId}`, at: f.followupDate, kind: "care", title: `ติดตาม case ${c.caseId}`, detail: f.actionTaken, href });
    if (c.closedAt) push({ id: `cc-${c.caseId}-close`, at: c.closedAt, kind: "care", title: `ปิด case ${c.caseId}`, detail: c.closingSummary, href });
  }

  return out.sort((a, b) => b.at.localeCompare(a.at));
}

/** ภาคเรียนที่นักเรียนคนนี้มีข้อมูล (ใหม่สุดก่อน) รวมภาคเรียนปัจจุบันเสมอ */
export function termsWithData(events: TimelineEvent[], currentTermId: string): string[] {
  return [...new Set([currentTermId, ...events.map((e) => e.termId)])].sort((a, b) => b.localeCompare(a));
}
