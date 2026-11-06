"use client";

import { useState } from "react";
import Link from "next/link";
import { MobileShell } from "@/components/layout/mobile-shell";
import { SdqForm } from "@/components/assessment/sdq-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { dcCriteria, CURRENT_TERM } from "@/lib/mock-data";
import { sdqSummaryForParent } from "@/lib/portal";
import { DC_LEVEL_LABEL, SDQ_PORTAL_LABEL, SdqRater } from "@/lib/types";

const DEMO_STUDENT_ID = "30125";

export default function ParentResultsPage() {
  const store = useStore();
  const [takingSdq, setTakingSdq] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const student = store.getStudent(DEMO_STUDENT_ID);
  const sdqSet = store.sdqOf(DEMO_STUDENT_ID).filter((s) => s.round === 1);
  const parentSdq = sdqSet.find((s) => s.rater === "parent");
  const dc = store.dcResultOf(DEMO_STUDENT_ID);
  const summary = sdqSummaryForParent(sdqSet);

  if (!student) return null;

  if (takingSdq) {
    return (
      <MobileShell
        title="แบบประเมิน SDQ"
        subtitle="ฉบับผู้ปกครองประเมิน"
        role="parent"
        back="/portal/parent/results"
      >
        <div className="p-5">
          <SdqForm
            studentId={DEMO_STUDENT_ID}
            rater="parent"
            layout="mobile"
            onSubmit={(answers) => {
              store.saveSdq(DEMO_STUDENT_ID, "parent", answers);
              setTakingSdq(false);
              setJustSubmitted(true);
            }}
          />
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell
      title="ผลของบุตรหลาน"
      subtitle={`${student.fullName} · ${student.roomName}`}
      role="parent"
      back="/portal/parent"
    >
      <div className="space-y-4 p-5">
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-3 text-[14.5px] font-bold">
              แบบประเมิน SDQ · {CURRENT_TERM.label}
            </h2>

            {justSubmitted && (
              <p className="mb-3 rounded-xl bg-risk-green-bg px-3.5 py-2.5 text-[13px] font-semibold text-risk-green">
                ส่งแบบประเมินฉบับผู้ปกครองเรียบร้อย ขอบคุณค่ะ
              </p>
            )}

            {/* แสดงเฉพาะสถานะของแต่ละฉบับ ไม่แสดงคะแนน — คำตอบของนักเรียนเป็นความลับ (2.1.10) */}
            <div className="flex gap-2.5">
              {(["teacher", "student", "parent"] as SdqRater[]).map((rater) => {
                const rec = sdqSet.find((s) => s.rater === rater);
                const done = rec?.status === "completed";
                const label =
                  rater === "teacher" ? "ครูประเมิน" : rater === "student" ? "นักเรียน" : "ผู้ปกครอง";
                return (
                  <div key={rater} className="flex-1 rounded-xl bg-surface p-3 text-center">
                    <div className="text-[11.5px] text-muted-foreground">{label}</div>
                    <div
                      className={
                        done
                          ? "mt-1.5 text-[13px] font-semibold text-foreground"
                          : "mt-1.5 text-[13px] font-semibold text-muted-foreground"
                      }
                    >
                      {done ? "ส่งแล้ว" : rec ? "รอทำ" : "-"}
                    </div>
                  </div>
                );
              })}
            </div>

            {summary && (
              <p className="mt-3 rounded-xl bg-surface px-3.5 py-2.5 text-[13px] leading-relaxed">
                <span className="font-semibold">{SDQ_PORTAL_LABEL[summary]}</span>
                {summary !== "normal" && (
                  <span className="text-muted-foreground">
                    {" "}
                    · ครูประจำชั้นอาจติดต่อเพื่อพูดคุยและวางแนวทางดูแลร่วมกัน
                  </span>
                )}
              </p>
            )}

            {parentSdq?.status === "pending" && (
              <Button className="mt-4 h-12 w-full" onClick={() => setTakingSdq(true)}>
                เริ่มทำแบบประเมินฉบับผู้ปกครอง
              </Button>
            )}

            <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
              ผลประเมินใช้เพื่อการดูแลช่วยเหลือ ไม่มีผลต่อการเรียนหรือคะแนนของนักเรียน
            </p>
          </CardContent>
        </Card>

        {dc && (
          <Card>
            <CardContent className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[14.5px] font-bold">คุณลักษณะอันพึงประสงค์</h2>
                <span className="text-[11.5px] text-muted-foreground">ปพ.6</span>
              </div>
              <div className="divide-y divide-border">
                {dcCriteria.map((c) => {
                  const level = dc.levels[c.criteriaId];
                  return (
                    <div key={c.criteriaId} className="flex items-center justify-between py-2.5">
                      <span className="text-[13px]">{c.name}</span>
                      <span
                        className={
                          level == null
                            ? "rounded-full bg-muted px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground"
                            : level >= 3
                              ? "rounded-full bg-risk-green-bg px-2.5 py-1 text-[11.5px] font-semibold text-risk-green"
                              : level === 2
                                ? "rounded-full bg-accent px-2.5 py-1 text-[11.5px] font-semibold text-primary"
                                : "rounded-full bg-risk-amber-bg px-2.5 py-1 text-[11.5px] font-semibold text-risk-amber"
                        }
                      >
                        {level == null ? "รอประเมิน" : DC_LEVEL_LABEL[level]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Link href="/portal/parent/child" className="block rounded-xl border border-border bg-card px-4 py-3 text-[13px]">
          คะแนนและประวัติความประพฤติ ดูได้ที่ <b>ข้อมูลบุตร</b> →
        </Link>
      </div>
    </MobileShell>
  );
}
