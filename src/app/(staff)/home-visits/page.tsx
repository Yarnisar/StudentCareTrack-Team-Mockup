"use client";

import { useState } from "react";
import { CalendarClock, Check, Eye, Plus, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AnnualVisitSummary } from "@/components/home-visit/annual-visit-summary";
import { AppointmentDateFields } from "@/components/home-visit/appointment-date-fields";
import { CreateAppointmentForm } from "@/components/home-visit/create-appointment-form";
import { VisitRecordSummary } from "@/components/home-visit/visit-record-summary";
import { WindowNotice } from "@/components/shared/window-notice";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSensitiveView, useStore } from "@/lib/store";
import { formatThaiDate, formatThaiTime } from "@/lib/format";
import { fromDateInputs, toDateInputs } from "@/lib/home-visit-form";
import {
  APPOINTMENT_STATUS_LABEL,
  VISIT_TYPE_LABEL,
  type AppointmentStatus,
  type HomeVisitAppointment,
} from "@/lib/types";

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  pending: "bg-risk-amber-bg text-risk-amber",
  confirmed: "bg-risk-green-bg text-risk-green",
  reschedule_requested: "bg-risk-amber-bg text-risk-amber",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-risk-red-bg text-risk-red",
};

type Panel = "none" | "reschedule" | "cancel";

