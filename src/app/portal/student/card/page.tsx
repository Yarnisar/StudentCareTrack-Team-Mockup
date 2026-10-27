"use client";

import { QrCode } from "lucide-react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { SCHOOL_NAME } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

/** ต้นแบบ: ผู้ใช้ที่ล็อกอินคือนักเรียนคนแรกในระบบ */
const DEMO_STUDENT_ID = "30125";

export default function StudentCardPage() {
  const store = useStore();
  const student = store.getStudent(DEMO_STUDENT_ID);

  if (!student) return null;

  return (
    <MobileShell title="บัตรนักเรียน" subtitle="แสดงให้ครูสแกนเมื่อบันทึกพฤติกรรม" role="student" brand>
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
        </div>

        <Card>
          <CardContent className="flex flex-col items-center p-6">
            <div className="rounded-2xl border border-border p-4">
              <QrCode className="size-44" strokeWidth={1.1} />
            </div>
            <p className="mt-4 text-[15px] font-semibold">แสดง QR นี้ให้ครูสแกน</p>
            <p className="mt-1.5 text-center text-[12.5px] leading-relaxed text-muted-foreground">
              ครูใช้สแกนเพื่อเลือกชื่อของเราตอนบันทึกพฤติกรรม
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-full bg-surface px-4 py-2">
              <span className="size-1.5 rounded-full bg-risk-green" />
              <span className="text-[12px] font-medium text-muted-foreground">
                รหัสใช้งานได้ · รีเฟรชอัตโนมัติทุก 60 วินาที
              </span>
            </div>
          </CardContent>
        </Card>

      </div>
    </MobileShell>
  );
}
