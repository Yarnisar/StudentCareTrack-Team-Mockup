"use client";

import { useState } from "react";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatThaiDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { DC_LEVEL_LABEL, DC_LEVELS, type DcLevel } from "@/lib/types";
import { DC_LEVEL_STYLE } from "./dc-level";

/**
 * หน้าบันทึกคะแนนคุณลักษณะอันพึงประสงค์ (ปพ.5) ของครูประจำวิชา
 * 1 วิชาให้คะแนนได้ 1 ครั้งต่อตัวชี้วัดต่อนักเรียน (แก้ภายหลังได้ ระบบเก็บประวัติใน audit log)
 * ใส่ key={teachingId} เพื่อล้างร่างเมื่อเปลี่ยนรายวิชา
 */
export function DcScoreEntry({ teachingId }: { teachingId: string }) {
  const store = useStore();
  const teaching = store.teachingOf(teachingId);
  const [criteriaId, setCriteriaId] = useState(1);
  const [draft, setDraft] = useState<Record<string, DcLevel>>({});
  const [fillLevel, setFillLevel] = useState<DcLevel>(3);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (!teaching) return null;
  const subject = store.subjectOf(teaching.subjectId);
  const roomName = store.classrooms.find((c) => c.roomId === teaching.roomId)?.roomName ?? teaching.roomId;
  const roomStudents = store.studentsOfRoom(teaching.roomId);
  const canEdit = store.canEnterDcScores(teachingId);
  const submission = store.subjectSubmissionsOf(teaching.roomId, teaching.termId).find((s) => s.teachingId === teachingId);
  const deadline = store.dcDeadlineOf(teaching.termId);
  const deadlinePassed = store.isDcDeadlinePassed(teaching.termId);

  const key = (studentId: string, indicatorId: string) => `${studentId}|${indicatorId}`;
  const savedLevel = (studentId: string, indicatorId: string) =>
    store.dcScoreOf(studentId, indicatorId, teaching.subjectId, teaching.termId)?.level;
  const valueOf = (studentId: string, indicatorId: string) =>
    draft[key(studentId, indicatorId)] ?? savedLevel(studentId, indicatorId);

  const indicatorsOf = (cid: number) => store.dcIndicators.filter((i) => i.criteriaId === cid);
  const indicators = indicatorsOf(criteriaId);
  const criteriaFilled = (cid: number) =>
    roomStudents.every((s) => indicatorsOf(cid).every((i) => valueOf(s.studentId, i.indicatorId) !== undefined));

  const unsaved = Object.entries(draft).filter(([k, v]) => {
    const [sid, iid] = k.split("|");
    return savedLevel(sid, iid) !== v;
  }).length;

  const setCell = (studentId: string, indicatorId: string, level: DcLevel) => {
    setMessage(null);
    setDraft((d) => ({ ...d, [key(studentId, indicatorId)]: level }));
  };

  const fillEmpty = (allCriteria: boolean) => {
    const targets = allCriteria ? store.dcIndicators : indicators;
    setMessage(null);
    setDraft((d) => {
      const next = { ...d };
      for (const s of roomStudents)
        for (const i of targets) {
          const k = key(s.studentId, i.indicatorId);
          if ((next[k] ?? savedLevel(s.studentId, i.indicatorId)) === undefined) next[k] = fillLevel;
        }
      return next;
    });
  };

  const save = () => {
    const entries = Object.entries(draft).map(([k, level]) => {
      const [studentId, indicatorId] = k.split("|");
      return { studentId, indicatorId, level };
    });
    const result = store.saveDcScores(teachingId, entries);
    if (result.ok) {
      setDraft({});
      setMessage({ ok: true, text: result.count > 0 ? `บันทึกคะแนนแล้ว ${result.count} ช่อง` : "ไม่มีคะแนนที่เปลี่ยนแปลง" });
    } else {
      setMessage({ ok: false, text: result.error });
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15.5px] font-bold">
              บันทึกคะแนนคุณลักษณะอันพึงประสงค์ (ปพ.5) · {subject?.subjectCode} {subject?.name} {roomName}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              ให้คะแนน 0–3 ทุกตัวชี้วัด รายวิชาจะนับว่าส่งแล้วเมื่อให้คะแนนครบทุกคน
            </p>
          </div>
          {submission?.submitted ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-risk-green-bg px-3 py-1 text-[12px] font-semibold text-risk-green">
              <CheckCircle2 className="size-3.5" /> ส่งครบแล้ว
            </span>
          ) : (
            <span className="rounded-full bg-risk-amber-bg px-3 py-1 text-[12px] font-semibold text-risk-amber">
              ให้คะแนนแล้ว {submission?.filled ?? 0}/{submission?.total ?? 0} ช่อง
            </span>
          )}
        </div>

        {deadline && (
          <div
            className={`mb-4 flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-[12.5px] ${
              deadlinePassed && !submission?.submitted ? "bg-risk-amber-bg text-risk-amber" : "bg-surface text-muted-foreground"
            }`}
          >
            <CalendarClock className="size-4 shrink-0" />
            กำหนดส่งคะแนน {formatThaiDate(deadline.date)} (ข้อมูลจากงานวิชาการ)
            {deadlinePassed &&
              !submission?.submitted &&
              " — เลยกำหนดแล้ว ยังบันทึกได้ แต่ครูประจำชั้นอาจสรุปผลไปก่อนโดยระบุว่ารายวิชานี้ยังไม่ส่ง"}
          </div>
        )}

        {/* เลือกคุณลักษณะ */}
        <div className="mb-4 flex flex-wrap gap-2">
          {store.dcCriteria.map((c) => {
            const active = c.criteriaId === criteriaId;
            const done = criteriaFilled(c.criteriaId);
            return (
              <button
                key={c.criteriaId}
                type="button"
                onClick={() => setCriteriaId(c.criteriaId)}
                className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold ${
                  active ? "border-primary bg-accent text-primary" : "border-border hover:bg-muted/50"
                }`}
              >
                {c.criteriaId}. {c.shortName}
                {done && <CheckCircle2 className="ml-1 inline size-3.5 text-risk-green" />}
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="pb-2.5 text-left text-[12px] font-semibold text-muted-foreground">นักเรียน</th>
                {indicators.map((i) => (
                  <th key={i.indicatorId} className="max-w-48 px-2 pb-2.5 text-center align-bottom text-[11.5px] font-semibold text-muted-foreground">
                    <span className="block text-foreground">ตัวชี้วัด {i.code}</span>
                    <span className="block font-normal">{i.description}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roomStudents.map((s) => (
                <tr key={s.studentId} className="border-b border-border">
                  <td className="py-2.5 pr-3">
                    <div className="text-[13.5px] font-semibold">{s.fullName}</div>
                    <div className="text-[11.5px] text-muted-foreground">เลขที่ {s.classNo}</div>
                  </td>
                  {indicators.map((i) => {
                    const value = valueOf(s.studentId, i.indicatorId);
                    const dirty = draft[key(s.studentId, i.indicatorId)] !== undefined && savedLevel(s.studentId, i.indicatorId) !== value;
                    return (
                      <td key={i.indicatorId} className="px-2 py-2.5 text-center">
                        <div className={`inline-flex gap-1 rounded-lg p-0.5 ${dirty ? "ring-2 ring-primary/40" : ""}`}>
                          {[0, 1, 2, 3].map((n) => {
                            const lv = n as DcLevel;
                            const selected = value === lv;
                            return (
                              <button
                                key={lv}
                                type="button"
                                disabled={!canEdit}
                                title={DC_LEVEL_LABEL[lv]}
                                onClick={() => setCell(s.studentId, i.indicatorId, lv)}
                                className={`size-7 rounded-md text-[12.5px] font-bold ${
                                  selected ? DC_LEVEL_STYLE[lv] : "border border-border text-muted-foreground hover:bg-muted"
                                } disabled:cursor-not-allowed`}
                              >
                                {lv}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {canEdit && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
              <span className="text-muted-foreground">ช่องว่างให้ระดับ</span>
              <select
                value={fillLevel}
                onChange={(e) => setFillLevel(Number(e.target.value) as DcLevel)}
                className="h-8 rounded-lg border border-border bg-card px-2 text-[12.5px]"
              >
                {DC_LEVELS.map((lv) => (
                  <option key={lv} value={lv}>
                    {lv} {DC_LEVEL_LABEL[lv]}
                  </option>
                ))}
              </select>
              <Button size="sm" variant="outline" onClick={() => fillEmpty(false)}>
                เติมในด้านนี้
              </Button>
              <Button size="sm" variant="outline" onClick={() => fillEmpty(true)}>
                เติมทุกด้าน
              </Button>
            </div>
            <div className="flex items-center gap-3">
              {message && (
                <span className={`text-[12.5px] font-semibold ${message.ok ? "text-risk-green" : "text-risk-red"}`}>
                  {message.text}
                </span>
              )}
              {unsaved > 0 && !message && (
                <span className="text-[12.5px] text-muted-foreground">ยังไม่บันทึก {unsaved} ช่อง</span>
              )}
              <Button onClick={save} disabled={unsaved === 0}>
                บันทึกคะแนน
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
