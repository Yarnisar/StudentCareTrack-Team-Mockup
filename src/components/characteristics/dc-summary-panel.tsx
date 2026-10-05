"use client";

import { useState } from "react";
import { AlertTriangle, CalendarClock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatThaiDate, formatThaiDateTime } from "@/lib/format";
import { useStore, type DcOverrides } from "@/lib/store";
import { DC_LEVEL_LABEL, DC_LEVELS, type DcLevel } from "@/lib/types";
import { DC_LEVEL_STYLE, DcLevelChip } from "./dc-level";

/**
 * สรุปคุณลักษณะอันพึงประสงค์ (ปพ.6) ของห้อง
 * - ครูประจำชั้น: เห็นค่าที่ระบบเสนอ (ฐานนิยม) แก้รายช่องได้พร้อมเหตุผล แล้วสรุปทั้งห้อง
 * - บุคลากรอื่น: ดูได้อย่างเดียว (คุณลักษณะฯ ไม่ใช่ข้อมูลอ่อนไหว)
 * ใส่ key={roomId} เพื่อเริ่มร่างใหม่เมื่อเปลี่ยนห้อง
 */
export function DcSummaryPanel({ roomId }: { roomId: string }) {
  const store = useStore();
  const termId = store.currentTerm.termId;
  const roomStudents = store.studentsOfRoom(roomId);
  const isHomeroom = store.myHomeroomRoomIds.includes(roomId);
  const readiness = store.dcSummaryReadiness(roomId);
  const submissions = store.subjectSubmissionsOf(roomId);
  const submittedCount = submissions.filter((s) => s.submitted).length;

  // ร่างเริ่มจากการแก้ที่สรุปไว้แล้ว เพื่อให้สรุปซ้ำไม่ทับเหตุผลเดิม
  const [overrides, setOverrides] = useState<DcOverrides>(() => {
    const init: DcOverrides = {};
    for (const r of store.dcSummaryRows)
      if (r.termId === termId && r.adjustReason && roomStudents.some((s) => s.studentId === r.studentId))
        init[r.studentId] = { ...init[r.studentId], [r.criteriaId]: { level: r.level, reason: r.adjustReason } };
    return init;
  });
  const [selected, setSelected] = useState<{ studentId: string; criteriaId: number } | null>(null);
  const [notifiedCount, setNotifiedCount] = useState<number | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const draftLevel = (studentId: string, criteriaId: number) =>
    overrides[studentId]?.[criteriaId]?.level ?? store.suggestedDcLevelOf(studentId, criteriaId);
  const isAdjusted = (studentId: string, criteriaId: number) => {
    const o = overrides[studentId]?.[criteriaId];
    return !!o && o.level !== store.suggestedDcLevelOf(studentId, criteriaId);
  };

  const setOverride = (studentId: string, criteriaId: number, patch: Partial<{ level: DcLevel; reason: string }>) => {
    setMessage(null);
    setOverrides((prev) => {
      const current = prev[studentId]?.[criteriaId];
      const suggested = store.suggestedDcLevelOf(studentId, criteriaId);
      const level = patch.level ?? current?.level ?? suggested;
      if (level === null) return prev;
      const next = { level, reason: patch.reason ?? current?.reason ?? "" };
      return { ...prev, [studentId]: { ...prev[studentId], [criteriaId]: next } };
    });
  };
  const clearOverride = (studentId: string, criteriaId: number) => {
    setMessage(null);
    setOverrides((prev) => {
      const rest = { ...prev[studentId] };
      delete rest[criteriaId];
      return { ...prev, [studentId]: rest };
    });
  };

  const summarize = () => {
    const result = store.summarizeDcRoom(roomId, overrides);
    setMessage(
      result.ok
        ? { ok: true, text: `สรุปผล ปพ.6 แล้ว ${roomStudents.length} คน` }
        : { ok: false, text: result.error }
    );
    if (result.ok) setSelected(null);
  };

  const anySummarized = roomStudents.some((s) => store.dcSummaryOf(s.studentId, termId));
  const missingReasons = Object.entries(overrides).some(([sid, byCriteria]) =>
    Object.entries(byCriteria).some(([cid, o]) => o.level !== store.suggestedDcLevelOf(sid, Number(cid)) && !o.reason.trim())
  );

  const sel = selected && {
    ...selected,
    student: store.getStudent(selected.studentId),
    criteria: store.dcCriteria.find((c) => c.criteriaId === selected.criteriaId),
    suggested: store.suggestedDcLevelOf(selected.studentId, selected.criteriaId),
    override: overrides[selected.studentId]?.[selected.criteriaId],
    distribution: (() => {
      const ids = new Set(store.dcIndicators.filter((i) => i.criteriaId === selected.criteriaId).map((i) => i.indicatorId));
      const scores = store.dcScores.filter(
        (s) => s.studentId === selected.studentId && s.termId === termId && ids.has(s.indicatorId)
      );
      return {
        counts: DC_LEVELS.map((lv) => [lv, scores.filter((s) => s.level === lv).length] as const),
        total: scores.length,
        subjects: new Set(scores.map((s) => s.subjectId)).size,
      };
    })(),
  };

  return (
    <div className="space-y-5">
      {readiness.deadline && (
        <div className="flex items-center gap-2.5 rounded-xl bg-surface px-4 py-2.5 text-[12.5px] text-muted-foreground">
          <CalendarClock className="size-4 shrink-0" />
          กำหนดส่งคะแนน ปพ.5 ของภาคเรียนนี้ {formatThaiDate(readiness.deadline.date)} (ข้อมูลจากงานวิชาการ)
          {store.isDcDeadlinePassed() && " · เลยกำหนดแล้ว"}
        </div>
      )}

      {readiness.pending.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-risk-amber-bg px-4 py-3.5">
          <AlertTriangle className="size-5 shrink-0 text-risk-amber" />
          <p className="flex-1 text-[13.5px] text-risk-amber">
            ยังมี <b>{readiness.pending.length} รายวิชา</b> ที่ครูประจำวิชายังให้คะแนน (ปพ.5) ไม่ครบ —{" "}
            {readiness.status === "deadline_passed"
              ? "เลยกำหนดส่งแล้ว จึงสรุปเป็น ปพ.6 ได้ ระบบจะบันทึกรายวิชาที่ยังไม่ส่งไว้กับผลสรุป"
              : "สรุปเป็น ปพ.6 ได้เมื่อส่งครบทุกวิชา หรือเมื่อเลยกำหนดส่งแล้ว"}
          </p>
          {(isHomeroom || store.currentUser.role === "admin_school") &&
            (notifiedCount === null ? (
              <Button size="sm" variant="outline" onClick={() => setNotifiedCount(store.requestPendingDcScores(roomId))}>
                ส่งการแจ้งเตือน
              </Button>
            ) : (
              <span className="text-[12.5px] font-semibold text-risk-amber">
                แจ้งเตือนครูประจำวิชาแล้ว {notifiedCount} คน
              </span>
            ))}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <h2 className="text-[15.5px] font-bold">ผลการประเมินคุณลักษณะอันพึงประสงค์ 8 ด้าน</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isHomeroom
                  ? "ตัวเลขเริ่มต้นคือฐานนิยมของคะแนนทุกตัวชี้วัดจากทุกรายวิชา (ค่าที่ระบบเสนอ) — กดช่องเพื่อแก้ระดับพร้อมเหตุผล"
                  : "ช่องเส้นประ = ค่าที่ระบบเสนอ ยังไม่ได้สรุป · ครูประจำชั้นเป็นผู้สรุป"}
              </p>
            </div>

            {roomStudents.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-muted-foreground">ห้องนี้ยังไม่มีนักเรียน</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="pb-2.5 text-left text-[12px] font-semibold text-muted-foreground">นักเรียน</th>
                      {store.dcCriteria.map((c) => (
                        <th key={c.criteriaId} className="pb-2.5 text-center text-[11.5px] font-semibold text-muted-foreground">
                          {c.shortName}
                        </th>
                      ))}
                      <th className="pb-2.5 text-right text-[12px] font-semibold text-muted-foreground">สถานะ ปพ.6</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomStudents.map((student) => {
                      const summary = store.dcSummaryOf(student.studentId, termId);
                      const missing = store.missingSubjectsOf(student.studentId);
                      const changedSinceSummary =
                        !!summary &&
                        store.dcCriteria.some((c) => summary.levels[c.criteriaId] !== draftLevel(student.studentId, c.criteriaId));
                      return (
                        <tr key={student.studentId} className="border-b border-border">
                          <td className="py-2.5">
                            <div className="text-[13.5px] font-semibold">{student.fullName}</div>
                            <div className="text-[11.5px] text-muted-foreground">เลขที่ {student.classNo}</div>
                          </td>
                          {store.dcCriteria.map((c) => {
                            const level = isHomeroom
                              ? draftLevel(student.studentId, c.criteriaId)
                              : (summary?.levels[c.criteriaId] ?? store.suggestedDcLevelOf(student.studentId, c.criteriaId));
                            const dashed = isHomeroom ? !summary && !isAdjusted(student.studentId, c.criteriaId) : !summary;
                            const active = selected?.studentId === student.studentId && selected.criteriaId === c.criteriaId;
                            return (
                              <td key={c.criteriaId} className="py-2.5 text-center">
                                {isHomeroom ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelected({ studentId: student.studentId, criteriaId: c.criteriaId })}
                                    className={`rounded-lg p-0.5 ${active ? "ring-2 ring-primary" : "hover:bg-muted"}`}
                                    title={`แก้ระดับด้าน${c.name}`}
                                  >
                                    <DcLevelChip
                                      level={level}
                                      dashed={dashed}
                                      marked={isAdjusted(student.studentId, c.criteriaId)}
                                    />
                                  </button>
                                ) : (
                                  <DcLevelChip level={level} dashed={dashed} />
                                )}
                              </td>
                            );
                          })}
                          <td className="py-2.5 text-right">
                            {summary ? (
                              <div>
                                <span className="rounded-full bg-risk-green-bg px-2.5 py-1 text-[11.5px] font-semibold text-risk-green">
                                  สรุปแล้ว
                                </span>
                                {changedSinceSummary && isHomeroom && (
                                  <div className="mt-1 text-[11px] text-primary">มีการเปลี่ยนแปลง ยังไม่สรุปใหม่</div>
                                )}
                                {summary.missingSubjects.length > 0 && (
                                  <div className="mt-1 text-[11px] text-risk-amber">
                                    สรุปขณะยังไม่ส่ง: {summary.missingSubjects.join(", ")}
                                  </div>
                                )}
                              </div>
                            ) : missing.length > 0 ? (
                              <span className="text-[12px] font-semibold text-risk-amber">รอ {missing.length} วิชา</span>
                            ) : (
                              <span className="text-[12px] font-semibold text-primary">พร้อมสรุป</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* แก้ระดับรายช่อง */}
            {isHomeroom && sel?.student && sel.criteria && (
              <div className="mt-5 rounded-xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[13.5px] font-bold">
                      {sel.student.fullName} · ด้าน{sel.criteria.name}
                    </div>
                    <div className="mt-0.5 text-[12px] text-muted-foreground">
                      ค่าที่ระบบเสนอ (ฐานนิยม):{" "}
                      <b>{sel.suggested === null ? "ยังไม่มีคะแนน" : `${sel.suggested} ${DC_LEVEL_LABEL[sel.suggested]}`}</b>
                      {sel.distribution.total > 0 &&
                        ` · จาก ${sel.distribution.total} คะแนน ${sel.distribution.subjects} วิชา (${sel.distribution.counts
                          .filter(([, n]) => n > 0)
                          .map(([lv, n]) => `ระดับ ${lv} × ${n}`)
                          .join(", ")})`}
                    </div>
                  </div>
                  <button type="button" onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="size-4" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {DC_LEVELS.map((lv) => {
                    const current = sel.override?.level ?? sel.suggested;
                    return (
                      <button
                        key={lv}
                        type="button"
                        onClick={() =>
                          lv === sel.suggested
                            ? clearOverride(sel.studentId, sel.criteriaId)
                            : setOverride(sel.studentId, sel.criteriaId, { level: lv })
                        }
                        className={`rounded-lg px-3 py-1.5 text-[12.5px] font-semibold ${
                          current === lv ? DC_LEVEL_STYLE[lv] : "border border-border bg-card hover:bg-muted"
                        }`}
                      >
                        {lv} {DC_LEVEL_LABEL[lv]}
                      </button>
                    );
                  })}
                  {sel.override && (
                    <Button size="sm" variant="ghost" onClick={() => clearOverride(sel.studentId, sel.criteriaId)}>
                      ใช้ค่าที่ระบบเสนอ
                    </Button>
                  )}
                </div>
                {sel.override && sel.override.level !== sel.suggested && (
                  <div className="mt-3">
                    <label className="text-[12.5px] font-semibold">
                      เหตุผลที่ต่างจากค่าที่ระบบเสนอ <span className="text-risk-red">*</span>
                    </label>
                    <Textarea
                      className="mt-1.5 bg-card"
                      value={sel.override.reason}
                      onChange={(e) => setOverride(sel.studentId, sel.criteriaId, { reason: e.target.value })}
                      placeholder="เช่น สังเกตพฤติกรรมเพิ่มเติมจากกิจกรรมโฮมรูม"
                      aria-invalid={!sel.override.reason.trim()}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12px] text-muted-foreground">
                ระดับคุณภาพที่ระบบเสนอ = ฐานนิยมของคะแนนตัวชี้วัดในด้านนั้นจากทุกรายวิชา (ค่าเท่ากันเลือกระดับที่ต่ำกว่า)
              </p>
              {isHomeroom && (
                <div className="flex items-center gap-3">
                  {message && (
                    <span className={`text-[12.5px] font-semibold ${message.ok ? "text-risk-green" : "text-risk-red"}`}>
                      {message.text}
                    </span>
                  )}
                  <Button disabled={!readiness.allowed || missingReasons} onClick={summarize}>
                    {!readiness.allowed
                      ? "สรุปผลเป็น ปพ.6 (รอข้อมูลครบหรือเลยกำหนดส่ง)"
                      : missingReasons
                        ? "ใส่เหตุผลให้ครบก่อนสรุป"
                        : anySummarized
                          ? "สรุปผลเป็น ปพ.6 อีกครั้ง"
                          : "สรุปผลเป็น ปพ.6"}
                  </Button>
                </div>
              )}
            </div>
            {isHomeroom && anySummarized && (
              <p className="mt-2 text-right text-[11.5px] text-muted-foreground">
                สรุปล่าสุด{" "}
                {(() => {
                  const s = roomStudents.map((st) => store.dcSummaryOf(st.studentId, termId)).find(Boolean);
                  return s?.summarizedAt ? `${formatThaiDateTime(s.summarizedAt)} โดย ${store.nameOf(s.summarizedBy)}` : "";
                })()}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-[15px] font-bold">เกณฑ์ระดับคุณภาพ</h3>
              <p className="mt-0.5 mb-3 text-[11.5px] text-muted-foreground">ตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พ.ศ. 2551</p>
              <div className="space-y-2">
                {DC_LEVELS.map((level) => (
                  <div key={level} className="flex items-center gap-3">
                    <DcLevelChip level={level} />
                    <span className="text-[13px]">
                      {DC_LEVEL_LABEL[level]} ({level} คะแนน)
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 border-t border-border pt-3 text-[12px] leading-relaxed text-muted-foreground">
                นักเรียนต้องได้ระดับ &quot;ผ่าน&quot; ขึ้นไปทุกด้าน จึงจะผ่านเกณฑ์การจบช่วงชั้น
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[15px] font-bold">สถานะการส่ง ปพ.5 รายวิชา</h3>
                <span
                  className={`text-[12.5px] font-bold ${
                    submittedCount === submissions.length ? "text-risk-green" : "text-risk-amber"
                  }`}
                >
                  {submittedCount} / {submissions.length}
                </span>
              </div>
              <div className="divide-y divide-border">
                {submissions.map((s) => (
                  <div key={s.teachingId} className="flex items-center justify-between py-2.5">
                    <div>
                      <div className="text-[13.5px] font-medium">{s.subject}</div>
                      <div className="text-[11.5px] text-muted-foreground">{store.nameOf(s.teacherId)}</div>
                    </div>
                    <span
                      className={
                        s.submitted
                          ? "rounded-full bg-risk-green-bg px-2.5 py-1 text-[11.5px] font-semibold text-risk-green"
                          : "rounded-full bg-risk-amber-bg px-2.5 py-1 text-[11.5px] font-semibold text-risk-amber"
                      }
                    >
                      {s.submitted ? "ส่งแล้ว" : s.filled > 0 ? `ให้คะแนนแล้ว ${s.filled}/${s.total}` : "รอส่งผล"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
