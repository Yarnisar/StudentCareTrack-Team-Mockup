"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { fromDateInputs, toDateInputs } from "@/lib/home-visit-form";
import { addDaysThai, nowThaiIso } from "@/lib/format";
import { ANNUAL_VISIT_STATUS_LABEL, VISIT_TYPE_LABEL, type VisitType } from "@/lib/types";
import { AppointmentDateFields } from "./appointment-date-fields";

const CHOICE =
  "flex min-h-12 flex-1 items-center justify-center rounded-xl border px-3 py-2.5 text-[13.5px] font-semibold transition-colors";
const CHOICE_ON = "border-primary bg-accent text-primary";
const CHOICE_OFF = "border-border text-muted-foreground hover:bg-muted";

/**
 * สร้างนัดหมายเยี่ยมบ้าน — เลือกนักเรียน ประเภท (ประจำปี / เยี่ยมเพิ่ม) case ที่เกี่ยวข้อง และวันเวลา
 * ผู้เรียกต้องแสดงเฉพาะเมื่อช่วงดำเนินงานเยี่ยมบ้านเปิดอยู่ (store ตรวจซ้ำอีกครั้ง)
 */
export function CreateAppointmentForm({
  onCreated,
  onClose,
}: {
  onCreated: (appointmentId: string) => void;
  onClose: () => void;
}) {
  const store = useStore();
  const students = store.students.filter((s) => s.status === "studying" && store.canEdit(s.studentId));

  const firstUnscheduled =
    students.find((s) => store.annualVisitStatusOf(s.studentId) === "none") ?? students[0];
  const [studentId, setStudentId] = useState(firstUnscheduled?.studentId ?? "");
  const hasAnnual = (id: string) => !!store.annualAppointmentOf(id);
  const [visitType, setVisitType] = useState<VisitType>(
    firstUnscheduled && hasAnnual(firstUnscheduled.studentId) ? "follow_up" : "annual"
  );
  const [linkCase, setLinkCase] = useState(true);
  const defaults = toDateInputs(`${addDaysThai(nowThaiIso().split("T")[0], 3)}T15:30:00`);
  const [date, setDate] = useState(defaults.date);
  const [time, setTime] = useState(defaults.time);
  const [error, setError] = useState<string | null>(null);

  const activeCase = (() => {
    const c = studentId ? store.caseOf(studentId) : undefined;
    return c && c.status === "active" ? c : undefined;
  })();
  const annualTaken = studentId ? hasAnnual(studentId) : false;

  const chooseStudent = (id: string) => {
    setStudentId(id);
    setVisitType(hasAnnual(id) ? "follow_up" : "annual");
    setLinkCase(true);
    setError(null);
  };

  const submit = () => {
    const result = store.createAppointment({
      studentId,
      visitType,
      caseId: visitType === "follow_up" && linkCase ? (activeCase?.caseId ?? null) : null,
      proposedDate: fromDateInputs(date, time),
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onCreated(result.value.appointmentId);
  };

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[15.5px] font-bold">สร้างนัดหมายเยี่ยมบ้าน</h2>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              ระบบแจ้งผู้ปกครองทุกคนของนักเรียนให้ยืนยันนัดหมาย
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hv-student" className="text-[12.5px] text-muted-foreground">
            นักเรียน
          </Label>
          <select
            id="hv-student"
            value={studentId}
            onChange={(e) => chooseStudent(e.target.value)}
            className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-[13.5px]"
          >
            {students.map((s) => (
              <option key={s.studentId} value={s.studentId}>
                {s.fullName} ({s.roomName} เลขที่ {s.classNo}) — ประจำปี:{" "}
                {ANNUAL_VISIT_STATUS_LABEL[store.annualVisitStatusOf(s.studentId)]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-[12.5px] text-muted-foreground">ประเภทการเยี่ยม</Label>
          <div className="mt-1.5 flex gap-2">
            {(["annual", "follow_up"] as VisitType[]).map((t) => {
              const disabled = t === "annual" && annualTaken;
              return (
                <button
                  key={t}
                  type="button"
                  disabled={disabled}
                  onClick={() => setVisitType(t)}
                  className={`${CHOICE} ${visitType === t ? CHOICE_ON : CHOICE_OFF} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {VISIT_TYPE_LABEL[t]}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[12px] text-muted-foreground">
            {annualTaken
              ? "นักเรียนคนนี้มีนัดเยี่ยมบ้านประจำปีของปีการศึกษานี้แล้ว (ปีละ 1 ครั้ง) — สร้างได้เฉพาะการเยี่ยมเพิ่ม"
              : visitType === "annual"
                ? "นักเรียนทุกคนต้องได้รับการเยี่ยมบ้านประจำปี ปีการศึกษาละ 1 ครั้ง"
                : "เยี่ยมเพิ่มไม่บังคับ สำหรับนักเรียนที่มี case เปิดอยู่ หรือที่ครูประจำชั้นเลือกเอง"}
          </p>
        </div>

        {visitType === "follow_up" && (
          <div className="rounded-xl border border-border bg-surface p-4">
            {activeCase ? (
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[13.5px]">
                <input
                  type="checkbox"
                  checked={linkCase}
                  onChange={(e) => setLinkCase(e.target.checked)}
                  className="size-5 accent-[var(--primary)]"
                />
                <span>
                  เยี่ยมเพื่อติดตาม care case ที่เปิดอยู่{" "}
                  <b className="font-semibold">{activeCase.caseId}</b>
                </span>
              </label>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                นักเรียนคนนี้ไม่มี care case ที่เปิดอยู่ — บันทึกเป็นการเยี่ยมเพิ่มที่ครูประจำชั้นเลือกเอง
              </p>
            )}
          </div>
        )}

        <AppointmentDateFields
          idPrefix="hv-new"
          date={date}
          time={time}
          onDate={setDate}
          onTime={setTime}
        />

        {error && (
          <p className="rounded-lg bg-risk-red-bg px-3.5 py-2.5 text-[13px] font-medium text-risk-red">{error}</p>
        )}

        <div className="flex justify-end gap-2.5">
          <Button variant="outline" className="h-11" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button className="h-11" onClick={submit} disabled={!studentId}>
            สร้างนัดหมายและแจ้งผู้ปกครอง
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
