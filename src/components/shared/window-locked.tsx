/**
 * แบบฟอร์มที่ปิดรับแล้ว (UC9): พ้นวันปิดของช่วงเวลา และแอดมินตั้ง "ห้ามบันทึกย้อนหลัง" ไว้
 * ส่งเพิ่มไม่ได้จนกว่าแอดมินจะขยายช่วงเวลาในหน้าตั้งค่า
 */

import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { formatThaiDate } from "@/lib/format";
import type { AssessmentWindow } from "@/lib/periods";

export function WindowLocked({
  window: w,
  contact = "แอดมินโรงเรียน",
  backHref,
  backLabel = "กลับ",
}: {
  window: AssessmentWindow;
  /** ผู้ที่ต้องติดต่อเพื่อขอขยายเวลา (นักเรียน/ผู้ปกครองติดต่อครูประจำชั้น) */
  contact?: string;
  backHref: string;
  backLabel?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center px-6 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Lock className="size-5 text-muted-foreground" />
        </div>
        <h2 className="mt-4 text-[16px] font-bold">ปิดรับ{w.label}แล้ว</h2>
        <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-muted-foreground">
          ช่วงเวลานี้ปิดรับเมื่อ {formatThaiDate(w.closeDate)} จึงบันทึกเพิ่มไม่ได้ ติดต่อ{contact}เพื่อขอขยายช่วงเวลา
        </p>
        <LinkButton href={backHref} variant="outline" className="mt-5">
          {backLabel}
        </LinkButton>
      </CardContent>
    </Card>
  );
}
