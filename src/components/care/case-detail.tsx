"use client";

import { useState } from "react";
import { CheckCircle2, FileText, Plus, Send } from "lucide-react";
import { WindowNotice } from "@/components/shared/window-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore } from "@/lib/store";
import { formatThaiDate, formatThaiDateTime } from "@/lib/format";
import {
  CARE_METHOD_LABEL,
  CASE_CLOSE_REASON_LABEL,
  CASE_TRIGGER_SOURCE_LABEL,
  SIGNATURE_STEP_LABEL,
  SUPPORT_TYPE_LABEL,
  type CareCase,
  type CarePlan,
  type ReferralDocument,
} from "@/lib/types";
import { ReferralChain, ReferralStatusChip, SignatureHistory } from "./referral-chain";
import { EMPTY_PLAN, isPlanDraftComplete, PlanFields, type PlanDraft } from "./plan-fields";

const selectClass = "h-9 rounded-lg border border-border bg-card px-2.5 text-[13px]";

const planLabel = (plans: CarePlan[], planId: string | null) => {
  const i = plans.findIndex((p) => p.planId === planId);
  return i < 0 ? null : `แผนที่ ${i + 1} · ${SUPPORT_TYPE_LABEL[plans[i].supportType]}`;
};

function BlockedNote({ reason }: { reason: string | null }) {
  if (!reason) return null;
  return <p className="text-[12.5px] text-muted-foreground">{reason}</p>;
}

export function CaseDetail({ careCase }: { careCase: CareCase }) {
  const store = useStore();
  const student = store.getStudent(careCase.studentId);
  const active = careCase.status === "active";
  const canManage = active && store.canManageCase(careCase.studentId);
  if (!student) return null;

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-bold">
                {careCase.caseId} · {student.fullName}
              </h2>
              <span
                className={
                  active
                    ? "rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary"
                    : "rounded-full bg-risk-green-bg px-2.5 py-1 text-xs font-semibold text-risk-green"
                }
              >
                {active ? "กำลังดำเนินการ" : "ปิด case แล้ว"}
              </span>
            </div>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              {student.roomName} เลขที่ {student.classNo} · เปิด case {formatThaiDate(careCase.openedAt)} โดย{" "}
              {careCase.openedBy ? store.nameOf(careCase.openedBy) : "ระบบ (เปิดอัตโนมัติ)"}
            </p>
            {!active && careCase.closedAt && (
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                ปิดเมื่อ {formatThaiDate(careCase.closedAt)} ·{" "}
                {careCase.closeReason ? CASE_CLOSE_REASON_LABEL[careCase.closeReason] : "-"} ·{" "}
                {careCase.closedBy ? store.nameOf(careCase.closedBy) : "ระบบปิดให้"}
              </p>
            )}
          </div>
          <div className="flex gap-6 text-right text-[13px]">
            <div>
              <div className="text-muted-foreground">แผน</div>
              <div className="text-[15px] font-semibold">{careCase.plans.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">ติดตามแล้ว</div>
              <div className="text-[15px] font-semibold">{careCase.followups.length} ครั้ง</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <TriggersCard careCase={careCase} canManage={canManage} />
        <PlansCard careCase={careCase} canManage={canManage} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <FollowupsCard careCase={careCase} />
        <ReferralsCard careCase={careCase} />
      </div>

      {active && <CloseBar careCase={careCase} />}
    </div>
  );
}

