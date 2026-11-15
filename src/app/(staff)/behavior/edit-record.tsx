"use client";

/**
 * แก้ไขหรือยกเลิกบันทึกพฤติกรรม (UC8 สถานการณ์ B)
 * - เฉพาะผู้บันทึก ภายในระยะเวลาแก้ไขที่ผู้ดูแลระบบกำหนด (ตรวจที่ store.behaviorEditable, Alt-E)
 * - ตรวจวันที่ (ไม่เกินระยะบันทึกย้อนหลัง ย้อนหลังต้องมีเหตุผล) และกฎที่ใช้ได้ แล้วแสดงผลต่อคะแนนก่อนยืนยัน (ข้อ 6)
 * - ยกเลิกแล้วไม่นับคะแนนแต่ยังเก็บประวัติ แจ้งผู้ปกครองในระบบ และบอกเมื่อสถานะเฝ้าระวังเปลี่ยน (ข้อ 9–12, Alt-D)
 */

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { canRecordRule, ruleScoreText } from "@/lib/behavior-rules";
import { formatThaiDate } from "@/lib/format";
import { DEMO_TODAY } from "@/lib/mock-data";
import { shiftDate } from "@/lib/periods";
import { useStore } from "@/lib/store";
import type { BehaviorRecord } from "@/lib/types";

