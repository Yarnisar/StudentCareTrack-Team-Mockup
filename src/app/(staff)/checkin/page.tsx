"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, QrCode, ScanLine } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckinOutcome, useStore } from "@/lib/store";
import { formatThaiDate, formatThaiTime, initialOf } from "@/lib/format";

export default function CheckinPage() {
  const store = useStore();
  const startTime = store.schoolSettings.schoolStartTime;
  const [code, setCode] = useState("");
  const [last, setLast] = useState<CheckinOutcome | null>(null);
  const [error, setError] = useState("");
  const [simTime, setSimTime] = useState("");

  const scan = (value: string) => {
    const result = store.checkIn(value.trim(), simTime || undefined);
    if (!result) {
      setError(`ไม่พบบัตรที่ตรงกับรหัส "${value}" — ให้ครูบันทึกชื่อด้วยตนเองแทน`);
      setLast(null);
      return;
    }
    setError("");
    setLast(result);
    setCode("");
  };

  const todayLogs = store.checkinsOn();
  const recent = store.checkins.slice(0, 8);
  const lateToday = todayLogs.filter((c) => c.isLate).length;
  const threshold = store.schoolSettings.lateAlertThreshold;

  return (
    <>
      <PageHeader
        title="สแกน QR เช็คอิน"
        subtitle="บันทึกการมาเรียน / มาสายด้วยบัตรนักเรียนดิจิทัล"
      />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <MiniStat label="เวลาเข้าเรียน" value={`${startTime} น.`} />
              <MiniStat label="สแกนแล้ววันนี้" value={`${todayLogs.length} คน`} />
              <MiniStat label="มาสายวันนี้" value={`${lateToday} คน`} warn />
            </div>

            <Card className="border-0 bg-[#0f172a]">
              <CardContent className="flex flex-col items-center justify-center p-8">
                <div className="mb-6 flex w-full items-center justify-between">
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-400">
                    <span className="size-2.5 rounded-full bg-risk-green" /> กล้องพร้อมสแกน
                  </span>
                  <span className="text-[13px] text-slate-500">
                    โหมดจำลอง — พิมพ์เลขประจำตัวแทนการสแกน
                  </span>
                </div>

                <div className="relative flex size-56 items-center justify-center rounded-2xl bg-white">
                  <QrCode className="size-36 text-[#0f172a]" strokeWidth={1.2} />
                  <span className="absolute -top-2 -left-2 size-11 rounded-tl-xl border-t-4 border-l-4 border-primary" />
                  <span className="absolute -top-2 -right-2 size-11 rounded-tr-xl border-t-4 border-r-4 border-primary" />
                  <span className="absolute -bottom-2 -left-2 size-11 rounded-bl-xl border-b-4 border-l-4 border-primary" />
                  <span className="absolute -right-2 -bottom-2 size-11 rounded-br-xl border-r-4 border-b-4 border-primary" />
                </div>

                <div className="mt-7 w-full max-w-sm space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="code" className="text-slate-300">
                      เลขประจำตัวนักเรียนจากบัตร
                    </Label>
                    <select
                      aria-label="เวลาที่สแกน (สำหรับสาธิต)"
                      value={simTime}
                      onChange={(e) => setSimTime(e.target.value)}
                      className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-[12px] text-slate-300"
                    >
                      <option value="">เวลาจริง</option>
                      <option value="07:20">จำลอง 07:20 (ตรงเวลา)</option>
                      <option value="07:55">จำลอง 07:55 (มาสาย)</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && code && scan(code)}
                      placeholder="เช่น 30125"
                      className="border-slate-700 bg-slate-900 text-white placeholder:text-slate-500"
                    />
                    <Button onClick={() => code && scan(code)} disabled={!code}>
                      <ScanLine className="size-4" /> สแกน
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {store.students.slice(0, 5).map((s) => (
                      <button
                        key={s.studentId}
                        onClick={() => scan(s.studentId)}
                        className="rounded-md bg-slate-800 px-2.5 py-1 text-[11.5px] font-medium text-slate-300 hover:bg-slate-700"
                      >
                        {s.studentId} · {s.fullName.split(" ")[1]}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-risk-red-bg px-4 py-3">
                <AlertTriangle className="size-5 shrink-0 text-risk-red" />
                <p className="text-[13.5px] text-risk-red">{error}</p>
              </div>
            )}

            {last && (
              <Card
                className={
                  last.alreadyCheckedIn
                    ? "border-border bg-muted"
                    : last.isLate
                      ? "border-risk-amber bg-risk-amber-bg"
                      : "border-risk-green bg-risk-green-bg"
                }
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-full bg-white text-sm font-bold">
                      {initialOf(last.student.fullName)}
                    </div>
                    <div className="flex-1">
                      <div className="text-[15px] font-bold">{last.student.fullName}</div>
                      <div className="text-[12.5px] text-muted-foreground">
                        {last.student.roomName} เลขที่ {last.student.classNo} ·{" "}
                        {formatThaiTime(last.log.scannedAt)}
                      </div>
                    </div>
                    <span
                      className={
                        last.alreadyCheckedIn
                          ? "rounded-full bg-white px-3 py-1 text-[12.5px] font-bold text-muted-foreground"
                          : last.isLate
                            ? "rounded-full bg-white px-3 py-1 text-[12.5px] font-bold text-risk-amber"
                            : "rounded-full bg-white px-3 py-1 text-[12.5px] font-bold text-risk-green"
                      }
                    >
                      {last.alreadyCheckedIn ? "เช็คอินแล้ว" : last.isLate ? "มาสาย" : "ตรงเวลา"}
                    </span>
                  </div>

                  {last.alreadyCheckedIn && (
                    <p className="mt-3 flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-[12.5px]">
                      <CheckCircle2 className="size-4 shrink-0 text-muted-foreground" />
                      เช็คอินแล้ววันนี้เมื่อ {formatThaiTime(last.log.scannedAt)} (
                      {last.isLate ? "มาสาย" : "ตรงเวลา"}) — เช็คอินได้วันละ 1 ครั้ง ไม่มีการบันทึกซ้ำ
                    </p>
                  )}

                  {!last.alreadyCheckedIn && last.isLate && (
                    <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-[12.5px]">
                      สร้างบันทึก &quot;มาสาย&quot; รอครูประจำชั้นยืนยันแล้ว — ยังไม่มีผลกับคะแนนจนกว่าจะยืนยัน
                      (หรือครบ {store.schoolSettings.pendingAutoConfirmDays} วันทำการ) · มาสายที่ยืนยันแล้วเดือนนี้{" "}
                      {last.lateCountThisMonth} ครั้ง
                    </p>
                  )}

                  {last.exceededThreshold && (
                    <p className="mt-2 flex items-center gap-2 rounded-lg bg-risk-red-bg px-3 py-2 text-[12.5px] font-semibold text-risk-red">
                      <AlertTriangle className="size-4" />
                      มาสาย (ยืนยันแล้ว) ครบเกณฑ์ {threshold} ครั้งต่อเดือน — ระบบแจ้งครูประจำชั้นเมื่อครบเกณฑ์
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="rounded-xl border border-blue-200 bg-accent px-4 py-3 text-[13.5px] text-accent-foreground">
              เช็คอินวันละ 1 ครั้ง · การสแกนหลังเวลา {startTime} น. ระบบจะสร้างบันทึก <b>&quot;มาสาย&quot;</b>{" "}
              รอครูประจำชั้นยืนยัน เมื่อยืนยันแล้ว (หรือครบ {store.schoolSettings.pendingAutoConfirmDays} วันทำการ)
              จึงหักคะแนนและนับรวมในมิติพฤติกรรมของการคัดกรอง ครบ {threshold} ครั้งต่อเดือนระบบแจ้งครูประจำชั้น
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[15.5px] font-bold">รายการสแกนล่าสุด</h2>
                <Link
                  href="/behavior"
                  className="text-[13px] font-semibold text-primary hover:underline"
                >
                  ดูบันทึกทั้งหมด →
                </Link>
              </div>

              <div className="space-y-2.5">
                {recent.map((log) => {
                  const student = store.getStudent(log.studentId);
                  return (
                    <div
                      key={log.logId}
                      className="flex items-center gap-3 rounded-xl border border-border p-3.5"
                    >
                      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {student ? initialOf(student.fullName) : "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{student?.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          {student?.roomName} เลขที่ {student?.classNo} ·{" "}
                          {formatThaiDate(log.scannedAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[15px] font-bold">
                          {formatThaiTime(log.scannedAt).replace(" น.", "")}
                        </div>
                        <span
                          className={
                            log.isLate
                              ? "text-[11.5px] font-semibold text-risk-amber"
                              : "text-[11.5px] font-semibold text-risk-green"
                          }
                        >
                          {log.isLate ? "มาสาย" : "ตรงเวลา"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function MiniStat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <Card className={warn ? "border-amber-200" : undefined}>
      <CardContent className="p-4">
        <div className={warn ? "text-[12.5px] font-semibold text-risk-amber" : "text-[12.5px] font-semibold text-muted-foreground"}>
          {label}
        </div>
        <div className={warn ? "mt-1 text-xl font-bold text-risk-amber" : "mt-1 text-xl font-bold"}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
