"use client";

/**
 * ค่าตั้งต้นของคะแนนความประพฤติ (UC7 Scenario D): คะแนนเริ่มต้น เพดาน คะแนนต่ำสุด และเกณฑ์เฝ้าระวังหลายระดับ
 * ใช้ร่วมกันทุกแบบร่างของหน้าตั้งค่า เก็บใน store หน้าบันทึกพฤติกรรม ข้อมูลนักเรียน และภาพรวมจึงใช้ค่าเดียวกัน
 * - ข้อ 5: แต่ละระดับระบุคะแนนที่เข้าสถานะ และผู้ที่ต้องแจ้งเพิ่มเมื่อนักเรียนเข้าระดับนั้น
 * - ข้อ 6: คะแนนเริ่มต้น เพดาน (หรือไม่จำกัด) และคะแนนต่ำสุด ปรับด้วยปุ่ม −/+ แทนการพิมพ์
 * - ข้อ 7: เหตุผลระบุตอนเผยแพร่ฉบับร่าง (rule-set-panel.tsx)
 * ค่าตั้งต้นอีก 3 ตัวของข้อ 6: ระยะเวลาบันทึกย้อนหลัง ระยะเวลาแก้ไขรายการ และระยะเวลารอครูที่ปรึกษายืนยันการถอนสถานะ
 * แก้ผ่านฉบับร่างเท่านั้น ค่าที่เผยแพร่มีผลกับพฤติกรรมที่เกิดตั้งแต่วันเริ่มใช้ ไม่คำนวณคะแนนเดิมย้อนหลัง (ข้อ 9, Scenario E)
 * PROTOTYPE: คะแนนเริ่มต้น เพดาน และคะแนนต่ำสุดใช้ตามวันที่ของแต่ละรายการ ส่วนเกณฑ์เฝ้าระวังประเมินจากคะแนนตอนนี้ด้วยค่าที่ใช้อยู่
 */

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  WATCH_ALWAYS_NOTIFIED,
  WATCH_NOTIFY_LABEL,
  WATCH_NOTIFY_ORDER,
  validateScoreConfig,
  type BehaviorScoreConfig,
  type WatchLevel,
} from "@/lib/behavior-score";
import { useStore } from "@/lib/store";

const STEP = 5;
const MAX_LEVELS = 4;