function TriggersCard({ careCase, canManage }: { careCase: CareCase; canManage: boolean }) {
  const store = useStore();
  const [adding, setAdding] = useState(false);
  const [summary, setSummary] = useState("");
  const unassigned = careCase.triggers.filter((t) => !t.planId).length;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h3 className="text-[15.5px] font-bold">เหตุเปิด case</h3>
          {canManage && !adding && (
            <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
              <Plus className="size-3.5" /> เพิ่มเหตุที่พบ
            </Button>
          )}
        </div>
        <p className="mb-3 text-[11.5px] text-muted-foreground">
          1 case มีได้หลายเหตุ เหตุใหม่ของนักเรียนคนเดิมเพิ่มเข้า case นี้
          {unassigned > 0 && ` · ยังไม่มีแผนรองรับ ${unassigned} เหตุ`}
        </p>

        {adding && (
          <div className="mb-4 space-y-2 rounded-xl bg-surface p-3.5">
            <Textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="เหตุที่ครูประจำชั้นพบเพิ่มเติม"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={!summary.trim()}
                onClick={() => {
                  if (store.addManualTrigger(careCase.caseId, summary).ok) {
                    setSummary("");
                    setAdding(false);
                  }
                }}
              >
                บันทึกเหตุ
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                ยกเลิก
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          {careCase.triggers.map((t) => {
            const label = planLabel(careCase.plans, t.planId);
            return (
              <div
                key={t.triggerId}
                className={
                  t.planId
                    ? "rounded-xl border border-border p-3"
                    : "rounded-xl border border-amber-200 bg-risk-amber-bg/40 p-3"
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[13.5px] font-semibold">{CASE_TRIGGER_SOURCE_LABEL[t.source]}</span>
                  <span className="text-[11.5px] text-muted-foreground">
                    {formatThaiDateTime(t.detectedAt)}
                    {t.sourceRefId ? ` · อ้างอิง ${t.sourceRefId}` : ""}
                  </span>
                </div>
                {t.summary && <p className="mt-0.5 text-[13px] text-muted-foreground">{t.summary}</p>}
                <div className="mt-2 flex items-center gap-2 text-[12.5px]">
                  <span className="text-muted-foreground">แผนที่รองรับ:</span>
                  {canManage && careCase.plans.length > 0 ? (
                    <select
                      aria-label="เลือกแผนที่รองรับเหตุนี้"
                      className={selectClass}
                      value={t.planId ?? ""}
                      onChange={(e) => e.target.value && store.assignTriggerToPlan(t.triggerId, e.target.value)}
                    >
                      {!t.planId && <option value="">ยังไม่มีแผนรองรับ</option>}
                      {careCase.plans.map((p, i) => (
                        <option key={p.planId} value={p.planId}>
                          แผนที่ {i + 1} · {SUPPORT_TYPE_LABEL[p.supportType]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={label ? "font-medium" : "font-medium text-risk-amber"}>
                      {label ?? "ยังไม่มีแผนรองรับ"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function PlansCard({ careCase, canManage }: { careCase: CareCase; canManage: boolean }) {
  const store = useStore();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<PlanDraft>(EMPTY_PLAN);
  const [triggerIds, setTriggerIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const unassigned = careCase.triggers.filter((t) => !t.planId);

  const startAdding = () => {
    setDraft(EMPTY_PLAN);
    setTriggerIds(unassigned.map((t) => t.triggerId));
    setError(null);
    setAdding(true);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-[15.5px] font-bold">แผนช่วยเหลือ</h3>
          {canManage && !adding && (
            <Button size="sm" variant="outline" onClick={startAdding}>
              <Plus className="size-3.5" /> จัดทำแผนใหม่
            </Button>
          )}
        </div>

        {adding && (
          <div className="mb-5 space-y-4 rounded-xl bg-surface p-4">
            <PlanFields value={draft} onChange={setDraft} idPrefix={`plan-${careCase.caseId}`} />
            {unassigned.length > 0 && (
              <div>
                <div className="mb-1 text-[13px] font-semibold">เหตุที่แผนนี้รองรับ</div>
                {unassigned.map((t) => (
                  <label
                    key={t.triggerId}
                    htmlFor={`pt-${t.triggerId}`}
                    className="flex cursor-pointer items-center gap-3 py-1"
                  >
                    <Checkbox
                      id={`pt-${t.triggerId}`}
                      checked={triggerIds.includes(t.triggerId)}
                      onCheckedChange={(c) =>
                        setTriggerIds((prev) =>
                          c === true ? [...prev, t.triggerId] : prev.filter((x) => x !== t.triggerId)
                        )
                      }
                    />
                    <span className="text-[13px]">
                      {CASE_TRIGGER_SOURCE_LABEL[t.source]}
                      {t.summary ? ` · ${t.summary}` : ""}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {error && <p className="text-[13px] text-risk-red">{error}</p>}
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={!isPlanDraftComplete(draft)}
                onClick={() => {
                  const res = store.addPlan(careCase.caseId, { ...draft, triggerIds });
                  if (!res.ok) setError(res.error);
                  else setAdding(false);
                }}
              >
                บันทึกแผน
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                ยกเลิก
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {careCase.plans.map((p, i) => (
            <div key={p.planId} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[14px] font-semibold">
                  แผนที่ {i + 1} · {SUPPORT_TYPE_LABEL[p.supportType]}
                </span>
                <span className="text-[11.5px] text-muted-foreground">
                  {store.nameOf(p.createdBy)} · {formatThaiDate(p.createdAt)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.careMethods.map((m) => (
                  <span key={m} className="rounded-md bg-accent px-2 py-0.5 text-[12px] text-primary">
                    {CARE_METHOD_LABEL[m]}
                  </span>
                ))}
              </div>
              <p className="mt-2.5 rounded-lg bg-surface p-3 text-[13.5px] leading-relaxed">{p.goal}</p>
              {p.targetDate && (
                <p className="mt-1.5 text-[12px] text-muted-foreground">
                  วันที่คาดว่าจะบรรลุเป้าหมาย: {formatThaiDate(p.targetDate)}
                </p>
              )}
            </div>
          ))}
          {careCase.plans.length === 0 && !adding && (
            <p className="text-sm text-muted-foreground">
              ยังไม่มีแผนช่วยเหลือ — ต้องจัดทำแผนก่อนจึงบันทึกการติดตามผลได้
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FollowupsCard({ careCase }: { careCase: CareCase }) {
  const store = useStore();
  const blocked = store.followupBlockReason(careCase.caseId);
  const [planId, setPlanId] = useState(() => careCase.plans[careCase.plans.length - 1]?.planId ?? "");
  const [action, setAction] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  // แผนที่เลือกไว้อาจหายไปเมื่อสลับ case — ใช้แผนล่าสุดแทน (คำนวณระหว่าง render)
  const effectivePlanId = careCase.plans.some((p) => p.planId === planId)
    ? planId
    : (careCase.plans[careCase.plans.length - 1]?.planId ?? "");
  const showForm = careCase.status === "active" && store.canManageCase(careCase.studentId);

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="mb-1 text-[15.5px] font-bold">ประวัติการช่วยเหลือและผลติดตาม</h3>
        <p className="mb-4 text-[11.5px] text-muted-foreground">บันทึกแล้วแก้ไขไม่ได้ เพิ่มบันทึกใหม่ได้อย่างเดียว</p>

        {showForm && (
          <div className="mb-5 space-y-2.5 rounded-xl bg-surface p-4">
            <WindowNotice activity="care_record" />
            <Label htmlFor="fu-action" className="text-[13px]">
              บันทึกการติดตามใหม่
            </Label>
            {careCase.plans.length > 0 && (
              <select
                aria-label="แผนที่ติดตามผล"
                className={`${selectClass} w-full`}
                value={effectivePlanId}
                disabled={!!blocked}
                onChange={(e) => setPlanId(e.target.value)}
              >
                {careCase.plans.map((p, i) => (
                  <option key={p.planId} value={p.planId}>
                    แผนที่ {i + 1} · {SUPPORT_TYPE_LABEL[p.supportType]}
                  </option>
                ))}
              </select>
            )}
            <Input
              id="fu-action"
              value={action}
              disabled={!!blocked}
              onChange={(e) => setAction(e.target.value)}
              placeholder="สิ่งที่ดำเนินการ เช่น ให้คำปรึกษารายบุคคล ครั้งที่ 3"
            />
            <Textarea
              value={result}
              disabled={!!blocked}
              onChange={(e) => setResult(e.target.value)}
              placeholder="ผลลัพธ์ที่สังเกตได้"
              rows={2}
            />
            <Button
              size="sm"
              disabled={!!blocked || !action.trim() || !effectivePlanId}
              onClick={() => {
                const res = store.addFollowup(careCase.caseId, effectivePlanId, action, result);
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                setError(null);
                setAction("");
                setResult("");
              }}
            >
              <Plus className="size-4" /> บันทึกการติดตาม
            </Button>
            <BlockedNote reason={blocked} />
            {error && <p className="text-[13px] text-risk-red">{error}</p>}
          </div>
        )}

        <div className="space-y-4">
          {careCase.followups.map((f, i) => (
            <div key={f.followupId} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="mt-1.5 size-2.5 rounded-full bg-primary" />
                {i < careCase.followups.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
              </div>
              <div className="flex-1 pb-3">
                <div className="text-[14px] font-semibold">{f.actionTaken}</div>
                <div className="mt-0.5 mb-1 text-[12px] text-muted-foreground">
                  {formatThaiDate(f.followupDate)} · {store.nameOf(f.recordedBy)}
                  {planLabel(careCase.plans, f.planId) ? ` · ${planLabel(careCase.plans, f.planId)}` : ""}
                </div>
                <p className="text-[13.5px] leading-relaxed text-muted-foreground">{f.result}</p>
              </div>
            </div>
          ))}
          {careCase.followups.length === 0 && (
            <p className="text-sm text-muted-foreground">ยังไม่มีบันทึกการติดตาม</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ReferralsCard({ careCase }: { careCase: CareCase }) {
  const store = useStore();
  const blocked = store.referralBlockReason(careCase.caseId);
  const [open, setOpen] = useState(false);
  const [agency, setAgency] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const showActions = careCase.status === "active" && store.canManageCase(careCase.studentId);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h3 className="text-[15.5px] font-bold">ส่งต่อหน่วยงานภายนอก</h3>
          {showActions && !open && (
            <Button size="sm" variant="outline" disabled={!!blocked} onClick={() => setOpen(true)}>
              <FileText className="size-3.5" /> จัดทำเอกสารส่งต่อภายนอก
            </Button>
          )}
        </div>
        <p className="mb-3 text-[11.5px] text-muted-foreground">
          ต้องได้รับความยินยอมของปีการศึกษานั้น และต้องผ่านสายการลงนามครบ (ผู้ปกครองลงนาม → ผู้บริหารอนุมัติ) จึงส่งต่อได้ ·
          การส่งต่อภายนอกไม่ทำให้ case ปิด
        </p>
        {showActions && <BlockedNote reason={blocked} />}

        {open && (
          <div className="my-3 space-y-2.5 rounded-xl bg-surface p-4">
            <Label htmlFor="ref-agency" className="text-[13px]">
              หน่วยงานภายนอก
            </Label>
            <Input
              id="ref-agency"
              value={agency}
              onChange={(e) => setAgency(e.target.value)}
              placeholder="เช่น โรงพยาบาลบางพลี (คลินิกสุขภาพจิตเด็กและวัยรุ่น)"
            />
            <Label htmlFor="ref-content" className="text-[13px]">
              เนื้อหาสรุปที่ส่งต่อ
            </Label>
            <Textarea id="ref-content" rows={4} value={content} onChange={(e) => setContent(e.target.value)} />
            {error && <p className="text-[13px] text-risk-red">{error}</p>}
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={!agency.trim() || !content.trim()}
                onClick={() => {
                  const res = store.createReferral(careCase.caseId, agency, content);
                  if (!res.ok) {
                    setError(res.error);
                    return;
                  }
                  setAgency("");
                  setContent("");
                  setError(null);
                  setOpen(false);
                }}
              >
                บันทึกเอกสารส่งต่อ
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                ยกเลิก
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          {careCase.referrals.map((r) => (
            <ReferralRow key={r.referralId} referral={r} canManage={showActions} />
          ))}
          {careCase.referrals.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีการส่งต่อภายนอก</p>}
        </div>
      </CardContent>
    </Card>
  );
}

/** เอกสารส่งต่อ 1 ฉบับ พร้อมสายการลงนามและปุ่มของครูประจำชั้น */
function ReferralRow({ referral, canManage }: { referral: ReferralDocument; canManage: boolean }) {
  const store = useStore();
  const [prompt, setPrompt] = useState<null | "void_request" | "void_referral">(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const pending = store.pendingSignatureOf(referral.referralId);
  const requestBlocked = store.requestSignatureBlockReason(referral.referralId);
  const sendBlocked = store.sendReferralBlockReason(referral.referralId);

  const run = (res: { ok: true } | { ok: false; error: string }) => {
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setError(null);
    setReason("");
    setPrompt(null);
  };

  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13.5px] font-semibold">{referral.externalAgency}</span>
        <ReferralStatusChip referral={referral} />
      </div>
      <div className="mt-0.5 text-[11.5px] text-muted-foreground">
        {referral.referralId} · จัดทำโดย {store.nameOf(referral.createdBy)} · {formatThaiDate(referral.createdAt)}
        {referral.sentAt && ` · ส่งเมื่อ ${formatThaiDate(referral.sentAt)} โดย ${store.nameOf(referral.sentBy)}`}
      </div>
      <p className="mt-1.5 text-[13px] whitespace-pre-line text-muted-foreground">{referral.content}</p>
      {referral.status === "voided" && referral.voidReason && (
        <p className="mt-1.5 text-[12.5px] text-risk-red">
          ยกเลิกเอกสารโดย {store.nameOf(referral.voidedBy)} · เหตุผล: {referral.voidReason}
        </p>
      )}

      <div className="mt-3 border-t border-border pt-3">
        <ReferralChain referral={referral} />
        <SignatureHistory referralId={referral.referralId} />
      </div>

      {canManage && referral.status !== "voided" && referral.status !== "sent" && (
        <div className="mt-3 space-y-1.5">
          {prompt ? (
            <div className="space-y-2 rounded-lg bg-surface p-3">
              <Label htmlFor={`vr-${referral.referralId}`} className="text-[12.5px]">
                {prompt === "void_request" ? "เหตุผลที่ยกเลิกคำขอลงนาม" : "เหตุผลที่ยกเลิกเอกสารส่งต่อ"}
              </Label>
              <Input
                id={`vr-${referral.referralId}`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="เช่น แก้ไขเนื้อหาที่ส่งต่อใหม่"
              />
              <p className="text-[11.5px] text-muted-foreground">
                ระบบไม่ลบรายการใด ๆ — คำขอและเอกสารที่ยกเลิกยังอยู่ในประวัติพร้อมเหตุผล
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={!reason.trim()}
                  onClick={() =>
                    run(
                      prompt === "void_request" && pending
                        ? store.voidSignatureRequest(pending.requestId, reason)
                        : store.voidReferral(referral.referralId, reason)
                    )
                  }
                >
                  ยืนยันการยกเลิก
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPrompt(null)}>
                  ปิด
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {referral.status === "draft" && (
                <Button
                  size="xs"
                  disabled={!!requestBlocked}
                  onClick={() => run(store.requestGuardianSignature(referral.referralId))}
                >
                  <Send className="size-3.5" /> ขอลายมือชื่อผู้ปกครอง
                </Button>
              )}
              {referral.status === "approved" && (
                <Button
                  size="xs"
                  disabled={!!sendBlocked}
                  onClick={() => run(store.sendReferral(referral.referralId))}
                >
                  <Send className="size-3.5" /> ส่งเอกสารให้หน่วยงานภายนอก
                </Button>
              )}
              {pending && (
                <Button size="xs" variant="outline" onClick={() => setPrompt("void_request")}>
                  ยกเลิกคำขอลงนาม
                </Button>
              )}
              <Button size="xs" variant="ghost" onClick={() => setPrompt("void_referral")}>
                ยกเลิกเอกสาร
              </Button>
            </div>
          )}
          {referral.status === "draft" && <BlockedNote reason={requestBlocked} />}
          {referral.status !== "draft" && referral.status !== "approved" && pending && (
            <p className="text-[12.5px] text-muted-foreground">
              รอ{SIGNATURE_STEP_LABEL[pending.step]} · ขอเมื่อ {formatThaiDate(pending.requestedAt)}
            </p>
          )}
          {referral.status === "approved" && <BlockedNote reason={sendBlocked} />}
          {error && <p className="text-[13px] text-risk-red">{error}</p>}
        </div>
      )}
    </div>
  );
}

function CloseBar({ careCase }: { careCase: CareCase }) {
  const store = useStore();
  const blocked = store.closeBlockReason(careCase.caseId);
  const [confirming, setConfirming] = useState(false);
  const show = store.canManageCase(careCase.studentId);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
      <p className="text-[13px] text-muted-foreground">
        ทุกการเปลี่ยนแปลงถูกบันทึกใน audit log · นักเรียนย้ายออกหรือจบการศึกษา ระบบปิด case ให้เอง
      </p>
      {show && (
        <div className="flex flex-col items-end gap-1">
          {confirming ? (
            <div className="flex items-center gap-2">
              <span className="text-[13px]">ยืนยันปิด case นี้? ปิดแล้วบันทึกเพิ่มไม่ได้</span>
              <Button
                onClick={() => {
                  store.closeCase(careCase.caseId);
                  setConfirming(false);
                }}
              >
                ยืนยันปิด case
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                ยกเลิก
              </Button>
            </div>
          ) : (
            <Button disabled={!!blocked} onClick={() => setConfirming(true)}>
              <CheckCircle2 className="size-4" /> ปิด case (ช่วยเหลือสำเร็จ)
            </Button>
          )}
          <BlockedNote reason={blocked && blocked !== "case นี้ปิดแล้ว" ? blocked : null} />
        </div>
      )}
    </div>
  );
}
