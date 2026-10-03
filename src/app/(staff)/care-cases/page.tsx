"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, FileText, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { RiskBadge } from "@/components/shared/risk-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { formatThaiDate } from "@/lib/format";
import {
  CARE_METHOD_LABEL,
  CareMethod,
  SUPPORT_TYPE_LABEL,
  SupportType,
} from "@/lib/types";

const SUPPORT_TYPES = Object.keys(SUPPORT_TYPE_LABEL) as SupportType[];
const CARE_METHODS = Object.keys(CARE_METHOD_LABEL) as CareMethod[];

export default function CareCasesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">กำลังโหลด...</div>}>
      <CareCasesContent />
    </Suspense>
  );
}

function CareCasesContent() {
  const store = useStore();
  const searchParams = useSearchParams();
  const focusStudent = searchParams.get("student");

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(
    () =>
      (focusStudent ? store.caseOf(focusStudent)?.caseId : undefined) ??
      store.careCases[0]?.caseId ??
      null
  );

  const activeCase = store.careCases.find((c) => c.caseId === selectedCaseId);
  const student = activeCase ? store.getStudent(activeCase.studentId) : undefined;

  const [action, setAction] = useState("");
  const [result, setResult] = useState("");

  return (
    <>
      <PageHeader
        title="ติดตามและช่วยเหลือนักเรียน"
        subtitle="แผนการช่วยเหลือและประวัติการติดตามผล"
      />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
          <Card className="h-fit">
            <CardContent className="p-5">
              <h2 className="mb-3 text-[15px] font-bold">รายการ case</h2>
              <div className="space-y-2">
                {store.careCases.map((c) => {
                  const s = store.getStudent(c.studentId);
                  const risk = store.overallRiskOf(c.studentId);
                  const selected = c.caseId === selectedCaseId;
                  return (
                    <button
                      key={c.caseId}
                      onClick={() => setSelectedCaseId(c.caseId)}
                      className={
                        selected
                          ? "w-full rounded-xl border border-primary bg-accent p-3 text-left"
                          : "w-full rounded-xl border border-border p-3 text-left hover:bg-muted/50"
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13.5px] font-semibold">{s?.fullName}</span>
                        {risk && <RiskBadge group={risk} short />}
                      </div>
                      <div className="mt-1 text-[11.5px] text-muted-foreground">
                        {c.caseId} · {c.status === "active" ? "กำลังดำเนินการ" : "ปิดแล้ว"} ·
                        ติดตาม {c.followups.length} ครั้ง
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {activeCase && student ? (
            <div className="space-y-5">
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-lg font-bold">
                        {activeCase.caseId} · {student.fullName}
                      </h2>
                      <span
                        className={
                          activeCase.status === "active"
                            ? "rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary"
                            : "rounded-full bg-risk-green-bg px-2.5 py-1 text-xs font-semibold text-risk-green"
                        }
                      >
                        {activeCase.status === "active" ? "กำลังดำเนินการ" : "ปิด case แล้ว"}
                      </span>
                    </div>
                    <p className="mt-1 text-[13.5px] text-muted-foreground">
                      เปิด case {formatThaiDate(activeCase.openedAt)} · ที่มา:{" "}
                      {activeCase.triggerSource}
                    </p>
                  </div>
                  <div className="text-right text-[13px]">
                    <div className="text-muted-foreground">ติดตามแล้ว</div>
                    <div className="text-[15px] font-semibold">
                      {activeCase.followups.length} ครั้ง
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-[15.5px] font-bold">ประเภทการช่วยเหลือ</h3>
                    <p className="mt-0.5 mb-3 text-[11.5px] text-muted-foreground">
                      อ้างอิงแนวทาง HERO OBEC CARE
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SUPPORT_TYPES.map((t) => (
                        <span
                          key={t}
                          className={
                            activeCase.supportType === t
                              ? "rounded-lg border border-primary bg-accent px-4 py-2 text-[13.5px] font-semibold text-primary"
                              : "rounded-lg border border-border px-4 py-2 text-[13.5px] text-muted-foreground"
                          }
                        >
                          {SUPPORT_TYPE_LABEL[t]}
                        </span>
                      ))}
                    </div>

                    <h3 className="mt-5 mb-2 text-[15.5px] font-bold">วิธีการดูแล</h3>
                    <div className="space-y-1">
                      {CARE_METHODS.map((m) => (
                        <div key={m} className="flex items-center gap-3 py-1">
                          <Checkbox
                            id={`m-${m}`}
                            checked={activeCase.careMethods.includes(m)}
                            disabled
                          />
                          <Label htmlFor={`m-${m}`} className="text-[13.5px] font-normal">
                            {CARE_METHOD_LABEL[m]}
                          </Label>
                        </div>
                      ))}
                    </div>

                    <h3 className="mt-5 mb-2 text-[15.5px] font-bold">เป้าหมายของแผน</h3>
                    <p className="rounded-lg bg-surface p-3.5 text-[13.5px] leading-relaxed">
                      {activeCase.goal}
                    </p>
                    {activeCase.targetDate && (
                      <p className="mt-2 text-[12.5px] text-muted-foreground">
                        วันที่คาดว่าจะบรรลุเป้าหมาย: {formatThaiDate(activeCase.targetDate)}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="mb-4 text-[15.5px] font-bold">ประวัติการช่วยเหลือและผลติดตาม</h3>

                    {activeCase.status === "active" && (
                      <div className="mb-5 space-y-2.5 rounded-xl bg-surface p-4">
                        <Label htmlFor="action" className="text-[13px]">
                          บันทึกการติดตามใหม่
                        </Label>
                        <Input
                          id="action"
                          value={action}
                          onChange={(e) => setAction(e.target.value)}
                          placeholder="สิ่งที่ดำเนินการ เช่น ให้คำปรึกษารายบุคคล ครั้งที่ 3"
                        />
                        <Textarea
                          value={result}
                          onChange={(e) => setResult(e.target.value)}
                          placeholder="ผลลัพธ์ที่สังเกตได้"
                          rows={2}
                        />
                        <Button
                          size="sm"
                          disabled={!action}
                          onClick={() => {
                            store.addFollowup(activeCase.caseId, action, result || "-");
                            setAction("");
                            setResult("");
                          }}
                        >
                          <Plus className="size-4" /> บันทึกการติดตาม
                        </Button>
                      </div>
                    )}

                    <div className="space-y-4">
                      {activeCase.followups.map((f, i) => (
                        <div key={f.followupId} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <span className="mt-1.5 size-2.5 rounded-full bg-primary" />
                            {i < activeCase.followups.length - 1 && (
                              <span className="mt-1 w-px flex-1 bg-border" />
                            )}
                          </div>
                          <div className="flex-1 pb-3">
                            <div className="text-[14px] font-semibold">{f.actionTaken}</div>
                            <div className="mt-0.5 mb-1 text-[12px] text-muted-foreground">
                              {formatThaiDate(f.followupDate)} · {f.recordedByName}
                            </div>
                            <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                              {f.result}
                            </p>
                          </div>
                        </div>
                      ))}
                      {activeCase.followups.length === 0 && (
                        <p className="text-sm text-muted-foreground">ยังไม่มีบันทึกการติดตาม</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {activeCase.status === "active" && (
                <div className="flex items-center justify-between pb-4">
                  <p className="text-[13px] text-muted-foreground">
                    การเปลี่ยนแปลงทั้งหมดถูกบันทึกใน audit log ของระบบ
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline">
                      <FileText className="size-4" /> จัดทำเอกสารส่งต่อภายนอก
                    </Button>
                    <Button onClick={() => store.closeCase(activeCase.caseId)}>
                      <CheckCircle2 className="size-4" /> ปิด case (ผลดีขึ้น)
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                ยังไม่มี case การช่วยเหลือ
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
