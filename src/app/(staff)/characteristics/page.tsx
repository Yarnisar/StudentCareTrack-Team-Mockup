"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CURRENT_TERM } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { DC_LEVEL_LABEL, DcLevel } from "@/lib/types";

const LEVEL_STYLE: Record<DcLevel, string> = {
  3: "bg-risk-green-bg text-risk-green",
  2: "bg-accent text-primary",
  1: "bg-risk-amber-bg text-risk-amber",
  0: "bg-risk-red-bg text-risk-red",
};

export default function CharacteristicsPage() {
  const store = useStore();
  const { dcCriteria, subjectSubmissions } = store;
  const roomNames = [...new Set(store.students.map((s) => s.roomName))].join(", ");
  const pending = subjectSubmissions.filter((s) => !s.submitted);
  const submitted = subjectSubmissions.length - pending.length;
  const [notifiedCount, setNotifiedCount] = useState<number | null>(null);

  return (
    <>
      <PageHeader
        title="คุณลักษณะอันพึงประสงค์"
        subtitle={`ประเมิน 8 ด้าน · ครูประจำวิชาบันทึก ปพ.5 → ครูประจำชั้นสรุป ปพ.6 · ${CURRENT_TERM.label}`}
      />

      <div className="flex-1 overflow-y-auto p-8">
        {pending.length > 0 && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-risk-amber-bg px-4 py-3.5">
            <AlertTriangle className="size-5 shrink-0 text-risk-amber" />
            <p className="flex-1 text-[13.5px] text-risk-amber">
              ยังมี <b>{pending.length} รายวิชา</b> ที่ครูประจำวิชายังไม่ส่งผลการประเมิน (ปพ.5) —
              ไม่สามารถสรุปเป็น ปพ.6 ได้จนกว่าข้อมูลจะครบ
            </p>
            {notifiedCount === null ? (
              <Button size="sm" variant="outline" onClick={() => setNotifiedCount(store.requestPendingDcScores())}>
                ส่งการแจ้งเตือน
              </Button>
            ) : (
              <span className="text-[12.5px] font-semibold text-risk-amber">
                แจ้งเตือนครูประจำวิชาแล้ว {notifiedCount} คน
              </span>
            )}
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
          <Card>
            <CardContent className="p-6">
              <div className="mb-4">
                <h2 className="text-[15.5px] font-bold">ผลการประเมินคุณลักษณะอันพึงประสงค์ 8 ด้าน</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  ห้อง {roomNames} · รวบรวมจาก ปพ.5 ของครูประจำวิชาทุกคน
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="pb-2.5 text-left text-[12px] font-semibold text-muted-foreground">
                        นักเรียน
                      </th>
                      {dcCriteria.map((c) => (
                        <th
                          key={c.criteriaId}
                          className="pb-2.5 text-center text-[11.5px] font-semibold text-muted-foreground"
                        >
                          {c.shortName}
                        </th>
                      ))}
                      <th className="pb-2.5 text-right text-[12px] font-semibold text-muted-foreground">
                        สถานะ ปพ.6
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {store.students.map((student) => {
                      const dc = store.dcSummaryOf(student.studentId);
                      const incomplete =
                        !dc || dcCriteria.some((c) => dc.levels[c.criteriaId] == null);
                      return (
                        <tr key={student.studentId} className="border-b border-border">
                          <td className="py-2.5">
                            <div className="text-[13.5px] font-semibold">{student.fullName}</div>
                            <div className="text-[11.5px] text-muted-foreground">
                              เลขที่ {student.classNo}
                            </div>
                          </td>
                          {dcCriteria.map((c) => {
                            const level = dc?.levels[c.criteriaId];
                            return (
                              <td key={c.criteriaId} className="py-2.5 text-center">
                                {level == null ? (
                                  <span className="inline-flex h-6 w-8 items-center justify-center rounded-md border border-dashed border-border text-[12px] text-muted-foreground">
                                    –
                                  </span>
                                ) : (
                                  <span
                                    className={`inline-flex h-6 w-8 items-center justify-center rounded-md text-[13px] font-bold ${LEVEL_STYLE[level]}`}
                                  >
                                    {level}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-2.5 text-right">
                            {incomplete ? (
                              <span className="text-[12px] font-semibold text-risk-amber">
                                ข้อมูลไม่ครบ
                              </span>
                            ) : (
                              <span className="rounded-full bg-risk-green-bg px-2.5 py-1 text-[11.5px] font-semibold text-risk-green">
                                พร้อมสรุป
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <p className="text-[12px] text-muted-foreground">
                  ระดับคุณภาพรวมคำนวณจากฐานนิยมของคะแนนตัวชี้วัดย่อยในแต่ละด้าน
                </p>
                <div className="flex gap-3">
                  <Button variant="outline">บันทึกร่าง</Button>
                  <Button disabled={pending.length > 0}>
                    {pending.length > 0 ? "สรุปผลเป็น ปพ.6 (รอข้อมูลครบ)" : "สรุปผลเป็น ปพ.6"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-[15px] font-bold">เกณฑ์ระดับคุณภาพ</h3>
                <p className="mt-0.5 mb-3 text-[11.5px] text-muted-foreground">
                  ตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พ.ศ. 2551
                </p>
                <div className="space-y-2">
                  {([3, 2, 1, 0] as DcLevel[]).map((level) => (
                    <div key={level} className="flex items-center gap-3">
                      <span
                        className={`inline-flex h-6 w-8 items-center justify-center rounded-md text-[13px] font-bold ${LEVEL_STYLE[level]}`}
                      >
                        {level}
                      </span>
                      <span className="text-[13px]">
                        {DC_LEVEL_LABEL[level]} ({level} คะแนน)
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-border pt-3 text-[12px] leading-relaxed text-muted-foreground">
                  นักเรียนต้องได้ระดับ &quot;ผ่าน&quot; ขึ้นไปทุกด้าน จึงจะผ่านเกณฑ์การจบช่วงชั้น
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-[15px] font-bold">สถานะการส่ง ปพ.5 รายวิชา</h3>
                  <span className="text-[12.5px] font-bold text-risk-amber">
                    {submitted} / {subjectSubmissions.length}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {subjectSubmissions.map((s) => (
                    <div key={s.subject} className="flex items-center justify-between py-2.5">
                      <div>
                        <div className="text-[13.5px] font-medium">{s.subject}</div>
                        <div className="text-[11.5px] text-muted-foreground">{store.nameOf(s.teacherId)}</div>
                      </div>
                      <span
                        className={
                          s.submitted
                            ? "rounded-full bg-risk-green-bg px-2.5 py-1 text-[11.5px] font-semibold text-risk-green"
                            : "rounded-full bg-risk-amber-bg px-2.5 py-1 text-[11.5px] font-semibold text-risk-amber"
                        }
                      >
                        {s.submitted ? "ส่งแล้ว" : "รอส่งผล"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
