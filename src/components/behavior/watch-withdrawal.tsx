"use client";

/**
 * ครูที่ปรึกษายืนยันถอนสถานะเฝ้าระวัง หรือคงสถานะไว้พร้อมเหตุผล (UC8 สถานการณ์ C)
 * ระบบไม่ถอนสถานะเอง แม้คะแนนกลับเข้าเกณฑ์แล้ว (Alt-F ข้อ 3) ใช้ทั้งหน้ารายการรอยืนยันและหน้านักเรียน
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TEACHER_ASSIGNMENTS } from "@/lib/roles";
import { useStore } from "@/lib/store";

export function WatchWithdrawal({ studentId, className = "mb-3" }: { studentId: string; className?: string }) {
  const store = useStore();
  const [keeping, setKeeping] = useState(false);
  const [reason, setReason] = useState("");
  const last = store.watchDecisions.filter((d) => d.studentId === studentId && !d.withdraw).at(-1);
  // เฉพาะครูที่ปรึกษาของห้องนักเรียนคนนี้
  const homeroom = TEACHER_ASSIGNMENTS[store.role]?.homeroomRoom;
  if (!homeroom || store.getStudent(studentId)?.roomName !== homeroom) return null;
  return (
    <div className={`${className} rounded-lg border border-border p-3 text-[13px]`}>
      <div className="font-semibold">คะแนนกลับเข้าเกณฑ์แล้ว รอยืนยันถอนสถานะเฝ้าระวัง</div>
      <div className="text-[12px] text-muted-foreground">
        ระบบไม่ถอนสถานะเอง ตรวจประวัติแล้วยืนยันหรือคงสถานะไว้
        {last && ` · คงสถานะครั้งล่าสุด: ${last.reason}`}
      </div>
      {keeping ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <Input aria-label="เหตุผลที่คงสถานะ" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="เหตุผลที่คงสถานะ (จำเป็น)" className="h-9 min-w-0 flex-1" />
          <Button size="sm" variant="outline" onClick={() => setKeeping(false)}>
            ย้อนกลับ
          </Button>
          <Button
            size="sm"
            disabled={reason.trim() === ""}
            onClick={() => {
              store.resolveWatchWithdrawal(studentId, false, reason.trim());
              setKeeping(false);
              setReason("");
            }}
          >
            บันทึก
          </Button>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => store.resolveWatchWithdrawal(studentId, true)}>
            ยืนยันถอนสถานะ
          </Button>
          <Button size="sm" variant="outline" onClick={() => setKeeping(true)}>
            คงสถานะไว้
          </Button>
        </div>
      )}
    </div>
  );
}
