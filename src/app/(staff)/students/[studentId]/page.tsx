"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { RiskBadge } from "@/components/shared/risk-badge";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { CURRENT_TERM } from "@/lib/mock-data";
import { formatThaiDate, formatThaiDateTime } from "@/lib/format";
import {
  DC_LEVEL_LABEL,
  DIMENSION_LABEL,
  SDQ_LEVEL_LABEL,
  SDQ_RATER_LABEL,
  SdqRater,
} from "@/lib/types";

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const store = useStore();
  const student = store.getStudent(studentId);

  if (!student) return <p className="p-8 text-sm text-muted-foreground">ไม่พบข้อมูลนักเรียน</p>;

  // ครูทั่วไปเห็นเฉพาะ ชื่อ ห้อง ความประพฤติ และคุณลักษณะอันพึงประสงค์
  const sensitive = store.canSeeSensitive(studentId);
  const homeroom = store.isHomeroomOf(studentId);
  const previousHomeroom = store.isPreviousHomeroomOf(studentId);
  const ownPastScreenings = previousHomeroom
    ? store.screenings.filter(
        (s) => s.studentId === studentId && store.canViewRecord(studentId, s.screenedBy)
      )
    : [];
  const risk = store.overallRiskOf(studentId);
  const screening = store.latestScreening(studentId);
  const sdqSet = store.sdqOf(studentId).filter((s) => s.round === 1);
  const behaviors = store.behaviorOf(studentId).slice(0, 5);
  const behaviorScore = store.behaviorScoreOf(studentId);
  const careCase = store.caseOf(studentId);
  const dc = store.dcSummaryOf(studentId);
  const dcCriteria = store.dcCriteria;
  const guardians = store.guardiansOf(studentId);

  const info: [string, string][] = sensitive
    ? [
        ["เลขประจำตัวนักเรียน", student.studentId],
        ["เลขบัตรประชาชน", student.citizenId],
        ["ชั้น / ห้อง", `${student.roomName} เลขที่ ${student.classNo}`],
        [
          "ผู้ปกครอง",
          guardians.map((g) => `${g.user.name} (${g.relation})`).join(", ") || "-",
        ],
        [
          "เบอร์ติดต่อ",
          guardians
            .map((g) => g.user.phone)
            .filter(Boolean)
            .join(", ") || "-",
        ],
        ["ที่อยู่", student.address],
      ]
    : [["ชั้น / ห้อง", `${student.roomName} เลขที่ ${student.classNo}`]];

  return (
    <>
      <PageHeader title="ข้อมูลนักเรียนรายบุคคล" subtitle={CURRENT_TERM.label} />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/students"
            className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" /> กลับไปรายชื่อนักเรียน
          </Link>
          {sensitive && (
            <Button variant="outline" size="sm">
              <Download className="size-4" /> ส่งออกรายงานรายบุคคล
            </Button>
          )}
        </div>

        <Card className="mb-5">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex size-16 items-center justify-center rounded-xl bg-muted text-xl font-bold text-muted-foreground">
              {student.fullName.replace(/^(ด\.ช\.|ด\.ญ\.)\s*/, "").charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold">{student.fullName}</h2>
                {sensitive && risk && <RiskBadge group={risk} />}
              </div>
              <p className="mt-1 text-[13.5px] text-muted-foreground">
                {student.roomName} เลขที่ {student.classNo}
                {sensitive ? ` · เลขประจำตัว ${student.studentId}` : ""}
                {sensitive && screening ? ` · คัดกรองล่าสุด ${formatThaiDate(screening.screenedAt)}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              {homeroom && (
                <LinkButton variant="outline" href={`/screening/${studentId}`}>
                  คัดกรองใหม่
                </LinkButton>
              )}
              {(homeroom || (sensitive && careCase)) && (
                <LinkButton href={`/care-cases?student=${studentId}`}>
                  {careCase ? "ดู case ช่วยเหลือ" : "เปิด case ช่วยเหลือ"}
                </LinkButton>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[1fr_1.45fr]">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-[15.5px] font-bold">ข้อมูลพื้นฐาน</h3>
              <p className="mt-1 mb-3 text-[11.5px] text-muted-foreground">
                อ้างอิงจากงานทะเบียนนักเรียนของโรงเรียน — อ่านอย่างเดียว
                {!sensitive && " · ข้อมูลอื่นเปิดให้เฉพาะครูประจำชั้นของห้องนี้และแอดมิน"}
              </p>
              <dl className="divide-y divide-border">
                {info.map(([label, value]) => (
                  <div key={label} className="flex gap-3 py-2.5">
                    <dt className="w-36 shrink-0 text-[13px] text-muted-foreground">{label}</dt>
                    <dd className="flex-1 text-[13.5px] font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <div className="space-y-5">
            {ownPastScreenings.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-[15.5px] font-bold">บันทึกที่คุณเคยบันทึกไว้</h3>
                  <p className="mt-1 mb-3 text-[11.5px] text-muted-foreground">
                    คุณเคยเป็นครูประจำชั้นของนักเรียนคนนี้ จึงเห็นเฉพาะบันทึกของตัวเอง — อ่านอย่างเดียว
                  </p>
                  {ownPastScreenings.map((s) => (
                    <div key={s.screeningId} className="mb-3 last:mb-0">
                      <div className="mb-2 text-[12.5px] text-muted-foreground">
                        การคัดกรอง {formatThaiDate(s.screenedAt)}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {s.results.map((r) => (
                          <div
                            key={r.dimension}
                            className="flex items-center justify-between rounded-lg bg-surface px-3.5 py-2"
                          >
                            <span className="text-[13px]">{DIMENSION_LABEL[r.dimension]}</span>
                            <RiskBadge group={r.group} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {sensitive && (
              <>
                <Card>
                  <CardContent className="p-6">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-[15.5px] font-bold">ผลการคัดกรอง 6 มิติ</h3>
                      {screening && (
                        <span className="text-[12.5px] text-muted-foreground">
                          ล่าสุด {formatThaiDate(screening.screenedAt)}
                        </span>
                      )}
                    </div>
                    {screening ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {screening.results.map((r) => (
                          <div
                            key={r.dimension}
                            className="flex items-center justify-between rounded-lg bg-surface px-3.5 py-2.5"
                          >
                            <span className="text-[13.5px] font-medium">
                              {DIMENSION_LABEL[r.dimension]}
                            </span>
                            <RiskBadge group={r.group} short />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="py-4 text-sm text-muted-foreground">ยังไม่มีข้อมูลการคัดกรอง</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="mb-3 text-[15.5px] font-bold">ผลการประเมิน SDQ (3 ผู้ประเมิน)</h3>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {(["teacher", "student", "parent"] as SdqRater[]).map((rater) => {
                        const rec = sdqSet.find((s) => s.rater === rater);
                        const done = rec?.status === "completed";
                        return (
                          <div
                            key={rater}
                            className={
                              done
                                ? "rounded-xl border border-border p-4"
                                : "rounded-xl border border-dashed border-border bg-surface p-4"
                            }
                          >
                            <div className="text-[12.5px] text-muted-foreground">
                              {SDQ_RATER_LABEL[rater]}
                            </div>
                            {done ? (
                              <>
                                <div className="my-1.5 text-2xl font-bold">
                                  {rec.totalDifficulties}
                                  <span className="ml-1 text-xs font-medium text-muted-foreground">
                                    คะแนน
                                  </span>
                                </div>
                                <span
                                  className={
                                    rec.level === "normal"
                                      ? "rounded-full bg-risk-green-bg px-2.5 py-1 text-xs font-semibold text-risk-green"
                                      : rec.level === "risk"
                                        ? "rounded-full bg-risk-amber-bg px-2.5 py-1 text-xs font-semibold text-risk-amber"
                                        : "rounded-full bg-risk-red-bg px-2.5 py-1 text-xs font-semibold text-risk-red"
                                  }
                                >
                                  {rec.level ? SDQ_LEVEL_LABEL[rec.level] : ""}
                                </span>
                              </>
                            ) : (
                              <div className="mt-3 text-[13px] font-medium text-muted-foreground">
                                {rec ? "รอทำแบบประเมิน" : "ยังไม่เปิดแบบประเมิน"}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            <Card>
              <CardContent className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-[15.5px] font-bold">ประวัติความประพฤติล่าสุด</h3>
                  <span className="text-[13px] font-semibold">
                    คะแนนสะสม:{" "}
                    <span className={behaviorScore < 0 ? "text-risk-red" : "text-risk-green"}>
                      {behaviorScore > 0 ? `+${behaviorScore}` : behaviorScore}
                    </span>
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {behaviors.map((rec) => {
                    const rule = store.ruleOf(rec.ruleId);
                    const positive = (rule?.scoreDelta ?? 0) > 0;
                    return (
                      <div key={rec.recordId} className="flex items-center gap-3 py-2.5">
                        <span className="w-32 shrink-0 text-[12.5px] text-muted-foreground">
                          {formatThaiDateTime(rec.occurredAt)}
                        </span>
                        <span className="flex-1 text-[13.5px]">{rule?.name}</span>
                        {rec.source === "qr_checkin" && (
                          <span className="rounded bg-accent px-2 py-0.5 text-[11px] font-semibold text-primary">
                            QR อัตโนมัติ
                          </span>
                        )}
                        <span
                          className={
                            positive
                              ? "w-10 text-right text-sm font-bold text-risk-green"
                              : "w-10 text-right text-sm font-bold text-risk-red"
                          }
                        >
                          {positive ? `+${rule?.scoreDelta}` : rule?.scoreDelta}
                        </span>
                      </div>
                    );
                  })}
                  {behaviors.length === 0 && (
                    <p className="py-4 text-sm text-muted-foreground">ยังไม่มีบันทึกความประพฤติ</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {dc && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-3 text-[15.5px] font-bold">
                    คุณลักษณะอันพึงประสงค์ (ปพ.6)
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {dcCriteria.map((c) => {
                      const level = dc.levels[c.criteriaId];
                      return (
                        <div
                          key={c.criteriaId}
                          className="flex items-center justify-between rounded-lg bg-surface px-3.5 py-2"
                        >
                          <span className="text-[13px]">{c.name}</span>
                          <span
                            className={
                              level === null || level === undefined
                                ? "text-[12.5px] font-semibold text-muted-foreground"
                                : level >= 3
                                  ? "text-[12.5px] font-semibold text-risk-green"
                                  : level === 2
                                    ? "text-[12.5px] font-semibold text-primary"
                                    : level === 1
                                      ? "text-[12.5px] font-semibold text-risk-amber"
                                      : "text-[12.5px] font-semibold text-risk-red"
                            }
                          >
                            {level === null || level === undefined
                              ? "รอประเมิน"
                              : DC_LEVEL_LABEL[level]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
