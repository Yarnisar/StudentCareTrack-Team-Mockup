"use client";

/**
 * ครูที่ปรึกษาตรวจผล SDQ และ EQ ก่อนเปิดให้นักเรียนและผู้ปกครอง (UC10 สถานการณ์ B)
 * - ผลรวม SDQ แสดงเมื่อครู นักเรียน และผู้ปกครองตอบครบ (ข้อ 3)
 * - ปิดรอบแล้วผู้ตอบไม่ครบ: ไม่คำนวณผลรวม บอกว่าฝ่ายใดยังไม่ตอบ ตรวจจากข้อมูลที่มีได้ (Alt-E)
 * - แก้คำตอบหลังตรวจ: ผลที่เปิดไว้ยังเป็นผลเดิมจนกว่าจะตรวจใหม่ (ข้อ 7)
 */

import { use } from "react";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { needsReview, REVIEW_STATE_LABEL, type AssessmentReview, type ReviewState } from "@/lib/assessment-review";
import { EQ_DOMAIN_LABEL, EQ_DOMAINS, EQ_LEVEL_LABEL } from "@/lib/eq";
import { formatThaiDate, formatThaiTime } from "@/lib/format";
import { CURRENT_TERM } from "@/lib/mock-data";
import { windowFor } from "@/lib/periods";
import { sdqSummaryForParent } from "@/lib/portal";
import { useStore } from "@/lib/store";
import { SDQ_LEVEL_LABEL, SDQ_PORTAL_LABEL, SDQ_RATER_LABEL, type SdqLevel, type SdqRater } from "@/lib/types";

const RATERS: SdqRater[] = ["teacher", "student", "parent"];

const LEVEL_TAG: Record<SdqLevel, string> = {
  normal: "bg-risk-green-bg text-risk-green",
  risk: "bg-risk-amber-bg text-risk-amber",
  problem: "bg-risk-red-bg text-risk-red",
};

