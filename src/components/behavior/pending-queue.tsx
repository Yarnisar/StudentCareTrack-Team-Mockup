"use client";

/**
 * คิวบันทึกรอยืนยัน (บันทึกมาสายจากการสแกน QR)
 * ครูประจำชั้นของนักเรียน / แอดมิน กดยืนยัน หรือยกเว้นพร้อมเหตุผล
 * ถ้าไม่มีใครกดครบ N วันทำการ ระบบยืนยันให้เอง (schoolSettings.pendingAutoConfirmDays)
 * ระหว่างรอ: ไม่มีผลกับคะแนน ผู้ปกครองไม่เห็น และยังไม่นับเป็นการมาสาย
 */

import { useState } from "react";
import { Check, Clock, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatThaiDate, formatThaiDateTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { BehaviorRecord } from "@/lib/types";

export function BehaviorPendingQueue() {
  const store = useStore();
  const [message, setMessage] = useState("");
  const pending = store.myPendingBehaviorRecords;
  const role = store.currentUser.role;
  const isAdmin = role === "admin_school";

  // ครูทั่วไปไม่มีหน้าที่ตัดสินบันทึกรอยืนยัน
  if (role !== "admin_school" && role !== "teacher_homeroom") return null;

  const runDigest = (kind: "pending" | "weekly") => {
    const sent = kind === "pending" ? store.sendPendingLateDigest() : store.sendLateWeeklyDigest();
    setMessage(
      sent.length > 0
        ? `ส่งการแจ้งเตือนแล้ว ${sent.length} รายการ`
        : "ไม่มีการแจ้งเตือนที่ต้องส่ง (ไม่มีรายการ หรือส่งไปแล้วในรอบนี้)"
    );
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h2 className="text-[15.5px] font-bold">บันทึกรอยืนยัน</h2>
          <span className="rounded-full bg-risk-amber-bg px-2.5 py-0.5 text-[12px] font-bold text-risk-amber">
            {pending.length} รายการ
          </span>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          บันทึกมาสายจากการสแกน QR ยังไม่มีผลกับคะแนนและผู้ปกครองยังไม่เห็น จนกว่าจะยืนยัน · ถ้าไม่มีใครกดครบ{" "}
          {store.schoolSettings.pendingAutoConfirmDays} วันทำการ ระบบยืนยันให้เอง
        </p>

        {pending.length === 0 ? (
          <p className="rounded-lg bg-muted px-4 py-3 text-center text-[13px] text-muted-foreground">
            ไม่มีบันทึกรอยืนยันของนักเรียนในความดูแล
          </p>
        ) : (
          <div className="space-y-2.5">
            {pending.map((rec) => (
              <PendingRow key={rec.recordId} rec={rec} />
            ))}
          </div>
        )}

        {isAdmin && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <span className="text-[12px] text-muted-foreground">งานประจำ (สาธิต):</span>
            <Button size="sm" variant="outline" onClick={() => runDigest("pending")}>
              <Send /> สรุปบันทึกรอยืนยันให้ครูประจำชั้น
            </Button>
            <Button size="sm" variant="outline" onClick={() => runDigest("weekly")}>
              <Send /> สรุปการมาสายรายสัปดาห์ให้ผู้ปกครอง
            </Button>
            {message && <span className="text-[12px] font-semibold text-primary">{message}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PendingRow({ rec }: { rec: BehaviorRecord }) {
  const store = useStore();
  const [excusing, setExcusing] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const student = store.getStudent(rec.studentId);
  const rule = store.ruleOf(rec.ruleId);
  const autoAt = store.autoConfirmAtOf(rec);

  const confirm = () => {
    const result = store.confirmBehaviorRecord(rec.recordId);
    if (!result.ok) setError(result.error);
  };

  const excuse = () => {
    const result = store.excuseBehaviorRecord(rec.recordId, reason);
    if (!result.ok) setError(result.error);
  };

  return (
    <div className="rounded-xl border border-border p-3.5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">
            {student?.fullName ?? rec.studentId}{" "}
            <span className="font-normal text-muted-foreground">
              · {student?.roomName} เลขที่ {student?.classNo}
            </span>
          </div>
          <div className="text-[12.5px] text-muted-foreground">
            {rule?.name ?? rec.ruleId} ({rule && rule.scoreDelta > 0 ? `+${rule.scoreDelta}` : rule?.scoreDelta}) ·{" "}
            {formatThaiDateTime(rec.occurredAt)}
          </div>
          {autoAt && (
            <div className="mt-0.5 flex items-center gap-1 text-[11.5px] text-risk-amber">
              <Clock className="size-3" /> ระบบจะยืนยันอัตโนมัติ {formatThaiDate(autoAt)}
            </div>
          )}
        </div>
        {!excusing && (
          <div className="flex gap-2">
            <Button size="sm" onClick={confirm}>
              <Check /> ยืนยัน
            </Button>
            <Button size="sm" variant="outline" onClick={() => setExcusing(true)}>
              ยกเว้น
            </Button>
          </div>
        )}
      </div>

      {excusing && (
        <div className="mt-3 space-y-2">
          <Textarea
            aria-label="เหตุผลการยกเว้น"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="เหตุผลการยกเว้น (จำเป็น) เช่น ผู้ปกครองแจ้งเหตุล่วงหน้า"
            rows={2}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={excuse} disabled={!reason.trim()}>
              บันทึกการยกเว้น
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setExcusing(false);
                setReason("");
                setError("");
              }}
            >
              <X /> ปิด
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-[12px] text-risk-red">{error}</p>}
    </div>
  );
}
