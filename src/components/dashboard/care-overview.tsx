"use client";

/**
 * หน้าเริ่มงานของครูประจำชั้น — "ภาพรวมห้องที่รับผิดชอบ"
 * ทุกตัวเลขอ่านจาก store จริง ไม่มีค่าคงที่สมมติ:
 * - นักเรียนในความดูแล: students ที่ roomId อยู่ใน myHomeroomRoomIds และสถานะกำลังศึกษา
 * - แถบสัดส่วน: overallRiskOf(studentId) (ฉบับล่าสุดที่รับรองแล้ว)
 * - รายการที่ต้องติดตาม: activeCaseOf(studentId) + แผนที่ถึงกำหนด (CarePlan.targetDate)
 * - ความคืบหน้าประจำห้อง: annualVisitStatusOf / screeningOf / assessmentPlanOf / dcSummaryOf
 * - นัดหมายวันนี้: appointments ที่ proposedDate ตรงกับวันนี้ (ไม่นับที่ยกเลิก)
 * - รอดำเนินการ: myPendingBehaviorRecords, pendingSuggestions, เหตุใน case ที่ยังไม่มีแผน ฯลฯ
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  FolderPlus,
  HeartHandshake,
  Home,
  Lightbulb,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { RiskBadge, RiskDot } from "@/components/shared/risk-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatThaiDate, initialOf, nowThaiIso, thaiDateOf } from "@/lib/format";
import { useStore } from "@/lib/store";
import {
  APPOINTMENT_STATUS_LABEL,
  CASE_TRIGGER_SOURCE_LABEL,
  VISIT_TYPE_LABEL,
  type CareCase,
  type DimensionResult,
  type Student,
} from "@/lib/types";

type RiskFilter = "all" | "red" | "amber";

interface FollowupRow {
  student: Student;
  careCase: CareCase;
  risk: DimensionResult | null;
  reason: string;
  /** กำหนดติดตามที่ใกล้ที่สุดจากแผนในเคส (null = ยังไม่มีแผน) */
  dueDate: string | null;
  overdue: boolean;
  dueToday: boolean;
}

