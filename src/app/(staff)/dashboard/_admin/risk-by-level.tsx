"use client";

/**
 * ผลคัดกรองแยกตามระดับชั้น (แอดมิน): ดูว่าชั้นไหนมีนักเรียนกลุ่มมีปัญหา/เสี่ยงมาก กดแถวเพื่อกรองห้องของชั้นนั้น
 * เป็นจำนวนเท่านั้น ไม่มีชื่อนักเรียน (หัวข้อ 3.4.1) · สีใช้เฉพาะกลุ่มผลคัดกรอง และมีตัวเลขกำกับทุกแถว ไม่พึ่งสีอย่างเดียว
 */

import { LEVELS, riskCounts, type ProtoStudent } from "./school-data";

const n = (v: number) => v.toLocaleString("th-TH");

export function RiskByLevel({
  students,
  level,
  onPick,
}: {
  students: ProtoStudent[];
  level: number | "all";
  onPick: (level: number | "all") => void;
}) {
  const rows = LEVELS.map((l) => {
    const own = students.filter((s) => s.level === l);
    const risk = riskCounts(own);
    return { level: l, total: own.length, risk, none: own.length - risk.red - risk.amber - risk.green };
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h2 className="text-[15px] font-bold">ผลคัดกรองแยกตามระดับชั้น</h2>
        <span className="text-[12.5px] text-muted-foreground">กดชั้นเพื่อดูเฉพาะห้องของชั้นนั้น</span>
        {level !== "all" && (
          <button type="button" onClick={() => onPick("all")} className="ml-auto text-[12.5px] font-semibold text-primary hover:underline">
            ดูทุกชั้น
          </button>
        )}
      </div>
      <ul className="mt-3 space-y-1">
        {rows.map((r) => (
          <li key={r.level}>
            <button
              type="button"
              aria-pressed={level === r.level}
              onClick={() => onPick(level === r.level ? "all" : r.level)}
              className={`grid w-full grid-cols-[40px_minmax(0,1fr)] items-center gap-x-3 gap-y-0.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/50 sm:grid-cols-[40px_minmax(0,1fr)_auto] ${
                level === r.level ? "bg-muted ring-1 ring-foreground/30" : ""
              }`}
            >
              <span className="text-[14px] font-bold">ม.{r.level}</span>
              <span
                className="flex h-2.5 gap-[2px] overflow-hidden rounded-full bg-risk-none"
                role="img"
                aria-label={`ม.${r.level} มีปัญหา ${r.risk.red} เสี่ยง ${r.risk.amber} ปกติ ${r.risk.green} ยังไม่คัดกรอง ${r.none}`}
              >
                {r.risk.red > 0 && <i className="bg-risk-red" style={{ width: `${(r.risk.red / r.total) * 100}%` }} />}
                {r.risk.amber > 0 && <i className="bg-risk-amber-soft" style={{ width: `${(r.risk.amber / r.total) * 100}%` }} />}
                {r.risk.green > 0 && <i className="bg-risk-green-soft" style={{ width: `${(r.risk.green / r.total) * 100}%` }} />}
              </span>
              <span className="col-start-2 text-[12px] tabular-nums text-muted-foreground sm:col-start-auto sm:min-w-[150px] sm:text-right">
                <b className="text-foreground">มีปัญหา {n(r.risk.red)}</b> · เสี่ยง {n(r.risk.amber)}
                {r.none > 0 && <> · ยังไม่คัดกรอง {n(r.none)}</>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11.5px] text-muted-foreground">แถบเทาคือยังไม่คัดกรอง · ตัวเลขเป็นจำนวนนักเรียน ไม่แสดงชื่อ</p>
    </div>
  );
}