export function BehaviorScoreCard() {
  const store = useStore();
  // แก้ผ่านฉบับร่างเท่านั้น (สร้างและเผยแพร่ที่แถบชุดกฎด้านบน) ไม่มีฉบับร่างคือดูค่าที่ใช้อยู่อย่างเดียว
  const editing = store.configDraft !== null;
  const draft: BehaviorScoreConfig = store.configDraft ?? store.behaviorScoreConfig;
  const errors = validateScoreConfig(draft);

  const set = (patch: Partial<BehaviorScoreConfig>) => store.setConfigDraft((d) => (d ? { ...d, ...patch } : d));
  const setLevel = (i: number, patch: Partial<WatchLevel>) =>
    set({ watchLevels: draft.watchLevels.map((l, j) => (j === i ? { ...l, ...patch } : l)) });

  const addLevel = () => {
    const last = draft.watchLevels.at(-1);
    const atOrBelow = Math.max(draft.minScore, (last?.atOrBelow ?? draft.startScore) - 20);
    set({ watchLevels: [...draft.watchLevels, { atOrBelow, notify: last?.notify ?? [] }] });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-[15.5px] font-bold">คะแนนความประพฤติ</h2>
        <p className="mt-0.5 mb-4 text-[12.5px] text-muted-foreground">
          นักเรียนทุกคนเริ่มที่คะแนนเริ่มต้น คะแนนรวมอยู่ระหว่างคะแนนต่ำสุดถึงเพดาน ถึงเพดานแล้วยังบันทึกพฤติกรรมเชิงบวกได้แต่คะแนนไม่เพิ่ม
        </p>

        {!editing && (
          <p className="mb-3 rounded-lg bg-surface px-3 py-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
            ดูอย่างเดียว สร้างฉบับร่างในช่วงที่แก้กฎได้เพื่อแก้ไข ค่าที่เปลี่ยนมีผลกับพฤติกรรมที่เกิดตั้งแต่วันเริ่มใช้เป็นต้นไปเท่านั้น
          </p>
        )}
        <fieldset disabled={!editing} className="min-w-0 border-0 p-0 disabled:opacity-60">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stepper label="คะแนนเริ่มต้น" value={draft.startScore} onChange={(v) => set({ startScore: v })} />
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <span className="flex-1 text-[12.5px] text-muted-foreground">เพดานคะแนน</span>
              <label className="flex items-center gap-1.5 text-[12.5px]">
                <input
                  type="checkbox"
                  checked={draft.ceiling === null}
                  onChange={(e) => set({ ceiling: e.target.checked ? null : draft.startScore })}
                />
                ไม่จำกัด
              </label>
            </div>
            {draft.ceiling === null ? (
              <div className="mt-1.5 flex h-9 items-center text-[14px] font-semibold text-muted-foreground">ไม่จำกัด</div>
            ) : (
              <StepperControl value={draft.ceiling} onChange={(v) => set({ ceiling: v })} label="เพดานคะแนน" />
            )}
          </div>
          <Stepper label="คะแนนต่ำสุด" value={draft.minScore} onChange={(v) => set({ minScore: v })} />
        </div>

        <h3 className="mt-5 text-[13.5px] font-bold">ระยะเวลาบันทึกและแก้ไข</h3>
        <p className="mt-0.5 mb-2 text-[12px] text-muted-foreground">
          บันทึกย้อนหลังต้องระบุเหตุผล ผู้บันทึกแก้ไขหรือยกเลิกรายการของตนได้ภายในระยะเวลาที่กำหนด ระบบเก็บประวัติทุกครั้ง คะแนนกลับเข้าเกณฑ์แล้วครูที่ปรึกษายังไม่ยืนยันถอนสถานะเกินกำหนด ระบบเตือนซ้ำและแจ้งแอดมินโดยไม่ระบุชื่อ
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stepper label="บันทึกย้อนหลังได้ไม่เกิน (วัน)" value={draft.backdateDays} step={1} onChange={(v) => set({ backdateDays: v })} />
          <Stepper label="แก้ไขหรือยกเลิกได้ภายใน (วันหลังบันทึก)" value={draft.editDays} step={1} onChange={(v) => set({ editDays: v })} />
          <Stepper label="ครูที่ปรึกษายืนยันถอนสถานะภายใน (วัน)" value={draft.withdrawalWaitDays} step={1} onChange={(v) => set({ withdrawalWaitDays: v })} />
        </div>

        <h3 className="mt-5 text-[13.5px] font-bold">เกณฑ์เฝ้าระวัง</h3>
        <p className="mt-0.5 mb-2 text-[12px] text-muted-foreground">
          ทุกระดับแจ้ง{WATCH_ALWAYS_NOTIFIED} และให้ครูที่ปรึกษาพิจารณาเปิดกรณีช่วยเหลือ เลือกผู้ที่ต้องแจ้งเพิ่มของแต่ละระดับ
        </p>
        <div className="space-y-2">
          {draft.watchLevels.map((level, i) => (
            <div key={i} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[13px] font-semibold">ระดับ {i + 1}</span>
                <span className="text-[12.5px] text-muted-foreground">เมื่อคะแนนต่ำกว่าหรือเท่ากับ</span>
                <div className="w-40">
                  <StepperControl
                    value={level.atOrBelow}
                    onChange={(v) => setLevel(i, { atOrBelow: v })}
                    label={`เกณฑ์ระดับ ${i + 1}`}
                  />
                </div>
                <span className="flex-1" />
                <button
                  type="button"
                  disabled={draft.watchLevels.length === 1}
                  aria-label={`ลบระดับ ${i + 1}`}
                  title={draft.watchLevels.length === 1 ? "ต้องมีอย่างน้อย 1 ระดับ" : `ลบระดับ ${i + 1}`}
                  onClick={() => set({ watchLevels: draft.watchLevels.filter((_, j) => j !== i) })}
                  className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[12px] text-muted-foreground">แจ้งเพิ่ม:</span>
                {WATCH_NOTIFY_ORDER.map((n) => {
                  const on = level.notify.includes(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setLevel(i, { notify: on ? level.notify.filter((x) => x !== n) : [...level.notify, n] })
                      }
                      className={
                        on
                          ? "rounded-md border border-primary bg-accent px-2.5 py-1 text-[12px] font-semibold text-primary"
                          : "rounded-md border border-border px-2.5 py-1 text-[12px] hover:bg-muted"
                      }
                    >
                      {WATCH_NOTIFY_LABEL[n]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {draft.watchLevels.length < MAX_LEVELS && (
          <Button variant="outline" className="mt-2 w-full" onClick={addLevel}>
            <Plus className="size-4" /> เพิ่มระดับเฝ้าระวัง
          </Button>
        )}

        </fieldset>

        {editing && errors.length > 0 && (
          <ul className="mt-3 list-disc pl-5 text-[12.5px] text-destructive">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function Stepper({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-[12.5px] text-muted-foreground">{label}</div>
      <StepperControl value={value} onChange={onChange} label={label} step={step} />
    </div>
  );
}

function StepperControl({
  value,
  onChange,
  label,
  step = STEP,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  step?: number;
}) {
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <button
        type="button"
        aria-label={`${label} ลด ${step}`}
        onClick={() => onChange(value - step)}
        className="flex size-9 items-center justify-center rounded-lg border border-border hover:bg-muted"
      >
        <Minus className="size-4" />
      </button>
      <span className="flex-1 text-center text-[16px] font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        aria-label={`${label} เพิ่ม ${step}`}
        onClick={() => onChange(value + step)}
        className="flex size-9 items-center justify-center rounded-lg border border-border hover:bg-muted"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
