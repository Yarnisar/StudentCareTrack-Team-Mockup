"use client";

/**
 * รายการบันทึกความประพฤติ: ตารางเต็มความกว้าง รายละเอียดเหตุการณ์ตัดบรรทัดเอง จอแคบเปลี่ยนเป็นการ์ดรายการ
 * - แถวที่ผู้ใช้บันทึกเองและยังอยู่ในระยะเวลาแก้ไข กดที่แถวเพื่อแก้ไข/ยกเลิก มีไอคอนดินสอบอก (UC8 สถานการณ์ B)
 * - ปุ่มกรองแถวเดียว: ทั้งหมด / เฝ้าระวัง / ใกล้เกณฑ์ / ของฉัน / แก้ไขได้ (ปุ่มที่เป็น 0 ไม่แสดง)
 *   เฝ้าระวังและใกล้เกณฑ์กรองตามสถานะของ "นักเรียน" กดชื่อนักเรียนในตารางเพื่อกรองเหลือคนนั้น
 * - คะแนนคงเหลือหลังรายการนั้น อยู่หน้าชื่อนักเรียนเป็นตัวเลขใหญ่ ถึงเกณฑ์เฝ้าระวังใช้สีแดง (ผู้ใช้กำหนดให้ใช้แดงในหน้านี้)
 *   ใกล้เกณฑ์ใช้สีน้ำเงิน ปกติเป็นสีกลาง
 * - เห็นสถานะและคะแนนรวมเฉพาะครูประจำชั้นของนักเรียนห้องตน (ตารางขอบเขตสิทธิ์)
 */

import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { recordScoreDelta } from "@/lib/behavior-rules";
import { NEAR_WATCH_POINTS, watchLevelOf } from "@/lib/behavior-score";
import { formatThaiDate, formatThaiTime } from "@/lib/format";
import { ROLE_INFO, TEACHER_ASSIGNMENTS } from "@/lib/roles";
import { useStore } from "@/lib/store";
import type { BehaviorRecord } from "@/lib/types";
import { EditBehaviorRecord } from "./edit-record";
import { Evidence, ScoreChip, useRuleOf } from "./record-parts";

type FilterKey = "all" | "watch" | "near" | "mine" | "editable";

interface Risk {
  kind: "watch" | "near";
  text: string;
}

