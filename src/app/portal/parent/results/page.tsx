"use client";

import { useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { SdqForm } from "@/components/assessment/sdq-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { usePortalStudent } from "@/lib/portal";
import { ChildSwitcher } from "@/components/portal/child-switcher";
import { dcCriteria, CURRENT_TERM } from "@/lib/mock-data";
import { formatThaiDate } from "@/lib/format";
import { DC_LEVEL_LABEL, SDQ_LEVEL_LABEL, SdqRater } from "@/lib/types";


/** เปลี่ยนบุตรหลานแล้วเริ่มฟอร์มใหม่ ไม่ให้ค่าที่กรอกค้างไปอยู่กับอีกคน */
export default function ParentResultsPage() {
  const { studentId } = usePortalStudent();
  return <ParentResultsPageContent key={studentId ?? "none"} />;
}

function ParentResultsPageContent() {
  const store = useStore();
  const portalStudentId = usePortalStudent().studentId ?? "";
  const [takingSdq, setTakingSdq] = useState(false);

  const student = store.getStudent(portalStudentId);
  const sdqSet = store.currentSdqOf(portalStudentId);
  const parentSdq = sdqSet.find((s) => s.rater === "parent");
  const dc = store.dcSummaryOf(portalStudentId);
  const behaviors = store.behaviorOf(portalStudentId).slice(0, 4);

  if (!student) return null;

  if (takingSdq) {
    return (
      <MobileShell
        title="แบบประเมิน SDQ"
        subtitle="ฉบับผู้ปกครองประเมิน"
        role="parent"
        back="/portal/parent/results"
      >
        <div className="space-y-4 p-5">
          <ChildSwitcher />
          <SdqForm
            rater="parent"
            layout="mobile"
            onSubmit={(answers) => {
              store.saveSdq(portalStudentId, "parent", answers);
              setTakingSdq(false);
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
        <ChildSwitcher />
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-3 text-[14.5px] font-bold">
              ผลการประเมิน SDQ · {CURRENT_TERM.label}
            </h2>
            <div className="flex gap-2.5">
              {(["teacher", "student", "parent"] as SdqRater[]).map((rater) => {
                const rec = sdqSet.find((s) => s.rater === rater);
                const done = rec?.status === "submitted";
                const label =
                  rater === "teacher" ? "ครูประเมิน" : rater === "student" ? "นักเรียน" : "ผู้ปกครอง";
                return (
                  <div
                    key={rater}
                    className={
                      done ? "flex-1 rounded-xl bg-surface p-3 text-center" : "flex-1 rounded-xl bg-risk-amber-bg p-3 text-center"
                    }
                  >
                    <div className="text-[11.5px] text-muted-foreground">{label}</div>
                    {done ? (
                      <>
                        <div className="my-1 text-lg font-bold">{rec.totalDifficulties}</div>
                        <span
                          className={
                            rec.level === "normal"
                              ? "rounded-full bg-risk-green-bg px-2 py-0.5 text-[11px] font-semibold text-risk-green"
                              : "rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-risk-amber"
                          }
                        >
                          {rec.level ? SDQ_LEVEL_LABEL[rec.level] : ""}
                        </span>
                      </>
                    ) : (
                      <div className="mt-2 text-[13px] font-semibold text-risk-amber">รอทำ</div>
                    )}
                  </div>
                );
              })}
            </div>

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

        <Card>
          <CardContent className="p-5">
            <h2 className="mb-1 text-[14.5px] font-bold">ประวัติความประพฤติล่าสุด</h2>
            <div className="divide-y divide-border">
              {behaviors.map((rec) => {
                const rule = store.ruleOf(rec.ruleId);
                const positive = (rule?.scoreDelta ?? 0) > 0;
                return (
                  <div key={rec.recordId} className="flex items-center gap-3 py-2.5">
                    <span className="w-20 shrink-0 text-[11.5px] text-muted-foreground">
                      {formatThaiDate(rec.occurredAt)}
                    </span>
                    <span className="flex-1 text-[13px]">{rule?.name}</span>
                    <span
                      className={
                        positive
                          ? "text-[13.5px] font-bold text-risk-green"
                          : "text-[13.5px] font-bold text-risk-red"
                      }
                    >
                      {positive ? `+${rule?.scoreDelta}` : rule?.scoreDelta}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
              แสดงเฉพาะรายการและคะแนน ไม่แสดงรายละเอียดภายในของโรงเรียน
            </p>
          </CardContent>
        </Card>
      </div>
    </MobileShell>
  );
}
