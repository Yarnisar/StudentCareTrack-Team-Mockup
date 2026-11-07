"use client";

/**
 * ตั้งค่าการประเมินคุณลักษณะอันพึงประสงค์ (UC12)
 * - สถานการณ์ A: เลือกรอบตามภาคเรียน เห็นคุณลักษณะ 8 ข้อและระดับผล สร้างเกณฑ์ วิธีสรุปผลรวม และวันปิดส่งผล
 *   ตรวจข้อมูล (Alt-B) แล้วยืนยันเปิดใช้ให้ครูที่ปรึกษา
 * - สถานการณ์ B: แก้เกณฑ์ของรอบเดิม ถ้ารอบนั้นมีผลประเมินแล้วล็อกเกณฑ์และวิธีสรุปผล ให้สร้างรอบของภาคเรียนใหม่ (Alt-A)
 *   แต่ยังเลื่อนวันปิดส่งผลออกได้พร้อมเหตุผล เพราะไม่กระทบผลของใคร (ข้อเสนอแก้รายงาน ตามแนวของ UC9 สถานการณ์ B)
 */

import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DC_SUMMARY_METHOD_LABEL, DEFAULT_DC_CRITERIA, validateDcRound, type DcRound, type DcSummaryMethod } from "@/lib/dc-round";
import { formatThaiDate } from "@/lib/format";
import { DEMO_TODAY, TERMS, dcCriteria } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { DC_LEVEL_LABEL, type DcLevel } from "@/lib/types";

const METHODS = Object.keys(DC_SUMMARY_METHOD_LABEL) as DcSummaryMethod[];
const IDS = dcCriteria.map((c) => c.criteriaId);

export function DcRoundSettings() {
  const store = useStore();
  const [termId, setTermId] = useState(TERMS[0].termId);
  const term = TERMS.find((t) => t.termId === termId)!;
  const saved = store.dcRounds.find((r) => r.termId === termId);
  const locked = store.dcRoundHasResults(termId);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-[15.5px] font-bold">ตั้งค่าการประเมินคุณลักษณะอันพึงประสงค์</h2>
        <p className="text-[12.5px] text-muted-foreground">
          กำหนดเกณฑ์ 8 ข้อ วิธีสรุปผลรวม และวันปิดส่งผลของแต่ละภาคเรียน แล้วเปิดให้ครูที่ปรึกษาประเมิน
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {TERMS.map((t) => {
          const r = store.dcRounds.find((x) => x.termId === t.termId);
          return (
            <button
              key={t.termId}
              type="button"
              aria-pressed={termId === t.termId}
              onClick={() => setTermId(t.termId)}
              className={`rounded-lg border px-3 py-1.5 text-[13px] ${termId === t.termId ? "border-primary bg-accent font-semibold text-primary" : "border-border hover:bg-muted"}`}
            >
              {t.label}
              <span className="ml-1.5 text-[11.5px] font-normal text-muted-foreground">
                {!r ? "ยังไม่มีรอบ" : r.status === "open" ? "เปิดใช้แล้ว" : "ร่าง"}
              </span>
            </button>
          );
        })}
      </div>

      {locked && saved ? (
        <RoundView round={saved} onNewRound={() => setTermId(TERMS.find((t) => !store.dcRounds.some((r) => r.termId === t.termId))?.termId ?? termId)} />
      ) : (
        <RoundForm key={termId} termId={termId} termLabel={term.label} saved={saved} />
      )}
    </section>
  );
}

function LevelLegend() {
  return (
    <div className="flex flex-wrap gap-1.5 text-[12px]">
      <span className="text-muted-foreground">ระดับผล:</span>
      {([3, 2, 1, 0] as DcLevel[]).map((l) => (
        <span key={l} className="rounded-md bg-muted px-2 py-0.5">
          {DC_LEVEL_LABEL[l]}
        </span>
      ))}
    </div>
  );
}

