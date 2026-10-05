import { HeartHandshake, MessageCircle, Phone } from "lucide-react";

/**
 * ช่องทางขอความช่วยเหลือ — เนื้อหาเหมือนกันสำหรับนักเรียนทุกคน
 * ห้ามเปลี่ยนตามผลประเมินหรือข้อมูลใดของนักเรียน
 */
export function HelpBlock() {
  return (
    <section aria-labelledby="help-title" className="rounded-2xl border border-blue-200 bg-accent p-4">
      <div className="flex items-center gap-2">
        <HeartHandshake className="size-5 text-primary" />
        <h2 id="help-title" className="text-[14.5px] font-bold">
          อยากคุยกับใครสักคนไหม
        </h2>
      </div>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
        ถ้ารู้สึกไม่สบายใจ เครียด หรือมีเรื่องอยากปรึกษา ขอความช่วยเหลือได้ทุกเมื่อ ไม่ต้องรอให้ใครถาม
      </p>
      <div className="mt-3 space-y-2">
        <a href="tel:1323" className="flex min-h-11 items-center gap-3 rounded-xl bg-card px-3.5 py-2.5">
          <Phone className="size-4 shrink-0 text-primary" />
          <span className="flex-1">
            <span className="block text-[13.5px] font-semibold">สายด่วนสุขภาพจิต 1323</span>
            <span className="block text-[11.5px] text-muted-foreground">โทรฟรี ตลอด 24 ชั่วโมง</span>
          </span>
        </a>
        <a href="tel:1387" className="flex min-h-11 items-center gap-3 rounded-xl bg-card px-3.5 py-2.5">
          <Phone className="size-4 shrink-0 text-primary" />
          <span className="flex-1">
            <span className="block text-[13.5px] font-semibold">สายเด็ก 1387</span>
            <span className="block text-[11.5px] text-muted-foreground">โทรฟรี ตลอด 24 ชั่วโมง</span>
          </span>
        </a>
        <div className="flex min-h-11 items-center gap-3 rounded-xl bg-card px-3.5 py-2.5">
          <MessageCircle className="size-4 shrink-0 text-primary" />
          <span className="flex-1">
            <span className="block text-[13.5px] font-semibold">นัดคุยกับครู</span>
            <span className="block text-[11.5px] text-muted-foreground">
              บอกครูประจำชั้นหรือครูแนะแนวได้โดยตรงที่โรงเรียน ครูพร้อมรับฟังเสมอ
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
