"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatThaiDateTime } from "@/lib/format";
import { useStore, type SchoolSettingsPatch } from "@/lib/store";

type Draft = Required<SchoolSettingsPatch>;

/**
 * ตั้งค่าระดับโรงเรียน (school_settings แถวเดียว) — อยู่นอก _prototype เพราะไม่ขึ้นกับแบบหน้าตั้งค่าที่ยังรอเลือก
 * กดบันทึกแล้วมีผลทันทีทุกหน้า (เช่น เวลาเข้าเรียนในหน้าเช็คอิน) และบันทึก audit UPDATE ค่าก่อน/หลัง
 */
export function SchoolSettingsCard() {
  const store = useStore();
  const s = store.schoolSettings;
  const fromStore = (): Draft => ({
    schoolStartTime: s.schoolStartTime,
    lateAlertThreshold: s.lateAlertThreshold,
    behaviorAlertScore: s.behaviorAlertScore,
    pendingAutoConfirmDays: s.pendingAutoConfirmDays,
    sdq2ForNormalStudents: s.sdq2ForNormalStudents,
  });
  const [draft, setDraft] = useState<Draft>(fromStore);
  const [open, setOpen] = useState(false);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const current = fromStore();
  const dirty = (Object.keys(draft) as (keyof Draft)[]).some((k) => draft[k] !== current[k]);
  const valid =
    /^\d{2}:\d{2}$/.test(draft.schoolStartTime) &&
    draft.lateAlertThreshold >= 1 &&
    draft.behaviorAlertScore >= 0 &&
    draft.behaviorAlertScore <= 100 &&
    draft.pendingAutoConfirmDays >= 1;

  const num = (v: string) => (v === "" ? 0 : Math.round(Number(v)));

  return (
    <Card className="mx-8 mt-4 shrink-0">
      <CardContent className="px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold">ตั้งค่าโรงเรียน</h2>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              เข้าเรียน {s.schoolStartTime} น. · แจ้งเตือนมาสายครบ {s.lateAlertThreshold} ครั้ง/เดือน ·
              แนะนำเปิด case เมื่อคะแนนต่ำกว่า {s.behaviorAlertScore} · ยืนยันอัตโนมัติ{" "}
              {s.pendingAutoConfirmDays} วันทำการ · แก้ไขล่าสุดโดย {store.nameOf(s.updatedBy)}{" "}
              {formatThaiDateTime(s.updatedAt)}
            </p>
          </div>
          <Button variant="outline" size="sm" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? "ซ่อน" : "แก้ไข"}
          </Button>
        </div>

        {open && (
          <div className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Field label="เวลาเข้าเรียน" hint="เช็คอินหลังเวลานี้ครบ 1 นาที = มาสาย" id="start">
                <Input
                  id="start"
                  type="time"
                  value={draft.schoolStartTime}
                  onChange={(e) => set("schoolStartTime", e.target.value)}
                />
              </Field>
              <Field label="แจ้งเตือนเมื่อมาสายครบ (ครั้ง/เดือน)" id="late">
                <Input
                  id="late"
                  type="number"
                  min={1}
                  value={draft.lateAlertThreshold}
                  onChange={(e) => set("lateAlertThreshold", num(e.target.value))}
                />
              </Field>
              <Field label="แนะนำเปิด case เมื่อคะแนนความประพฤติต่ำกว่า" id="score">
                <Input
                  id="score"
                  type="number"
                  min={0}
                  max={100}
                  value={draft.behaviorAlertScore}
                  onChange={(e) => set("behaviorAlertScore", num(e.target.value))}
                />
              </Field>
              <Field label="ยืนยันบันทึกรอยืนยันอัตโนมัติเมื่อครบ (วันทำการ)" id="auto">
                <Input
                  id="auto"
                  type="number"
                  min={1}
                  value={draft.pendingAutoConfirmDays}
                  onChange={(e) => set("pendingAutoConfirmDays", num(e.target.value))}
                />
              </Field>
            </div>

            <label className="mt-4 flex items-center gap-2.5 text-[13.5px]">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={draft.sdq2ForNormalStudents}
                onChange={(e) => set("sdq2ForNormalStudents", e.target.checked)}
              />
              ให้นักเรียนที่ผลปกติในภาคเรียนที่ 1 ทำ SDQ ครั้งที่ 2 ด้วย
            </label>

            <div className="mt-5 flex items-center justify-end gap-2">
              {!valid && <span className="mr-auto text-[12.5px] text-risk-red">ค่าที่กรอกไม่ถูกต้อง</span>}
              <Button variant="ghost" disabled={!dirty} onClick={() => setDraft(current)}>
                คืนค่า
              </Button>
              <Button disabled={!dirty || !valid} onClick={() => store.updateSchoolSettings(draft)}>
                บันทึกการตั้งค่าโรงเรียน
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  hint,
  id,
  children,
}: {
  label: string;
  hint?: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[12px] text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[11.5px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
