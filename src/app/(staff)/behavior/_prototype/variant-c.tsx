"use client";

/**
 * PROTOTYPE — แบบ C "จัดกลุ่มตามนักเรียน"
 * แนวคิด: ตั้งคำถามใหม่ว่าครูเปิดหน้านี้มาหาอะไร — ไม่ใช่ "วันนี้มีใครทำอะไรบ้าง" ตามลำดับเวลา
 * แต่คือ "ใครมีพฤติกรรมซ้ำจนต้องเข้าไปดูแล" จึงยุบเป็นหนึ่งแถวต่อนักเรียนหนึ่งคน
 * ชื่อนักเรียนกลายเป็นหัวกลุ่ม ไม่ต้องแย่งความกว้างกับข้อความอีก กางออกมาอ่านได้เต็มบรรทัด
 */

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ruleKind, ruleScoreText } from "@/lib/behavior-rules";
import { formatThaiDate, formatThaiTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { BehaviorRecord } from "@/lib/types";
import {
  SEVERITY_LABEL,
  SourceBadge,
  useRuleOf,
} from "./shared";

export const VARIANT_C_NAME = "จัดกลุ่มตามนักเรียน";

export function VariantC({ records }: { records: BehaviorRecord[] }) {
  const store = useStore();
  const ruleOf = useRuleOf();
  const [expanded, setExpanded] = useState<string[]>([]);

  /** ยุบบันทึกทั้งหมดเป็นรายนักเรียน เรียงจากคะแนนความประพฤติน้อยที่สุด (คะแนนตามค่าตั้งต้นในหน้าตั้งค่า) */
  const groups = Array.from(new Set(records.map((r) => r.studentId)))
    .map((studentId) => {
      const own = records.filter((r) => r.studentId === studentId);
      const total = store.behaviorScoreOf(studentId);
      return {
        studentId,
        student: store.getStudent(studentId),
        records: own,
        total,
        watchLevel: store.behaviorWatchLevelOf(studentId),
        severeCount: own.filter((r) => ["severe", "refer"].includes(ruleOf(r.ruleId)?.severity ?? "")).length,
        lastAt: own[0]?.occurredAt ?? "",
      };
    })
    .sort((a, b) => a.total - b.total);

  const toggle = (id: string) =>
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-24 sm:p-8 sm:pb-24">
      <div className="mb-4 flex items-center gap-3">
        <div>
          <h2 className="text-[15.5px] font-bold">ความประพฤติรายนักเรียน</h2>
          <p className="text-xs text-muted-foreground">
            เรียงจากคะแนนน้อยที่สุด · คลิกชื่อเพื่อดูบันทึกทั้งหมดของนักเรียนคนนั้น
          </p>
        </div>
        <span className="flex-1" />
      </div>

      <div className="space-y-2.5">
        {groups.map((g) => {
          const open = expanded.includes(g.studentId);
          return (
            <Card key={g.studentId}>
              <CardContent className="p-0">
                <button
                  type="button"
                  onClick={() => toggle(g.studentId)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-muted/40"
                >
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-[15px] font-bold"
                  >
                    {g.total}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] font-bold">{g.student?.fullName}</span>
                    <span className="block text-[12px] text-muted-foreground">
                      {g.student?.roomName} เลขที่ {g.student?.classNo} · {g.records.length} บันทึก ·
                      ล่าสุด {formatThaiDate(g.lastAt)}
                    </span>
                  </span>

                  {g.watchLevel > 0 && (
                    <span className="shrink-0 rounded-md bg-muted px-2.5 py-1 text-[11.5px] font-semibold">
                      เฝ้าระวังระดับ {g.watchLevel}
                    </span>
                  )}
                  {g.severeCount > 0 && (
                    <span className="shrink-0 rounded-md bg-risk-red-bg px-2.5 py-1 text-[11.5px] font-semibold text-risk-red">
                      ร้ายแรง {g.severeCount} ครั้ง
                    </span>
                  )}

                  <ChevronDown
                    className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {open && (
                  <div className="border-t border-border bg-surface/50 px-5 py-2">
                    {g.records.map((rec) => (
                      <RecordRow key={rec.recordId} rec={rec} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function RecordRow({ rec }: { rec: BehaviorRecord }) {
  const ruleOf = useRuleOf();
  const rule = ruleOf(rec.ruleId);
  const positive = (rule?.scoreDelta ?? 0) > 0;
  const refer = rule ? ruleKind(rule) === "refer" : false;
  return (
    <div className="flex gap-3 border-b border-border py-3 last:border-0">
      <span className="w-28 shrink-0 text-[12px] text-muted-foreground">
        {formatThaiDate(rec.occurredAt)}
        <br />
        {formatThaiTime(rec.occurredAt)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[13.5px] font-semibold">{rule?.name}{rule?.cancelled && <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground">กฎถูกยกเลิก</span>}</span>
          {rule && (
            <span className="rounded bg-card px-1.5 py-0.5 text-[11px] text-muted-foreground">
              {SEVERITY_LABEL[rule.severity]}
            </span>
          )}
          <SourceBadge source={rec.source} evidence={rec.evidence} />
        </span>
        <span className="mt-1 block text-[13px] leading-relaxed text-muted-foreground">
          {rec.description}
        </span>
        <span className="mt-1 block text-[11.5px] text-muted-foreground">
          บันทึกโดย {rec.recordedByName}
        </span>
      </span>
      <span
        className={`w-12 shrink-0 self-start text-right text-[15px] font-bold ${
          refer ? "text-[13px] text-muted-foreground" : positive ? "text-risk-green" : "text-risk-red"
        }`}
      >
        {rule ? ruleScoreText(rule) : ""}
      </span>
    </div>
  );
}
