"use client";

/**
 * PROTOTYPE — แบบ C "ศูนย์เฝ้าระวัง: คิวงานที่ต้องจัดการ"
 * แนวคิด: แอดมินไม่ได้เปิดหน้านี้มาอ่านสถิติ แต่มาดูว่า "วันนี้ต้องตามใคร"
 * จึงไม่ขึ้นตัวเลขรวมเป็นพระเอก แต่ขึ้นรายการงานค้างเรียงตามความเร่งด่วน
 * แบ่งหน้าแบบมีช่องพิมพ์เลขหน้า เพราะคิวอาจยาวหลายร้อยหน้า
 */

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PagerJump, usePagination } from "./pagination";
import { TASK_META, tasksOf, totalsOf, type Scope, type TaskKind } from "./school-data";

export const VARIANT_C_NAME = "ศูนย์เฝ้าระวัง + คิวงาน";

const TONE: Record<"red" | "amber" | "blue", string> = {
  red: "border-risk-red bg-risk-red-bg text-risk-red",
  amber: "border-risk-amber bg-risk-amber-bg text-risk-amber",
  blue: "border-border bg-surface text-muted-foreground",
};

export function VariantC({ scope }: { scope: Scope }) {
  const totals = totalsOf(scope);
  const all = useMemo(() => tasksOf(scope), [scope]);
  const [kind, setKind] = useState<TaskKind | "all">("all");

  const tasks = useMemo(
    () => (kind === "all" ? all : all.filter((t) => t.kind === kind)),
    [all, kind]
  );
  const pager = usePagination(tasks, 8);

  const countOf = (k: TaskKind) => all.filter((t) => t.kind === k).length;

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(TASK_META) as TaskKind[]).map((k) => {
          const meta = TASK_META[k];
          const active = kind === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKind(active ? "all" : k);
                pager.reset();
              }}
              className={`rounded-xl border-2 p-4 text-left transition-all ${TONE[meta.tone]} ${
                active ? "ring-2 ring-primary ring-offset-2" : "opacity-95 hover:opacity-100"
              }`}
            >
              <div className="text-3xl font-bold">{countOf(k).toLocaleString("th-TH")}</div>
              <div className="mt-1 text-[12.5px] font-semibold">{meta.label}</div>
            </button>
          );
        })}
      </div>

      <Card className="mt-5">
        <CardContent className="p-6">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div>
              <h2 className="text-[15.5px] font-bold">
                คิวงานที่ต้องจัดการ
                {kind !== "all" && <span className="ml-2 text-primary">· {TASK_META[kind].label}</span>}
              </h2>
              <p className="text-[12.5px] text-muted-foreground">
                เรียงตามความเร่งด่วน · กดการ์ดด้านบนเพื่อกรองเฉพาะประเภทนั้น
              </p>
            </div>
            <span className="flex-1" />
            {kind !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setKind("all");
                  pager.reset();
                }}
              >
                ล้างตัวกรอง
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {pager.slice.map((t) => {
              const meta = TASK_META[t.kind];
              return (
                <div
                  key={`${t.student.id}-${t.kind}`}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3.5"
                >
                  <span
                    className={`shrink-0 rounded-md border px-2.5 py-1 text-[11.5px] font-semibold ${TONE[meta.tone]}`}
                  >
                    {meta.label}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold">{t.student.name}</span>
                    <span className="block text-[12px] text-muted-foreground">
                      {t.student.room} เลขที่ {t.student.classNo} · {t.detail}
                    </span>
                  </span>
                  <Button variant="outline" size="lg">
                    เปิดดู
                  </Button>
                </div>
              );
            })}
            {pager.slice.length === 0 && (
              <p className="py-10 text-center text-[13px] text-muted-foreground">
                ไม่มีงานค้างในประเภทนี้
              </p>
            )}
          </div>

          <PagerJump
            page={pager.page}
            totalPages={pager.totalPages}
            setPage={pager.setPage}
            from={pager.from}
            to={pager.to}
            total={pager.total}
          />
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3 p-5 text-[13px]">
          <span className="font-semibold text-muted-foreground">สถานะโรงเรียนโดยรวม</span>
          <span>
            นักเรียน <b>{totals.total.toLocaleString("th-TH")}</b> คน
          </span>
          <span>
            คัดกรองแล้ว <b>{Math.round((totals.screened / totals.total) * 100)}%</b>
          </span>
          <span className="text-risk-amber">
            เสี่ยง <b>{totals.amber}</b> คน
          </span>
          <span className="text-risk-red">
            มีปัญหา <b>{totals.red}</b> คน
          </span>
          <span>
            เคสที่เปิดอยู่ <b>{totals.openCases}</b> เคส
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
