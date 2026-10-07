"use client";

import { useState } from "react";
import { InlineConfirm } from "@/components/settings/confirm";
import {
  schoolSettingsSaveConfirm,
  type ImpactContext,
  type SettingChange,
} from "@/components/settings/confirm-text";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore, type SchoolSettingsPatch } from "@/lib/store";

type Draft = Required<SchoolSettingsPatch>;

const FIELD_LABEL: Record<keyof Draft, string> = {
  schoolStartTime: "เวลาเข้าเรียน",
  lateAlertThreshold: "เตือนมาสายครบ (ครั้ง/เดือน)",
  behaviorAlertScore: "เกณฑ์คะแนนแนะนำเปิด case",
  pendingAutoConfirmDays: "ยืนยันอัตโนมัติ (วันทำการ)",
  sdq2ForNormalStudents: "SDQ ครั้งที่ 2 สำหรับนักเรียนปกติ",
};

const shown = (v: Draft[keyof Draft]) =>
  typeof v === "boolean" ? (v ? "ทำ" : "ไม่ทำ") : String(v);

/**
 * ตั้งค่าระดับโรงเรียน (school_settings แถวเดียว)
 * กดบันทึกแล้วยืนยันในที่ จากนั้นมีผลทันทีทุกหน้า (เช่น เวลาเข้าเรียนในหน้าเช็คอิน)
 * และบันทึก audit UPDATE พร้อมค่าก่อน/หลัง
 */
export function SchoolSettingsCard({ impact }: { impact: ImpactContext }) {
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
  const [confirming, setConfirming] = useState(false);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setConfirming(false);
  };

  const current = fromStore();
  const changes: SettingChange[] = (Object.keys(draft) as (keyof Draft)[])
    .filter((k) => draft[k] !== current[k])
    .map((k) => ({ label: FIELD_LABEL[k], before: shown(current[k]), after: shown(draft[k]) }));
  const dirty = changes.length > 0;
  const valid =
    /^\d{2}:\d{2}$/.test(draft.schoolStartTime) &&
    draft.lateAlertThreshold >= 1 &&
    draft.behaviorAlertScore >= 0 &&
    draft.behaviorAlertScore <= 100 &&
    draft.pendingAutoConfirmDays >= 1;

  const num = (v: string) => (v === "" ? 0 : Math.round(Number(v)));

  return (
    <Card>
      <CardContent className="p-5 lg:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-bold">ตั้งค่าโรงเรียน</h2>
          <Button
            variant="outline"
            size="sm"
            aria-expanded={open}
            onClick={() => {
              setOpen((v) => !v);
              setDraft(fromStore());
              setConfirming(false);
            }}
          >
            {open ? "ปิด" : "แก้ไข"}
          </Button>
        </div>

        {!open ? (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-3">
            <Item label="เวลาเข้าเรียน" value={`${s.schoolStartTime} น.`} />
            <Item label="เตือนมาสายครบ" value={`${s.lateAlertThreshold} ครั้ง/เดือน`} />
            <Item label="เกณฑ์คะแนนแนะนำเปิด case" value={`ต่ำกว่า ${s.behaviorAlertScore}`} />
            <Item label="ยืนยันอัตโนมัติ" value={`${s.pendingAutoConfirmDays} วันทำการ`} />
            <Item label="SDQ ครั้งที่ 2 สำหรับนักเรียนปกติ" value={shown(s.sdq2ForNormalStudents)} />
          </dl>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-3">
              <Field label="เวลาเข้าเรียน" id="start">
                <Input
                  id="start"
                  type="time"
                  value={draft.schoolStartTime}
                  onChange={(e) => set("schoolStartTime", e.target.value)}
                />
              </Field>
              <Field label="เตือนมาสายครบ (ครั้ง/เดือน)" id="late">
                <Input
                  id="late"
                  type="number"
                  min={1}
                  value={draft.lateAlertThreshold}
                  onChange={(e) => set("lateAlertThreshold", num(e.target.value))}
                />
              </Field>
              <Field label="เกณฑ์คะแนนแนะนำเปิด case" id="score">
                <Input
                  id="score"
                  type="number"
                  min={0}
                  max={100}
                  value={draft.behaviorAlertScore}
                  onChange={(e) => set("behaviorAlertScore", num(e.target.value))}
                />
              </Field>
              <Field label="ยืนยันอัตโนมัติ (วันทำการ)" id="auto">
                <Input
                  id="auto"
                  type="number"
                  min={1}
                  value={draft.pendingAutoConfirmDays}
                  onChange={(e) => set("pendingAutoConfirmDays", num(e.target.value))}
                />
              </Field>
              <Field label="SDQ ครั้งที่ 2 สำหรับนักเรียนปกติ" id="sdq2">
                <select
                  id="sdq2"
                  value={draft.sdq2ForNormalStudents ? "yes" : "no"}
                  onChange={(e) => set("sdq2ForNormalStudents", e.target.value === "yes")}
                  className="h-10 w-full rounded-lg border border-border bg-card px-3 text-[13px]"
                >
                  <option value="yes">ทำ</option>
                  <option value="no">ไม่ทำ</option>
                </select>
              </Field>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              {!valid && <span className="mr-auto text-[12px] text-risk-red">ค่าที่กรอกไม่ถูกต้อง</span>}
              <Button
                variant="ghost"
                disabled={!dirty}
                onClick={() => {
                  setDraft(current);
                  setConfirming(false);
                }}
              >
                คืนค่า
              </Button>
              <Button disabled={!dirty || !valid || confirming} onClick={() => setConfirming(true)}>
                บันทึก
              </Button>
            </div>

            {confirming && dirty && valid && (
              <div className="mt-3">
                <InlineConfirm
                  content={schoolSettingsSaveConfirm(changes, impact)}
                  onConfirm={() => {
                    store.updateSchoolSettings(draft);
                    setConfirming(false);
                  }}
                  onCancel={() => setConfirming(false)}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-[13px] font-semibold">{value}</dd>
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[12px] text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
