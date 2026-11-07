"use client";

import { PageHeader } from "@/components/layout/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { CURRENT_TERM } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { SDQ_LEVEL_LABEL, SDQ_RATER_LABEL, SdqRater } from "@/lib/types";
import { needsReview, REVIEW_STATE_LABEL } from "@/lib/assessment-review";
import { StudentId } from "@/components/shared/student-id";

const RATERS: SdqRater[] = ["teacher", "student", "parent"];

export default function AssessmentPage() {
  const store = useStore();

  return (
    <>
      <PageHeader
        title="การประเมิน"
        subtitle={`Red Flag → 9S → SDQ (ครู / นักเรียน / ผู้ปกครอง) และ EQ · ${CURRENT_TERM.label}`}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <ReviewQueue />

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
                const sdqSet = store.sdqSetOf(student.studentId);
                const redFlag = store.redFlags.find((r) => r.studentId === student.studentId);
                const nineS = store.nineS.find((n) => n.studentId === student.studentId);

                return (
                  <div key={student.studentId} className="flex items-center gap-3 py-3">
                    <StudentId id={student.studentId} className="w-14 text-sm" />
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
                      <Chip
                        label="EQ"
                        state={(() => {
                          const e = store.eqOf(student.studentId);
                          return !e ? "none" : e.status === "pending" ? "pending" : e.status === "declined" ? "none" : "done";
                        })()}
                        hint={store.eqOf(student.studentId)?.status === "declined" ? "ไม่ทำ" : "ส่งแล้ว"}
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
                                    : rec.level === "risk"
                                      ? "risk"
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

                    {(() => {
                      const next = nextStep(store, student.studentId);
                      return (
                        <LinkButton size="sm" variant={next.primary ? "outline" : "ghost"} href={next.href}>
                          {next.label}
                        </LinkButton>
                      );
                    })()}
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
  state: "none" | "pending" | "done" | "ok" | "risk" | "care";
  hint?: string;
}) {
  // สถานะงาน (รอทำ / ส่งแล้ว) ใช้สีกลาง สีเขียว/แดงใช้เฉพาะผลประเมินที่บอกกลุ่ม (ปกติ / ควรดูแล)
  const styles = {
    none: "bg-muted text-muted-foreground",
    pending: "border border-foreground/25 text-foreground",
    done: "bg-muted text-foreground",
    ok: "bg-risk-green-bg text-risk-green",
    risk: "bg-risk-amber-bg text-risk-amber",
    care: "bg-risk-red-bg text-risk-red",
  } as const;

  const suffix =
    state === "none" ? (hint ? ` · ${hint}` : "") : state === "pending" ? " · รอทำ" : hint ? ` · ${hint}` : "";

  return (
    <span className={`rounded-md px-2 py-1 font-semibold ${styles[state]}`}>
      {label}
      {suffix}
    </span>
  );
}

/** ผลที่รอครูที่ปรึกษาตรวจก่อนเปิดให้นักเรียนและผู้ปกครอง (UC10 สถานการณ์ B) */
function ReviewQueue() {
  const store = useStore();
  const rows = store.students
    .map((student) => ({
      student,
      sdq: store.sdqReview(student.studentId).state,
      eq: store.eqReview(student.studentId).state,
    }))
    .filter((r) => needsReview(r.sdq) || needsReview(r.eq));
  return (
    <Card className="mb-5">
      <CardContent className="p-6">
        <h2 className="text-[15.5px] font-bold">ผลที่รอตรวจ · {rows.length} คน</h2>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">
          นักเรียนและผู้ปกครองจะเห็นผล SDQ และ EQ หลังครูที่ปรึกษายืนยันว่าตรวจแล้วเท่านั้น
        </p>
        <div className="mt-3 divide-y divide-border">
          {rows.map(({ student, sdq, eq }) => (
            <div key={student.studentId} className="flex flex-wrap items-center gap-3 py-3">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <StudentId id={student.studentId} className="w-14 pt-0.5 text-sm" />
                <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{student.fullName}</div>
                <div className="mt-1 flex flex-wrap gap-1.5 text-[11.5px]">
                  {needsReview(sdq) && (
                    <span className="rounded-md bg-muted px-2 py-0.5 font-semibold">SDQ · {REVIEW_STATE_LABEL[sdq]}</span>
                  )}
                  {needsReview(eq) && (
                    <span className="rounded-md bg-muted px-2 py-0.5 font-semibold">EQ · {REVIEW_STATE_LABEL[eq]}</span>
                  )}
                </div>
                </div>
              </div>
              <LinkButton size="sm" href={`/assessment/review/${student.studentId}`}>
                ตรวจผล
              </LinkButton>
            </div>
          ))}
          {rows.length === 0 && <p className="py-4 text-center text-[13px] text-muted-foreground">ไม่มีผลที่รอตรวจ</p>}
        </div>
      </CardContent>
    </Card>
  );
}

/** ขั้นถัดไปที่ยังค้างของนักเรียนคนนี้: Red Flag → 9S → SDQ ฉบับครู → ตรวจผล */
function nextStep(store: ReturnType<typeof useStore>, id: string): { href: string; label: string; primary: boolean } {
  const redFlag = store.redFlags.find((r) => r.studentId === id);
  const nineS = store.nineS.find((n) => n.studentId === id);
  const teacherSdq = store.sdqSetOf(id).find((s) => s.rater === "teacher");
  const review = needsReview(store.sdqReview(id).state) || needsReview(store.eqReview(id).state);
  // มี SDQ แล้ว = ผ่านขั้น Red Flag / 9S มาแล้ว
  if (teacherSdq?.status === "pending") return { href: `/assessment/sdq/${id}`, label: "ทำ SDQ", primary: true };
  if (review) return { href: `/assessment/review/${id}`, label: "ตรวจผล", primary: true };
  if (!teacherSdq) {
    if (!redFlag) return { href: `/assessment/red-flag/${id}`, label: "ทำ Red Flag", primary: true };
    if (redFlag.result !== "needs_care" && !nineS) return { href: `/assessment/nine-s/${id}`, label: "ทำ 9S", primary: true };
  }
  return { href: `/students/${id}`, label: "ดูผล", primary: false };
}
