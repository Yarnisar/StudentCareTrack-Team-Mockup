"use client";

/**
 * แถบสายการลงนามของเอกสารส่งต่อ และประวัติคำขอลงนาม
 * จัดทำร่าง → ผู้ปกครองลงนาม → ผู้ดูแลระบบอนุมัติ → ส่งต่อได้
 * ใช้ซ้ำในหน้า case ของครู คิวอนุมัติของผู้ดูแลระบบ และหน้าลงนามของผู้ปกครอง
 */

import { Check, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatThaiDateTime } from "@/lib/format";
import {
  REFERRAL_CHAIN_STEPS,
  REFERRAL_STATUS_LABEL,
  SIGNATURE_REQUEST_STATUS_LABEL,
  SIGNATURE_STEP_LABEL,
  type ReferralDocument,
  type SignatureRequest,
} from "@/lib/types";

/** ลำดับขั้นที่ทำสำเร็จแล้ว (0 = ร่างเท่านั้น) */
function completedSteps(referral: ReferralDocument): number {
  switch (referral.status) {
    case "sent":
      return 4;
    case "approved":
      return 3;
    case "awaiting_executive":
      return 2;
    case "awaiting_guardian":
      return 1;
    default:
      return 1; // ร่าง (รวมเอกสารที่ถูกยกเลิก — แสดงสถานะยกเลิกแยกต่างหาก)
  }
}

export function ReferralStatusChip({ referral }: { referral: ReferralDocument }) {
  const tone =
    referral.status === "sent"
      ? "bg-risk-green-bg text-risk-green"
      : referral.status === "voided"
        ? "bg-muted text-muted-foreground"
        : referral.status === "approved"
          ? "bg-accent text-primary"
          : "bg-risk-amber-bg text-risk-amber";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${tone}`}>
      {REFERRAL_STATUS_LABEL[referral.status]}
    </span>
  );
}

export function ReferralChain({ referral }: { referral: ReferralDocument }) {
  const store = useStore();
  const done = completedSteps(referral);
  // ร่างที่ถูกตีกลับเพราะผู้ลงนามปฏิเสธ — คำขอล่าสุดเป็น declined (เหตุผลอยู่ในประวัติการลงนาม)
  const requests = store.signatureRequestsOf(referral.referralId);
  const latest = requests[requests.length - 1];
  const declinedStep =
    referral.status === "draft" && latest?.status === "declined" ? latest.step : null;
  const declinedIndex = declinedStep ? REFERRAL_CHAIN_STEPS.findIndex((s) => s.key === (declinedStep === "guardian" ? "awaiting_guardian" : "awaiting_executive")) : -1;

  return (
    <div>
      <ol className="flex flex-wrap gap-1.5" aria-label="สายการลงนามเอกสารส่งต่อ">
        {REFERRAL_CHAIN_STEPS.map((step, i) => {
          if (i === declinedIndex) {
            return (
              <li
                key={step.key}
                className="flex items-center gap-1 rounded-lg bg-risk-red-bg px-2.5 py-1.5 text-[12px] font-semibold text-risk-red"
              >
                <X className="size-3.5" />
                {i + 1}. {step.label} · {declinedStep === "guardian" ? "ไม่ลงนาม" : "ไม่อนุมัติ"}
              </li>
            );
          }
          const complete = declinedIndex >= 0 ? i < declinedIndex : i < done;
          const current = declinedIndex < 0 && i === done && referral.status !== "voided";
          return (
            <li
              key={step.key}
              className={
                complete
                  ? "flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1.5 text-[12px] font-semibold text-primary"
                  : current
                    ? "flex items-center gap-1 rounded-lg bg-risk-amber-bg px-2.5 py-1.5 text-[12px] font-semibold text-risk-amber"
                    : "flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1.5 text-[12px] text-muted-foreground"
              }
            >
              {complete && <Check className="size-3.5" />}
              {i + 1}. {step.label}
            </li>
          );
        })}
      </ol>
      {declinedStep && (
        <p className="mt-1.5 text-[12px] font-semibold text-risk-red">
          ตีกลับเป็นร่าง — แก้ไขแล้วส่งขอลงนามใหม่ (เหตุผลอยู่ในประวัติ)
        </p>
      )}
    </div>
  );
}

/** ประวัติคำขอลงนามของเอกสาร 1 ฉบับ (คำขอที่ถูกปฏิเสธ/ยกเลิกยังอยู่ในประวัติเสมอ) */
export function SignatureHistory({ referralId }: { referralId: string }) {
  const store = useStore();
  const requests = store.signatureRequestsOf(referralId);
  if (requests.length === 0) return null;

  return (
    <ul className="mt-2.5 space-y-1.5">
      {requests.map((r) => (
        <li key={r.requestId} className="text-[12px] text-muted-foreground">
          <span className="font-semibold text-foreground">{SIGNATURE_STEP_LABEL[r.step]}</span> ·{" "}
          {SIGNATURE_REQUEST_STATUS_LABEL[r.status]} · ขอเมื่อ {formatThaiDateTime(r.requestedAt)} โดย{" "}
          {store.nameOf(r.requestedBy)}
          {signatureOutcome(r, store.nameOf)}
        </li>
      ))}
    </ul>
  );
}

function signatureOutcome(r: SignatureRequest, nameOf: (id: string | null) => string): string {
  if (r.status === "signed" && r.signedAt)
    return ` · ลงนาม ${formatThaiDateTime(r.signedAt)} โดย ${nameOf(r.signerUserId)}`;
  if (r.status === "declined")
    return ` · ปฏิเสธ ${r.declinedAt ? formatThaiDateTime(r.declinedAt) : ""} โดย ${nameOf(r.signerUserId)} · เหตุผล: ${r.declineReason ?? "-"}`;
  if (r.status === "voided")
    return ` · ยกเลิกคำขอ ${r.voidedAt ? formatThaiDateTime(r.voidedAt) : ""} โดย ${nameOf(r.voidedBy)} · เหตุผล: ${r.voidReason ?? "-"}`;
  return "";
}
