"use client";

/** สลับแบบประเมิน SDQ / EQ ของนักเรียน (UC10 สถานการณ์ A ข้อ 2: รายการประเมิน สถานะ และกำหนดส่ง) */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatThaiDate } from "@/lib/format";
import { windowFor } from "@/lib/periods";
import { useStore } from "@/lib/store";

export function AssessmentTabs({ studentId }: { studentId: string }) {
  const store = useStore();
  const pathname = usePathname();
  const sdqDone = store.sdqOf(studentId).find((s) => s.rater === "student" && s.round === 1)?.status === "completed";
  const eq = store.eqOf(studentId);
  const tabs = [
    {
      href: "/portal/student/sdq",
      label: "SDQ",
      status: sdqDone ? "ส่งแล้ว" : "รอทำ",
      due: windowFor(store.assessmentWindows, "sdq")?.closeDate,
    },
    {
      href: "/portal/student/eq",
      label: "EQ",
      status: eq?.status === "completed" ? "ส่งแล้ว" : eq?.status === "declined" ? "ไม่ทำ" : "รอทำ",
      due: windowFor(store.assessmentWindows, "eq")?.closeDate,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-2" role="tablist">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            role="tab"
            aria-selected={active}
            className={`rounded-xl border px-3.5 py-2.5 ${active ? "border-primary bg-accent" : "border-border bg-card"}`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[14px] font-bold ${active ? "text-primary" : ""}`}>{t.label}</span>
              <span className="text-[11.5px] font-semibold text-muted-foreground">{t.status}</span>
            </div>
            {t.due && <div className="mt-0.5 text-[11.5px] text-muted-foreground">ส่งภายใน {formatThaiDate(t.due)}</div>}
          </Link>
        );
      })}
    </div>
  );
}