/** Alt-A: รอบที่มีผลประเมินแล้ว ดูได้อย่างเดียว */
function RoundView({ round, onNewRound }: { round: DcRound; onNewRound: () => void }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <p className="flex items-start gap-2 rounded-lg bg-surface px-3 py-2.5 text-[13px]">
          <Lock className="mt-0.5 size-4 shrink-0" />
          รอบนี้มีผลประเมินแล้ว จึงแก้เกณฑ์และวิธีสรุปผลไม่ได้ ถ้าต้องการเปลี่ยนให้สร้างรอบของภาคเรียนใหม่ ส่วนวันปิดส่งผลเลื่อนออกได้
        </p>
        <LevelLegend />
        <div className="divide-y divide-border rounded-lg border border-border">
          {dcCriteria.map((c) => (
            <div key={c.criteriaId} className="px-3 py-2 text-[13px]">
              <div className="font-medium">
                {c.criteriaId}. {c.name}
              </div>
              <div className="text-[12.5px] text-muted-foreground">{round.criteria[c.criteriaId]}</div>
            </div>
          ))}
        </div>
        <div className="text-[13px]">วิธีสรุปผลรวม: {DC_SUMMARY_METHOD_LABEL[round.method]}</div>
        <ExtendDeadline round={round} />
        <Button variant="outline" onClick={onNewRound}>
          สร้างรอบสำหรับภาคเรียนใหม่
        </Button>
      </CardContent>
    </Card>
  );
}

