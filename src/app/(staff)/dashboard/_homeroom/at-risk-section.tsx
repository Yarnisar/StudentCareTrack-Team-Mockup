"use client";

/**
 * นักเรียนที่ต้องดูแล (ครูประจำชั้น): แยกกลุ่มผลคัดกรองให้เห็นทันที กดกลุ่มเพื่อดูรายชื่อ
 * - แต่ละคนบอกมิติที่พบเป็นข้อความ (ไม่พึ่งสีอย่างเดียว) สถานะกรณีช่วยเหลือ และปุ่มลงมือ
 * - กลุ่มมีปัญหาเรียงคนที่ยังไม่เปิดกรณีขึ้นก่อน กลุ่มเสี่ยงเรียงตามจำนวนมิติที่พบ
 * - เฝ้าระวังความประพฤติแยกต่างหาก (แดงใช้ได้เฉพาะ "ถึงเกณฑ์เฝ้าระวัง")
 * สีเขียว/เหลือง/แดงใช้เฉพาะกลุ่มผลคัดกรอง
 */

import { useState } from "react";
import { AlertTriangle, Check, ChevronRight, Circle, CircleDot, type LucideIcon } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { StudentId } from "@/components/shared/student-id";
import { MENTAL_STATUS_LABEL, colorResults } from "@/lib/screening-view";
import { useStore } from "@/lib/store";
import { DIMENSION_LABEL, type RiskGroup, type Student } from "@/lib/types";

type Group = RiskGroup | "none";

/** การ์ดขาวทุกใบ แถบสีด้านบนบอกกลุ่ม แดงอิ่มและหนากว่า เหลือง/เขียวเป็นโทนอ่อน ตามที่ตกลงกันไว้ในหน้าภาพรวม */
const GROUPS: { key: Group; label: string; icon: LucideIcon; bar: string }[] = [
  { key: "red", label: "มีปัญหา", icon: AlertTriangle, bar: "bg-risk-red" },
  { key: "amber", label: "เสี่ยง", icon: CircleDot, bar: "bg-risk-amber-soft" },
  { key: "green", label: "ปกติ", icon: Check, bar: "bg-risk-green-soft" },
  { key: "none", label: "ยังไม่คัดกรอง", icon: Circle, bar: "bg-risk-none" },
];

interface Row {
  student: Student;
  group: Group;
  /** มิติที่ผลไม่ปกติ เป็นข้อความ เช่น "การเรียน · มีปัญหา" */
  findings: string[];
  caseActive: boolean;
  watching: boolean;
}

