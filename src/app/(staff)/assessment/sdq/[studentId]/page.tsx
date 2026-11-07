"use client";

import { Suspense, use, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { WindowLocked } from "@/components/shared/window-locked";
import { lockedWindowFor } from "@/lib/periods";
import { PageHeader } from "@/components/layout/page-header";
import { StepIndicator } from "@/components/assessment/step-indicator";
import { SdqForm } from "@/components/assessment/sdq-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CURRENT_TERM } from "@/lib/mock-data";
import { formatThaiDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { SDQ_LEVEL_LABEL, SDQ_RATER_LABEL, SdqAssessment } from "@/lib/types";

export default function SdqPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">กำลังโหลด...</div>}>
      <SdqContent studentId={studentId} />
    </Suspense>
  );
}

function SdqContent({ studentId }: { studentId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const store = useStore();
  const student = store.getStudent(studentId);
  const [saved, setSaved] = useState<SdqAssessment | null>(null);
  const [editing, setEditing] = useState(false);

  if (!student) return <p className="p-8 text-sm text-muted-foreground">ไม่พบข้อมูลนักเรียน</p>;

  const set = store.sdqSetOf(studentId);

  // ปิดรับแล้ว (UC9) ตรวจกับช่วงเวลาของรอบปัจจุบัน — ทั้งการตอบครั้งแรกและการแก้คำตอบ (UC10 Alt-A)
  const locked = lockedWindowFor(store.assessmentWindows, "sdq", store.sdqRound);
  const teacherRec = set.find((s) => s.rater === "teacher");
  const teacherDone = teacherRec?.status === "completed";
  if (locked && !teacherDone) {
    return (
      <>
        <PageHeader title="แบบประเมิน SDQ" subtitle={CURRENT_TERM.label} />
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="mx-auto max-w-3xl">
            <WindowLocked window={locked} backHref={`/students/${studentId}`} backLabel="กลับไปหน้านักเรียน" />
          </div>
        </div>
      </>
    );
  }

  const triggerText =
    from === "red-flag"
      ? "ผลแบบคัดกรอง Red Flag ระบุว่าควรดูแล"
      : from === "nine-s"
        ? "ผลแบบประเมิน 9S ระบุว่าควรดูแล"
        : null;

  return (
    <>
      <PageHeader
        title="แบบประเมิน SDQ"
        subtitle={`ฉบับครูประเมิน · รอบที่ ${store.sdqRound} · ${CURRENT_TERM.label}`}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="mx-auto max-w-3xl">
          <StepIndicator current={3} />

          {triggerText && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-accent px-4 py-3">
              <Sparkles className="size-5 shrink-0 text-primary" />
              <p className="text-[13.5px] text-accent-foreground">
                {triggerText} — ระบบเปิดแบบประเมิน SDQ ให้ทั้ง 3 ฝ่ายโดยอัตโนมัติแล้ว
                (ครู / นักเรียน / ผู้ปกครอง)
              </p>
            </div>
          )}

          <Card className="mb-4">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold">{student.fullName}</div>
                  <div className="mt-0.5 text-[13px] text-muted-foreground">
                    {student.roomName} เลขที่ {student.classNo}
                  </div>
                </div>
                <Badge>ฉบับครูประเมิน</Badge>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-3">
                {(["teacher", "student", "parent"] as const).map((rater) => {
                  const record = set.find((s) => s.rater === rater);
                  const done = record?.status === "completed";
                  return (
                    <div key={rater} className="rounded-lg bg-surface p-3">
                      <div className="text-[11.5px] text-muted-foreground">
                        {SDQ_RATER_LABEL[rater]}
                      </div>
                      {done ? (
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-lg font-bold">{record.totalDifficulties}</span>
                          <span className="text-[11.5px] font-semibold text-risk-amber">
                            {record.level ? SDQ_LEVEL_LABEL[record.level] : ""}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-1.5 text-[13px] font-medium text-muted-foreground">
                          {record ? "รอทำแบบประเมิน" : "ยังไม่เปิดแบบประเมิน"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {saved ? (
            <Card>
              <CardContent className="p-6 text-center">
                <h2 className="text-lg font-bold">บันทึกผลการประเมินเรียบร้อย</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  คะแนนรวมพฤติกรรมที่เป็นปัญหา {saved.totalDifficulties} คะแนน · แปลผล:{" "}
                  <b className="text-foreground">
                    {saved.level ? SDQ_LEVEL_LABEL[saved.level] : "-"}
                  </b>
                </p>
                <div className="mt-5 flex justify-center gap-3">
                  <Button variant="outline" onClick={() => router.push(`/students/${studentId}`)}>
                    ดูข้อมูลนักเรียน
                  </Button>
                  <Button onClick={() => router.push(`/care-cases?student=${studentId}&from=sdq`)}>
                    จัดทำแผนช่วยเหลือ
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : teacherDone && !editing ? (
            // ส่งแล้ว: ไม่เปิดแบบฟอร์มว่างทับผลเดิม แก้คำตอบได้จนกว่าจะปิดรับ (UC10 ข้อ 8)
            <Card>
              <CardContent className="p-6">
                <h2 className="text-[16px] font-bold">ส่งฉบับครูแล้ว</h2>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  ส่งเมื่อ {formatThaiDate(teacherRec.assessedAt ?? "")}
                  {(teacherRec.editHistory ?? []).length > 0 && ` · แก้คำตอบแล้ว ${teacherRec.editHistory!.length} ครั้ง`}
                  {" · "}คะแนนรวม {teacherRec.totalDifficulties} ({teacherRec.level ? SDQ_LEVEL_LABEL[teacherRec.level] : "-"})
                </p>
                {locked && (
                  <p className="mt-3 rounded-lg bg-surface px-3 py-2.5 text-[13px]">
                    ปิดรับเมื่อ {formatThaiDate(locked.closeDate)} แล้ว จึงแก้คำตอบไม่ได้
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {!locked && (
                    <Button variant="outline" onClick={() => setEditing(true)}>
                      แก้คำตอบ
                    </Button>
                  )}
                  <Button onClick={() => router.push(`/assessment/review/${studentId}`)}>ไปหน้าตรวจผล</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <SdqForm
              studentId={studentId}
              rater="teacher"
              initial={editing ? teacherRec?.answers : undefined}
              submitLabel={editing ? "บันทึกคำตอบที่แก้ไข" : undefined}
              onExit={() => (editing ? setEditing(false) : router.push(`/students/${studentId}`))}
              onSubmit={(answers) => {
                setSaved(store.saveSdq(studentId, "teacher", answers));
                setEditing(false);
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}
