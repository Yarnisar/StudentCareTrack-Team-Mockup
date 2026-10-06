"use client";

import { useState } from "react";
import { Maximize2, ShieldCheck, X } from "lucide-react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { QrSvg } from "@/components/cards/qr-svg";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SCHOOL_NAME } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { usePortalStudent } from "@/lib/portal";
import { formatThaiDate, formatThaiTime } from "@/lib/format";

/** บัตรนักเรียนดิจิทัล — QR เป็นรหัสอ้างอิงแบบสุ่มของบัตรที่ใช้งานได้ ไม่ใช่รหัสนักเรียน */
export default function StudentCardPage() {
  const store = useStore();
  const portalStudentId = usePortalStudent().studentId ?? "";
  const student = store.getStudent(portalStudentId);
  const card = store.activeCardOfStudent(portalStudentId);
  const status = store.cardStatusOfStudent(portalStudentId);
  const history = store.checkins.filter((c) => c.studentId === portalStudentId).slice(0, 3);
  const [enlarged, setEnlarged] = useState(false);

  if (!student) return null;

  return (
    <MobileShell title="บัตรนักเรียน" subtitle="สำหรับเช็คอินเข้าโรงเรียน" role="student" brand>
      <div className="space-y-4 p-5">
        <div className="relative overflow-hidden rounded-2xl bg-primary p-5">
          <div className="absolute -top-10 -right-8 size-36 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-white/20 text-[11px] font-bold text-white">
              SC
            </div>
            <span className="text-xs font-semibold text-blue-100">{SCHOOL_NAME}</span>
          </div>
          <div className="relative mt-4">
            <div className="text-[16.5px] font-bold text-white">{student.fullName}</div>
            <div className="mt-1 text-[12.5px] text-blue-100">
              {student.roomName} เลขที่ {student.classNo} · รหัส {student.studentId}
            </div>
          </div>
          {card && (
            <div className="relative mt-3 text-[12px] text-blue-100">
              ใช้ได้ถึง {formatThaiDate(store.cardTemplate.expiresOn)}
            </div>
          )}
        </div>

        <Card>
          <CardContent className="flex flex-col items-center p-6">
            {card ? (
              <>
                <div className="rounded-2xl border border-border bg-white p-3">
                  <QrSvg value={card.qrCode} size={176} title="รหัส QR บัตรนักเรียนของฉัน" />
                </div>
                <p className="mt-4 text-[15px] font-semibold">แสดง QR นี้ให้ครูสแกน</p>
                <p className="mt-1.5 text-center text-[12.5px] leading-relaxed text-muted-foreground">
                  ระบบจะบันทึกชื่อและเวลาเข้าโรงเรียนอัตโนมัติ
                </p>
                <Button className="mt-4 w-full" onClick={() => setEnlarged(true)}>
                  <Maximize2 className="size-4" /> ขยาย QR สำหรับสแกน
                </Button>
                <div className="mt-4 flex items-center gap-2 rounded-full bg-surface px-4 py-2">
                  <span className="size-1.5 rounded-full bg-risk-green" />
                  <span className="text-[12px] font-medium text-muted-foreground">
                    บัตรใช้งานได้ · ออกบัตรเมื่อ {formatThaiDate(card.issuedAt)}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="text-[15px] font-semibold">
                  {status === "revoked"
                    ? "บัตรถูกเพิกถอนแล้ว"
                    : status === "expired"
                      ? "บัตรหมดอายุ"
                      : "ยังไม่มีบัตรนักเรียน"}
                </p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                  ติดต่อห้องกิจการนักเรียนเพื่อออกบัตรใหม่ ระหว่างนี้ให้ครูบันทึกการมาเรียนด้วยตนเอง
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2 rounded-xl bg-surface px-4 py-3 text-[12.5px] text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0" />
          <span>
            รหัสใน QR เป็นรหัสอ้างอิงแบบสุ่มที่เพิกถอนได้ ไม่มีชื่อ รหัสนักเรียน
            หรือข้อมูลส่วนตัวอยู่ในรหัส
          </span>
        </div>

        <Card>
          <CardContent className="p-5">
            <h2 className="mb-2 text-sm font-bold">ประวัติเช็คอินล่าสุด</h2>
            <div className="divide-y divide-border">
              {history.map((log) => (
                <div key={log.logId} className="flex items-center justify-between py-2.5">
                  <span className="text-[13px] text-muted-foreground">
                    {formatThaiDate(log.scannedAt)}
                  </span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[13.5px] font-semibold">
                      {formatThaiTime(log.scannedAt).replace(" น.", "")}
                    </span>
                    <span
                      className={
                        log.isLate
                          ? "rounded-full bg-risk-amber-bg px-2.5 py-1 text-[11.5px] font-semibold text-risk-amber"
                          : "rounded-full bg-risk-green-bg px-2.5 py-1 text-[11.5px] font-semibold text-risk-green"
                      }
                    >
                      {log.isLate ? "สาย" : "ตรงเวลา"}
                    </span>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <p className="py-3 text-[13px] text-muted-foreground">ยังไม่มีประวัติเช็คอิน</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {enlarged && card && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black/80 p-6">
          <div className="rounded-2xl bg-white p-4">
            <QrSvg value={card.qrCode} size={280} title="รหัส QR บัตรนักเรียนของฉัน (ขยาย)" />
          </div>
          <p className="text-center text-[13.5px] text-white">
            {student.fullName} · {student.roomName}
          </p>
          <Button variant="secondary" onClick={() => setEnlarged(false)}>
            <X className="size-4" /> ปิด
          </Button>
        </div>
      )}
    </MobileShell>
  );
}