export function AtRiskSection({
  watchActive,
  watchPending,
  onPickWatch,
}: {
  watchActive: number;
  watchPending: number;
  onPickWatch: () => void;
}) {
  const store = useStore();

  const rows: Row[] = store.students.map((student) => {
    const screening = store.latestScreening(student.studentId);
    const findings = colorResults(screening?.results ?? [])
      .filter((r) => r.group !== "green")
      .sort((a, b) => (a.group === b.group ? 0 : a.group === "red" ? -1 : 1))
      .map((r) => `${DIMENSION_LABEL[r.dimension]} · ${r.group === "red" ? "มีปัญหา" : "เสี่ยง"}`);
    const mental = store.mentalStatusOf(student.studentId);
    if (mental === "needs_care" || mental === "pending") findings.push(`สุขภาพจิต · ${MENTAL_STATUS_LABEL[mental]}`);
    return {
      student,
      group: store.overallRiskOf(student.studentId) ?? "none",
      findings,
      caseActive: store.careCases.some((c) => c.studentId === student.studentId && c.status === "active"),
      watching: !!store.screeningWatch[student.studentId],
    };
  });
  const count = (g: Group) => rows.filter((r) => r.group === g).length;
  const firstWithPeople = GROUPS.find((g) => g.key !== "green" && g.key !== "none" && count(g.key) > 0)?.key ?? "red";
  const [picked, setPicked] = useState<Group | null>(null);
  const selected = picked ?? firstWithPeople;

  const list = rows
    .filter((r) => r.group === selected)
    .sort((a, b) =>
      selected === "red"
        ? Number(a.caseActive) - Number(b.caseActive) || a.student.classNo - b.student.classNo
        : selected === "amber"
          ? b.findings.length - a.findings.length || a.student.classNo - b.student.classNo
          : a.student.classNo - b.student.classNo
    );
  const needCase = rows.filter((r) => r.group === "red" && !r.caseActive).length;

  return (
    <section aria-label="นักเรียนที่ต้องดูแล" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-[15.5px] font-bold">นักเรียนที่ต้องดูแล</h2>
        <span className="text-[12.5px] text-muted-foreground">
          {store.students.length} คน · กดกลุ่มเพื่อดูรายชื่อ
          {needCase > 0 && ` · ในกลุ่มมีปัญหา ยังไม่เปิดกรณี ${needCase} คน`}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="กลุ่มผลคัดกรอง">
        {GROUPS.map(({ key, label, icon: Icon, bar }) => {
          const strong = key === "red" && count("red") > 0;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={selected === key}
              onClick={() => setPicked(key)}
              className={`relative overflow-hidden rounded-xl border border-border bg-card px-3.5 pt-4 pb-3 text-left text-foreground ring-offset-2 transition hover:bg-muted/50 ${
                selected === key ? "ring-2 ring-foreground" : ""
              }`}
            >
              <span aria-hidden className={`absolute inset-x-0 top-0 ${strong ? "h-2.5" : "h-1.5"} ${bar}`} />
              <span className="flex items-center gap-1.5 text-[12.5px] font-semibold">
                <Icon className="size-3.5" aria-hidden /> {label}
              </span>
              <span className="mt-0.5 block text-[26px] leading-tight font-bold tabular-nums">{count(key)}</span>
              <span className="text-[11.5px] font-normal text-muted-foreground">คน</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {list.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-6 text-center text-[13px] text-muted-foreground">
            ไม่มีนักเรียนในกลุ่มนี้
          </p>
        ) : selected === "green" ? (
          <p className="rounded-xl bg-surface px-4 py-3 text-[13px] leading-relaxed">
            {list.map((r) => `${r.student.classNo}. ${r.student.fullName}`).join(" · ")}
          </p>
        ) : (
          <ul className="space-y-2">
            {list.map((r) => (
              <li key={r.student.studentId} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3.5">
                <span className="flex min-w-0 flex-1 basis-60 items-start gap-2.5">
                  <StudentId id={r.student.studentId} className="pt-0.5" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold">
                      {r.student.fullName}
                      <span className="ml-2 text-[12px] font-normal text-muted-foreground">เลขที่ {r.student.classNo}</span>
                    </span>
                    {r.findings.length > 0 && (
                      <span className="mt-1 flex flex-wrap gap-1.5">
                        {r.findings.map((f) => (
                          <span key={f} className="rounded-md bg-muted px-2 py-0.5 text-[11.5px]">
                            {f}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                </span>
                {selected !== "none" && (
                  <span className="text-[12px] text-muted-foreground">
                    {r.caseActive ? "มีกรณีช่วยเหลือ" : r.watching ? "เฝ้าดูผลคัดกรอง" : selected === "red" ? "ยังไม่เปิดกรณี" : ""}
                  </span>
                )}
                {selected === "none" ? (
                  <LinkButton href={`/screening/${r.student.studentId}`} size="sm" variant="outline">
                    คัดกรอง <ChevronRight className="size-4" />
                  </LinkButton>
                ) : selected === "red" && !r.caseActive ? (
                  <LinkButton href={`/care-cases?student=${r.student.studentId}`} size="sm">
                    เปิดกรณีช่วยเหลือ <ChevronRight className="size-4" />
                  </LinkButton>
                ) : (
                  <LinkButton href={`/students/${r.student.studentId}`} size="sm" variant="outline">
                    ดูนักเรียน <ChevronRight className="size-4" />
                  </LinkButton>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border pt-3 text-[13px]">
        <span className="font-semibold">ความประพฤติ</span>
        {watchActive + watchPending === 0 ? (
          <span className="text-muted-foreground">ไม่มีนักเรียนที่ถึงเกณฑ์เฝ้าระวัง</span>
        ) : (
          <>
            {watchActive > 0 && (
              <span className="rounded-full bg-risk-red px-2.5 py-0.5 text-[12px] font-semibold text-white">เฝ้าระวัง {watchActive}</span>
            )}
            {watchPending > 0 && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[12px] font-semibold">รอยืนยันถอน {watchPending}</span>
            )}
            <button type="button" onClick={onPickWatch} className="text-[12.5px] font-semibold text-primary hover:underline">
              ดูรายชื่อ
            </button>
          </>
        )}
      </div>
    </section>
  );
}
