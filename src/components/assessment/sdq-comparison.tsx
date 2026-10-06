"use client";

import { cn } from "cn";
import { SDQ_CUTOFFS } from "@/lib/rules";
import { useStore } from "@/lib/store";
import { formatThaiDate } from "@/lib/format";
import {
  SDQ_SCALE_LABEL,
  SDQ_STATUS_LABEL,
  type SdqAssessment,
  type SdqLevel,
  type SdqRater,
  type SdqScale,
} from "@/lib/types";
import { SdqLevelBadge } from "./sdq-result";

/** 4 ด้านที่รวมเป็นคะแนนพฤติกรรมที่เป็นปัญหา + ด้านสัมพันธภาพทางสังคมที่ไม่รวม */
const DIFFICULTY_SCALES: SdqScale[] = ["emotional", "conduct", "hyperactivity", "peer"];

const SHORT_SCALE: Record<SdqScale, string> = {
  emotional: "อารมณ์",
  conduct: "ความประพฤติ",
  hyperactivity: "อยู่ไม่นิ่ง",
  peer: "เพื่อน",
  prosocial: "สัมพันธภาพ",
};

const SHORT_RATER: Record<SdqRater, string> = {
  teacher: "ครู",
  student: "นักเรียน",
  parent: "ผู้ปกครอง",
};

type Agreement = { tone: "ok" | "review" | "wait"; label: string; note: string };

/**
 * ความสอดคล้องระหว่างฉบับ — ตัดสินจาก "ผลของแต่ละฉบับ" เท่านั้น ไม่เฉลี่ยคะแนน
 * ต่างกันตั้งแต่ 1 ระดับ = ต้องทบทวน (ระบบไม่ตัดสินแทนครู)
 */
export function sdqAgreement(forms: SdqAssessment[]): Agreement {
  const levels = forms.filter((f) => f.status === "submitted" && f.level).map((f) => f.level as SdqLevel);
  if (levels.length < 2)
    return {
      tone: "wait",
      label: "ยังเทียบไม่ได้",
      note: "ต้องมีอย่างน้อย 2 ฉบับที่ส่งแล้วจึงเทียบความสอดคล้องได้",
    };
  const same = levels.every((l) => l === levels[0]);
  return same
    ? { tone: "ok", label: "สอดคล้อง", note: "ทุกฉบับที่ส่งแล้วได้ผลระดับเดียวกัน" }
    : {
        tone: "review",
        label: "ต้องทบทวน",
        note: "ผลแต่ละฉบับไม่ตรงกัน — ครูประจำชั้นทบทวนร่วมกับข้อมูลอื่น ระบบไม่ตัดสินแทน",
      };
}

const AGREEMENT_STYLE: Record<Agreement["tone"], string> = {
  ok: "bg-risk-green-bg text-risk-green",
  review: "bg-risk-amber-bg text-risk-amber",
  wait: "bg-muted text-muted-foreground",
};

/** ป้ายความสอดคล้อง / ต้องทบทวน ใช้ซ้ำได้นอกตาราง */
export function SdqAgreementChip({ forms, className }: { forms: SdqAssessment[]; className?: string }) {
  const a = sdqAgreement(forms);
  return (
    <span
      title={a.note}
      className={cn("inline-flex rounded-full px-2.5 py-1 text-[11.5px] font-semibold", AGREEMENT_STYLE[a.tone], className)}
    >
      {a.label}
    </span>
  );
}

/**
 * ตารางเทียบผล SDQ รายผู้ประเมิน (ครู / นักเรียน / ผู้ปกครอง)
 * - แสดงคะแนนรายด้านของแต่ละฉบับแยกกัน **ไม่เฉลี่ยคะแนนระหว่างผู้ประเมิน**
 * - ผลที่เป็นทางการยังเป็นผลรวม (อิงจาก N จาก M ฉบับ) ที่แสดงคู่กัน
 */
