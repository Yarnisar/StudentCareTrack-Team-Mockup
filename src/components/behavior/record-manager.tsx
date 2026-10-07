"use client";

/**
 * จัดการบันทึกความประพฤติ: แก้ไข (ผู้บันทึก ภายใน 24 ชม.) และยกเลิกพร้อมเหตุผล (ไม่มีการลบ)
 * - ค่าเริ่มต้นแสดง "บันทึกของฉัน"
 * - เลือกนักเรียนเพื่อดูบันทึกทุกสถานะของคนนั้น พร้อมคะแนนความประพฤติ /100
 */

import { useState } from "react";
import { AlertTriangle, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isAutoConfirmed } from "@/lib/behavior";
import { byClassNo, formatThaiDate, formatThaiDateTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import { BEHAVIOR_SCORE_BASE, BEHAVIOR_STATUS_LABEL, type BehaviorRecord, type BehaviorRecordStatus } from "@/lib/types";

const MINE = "__mine__";
const MINE_LIMIT = 8;

export function BehaviorRecordManager() {
  const store = useStore();
  const [studentId, setStudentId] = useState(MINE);
  const role = store.currentUser.role;
  if (role !== "admin_school" && role !== "teacher_homeroom" && role !== "teacher_general") return null;

  const me = store.currentUser.userId;
  const records =
    studentId === MINE
      ? store.behaviorRecords.filter((r) => r.recordedBy === me).slice(0, MINE_LIMIT)
      : store.behaviorOf(studentId, { includeVoided: true });

  const score = studentId === MINE ? null : store.behaviorScoreOf(studentId);
  const alertScore = store.schoolSettings.behaviorAlertScore;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-bold">แก้ไข / ยกเลิกบันทึก</h2>
            <p className="text-[12px] text-muted-foreground">
              แก้ไขได้ภายใน 24 ชั่วโมง หลังจากนั้นยกเลิกพร้อมเหตุผลได้เท่านั้น
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="manage-student" className="text-[12px]">
              แสดงบันทึกของ
            </Label>
            <select
              id="manage-student"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="h-9 rounded-lg border border-border bg-card px-3 text-sm"
            >
              <option value={MINE}>บันทึกของฉัน (ล่าสุด)</option>
              {[...store.students].sort(byClassNo).map((s) => (
                <option key={s.studentId} value={s.studentId}>
                  {s.fullName} ({s.roomName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {score !== null && (
          <div
            className={
              score < alertScore
                ? "mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-risk-red-bg px-4 py-2.5 text-[13px] text-risk-red"
                : "mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-[13px]"
            }
          >
            <span className="font-semibold">
              คะแนนความประพฤติ {score}/{BEHAVIOR_SCORE_BASE}
            </span>
            {score < alertScore && (
              <span className="flex items-center gap-1 font-semibold">
                <AlertTriangle className="size-4" /> ต่ำกว่าเกณฑ์ {alertScore} — พิจารณาเปิด care case
              </span>
            )}
          </div>
        )}

        {records.length === 0 ? (
          <p className="rounded-lg bg-muted px-4 py-3 text-center text-[13px] text-muted-foreground">
            ไม่มีบันทึก
          </p>
        ) : (
          <div className="space-y-2.5">
            {records.map((rec) => (
              <RecordRow key={rec.recordId} rec={rec} showStudent={studentId === MINE} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const STATUS_CLASS: Record<BehaviorRecordStatus, string> = {
  pending: "bg-risk-amber-bg text-risk-amber",
  confirmed: "bg-risk-green-bg text-risk-green",
  excused: "bg-accent text-primary",
  voided: "bg-muted text-muted-foreground line-through",
};

function RecordRow({ rec, showStudent }: { rec: BehaviorRecord; showStudent: boolean }) {
  const store = useStore();
  const [mode, setMode] = useState<"view" | "edit" | "void">("view");
  const [ruleId, setRuleId] = useState(rec.ruleId);
  const [description, setDescription] = useState(rec.description);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const rule = store.ruleOf(rec.ruleId);
  const student = store.getStudent(rec.studentId);
  const canEdit = store.canEditBehaviorRecord(rec);
  const canVoid = store.canVoidBehaviorRecord(rec);
  const delta = rule?.scoreDelta ?? 0;

  const close = () => {
    setMode("view");
    setError("");
    setReason("");
  };

  const saveEdit = () => {
    const result = store.editBehaviorRecord(rec.recordId, { ruleId, description: description.trim() || "-" });
    if (result.ok) close();
    else setError(result.error);
  };

  const saveVoid = () => {
    const result = store.voidBehaviorRecord(rec.recordId, reason);
    if (result.ok) close();
    else setError(result.error);
  };

  const statusLabel = isAutoConfirmed(rec) ? "ยืนยันอัตโนมัติ" : BEHAVIOR_STATUS_LABEL[rec.status];

  return (
    <div className="rounded-xl border border-border p-3.5">
      <div className="flex flex-wrap items-start gap-3">
        <span
          className={`w-12 shrink-0 rounded-md py-1 text-center text-sm font-bold ${
            rec.status !== "confirmed"
              ? "bg-muted text-muted-foreground"
              : delta > 0
                ? "bg-risk-green-bg text-risk-green"
                : "bg-risk-red-bg text-risk-red"
          }`}
        >
          {delta > 0 ? `+${delta}` : delta}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{rule?.name ?? rec.ruleId}</span>
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${STATUS_CLASS[rec.status]}`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-[13px] break-words">{rec.description}</p>
          <div className="text-[11px] text-muted-foreground">
            {showStudent && student ? `${student.fullName} · ` : ""}
            {formatThaiDateTime(rec.occurredAt)} · ผู้บันทึก {store.nameOf(rec.recordedBy)}
            {rec.decidedBy && rec.source === "qr_checkin" ? ` · ตัดสินโดย ${store.nameOf(rec.decidedBy)}` : ""}
          </div>
          {rec.status === "excused" && rec.decisionReason && (
            <p className="mt-1 text-[12px] text-primary">เหตุผลการยกเว้น: {rec.decisionReason}</p>
          )}
          {rec.status === "voided" && rec.voidReason && (
            <p className="mt-1 text-[12px] text-muted-foreground">เหตุผลการยกเลิก: {rec.voidReason}</p>
          )}
          {canEdit && mode === "view" && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              แก้ไขได้ถึง {formatThaiDateTime(store.editableUntilOf(rec))}
            </p>
          )}
          {rec.status === "pending" && (
            <p className="mt-1 text-[11px] text-risk-amber">
              รอครูประจำชั้นยืนยัน · ยืนยันอัตโนมัติ {formatThaiDate(store.autoConfirmAtOf(rec) ?? rec.createdAt)}
            </p>
          )}
        </div>
        {mode === "view" && (canEdit || canVoid) && (
          <div className="flex gap-2">
            {canEdit && (
              <Button size="sm" variant="outline" onClick={() => setMode("edit")}>
                <Pencil /> แก้ไข
              </Button>
            )}
            {canVoid && (
              <Button size="sm" variant="destructive" onClick={() => setMode("void")}>
                ยกเลิกบันทึก
              </Button>
            )}
          </div>
        )}
      </div>

      {mode === "edit" && (
        <div className="mt-3 space-y-2">
          <select
            aria-label="ประเภทความประพฤติ"
            value={ruleId}
            onChange={(e) => setRuleId(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            {store.behaviorRules
              .filter((r) => r.isActive || r.ruleId === rec.ruleId)
              .map((r) => (
                <option key={r.ruleId} value={r.ruleId}>
                  {r.name} ({r.scoreDelta > 0 ? `+${r.scoreDelta}` : r.scoreDelta})
                </option>
              ))}
          </select>
          <Textarea
            aria-label="รายละเอียดเหตุการณ์"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={saveEdit}>
              บันทึกการแก้ไข
            </Button>
            <Button size="sm" variant="ghost" onClick={close}>
              <X /> ปิด
            </Button>
          </div>
        </div>
      )}

      {mode === "void" && (
        <div className="mt-3 space-y-2">
          <Textarea
            aria-label="เหตุผลการยกเลิก"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="เหตุผลการยกเลิก (จำเป็น)"
            rows={2}
          />
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={saveVoid} disabled={!reason.trim()}>
              ยืนยันการยกเลิกบันทึก
            </Button>
            <Button size="sm" variant="ghost" onClick={close}>
              <X /> ปิด
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-[12px] text-risk-red">{error}</p>}
    </div>
  );
}
