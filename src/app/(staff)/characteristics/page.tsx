"use client";

/**
 * ประเมินคุณลักษณะอันพึงประสงค์ 8 ประการ โดยครูที่ปรึกษา (UC13)
 * - เลือกนักเรียน ถ้าเป็นการประเมินซ้ำแสดงผลครั้งก่อน (ข้อ 2)
 * - แสดงประวัติความประพฤติเป็นหลักฐานประกอบ ไม่แปลงคะแนนความประพฤติเป็นผลโดยอัตโนมัติ (ข้อ 3, 2.1.6)
 * - ให้ระดับแต่ละข้อด้วยปุ่ม บันทึกร่างหรือส่งผล ระบบตรวจว่าครบ 8 ข้อ (ข้อ 4–8, Alt-A, Alt-B)
 * - ผลไม่ผ่าน: แจ้งให้พิจารณาเปิดหรือเชื่อม case ไม่เปิดเอง / ประเมินซ้ำแล้วผ่าน: ให้ทบทวน case เดิม (ข้อ 10–11)
 * - เกณฑ์รายข้อ วิธีสรุปผลรวม และวันปิดส่งผลมาจากรอบที่แอดมินเปิดใช้ (UC12) ไม่มีรอบเปิดหรือพ้นวันปิดส่งผลแล้วส่งผลไม่ได้ (Pre-condition 2–3)
 */

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ruleScoreText } from "@/lib/behavior-rules";
import { DC_SUMMARY_METHOD_LABEL, summarizeDc, type DcSummaryMethod } from "@/lib/dc-round";
import { formatThaiDate } from "@/lib/format";
import { CURRENT_TEACHER, CURRENT_TERM, DEMO_TODAY, dcCriteria } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { DC_LEVEL_LABEL, type DcLevel } from "@/lib/types";

const LEVELS: DcLevel[] = [3, 2, 1, 0];

/** ผลรวมตามวิธีที่แอดมินกำหนดในรอบประเมิน (UC12) */
function overall(levels: Record<number, DcLevel | null>, method: DcSummaryMethod = "min"): DcLevel | null {
  return summarizeDc(dcCriteria.map((c) => levels[c.criteriaId]), method);
}