export function EditBehaviorRecord({ record, onClose }: { record: BehaviorRecord; onClose: () => void }) {
  const store = useStore();
  const student = store.getStudent(record.studentId);
  const cfg = store.behaviorScoreConfig;
  const minDate = shiftDate(DEMO_TODAY, -cfg.backdateDays);
  const recordedOn = (record.recordedAt ?? record.occurredAt).slice(0, 10);

  const [ruleId, setRuleId] = useState(record.ruleId);
  const [occurredOn, setOccurredOn] = useState(record.occurredAt.slice(0, 10));
  const [description, setDescription] = useState(record.description === "-" ? "" : record.description);
  const [backdateReason, setBackdateReason] = useState(record.backdateReason ?? "");
  const [mode, setMode] = useState<"edit" | "cancel" | "done">("edit");
  const [cancelReason, setCancelReason] = useState("");
  const [result, setResult] = useState("");

  // กฎที่ใช้ได้: เปิดใช้ ไม่ถูกยกเลิก และบทบาทนี้บันทึกได้ (กฎเดิมแสดงไว้เสมอเพื่อให้เห็นค่าปัจจุบัน)
  const rules = store.behaviorRules.filter((r) => r.ruleId === record.ruleId || (r.isActive && !r.cancelled && canRecordRule(r)));
  const rule = store.behaviorRules.find((r) => r.ruleId === ruleId);
  const backdated = occurredOn < recordedOn;

  const errors = [
    occurredOn > DEMO_TODAY && "วันที่เกิดเหตุต้องไม่เกินวันนี้",
    occurredOn < minDate && `บันทึกย้อนหลังได้ไม่เกิน ${cfg.backdateDays} วัน (ตั้งแต่ ${formatThaiDate(minDate)})`,
    rule?.cancelled && "กฎนี้ถูกยกเลิกแล้ว เลือกพฤติกรรมอื่น",
    rule && !canRecordRule(rule) && "บทบาทนี้บันทึกกฎนี้ไม่ได้",
    backdated && backdateReason.trim() === "" && "ระบุเหตุผลที่บันทึกย้อนหลัง",
  ].filter(Boolean) as string[];
  const changed =
    ruleId !== record.ruleId ||
    occurredOn !== record.occurredAt.slice(0, 10) ||
    description.trim() !== (record.description === "-" ? "" : record.description) ||
    backdateReason !== (record.backdateReason ?? "");

  const preview = store.previewBehaviorChange(record.recordId, mode === "cancel" ? "cancel" : { ruleId, occurredOn });

  const watchNote = (() => {
    if (preview.levelAfter > preview.levelBefore)
      return `เข้าสถานะเฝ้าระวังระดับ ${preview.levelAfter} · แจ้งครูที่ปรึกษา นักเรียน และผู้ปกครอง`;
    if (preview.levelAfter < preview.levelBefore)
      return preview.levelAfter === 0 ? "พ้นสถานะเฝ้าระวัง" : `ระดับเฝ้าระวังลดเป็นระดับ ${preview.levelAfter}`;
    return "";
  })();

  const finish = (text: string) => {
    setResult([text, "แจ้งผู้ปกครองในระบบแล้ว", watchNote].filter(Boolean).join(" · "));
    setMode("done");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-5 sm:rounded-2xl">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-bold">
              {mode === "cancel" ? "ยกเลิกบันทึกพฤติกรรม" : mode === "done" ? "บันทึกแล้ว" : "แก้ไขบันทึกพฤติกรรม"}
            </h2>
            <p className="text-[12.5px] text-muted-foreground">
              {student?.fullName} · {student?.roomName} เลขที่ {student?.classNo} · บันทึกเมื่อ {formatThaiDate(recordedOn)}
            </p>
          </div>
          <button type="button" aria-label="ปิด" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>

        {mode === "done" ? (
          <>
            <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-[13.5px] leading-relaxed">{result}</p>
            <Button className="mt-4 h-11 w-full" onClick={onClose}>
              เสร็จ
            </Button>
          </>
        ) : mode === "cancel" ? (
          <>
            <p className="mt-4 text-[13.5px]">
              ยกเลิก “{store.behaviorRules.find((r) => r.ruleId === record.ruleId)?.name}” วันที่ {formatThaiDate(record.occurredAt)} ระบบจะไม่นับคะแนนรายการนี้
              แต่ยังเก็บประวัติไว้
            </p>
            <Textarea
              className="mt-3"
              rows={2}
              aria-label="เหตุผลที่ยกเลิก"
              placeholder="เหตุผลที่ยกเลิก เช่น บันทึกผิดคน"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <ScoreLine preview={preview} note={watchNote} />
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="h-11 flex-1" onClick={() => setMode("edit")}>
                กลับ
              </Button>
              <Button
                variant="destructive"
                className="h-11 flex-1"
                disabled={cancelReason.trim() === ""}
                onClick={() => {
                  store.cancelBehaviorRecord(record.recordId, cancelReason.trim());
                  finish("ยกเลิกรายการแล้ว");
                }}
              >
                ยืนยันยกเลิกรายการ
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-4 space-y-3">
              <label className="block text-[12.5px] font-medium text-muted-foreground">
                พฤติกรรม
                <NativeSelect value={ruleId} onChange={(e) => setRuleId(e.target.value)} className="mt-1 w-full">
                  {rules.map((r) => (
                    <option key={r.ruleId} value={r.ruleId}>
                      {r.name} ({ruleScoreText(r)}){r.cancelled ? " · ยกเลิกแล้ว" : ""}
                    </option>
                  ))}
                </NativeSelect>
              </label>
              <label className="block text-[12.5px] font-medium text-muted-foreground">
                วันที่เกิดเหตุ
                <Input
                  type="date"
                  value={occurredOn}
                  min={minDate}
                  max={DEMO_TODAY}
                  onChange={(e) => setOccurredOn(e.target.value)}
                  className="mt-1"
                />
              </label>
              {backdated && (
                <label className="block text-[12.5px] font-medium text-muted-foreground">
                  เหตุผลที่บันทึกย้อนหลัง
                  <Input value={backdateReason} onChange={(e) => setBackdateReason(e.target.value)} className="mt-1" />
                </label>
              )}
              <label className="block text-[12.5px] font-medium text-muted-foreground">
                รายละเอียดเหตุการณ์
                <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
              </label>
            </div>

            {errors.length > 0 && (
              <ul className="mt-3 space-y-1 text-[12.5px] text-destructive">
                {errors.map((e) => (
                  <li key={e}>· {e}</li>
                ))}
              </ul>
            )}
            {changed && errors.length === 0 && <ScoreLine preview={preview} note={watchNote} />}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                className="h-11 flex-1"
                disabled={!changed || errors.length > 0}
                onClick={() => {
                  store.updateBehaviorRecord(record.recordId, {
                    ruleId,
                    occurredOn,
                    description: description.trim() || "-",
                    backdateReason: backdated ? backdateReason.trim() : undefined,
                  });
                  finish("แก้ไขรายการแล้ว");
                }}
              >
                บันทึกการแก้ไข
              </Button>
              <Button variant="outline" className="h-11" onClick={() => setMode("cancel")}>
                ยกเลิกรายการนี้
              </Button>
            </div>
            <p className="mt-3 text-[11.5px] text-muted-foreground">
              แก้ไขหรือยกเลิกได้ภายใน {cfg.editDays} วันหลังบันทึก ระบบเก็บประวัติทุกครั้ง
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function ScoreLine({ preview, note }: { preview: { scoreBefore: number; scoreAfter: number }; note: string }) {
  return (
    <div className="mt-3 rounded-xl bg-surface px-4 py-3 text-[13px]">
      คะแนนความประพฤติ <b className="tabular-nums">{preview.scoreBefore}</b> → <b className="tabular-nums">{preview.scoreAfter}</b>
      {note && <div className="mt-0.5 font-semibold">{note}</div>}
    </div>
  );
}
