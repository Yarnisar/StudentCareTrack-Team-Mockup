"use client";

/**
 * การ์ดต่อกิจกรรม — บอกว่าช่วงนี้ควบคุมอะไร ใครได้รับผลกระทบ (ตัวเลขจากข้อมูลจริง) และเกิดอะไรหลังวันปิด
 */

import { useState } from "react";
import { InlineConfirm } from "@/components/settings/confirm";
import { windowSaveConfirm, type ImpactContext } from "@/components/settings/confirm-text";
import { Button } from "@/components/ui/button";
import { addDaysThai, compareThaiDate, formatThaiDate } from "@/lib/format";
import { sdqRatersFor, sdqRoundFor } from "@/lib/rules";
import { useStore } from "@/lib/store";
import {
  OPERATING_ACTIVITIES,
  OPERATING_ACTIVITY_LABEL,
  SDQ_RATER_LABEL,
  type OperatingActivity,
} from "@/lib/types";
import { PhaseChip } from "./operating-windows-timeline";
import { countdownText, elapsedPercent, phaseOf } from "./window-math";

const AFTER_CLOSE =
  "หลังวันปิด ระบบล็อกการบันทึก ดูข้อมูลเดิมได้";
const AFTER_CLOSE_SCREENING = `${AFTER_CLOSE} — แอดมินปลดล็อกการคัดกรองรายคนได้พร้อมบันทึกเหตุผล`;

export function OperatingWindowCards({
  impact,
  onEdit,
}: {
  impact: ImpactContext;
  onEdit: (activity: OperatingActivity) => void;
}) {
  return (
    <section aria-labelledby="win-cards-h" className="mt-5">
      <h3 id="win-cards-h" className="mb-2 text-[14px] font-bold">
        แต่ละกิจกรรมควบคุมอะไร
      </h3>
      <div className="grid gap-3 lg:grid-cols-2">
        {OPERATING_ACTIVITIES.map((a) => (
          <ActivityCard key={a} activity={a} impact={impact} onEdit={() => onEdit(a)} />
        ))}
      </div>
    </section>
  );
}