export default function ReviewPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const store = useStore();
  const student = store.getStudent(studentId);
  if (!student) return <p className="p-8 text-sm text-muted-foreground">ไม่พบข้อมูลนักเรียน</p>;

  const set = store.sdqOf(studentId).filter((s) => s.round === 1);
  const sdq = store.sdqReview(studentId);
  const eq = store.eqOf(studentId);
  const eqInfo = store.eqReview(studentId);
  const sdqWindow = windowFor(store.assessmentWindows, "sdq");

  return (
    <>
      <PageHeader title="ตรวจผลการประเมิน" subtitle={`${student.fullName} · ${student.roomName} เลขที่ ${student.classNo} · ${CURRENT_TERM.label}`} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="mx-auto max-w-3xl space-y-4">
          <Link
            href="/assessment"
            className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" /> กลับไปหน้าการประเมิน
          </Link>

          {/* ---------- SDQ ---------- */}
          <Card>
            <CardContent className="p-6">
              <SectionHead title="SDQ · 3 ผู้ประเมิน" state={sdq.state} />
              {set.length === 0 ? (
                <p className="mt-3 text-[13px] text-muted-foreground">ยังไม่มีแบบประเมิน SDQ ระบบเปิดให้เมื่อผล Red Flag หรือ 9S ควรดูแล</p>
              ) : (
                <>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {RATERS.map((rater) => {
                      const rec = set.find((s) => s.rater === rater);
                      const done = rec?.status === "completed";
                      return (
                        <div
                          key={rater}
                          className={done ? "rounded-xl border border-border p-4" : "rounded-xl border border-dashed border-border bg-surface p-4"}
                        >
                          <div className="text-[12.5px] text-muted-foreground">{SDQ_RATER_LABEL[rater]}</div>
                          {done && rec.level ? (
                            <>
                              <div className="my-1.5 text-2xl font-bold">
                                {rec.totalDifficulties}
                                <span className="ml-1 text-xs font-medium text-muted-foreground">คะแนน</span>
                              </div>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${LEVEL_TAG[rec.level]}`}>
                                {SDQ_LEVEL_LABEL[rec.level]}
                              </span>
                              {(rec.editHistory ?? []).length > 0 && (
                                <div className="mt-2 text-[11.5px] text-muted-foreground">แก้คำตอบแล้ว {rec.editHistory!.length} ครั้ง</div>
                              )}
                            </>
                          ) : (
                            <div className="mt-3 text-[13px] font-medium text-muted-foreground">ยังไม่ตอบ</div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {sdq.complete && sdq.total ? (
                    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-surface px-4 py-3 text-[13.5px]">
                      <span className="font-semibold">ผลรวม SDQ (สรุปจาก 3 ผู้ประเมิน)</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${LEVEL_TAG[sdq.total]}`}>{SDQ_LEVEL_LABEL[sdq.total]}</span>
                    </div>
                  ) : sdq.state === "closed_incomplete" ? (
                    <Callout>
                      ปิดรอบแล้ว ยังไม่ได้รับคำตอบจาก{sdq.missing.map((r) => SDQ_RATER_LABEL[r].replace("ประเมินตนเอง", "").replace("ประเมิน", "")).join(" และ ")}{" "}
                      ระบบจึงไม่คำนวณผลรวม ใช้ข้อมูลที่มีประกอบการดูแลได้ หรือแจ้งแอดมินให้เปิดรอบใหม่ในหน้าตั้งค่า
                    </Callout>
                  ) : sdq.state === "waiting" ? (
                    <Callout>
                      รอ{sdq.missing.map((r) => SDQ_RATER_LABEL[r].replace("ประเมินตนเอง", "").replace("ประเมิน", "")).join(" และ ")}ตอบ
                      ตรวจผลได้เมื่อตอบครบ หรือเมื่อปิดรอบ{sdqWindow ? ` (${formatThaiDate(sdqWindow.closeDate)})` : ""}
                    </Callout>
                  ) : null}

                  <ReleaseBlock
                    state={sdq.state}
                    review={sdq.review}
                    preview={(() => {
                      const level = sdqSummaryForParent(set);
                      return level ? SDQ_PORTAL_LABEL[level] : "ยังไม่มีผลที่แสดงได้";
                    })()}
                    released={sdq.review?.released.sdq ? SDQ_PORTAL_LABEL[sdq.review.released.sdq] : undefined}
                    onConfirm={() => store.confirmReview(studentId, "sdq")}
                    careHref={`/care-cases?student=${studentId}&from=sdq`}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* ---------- EQ ---------- */}
          <Card>
            <CardContent className="p-6">
              <SectionHead title="EQ · นักเรียนประเมินตนเอง" state={eqInfo.state} />
              {!eq || eq.status === "pending" ? (
                <p className="mt-3 text-[13px] text-muted-foreground">นักเรียนยังไม่ได้ทำ EQ</p>
              ) : eq.status === "declined" ? (
                <p className="mt-3 text-[13px] text-muted-foreground">
                  นักเรียนเลือกไม่ทำ EQ ในภาคเรียนนี้ (บันทึกเมื่อ {formatThaiDate(eq.assessedAt ?? "")}) ไม่ต้องตรวจผล
                </p>
              ) : (
                <>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {EQ_DOMAINS.map((d) => (
                      <div key={d} className="rounded-xl border border-border p-4">
                        <div className="text-[12.5px] text-muted-foreground">ด้าน{EQ_DOMAIN_LABEL[d]}</div>
                        <div className="my-1.5 text-2xl font-bold">
                          {eq.scores?.[d]}
                          <span className="ml-1 text-xs font-medium text-muted-foreground">/ 16</span>
                        </div>
                        <div className="text-[12.5px] font-semibold">{eq.levels ? EQ_LEVEL_LABEL[eq.levels[d]] : ""}</div>
                      </div>
                    ))}
                  </div>
                  {(eq.editHistory ?? []).length > 0 && (
                    <p className="mt-2 text-[12px] text-muted-foreground">
                      นักเรียนแก้คำตอบแล้ว {eq.editHistory!.length} ครั้ง · ส่งล่าสุด {formatThaiDate(eq.assessedAt ?? "")}
                    </p>
                  )}
                  <ReleaseBlock
                    state={eqInfo.state}
                    review={eqInfo.review}
                    preview={eq.levels ? EQ_DOMAINS.map((d) => `${EQ_DOMAIN_LABEL[d]}: ${EQ_LEVEL_LABEL[eq.levels![d]]}`).join(" · ") : "-"}
                    released={
                      eqInfo.review?.released.eq
                        ? EQ_DOMAINS.map((d) => `${EQ_DOMAIN_LABEL[d]}: ${EQ_LEVEL_LABEL[eqInfo.review!.released.eq![d]]}`).join(" · ")
                        : undefined
                    }
                    onConfirm={() => store.confirmReview(studentId, "eq")}
                    careHref={`/care-cases?student=${studentId}`}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function SectionHead({ title, state }: { title: string; state: ReviewState }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="text-[15.5px] font-bold">{title}</h2>
      <span
        className={`rounded-md px-2 py-0.5 text-[11.5px] font-semibold ${
          needsReview(state) ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
        }`}
      >
        {REVIEW_STATE_LABEL[state]}
      </span>
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 rounded-xl border border-border bg-surface px-4 py-3 text-[13px] leading-relaxed">{children}</p>;
}

/** สิ่งที่นักเรียน/ผู้ปกครองจะเห็น + ปุ่มยืนยันตรวจผล */
function ReleaseBlock({
  state,
  review,
  preview,
  released,
  onConfirm,
  careHref,
}: {
  state: ReviewState;
  review?: AssessmentReview;
  preview: string;
  released?: string;
  onConfirm: () => void;
  careHref: string;
}) {
  return (
    <div className="mt-4 border-t border-border pt-4">
      {state === "re_review" && review && (
        <p className="mb-3 text-[12.5px] text-muted-foreground">
          มีการแก้คำตอบหลังตรวจเมื่อ {formatThaiDate(review.reviewedAt)} ผลที่นักเรียนและผู้ปกครองเห็นยังเป็นผลเดิม
          {released && ` (${released})`} จนกว่าจะตรวจใหม่
        </p>
      )}
      {needsReview(state) && (
        <p className="mb-3 text-[13px]">
          <span className="text-muted-foreground">เมื่อยืนยัน นักเรียนและผู้ปกครองจะเห็น:</span> <b>{preview}</b>
        </p>
      )}
      {state === "released" && review && (
        <p className="mb-3 flex items-center gap-1.5 text-[13px]">
          <CheckCircle2 className="size-4 text-primary" />
          ตรวจแล้วเมื่อ {formatThaiDate(review.reviewedAt)} {formatThaiTime(review.reviewedAt)} โดย {review.reviewedBy} · เปิดผลแล้ว
          {released && <span className="text-muted-foreground">({released})</span>}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {needsReview(state) && <Button onClick={onConfirm}>ยืนยันว่าตรวจผลแล้ว</Button>}
        <LinkButton href={careHref} variant="outline">
          พิจารณาการช่วยเหลือ
        </LinkButton>
      </div>
    </div>
  );
}
