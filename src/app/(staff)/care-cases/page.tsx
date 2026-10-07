"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FolderPlus, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PagerNumbered, usePagination } from "@/components/shared/pagination";
import { RiskBadge } from "@/components/shared/risk-badge";
import { CaseDetail } from "@/components/care/case-detail";
import { OpenCaseForm } from "@/components/care/open-case-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { useDemoPageTool } from "@/lib/demo/page-tools";
import { formatThaiDate } from "@/lib/format";
import { CASE_CLOSE_REASON_LABEL, CASE_TRIGGER_SOURCE_LABEL } from "@/lib/types";

export default function CareCasesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">กำลังโหลด...</div>}>
      <CareCasesContent />
    </Suspense>
  );
}

type Selection =
  | { kind: "case"; caseId: string }
  | { kind: "open"; studentId: string; suggestionId?: string }
  | { kind: "none" };

const selectClass = "h-10 w-full rounded-lg border border-border bg-card px-3 text-sm";

/** ปุ่มสาธิต: ลงทะเบียนเฉพาะเมื่อ case ที่เลือกยังเปิดอยู่ (ถอดออกเมื่อ case ปิดแล้ว) */
function TransferDemoTool({ studentId, studentName }: { studentId: string; studentName: string }) {
  const store = useStore();
  useDemoPageTool(
    "จำลอง: นักเรียนย้ายออก",
    () => {
      store.applyStudentStatusChange(studentId, "transferred");
    },
    `จำลองว่า ${studentName} ย้ายออก เพื่อดูกฎปิด case อัตโนมัติ (เหตุผล "ย้ายออก" บันทึกโดยระบบ) — เป็นการจำลองเท่านั้น สถานะนักเรียนจริงไม่เปลี่ยน; ของจริงสัญญาณนี้มาจากทะเบียนนักเรียนของทีม B`
  );
  return null;
}

