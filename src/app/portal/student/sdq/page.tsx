"use client";

import { useState } from "react";
import { HeartHandshake } from "lucide-react";
import { WindowLocked } from "@/components/shared/window-locked";
import { lockedWindowFor } from "@/lib/periods";
import { MobileShell } from "@/components/layout/mobile-shell";
import { SdqForm } from "@/components/assessment/sdq-form";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";

const DEMO_STUDENT_ID = "30125";

export default function StudentSdqPage() {
  const store = useStore();
  const [justSubmitted, setJustSubmitted] = useState(false);

  // ส่งแล้วทำซ้ำไม่ได้ (เดิมส่งซ้ำจะเขียนทับผลเดิม)
  const alreadyDone =
    store
      .sdqOf(DEMO_STUDENT_ID)
      .find((s) => s.rater === "student" && s.round === 1)?.status === "completed";

  // ปิดรับแล้ว (UC9) นักเรียนติดต่อครูประจำชั้น
  const lockedSdq = lockedWindowFor(store.assessmentWindows, "sdq");

  return (
    <MobileShell
      title="แบบประเมิน SDQ"
      subtitle="ฉบับนักเรียนประเมินตนเอง"
      role="student"
      back="/portal/student"
    >
      <div className="space-y-4 p-5">
        <div className="flex gap-2.5 rounded-xl border border-blue-200 bg-accent p-3.5">
          <HeartHandshake className="size-5 shrink-0 text-primary" />
          <p className="text-[12.5px] leading-relaxed text-accent-foreground">
            คำตอบของนักเรียนเป็นความลับ ครูจะเห็นเฉพาะผลสรุปเพื่อใช้ดูแลช่วยเหลือเท่านั้น
          </p>
        </div>

        {justSubmitted || alreadyDone ? (
          // ไม่แสดงคะแนนหรือผลแปลให้นักเรียน — ผลใช้เพื่อให้ครูดูแล ไม่ใช่ป้ายที่เด็กต้องรับรู้
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-base font-bold">
                {justSubmitted ? "ส่งแบบประเมินเรียบร้อย" : "ทำแบบประเมินนี้แล้ว"}
              </h2>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
                ขอบคุณที่ตอบแบบประเมินนะ หากอยากพูดคุยหรือมีเรื่องไม่สบายใจ
                สามารถติดต่อครูประจำชั้นได้ตลอดเวลา
              </p>
              <LinkButton className="mt-5 w-full" href="/portal/student">
                กลับหน้าข้อมูลของฉัน
              </LinkButton>
            </CardContent>
          </Card>
        ) : lockedSdq ? (
          <WindowLocked window={lockedSdq} contact="ครูประจำชั้น" backHref="/portal/student" backLabel="กลับหน้าข้อมูลของฉัน" />
        ) : (
          <SdqForm
            studentId={DEMO_STUDENT_ID}
            rater="student"
            layout="mobile"
            onSubmit={(answers) => {
              store.saveSdq(DEMO_STUDENT_ID, "student", answers);
              setJustSubmitted(true);
            }}
          />
        )}
      </div>
    </MobileShell>
  );
}
