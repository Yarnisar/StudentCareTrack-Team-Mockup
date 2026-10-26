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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { formatThaiDate } from "@/lib/format";
import {
  CARE_METHOD_LABEL,
  CareMethod,
  SDQ_LEVEL_LABEL,
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
  const from = searchParams.get("from");

  // เข้ามาพร้อม ?student= ของนักเรียนที่ยังไม่มี case -> เปิดฟอร์มสร้าง case ใหม่ (ไม่แสดง case ของคนอื่นแทน)
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(() =>
    focusStudent
      ? (store.caseOf(focusStudent)?.caseId ?? null)
      : (store.careCases[0]?.caseId ?? null)
  );
  const [newCaseFor, setNewCaseFor] = useState<string | null>(() =>
    focusStudent && !store.caseOf(focusStudent) ? focusStudent : null
  );

  const activeCase = store.careCases.find((c) => c.caseId === selectedCaseId);
  const student = activeCase ? store.getStudent(activeCase.studentId) : undefined;

  const triggerSourceFor = (studentId: string) => {
    if (from !== "sdq") return undefined;
    const teacherSdq = store
      .sdqOf(studentId)
      .find((s) => s.rater === "teacher" && s.status === "completed");
    return teacherSdq?.level
      ? `ผลประเมิน SDQ ฉบับครู: ${SDQ_LEVEL_LABEL[teacherSdq.level]}`
      : "ผลประเมิน SDQ ฉบับครู";
  };

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
                      onClick={() => {
                        setSelectedCaseId(c.caseId);
                        setNewCaseFor(null);
                      }}
                      className={
                        selected && !newCaseFor
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

          {newCaseFor ? (
            <NewCaseForm
              key={newCaseFor}
              studentId={newCaseFor}
              triggerSource={triggerSourceFor(newCaseFor)}
              onCancel={() => setNewCaseFor(null)}
              onCreated={(caseId) => {
                setSelectedCaseId(caseId);
                setNewCaseFor(null);
              }}
            />
          ) : activeCase && student ? (
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
                      {activeCase.status === "closed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setNewCaseFor(activeCase.studentId)}
                        >
                          <Plus className="size-4" /> เปิด case ใหม่
                        </Button>
                      )}
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

function NewCaseForm({
  studentId,
  triggerSource,
  onCancel,
  onCreated,
}: {
  studentId: string;
  triggerSource?: string;
  onCancel: () => void;
  onCreated: (caseId: string) => void;
}) {
  const store = useStore();
  const student = store.getStudent(studentId);
  const risk = store.overallRiskOf(studentId);

  const [supportType, setSupportType] = useState<SupportType>("prevent");
  const [methods, setMethods] = useState<CareMethod[]>([]);
  const [goal, setGoal] = useState("");
  const [targetDate, setTargetDate] = useState("");

  if (!student) return null;

  const toggleMethod = (m: CareMethod) =>
    setMethods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const canSubmit = methods.length > 0 && goal.trim() !== "";

  const handleSubmit = () => {
    const record = store.openCase(studentId, supportType, methods, goal.trim(), {
      targetDate: targetDate || undefined,
      triggerSource,
    });
    onCreated(record.caseId);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-5 flex flex-wrap items-center gap-2.5">
          <h2 className="text-lg font-bold">เปิด case ช่วยเหลือ · {student.fullName}</h2>
          {risk && <RiskBadge group={risk} short />}
        </div>
        <p className="-mt-3 mb-5 text-[13.5px] text-muted-foreground">
          {student.roomName} เลขที่ {student.classNo} · ที่มา: {triggerSource ?? "เปิดโดยครูประจำชั้น"}
        </p>

        <h3 className="mb-2 text-[15px] font-bold">ประเภทการช่วยเหลือ</h3>
        <RadioGroup
          value={supportType}
          onValueChange={(v) => setSupportType(v as SupportType)}
          className="mb-5 flex flex-wrap gap-2.5"
        >
          {SUPPORT_TYPES.map((t) => (
            <Label
              key={t}
              htmlFor={`type-${t}`}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-[13.5px] font-medium has-[[data-checked]]:border-primary has-[[data-checked]]:bg-accent has-[[data-checked]]:text-primary"
            >
              <RadioGroupItem id={`type-${t}`} value={t} />
              {SUPPORT_TYPE_LABEL[t]}
            </Label>
          ))}
        </RadioGroup>

        <h3 className="mb-2 text-[15px] font-bold">
          วิธีการดูแล <span className="text-[12px] font-normal text-muted-foreground">(เลือกอย่างน้อย 1)</span>
        </h3>
        <div className="mb-5 space-y-1">
          {CARE_METHODS.map((m) => (
            <div key={m} className="flex items-center gap-3 py-1">
              <Checkbox
                id={`new-m-${m}`}
                checked={methods.includes(m)}
                onCheckedChange={() => toggleMethod(m)}
              />
              <Label htmlFor={`new-m-${m}`} className="text-[13.5px] font-normal">
                {CARE_METHOD_LABEL[m]}
              </Label>
            </div>
          ))}
        </div>

        <Label htmlFor="goal" className="mb-2 block text-[15px] font-bold">
          เป้าหมายของแผน
        </Label>
        <Textarea
          id="goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="เช่น นักเรียนมาเรียนสม่ำเสมอและพูดคุยกับครูที่ปรึกษาได้อย่างน้อยสัปดาห์ละครั้ง"
          rows={3}
          className="mb-5"
        />

        <Label htmlFor="target-date" className="mb-2 block text-[15px] font-bold">
          วันที่คาดว่าจะบรรลุเป้าหมาย{" "}
          <span className="text-[12px] font-normal text-muted-foreground">(ไม่บังคับ)</span>
        </Label>
        <Input
          id="target-date"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="mb-6 w-48"
        />

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            ยกเลิก
          </Button>
          <Button disabled={!canSubmit} onClick={handleSubmit}>
            <Plus className="size-4" /> เปิด case
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
