"use client";

/**
 * แถบจัดการชุดกฎความประพฤติ (UC7 สถานการณ์ A, E และ Alt-A, C, D)
 * - ช่วงที่แก้กฎได้ (ต้องอยู่ในช่วงปิดเทอม) นอกช่วงเป็นดูอย่างเดียว
 * - แก้ผ่านฉบับร่างเท่านั้น ใช้ชุดที่ใช้งานอยู่ต่อไปจนกว่าจะเผยแพร่
 * - ขั้นตรวจผลกระทบ → ระบุวันเริ่มใช้และเหตุผล → เผยแพร่ (หรือเก็บเป็นร่างไว้ก่อน)
 * ผลกระทบเป็นจำนวนนักเรียนเท่านั้น ไม่มีชื่อ (3.4.1)
 */

import { useMemo, useState } from "react";
import { CalendarClock, FileClock, Lock, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatThaiDate } from "@/lib/format";
import { CURRENT_TERM, DEMO_TODAY } from "@/lib/mock-data";
import { runningScore, watchLevelOf } from "@/lib/behavior-score";
import { diffRules, ruleEditWindowError, type RuleDiff } from "@/lib/rule-sets";
import { shiftDate } from "@/lib/periods";
import { useStore } from "@/lib/store";
import { academicYearOfDate, termInfo } from "@/lib/terms";
import type { BehaviorRule } from "@/lib/types";
import type { SettingsPrototype } from "./state";

const nextTermStart = () => {
  const t = CURRENT_TERM;
  return t.semester === 1 ? termInfo(t.academicYear, 2).start : termInfo(t.academicYear + 1, 1).start;
};

