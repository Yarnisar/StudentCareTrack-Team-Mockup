"use client";

/**
 * PROTOTYPE ONLY — ส่วนที่ทุก variant ใช้ร่วมกัน (ทิ้งได้)
 *
 * คำถามที่ต้นแบบนี้ตอบ: "หน้าความประพฤติควรจัดวางอย่างไร ให้ชื่อพฤติกรรมและรายละเอียดเหตุการณ์
 * แสดงได้ครบโดยไม่ถูกตัด" — ของเดิมบีบรายการไว้ในคอลัมน์กว้างตายตัวข้างแถบฟอร์มด้านขวา
 * เหลือที่ให้ข้อความราว 400px จึงต้อง truncate ทิ้ง
 *
 * ไฟล์นี้เก็บเฉพาะ "เนื้อหา" ที่ใช้ซ้ำ (ฟอร์ม, การ์ดสถิติ, ป้าย) ส่วน "การจัดวาง"
 * เป็นหน้าที่ของแต่ละ variant ซึ่งเป็นสิ่งที่กำลังเปรียบเทียบกัน
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { behaviorRules, useStore } from "@/lib/store";
import type { BehaviorRecord, BehaviorRule } from "@/lib/types";

export const SEVERITY_LABEL: Record<BehaviorRule["severity"], string> = {
  minor: "เล็กน้อย",
  moderate: "ปานกลาง",
  severe: "ร้ายแรง",
  positive: "คะแนนบวก",
};

export function ruleOf(ruleId: string) {
  return behaviorRules.find((r) => r.ruleId === ruleId);
}

export function useBehaviorForm() {
  const store = useStore();
  const [studentId, setStudentId] = useState("");
  const [ruleId, setRuleId] = useState("");
  const [description, setDescription] = useState("");
  const [saved, setSaved] = useState(false);

  const canSave = studentId !== "" && ruleId !== "";

  const save = () => {
    store.addBehaviorRecord(studentId, ruleId, description || "-");
    setDescription("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return {
    studentId,
    setStudentId,
    ruleId,
    setRuleId,
    description,
    setDescription,
    saved,
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
          {store.students.map((s) => (
            <option key={s.studentId} value={s.studentId}>
              {s.fullName} ({s.roomName} เลขที่ {s.classNo})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rule">ประเภทพฤติกรรม</Label>
        <select
          id="rule"
          value={form.ruleId}
          onChange={(e) => form.setRuleId(e.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="">เลือกจากกฎความประพฤติ...</option>
          {behaviorRules.map((r) => (
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
        บันทึกพฤติกรรม
      </Button>

      {form.saved && (
        <p className="rounded-lg bg-risk-green-bg px-3 py-2 text-center text-[12.5px] font-semibold text-risk-green">
          บันทึกเรียบร้อย · แจ้งเตือนครูประจำชั้นแล้ว
        </p>
      )}
    </div>
  );
}

export function RulesList() {
  return (
    <div className="divide-y divide-border">
      {behaviorRules.map((rule) => (
        <div key={rule.ruleId} className="flex items-center justify-between py-2.5">
          <div>
            <div className="text-[13.5px] font-medium">{rule.name}</div>
            <div className="text-[11.5px] text-muted-foreground">
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

export function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-[13px] font-semibold text-muted-foreground">{label}</div>
        <div className={accent ? "mt-2 text-2xl font-bold text-primary" : "mt-2 text-2xl font-bold"}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

export function SourceBadge({ source }: { source: BehaviorRecord["source"] }) {
  return (
    <span
      className={
        source === "qr_checkin"
          ? "shrink-0 rounded-md bg-accent px-2 py-1 text-[11px] font-semibold text-primary"
          : "shrink-0 rounded-md bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground"
      }
    >
      {source === "qr_checkin" ? "QR อัตโนมัติ" : "บันทึกโดยครู"}
    </span>
  );
}

export function ScoreChip({ delta, size = "md" }: { delta: number; size?: "md" | "lg" }) {
  const positive = delta > 0;
  return (
    <span
      className={`shrink-0 rounded-md text-center font-bold ${
        size === "lg" ? "px-3 py-1.5 text-base" : "w-12 py-1 text-sm"
      } ${positive ? "bg-risk-green-bg text-risk-green" : "bg-risk-red-bg text-risk-red"}`}
    >
      {positive ? `+${delta}` : delta}
    </span>
  );
}
