"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { SdqForm } from "@/components/assessment/sdq-form";
import { sdqAnswersFor } from "@/lib/demo/assessment-autofill";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { usePortalStudent } from "@/lib/portal";
import { ChildSwitcher } from "@/components/portal/child-switcher";
import { SdqLevelBadge } from "@/components/assessment/sdq-result";
import { DC_LEVEL_STYLE } from "@/components/characteristics/dc-level";
import { passesAllCriteria } from "@/lib/dc-rules";
import { formatThaiDate } from "@/lib/format";
import { combinedSdqBasisLabel } from "@/lib/rules";
import { termLabelOf } from "@/lib/terms";
import { BEHAVIOR_SCORE_BASE, DC_LEVEL_LABEL } from "@/lib/types";


/** เปลี่ยนบุตรหลานแล้วเริ่มฟอร์มใหม่ ไม่ให้ค่าที่กรอกค้างไปอยู่กับอีกคน */
export default function ParentResultsPage() {
  const { studentId } = usePortalStudent();
  return <ParentResultsPageContent key={studentId ?? "none"} />;
}

function ParentResultsPageContent() {
  const store = useStore();
  const portalStudentId = usePortalStudent().studentId ?? "";
  const [mode, setMode] = useState<"view" | "take" | "read">("view");
  const [error, setError] = useState<string | null>(null);
  /** คำตอบตั้งต้นของปุ่ม "เริ่มและกรอกอัตโนมัติ" (เฉพาะสาธิต) */
  const [prefill, setPrefill] = useState<Record<number, 0 | 1 | 2> | null>(null);

  const student = store.getStudent(portalStudentId);
  const parentSdq = store.sdqFormFor(portalStudentId, "parent");
  const sdqBlock = store.sdqBlockReason(portalStudentId, "parent");
  const canTake = parentSdq?.status === "pending" && sdqBlock === null;
  const submitted = parentSdq?.status === "submitted" ? parentSdq : undefined;
  // ผลรวมแสดงได้เมื่อฉบับครูส่งแล้วเท่านั้น (latestCombinedSdqOf คืนเฉพาะรอบที่มีผล)
  const combined = store.latestCombinedSdqOf(portalStudentId);
  const dc = store.dcSummaryOf(portalStudentId);
  const dcLevels = dc ? store.dcCriteria.map((c) => dc.levels[c.criteriaId]) : [];
  const behaviors = store.guardianBehaviorOf(portalStudentId).slice(0, 6);
  const behaviorScore = store.behaviorScoreOf(portalStudentId);

  if (!student) return null;

  if (mode === "take" && canTake) {
    return (
      <MobileShell title="แบบประเมิน SDQ" subtitle="ฉบับผู้ปกครองประเมิน" role="parent" back="/portal/parent/results">
        <div className="space-y-4 p-5">
          <ChildSwitcher />
          <SdqForm
            key={prefill ? "prefilled" : "blank"}
            rater="parent"
            layout="mobile"
            initialAnswers={prefill ?? undefined}
            submitLabel="ส่งแบบประเมิน"
            onSubmit={(answers) => {
              const res = store.saveSdq(portalStudentId, "parent", answers);
              setError(res.ok ? null : res.error);
              setMode("view");
            }}
          />
        </div>
      </MobileShell>
    );
  }

  if (mode === "read" && submitted) {
    return (
      <MobileShell title="แบบประเมิน SDQ" subtitle="ฉบับผู้ปกครอง" role="parent" back="/portal/parent/results">
        <div className="space-y-4 p-5">
          <ChildSwitcher />
          <Button variant="outline" className="w-full" onClick={() => setMode("view")}>
            กลับ
          </Button>
          <SdqForm rater="parent" layout="mobile" readOnly initialAnswers={submitted.answers} onSubmit={() => {}} />
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
            <h2 className="mb-3 text-[15px] font-bold">ผลการประเมิน SDQ</h2>
            {combined?.level ? (
              <div className="rounded-xl bg-surface p-3.5">
                <div className="text-[12px] text-muted-foreground">
                  ผลรวม ครั้งที่ {combined.round} · {termLabelOf(combined.termId)}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <SdqLevelBadge level={combined.level} />
                  <span className="text-[12px] text-muted-foreground">{combinedSdqBasisLabel(combined)}</span>
                </div>
              </div>
            ) : (
              <p className="rounded-xl bg-surface p-3.5 text-[13px] text-muted-foreground">
                ยังไม่มีผล รอครูส่งแบบประเมิน
              </p>
            )}

            {parentSdq && (
              <div className="mt-3 rounded-xl border border-border p-3.5 text-[12px]">
                <div className="font-semibold">ฉบับผู้ปกครอง ครั้งที่ {parentSdq.round}</div>
                {submitted ? (
                  <>
                    <p className="mt-1 text-muted-foreground">
                      ส่งโดย{" "}
                      {submitted.raterUserId === store.currentUser.userId
                        ? "คุณ"
                        : store.nameOf(submitted.raterUserId)}{" "}
                      เมื่อ {submitted.submittedAt ? formatThaiDate(submitted.submittedAt) : "-"}
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setMode("read")}>
                      ดูคำตอบที่ส่งแล้ว
                    </Button>
                  </>
                ) : canTake ? (
                  <>
                    <p className="mt-1 text-muted-foreground">
                      ผู้ปกครองคนใดทำก็ได้ 1 ฉบับ
                    </p>
                    <Button
                      className="mt-3 h-12 w-full"
                      onClick={() => {
                        setPrefill(null);
                        setMode("take");
                      }}
                    >
                      เริ่มทำแบบประเมิน
                    </Button>
                    <Button
                      variant="outline"
                      className="mt-2 h-11 w-full"
                      onClick={() => {
                        setPrefill(sdqAnswersFor("normal"));
                        setMode("take");
                      }}
                    >
                      <Wand2 className="size-4" /> เริ่มและกรอกอัตโนมัติ
                    </Button>
                  </>
                ) : (
                  <p className="mt-1 text-muted-foreground">{sdqBlock}</p>
                )}
              </div>
            )}
            {error && <p className="mt-2 text-[12px] font-semibold text-risk-red">{error}</p>}

            <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
              ผลประเมินใช้เพื่อการดูแลช่วยเหลือ ไม่มีผลต่อคะแนนการเรียน
            </p>
          </CardContent>
        </Card>

        {dc && (
          <Card>
            <CardContent className="p-5">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-[15px] font-bold">คุณลักษณะอันพึงประสงค์</h2>
                {passesAllCriteria(dcLevels) && (
                  <span className="rounded-full bg-risk-green-bg px-2.5 py-1 text-[12px] font-semibold text-risk-green">
                    ผ่านทุกด้าน
                  </span>
                )}
              </div>
              <p className="mb-2 text-[12px] text-muted-foreground">{termLabelOf(dc.termId)}</p>
              <div className="divide-y divide-border">
                {store.dcCriteria.map((c) => {
                  const level = dc.levels[c.criteriaId];
                  return (
                    <div key={c.criteriaId} className="flex items-center justify-between gap-2 py-2.5">
                      <span className="text-[13px]">{c.name}</span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                          level == null ? "bg-muted text-muted-foreground" : DC_LEVEL_STYLE[level]
                        }`}
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
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-[15px] font-bold">ความประพฤติ</h2>
              <span className="text-[13px] font-semibold">
                {behaviorScore}/{BEHAVIOR_SCORE_BASE} คะแนน
              </span>
            </div>
            <div className="divide-y divide-border">
              {behaviors.map((rec) => {
                const rule = store.ruleOf(rec.ruleId);
                const positive = (rule?.scoreDelta ?? 0) > 0;
                return (
                  <div key={rec.recordId} className="flex items-center gap-3 py-2.5">
                    <span className="w-20 shrink-0 text-[12px] text-muted-foreground">
                      {formatThaiDate(rec.occurredAt)}
                    </span>
                    <span className="flex-1 text-[13px]">{rule?.name}</span>
                    <span
                      className={
                        positive ? "text-[13px] font-bold text-risk-green" : "text-[13px] font-bold text-risk-red"
                      }
                    >
                      {positive ? `+${rule?.scoreDelta}` : rule?.scoreDelta}
                    </span>
                  </div>
                );
              })}
              {behaviors.length === 0 && (
                <p className="py-3 text-[13px] text-muted-foreground">ยังไม่มีบันทึกความประพฤติ</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileShell>
  );
}