function CareCasesContent() {
  const store = useStore();
  const searchParams = useSearchParams();

  const visibleCases = store.careCases
    .filter((c) => store.canSeeSensitive(c.studentId))
    .sort((a, b) =>
      a.status === b.status ? b.openedAt.localeCompare(a.openedAt) : a.status === "active" ? -1 : 1
    );
  // นักเรียนที่ครูประจำชั้นเปิด case ใหม่ได้ (ยังไม่มี case เปิดอยู่)
  const openable = store.students.filter(
    (s) => s.status === "studying" && store.canManageCase(s.studentId) && !store.activeCaseOf(s.studentId)
  );
  const suggestions = store.pendingSuggestions.filter((s) => !store.activeCaseOf(s.studentId));

  const [selection, setSelection] = useState<Selection>(() => {
    const student = searchParams.get("student");
    const suggestionId = searchParams.get("suggestion") ?? undefined;
    if (student) {
      const c = store.activeCaseOf(student);
      if (c) return { kind: "case", caseId: c.caseId };
      if (store.canManageCase(student)) return { kind: "open", studentId: student, suggestionId };
      const past = store.caseOf(student);
      if (past && store.canSeeSensitive(student)) return { kind: "case", caseId: past.caseId };
      return { kind: "none" };
    }
    return visibleCases[0] ? { kind: "case", caseId: visibleCases[0].caseId } : { kind: "none" };
  });
  const [pickStudent, setPickStudent] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const pager = usePagination(visibleCases, pageSize);

  const selectedCase =
    selection.kind === "case" ? visibleCases.find((c) => c.caseId === selection.caseId) : undefined;
  const openSuggestion =
    selection.kind === "open" && selection.suggestionId
      ? store.pendingSuggestionsOf(selection.studentId).find((s) => s.suggestionId === selection.suggestionId)
      : undefined;

  return (
    <>
      {selectedCase?.status === "active" && (
        <TransferDemoTool
          key={selectedCase.caseId}
          studentId={selectedCase.studentId}
          studentName={store.getStudent(selectedCase.studentId)?.fullName ?? selectedCase.studentId}
        />
      )}
      <PageHeader title="ติดตามและช่วยเหลือนักเรียน" subtitle="care case แผนช่วยเหลือ และประวัติการติดตามผล" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
          <div className="space-y-5">
            {openable.length > 0 && (
              <Card>
                <CardContent className="space-y-2.5 p-5">
                  <h2 className="text-[15px] font-bold">เปิด case ใหม่</h2>
                  <select
                    aria-label="เลือกนักเรียน"
                    className={selectClass}
                    value={pickStudent}
                    onChange={(e) => setPickStudent(e.target.value)}
                  >
                    <option value="">เลือกนักเรียน...</option>
                    {openable.map((s) => (
                      <option key={s.studentId} value={s.studentId}>
                        {s.fullName} ({s.roomName} เลขที่ {s.classNo})
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    disabled={!pickStudent}
                    onClick={() => setSelection({ kind: "open", studentId: pickStudent })}
                  >
                    <FolderPlus className="size-4" /> เปิด case
                  </Button>
                </CardContent>
              </Card>
            )}

            {suggestions.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <h2 className="mb-1 flex items-center gap-2 text-[15px] font-bold">
                    <Lightbulb className="size-4 text-risk-amber" /> แนะนำให้พิจารณา
                  </h2>
                  <p className="mb-3 text-[12px] text-muted-foreground">
                    ครูประจำชั้นเป็นผู้ตัดสินใจเปิด case
                  </p>
                  <div className="space-y-2">
                    {suggestions.map((s) => {
                      const st = store.getStudent(s.studentId);
                      const selected =
                        selection.kind === "open" && selection.suggestionId === s.suggestionId;
                      return (
                        <div
                          key={s.suggestionId}
                          className={
                            selected
                              ? "rounded-xl border border-primary bg-accent p-3"
                              : "rounded-xl border border-border p-3"
                          }
                        >
                          <div className="text-[13px] font-semibold">{st?.fullName}</div>
                          <div className="mt-0.5 text-[12px] text-muted-foreground">
                            {CASE_TRIGGER_SOURCE_LABEL[s.source]}
                            {s.summary ? ` · ${s.summary}` : ""}
                          </div>
                          {store.canManageCase(s.studentId) && (
                            <div className="mt-2 flex gap-2">
                              <Button
                                size="xs"
                                onClick={() =>
                                  setSelection({ kind: "open", studentId: s.studentId, suggestionId: s.suggestionId })
                                }
                              >
                                เปิด case
                              </Button>
                              <Button size="xs" variant="ghost" onClick={() => store.dismissSuggestion(s.suggestionId)}>
                                ไม่ต้องเปิด
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="h-fit">
              <CardContent className="p-5">
                <h2 className="mb-3 text-[15px] font-bold">รายการ case</h2>
                <div className="space-y-2">
                  {pager.slice.map((c) => {
                    const s = store.getStudent(c.studentId);
                    const risk = store.overallRiskOf(c.studentId);
                    const selected = selection.kind === "case" && c.caseId === selection.caseId;
                    const noPlan = c.status === "active" && c.triggers.some((t) => !t.planId);
                    return (
                      <button
                        key={c.caseId}
                        onClick={() => setSelection({ kind: "case", caseId: c.caseId })}
                        className={
                          selected
                            ? "w-full rounded-xl border border-primary bg-accent p-3 text-left"
                            : "w-full rounded-xl border border-border p-3 text-left hover:bg-muted/50"
                        }
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13px] font-semibold">{s?.fullName}</span>
                          {risk && c.status === "active" && <RiskBadge group={risk} />}
                        </div>
                        <div className="mt-1 text-[12px] text-muted-foreground">
                          {c.caseId} ·{" "}
                          {c.status === "active"
                            ? "กำลังดำเนินการ"
                            : `ปิดแล้ว (${c.closeReason ? CASE_CLOSE_REASON_LABEL[c.closeReason] : "-"})`}{" "}
                          · ติดตาม {c.followups.length} ครั้ง
                        </div>
                        {noPlan && (
                          <div className="mt-1 text-[12px] font-medium text-risk-amber">มีเหตุที่ยังไม่มีแผนรองรับ</div>
                        )}
                        {c.status === "closed" && c.closedAt && (
                          <div className="mt-0.5 text-[11px] text-muted-foreground">
                            ปิดเมื่อ {formatThaiDate(c.closedAt)}
                          </div>
                        )}
                      </button>
                    );
                  })}
                  {visibleCases.length === 0 && (
                    <p className="text-sm text-muted-foreground">ยังไม่มี care case ที่คุณดูได้</p>
                  )}
                </div>

                <PagerNumbered
                  page={pager.page}
                  totalPages={pager.totalPages}
                  setPage={pager.setPage}
                  from={pager.from}
                  to={pager.to}
                  total={pager.total}
                  pageSize={pageSize}
                  onPageSize={(n) => {
                    setPageSize(n);
                    pager.reset();
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {selection.kind === "open" ? (
            <Card className="h-fit">
              <CardContent className="p-6">
                <OpenCaseForm
                  key={`${selection.studentId}-${selection.suggestionId ?? ""}`}
                  studentId={selection.studentId}
                  suggestion={openSuggestion}
                  onOpened={(c) => {
                    setPickStudent("");
                    setSelection({ kind: "case", caseId: c.caseId });
                  }}
                  onCancel={() =>
                    setSelection(visibleCases[0] ? { kind: "case", caseId: visibleCases[0].caseId } : { kind: "none" })
                  }
                />
              </CardContent>
            </Card>
          ) : selectedCase ? (
            <CaseDetail key={selectedCase.caseId} careCase={selectedCase} />
          ) : (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                ยังไม่มี care case ของนักเรียนคนนี้
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
