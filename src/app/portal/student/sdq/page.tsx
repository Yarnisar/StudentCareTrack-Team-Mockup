"use client";

import { useState } from "react";
import { CheckCircle2, HeartHandshake } from "lucide-react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { SdqForm } from "@/components/assessment/sdq-form";
import { HelpBlock } from "@/components/portal/help-block";
import { Card, CardContent } from "@/components/ui/card";
import { formatThaiDate } from "@/lib/format";
import { usePortalStudent } from "@/lib/portal";
import { isPrimaryGrade } from "@/lib/rules";
import { useStore } from "@/lib/store";

/**
 * SDQ ฉบับนักเรียน — ทำได้เฉพาะเมื่อมีคำขอรอบนี้และยังไม่ส่ง
 * นักเรียนไม่เห็นคะแนนหรือผลของตัวเอง เห็นแค่ "ส่งแล้ว" กับวันที่
 */
export default function StudentSdqPage() {
  const store = useStore();
  const studentId = usePortalStudent().studentId ?? "";
  const student = store.getStudent(studentId);
  const [error, setError] = useState<string | null>(null);

  const primary = student ? isPrimaryGrade(student.gradeLevel) : false;
  const form = primary ? undefined : store.sdqFormFor(studentId, "student");
  const block = form ? store.sdqBlockReason(studentId, "student") : null;
  const canTake = form?.status === "pending" && block === null;

  return (
    <MobileShell title="แบบประเมิน SDQ" subtitle="ฉบับนักเรียนประเมินตนเอง" role="student" back="/portal/student">
      <div className="space-y-4 p-5">
        {form?.status === "submitted" ? (
          <Card>
            <CardContent className="flex flex-col items-center p-6 text-center">
              <CheckCircle2 className="size-10 text-risk-green" />
              <h2 className="mt-2 text-base font-bold">ส่งแล้ว</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                เมื่อ {form.submittedAt ? formatThaiDate(form.submittedAt) : "-"} · ขอบคุณที่ตอบแบบประเมิน
              </p>
            </CardContent>
          </Card>
        ) : canTake ? (
          <>
            <div className="flex gap-2.5 rounded-xl border border-blue-200 bg-accent p-3.5">
              <HeartHandshake className="size-5 shrink-0 text-primary" />
              <p className="text-[12.5px] leading-relaxed text-accent-foreground">
                ไม่มีคำตอบถูกหรือผิด ตอบตามความรู้สึกจริงในช่วง 6 เดือนที่ผ่านมา คำตอบใช้เพื่อการดูแลช่วยเหลือเท่านั้น
              </p>
            </div>
            <SdqForm
              rater="student"
              layout="mobile"
              submitLabel="ส่งแบบประเมิน"
              onSubmit={(answers) => {
                const res = store.saveSdq(studentId, "student", answers);
                setError(res.ok ? null : res.error);
              }}
            />
            {error && <p className="text-[12px] font-semibold text-risk-red">{error}</p>}
          </>
        ) : (
          <p className="rounded-xl bg-card px-4 py-3.5 text-[13px] text-muted-foreground">
            {form && block ? block : "ตอนนี้ยังไม่มีแบบประเมินที่ต้องทำ"}
          </p>
        )}

        <HelpBlock />
      </div>
    </MobileShell>
  );
}