export default function HomeVisitsPage() {
  const store = useStore();
  const windowOpen = store.isWindowOpen("home_visit");

  // ครูประจำชั้น/แอดมินเห็นนัดของนักเรียนในความดูแล · ครูประจำชั้นคนเดิมเห็นเฉพาะนัดที่ตัวเองสร้าง
  const visible = store.appointments
    .filter((a) => store.canSeeSensitive(a.studentId) || store.canViewRecord(a.studentId, a.teacherId))
    .sort((a, b) => b.proposedDate.localeCompare(a.proposedDate));

  const [selected, setSelected] = useState(
    () => visible.find((a) => a.status !== "completed" && a.status !== "cancelled")?.appointmentId ?? visible[0]?.appointmentId ?? ""
  );
  const [creating, setCreating] = useState(false);

  const appointment = visible.find((a) => a.appointmentId === selected);
  const student = appointment ? store.getStudent(appointment.studentId) : undefined;

  // แอดมิน/ผู้บริหารเปิดข้อมูลเยี่ยมบ้านรายคน → VIEW_SENSITIVE (ข้ามเองถ้าไม่ใช่แอดมิน)
  useSensitiveView("home_visit_appointments", selected, { note: "เปิดข้อมูลการเยี่ยมบ้าน" });

  return (
    <>
      <PageHeader
        title="จัดการการเยี่ยมบ้าน"
        subtitle="นัดหมาย ยืนยัน และบันทึกผลตามแบบฟอร์มการเยี่ยมบ้านนักเรียน"
        action={
          <Button size="sm" variant="outline" disabled={!windowOpen} onClick={() => setCreating(true)}>
            <Plus className="size-4" /> สร้างนัดหมาย
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="space-y-5">
          <WindowNotice activity="home_visit" />
          <AnnualVisitSummary />

          {creating && windowOpen && (
            <CreateAppointmentForm
              onClose={() => setCreating(false)}
              onCreated={(id) => {
                setCreating(false);
                setSelected(id);
              }}
            />
          )}

          <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
            <Card className="h-fit">
              <CardContent className="p-5">
                <h2 className="mb-3 text-[15px] font-bold">นัดหมายทั้งหมด</h2>
                <div className="space-y-2">
                  {visible.length === 0 && (
                    <p className="text-[13px] text-muted-foreground">ยังไม่มีนัดหมายเยี่ยมบ้าน</p>
                  )}
                  {visible.map((a) => {
                    const s = store.getStudent(a.studentId);
                    const active = a.appointmentId === selected;
                    const draft = store.recordOfAppointment(a.appointmentId);
                    return (
                      <button
                        key={a.appointmentId}
                        onClick={() => setSelected(a.appointmentId)}
                        className={
                          active
                            ? "w-full rounded-xl border border-primary bg-accent p-3 text-left"
                            : "w-full rounded-xl border border-border p-3 text-left hover:bg-muted/50"
                        }
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13.5px] font-semibold">{s?.fullName}</span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[a.status]}`}
                          >
                            {APPOINTMENT_STATUS_LABEL[a.status]}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-2 text-[11.5px] text-muted-foreground">
                          <span>
                            {formatThaiDate(a.proposedDate)} {formatThaiTime(a.proposedDate)}
                          </span>
                          <span>· {VISIT_TYPE_LABEL[a.visitType]} {a.academicYear}</span>
                          {draft && !draft.signedAt && <span className="text-risk-amber">· มีร่างบันทึก</span>}
                          {draft?.cannotAccessHome && draft.signedAt && <span>· เข้าบ้านไม่ได้</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {appointment && student ? (
              <AppointmentDetail key={appointment.appointmentId} appointment={appointment} />
            ) : (
              <Card>
                <CardContent className="p-10 text-center text-sm text-muted-foreground">
                  เลือกนัดหมายจากรายการ
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function AppointmentDetail({ appointment }: { appointment: HomeVisitAppointment }) {
  const store = useStore();
  const student = store.getStudent(appointment.studentId)!;
  const record = store.recordOfAppointment(appointment.appointmentId);
  const block = store.homeVisitBlockReason(appointment.studentId);
  const open = appointment.status !== "completed" && appointment.status !== "cancelled";
  const canRecord = !block && appointment.status === "confirmed" && !record?.signedAt;
  const sensitive = store.canSeeSensitive(appointment.studentId);

  const [panel, setPanel] = useState<Panel>("none");
  const initial = toDateInputs(appointment.proposedDate);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reschedule = () => {
    const result = store.rescheduleAppointment(appointment.appointmentId, fromDateInputs(date, time));
    if (!result.ok) return setError(result.error);
    setError(null);
    setPanel("none");
  };
  const cancel = () => {
    const result = store.cancelAppointment(appointment.appointmentId, reason);
    if (!result.ok) return setError(result.error);
    setError(null);
    setPanel("none");
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold">{student.fullName}</h2>
              <p className="mt-1 text-[13.5px] text-muted-foreground">
                {student.roomName} เลขที่ {student.classNo} · นัดหมาย{" "}
                {formatThaiDate(appointment.proposedDate)} {formatThaiTime(appointment.proposedDate)} · ครูผู้นัด{" "}
                {store.nameOf(appointment.teacherId)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[12px]">
                <span className="rounded-md bg-surface px-2 py-0.5 font-semibold">
                  {VISIT_TYPE_LABEL[appointment.visitType]} · ปีการศึกษา {appointment.academicYear}
                </span>
                {appointment.caseId && (
                  <span className="rounded-md bg-accent px-2 py-0.5 font-semibold text-primary">
                    ติดตาม case {appointment.caseId}
                  </span>
                )}
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${STATUS_STYLE[appointment.status]}`}
            >
              {APPOINTMENT_STATUS_LABEL[appointment.status]}
            </span>
          </div>

          {appointment.status === "cancelled" && appointment.cancelReason && (
            <p className="rounded-lg bg-risk-red-bg px-3.5 py-2.5 text-[13px] text-risk-red">
              เหตุผลการยกเลิก: {appointment.cancelReason}
            </p>
          )}
          {appointment.status === "reschedule_requested" && (
            <p className="rounded-lg bg-risk-amber-bg px-3.5 py-2.5 text-[13px] text-risk-amber">
              ผู้ปกครองขอเปลี่ยนวันเวลา — กด “เลื่อนนัด” เพื่อเสนอวันใหม่ ระบบจะแจ้งผู้ปกครองทุกคน
            </p>
          )}

          <div className="flex flex-wrap gap-2.5">
            {record?.signedAt ? (
              <LinkButton variant="outline" className="h-11" href={`/home-visits/${appointment.appointmentId}/record`}>
                <Eye className="size-4" /> ดูแบบบันทึกที่รับรองแล้ว
              </LinkButton>
            ) : canRecord ? (
              <LinkButton className="h-11" href={`/home-visits/${appointment.appointmentId}/record`}>
                <Check className="size-4" /> {record ? "บันทึกผลต่อจากร่าง" : "บันทึกผลการเยี่ยมบ้าน"}
              </LinkButton>
            ) : record ? (
              <LinkButton variant="outline" className="h-11" href={`/home-visits/${appointment.appointmentId}/record`}>
                <Eye className="size-4" /> ดูร่างบันทึก
              </LinkButton>
            ) : null}
            {open && !block && !record?.signedAt && (
              <>
                <Button variant="outline" className="h-11" onClick={() => setPanel(panel === "reschedule" ? "none" : "reschedule")}>
                  <CalendarClock className="size-4" /> เลื่อนนัด
                </Button>
                <Button variant="outline" className="h-11" onClick={() => setPanel(panel === "cancel" ? "none" : "cancel")}>
                  <XCircle className="size-4" /> ยกเลิกนัด
                </Button>
              </>
            )}
          </div>
          {open && block && <p className="text-[12.5px] text-muted-foreground">{block} — ดูข้อมูลได้ แต่บันทึกไม่ได้</p>}
          {!block && (appointment.status === "pending" || appointment.status === "reschedule_requested") && (
            <p className="text-[12.5px] text-muted-foreground">รอผู้ปกครองยืนยันนัดหมายก่อนจึงจะบันทึกผลได้</p>
          )}

          {panel === "reschedule" && (
            <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
              <AppointmentDateFields idPrefix="hv-move" date={date} time={time} onDate={setDate} onTime={setTime} />
              <div className="flex justify-end">
                <Button className="h-11" onClick={reschedule}>
                  บันทึกวันใหม่และแจ้งผู้ปกครอง
                </Button>
              </div>
            </div>
          )}
          {panel === "cancel" && (
            <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
              <Label htmlFor="hv-cancel" className="text-[12.5px] text-muted-foreground">
                เหตุผลการยกเลิก (บังคับ) — นัดหมายยังอยู่ในระบบ ไม่ถูกลบ
              </Label>
              <Textarea id="hv-cancel" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
              <div className="flex justify-end">
                <Button variant="destructive" className="h-11" onClick={cancel}>
                  ยืนยันยกเลิกนัด
                </Button>
              </div>
            </div>
          )}
          {error && (
            <p className="rounded-lg bg-risk-red-bg px-3.5 py-2.5 text-[13px] font-medium text-risk-red">{error}</p>
          )}
        </CardContent>
      </Card>

      {sensitive && (appointment.guardianNote || appointment.guardianPhone || appointment.awayStayWith) && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-[15.5px] font-bold">ข้อมูลที่ผู้ปกครองให้ไว้ล่วงหน้า</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="เบอร์ติดต่อที่สะดวก" value={appointment.guardianPhone || "-"} />
              <Field label="เมื่อผู้ปกครองไม่อยู่บ้าน นักเรียนอยู่กับใคร" value={appointment.awayStayWith || "-"} />
            </div>
            <div className="mt-3">
              <Field label="สิ่งที่อยากให้ครูช่วยเหลือ" value={appointment.guardianNote || "-"} />
            </div>
          </CardContent>
        </Card>
      )}

      {record ? (
        <VisitRecordSummary record={record} />
      ) : (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            ยังไม่มีการบันทึกผลการเยี่ยมบ้านสำหรับนัดหมายนี้
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-[12.5px] text-muted-foreground">{label}</Label>
      <div className="mt-1.5 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[13.5px]">{value}</div>
    </div>
  );
}