function RoundForm({ termId, termLabel, saved }: { termId: string; termLabel: string; saved: DcRound | undefined }) {
  const store = useStore();
  // รอบใหม่ตั้งต้นจากเกณฑ์ของรอบล่าสุด แอดมินจึงไม่ต้องพิมพ์ใหม่ทั้งหมด
  const base = saved ?? store.dcRounds[0];
  const [criteria, setCriteria] = useState<Record<number, string>>(base?.criteria ?? DEFAULT_DC_CRITERIA);
  const [method, setMethod] = useState<DcSummaryMethod>(base?.method ?? "min");
  const [deadline, setDeadline] = useState(saved?.deadline ?? "");
  const [showErrors, setShowErrors] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");

  const draft: DcRound = { termId, termLabel, criteria, method, deadline, status: saved?.status ?? "draft" };
  const errors = validateDcRound(draft, DEMO_TODAY, IDS);

  const save = () => {
    if (errors.length > 0) {
      setShowErrors(true);
      return;
    }
    if (saved?.status === "open") {
      store.saveDcRound(draft);
      setMessage("บันทึกการเปลี่ยนแปลงเกณฑ์แล้ว");
      return;
    }
    setConfirming(true);
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[15px] font-bold">{saved ? "แก้ไขเกณฑ์" : "สร้างเกณฑ์"} · {termLabel}</h3>
          <LevelLegend />
        </div>

        <div className="divide-y divide-border rounded-lg border border-border">
          {dcCriteria.map((c) => (
            <div key={c.criteriaId} className="space-y-1.5 px-3 py-2.5">
              <label htmlFor={`dc-${c.criteriaId}`} className="text-[13px] font-medium">
                {c.criteriaId}. {c.name}
              </label>
              <Textarea
                id={`dc-${c.criteriaId}`}
                rows={2}
                value={criteria[c.criteriaId] ?? ""}
                onChange={(e) => setCriteria((p) => ({ ...p, [c.criteriaId]: e.target.value }))}
                className={showErrors && !criteria[c.criteriaId]?.trim() ? "border-destructive" : ""}
              />
            </div>
          ))}
        </div>

        <div>
          <div className="mb-1.5 text-[13px] font-medium">วิธีสรุปผลรวม</div>
          <div className="flex flex-wrap gap-1.5">
            {METHODS.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={method === m}
                onClick={() => setMethod(m)}
                className={`rounded-lg border px-3 py-1.5 text-[13px] ${method === m ? "border-primary bg-accent font-semibold text-primary" : "border-border hover:bg-muted"}`}
              >
                {DC_SUMMARY_METHOD_LABEL[m]}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[12px] text-muted-foreground">ทุกวิธี ถ้ามีข้อใดไม่ผ่าน ผลรวมเป็นไม่ผ่าน</p>
        </div>

        <div>
          <label htmlFor="dc-deadline" className="mb-1.5 block text-[13px] font-medium">
            วันปิดส่งผล
          </label>
          <Input id="dc-deadline" type="date" value={deadline} min={DEMO_TODAY} onChange={(e) => setDeadline(e.target.value)} className="w-48" />
        </div>

        {showErrors && errors.length > 0 && (
          <ul className="list-disc pl-5 text-[12.5px] text-destructive">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        {message && (
          <p role="status" className="rounded-lg bg-accent px-3 py-2 text-[13px] text-primary">
            {message}
          </p>
        )}

        {confirming ? (
          <div className="rounded-lg border border-border p-3">
            <p className="text-[13px]">เปิดใช้เกณฑ์นี้และเปิดรายการประเมินให้ครูที่ปรึกษาของ{termLabel}ไหม</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>
                ยังไม่เปิด
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  store.saveDcRound({ ...draft, status: "open" });
                  setConfirming(false);
                  setMessage("เปิดใช้แล้ว ครูที่ปรึกษาเริ่มประเมินได้");
                }}
              >
                ยืนยันเปิดใช้
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {!saved?.status || saved.status === "draft" ? (
              <Button
                variant="outline"
                onClick={() => {
                  store.saveDcRound({ ...draft, status: "draft" });
                  setMessage("บันทึกร่างแล้ว ยังไม่เปิดให้ครูประเมิน");
                }}
              >
                บันทึกร่าง
              </Button>
            ) : null}
            <Button onClick={save}>{saved?.status === "open" ? "บันทึกการเปลี่ยนแปลง" : "บันทึกและเปิดใช้"}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** เลื่อนวันปิดส่งผลออกได้อย่างเดียว ต้องระบุเหตุผล และแจ้งครูที่ปรึกษา */
function ExtendDeadline({ round }: { round: DcRound }) {
  const store = useStore();
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const later = date !== "" && date > round.deadline;
  const canSave = later && reason.trim() !== "";

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-[13px]">
        วันปิดส่งผล <b>{formatThaiDate(round.deadline)}</b>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Input
          type="date"
          aria-label="วันปิดส่งผลใหม่"
          value={date}
          min={round.deadline}
          onChange={(e) => {
            setDate(e.target.value);
            setMessage("");
          }}
          className="h-9 w-44"
        />
        <Input
          aria-label="เหตุผลที่เลื่อน"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="เหตุผลที่เลื่อน (จำเป็น)"
          className="h-9 min-w-0 flex-1"
        />
        <Button
          size="sm"
          disabled={!canSave}
          onClick={() => {
            store.saveDcRound({
              ...round,
              deadline: date,
              deadlineChanges: [
                ...(round.deadlineChanges ?? []),
                { from: round.deadline, to: date, reason: reason.trim(), at: DEMO_TODAY },
              ],
            });
            setMessage(`เลื่อนเป็น ${formatThaiDate(date)} แล้ว · แจ้งครูที่ปรึกษาเรื่องวันปิดใหม่แล้ว`);
            setDate("");
            setReason("");
          }}
        >
          เลื่อนวันปิด
        </Button>
      </div>
      {date !== "" && !later && <p className="mt-1 text-[12px] text-destructive">เลื่อนออกได้อย่างเดียว เลือกวันหลัง {formatThaiDate(round.deadline)}</p>}
      {message && <p role="status" className="mt-2 text-[12.5px] text-primary">{message}</p>}
      {(round.deadlineChanges ?? []).length > 0 && (
        <ul className="mt-2 space-y-0.5 text-[12px] text-muted-foreground">
          {round.deadlineChanges!.map((c, i) => (
            <li key={i}>
              {formatThaiDate(c.at)}: เลื่อนจาก {formatThaiDate(c.from)} เป็น {formatThaiDate(c.to)} · {c.reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
