"use client";

/** โปรไฟล์ผู้ปกครอง: ข้อมูลของผู้ปกครองเอง บุตรหลานที่เชื่อมบัญชี และการออกจากระบบ */

import Link from "next/link";
import { LogOut } from "lucide-react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { PARENT_CHILDREN } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

export default function ParentProfilePage() {
  const store = useStore();
  const children = PARENT_CHILDREN.map((id) => store.getStudent(id)).filter((s) => !!s);
  const first = children[0];
  const name = first?.guardianName ?? "";
  const initial = name.replace(/^(นางสาว|นาง|นาย)\s*/, "").charAt(0);

  return (
    <MobileShell title="โปรไฟล์" role="parent" brand>
      <div className="space-y-4 p-5">
        <div className="flex items-center gap-4">
          <div
            aria-hidden
            className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent text-[24px] font-bold text-primary"
          >
            {initial}
          </div>
          <div className="min-w-0">
            <div className="text-[17px] leading-snug font-bold">{name || "ผู้ปกครอง"}</div>
            {first && <div className="mt-0.5 text-[12.5px] text-muted-foreground">ผู้ปกครอง ({first.guardianRelation})</div>}
          </div>
        </div>

        <Card>
          <CardContent className="p-5">
            {first && (
              <dl className="divide-y divide-border text-[13px]">
                <div className="flex gap-3 py-2">
                  <dt className="w-32 shrink-0 text-muted-foreground">เบอร์ติดต่อ</dt>
                  <dd className="min-w-0 flex-1">{first.guardianPhone}</dd>
                </div>
                <div className="flex gap-3 py-2">
                  <dt className="w-32 shrink-0 text-muted-foreground">บุตรหลานที่เชื่อมบัญชี</dt>
                  <dd className="min-w-0 flex-1 space-y-1">
                    {children.map((s) => (
                      <div key={s!.studentId}>
                        {s!.fullName} <span className="text-muted-foreground">({s!.roomName})</span>
                      </div>
                    ))}
                  </dd>
                </div>
              </dl>
            )}
            <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
              ข้อมูลมาจากงานทะเบียนของโรงเรียน หากไม่ถูกต้องแจ้งครูประจำชั้น
            </p>
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
