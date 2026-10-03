"use client";

import { PageHeader } from "@/components/layout/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { CURRENT_TERM } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { SDQ_LEVEL_LABEL, SDQ_RATER_LABEL, SdqRater } from "@/lib/types";
import { initialOf } from "@/lib/format";

const RATERS: SdqRater[] = ["teacher", "student", "parent"];

export default function AssessmentPage() {
  const store = useStore();

  return (
    <>
      <PageHeader
        title="การประเมิน"
        subtitle={`Red Flag → 9S → SDQ (ครู / นักเรียน / ผู้ปกครอง) · ${CURRENT_TERM.label}`}
      />

      <div className="flex-1 overflow-y-auto p-8">
        <Card className="mb-5">
          <CardContent className="p-6">
            <h2 className="text-[15.5px] font-bold">ลำดับการประเมินด้านสุขภาพจิต</h2>
            <p className="mt-1 mb-4 text-xs text-muted-foreground">
              ตามแนวทางคู่มือ HERO OBEC CARE — ระบบเปิดแบบประเมินขั้นถัดไปให้อัตโนมัติตามผลลัพธ์
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[13.5px]">
              <span className="rounded-lg bg-accent px-3 py-2 font-semibold text-primary">
                1. Red Flag
              </span>
              <span className="text-muted-foreground">— ผลปกติ →</span>
              <span className="rounded-lg bg-accent px-3 py-2 font-semibold text-primary">
                2. 9S
              </span>
              <span className="text-muted-foreground">— ผลควรดูแล →</span>
              <span className="rounded-lg bg-accent px-3 py-2 font-semibold text-primary">
                3. SDQ (3 ฉบับ)
              </span>
              <span className="text-muted-foreground">
                · หาก Red Flag ควรดูแล จะข้ามไป SDQ ทันที
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-[15.5px] font-bold">สถานะการประเมินรายบุคคล</h2>

            <div className="divide-y divide-border">
              {store.students.map((student) => {
                const sdqSet = store.sdqOf(student.studentId).filter((s) => s.round === 1);
                const redFlag = store.redFlags.find((r) => r.studentId === student.studentId);
                const nineS = store.nineS.find((n) => n.studentId === student.studentId);

                return (
                  <div key={student.studentId} className="flex items-center gap-3 py-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {initialOf(student.fullName)}
                    </div>
                    <div className="w-48 shrink-0">
                      <div className="text-sm font-semibold">{student.fullName}</div>
                      <div className="text-xs text-muted-foreground">
                        {student.roomName} เลขที่ {student.classNo}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-wrap items-center gap-1.5 text-[11.5px]">
                      <Chip
                        label="Red Flag"
                        state={
                          redFlag ? (redFlag.result === "needs_care" ? "care" : "ok") : "none"
                        }
                      />
                      <Chip
                        label="9S"
                        state={nineS ? (nineS.result === "needs_care" ? "care" : "ok") : "none"}
                      />
                      {RATERS.map((rater) => {
                        const rec = sdqSet.find((s) => s.rater === rater);
                        return (
                          <Chip
                            key={rater}
                            label={`SDQ: ${SDQ_RATER_LABEL[rater].replace("ประเมินตนเอง", "").replace("ประเมิน", "")}`}
                            state={
                              !rec
                                ? "none"
                                : rec.status === "completed"
                                  ? rec.level === "normal"
                                    ? "ok"
                                    : "care"
                                  : "pending"
                            }
                            hint={
                              rec?.status === "completed" && rec.level
                                ? SDQ_LEVEL_LABEL[rec.level]
                                : undefined
                            }
                          />
                        );
                      })}
                    </div>

                    <LinkButton
                      size="sm"
                      variant="outline"
                      href={`/assessment/red-flag/${student.studentId}`}
                    >
                      เริ่มประเมิน
                    </LinkButton>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Chip({
  label,
  state,
  hint,
}: {
  label: string;
  state: "none" | "pending" | "ok" | "care";
  hint?: string;
}) {
  const styles = {
    none: "bg-muted text-muted-foreground",
    pending: "bg-risk-amber-bg text-risk-amber",
    ok: "bg-risk-green-bg text-risk-green",
    care: "bg-risk-red-bg text-risk-red",
  } as const;

  const suffix =
    state === "none" ? "" : state === "pending" ? " · รอทำ" : hint ? ` · ${hint}` : "";

  return (
    <span className={`rounded-md px-2 py-1 font-semibold ${styles[state]}`}>
      {label}
      {suffix}
    </span>
  );
}