export function RecordsTable({ records }: { records: BehaviorRecord[] }) {
  const store = useStore();
  const ruleOf = useRuleOf();
  const [editing, setEditing] = useState<BehaviorRecord | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [onlyStudent, setOnlyStudent] = useState<string | null>(null);
  const homeroom = TEACHER_ASSIGNMENTS[store.role]?.homeroomRoom;
  const me = ROLE_INFO[store.role].user.name;
  const editable = (rec: BehaviorRecord) => store.behaviorEditable(rec).ok;

  // ---- สถานะเสี่ยงรายนักเรียน (เฉพาะห้องที่เป็นครูประจำชั้น)
  const first = store.behaviorScoreConfig.watchLevels[0]?.atOrBelow;
  const riskOf = (studentId: string): Risk | null => {
    if (!homeroom || store.getStudent(studentId)?.roomName !== homeroom) return null;
    const score = store.behaviorScoreOf(studentId);
    const level = store.behaviorWatchLevelOf(studentId);
    if (level > 0)
      return { kind: "watch", text: store.watchWithdrawalPending(studentId) ? "รอยืนยันถอนสถานะเฝ้าระวัง" : `เฝ้าระวังระดับ ${level}` };
    if (first !== undefined && score - first <= NEAR_WATCH_POINTS) return { kind: "near", text: `อีก ${score - first} คะแนนถึงเกณฑ์` };
    return null;
  };

  /** คะแนนคงเหลือหลังรายการนั้น (เฉพาะนักเรียนห้องที่เป็นครูประจำชั้น) พร้อมสีตามคะแนน ณ เวลานั้น */
  const remaining = (rec: BehaviorRecord) => {
    if (!homeroom || store.getStudent(rec.studentId)?.roomName !== homeroom) return null;
    const value = store.behaviorScoreAt(rec.studentId, rec.occurredAt);
    const reached = watchLevelOf(value, store.behaviorScoreConfig) > 0;
    const near = !reached && first !== undefined && value - first <= NEAR_WATCH_POINTS;
    return { value, reached, near };
  };

  // แถวล่าสุดของนักเรียนแต่ละคน (ไม่นับที่ยกเลิก) ใช้บอกสถานะ "รอยืนยันถอน" เพียงแถวเดียว
  const latestId = new Map<string, string>();
  for (const r of records) if (!r.cancelled && !latestId.has(r.studentId)) latestId.set(r.studentId, r.recordId);

  /** สีและป้ายของแต่ละแถวตามคะแนนของแถวนั้นเอง จึงเห็นว่านักเรียนข้ามเกณฑ์ที่รายการไหน */
  const rowRisk = (rec: BehaviorRecord): Risk | null => {
    const r = remaining(rec);
    if (!r) return null;
    if (latestId.get(rec.studentId) === rec.recordId && store.watchWithdrawalPending(rec.studentId))
      return { kind: "watch", text: "รอยืนยันถอนสถานะเฝ้าระวัง" };
    if (r.reached) return { kind: "watch", text: `เฝ้าระวังระดับ ${watchLevelOf(r.value, store.behaviorScoreConfig)}` };
    if (r.near && first !== undefined) return { kind: "near", text: `อีก ${r.value - first} คะแนนถึงเกณฑ์` };
    return null;
  };
  const roomStudents = homeroom ? store.students.filter((s) => s.roomName === homeroom) : [];
  const watchStudents = roomStudents.filter((s) => riskOf(s.studentId)?.kind === "watch");
  const nearStudents = roomStudents.filter((s) => riskOf(s.studentId)?.kind === "near");

  // ---- ตัวกรอง
  const match: Record<FilterKey, (r: BehaviorRecord) => boolean> = {
    all: () => true,
    watch: (r) => riskOf(r.studentId)?.kind === "watch",
    near: (r) => riskOf(r.studentId)?.kind === "near",
    mine: (r) => r.recordedByName === me,
    editable: (r) => editable(r),
  };
  const options: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "ทั้งหมด", count: records.length },
    { key: "watch", label: "เฝ้าระวัง", count: watchStudents.length },
    { key: "near", label: "ใกล้เกณฑ์", count: nearStudents.length },
    // ทุกบทบาทเห็นรายการของนักเรียนที่ตนรับผิดชอบหรือสอนทั้งหมด (ตาราง 3.4) จึงมี "ของฉัน" ไว้แยกรายการที่ตนบันทึก
    { key: "mine" as const, label: "ของฉัน", count: records.filter(match.mine).length },
    { key: "editable", label: "แก้ไขได้", count: records.filter(match.editable).length },
  ];
  const shown = records.filter((r) => match[filter](r) && (!onlyStudent || r.studentId === onlyStudent));

  // ---- ส่วนแสดงผล
  const toneRow = (risk: Risk | null) => (risk ? (risk.kind === "watch" ? "bg-risk-red-bg/40" : "bg-accent/60") : "");
  const toneStripe = (risk: Risk | null) =>
    risk ? (risk.kind === "watch" ? "shadow-[inset_4px_0_0_0_var(--risk-red)]" : "shadow-[inset_4px_0_0_0_var(--primary)]") : "";

  const riskTag = (risk: Risk | null) =>
    risk && (
      <span
        className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[11.5px] font-semibold ${
          risk.kind === "watch" ? "bg-risk-red text-white" : "border border-primary/40 text-primary"
        }`}
      >
        {risk.text}
      </span>
    );

  /** ตัวเลขคะแนนคงเหลือหน้าชื่อ: ถึงเกณฑ์ = แดงทึบ, ใกล้เกณฑ์ = กรอบน้ำเงิน, ปกติ = เทา */
  const badge = (rec: BehaviorRecord) => {
    const r = remaining(rec);
    if (!homeroom) return null;
    return (
      <span
        title={r ? "คะแนนคงเหลือหลังรายการนี้" : undefined}
        className={`flex h-10 w-12 shrink-0 items-center justify-center rounded-lg text-[17px] font-bold tabular-nums ${
          !r ? "" : r.reached ? "bg-risk-red text-white" : r.near ? "border border-primary/50 bg-accent text-primary" : "bg-muted text-foreground"
        }`}
      >
        {r?.value}
      </span>
    );
  };

  const studentName = (rec: BehaviorRecord) => {
    const name = store.getStudent(rec.studentId)?.fullName;
    return (
      <button
        type="button"
        title="กรองเหลือเฉพาะคนนี้"
        onClick={(e) => {
          e.stopPropagation();
          setOnlyStudent(rec.studentId);
        }}
        className="text-left font-semibold hover:text-primary hover:underline"
      >
        {name}
      </button>
    );
  };

  const statusNote = (rec: BehaviorRecord) =>
    rec.cancelled ? (
      <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground" title={`${rec.cancelled.by}: ${rec.cancelled.reason}`}>
        ยกเลิกแล้ว
      </span>
    ) : (rec.editHistory ?? []).length > 0 ? (
      <span
        className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground"
        title={rec.editHistory!.map((h) => `${formatThaiDate(h.at)} ${h.by}: ${h.changes.join(", ") || "-"}`).join("\n")}
      >
        แก้ไขแล้ว
      </span>
    ) : null;

  const ruleName = (rec: BehaviorRecord) => {
    const rule = ruleOf(rec.ruleId);
    return (
      <>
        <span className={rec.cancelled ? "text-muted-foreground line-through" : ""}>{rule?.name}</span>
        {rule?.cancelled && <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground">กฎถูกยกเลิก</span>}
        {statusNote(rec)}
      </>
    );
  };

  const score = (rec: BehaviorRecord) => {
    const rule = ruleOf(rec.ruleId);
    return (
      <span className="inline-flex items-center gap-1.5">
        <ScoreChip delta={recordScoreDelta(rec, rule)} cancelled={!!rule?.cancelled || !!rec.cancelled} />
        {editable(rec) ? <Pencil className="size-3.5 text-muted-foreground" aria-label="แก้ไขได้" /> : <span className="size-3.5" />}
      </span>
    );
  };

  /** แถวที่แก้ได้: กดหรือกด Enter เพื่อเปิดหน้าต่างแก้ไข */
  const rowProps = (rec: BehaviorRecord) =>
    editable(rec)
      ? {
          role: "button" as const,
          tabIndex: 0,
          "aria-label": `แก้ไขรายการ ${store.getStudent(rec.studentId)?.fullName} ${ruleOf(rec.ruleId)?.name}`,
          onClick: () => setEditing(rec),
          onKeyDown: (e: React.KeyboardEvent) => e.key === "Enter" && setEditing(rec),
          className: "cursor-pointer hover:bg-muted/40",
        }
      : {
          // ผู้บันทึกเองแต่พ้นระยะเวลาแก้ไข: บอกเหตุผลเมื่อชี้ (Alt-E)
          title: (() => {
            const check = store.behaviorEditable(rec);
            return !check.ok && !rec.cancelled && rec.recordedByName === me ? check.reason : undefined;
          })(),
          className: "",
        };

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-24 sm:p-8 sm:pb-24">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <h2 className="text-[15.5px] font-bold">{homeroom ? `บันทึกของนักเรียน ${homeroom}` : "รายการพฤติกรรมของนักเรียนที่สอน"}</h2>

          <div className="mt-3 mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="กรองรายการ">
            <div className="flex flex-wrap rounded-lg border border-border bg-card p-1">
              {options.map(({ key, label, count }) => {
                if (key !== "all" && count === 0) return null;
                const active = filter === key;
                const unit = key === "watch" || key === "near" ? " คน" : "";
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFilter(key)}
                    className={`rounded-md px-3 py-1.5 text-[13px] ${
                      active
                        ? key === "watch"
                          ? "bg-risk-red font-semibold text-white"
                          : "bg-accent font-semibold text-primary"
                        : key === "watch"
                          ? "font-semibold text-risk-red hover:bg-muted"
                          : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {label} <span className="tabular-nums">{count}</span>
                    {unit}
                  </button>
                );
              })}
            </div>
            {onlyStudent && (
              <button
                type="button"
                onClick={() => setOnlyStudent(null)}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-accent px-3 py-1.5 text-[13px] font-medium text-primary"
              >
                {store.getStudent(onlyStudent)?.fullName}
                <X className="size-3.5" aria-label="ล้างการกรองนักเรียน" />
              </button>
            )}
          </div>

          {/* จอแคบ: การ์ดรายการ */}
          <div className="divide-y divide-border md:hidden">
            {shown.map((rec) => {
              const student = store.getStudent(rec.studentId);
              const risk = rowRisk(rec);
              const p = rowProps(rec);
              return (
                <div key={rec.recordId} {...p} className={`flex gap-3 py-3 pl-3 ${toneRow(risk)} ${toneStripe(risk)} ${p.className}`}>
                  {badge(rec)}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-[14px]">{studentName(rec)}</span>
                      <span className="text-[12px] text-muted-foreground">
                        {student?.studentId} · {student?.roomName} เลขที่ {student?.classNo}
                      </span>
                    </div>
                    {riskTag(risk)}
                    <div className="mt-0.5 text-[13.5px]">{ruleName(rec)}</div>
                    {rec.description !== "-" && <div className="mt-0.5 text-[12.5px] text-muted-foreground">{rec.description}</div>}
                    <Evidence images={rec.evidence} />
                    <div className="mt-1.5 text-[11.5px] text-muted-foreground">
                      {formatThaiDate(rec.occurredAt)} {formatThaiTime(rec.occurredAt)} · {rec.recordedByName}
                    </div>
                  </div>
                  <div className="self-start pr-1">{score(rec)}</div>
                </div>
              );
            })}
          </div>

          <table className="hidden w-full text-[13.5px] md:table">
            <thead>
              <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
                <th className="w-28 py-2 pl-3 font-medium">วันที่</th>
                <th className="w-72 py-2 font-medium">{homeroom ? "คะแนนคงเหลือ · นักเรียน" : "นักเรียน"}</th>
                <th className="w-40 py-2 font-medium">พฤติกรรม</th>
                <th className="py-2 font-medium">รายละเอียดเหตุการณ์</th>
                <th className="w-32 py-2 font-medium">ผู้บันทึก</th>
                <th className="w-20 py-2 font-medium">คะแนน</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((rec) => {
                const student = store.getStudent(rec.studentId);
                const risk = rowRisk(rec);
                const p = rowProps(rec);
                return (
                  <tr key={rec.recordId} {...p} className={`border-b border-border align-top ${toneRow(risk)} ${p.className}`}>
                    <td className={`py-3 pr-3 pl-3 ${toneStripe(risk)}`}>
                      <div>{formatThaiDate(rec.occurredAt)}</div>
                      <div className="text-[11.5px] text-muted-foreground">{formatThaiTime(rec.occurredAt)}</div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex items-start gap-3">
                        {badge(rec)}
                        <div className="min-w-0">
                          {studentName(rec)}
                          <div className="text-[11.5px] text-muted-foreground">
                            {student?.studentId} · {student?.roomName} เลขที่ {student?.classNo}
                          </div>
                          {riskTag(risk)}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3">{ruleName(rec)}</td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {rec.description}
                      <Evidence images={rec.evidence} />
                    </td>
                    <td className="py-3 pr-3 text-[12.5px] text-muted-foreground">{rec.recordedByName}</td>
                    <td className="py-3">{score(rec)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {shown.length === 0 && <p className="py-8 text-center text-[13px] text-muted-foreground">ไม่มีรายการตามตัวกรองนี้</p>}
        </CardContent>
      </Card>

      {editing && <EditBehaviorRecord record={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
