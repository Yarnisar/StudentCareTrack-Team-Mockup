"use client";

/**
 * คิวอนุมัติเอกสารส่งต่อของผู้ดูแลระบบ (admin_school)
 * ขั้นสุดท้ายของสายการลงนาม: ผู้ปกครองลงนามแล้ว → ผู้ดูแลระบบอนุมัติ → ครูประจำชั้นจึงส่งต่อได้
 * การเปิดดูเนื้อหาเอกสารถือเป็นการเปิดข้อมูลอ่อนไหว ระบบบันทึกไว้ทุกครั้ง
 */

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ReferralChain, ReferralStatusChip, SignatureHistory } from "@/components/care/referral-chain";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { formatThaiDate, formatThaiDateTime } from "@/lib/format";
import { REFERRAL_STATUS_LABEL } from "@/lib/types";
import type { ReferralEntry } from "@/lib/store";

export default function ApprovalsPage() {
  const store = useStore();
  const isExecutive = store.currentUser.role === "admin_school";
  const queue = isExecutive ? store.myPendingSignatures : [];
  const handled = store.visibleReferrals.filter(
    (e) => e.referral.status === "approved" || e.referral.status === "sent"
  );

  return (
    <>
      <PageHeader
        title="อนุมัติเอกสารส่งต่อ"
        subtitle="เอกสารส่งต่อหน่วยงานภายนอกที่ผู้ปกครองลงนามแล้วและรอการอนุมัติ"
      />
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {!isExecutive ? (
          <Card>
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              หน้านี้สำหรับผู้ดูแลระบบเท่านั้น
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            <Card>
              <CardContent className="p-5">
                <h2 className="text-[15.5px] font-bold">รออนุมัติ {queue.length} ฉบับ</h2>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  อนุมัติแล้วครูประจำชั้นจึงส่งเอกสารให้หน่วยงานภายนอกได้ · ถ้าไม่อนุมัติ ต้องระบุเหตุผล
                  และเอกสารจะกลับไปเป็นร่างให้ครูแก้ไข
                </p>
              </CardContent>
            </Card>

            {queue.map((entry) => (
              <ApprovalCard key={entry.referral.referralId} entry={entry} />
            ))}
            {queue.length === 0 && (
              <Card>
                <CardContent className="p-10 text-center text-sm text-muted-foreground">
                  ไม่มีเอกสารส่งต่อที่รออนุมัติ
                </CardContent>
              </Card>
            )}

            {handled.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <h2 className="mb-2 text-[15.5px] font-bold">เอกสารที่อนุมัติแล้ว</h2>
                  <ul className="space-y-2">
                    {handled.map(({ referral, studentId }) => (
                      <li key={referral.referralId} className="rounded-xl border border-border p-3 text-[13px]">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold">
                            {store.getStudent(studentId)?.fullName} · {referral.externalAgency}
                          </span>
                          <span className="text-[11.5px] text-muted-foreground">
                            {referral.referralId} · {REFERRAL_STATUS_LABEL[referral.status]}
                            {referral.sentAt ? ` · ส่งเมื่อ ${formatThaiDate(referral.sentAt)}` : ""}
                          </span>
                        </div>
                        <SignatureHistory referralId={referral.referralId} />
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function ApprovalCard({ entry }: { entry: ReferralEntry }) {
  const store = useStore();
  const { referral, careCase, studentId, pending } = entry;
  const student = store.getStudent(studentId);
  const [showContent, setShowContent] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (!pending || !student) return null;

  const openContent = () => {
    setShowContent(true);
    store.logSensitiveView("referral_documents", referral.referralId, {
      always: true,
      note: "เปิดดูเนื้อหาเอกสารส่งต่อเพื่ออนุมัติ",
    });
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[15.5px] font-bold">
            {student.fullName} · {student.roomName}
          </h3>
          <ReferralStatusChip referral={referral} />
        </div>
        <p className="text-[12.5px] text-muted-foreground">
          {referral.referralId} · {careCase.caseId} · หน่วยงาน {referral.externalAgency} · จัดทำโดย{" "}
          {store.nameOf(referral.createdBy)} {formatThaiDate(referral.createdAt)} · ความยินยอมของผู้ปกครองปีนี้:{" "}
          {store.consentStatusOf(studentId) === "granted" ? "ยินยอม" : "ยังไม่ได้รับความยินยอม"}
        </p>

        <ReferralChain referral={referral} />
        <SignatureHistory referralId={referral.referralId} />

        {showContent ? (
          <p className="rounded-xl bg-surface p-3.5 text-[13.5px] leading-relaxed whitespace-pre-line">
            {referral.content}
          </p>
        ) : (
          <Button size="sm" variant="outline" onClick={openContent}>
            ดูเนื้อหาเอกสาร (ระบบบันทึกการเปิดดู)
          </Button>
        )}

        <p className="text-[11.5px] text-muted-foreground">
          ขออนุมัติเมื่อ {formatThaiDateTime(pending.requestedAt)}
        </p>

        {declining ? (
          <div className="space-y-2 rounded-xl bg-surface p-3.5">
            <Label htmlFor={`dc-${referral.referralId}`} className="text-[13px]">
              เหตุผลที่ไม่อนุมัติ
            </Label>
            <Input
              id={`dc-${referral.referralId}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="เช่น ข้อมูลยังไม่ครบ ขอให้แนบผลการช่วยเหลือที่ผ่านมา"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={!reason.trim()}
                onClick={() => {
                  const res = store.declineSignatureRequest(pending.requestId, reason);
                  if (!res.ok) setError(res.error);
                  else {
                    setReason("");
                    setDeclining(false);
                    setError(null);
                  }
                }}
              >
                ยืนยันไม่อนุมัติ
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDeclining(false)}>
                กลับ
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!!store.signBlockReason(pending.requestId)}
              onClick={() => {
                const res = store.signSignatureRequest(pending.requestId);
                if (!res.ok) setError(res.error);
              }}
            >
              <ShieldCheck className="size-4" /> อนุมัติให้ส่งต่อ
            </Button>
            <Button variant="outline" onClick={() => setDeclining(true)}>
              ไม่อนุมัติ
            </Button>
          </div>
        )}
        {store.signBlockReason(pending.requestId) && (
          <p className="text-[12.5px] text-muted-foreground">{store.signBlockReason(pending.requestId)}</p>
        )}
        {error && <p className="text-[13px] text-risk-red">{error}</p>}
      </CardContent>
    </Card>
  );
}
