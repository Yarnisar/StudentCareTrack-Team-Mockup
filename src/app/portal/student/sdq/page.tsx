"use client";

import { useState } from "react";
import { HeartHandshake } from "lucide-react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { SdqForm } from "@/components/assessment/sdq-form";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { usePortalStudent } from "@/lib/portal";
import { SDQ_LEVEL_LABEL, SdqAssessment } from "@/lib/types";


export default function StudentSdqPage() {
  const store = useStore();
  const portalStudentId = usePortalStudent().studentId ?? "";
  const [saved, setSaved] = useState<SdqAssessment | null>(null);

  return (
    <MobileShell
      title="แบบประเมิน SDQ"
      subtitle="ฉบับนักเรียนประเมินตนเอง"
      role="student"
      back="/portal/student/card"
    >
      <div className="space-y-4 p-5">
        <div className="flex gap-2.5 rounded-xl border border-blue-200 bg-accent p-3.5">
          <HeartHandshake className="size-5 shrink-0 text-primary" />
          <p className="text-[12.5px] leading-relaxed text-accent-foreground">
            คำตอบของนักเรียนเป็นความลับ ครูจะเห็นเฉพาะผลสรุปเพื่อใช้ดูแลช่วยเหลือเท่านั้น
          </p>
        </div>

        {saved ? (
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-base font-bold">ส่งแบบประเมินเรียบร้อย</h2>
              <p className="mt-2 text-[13.5px] text-muted-foreground">
                คะแนนรวม {saved.totalDifficulties} คะแนน · แปลผล:{" "}
                {saved.level ? SDQ_LEVEL_LABEL[saved.level] : "-"}
              </p>
              <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
                ขอบคุณที่ตอบแบบประเมิน หากนักเรียนต้องการพูดคุยกับครู
                สามารถติดต่อครูประจำชั้นได้ตลอดเวลา
              </p>
              <LinkButton className="mt-5 w-full" href="/portal/student/card">
                กลับหน้าบัตรนักเรียน
              </LinkButton>
            </CardContent>
          </Card>
        ) : (
          <SdqForm
            rater="student"
            layout="mobile"
            onSubmit={(answers) => {
              const res = store.saveSdq(portalStudentId, "student", answers);
              if (res.ok) setSaved(res.form);
            }}
          />
        )}
      </div>
    </MobileShell>
  );
}
