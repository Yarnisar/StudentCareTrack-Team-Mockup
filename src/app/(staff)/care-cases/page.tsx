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
import { ruleKind } from "@/lib/behavior-rules";
import { formatThaiDate } from "@/lib/format";
import { CURRENT_TERM, DEMO_TODAY } from "@/lib/mock-data";
import { ExportButton } from "@/components/shared/export-button";
import { daysBetween, shiftDate } from "@/lib/periods";
import { StudentId } from "@/components/shared/student-id";
import {
  CARE_METHOD_LABEL,
  CASE_URGENCY_LABEL,
  CareMethod,
  CaseUrgency,
  caseUrgencyText,
  REFERRAL_STATUS_LABEL,
  SDQ_LEVEL_LABEL,
} from "@/lib/types";

const CARE_METHODS = Object.keys(CARE_METHOD_LABEL) as CareMethod[];
const URGENCIES = Object.keys(CASE_URGENCY_LABEL) as CaseUrgency[];
/** ตัวเลือกวันติดตามครั้งถัดไปแบบกดเดียว — PROTOTYPE: ช่วงวันยังไม่ได้ตกลงกับทีม */
const NEXT_FOLLOWUP_OPTIONS = [7, 14, 30];
const defaultNextFollowup = () => shiftDate(DEMO_TODAY, NEXT_FOLLOWUP_OPTIONS[0]);

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
  // เปิดจากงานของนักเรียนที่ไม่มี case ที่กำลังดำเนินการ (แม้เคยมี case ที่ปิดแล้ว) -> เปิดฟอร์มสร้าง case ใหม่ (UC11 สถานการณ์ A ข้อ 4)
  const activeOf = (studentId: string) => store.careCases.find((c) => c.studentId === studentId && c.status === "active");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(() =>
    focusStudent
      ? (activeOf(focusStudent)?.caseId ?? store.caseOf(focusStudent)?.caseId ?? null)
      : (store.careCases[0]?.caseId ?? null)
  );
  const [newCaseFor, setNewCaseFor] = useState<string | null>(() =>
    focusStudent && !activeOf(focusStudent) ? focusStudent : null
  );

  const activeCase = store.careCases.find((c) => c.caseId === selectedCaseId);
  const student = activeCase ? store.getStudent(activeCase.studentId) : undefined;

  const triggerSourceFor = (studentId: string) => {
    if (from === "home_visit") return "ผลการเยี่ยมบ้าน";
    if (from === "behavior") {
      const level = store.behaviorWatchLevelOf(studentId);
      const refers = store.behaviorOf(studentId).filter((r) => {
        const rule = store.behaviorRules.find((x) => x.ruleId === r.ruleId);
        return !r.cancelled && !!rule && ruleKind(rule) === "refer";
      });
      const names = [...new Set(refers.map((r) => store.behaviorRules.find((x) => x.ruleId === r.ruleId)?.name))].join(", ");
      return [level > 0 && `เฝ้าระวังความประพฤติระดับ ${level}`, refers.length > 0 && `บันทึกตามกฎส่งต่อ: ${names}`]
        .filter(Boolean)
        .join(" · ");
    }
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
  // เสนอ 1 สัปดาห์ไว้ก่อน ครูเปลี่ยนได้ด้วยกดเดียว
  const [nextDate, setNextDate] = useState(defaultNextFollowup);

  return (
    <>
      <PageHeader
        title="ติดตามและช่วยเหลือนักเรียน"
        action={
          <ExportButton
            label="ส่งออกรายการกรณี"
            count={store.careCases.length}
            filename={`กรณีช่วยเหลือ-${CURRENT_TERM.termId}`}
            scope={`กรณีช่วยเหลือ ${CURRENT_TERM.label} · ${store.careCases.length} กรณี`}
            header={["รหัสกรณี", "เลขที่", "ชื่อ-สกุล", "ห้อง", "ที่มา", "สถานะ", "ความเร่งด่วน", "วันเปิด", "วันปิด", "ติดตามแล้ว (ครั้ง)", "นัดติดตามครั้งถัดไป", "เป้าหมาย"]}
            rows={() =>
              store.careCases.map((c) => {
                const s = store.getStudent(c.studentId);
                return [
                  c.caseId,
                  s?.classNo ?? "",
                  s?.fullName ?? "",
                  s?.roomName ?? "",
                  c.triggerSource,
                  c.status === "active" ? "กำลังดำเนินการ" : "ปิดแล้ว",
                  caseUrgencyText(c),
                  formatThaiDate(c.openedAt),
                  c.closedAt ? formatThaiDate(c.closedAt) : "",
                  c.followups.length,
                  c.nextFollowupDate ? formatThaiDate(c.nextFollowupDate) : "",
                  c.goal,
                ];
              })
            }
          />
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
          <Card className="h-fit">
            <CardContent className="p-5">
              <h2 className="mb-3 text-[15px] font-bold">รายการกรณี</h2>
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
                        <span className="flex min-w-0 items-baseline gap-2">
                          {s && <StudentId id={s.studentId} />}
                          <span className="truncate text-[13.5px] font-semibold">{s?.fullName}</span>
                        </span>
                        {risk && <RiskBadge group={risk} short />}
                      </div>
                      <div className="mt-1 text-[11.5px] text-muted-foreground">
                        {c.caseId} · {c.status === "active" ? "กำลังดำเนินการ" : "ปิดแล้ว"} ·
                        ติดตาม {c.followups.length} ครั้ง
                      </div>
                      {c.status === "active" && c.goal === "" && (
                        <div className="mt-1.5 text-[11.5px] font-semibold text-foreground">
                          ระบบเปิดให้ · ยังไม่วางแผนช่วยเหลือ
                        </div>
                      )}
                      {c.status === "active" && c.goal !== "" && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11.5px]">
                          <UrgencyTag urgency={c.urgency} />
                          <span className="text-muted-foreground">
                            {c.nextFollowupDate
                              ? `ติดตามครั้งถัดไป ${formatThaiDate(c.nextFollowupDate)}`
                              : "ยังไม่กำหนดวันติดตาม"}
                          </span>
                        </div>
                      )}
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
          ) : activeCase && student && activeCase.status === "active" && activeCase.goal === "" ? (
            <NewCaseForm
              key={activeCase.caseId}
              studentId={activeCase.studentId}
              planCaseId={activeCase.caseId}
              triggerSource={activeCase.triggerSource}
              onCancel={() => setSelectedCaseId(null)}
              onCreated={(caseId) => setSelectedCaseId(caseId)}
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
                        {activeCase.status === "active" ? "กำลังดำเนินการ" : "ปิดกรณีแล้ว"}
                      </span>
                      {activeCase.status === "closed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setNewCaseFor(activeCase.studentId)}
                        >
                          <Plus className="size-4" /> เปิดกรณีใหม่
                        </Button>
                      )}
                    </div>
                    <p className="mt-1 text-[13.5px] text-muted-foreground">
                      เปิดกรณี {formatThaiDate(activeCase.openedAt)} · ที่มา:{" "}
                      {activeCase.triggerSource}
                    </p>
                    {activeCase.status === "active" && (
                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">ความเร่งด่วน</span>
                          <UrgencyPicker
                            value={activeCase.urgency}
                            onChange={(u) => store.setCaseUrgency(activeCase.caseId, u)}
                          />
                        </div>
                        <NextFollowupStatus date={activeCase.nextFollowupDate} />
                      </div>
                    )}
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
                    <h3 className="mb-2 text-[15.5px] font-bold">วิธีการดูแล</h3>
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
                        <Label htmlFor="next-followup" className="block pt-1 text-[13px]">
                          วันติดตามครั้งถัดไป
                        </Label>
                        <NextFollowupPicker id="next-followup" value={nextDate} onChange={setNextDate} />
                        <Button
                          size="sm"
                          disabled={!action || !nextDate}
                          onClick={() => {
                            store.addFollowup(activeCase.caseId, action, result || "-", nextDate);
                            setAction("");
                            setResult("");
                            setNextDate(defaultNextFollowup());
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
                              {f.nextFollowupDate && ` · นัดติดตาม ${formatThaiDate(f.nextFollowupDate)}`}
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

              {activeCase.referral && (
                <p className="rounded-lg bg-surface px-4 py-3 text-[13px]">
                  <FileText className="mr-1.5 inline size-4" />
                  เอกสารส่งต่อ {activeCase.referral.referralId} ส่งให้แอดมินเมื่อ {formatThaiDate(activeCase.referral.preparedAt)} ·{" "}
                  <b>{REFERRAL_STATUS_LABEL[activeCase.referral.status]}</b>
                  {activeCase.status === "active" && " · กรณียังเปิดอยู่ ติดตามต่อได้"}
                </p>
              )}
              {activeCase.status === "closed" && activeCase.closingSummary && (
                <p className="rounded-lg bg-surface px-4 py-3 text-[13px]">
                  ปิดกรณีเมื่อ {formatThaiDate(activeCase.closedAt ?? "")} · ผลสรุป: {activeCase.closingSummary}
                </p>
              )}
              {activeCase.status === "active" && (
                <CaseActions key={activeCase.caseId} caseId={activeCase.caseId} hasReferral={!!activeCase.referral} />
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                ยังไม่มีกรณีการช่วยเหลือ
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

/** ผลสรุปตอนปิด case ให้เลือกแทนการพิมพ์ — PROTOTYPE: รายการเป็นข้อเสนอ */
const CLOSE_SUMMARIES = ["บรรลุเป้าหมาย พฤติกรรมดีขึ้นต่อเนื่อง", "ปัญหาคลี่คลายแล้ว", "ย้ายสถานศึกษา"];

/**
 * ปุ่มท้าย case: เตรียมส่งต่อ (Scenario D) และปิด case พร้อมผลสรุป (Scenario C)
 * เตรียมส่งต่อ: ระบบรวบรวมข้อมูลเป็นเอกสารให้ครูตรวจ แล้วส่งให้แอดมินเก็บรักษา การแจ้งแอดมินไม่ระบุชื่อนักเรียน
 */
function CaseActions({ caseId, hasReferral }: { caseId: string; hasReferral: boolean }) {
  const store = useStore();
  const careCase = store.careCases.find((c) => c.caseId === caseId);
  const student = careCase ? store.getStudent(careCase.studentId) : undefined;
  const [mode, setMode] = useState<"none" | "referral" | "close">("none");
  const [summary, setSummary] = useState("");
  const [other, setOther] = useState("");
  const finalSummary = summary === "อื่น ๆ" ? other.trim() : summary;
  if (!careCase || !student) return null;

  return (
    <div className="space-y-3 pb-4">
      {mode === "none" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-muted-foreground">ระบบเก็บประวัติการเปลี่ยนแปลงทุกครั้ง</p>
          <div className="flex flex-wrap gap-2">
            {!hasReferral && (
              <Button variant="outline" onClick={() => setMode("referral")}>
                <FileText className="size-4" /> เตรียมเอกสารส่งต่อ
              </Button>
            )}
            <Button onClick={() => setMode("close")}>
              <CheckCircle2 className="size-4" /> ปิดกรณี
            </Button>
          </div>
        </div>
      )}

      {mode === "referral" && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-[15.5px] font-bold">ตรวจเอกสารส่งต่อก่อนส่งให้แอดมินเก็บรักษา</h3>
            <p className="mt-0.5 mb-3 text-[12px] text-muted-foreground">
              ระบบรวบรวมจากข้อมูลในกรณีนี้ ครูนำไปดำเนินการส่งต่อภายนอกเอง ระบบไม่ส่งข้อมูลออกให้หน่วยงานภายนอกโดยตรง
            </p>
            <dl className="divide-y divide-border rounded-lg border border-border text-[13px]">
              {[
                ["นักเรียน", `${student.fullName} · ${student.roomName} เลขที่ ${student.classNo}`],
                ["ที่มาของกรณี", careCase.triggerSource],
                ["วิธีการดูแล", careCase.careMethods.map((m) => CARE_METHOD_LABEL[m]).join(", ") || "-"],
                ["เป้าหมาย", careCase.goal || "-"],
                ["การติดตาม", `${careCase.followups.length} ครั้ง${careCase.followups[0] ? ` · ล่าสุด: ${careCase.followups[0].actionTaken}` : ""}`],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3 px-3 py-2">
                  <dt className="w-32 shrink-0 text-muted-foreground">{k}</dt>
                  <dd className="min-w-0 flex-1">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[12px] text-muted-foreground">
              แอดมินจะเห็นเฉพาะเลขเอกสาร ผู้ส่ง วันที่ และสถานะ ไม่เห็นชื่อนักเรียนหรือเนื้อหา
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setMode("none")}>
                ยกเลิก
              </Button>
              <Button
                onClick={() => {
                  store.sendReferral(caseId);
                  setMode("none");
                }}
              >
                ตรวจแล้ว ส่งให้แอดมินเก็บรักษา
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {mode === "close" && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-[15.5px] font-bold">ปิดกรณี · บันทึกผลสรุป</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[...CLOSE_SUMMARIES, "อื่น ๆ"].map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={summary === r}
                  onClick={() => setSummary(r)}
                  className={
                    summary === r
                      ? "rounded-lg border border-primary bg-accent px-3 py-1.5 text-[13px] font-semibold text-primary"
                      : "rounded-lg border border-border px-3 py-1.5 text-[13px] hover:bg-muted"
                  }
                >
                  {r}
                </button>
              ))}
            </div>
            {summary === "อื่น ๆ" && (
              <Textarea
                aria-label="ผลสรุป"
                value={other}
                onChange={(e) => setOther(e.target.value)}
                placeholder="ผลสรุปของการช่วยเหลือ"
                rows={2}
                className="mt-2"
              />
            )}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setMode("none")}>
                ยกเลิก
              </Button>
              <Button disabled={finalSummary === ""} onClick={() => store.closeCase(caseId, finalSummary)}>
                ยืนยันปิดกรณี
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function NewCaseForm({
  studentId,
  planCaseId,
  triggerSource,
  onCancel,
  onCreated,
}: {
  studentId: string;
  /** case ที่ระบบเปิดให้แล้วแต่ยังไม่มีแผน (UC6 ข้อ 13 -> UC11 Scenario A ข้อ 5) */
  planCaseId?: string;
  triggerSource?: string;
  onCancel: () => void;
  onCreated: (caseId: string) => void;
}) {
  const store = useStore();
  const student = store.getStudent(studentId);
  const risk = store.overallRiskOf(studentId);

  const [methods, setMethods] = useState<CareMethod[]>([]);
  const [goal, setGoal] = useState("");
  const [targetDate, setTargetDate] = useState("");
  // ไม่มีค่าเริ่มต้น ให้ครูตัดสินความเร่งด่วนเอง
  const [urgency, setUrgency] = useState<CaseUrgency | null>(null);
  const [nextDate, setNextDate] = useState(defaultNextFollowup);

  if (!student) return null;

  const toggleMethod = (m: CareMethod) =>
    setMethods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const canSubmit = methods.length > 0 && goal.trim() !== "" && urgency !== null && nextDate !== "";

  const handleSubmit = () => {
    if (!urgency) return;
    if (planCaseId) {
      store.planCase(planCaseId, {
        careMethods: methods,
        goal: goal.trim(),
        urgency,
        nextFollowupDate: nextDate,
        targetDate: targetDate || undefined,
      });
      onCreated(planCaseId);
      return;
    }
    const record = store.openCase(studentId, methods, goal.trim(), {
      urgency,
      nextFollowupDate: nextDate,
      targetDate: targetDate || undefined,
      triggerSource,
    });
    onCreated(record.caseId);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-5 flex flex-wrap items-center gap-2.5">
          <h2 className="text-lg font-bold">
            {planCaseId ? "วางแผนช่วยเหลือ" : "เปิดกรณีช่วยเหลือ"} · {student.fullName}
          </h2>
          {risk && <RiskBadge group={risk} short />}
        </div>
        <p className="-mt-3 mb-5 text-[13.5px] text-muted-foreground">
          {student.roomName} เลขที่ {student.classNo} · ที่มา: {triggerSource ?? "เปิดโดยครูประจำชั้น"}
        </p>
        {planCaseId && (
          <p className="-mt-2 mb-5 rounded-lg bg-surface px-3 py-2.5 text-[13px]">
            ระบบเปิดกรณีนี้ให้จากผลคัดกรอง ระบุแผนช่วยเหลือ ความเร่งด่วน และวันติดตามเพื่อเริ่มติดตาม
          </p>
        )}

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

        <h3 className="mb-2 text-[15px] font-bold">ความเร่งด่วน</h3>
        <UrgencyPicker value={urgency} onChange={setUrgency} className="mb-5" />

        <Label htmlFor="first-followup" className="mb-2 block text-[15px] font-bold">
          นัดติดตามครั้งแรก
        </Label>
        <NextFollowupPicker id="first-followup" value={nextDate} onChange={setNextDate} className="mb-5" />

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
            <Plus className="size-4" /> {planCaseId ? "บันทึกแผนช่วยเหลือ" : "เปิดกรณี"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** ความเร่งด่วนใช้สีกลาง เพราะสีแดง/เหลืองสงวนไว้สำหรับกลุ่มเสี่ยง/กลุ่มมีปัญหา */
function UrgencyTag({ urgency }: { urgency: CaseUrgency }) {
  return (
    <span
      className={
        urgency === "urgent"
          ? "rounded-md border border-foreground/40 px-1.5 py-0.5 font-semibold text-foreground"
          : "rounded-md bg-muted px-1.5 py-0.5 font-medium text-muted-foreground"
      }
    >
      {CASE_URGENCY_LABEL[urgency]}
    </span>
  );
}

function UrgencyPicker({
  value,
  onChange,
  className,
}: {
  value: CaseUrgency | null;
  onChange: (urgency: CaseUrgency) => void;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label="ความเร่งด่วน" className={`flex flex-wrap gap-2 ${className ?? ""}`}>
      {URGENCIES.map((u) => (
        <button
          key={u}
          type="button"
          role="radio"
          aria-checked={value === u}
          onClick={() => onChange(u)}
          className={
            value === u
              ? "rounded-lg border border-primary bg-accent px-3 py-1.5 text-[13px] font-semibold text-primary"
              : "rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] text-muted-foreground hover:bg-muted"
          }
        >
          {CASE_URGENCY_LABEL[u]}
        </button>
      ))}
    </div>
  );
}

/** วันติดตามครั้งถัดไป (UC11 ข้อ 14): กดเลือกระยะที่ใช้บ่อย หรือเลือกวันเองจากปฏิทิน */
function NextFollowupPicker({
  id,
  value,
  onChange,
  className,
}: {
  id: string;
  value: string;
  onChange: (date: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        {NEXT_FOLLOWUP_OPTIONS.map((days) => {
          const date = shiftDate(DEMO_TODAY, days);
          return (
            <button
              key={days}
              type="button"
              aria-pressed={value === date}
              onClick={() => onChange(date)}
              className={
                value === date
                  ? "rounded-lg border border-primary bg-accent px-3 py-1.5 text-[13px] font-semibold text-primary"
                  : "rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] text-muted-foreground hover:bg-muted"
              }
            >
              อีก {days} วัน
            </button>
          );
        })}
        <Input
          id={id}
          type="date"
          value={value}
          min={DEMO_TODAY}
          onChange={(e) => onChange(e.target.value)}
          className="w-44"
        />
      </div>
      {value && <p className="mt-1 text-[12px] text-muted-foreground">ติดตามครั้งถัดไป {formatThaiDate(value)}</p>}
    </div>
  );
}

function NextFollowupStatus({ date }: { date: string }) {
  if (!date) return <span className="text-muted-foreground">ยังไม่กำหนดวันติดตามครั้งถัดไป</span>;
  const left = daysBetween(DEMO_TODAY, date);
  return (
    <span className={left < 0 ? "font-semibold text-foreground" : "text-muted-foreground"}>
      ติดตามครั้งถัดไป {formatThaiDate(date)} ·{" "}
      {left < 0 ? `เลยกำหนด ${-left} วัน` : left === 0 ? "วันนี้" : `อีก ${left} วัน`}
    </span>
  );
}