function ActivityCard({
  activity,
  impact,
  onEdit,
}: {
  activity: OperatingActivity;
  impact: ImpactContext;
  onEdit: () => void;
}) {
  const store = useStore();
  const term = store.currentTerm;
  const w = store.windowOf(activity);
  const phase = phaseOf(store.windowStatusOf(activity), store.isWindowClosingSoon(activity));
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const studying = store.students.filter((s) => s.status === "studying");
  const round = sdqRoundFor(term);

  let controls: string;
  let affected: { count: number; text: string };
  switch (activity) {
    case "screening": {
      const certified = new Set(
        store.screenings.filter((s) => s.termId === term.termId && s.status === "certified").map((s) => s.studentId)
      );
      controls = "ครูประจำชั้นบันทึกและรับรองผลคัดกรอง 6 มิติและแบบ Red Flag/9S ได้เฉพาะในช่วงนี้";
      affected = {
        count: studying.filter((s) => !certified.has(s.studentId)).length,
        text: "นักเรียนที่ยังไม่มีผลคัดกรองที่รับรองแล้วในภาคเรียนนี้",
      };
      break;
    }
    case "home_visit": {
      controls = "ครูประจำชั้นนัดหมายและบันทึกการเยี่ยมบ้านประจำปี พร้อมลงนามผู้ปกครองได้เฉพาะในช่วงนี้";
      affected = {
        count: studying.filter((s) => {
          const st = store.annualVisitStatusOf(s.studentId);
          return st !== "visited" && st !== "visited_inaccessible";
        }).length,
        text: "นักเรียนที่ยังไม่มีการเยี่ยมบ้านประจำปีที่ลงนามแล้ว",
      };
      break;
    }
    case "sdq": {
      const raters = (grade: string) => sdqRatersFor(grade).map((r) => SDQ_RATER_LABEL[r]).join(" ");
      controls = `ผู้ประเมินทำแบบ SDQ ครั้งที่ ${round} ของภาคเรียนนี้ได้เฉพาะในช่วงนี้ — ประถม (ป.1–ป.6): ${raters("ป.1")} · มัธยม: ${raters("ม.1")}`;
      affected = {
        count: store.sdq.filter((f) => f.termId === term.termId && f.round === round && f.status === "pending").length,
        text: `แบบประเมิน SDQ ครั้งที่ ${round} ที่ยังรอผู้ประเมินส่ง (นับเป็นฉบับ)`,
      };
      break;
    }
    case "care_record": {
      controls = "ครูบันทึกการติดตามผลการช่วยเหลือใน care case ได้เฉพาะในช่วงนี้";
      const inWindow = (date: string) =>
        !w || (compareThaiDate(date, w.opensAt) >= 0 && compareThaiDate(date, w.closesAt) <= 0);
      affected = {
        count: store.careCases.filter(
          (c) => c.status === "active" && !c.followups.some((f) => inWindow(f.followupDate))
        ).length,
        text: "care case ที่ยังเปิดอยู่และยังไม่มีบันทึกติดตามผลในช่วงนี้",
      };
      break;
    }
  }

  const draft = w ? { ...w, closesAt: addDaysThai(w.closesAt, 7) } : null;
  const confirmContent =
    w && draft
      ? (() => {
          const base = windowSaveConfirm(activity, w, draft, impact);
          return {
            ...base,
            title: `เลื่อนวันปิด "${OPERATING_ACTIVITY_LABEL[activity]}" ออกไป 7 วัน ?`,
            description: `วันปิดรับ ${formatThaiDate(w.closesAt)} → ${formatThaiDate(draft.closesAt)} · ผลกระทบ: ${affected.text} ${affected.count} รายการ จะมีเวลาทำเพิ่ม · ${base.description}`,
            confirmLabel: "เลื่อนปิด +7 วัน",
          };
        })()
      : null;

  const shift = () => {
    if (!w || !draft) return;
    const result = store.saveOperatingWindow(activity, {
      opensAt: w.opensAt,
      closesAt: draft.closesAt,
      remindDaysBefore: w.remindDaysBefore,
    });
    setConfirming(false);
    setError(result.ok ? null : result.error);
  };

  const pct = w ? elapsedPercent(w, impact.today) : 0;

  return (
    <article className="flex flex-col rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-2">
        <h4 className="flex-1 text-[14px] font-bold">{OPERATING_ACTIVITY_LABEL[activity]}</h4>
        <PhaseChip phase={phase} />
      </div>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">ช่วงนี้ควบคุมอะไร:</span> {controls}
      </p>

      <div className="mt-3 rounded-lg bg-surface px-3 py-2.5">
        <p className="text-[12px] text-muted-foreground">{affected.text}</p>
        <p className="mt-0.5 text-[20px] leading-none font-bold">
          {affected.count}
          <span className="ml-1 text-[12px] font-medium text-muted-foreground">
            {activity === "sdq" ? "ฉบับ" : activity === "care_record" ? "case" : "คน"}
          </span>
        </p>
      </div>

      {w ? (
        <div className="mt-3 text-[12.5px]">
          <p>
            <span className="text-muted-foreground">เปิด</span> {formatThaiDate(w.opensAt)}{" "}
            <span className="text-muted-foreground">· ปิดรับ (รวมวันนี้)</span> {formatThaiDate(w.closesAt)}
          </p>
          <p className="mt-0.5 font-semibold">{countdownText(w, impact.today)}</p>
          <div
            role="progressbar"
            aria-label="สัดส่วนของช่วงที่ผ่านไปแล้ว"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"
          >
            <div
              className={`h-full ${phase === "closing" ? "bg-risk-amber" : phase === "closed" ? "bg-muted-foreground/50" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">ผ่านไปแล้ว {pct}% ของช่วง</p>
          <p className="mt-1.5 text-muted-foreground">
            แจ้งเตือนครูล่วงหน้า {w.remindDaysBefore} วัน (เริ่ม{" "}
            {formatThaiDate(addDaysThai(w.closesAt, -w.remindDaysBefore))})
          </p>
        </div>
      ) : (
        <p className="mt-3 text-[12.5px] text-risk-amber">
          ยังไม่ได้กำหนดช่วงดำเนินงาน — ครูจะบันทึกกิจกรรมนี้ไม่ได้จนกว่าจะกำหนด
        </p>
      )}

      <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
        {activity === "screening" ? AFTER_CLOSE_SCREENING : AFTER_CLOSE}
      </p>

      {error && <p className="mt-2 text-[12.5px] text-risk-red">{error}</p>}

      <div className="mt-auto pt-3">
        {confirming && confirmContent ? (
          <InlineConfirm content={confirmContent} onConfirm={shift} onCancel={() => setConfirming(false)} />
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              {w ? "แก้ไขช่วงเวลา" : "กำหนดช่วงเวลา"}
            </Button>
            {w && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setError(null);
                  setConfirming(true);
                }}
              >
                เลื่อนปิด +7 วัน
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
