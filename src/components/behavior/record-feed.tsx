"use client";

/**
 * ฟีดการ์ดบันทึกความประพฤติ จัดกลุ่มตามวันที่เกิดเหตุ (ใหม่ก่อน)
 * ใช้การ์ดแทนตาราง เพื่อให้ชื่อพฤติกรรมและรายละเอียดเหตุการณ์แสดงครบโดยไม่ถูกตัด
 * แสดงเฉพาะบันทึกที่มีผลกับคะแนน (confirmed) — รอยืนยัน/ยกเว้น/ยกเลิก อยู่ในส่วนด้านบนของหน้า
 */

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatThaiDate, formatThaiTime, thaiDateOf } from "@/lib/format";
import { useStore } from "@/lib/store";
import { BEHAVIOR_SEVERITY_LABEL, type BehaviorRecord } from "@/lib/types";

export function BehaviorStats({ records }: { records: BehaviorRecord[] }) {
  const store = useStore();
  const qrCount = records.filter((r) => r.source === "qr_checkin").length;
  const studentsTouched = new Set(records.map((r) => r.studentId)).size;
  const positive = records.filter((r) => (store.ruleOf(r.ruleId)?.scoreDelta ?? 0) > 0).length;

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <Stat label="บันทึกที่มีผลทั้งหมด" value={`${records.length} รายการ`} />
      <Stat label="นักเรียนที่ถูกบันทึก" value={`${studentsTouched} คน`} />
      <Stat label="บันทึกอัตโนมัติจาก QR" value={`${qrCount} รายการ`} accent />
      <Stat label="บันทึกความดี" value={`${positive} รายการ`} />
    </div>
  );
}

export function BehaviorRecordFeed({ records }: { records: BehaviorRecord[] }) {
  const store = useStore();

  /** จัดกลุ่มตามวันที่เกิดเหตุ วันใหม่อยู่บน ภายในวันเรียงเวลาล่าสุดก่อน */
  const groups = useMemo(() => {
    const byDate = new Map<string, BehaviorRecord[]>();
    for (const rec of records) {
      const day = thaiDateOf(rec.occurredAt);
      const list = byDate.get(day);
      if (list) list.push(rec);
      else byDate.set(day, [rec]);
    }
    return [...byDate.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([day, list]) => ({
        day,
        records: [...list].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
      }));
  }, [records]);

  if (groups.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted-foreground">
        ยังไม่มีบันทึกที่มีผลกับคะแนน
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.day}>
          <div className="mb-2 flex items-baseline gap-2">
            <h3 className="text-[13.5px] font-bold">{formatThaiDate(group.day)}</h3>
            <span className="text-[12px] text-muted-foreground">
              {group.records.length} รายการ
            </span>
          </div>

          <div className="space-y-2.5">
            {group.records.map((rec) => {
              const rule = store.ruleOf(rec.ruleId);
              const student = store.getStudent(rec.studentId);
              return (
                <div
                  key={rec.recordId}
                  className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-bold">{student?.fullName}</span>
                    <span className="text-[12px] text-muted-foreground">
                      {student?.roomName} เลขที่ {student?.classNo}
                    </span>
                    <span className="flex-1" />
                    <SourceBadge source={rec.source} />
                    <ScoreChip delta={rule?.scoreDelta ?? 0} />
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-[13.5px] font-semibold text-foreground">{rule?.name}</span>
                    {rule && (
                      <span className="rounded bg-surface px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {BEHAVIOR_SEVERITY_LABEL[rule.severity]}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {rec.description}
                  </p>

                  <div className="mt-2.5 flex flex-wrap gap-x-3 border-t border-border pt-2 text-[11.5px] text-muted-foreground">
                    <span>{formatThaiTime(rec.occurredAt)} น.</span>
                    <span>บันทึกโดย {store.nameOf(rec.recordedBy)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-[13px] font-semibold text-muted-foreground">{label}</div>
        <div className={accent ? "mt-2 text-2xl font-bold text-primary" : "mt-2 text-2xl font-bold"}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function SourceBadge({ source }: { source: BehaviorRecord["source"] }) {
  return (
    <span
      className={
        source === "qr_checkin"
          ? "shrink-0 rounded-md bg-accent px-2 py-1 text-[11px] font-semibold text-primary"
          : "shrink-0 rounded-md bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground"
      }
    >
      {source === "qr_checkin" ? "QR อัตโนมัติ" : "บันทึกโดยครู"}
    </span>
  );
}

function ScoreChip({ delta }: { delta: number }) {
  const positive = delta > 0;
  return (
    <span
      className={`shrink-0 rounded-md px-3 py-1.5 text-center text-base font-bold ${
        positive ? "bg-risk-green-bg text-risk-green" : "bg-risk-red-bg text-risk-red"
      }`}
    >
      {positive ? `+${delta}` : delta}
    </span>
  );
}
