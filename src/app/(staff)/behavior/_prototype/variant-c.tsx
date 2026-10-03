"use client";

/**
 * PROTOTYPE — แบบ C "จัดกลุ่มตามนักเรียน"
 * แนวคิด: ตั้งคำถามใหม่ว่าครูเปิดหน้านี้มาหาอะไร — ไม่ใช่ "วันนี้มีใครทำอะไรบ้าง" ตามลำดับเวลา
 * แต่คือ "ใครมีพฤติกรรมซ้ำจนต้องเข้าไปดูแล" จึงยุบเป็นหนึ่งแถวต่อนักเรียนหนึ่งคน
 * ชื่อนักเรียนกลายเป็นหัวกลุ่ม ไม่ต้องแย่งความกว้างกับข้อความอีก กางออกมาอ่านได้เต็มบรรทัด
 */

import { useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatThaiDate, formatThaiTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { BehaviorRecord } from "@/lib/types";
import {
  NewRecordFields,
  RulesList,
  SEVERITY_LABEL,
  SourceBadge,
  ruleOf,
  type BehaviorForm,
} from "./shared";

export const VARIANT_C_NAME = "จัดกลุ่มตามนักเรียน";

export function VariantC({ records, form }: { records: BehaviorRecord[]; form: BehaviorForm }) {
  const store = useStore();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);

  /** ยุบบันทึกทั้งหมดเป็นรายนักเรียน เรียงจากคะแนนติดลบมากที่สุด */
  const groups = Array.from(new Set(records.map((r) => r.studentId)))
    .map((studentId) => {
      const own = records.filter((r) => r.studentId === studentId);
      const total = own.reduce((sum, r) => sum + (ruleOf(r.ruleId)?.scoreDelta ?? 0), 0);
      return {
        studentId,
        student: store.getStudent(studentId),
        records: own,
        total,
        severeCount: own.filter((r) => ruleOf(r.ruleId)?.severity === "severe").length,
        lastAt: own[0]?.occurredAt ?? "",
      };
    })
    .sort((a, b) => a.total - b.total);

  const toggle = (id: string) =>
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="flex-1 overflow-y-auto p-8 pb-24">
      <div className="mb-4 flex items-center gap-3">
        <div>
          <h2 className="text-[15.5px] font-bold">ความประพฤติรายนักเรียน</h2>
          <p className="text-xs text-muted-foreground">
            เรียงจากคะแนนสะสมติดลบมากที่สุด · คลิกชื่อเพื่อดูบันทึกทั้งหมดของนักเรียนคนนั้น
          </p>
        </div>
        <span className="flex-1" />
        {!showForm && (
          <Button size="lg" onClick={() => setShowForm(true)}>
            <Plus className="size-4" /> บันทึกพฤติกรรมใหม่
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center">
              <h2 className="flex-1 text-[15.5px] font-bold">บันทึกพฤติกรรมใหม่</h2>
              <button
                type="button"
                aria-label="ปิดฟอร์ม"
                onClick={() => setShowForm(false)}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="max-w-xl">
              <NewRecordFields form={form} />
            </div>
          </CardContent>
        </Card>
      )}

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
                    className={`flex size-11 shrink-0 items-center justify-center rounded-full text-[15px] font-bold ${
                      g.total < 0
                        ? "bg-risk-red-bg text-risk-red"
                        : "bg-risk-green-bg text-risk-green"
                    }`}
                  >
                    {g.total > 0 ? `+${g.total}` : g.total}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] font-bold">{g.student?.fullName}</span>
                    <span className="block text-[12px] text-muted-foreground">
                      {g.student?.roomName} เลขที่ {g.student?.classNo} · {g.records.length} บันทึก ·
                      ล่าสุด {formatThaiDate(g.lastAt)}
                    </span>
                  </span>

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

      <Card className="mt-5">
        <CardContent className="p-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[15.5px] font-bold">กฎความประพฤติ</h2>
            <span className="text-xs text-muted-foreground">จัดการโดยแอดมิน</span>
          </div>
          <RulesList />
        </CardContent>
      </Card>
    </div>
  );
}

function RecordRow({ rec }: { rec: BehaviorRecord }) {
  const rule = ruleOf(rec.ruleId);
  const positive = (rule?.scoreDelta ?? 0) > 0;
  return (
    <div className="flex gap-3 border-b border-border py-3 last:border-0">
      <span className="w-28 shrink-0 text-[12px] text-muted-foreground">
        {formatThaiDate(rec.occurredAt)}
        <br />
        {formatThaiTime(rec.occurredAt)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[13.5px] font-semibold">{rule?.name}</span>
          {rule && (
            <span className="rounded bg-card px-1.5 py-0.5 text-[11px] text-muted-foreground">
              {SEVERITY_LABEL[rule.severity]}
            </span>
          )}
          <SourceBadge source={rec.source} />
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
          positive ? "text-risk-green" : "text-risk-red"
        }`}
      >
        {positive ? `+${rule?.scoreDelta}` : rule?.scoreDelta}
      </span>
    </div>
  );
}