export default function CharacteristicsPage() {
  const store = useStore();
  const [selected, setSelected] = useState<string | null>(null);
  const round = store.activeDcRound;
  const method = round?.method ?? "min";

  return (
    <>
      <PageHeader title="คุณลักษณะอันพึงประสงค์" subtitle={`ครูที่ปรึกษาประเมิน 8 ประการ · ห้อง ${CURRENT_TEACHER.roomName} · ${CURRENT_TERM.label}`} />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <p className="mb-4 rounded-xl border border-border bg-card px-4 py-3 text-[13px]">
          {round
            ? `รอบ${round.termLabel} · ส่งผลได้ถึง ${formatThaiDate(round.deadline)} · สรุปผลรวมโดย${DC_SUMMARY_METHOD_LABEL[round.method]}`
            : "แอดมินยังไม่เปิดรอบประเมินของภาคเรียนนี้ จึงยังประเมินไม่ได้"}
        </p>
        <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
          <Card className="h-fit">
            <CardContent className="p-5">
              <h2 className="mb-3 text-[15px] font-bold">นักเรียนที่รับผิดชอบ</h2>
              <div className="space-y-2">
                {store.students.map((s) => {
                  const latest = store.latestDc(s.studentId);
                  const result = store.dcResultOf(s.studentId);
                  const total = result ? overall(result.levels, method) : null;
                  const status = !latest
                    ? "ยังไม่ประเมิน"
                    : latest.status === "draft"
                      ? latest.round > 1
                        ? `ร่างประเมินซ้ำ ครั้งที่ ${latest.round}`
                        : "บันทึกร่างไว้"
                      : `ส่งผลแล้ว${latest.round > 1 ? ` ครั้งที่ ${latest.round}` : ""}`;
                  return (
                    <button
                      key={s.studentId}
                      type="button"
                      onClick={() => setSelected(s.studentId)}
                      className={`w-full rounded-xl border p-3 text-left ${selected === s.studentId ? "border-primary bg-accent" : "border-border hover:bg-muted/50"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13.5px] font-semibold">{s.fullName}</span>
                        {total != null && (
                          <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11.5px] font-semibold">{DC_LEVEL_LABEL[total]}</span>
                        )}
                      </div>
                      <div className="mt-1 text-[11.5px] text-muted-foreground">
                        เลขที่ {s.classNo} · {status}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {selected ? (
            <AssessForm key={selected} studentId={selected} />
          ) : (
            <Card>
              <CardContent className="p-10 text-center text-[13px] text-muted-foreground">เลือกนักเรียนเพื่อประเมิน</CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function AssessForm({ studentId }: { studentId: string }) {
  const store = useStore();
  const student = store.getStudent(studentId);
  const latest = store.latestDc(studentId);
  const round = store.activeDcRound;
  const method = round?.method ?? "min";
  const closed = !round || DEMO_TODAY > round.deadline;
  const editing = latest?.status === "draft";
  const previous = store.dcAssessments
    .filter((a) => a.studentId === studentId && a.status === "submitted")
    .sort((a, b) => b.round - a.round)[0];

  const [levels, setLevels] = useState<Record<number, DcLevel | null>>(() => (editing ? latest.levels : {}));
  const [note, setNote] = useState(() => (editing ? latest.note : ""));
  const [showMissing, setShowMissing] = useState(false);
  const [message, setMessage] = useState("");

  if (!student) return null;
  const missing = dcCriteria.filter((c) => levels[c.criteriaId] == null);
  const behaviors = store.behaviorOf(studentId).slice(0, 5);
  const total = overall(levels, method);

  const submit = () => {
    if (missing.length > 0) {
      setShowMissing(true);
      return;
    }
    const before = previous ? overall(previous.levels, method) : null;
    store.saveDcAssessment(studentId, levels, note.trim(), true);
    if (total === 0) setMessage("ส่งผลแล้ว ผลรวมไม่ผ่าน · ระบบแจ้งครูที่ปรึกษาให้พิจารณาเปิดหรือเชื่อม case ช่วยเหลือ");
    else if (before === 0) setMessage("ส่งผลแล้ว ผลประเมินซ้ำเปลี่ยนเป็นผ่าน · ทบทวน case เดิมของนักเรียน");
    else setMessage("ส่งผลแล้ว");
  };

  // ส่งแล้ว: แสดงผลและให้ประเมินซ้ำ
  if (!editing && latest && latest.status === "submitted" && !message) {
    return (
      <Card>
        <CardContent className="p-6">
          <Header name={student.fullName} sub={`ส่งผลแล้ว ครั้งที่ ${latest.round} · ${formatThaiDate(latest.assessedAt)}`} />
          <ResultTable levels={latest.levels} method={method} />
          {latest.note && <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-[13px]">หมายเหตุ: {latest.note}</p>}
          <div className="mt-4 flex justify-end">
            <Button variant="outline" disabled={closed} onClick={() => store.startDcReassessment(studentId)}>
              ประเมินซ้ำ (เก็บผลเดิมไว้)
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (message) {
    const failed = total === 0;
    return (
      <Card>
        <CardContent className="p-6">
          <Header name={student.fullName} sub={message} />
          <ResultTable levels={levels} method={method} />
          {failed && (
            <Link
              href={`/care-cases?student=${studentId}`}
              className="mt-4 inline-flex rounded-lg border border-border px-3 py-2 text-[13px] font-semibold hover:bg-muted"
            >
              ไปพิจารณาเปิด case ช่วยเหลือ
            </Link>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-6">
          <Header
            name={student.fullName}
            sub={`${latest && latest.round > 1 ? `ประเมินซ้ำ ครั้งที่ ${latest.round}` : "ประเมินครั้งแรก"} · ${student.roomName} เลขที่ ${student.classNo}`}
          />
          <div className="divide-y divide-border">
            {dcCriteria.map((c) => {
              const value = levels[c.criteriaId];
              const flagged = showMissing && value == null;
              const prev = previous?.levels[c.criteriaId];
              return (
                <div key={c.criteriaId} className={`flex flex-wrap items-center gap-2 py-2.5 ${flagged ? "rounded-lg bg-destructive/5 px-2" : ""}`}>
                  <div className="min-w-0 flex-1 basis-40">
                    <div className="text-[13.5px] font-medium">
                      {c.criteriaId}. {c.name}
                    </div>
                    {round?.criteria[c.criteriaId] && <div className="text-[11.5px] text-muted-foreground">เกณฑ์: {round.criteria[c.criteriaId]}</div>}
                    {prev != null && <div className="text-[11.5px] text-muted-foreground">ครั้งก่อน: {DC_LEVEL_LABEL[prev]}</div>}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {LEVELS.map((lv) => (
                      <button
                        key={lv}
                        type="button"
                        aria-pressed={value === lv}
                        onClick={() => setLevels((p) => ({ ...p, [c.criteriaId]: lv }))}
                        className={`rounded-lg border px-2.5 py-1.5 text-[12.5px] ${value === lv ? "border-primary bg-accent font-semibold text-primary" : "border-border hover:bg-muted"}`}
                      >
                        {DC_LEVEL_LABEL[lv]}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <Textarea aria-label="หมายเหตุ" value={note} onChange={(e) => setNote(e.target.value)} placeholder="หมายเหตุ (ถ้ามี)" rows={2} className="mt-3" />
          {showMissing && missing.length > 0 && (
            <p className="mt-2 text-[12.5px] text-destructive">ยังไม่ได้ประเมิน {missing.length} ข้อ: {missing.map((m) => m.shortName).join(", ")}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[12.5px] text-muted-foreground">
              ผลรวม: {total == null ? "ยังประเมินไม่ครบ" : DC_LEVEL_LABEL[total]}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={closed}
                onClick={() => {
                  store.saveDcAssessment(studentId, levels, note.trim(), false);
                  setMessage("บันทึกร่างแล้ว กลับมาทำต่อได้ก่อนปิดรอบ");
                }}
              >
                บันทึกร่าง
              </Button>
              <Button disabled={closed} onClick={submit}>
                ส่งผลประเมิน
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-[15px] font-bold">หลักฐานประกอบ: ความประพฤติล่าสุด</h3>
          <p className="mt-0.5 mb-2 text-[12px] text-muted-foreground">
            ใช้ประกอบการพิจารณาเท่านั้น ระบบไม่แปลงคะแนนความประพฤติเป็นผลประเมิน · คะแนนปัจจุบัน {store.behaviorScoreOf(studentId)}
          </p>
          <div className="divide-y divide-border">
            {behaviors.map((b) => {
              const rule = store.behaviorRules.find((r) => r.ruleId === b.ruleId);
              return (
                <div key={b.recordId} className="flex items-center gap-3 py-2 text-[13px]">
                  <span className="w-24 shrink-0 text-[12px] text-muted-foreground">{formatThaiDate(b.occurredAt)}</span>
                  <span className="flex-1">{rule?.name}</span>
                  <span className="font-semibold">{rule ? ruleScoreText(rule) : ""}</span>
                </div>
              );
            })}
            {behaviors.length === 0 && <p className="py-2 text-[12.5px] text-muted-foreground">ยังไม่มีบันทึกความประพฤติ</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Header({ name, sub }: { name: string; sub: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-bold">{name}</h2>
      <p className="text-[13px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function ResultTable({ levels, method }: { levels: Record<number, DcLevel | null>; method: DcSummaryMethod }) {
  const total = overall(levels, method);
  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {dcCriteria.map((c) => {
        const v = levels[c.criteriaId];
        return (
          <div key={c.criteriaId} className="flex items-center justify-between px-3 py-2 text-[13px]">
            <span>
              {c.criteriaId}. {c.name}
            </span>
            <span className="font-semibold">{v == null ? "–" : DC_LEVEL_LABEL[v]}</span>
          </div>
        );
      })}
      <div className="flex items-center justify-between bg-surface px-3 py-2 text-[13px] font-bold">
        <span>ผลรวม</span>
        <span>{total == null ? "–" : DC_LEVEL_LABEL[total]}</span>
      </div>
    </div>
  );
}
