"use client";

import { useState } from "react";
import { Home, User } from "lucide-react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { usePortalStudent } from "@/lib/portal";
import { ChildSwitcher } from "@/components/portal/child-switcher";
import { formatThaiDate, formatThaiTime } from "@/lib/format";
import { openAppointmentOf } from "@/components/portal/portal-data";
import { APPOINTMENT_STATUS_LABEL, VISIT_TYPE_LABEL } from "@/lib/types";


/** เปลี่ยนบุตรหลานแล้วเริ่มฟอร์มใหม่ ไม่ให้ค่าที่กรอกค้างไปอยู่กับอีกคน */
export default function ParentAppointmentPage() {
  const { studentId } = usePortalStudent();
  return <ParentAppointmentPageContent key={studentId ?? "none"} />;
}

function ParentAppointmentPageContent() {
  const store = useStore();
  const portalStudentId = usePortalStudent().studentId ?? "";
  const student = store.getStudent(portalStudentId);
  const appointment = openAppointmentOf(store, portalStudentId);
  // ที่อยู่แสดงเฉพาะผู้ปกครองของนักเรียนคนนี้
  const isGuardian = store.guardiansOf(portalStudentId).some((g) => g.user.userId === store.currentUser.userId);

  const [phone, setPhone] = useState(appointment?.guardianPhone ?? "");
  const [awayStayWith, setAwayStayWith] = useState(appointment?.awayStayWith ?? "");
  const [note, setNote] = useState(appointment?.guardianNote ?? "");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const respond = (status: "confirmed" | "reschedule_requested") => {
    if (!appointment) return;
    const res = store.setAppointmentStatus(appointment.appointmentId, status);
    setError(res.ok ? null : res.error);
  };

  if (!student || !appointment) {
    return (
      <MobileShell title="นัดหมายเยี่ยมบ้าน" role="parent" back="/portal/parent">
        <div className="space-y-4 p-5">
          <ChildSwitcher />
          <p className="text-sm text-muted-foreground">ยังไม่มีนัดหมาย</p>
        </div>
      </MobileShell>
    );
  }

  const confirmed = appointment.status === "confirmed";
  const pending = appointment.status === "pending";

  return (
    <MobileShell title="นัดหมายเยี่ยมบ้าน" role="parent" back="/portal/parent">
      <div className="space-y-4 p-5">
        <ChildSwitcher />
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-muted-foreground">
                {VISIT_TYPE_LABEL[appointment.visitType]}
              </span>
              <span
                className={
                  confirmed
                    ? "rounded-full bg-risk-green-bg px-2.5 py-1 text-[12px] font-semibold text-risk-green"
                    : "rounded-full bg-risk-amber-bg px-2.5 py-1 text-[12px] font-semibold text-risk-amber"
                }
              >
                {APPOINTMENT_STATUS_LABEL[appointment.status]}
              </span>
            </div>

            <div className="mt-3 text-xl font-bold">
              {formatThaiDate(appointment.proposedDate)}
            </div>
            <div className="mt-0.5 text-base font-semibold text-primary">
              เวลา {formatThaiTime(appointment.proposedDate)}
            </div>

            <div className="my-4 h-px bg-border" />

            <div className="space-y-2.5">
              <Row icon={<User className="size-4" />} title={store.nameOf(appointment.teacherId)} sub="ครูประจำชั้น" />
              {isGuardian && (
                <Row icon={<Home className="size-4" />} title={student.address} sub="ที่อยู่" />
              )}
            </div>
          </CardContent>
        </Card>

        {pending && (
          <div className="flex gap-2.5">
            <Button variant="outline" className="h-13 flex-1" onClick={() => respond("reschedule_requested")}>
              ขอเปลี่ยนวันเวลา
            </Button>
            <Button
              className="h-13 flex-[1.2] bg-risk-green hover:bg-risk-green/90"
              onClick={() => respond("confirmed")}
            >
              ยืนยันนัดหมาย
            </Button>
          </div>
        )}
        {appointment.status === "reschedule_requested" && (
          <p className="rounded-xl bg-risk-amber-bg px-3.5 py-2.5 text-[12px] text-risk-amber">
            ส่งคำขอแล้ว รอครูเสนอวันใหม่
          </p>
        )}
        {error && <p className="text-[12px] font-semibold text-risk-red">{error}</p>}

        <Card>
          <CardContent className="p-5">
            <h2 className="text-[15px] font-bold">ข้อมูลถึงครู</h2>
            <p className="mt-1 mb-4 text-[12px] text-muted-foreground">ไม่บังคับ</p>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">เบอร์ติดต่อที่สะดวก</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="away-stay-with">ช่วงที่ไม่อยู่บ้าน นักเรียนอยู่กับใคร</Label>
                <Input
                  id="away-stay-with"
                  value={awayStayWith}
                  onChange={(e) => setAwayStayWith(e.target.value)}
                  placeholder="เช่น ยาย (นางบุญมา สายใจ)"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="note">สิ่งที่อยากให้ครูช่วยเหลือ</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder="เช่น อยากขอคำแนะนำเรื่องทุนการศึกษา"
                />
              </div>

              <Button
                className="h-13 w-full"
                onClick={() => {
                  const res = store.saveGuardianInfo(appointment.appointmentId, {
                    guardianPhone: phone,
                    awayStayWith,
                    guardianNote: note,
                  });
                  setError(res.ok ? null : res.error);
                  if (!res.ok) return;
                  setSent(true);
                  setTimeout(() => setSent(false), 2500);
                }}
              >
                ส่งข้อมูลให้ครู
              </Button>

              {sent && (
                <p className="rounded-lg bg-risk-green-bg px-3 py-2 text-center text-[12px] font-semibold text-risk-green">
                  ส่งให้ครูแล้ว
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileShell>
  );
}

function Row({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold">{title}</div>
        <div className="text-[12px] text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}