export function TeacherCareOverview() {
  const store = useStore();
  const today = thaiDateOf(nowThaiIso());
  const termId = store.currentTerm.termId;

  const myStudents = useMemo(
    () =>
      store.students.filter(
        (s) => s.status === "studying" && store.myHomeroomRoomIds.includes(s.roomId)
      ),
    [store]
  );

  const roomNames = useMemo(
    () =>
      store.classrooms
        .filter((c) => store.myHomeroomRoomIds.includes(c.roomId))
        .map((c) => c.roomName)
        .join(" · "),
    [store]
  );

  const distribution = useMemo(() => {
    const counts: Record<DimensionResult, number> = { green: 0, amber: 0, red: 0, pending: 0 };
    let rated = 0;
    for (const s of myStudents) {
      const risk = store.overallRiskOf(s.studentId);
      if (risk) {
        counts[risk] += 1;
        rated += 1;
      }
    }
    return { ...counts, rated };
  }, [myStudents, store]);

  const followups = useMemo<FollowupRow[]>(() => {
    const rows: FollowupRow[] = [];
    for (const student of myStudents) {
      const careCase = store.activeCaseOf(student.studentId);
      if (!careCase) continue;
      const dueDate = careCase.plans
        .map((p) => p.targetDate)
        .sort((a, b) => a.localeCompare(b))[0];
      const latestTrigger = [...careCase.triggers].sort((a, b) =>
        b.detectedAt.localeCompare(a.detectedAt)
      )[0];
      rows.push({
        student,
        careCase,
        risk: store.overallRiskOf(student.studentId),
        reason:
          latestTrigger?.summary ??
          (latestTrigger ? CASE_TRIGGER_SOURCE_LABEL[latestTrigger.source] : "ยังไม่มีเหตุบันทึกไว้"),
        dueDate: dueDate ?? null,
        overdue: dueDate ? dueDate < today : false,
        dueToday: dueDate === today,
      });
    }
    // เลยกำหนดก่อน แล้วเรียงตามวันกำหนด (ยังไม่มีแผนอยู่ท้ายสุด)
    return rows.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [myStudents, store, today]);

  const dueTodayCount = followups.filter((r) => r.dueToday || r.overdue).length;

  const [filter, setFilter] = useState<RiskFilter>("all");
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const visibleFollowups = followups.filter(
    (r) =>
      (filter === "all" || r.risk === filter) &&
      (trimmed === "" ||
        r.student.fullName.includes(trimmed) ||
        r.student.studentId.includes(trimmed))
  );

  const progress = useMemo(() => {
    const total = myStudents.length;
    let visited = 0;
    let screened = 0;
    let assessed = 0;
    let summarized = 0;
    for (const s of myStudents) {
      const visitStatus = store.annualVisitStatusOf(s.studentId);
      if (visitStatus === "visited" || visitStatus === "visited_inaccessible") visited += 1;
      if (store.screeningOf(s.studentId, termId)?.status === "certified") screened += 1;
      const next = store.assessmentPlanOf(s.studentId).next;
      if (next === "done" || next === "not_required") assessed += 1;
      if (store.dcSummaryOf(s.studentId, termId)) summarized += 1;
    }
    return [
      {
        key: "visit",
        icon: Home,
        title: "เยี่ยมบ้านประจำปี",
        done: visited,
        total,
        href: "/home-visits",
        detail: `เหลืออีก ${total - visited} คน`,
      },
      {
        key: "screening",
        icon: ClipboardCheck,
        title: "คัดกรอง 6 มิติ (รับรองแล้ว)",
        done: screened,
        total,
        href: "/screening",
        detail: `เหลืออีก ${total - screened} คน · ${store.currentTerm.label}`,
      },
      {
        key: "assessment",
        icon: HeartHandshake,
        title: "Red Flag / 9S / SDQ",
        done: assessed,
        total,
        href: "/assessment",
        detail: `เหลืออีก ${total - assessed} คน`,
      },
      {
        key: "dc",
        icon: Sparkles,
        title: "สรุปคุณลักษณะอันพึงประสงค์",
        done: summarized,
        total,
        href: "/characteristics",
        detail: `เหลืออีก ${total - summarized} คน · ${store.currentTerm.label}`,
      },
    ];
  }, [myStudents, store, termId]);

  const todayAppointments = useMemo(() => {
    const mine = new Set(myStudents.map((s) => s.studentId));
    return store.appointments
      .filter(
        (a) =>
          mine.has(a.studentId) &&
          a.status !== "cancelled" &&
          thaiDateOf(a.proposedDate) === today
      )
      .sort((a, b) => a.proposedDate.localeCompare(b.proposedDate));
  }, [myStudents, store, today]);

  const todayPlans = useMemo(
    () => followups.filter((r) => r.dueToday),
    [followups]
  );

  const pending = useMemo(() => {
    const unplannedTriggers = followups.reduce(
      (acc, r) => acc + r.careCase.triggers.filter((t) => t.planId === null).length,
      0
    );
    const missingSubjects = store.myHomeroomRoomIds.reduce(
      (acc, roomId) =>
        acc + store.subjectSubmissionsOf(roomId, termId).filter((s) => !s.submitted).length,
      0
    );
    const items = [
      {
        key: "behavior",
        icon: ClipboardList,
        title: "บันทึกความประพฤติรอยืนยัน",
        count: store.myPendingBehaviorRecords.length,
        unit: "รายการ",
        href: "/behavior",
      },
      {
        key: "suggestion",
        icon: Lightbulb,
        title: "คำแนะนำให้พิจารณาเปิดเคส",
        count: store.pendingSuggestions.length,
        unit: "คน",
        href: "/care-cases",
      },
      {
        key: "plan",
        icon: FolderPlus,
        title: "เหตุในเคสที่ยังไม่มีแผนรองรับ",
        count: unplannedTriggers,
        unit: "เหตุ",
        href: "/care-cases",
      },
      {
        key: "overdue",
        icon: Clock3,
        title: "แผนที่เลยกำหนดติดตาม",
        count: followups.filter((r) => r.overdue).length,
        unit: "เคส",
        href: "/care-cases",
      },
      {
        key: "dc",
        icon: Sparkles,
        title: "รายวิชาที่ยังส่งคะแนนคุณลักษณะฯ ไม่ครบ",
        count: missingSubjects,
        unit: "รายวิชา",
        href: "/characteristics",
      },
    ];
    return items.filter((i) => i.count > 0);
  }, [followups, store, termId]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Users className="size-4" />
          ห้องที่รับผิดชอบ <b className="text-foreground">{roomNames || "ยังไม่กำหนด"}</b>
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-4" />
          {store.currentTerm.label}
        </span>
        <span>ข้อมูล ณ {formatThaiDate(today)}</span>
      </div>

      {/* สรุปห้อง */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,210px)_minmax(0,1fr)_minmax(0,240px)]">
        <Card>
          <CardContent className="p-5">
            <div className="text-[13px] font-semibold text-muted-foreground">นักเรียนในความดูแล</div>
            <div className="mt-2 text-3xl font-bold">
              {myStudents.length}{" "}
              <span className="text-[13px] font-medium text-muted-foreground">คน</span>
            </div>
            <Link
              href="/students"
              className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
            >
              ดูรายชื่อนักเรียน
              <ChevronRight className="size-4" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[15px] font-bold">ผลคัดกรองล่าสุดที่รับรองแล้ว</h2>
              <span className="text-[12px] text-muted-foreground">
                จากนักเรียน {distribution.rated} จาก {myStudents.length} คน
              </span>
            </div>
            {distribution.rated === 0 ? (
              <p className="mt-3 text-[13px] text-muted-foreground">
                ยังไม่มีผลคัดกรองที่รับรองแล้วในห้องนี้
              </p>
            ) : (
              <>
                <div
                  className="mt-3 flex h-4 overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label={`ปกติ ${distribution.green} คน เสี่ยง ${distribution.amber} คน มีปัญหา ${distribution.red} คน`}
                >
                  <div
                    className="bg-risk-green"
                    style={{ width: `${(distribution.green / distribution.rated) * 100}%` }}
                  />
                  <div
                    className="bg-risk-amber"
                    style={{ width: `${(distribution.amber / distribution.rated) * 100}%` }}
                  />
                  <div
                    className="bg-risk-red"
                    style={{ width: `${(distribution.red / distribution.rated) * 100}%` }}
                  />
                </div>
                <div className="mt-2.5 flex flex-wrap gap-4 text-[12.5px]">
                  <span className="flex items-center gap-1.5">
                    <RiskDot group="green" /> ปกติ <b>{distribution.green}</b>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <RiskDot group="amber" /> เสี่ยง <b>{distribution.amber}</b>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <RiskDot group="red" /> มีปัญหา <b>{distribution.red}</b>
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Link href="/care-cases" className="group">
          <Card className="h-full transition-colors group-hover:border-primary/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
                <Clock3 className="size-4" />
                ถึงกำหนดติดตามแล้ว
              </div>
              <div className="mt-2 text-3xl font-bold">
                {dueTodayCount} <span className="text-[13px] font-medium text-muted-foreground">เคส</span>
              </div>
              <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-primary">
                เปิดงานติดตามช่วยเหลือ
                <ChevronRight className="size-4" />
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.75fr_1fr]">
        <div className="space-y-5">
          {/* นักเรียนที่ต้องติดตาม */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-[15.5px] font-bold">
                    นักเรียนที่ต้องติดตาม{" "}
                    <span className="ml-1 rounded-full bg-surface px-2 py-0.5 text-[12px] font-semibold text-muted-foreground">
                      {followups.length}
                    </span>
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    เคสที่เปิดอยู่ของห้อง เรียงตามวันกำหนดติดตาม
                  </p>
                </div>
                <Link href="/care-cases" className="text-[13px] font-semibold text-primary hover:underline">
                  ดูเคสทั้งหมด
                </Link>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1" role="group" aria-label="กรองตามผลคัดกรอง">
                  {(
                    [
                      { key: "all" as RiskFilter, label: "ทั้งหมด" },
                      { key: "red" as RiskFilter, label: "มีปัญหา" },
                      { key: "amber" as RiskFilter, label: "เสี่ยง" },
                    ]
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      aria-pressed={filter === tab.key}
                      onClick={() => setFilter(tab.key)}
                      className={
                        filter === tab.key
                          ? "h-9 rounded-lg border border-primary bg-accent px-3 text-[12.5px] font-semibold text-primary"
                          : "h-9 rounded-lg border border-border bg-card px-3 text-[12.5px] text-muted-foreground hover:bg-muted"
                      }
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <label className="flex h-9 min-w-48 flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 text-[13px]">
                  <Search className="size-4 shrink-0 text-muted-foreground" />
                  <span className="sr-only">ค้นหานักเรียนในรายการติดตาม</span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ค้นหาชื่อหรือเลขประจำตัว"
                    className="min-w-0 flex-1 bg-transparent outline-none"
                  />
                  {query && (
                    <button
                      type="button"
                      aria-label="ล้างคำค้นหา"
                      onClick={() => setQuery("")}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </label>
              </div>

              <div className="mt-3 divide-y divide-border">
                {visibleFollowups.map((row) => (
                  <Link
                    key={row.careCase.caseId}
                    href={`/care-cases?student=${row.student.studentId}`}
                    className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/40"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                      {initialOf(row.student.fullName)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{row.student.fullName}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {row.student.roomName} เลขที่ {row.student.classNo} · {row.reason}
                      </span>
                    </span>
                    {row.risk && <RiskBadge group={row.risk} />}
                    <span
                      className={`w-28 shrink-0 text-right text-[12.5px] ${
                        row.overdue || row.dueToday
                          ? "font-semibold text-risk-red"
                          : "text-muted-foreground"
                      }`}
                    >
                      {row.dueDate === null
                        ? "ยังไม่มีแผน"
                        : row.dueToday
                          ? "ถึงกำหนดวันนี้"
                          : row.overdue
                            ? `เลยกำหนด ${formatThaiDate(row.dueDate)}`
                            : formatThaiDate(row.dueDate)}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
                {visibleFollowups.length === 0 && (
                  <p className="py-8 text-center text-[13px] text-muted-foreground">
                    {followups.length === 0
                      ? "ยังไม่มีเคสที่เปิดอยู่ในห้องนี้"
                      : "ไม่พบรายการที่ตรงกับคำค้นหาหรือตัวกรอง"}
                  </p>
                )}
              </div>

              <p className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-[12px] text-muted-foreground">
                <ShieldCheck className="size-4 shrink-0" />
                ใช้ผลประเมินร่วมกับการสังเกตและการพูดคุยกับนักเรียนเสมอ
              </p>
            </CardContent>
          </Card>

          {/* ความคืบหน้างานประจำห้อง */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-[15.5px] font-bold">ความคืบหน้างานประจำห้อง</h2>
              <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
                กดเพื่อไปทำงานในหน้าที่เกี่ยวข้อง
              </p>
              <div className="space-y-2">
                {progress.map((task) => {
                  const pct = task.total === 0 ? 0 : Math.round((task.done / task.total) * 100);
                  return (
                    <Link
                      key={task.key}
                      href={task.href}
                      className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
                    >
                      <task.icon className="size-5 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-semibold">{task.title}</span>
                        <span className="block truncate text-[11.5px] text-muted-foreground">
                          {task.detail}
                        </span>
                      </span>
                      <span
                        className="hidden h-2 w-32 shrink-0 overflow-hidden rounded-full bg-muted sm:block"
                        role="img"
                        aria-label={`${task.title} เสร็จ ${task.done} จาก ${task.total} คน`}
                      >
                        <span
                          className={pct >= 100 ? "block h-full bg-risk-green" : "block h-full bg-primary"}
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className="w-16 shrink-0 text-right text-[12.5px] text-muted-foreground">
                        <b className="text-foreground">{task.done}</b> / {task.total}
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* แถบขวา */}
        <div className="space-y-5">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[15.5px] font-bold">กำหนดการวันนี้</h2>
                <CalendarDays className="size-5 text-muted-foreground" />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{formatThaiDate(today)}</p>

              <div className="mt-3 space-y-2">
                {todayAppointments.map((a) => {
                  const student = store.getStudent(a.studentId);
                  return (
                    <Link
                      key={a.appointmentId}
                      href="/home-visits"
                      className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/40"
                    >
                      <Home className="size-4 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold">
                          {VISIT_TYPE_LABEL[a.visitType]}
                        </span>
                        <span className="block truncate text-[11.5px] text-muted-foreground">
                          {student?.fullName} · {APPOINTMENT_STATUS_LABEL[a.status]}
                        </span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  );
                })}

                {todayPlans.map((row) => (
                  <Link
                    key={`plan-${row.careCase.caseId}`}
                    href={`/care-cases?student=${row.student.studentId}`}
                    className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    <Clock3 className="size-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold">ถึงกำหนดติดตามผลตามแผน</span>
                      <span className="block truncate text-[11.5px] text-muted-foreground">
                        {row.student.fullName}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}

                {todayAppointments.length === 0 && todayPlans.length === 0 && (
                  <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-[12.5px] text-muted-foreground">
                    วันนี้ไม่มีนัดหมายหรือกำหนดติดตาม
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[15.5px] font-bold">รอดำเนินการ</h2>
                <span className="rounded-full bg-surface px-2 py-0.5 text-[12px] font-semibold text-muted-foreground">
                  {pending.length}
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {pending.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    <item.icon className="size-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold">{item.title}</span>
                      <span className="block text-[11.5px] text-muted-foreground">
                        {item.count} {item.unit}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
                {pending.length === 0 && (
                  <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-[12.5px] text-muted-foreground">
                    ไม่มีงานค้างในขณะนี้
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
