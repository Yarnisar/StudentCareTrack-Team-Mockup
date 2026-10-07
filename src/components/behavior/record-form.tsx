"use client";

/**
 * ฟอร์มบันทึกความประพฤติใหม่ + รายการกฎที่ใช้งานอยู่ (แถบด้านขวาของหน้าความประพฤติ)
 * ครูใช้บ่อยจึงเปิดค้างไว้ ไม่ต้องกดเปิด
 */

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { byClassNo } from "@/lib/format";
import { useStore } from "@/lib/store";
import { BEHAVIOR_SEVERITY_LABEL } from "@/lib/types";

/** ป้ายระดับ (น้อย / กลาง / มาก / ความดี) — แหล่งเดียวอยู่ที่ lib/types */
export const SEVERITY_LABEL = BEHAVIOR_SEVERITY_LABEL;

export function useBehaviorForm() {
  const store = useStore();
  const [studentId, setStudentId] = useState("");
  const [ruleId, setRuleId] = useState("");
  const [description, setDescription] = useState("");
  const [saved, setSaved] = useState(false);
  const [notifiedGuardians, setNotifiedGuardians] = useState(0);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ล้างตัวจับเวลาเมื่อออกจากหน้า (ไม่ให้ setState หลังถอดคอมโพเนนต์)
  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    []
  );

  const canSave = studentId !== "" && ruleId !== "";

  const save = () => {
    const result = store.addBehaviorRecord(studentId, ruleId, description || "-");
    setNotifiedGuardians(result.notifiedGuardians.length);
    setDescription("");
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 2500);
  };

  return {
    studentId,
    setStudentId,
    ruleId,
    setRuleId,
    description,
    setDescription,
    saved,
    notifiedGuardians,
    canSave,
    save,
  };
}

export type BehaviorForm = ReturnType<typeof useBehaviorForm>;

export function NewRecordFields({ form }: { form: BehaviorForm }) {
  const store = useStore();

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="student">นักเรียน</Label>
        <select
          id="student"
          value={form.studentId}
          onChange={(e) => form.setStudentId(e.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="">เลือกนักเรียน...</option>
          {[...store.students].sort(byClassNo).map((s) => (
            <option key={s.studentId} value={s.studentId}>
              {s.fullName} ({s.roomName} เลขที่ {s.classNo})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rule">ประเภทความประพฤติ</Label>
        <select
          id="rule"
          value={form.ruleId}
          onChange={(e) => form.setRuleId(e.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="">เลือกจากกฎความประพฤติ...</option>
          {store.behaviorRules
            .filter((r) => r.isActive)
            .map((r) => (
              <option key={r.ruleId} value={r.ruleId}>
                {r.name} ({r.scoreDelta > 0 ? `+${r.scoreDelta}` : r.scoreDelta})
              </option>
            ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="desc">รายละเอียดเหตุการณ์</Label>
        <Textarea
          id="desc"
          value={form.description}
          onChange={(e) => form.setDescription(e.target.value)}
          placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)"
          rows={3}
        />
      </div>

      <Button className="w-full" onClick={form.save} disabled={!form.canSave}>
        บันทึกความประพฤติ
      </Button>

      {form.saved && (
        <p className="rounded-lg bg-risk-green-bg px-3 py-2 text-center text-[12px] font-semibold text-risk-green">
          {form.notifiedGuardians > 0
            ? `บันทึกเรียบร้อย · แจ้งผู้ปกครองแล้ว ${form.notifiedGuardians} คน`
            : "บันทึกเรียบร้อย"}
        </p>
      )}
    </div>
  );
}

export function RulesList() {
  const store = useStore();
  return (
    <div className="divide-y divide-border">
      {store.behaviorRules
        .filter((r) => r.isActive)
        .map((rule) => (
          <div key={rule.ruleId} className="flex items-center justify-between py-2.5">
            <div>
              <div className="text-[13px] font-medium">{rule.name}</div>
              <div className="text-[11px] text-muted-foreground">
                ระดับ: {SEVERITY_LABEL[rule.severity]}
              </div>
            </div>
            <span
              className={
                rule.scoreDelta > 0
                  ? "text-sm font-bold text-risk-green"
                  : "text-sm font-bold text-risk-red"
              }
            >
              {rule.scoreDelta > 0 ? `+${rule.scoreDelta}` : rule.scoreDelta}
            </span>
          </div>
        ))}
    </div>
  );
}
