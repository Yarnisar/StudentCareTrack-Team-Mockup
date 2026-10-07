"use client";

import { useStore } from "@/lib/store";
import { ANNUAL_VISIT_STATUS_LABEL, type AnnualVisitStatus } from "@/lib/types";

const ORDER: AnnualVisitStatus[] = ["visited", "visited_inaccessible", "draft", "scheduled", "none"];

const STYLE: Record<AnnualVisitStatus, string> = {
  visited: "bg-risk-green-bg text-risk-green",
  visited_inaccessible: "bg-accent text-primary",
  draft: "bg-risk-amber-bg text-risk-amber",
  scheduled: "bg-surface text-foreground",
  none: "bg-risk-red-bg text-risk-red",
};

/**
 * ความคืบหน้าการเยี่ยมบ้านประจำปีของนักเรียนในความดูแล
 * นับว่าเยี่ยมแล้วเมื่อรับรองผลแล้ว และแยกกลุ่ม "เข้าบ้านไม่ได้" ออกมาต่างหาก
 */
export function AnnualVisitSummary() {
  const store = useStore();
  const students = store.students.filter((s) => s.status === "studying" && store.canSeeSensitive(s.studentId));
  const counts = Object.fromEntries(ORDER.map((k) => [k, 0])) as Record<AnnualVisitStatus, number>;
  students.forEach((s) => counts[store.annualVisitStatusOf(s.studentId)]++);
  const done = counts.visited + counts.visited_inaccessible;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-bold">เยี่ยมบ้านประจำปี {store.currentTerm.academicYear}</h2>
        <span className="text-[13px] text-muted-foreground">
          เยี่ยมแล้ว <b className="text-foreground">{done}</b> จาก {students.length} คน
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {ORDER.map((k) => (
          <span key={k} className={`rounded-lg px-3 py-1.5 text-[12px] ${STYLE[k]}`}>
            {ANNUAL_VISIT_STATUS_LABEL[k]} · {counts[k]}
          </span>
        ))}
      </div>
    </div>
  );
}
