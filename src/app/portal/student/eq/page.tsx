"use client";

/**
 * แบบประเมิน EQ ของนักเรียน (UC10)
 * - นักเรียนมัธยมเลือกไม่ทำ EQ ได้ ระบบบันทึกว่าไม่ทำ (Alt-B)
 * - ส่งแล้วแก้คำตอบได้จนกว่าจะปิดรับ ระบบเก็บประวัติ และครูต้องตรวจใหม่ (ข้อ 8, 13, สถานการณ์ B ข้อ 7)
 * - เห็นผลหลังครูที่ปรึกษาตรวจแล้วเท่านั้น
 */

import { useState } from "react";
import { HeartHandshake } from "lucide-react";
import { EqForm } from "@/components/assessment/eq-form";
import { MobileShell } from "@/components/layout/mobile-shell";
import { AssessmentTabs } from "@/components/portal/assessment-tabs";
import { WindowLocked } from "@/components/shared/window-locked";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EQ_DOMAIN_HINT, EQ_DOMAIN_LABEL, EQ_DOMAINS, EQ_LEVEL_LABEL } from "@/lib/eq";
import { formatThaiDate } from "@/lib/format";
import { PORTAL_STUDENT_ID } from "@/lib/mock-data";
import { lockedWindowFor, windowFor, windowStatus } from "@/lib/periods";
import { draftKey, useStore } from "@/lib/store";