export function RuleSetBar({ proto }: { proto: SettingsPrototype }) {
  const store = useStore();
  const [editingWindow, setEditingWindow] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const win = store.ruleEditWindow;
  const winError = ruleEditWindowError(win, CURRENT_TERM.academicYear);
  const current = store.ruleVersions[store.ruleVersions.length - 1];
  const scheduled = store.scheduledRuleSet;
  const diffs = useMemo(
    () => (store.ruleDraft ? diffRules(store.behaviorRules, store.ruleDraft) : []),
    [store.ruleDraft, store.behaviorRules]
  );

  return (
    <div className="mb-4 space-y-3">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <CalendarClock className="size-4 text-muted-foreground" />
          <span className="text-[13.5px] font-semibold">ช่วงที่แก้กฎได้</span>
          <span className="text-[13px] text-muted-foreground">
            {formatThaiDate(win.open)} – {formatThaiDate(win.close)}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
              store.ruleEditOpen ? "bg-accent text-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            {store.ruleEditOpen ? "แก้ได้ตอนนี้" : "ดูอย่างเดียว"}
          </span>
          <span className="flex-1" />
          <Button size="sm" variant="outline" onClick={() => setEditingWindow((v) => !v)}>
            {editingWindow ? "ปิด" : "ปรับช่วงเวลา"}
          </Button>
        </div>
        {!store.ruleEditOpen && (
          <p className="mt-2 flex items-start gap-1.5 text-[12.5px] text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0" />
            วันนี้ {formatThaiDate(DEMO_TODAY)} อยู่นอกช่วงที่แก้กฎได้ จึงดูกฎได้อย่างเดียว กฎเดิมยังใช้งานตามปกติ
          </p>
        )}
        {editingWindow && (
          <div className="mt-3 space-y-2 border-t border-border pt-3">
            <div className="flex flex-wrap gap-3">
              <div>
                <Label className="text-[12px] text-muted-foreground">เริ่มแก้ได้</Label>
                <Input
                  type="date"
                  className="mt-1.5 w-44"
                  value={win.open}
                  onChange={(e) => store.setRuleEditWindow({ ...win, open: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-[12px] text-muted-foreground">สิ้นสุด</Label>
                <Input
                  type="date"
                  className="mt-1.5 w-44"
                  value={win.close}
                  onChange={(e) => store.setRuleEditWindow({ ...win, close: e.target.value })}
                />
              </div>
            </div>
            <p className="text-[12px] text-muted-foreground">
              ต้องอยู่ในช่วงปิดเทอมเดียวกัน เพื่อให้นักเรียนทุกคนในภาคเรียนเดียวกันใช้กฎชุดเดียวกัน ตั้งหรือปรับได้ตลอดเวลา
            </p>
            {winError && <p className="text-[12.5px] text-destructive">{winError}</p>}
            <label className="flex items-center gap-2 text-[12.5px]">
              <input
                type="checkbox"
                checked={store.simulateRuleEditOpen}
                onChange={(e) => store.setSimulateRuleEditOpen(e.target.checked)}
              />
              <span>
                <b>PROTOTYPE</b> จำลองว่าวันนี้อยู่ในช่วงที่แก้กฎได้ (วันตัวอย่างอยู่กลางภาคเรียน)
              </span>
            </label>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <FileClock className="size-4 text-muted-foreground" />
          <span className="text-[13.5px] font-semibold">ชุดที่ใช้งานอยู่: ฉบับ {current.number}</span>
          <span className="text-[13px] text-muted-foreground">ใช้ตั้งแต่ {formatThaiDate(current.effectiveFrom)}</span>
        </div>

        {scheduled && (
          <div className="mt-3 rounded-lg bg-surface p-3 text-[13px]">
            <p>
              <b>ฉบับ {scheduled.number}</b> เผยแพร่แล้ว จะเริ่มใช้ {formatThaiDate(scheduled.effectiveFrom)} กฎเดิมใช้ต่อจนถึงวันนั้น
            </p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">เหตุผล: {scheduled.reason}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={store.recallScheduledRules} disabled={!store.ruleEditOpen}>
                เรียกกลับเป็นฉบับร่าง
              </Button>
              <Button size="sm" variant="ghost" onClick={store.activateScheduledRules}>
                <b>PROTOTYPE</b>&nbsp;จำลองถึงวันเริ่มใช้
              </Button>
            </div>
          </div>
        )}

        {!scheduled && !proto.hasDraft && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" disabled={!store.ruleEditOpen} onClick={store.startRuleDraft}>
              <PencilLine className="size-4" /> สร้างฉบับร่างเพื่อแก้กฎ
            </Button>
            <span className="text-[12px] text-muted-foreground">
              {store.ruleEditOpen ? "แก้ในฉบับร่างได้โดยกฎที่ใช้อยู่ยังไม่เปลี่ยน" : "สร้างได้เฉพาะในช่วงที่แก้กฎได้"}
            </span>
          </div>
        )}

        {proto.hasDraft && (
          <div className="mt-3 rounded-lg border border-dashed border-foreground/40 p-3">
            <p className="text-[13px] font-semibold">กำลังแก้ฉบับร่าง</p>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              {diffs.length === 0 ? "ยังไม่มีการเปลี่ยนแปลง" : `เปลี่ยนแล้ว ${diffs.length} รายการ`} · ครูและคะแนนนักเรียนยังใช้ชุดเดิมจนกว่าจะเผยแพร่
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" disabled={diffs.length === 0} onClick={() => setPublishing(true)}>
                ตรวจผลกระทบและเผยแพร่
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (diffs.length === 0 || window.confirm("ทิ้งฉบับร่างและการเปลี่ยนแปลงทั้งหมดไหม")) store.discardRuleDraft();
                }}
              >
                ทิ้งร่าง
              </Button>
            </div>
          </div>
        )}
      </div>

      {publishing && store.ruleDraft && (
        <PublishDialog
          diffs={diffs}
          draft={store.ruleDraft}
          onClose={() => setPublishing(false)}
          onPublish={(effectiveFrom, reason) => {
            store.publishRuleDraft(effectiveFrom, reason);
            setPublishing(false);
          }}
        />
      )}
    </div>
  );
}

function PublishDialog({
  diffs,
  draft,
  onClose,
  onPublish,
}: {
  diffs: RuleDiff[];
  draft: BehaviorRule[];
  onClose: () => void;
  onPublish: (effectiveFrom: string, reason: string) => void;
}) {
  const store = useStore();
  const [effectiveFrom, setEffectiveFrom] = useState(nextTermStart());
  const [reason, setReason] = useState("");
  const options = [
    { label: "วันนี้", date: DEMO_TODAY },
    { label: "อีก 7 วัน", date: shiftDate(DEMO_TODAY, 7) },
    { label: "อีก 30 วัน", date: shiftDate(DEMO_TODAY, 30) },
    { label: "เปิดภาคเรียนถัดไป", date: nextTermStart() },
  ];

  /** ผลต่อสถานะเฝ้าระวัง: คะแนนของรายการเก็บค่า ณ ตอนบันทึกแล้ว จึงเปลี่ยนได้เฉพาะเมื่อมีกฎที่ยกเลิก (นับเป็นจำนวนคน) */
  const impact = useMemo(() => {
    const cfg = store.behaviorScoreConfig;
    const levelWith = (studentId: string, rules: BehaviorRule[]) => {
      const items = store.behaviorOf(studentId)
        .filter((rec) => academicYearOfDate(rec.occurredAt) === CURRENT_TERM.academicYear)
        .map((rec) => {
          const rule = rules.find((r) => r.ruleId === rec.ruleId);
          return { delta: rec.cancelled || !rule || rule.cancelled ? 0 : (rec.scoreDelta ?? rule.scoreDelta), at: rec.occurredAt };
        });
      return watchLevelOf(runningScore(items, cfg), cfg);
    };
    let entering = 0;
    let leaving = 0;
    let changed = 0;
    for (const s of store.students) {
      const before = levelWith(s.studentId, store.behaviorRules);
      const after = levelWith(s.studentId, draft);
      if (before === after) continue;
      changed++;
      if (before === 0) entering++;
      else if (after === 0) leaving++;
    }
    return { entering, leaving, changed };
  }, [store, draft]);

  const dateError = effectiveFrom < DEMO_TODAY ? "วันเริ่มใช้ต้องไม่ก่อนวันนี้" : "";
  const missing = reason.trim() === "" ? "ระบุเหตุผลในการเปลี่ยนแปลง" : dateError;
  const when = effectiveFrom <= DEMO_TODAY ? "มีผลทันที" : `เริ่มใช้ ${formatThaiDate(effectiveFrom)}`;

  return (
    <>
      <div aria-hidden className="fixed inset-0 z-40 bg-foreground/20" onClick={onClose} />
      <div
        role="dialog"
        aria-label="ตรวจผลกระทบและเผยแพร่"
        className="fixed inset-x-4 top-[8vh] z-50 mx-auto max-h-[84vh] max-w-xl overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-lg"
      >
        <h3 className="text-[16px] font-bold">ตรวจผลกระทบและเผยแพร่</h3>

        <div className="mt-3">
          <div className="text-[12.5px] font-semibold">สิ่งที่เปลี่ยน ({diffs.length})</div>
          <ul className="mt-1.5 space-y-1.5 text-[13px]">
            {diffs.map((d) => (
              <li key={d.ruleId + d.kind}>
                <span className="font-medium">{d.summary}</span>
                {d.changes.map((c) => (
                  <span key={c.label} className="ml-2 text-[12px] text-muted-foreground">
                    {c.label} {c.from ? `${c.from} → ` : ""}
                    {c.to}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 rounded-lg bg-surface p-3 text-[13px]">
          <div className="font-semibold">ผลต่อนักเรียน (ปีการศึกษา {CURRENT_TERM.academicYear})</div>
          {impact.changed === 0 ? (
            <p className="mt-1 text-muted-foreground">ไม่มีนักเรียนที่สถานะเฝ้าระวังเปลี่ยน</p>
          ) : (
            <p className="mt-1">
              สถานะเฝ้าระวังเปลี่ยน {impact.changed} คน · เข้าเฝ้าระวัง {impact.entering} · พ้นเฝ้าระวัง {impact.leaving} (เป็นจำนวน ไม่มีชื่อ)
            </p>
          )}
          <p className="mt-1.5 text-[12px] text-muted-foreground">
            รายการที่เกิดก่อนวันเริ่มใช้ไม่ถูกเปลี่ยนคะแนน ยกเว้นรายการของกฎที่ยกเลิก ซึ่งจะไม่นับคะแนน
          </p>
        </div>

        <div className="mt-4">
          <Label className="text-[12px] text-muted-foreground">วันเริ่มใช้</Label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {options.map((o) => (
              <button
                key={o.label}
                type="button"
                aria-pressed={effectiveFrom === o.date}
                onClick={() => setEffectiveFrom(o.date)}
                className={`rounded-lg border px-3 py-1.5 text-[13px] ${
                  effectiveFrom === o.date ? "border-primary bg-accent font-semibold text-primary" : "border-border hover:bg-muted"
                }`}
              >
                {o.label}
                <span className="ml-1.5 text-[11.5px] font-normal text-muted-foreground">{formatThaiDate(o.date)}</span>
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[12px] text-muted-foreground">{when} · กฎเดิมใช้ต่อจนถึงวันเริ่มใช้</p>
        </div>

        <div className="mt-4">
          <Label className="text-[12px] text-muted-foreground">เหตุผลในการเปลี่ยนแปลง (จำเป็น)</Label>
          <Input
            className="mt-1.5"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="เช่น ปรับตามมติที่ประชุมฝ่ายปกครอง"
          />
        </div>
        {missing && reason.trim() !== "" && <p className="mt-2 text-[12.5px] text-destructive">{missing}</p>}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            บันทึกเป็นร่างไว้ก่อน
          </Button>
          <Button disabled={!!missing} onClick={() => onPublish(effectiveFrom, reason.trim())}>
            ยืนยันเผยแพร่
          </Button>
        </div>
      </div>
    </>
  );
}
