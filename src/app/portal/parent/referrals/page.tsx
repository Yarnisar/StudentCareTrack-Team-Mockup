"use client";

/**
 * หน้าลงนามเอกสารส่งต่อของผู้ปกครอง
 * ผู้ปกครองคนใดของนักเรียนก็ลงนามได้ (สิทธิ์เท่ากัน) ลงนามแล้วเอกสารไปรอผู้ดูแลระบบอนุมัติต่อ
 * ไม่ลงนามได้ โดยต้องระบุเหตุผล — เอกสารจะกลับไปเป็นร่างให้ครูประจำชั้นแก้ไข
 */

import { useState } from "react";
import { FileSignature, ShieldCheck } from "lucide-react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { ReferralChain, ReferralStatusChip, SignatureHistory } from "@/components/care/referral-chain";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { useDemoPageTool } from "@/lib/demo/page-tools";
import { formatThaiDate } from "@/lib/format";
import type { ReferralEntry } from "@/lib/store";

export default function ParentReferralsPage() {
  const store = useStore();
  const pending = store.myPendingSignatures;
  const others = store.visibleReferrals.filter(
    (e) => !pending.some((p) => p.referral.referralId === e.referral.referralId)
  );

  return (
    <MobileShell
      title="เอกสารส่งต่อหน่วยงานภายนอก"
      subtitle="ตรวจและลงนาม"
      role="parent"
      back="/portal/parent"
    >
      <div className="space-y-4 p-5">
        <div className="flex gap-2 px-1 text-[12px] text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0" />
          <p>ส่งข้อมูลได้เมื่อมีความยินยอม ผู้ปกครองลงนาม และผู้ดูแลระบบอนุมัติ</p>
        </div>

        {pending.map((entry) => (
          <SignCard key={entry.referral.referralId} entry={entry} />
        ))}
        {pending.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-[13px] text-muted-foreground">
              ไม่มีเอกสารรอลงนาม
            </CardContent>
          </Card>
        )}

        {others.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h2 className="mb-2 text-[15px] font-bold">เอกสารอื่น</h2>
              <ul className="space-y-3">
                {others.map(({ referral, studentId }) => (
                  <li key={referral.referralId} className="rounded-xl border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold">{store.getStudent(studentId)?.fullName}</span>
                      <ReferralStatusChip referral={referral} />
                    </div>
                    <div className="mt-0.5 text-[12px] text-muted-foreground">
                      {referral.externalAgency} · จัดทำ {formatThaiDate(referral.createdAt)}
                    </div>
                    <SignatureHistory referralId={referral.referralId} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </MobileShell>
  );
}

function SignCard({ entry }: { entry: ReferralEntry }) {
  const store = useStore();
  const { referral, studentId, pending } = entry;
  const student = store.getStudent(studentId);
  const [read, setRead] = useState(false);
  const [name, setName] = useState("");
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useDemoPageTool(
    "กรอกอัตโนมัติ · เตรียมลงนาม",
    () => {
      setRead(true);
      setName(store.currentUser.name);
    },
    "ติ๊กยืนยันว่าอ่านแล้วและใส่ชื่อผู้ลงนาม"
  );

  useDemoPageTool(
    "จำลอง: ผู้ปกครองไม่ลงนาม",
    () => {
      if (!pending) return;
      store.declineSignatureRequest(pending.requestId, "ขอปรึกษาครอบครัวก่อนตัดสินใจ จึงยังไม่ลงนามในหนังสือส่งต่อ");
    },
    "ให้ผู้ปกครองที่กำลังลงนามปฏิเสธคำขอด้วยเหตุผลตัวอย่าง — เอกสารกลับเป็นร่าง ขั้นตอนเป็นสีแดง และครูประจำชั้นได้รับแจ้งเตือน"
  );

  if (!pending || !student) return null;
  const blocked = store.signBlockReason(pending.requestId);
  const nameOk = name.trim().length > 0;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[15px] font-bold">หนังสือส่งต่อของ {student.fullName}</h2>
          <ReferralStatusChip referral={referral} />
        </div>
        <p className="text-[12px] text-muted-foreground">
          ส่งถึง {referral.externalAgency} · {formatThaiDate(referral.createdAt)}
        </p>

        <ReferralChain referral={referral} />

        <div>
          <div className="mb-1 text-[13px] font-semibold">เนื้อหาที่จะส่ง</div>
          <p className="rounded-xl bg-surface p-3.5 text-[13px] leading-relaxed whitespace-pre-line">
            {referral.content}
          </p>
        </div>

        {declining ? (
          <div className="space-y-2 rounded-xl bg-surface p-3.5">
            <Label htmlFor={`dr-${referral.referralId}`} className="text-[13px]">
              เหตุผลที่ไม่ลงนาม
            </Label>
            <Input
              id={`dr-${referral.referralId}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="เช่น ขอปรึกษาครูประจำชั้นก่อน"
            />
            <div className="flex gap-2">
              <Button
                className="h-11 flex-1"
                disabled={!reason.trim()}
                onClick={() => {
                  const res = store.declineSignatureRequest(pending.requestId, reason);
                  if (!res.ok) setError(res.error);
                  else {
                    setDeclining(false);
                    setReason("");
                    setError(null);
                  }
                }}
              >
                ยืนยันไม่ลงนาม
              </Button>
              <Button variant="outline" className="h-11 flex-1" onClick={() => setDeclining(false)}>
                กลับ
              </Button>
            </div>
          </div>
        ) : (
          <>
            <label htmlFor={`rd-${referral.referralId}`} className="flex cursor-pointer items-start gap-3 py-1">
              <Checkbox
                id={`rd-${referral.referralId}`}
                checked={read}
                onCheckedChange={(c) => setRead(c === true)}
              />
              <span className="text-[13px] leading-relaxed">
                ข้าพเจ้าได้อ่านเนื้อหาที่จะส่งต่อแล้ว และยินยอมให้โรงเรียนส่งข้อมูลนี้ให้หน่วยงานข้างต้น
              </span>
            </label>
            <div>
              <Label htmlFor={`sn-${referral.referralId}`} className="text-[13px]">
                ชื่อผู้ลงนาม
              </Label>
              <Input
                id={`sn-${referral.referralId}`}
                className="mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={store.currentUser.name}
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="h-11 flex-1"
                disabled={!read || !nameOk || !!blocked}
                onClick={() => {
                  const res = store.signSignatureRequest(pending.requestId);
                  if (!res.ok) setError(res.error);
                  else setError(null);
                }}
              >
                <FileSignature className="size-4" /> ลงนาม
              </Button>
              <Button variant="outline" className="h-11 flex-1" onClick={() => setDeclining(true)}>
                ไม่ลงนาม
              </Button>
            </div>
          </>
        )}
        {blocked && <p className="text-[12px] text-muted-foreground">{blocked}</p>}
        {error && <p className="text-[12px] font-semibold text-risk-red">{error}</p>}
      </CardContent>
    </Card>
  );
}
