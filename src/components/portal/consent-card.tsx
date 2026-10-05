"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatThaiDate } from "@/lib/format";
import { useStore } from "@/lib/store";

/**
 * ความยินยอมให้ส่งต่อข้อมูลไปหน่วยงานภายนอก — ปีการศึกษาละ 1 คำตอบต่อนักเรียน
 * ผู้ปกครองคนใดของนักเรียนก็ตอบได้ ตอบแล้วแสดงผลแทนปุ่ม
 */
export function ConsentCard({ studentId }: { studentId: string }) {
  const store = useStore();
  const consent = store.consentOf(studentId);
  const year = store.currentTerm.academicYear;
  const [choice, setChoice] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (consent) {
    return (
      <div className="flex gap-3 rounded-2xl border border-border bg-card p-4">
        <ShieldCheck className="size-5 shrink-0 text-muted-foreground" />
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
          ความยินยอมส่งต่อข้อมูลปีการศึกษา {year}:{" "}
          <b className="text-foreground">{consent.granted ? "ยินยอม" : "ไม่ยินยอม"}</b> · ตอบโดย{" "}
          {consent.guardianUserId === store.currentUser.userId ? "คุณ" : store.nameOf(consent.guardianUserId)} เมื่อ{" "}
          {formatThaiDate(consent.respondedAt)}
        </p>
      </div>
    );
  }

  const submit = (granted: boolean) => {
    const res = store.recordConsent(studentId, granted);
    if (!res.ok) setError(res.error);
    setChoice(null);
  };

  return (
    <div className="rounded-2xl border border-blue-200 bg-accent p-4">
      <div className="flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white">
          <ShieldCheck className="size-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] font-bold">ความยินยอมส่งต่อข้อมูล ปีการศึกษา {year}</div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
            หากบุตรหลานต้องได้รับความช่วยเหลือจากหน่วยงานภายนอก (เช่น โรงพยาบาล) โรงเรียนจะส่งต่อข้อมูลได้เมื่อได้รับความยินยอมเท่านั้น
            ไม่มีผลต่อการดูแลภายในโรงเรียน ผู้ปกครองคนใดตอบก็ได้ ปีละ 1 ครั้ง
          </p>
        </div>
      </div>
      {choice === null ? (
        <div className="mt-3 flex gap-2.5">
          <Button variant="outline" className="h-11 flex-1 bg-card" onClick={() => setChoice(false)}>
            ไม่ยินยอม
          </Button>
          <Button className="h-11 flex-1" onClick={() => setChoice(true)}>
            ยินยอม
          </Button>
        </div>
      ) : (
        <div className="mt-3 rounded-xl bg-card p-3">
          <p className="text-[12.5px]">
            ยืนยันคำตอบ <b>{choice ? "ยินยอม" : "ไม่ยินยอม"}</b>? เมื่อตอบแล้วจะแก้ไขในปีการศึกษานี้ไม่ได้
          </p>
          <div className="mt-2.5 flex gap-2.5">
            <Button variant="outline" className="h-10 flex-1" onClick={() => setChoice(null)}>
              กลับ
            </Button>
            <Button className="h-10 flex-1" onClick={() => submit(choice)}>
              ยืนยัน
            </Button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-[12px] font-semibold text-risk-red">{error}</p>}
    </div>
  );
}