export function SdqRaterComparison({
  studentId,
  forms,
  className,
}: {
  studentId: string;
  forms: SdqAssessment[];
  className?: string;
}) {
  const store = useStore();
  if (!store.canSeeSensitive(studentId)) return null;

  const shown = forms.filter((f) => f.status !== "voided");
  if (shown.length === 0) return null;

  const submitted = shown.filter((f) => f.status === "submitted");
  const agreement = sdqAgreement(shown);

  const rangeOf = (pick: (f: SdqAssessment) => number | null | undefined) => {
    const values = submitted.map(pick).filter((v): v is number => typeof v === "number");
    if (values.length < 2) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return min === max ? `${min}` : `${min}–${max}`;
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-[13.5px] font-bold">เทียบผลรายผู้ประเมิน</h3>
          <p className="text-[11.5px] text-muted-foreground">
            แสดงคะแนนแยกรายฉบับ ไม่เฉลี่ยคะแนนระหว่างผู้ประเมิน · ผลที่เป็นทางการคือผลรวม
          </p>
        </div>
        <SdqAgreementChip forms={shown} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse text-[11.5px]">
          <caption className="sr-only">
            คะแนน SDQ รายด้านของแต่ละผู้ประเมิน พร้อมผลตามเกณฑ์ของฉบับนั้น
          </caption>
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="py-1.5 pr-2 font-semibold text-muted-foreground">
                ด้าน
              </th>
              {shown.map((f) => (
                <th key={f.id} scope="col" className="px-1.5 py-1.5 text-center font-semibold">
                  {SHORT_RATER[f.rater]}
                  <div className="font-normal text-[10.5px] text-muted-foreground">
                    {f.status === "submitted"
                      ? `ส่ง ${f.submittedAt ? formatThaiDate(f.submittedAt) : "-"}`
                      : SDQ_STATUS_LABEL[f.status]}
                  </div>
                </th>
              ))}
              <th scope="col" className="pl-1.5 py-1.5 text-center font-semibold text-muted-foreground">
                ช่วง
              </th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(SDQ_SCALE_LABEL) as SdqScale[]).map((scale) => (
              <tr key={scale} className="border-b border-border/60">
                <th scope="row" className="py-1.5 pr-2 text-left font-medium">
                  {SHORT_SCALE[scale]}
                  {!DIFFICULTY_SCALES.includes(scale) && (
                    <span className="ml-1 text-[10px] font-normal text-muted-foreground">(ไม่รวมในคะแนนรวม)</span>
                  )}
                </th>
                {shown.map((f) => (
                  <td key={f.id} className="px-1.5 py-1.5 text-center tabular-nums">
                    {f.scaleScores ? f.scaleScores[scale] : <span className="text-muted-foreground">–</span>}
                  </td>
                ))}
                <td className="pl-1.5 py-1.5 text-center text-muted-foreground tabular-nums">
                  {rangeOf((f) => f.scaleScores?.[scale]) ?? "–"}
                </td>
              </tr>
            ))}
            <tr className="border-b border-border/60 bg-surface">
              <th scope="row" className="py-1.5 pr-2 text-left font-bold">
                คะแนนรวมพฤติกรรมที่เป็นปัญหา
              </th>
              {shown.map((f) => (
                <td key={f.id} className="px-1.5 py-1.5 text-center font-bold tabular-nums">
                  {f.totalDifficulties ?? <span className="font-normal text-muted-foreground">–</span>}
                </td>
              ))}
              <td className="pl-1.5 py-1.5 text-center text-muted-foreground tabular-nums">
                {rangeOf((f) => f.totalDifficulties) ?? "–"}
              </td>
            </tr>
            <tr>
              <th scope="row" className="py-1.5 pr-2 text-left font-medium">
                ผลตามเกณฑ์ของฉบับ
              </th>
              {shown.map((f) => (
                <td key={f.id} className="px-1.5 py-2 text-center">
                  {f.level ? (
                    <SdqLevelBadge level={f.level} className="px-2 py-0.5 text-[10.5px]" />
                  ) : (
                    <span className="text-[11px] text-muted-foreground">{SDQ_STATUS_LABEL[f.status]}</span>
                  )}
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    เกณฑ์ {SDQ_CUTOFFS[f.rater].risk}/{SDQ_CUTOFFS[f.rater].problem}
                  </div>
                </td>
              ))}
              <td className="pl-1.5 py-2 text-center text-muted-foreground">–</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground">{agreement.note}</p>
      <p className="text-[11px] text-muted-foreground">
        เกณฑ์แปลผล (เสี่ยง/มีปัญหา) ยังรอยืนยันจากคู่มือกรมสุขภาพจิต — ตอนนี้ใช้ค่าเดียวกันทั้ง 3 ฉบับ
      </p>
    </div>
  );
}
