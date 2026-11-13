"use client";

/** โปรไฟล์นักเรียน: ข้อมูลทะเบียนของตนเอง (UC3 ข้อ 4) และการออกจากระบบ */

import Link from "next/link";
import { LogOut } from "lucide-react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { RegistryInfo } from "@/components/portal/personal-info";
import { Card, CardContent } from "@/components/ui/card";
import { PORTAL_STUDENT_ID } from "@/lib/mock-data";
import { ROLE_INFO } from "@/lib/roles";
import { useStore } from "@/lib/store";

export default function StudentProfilePage() {
  const student = useStore().getStudent(PORTAL_STUDENT_ID);
  if (!student) return null;
  const initial = student.fullName.replace(/^(ด\.ช\.|ด\.ญ\.|นาย|นางสาว|นาง)\s*/, "").charAt(0);

  return (
    <MobileShell title="โปรไฟล์" role="student" brand>
      <div className="space-y-4 p-5">
        <div className="flex items-center gap-4">
          <div
            aria-hidden
            className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent text-[24px] font-bold text-primary"
          >
            {initial}
          </div>
          <div className="min-w-0">
            <div className="text-[17px] leading-snug font-bold">{student.fullName}</div>
            <div className="mt-0.5 text-[12.5px] text-muted-foreground">
              {ROLE_INFO.student.user.title} · เลขที่ {student.classNo}
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-5">
            <RegistryInfo studentId={PORTAL_STUDENT_ID} />
          </CardContent>
        </Card>

        <Link
          href="/login"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-[14px] font-medium"
        >
          <LogOut className="size-4" />
          ออกจากระบบ
        </Link>
      </div>
    </MobileShell>
  );
}