export default function StudentEqPage() {
  const store = useStore();
  const eq = store.eqOf(PORTAL_STUDENT_ID);
  const { state, review } = store.eqReview(PORTAL_STUDENT_ID);
  const [mode, setMode] = useState<"view" | "form" | "confirm_decline">("view");

  const window_ = windowFor(store.assessmentWindows, "eq");
  const locked = lockedWindowFor(store.assessmentWindows, "eq");
  const open = !!window_ && windowStatus(window_) === "open";
  const released = review?.released.eq;

  let body: React.ReactNode;
  if (!eq || !window_) {
    body = <Notice title="ยังไม่มีแบบประเมิน EQ" text="เมื่อโรงเรียนเปิดให้ทำ จะแสดงที่หน้านี้" />;
  } else if (mode === "form") {
    body = (
      <EqForm
        studentId={PORTAL_STUDENT_ID}
        initial={eq.status === "completed" ? eq.answers : undefined}
        submitLabel={eq.status === "completed" ? "ส่งคำตอบที่แก้ไข" : "ส่งแบบประเมิน"}
        onCancel={() => setMode("view")}
        onSubmit={(answers) => {
          store.saveEq(PORTAL_STUDENT_ID, answers);
          setMode("view");
        }}
      />
    );
  } else if (eq.status === "pending" && locked) {
    body = <WindowLocked window={locked} contact="ครูประจำชั้น" backHref="/portal/student" backLabel="กลับหน้าหลัก" />;
  } else if (eq.status === "pending" && !open) {
    body = <Notice title="ยังไม่ถึงช่วงเวลาทำ EQ" text={`เปิดให้ทำ ${formatThaiDate(window_.openDate)} – ${formatThaiDate(window_.closeDate)}`} />;
  } else if (eq.status === "pending" && mode === "confirm_decline") {
    body = (
      <Card>
        <CardContent className="p-5">
          <h2 className="text-[16px] font-bold">ยืนยันไม่ทำแบบประเมิน EQ</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
            ระบบจะบันทึกว่าไม่ทำ EQ ในภาคเรียนนี้ และครูประจำชั้นจะเห็นว่าเลือกไม่ทำ ไม่มีผลต่อคะแนนหรือผลการเรียน
          </p>
          <div className="mt-4 flex gap-2.5">
            <Button variant="outline" className="h-12 flex-1" onClick={() => setMode("view")}>
              กลับ
            </Button>
            <Button
              className="h-12 flex-1"
              onClick={() => {
                store.declineEq(PORTAL_STUDENT_ID);
                setMode("view");
              }}
            >
              ยืนยันไม่ทำ
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  } else if (eq.status === "pending") {
    body = (
      <Card>
        <CardContent className="p-5">
          <h2 className="text-[16px] font-bold">แบบประเมินความฉลาดทางอารมณ์ (EQ)</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
            วัด {EQ_DOMAINS.length} ด้าน คือ {EQ_DOMAINS.map((d) => EQ_DOMAIN_LABEL[d]).join(" ")} · ใช้เวลาประมาณ 5 นาที
            ตอบตามความรู้สึกจริง ไม่มีคำตอบที่ถูกหรือผิด
          </p>
          <ul className="mt-3 space-y-1.5 text-[13px]">
            {EQ_DOMAINS.map((d) => (
              <li key={d} className="rounded-lg bg-surface px-3 py-2">
                <b>ด้าน{EQ_DOMAIN_LABEL[d]}</b> <span className="text-muted-foreground">· {EQ_DOMAIN_HINT[d]}</span>
              </li>
            ))}
          </ul>
          <Button className="mt-4 h-12 w-full" onClick={() => setMode("form")}>
            {store.getDraft(draftKey("eq", PORTAL_STUDENT_ID)) ?"ทำต่อจากที่บันทึกไว้" : "เริ่มทำแบบประเมิน"}
          </Button>
          <button
            type="button"
            onClick={() => setMode("confirm_decline")}
            className="mt-3 w-full text-center text-[13px] text-muted-foreground underline underline-offset-4"
          >
            ไม่ทำ EQ ในภาคเรียนนี้
          </button>
        </CardContent>
      </Card>
    );
  } else if (eq.status === "declined") {
    body = <Notice title="เลือกไม่ทำ EQ แล้ว" text={`บันทึกเมื่อ ${formatThaiDate(eq.assessedAt ?? "")} หากเปลี่ยนใจ ติดต่อครูประจำชั้น`} />;
  } else {
    body = (
      <Card>
        <CardContent className="p-5">
          <h2 className="text-[16px] font-bold">ส่งแบบประเมินแล้ว</h2>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            ส่งเมื่อ {formatThaiDate(eq.assessedAt ?? "")}
            {(eq.editHistory ?? []).length > 0 && ` · แก้ไขแล้ว ${eq.editHistory!.length} ครั้ง`}
          </p>
          {released ? (
            <div className="mt-4 space-y-2">
              <div className="text-[12.5px] font-semibold text-muted-foreground">
                ผลที่ครูประจำชั้นตรวจแล้ว{state === "re_review" && " (คำตอบที่แก้ไขรอครูตรวจอีกครั้ง)"}
              </div>
              {EQ_DOMAINS.map((d) => (
                <div key={d} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5 text-[13.5px]">
                  <span className="font-semibold">ด้าน{EQ_DOMAIN_LABEL[d]}</span>
                  <span>{EQ_LEVEL_LABEL[released[d]]}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-lg bg-surface px-3 py-2.5 text-[13px] text-muted-foreground">
              รอครูประจำชั้นตรวจผล เมื่อตรวจแล้วจะเห็นผลที่หน้านี้
            </p>
          )}
          {open && (
            <Button variant="outline" className="mt-4 h-11 w-full" onClick={() => setMode("form")}>
              แก้คำตอบ (ได้ถึง {formatThaiDate(window_.closeDate)})
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <MobileShell title="แบบประเมิน EQ" subtitle="นักเรียนประเมินตนเอง" role="student" back="/portal/student">
      <div className="space-y-4 p-5">
        <AssessmentTabs studentId={PORTAL_STUDENT_ID} />
        <div className="flex gap-2.5 rounded-xl border border-violet-200 bg-accent p-3.5">
          <HeartHandshake className="size-5 shrink-0 text-primary" />
          <p className="text-[12.5px] leading-relaxed text-accent-foreground">
            คำตอบเป็นความลับ ครูประจำชั้นเห็นผลสรุปเพื่อใช้ดูแลช่วยเหลือเท่านั้น
          </p>
        </div>
        {body}
      </div>
    </MobileShell>
  );
}

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <h2 className="text-[16px] font-bold">{title}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}
