"use client";

import { useState } from "react";
import { HeartHandshake } from "lucide-react";
import { WindowLocked } from "@/components/shared/window-locked";
import { lockedWindowFor, windowFor, windowStatus } from "@/lib/periods";
import { formatThaiDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { MobileShell } from "@/components/layout/mobile-shell";
import { SdqForm } from "@/components/assessment/sdq-form";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { SDQ_PORTAL_LABEL } from "@/lib/types";
import { AssessmentTabs } from "@/components/portal/assessment-tabs";

const DEMO_STUDENT_ID = "30125";

export default function StudentSdqPage() {
  const store = useStore();
  const [justSubmitted, setJustSubmitted] = useState(false);

  const [editing, setEditing] = useState(false);
  // ส่งแล้วแก้คำตอบได้จนกว่าจะปิดรับ ระบบเก็บประวัติ และครูต้องตรวจผลใหม่ (UC10 ข้อ 8, 13)
  const own = store.sdqSetOf(DEMO_STUDENT_ID).find((s) => s.rater === "student");
  const alreadyDone = own?.status === "completed";
  const sdqWindow = windowFor(store.assessmentWindows, "sdq", store.sdqRound);
  const canEdit = alreadyDone && !!sdqWindow && windowStatus(sdqWindow) === "open";

  const releasedSdq = store.sdqReview(DEMO_STUDENT_ID).review?.released.sdq;
  // ปิดรับแล้ว (UC9) นักเรียนติดต่อครูประจำชั้น
  const lockedSdq = lockedWindowFor(store.assessmentWindows, "sdq", store.sdqRound);

  return (
    <MobileShell
      title="แบบประเมิน SDQ"
      subtitle="ฉบับนักเรียนประเมินตนเอง"
      role="student"
      back="/portal/student"
    >
      <div className="space-y-4 p-5">
        <AssessmentTabs studentId={DEMO_STUDENT_ID} />
        <div className="flex gap-2.5 rounded-xl border border-violet-200 bg-accent p-3.5">
          <HeartHandshake className="size-5 shrink-0 text-primary" />
          <p className="text-[12.5px] leading-relaxed text-accent-foreground">
            คำตอบของนักเรียนเป็นความลับ ครูจะเห็นเฉพาะผลสรุปเพื่อใช้ดูแลช่วยเหลือเท่านั้น
          </p>
        </div>

        {!editing && (justSubmitted || alreadyDone) ? (
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
              {/* ผลเปิดให้เห็นหลังครูที่ปรึกษาตรวจแล้วเท่านั้น (UC10 สถานการณ์ B) */}
              <p className="mt-3 rounded-lg bg-surface px-3 py-2.5 text-[13px]">
                {releasedSdq ? (
                  <>
                    ครูประจำชั้นตรวจผลแล้ว: <b>{SDQ_PORTAL_LABEL[releasedSdq]}</b>
                  </>
                ) : (
                  <span className="text-muted-foreground">รอครูประจำชั้นตรวจผล เมื่อตรวจแล้วจะเห็นผลสรุปที่หน้านี้</span>
                )}
              </p>
              {canEdit && (
                <Button variant="outline" className="mt-5 h-11 w-full" onClick={() => setEditing(true)}>
                  แก้คำตอบ (ได้ถึง {formatThaiDate(sdqWindow!.closeDate)})
                </Button>
              )}
              <LinkButton className={`${canEdit ? "mt-2.5" : "mt-5"} w-full`} href="/portal/student">
                กลับหน้าหลัก
              </LinkButton>
            </CardContent>
          </Card>
        ) : lockedSdq ? (
          <WindowLocked window={lockedSdq} contact="ครูประจำชั้น" backHref="/portal/student" backLabel="กลับหน้าหลัก" />
        ) : (
          <SdqForm
            studentId={DEMO_STUDENT_ID}
            rater="student"
            layout="mobile"
            initial={editing ? own?.answers : undefined}
            submitLabel={editing ? "ส่งคำตอบที่แก้ไข" : undefined}
            onSubmit={(answers) => {
              store.saveSdq(DEMO_STUDENT_ID, "student", answers);
              setJustSubmitted(true);
              setEditing(false);
            }}
          />
        )}
      </div>
    </MobileShell>
  );
}
