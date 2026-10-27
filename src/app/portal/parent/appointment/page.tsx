"use client";

import { useState } from "react";
import { Home, User } from "lucide-react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { formatThaiDate, formatThaiTime } from "@/lib/format";
import { APPOINTMENT_STATUS_LABEL } from "@/lib/types";
import { CARETAKER_RELATION_OPTIONS } from "@/lib/home-visit-form";

const DEMO_STUDENT_ID = "30125";

export default function ParentAppointmentPage() {
  const store = useStore();
  const student = store.getStudent(DEMO_STUDENT_ID);
  const appointment = store.appointments.find(
    (a) => a.studentId === DEMO_STUDENT_ID && a.status !== "completed"
  );

  const [phone, setPhone] = useState(appointment?.guardianPhone ?? "");
  const [caretakerRelation, setCaretakerRelation] = useState(appointment?.caretakerRelation ?? "");
  const [caretaker, setCaretaker] = useState(appointment?.caretakerName ?? "");
  const [note, setNote] = useState(appointment?.guardianNote ?? "");
  const [sent, setSent] = useState(false);

  if (!student || !appointment) {
    return (
      <MobileShell title="นัดหมายเยี่ยมบ้าน" role="parent" back="/portal/parent">
        <p className="p-6 text-sm text-muted-foreground">ยังไม่มีนัดหมายเยี่ยมบ้านในขณะนี้</p>
      </MobileShell>
    );
  }

  const confirmed = appointment.status === "confirmed";

  return (
    <MobileShell title="นัดหมายเยี่ยมบ้าน" role="parent" back="/portal/parent">
      <div className="space-y-4 p-5">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-muted-foreground">
                นัดหมายเยี่ยมบ้าน
              </span>
              <span
                className={
                  confirmed
                    ? "rounded-full bg-risk-green-bg px-2.5 py-1 text-[11.5px] font-semibold text-risk-green"
                    : "rounded-full bg-risk-amber-bg px-2.5 py-1 text-[11.5px] font-semibold text-risk-amber"
                }
              >
                {APPOINTMENT_STATUS_LABEL[appointment.status]}
              </span>
            </div>

            <div className="mt-3 text-[22px] font-bold">
              {formatThaiDate(appointment.proposedDate)}
            </div>
            <div className="mt-0.5 text-base font-semibold text-primary">
              เวลา {formatThaiTime(appointment.proposedDate)}
            </div>

            <div className="my-4 h-px bg-border" />

            <div className="space-y-2.5">
              <Row icon={<User className="size-4" />} title={appointment.teacherName} sub="ครูประจำชั้น" />
              <Row icon={<Home className="size-4" />} title={student.address} sub="ที่อยู่ตามทะเบียนนักเรียน" />
            </div>
          </CardContent>
        </Card>

        {!confirmed && (
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              className="h-13 flex-1"
              onClick={() =>
                store.setAppointmentStatus(appointment.appointmentId, "reschedule_requested")
              }
            >
              ขอเปลี่ยนวันเวลา
            </Button>
            <Button
              className="h-13 flex-[1.2] bg-risk-green hover:bg-risk-green/90"
              onClick={() => store.setAppointmentStatus(appointment.appointmentId, "confirmed")}
            >
              ยืนยันนัดหมาย
            </Button>
          </div>
        )}

        <Card>
          <CardContent className="p-5">
            <h2 className="text-[15px] font-bold">ข้อมูลประกอบการเยี่ยมบ้าน</h2>
            <p className="mt-1 mb-4 text-[12px] leading-relaxed text-muted-foreground">
              กรอกข้อมูลล่วงหน้าเพื่อให้ครูเตรียมตัวก่อนลงพื้นที่ (ไม่บังคับ)
            </p>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">เบอร์ติดต่อที่สะดวก</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="caretaker-relation">ผู้ดูแลหลักกรณีไม่อยู่บ้าน</Label>
                {/* เลือกจากรายการ ครูจึงได้ข้อ 5.3 ของแบบเยี่ยมบ้านโดยไม่ต้องเดาจากข้อความ */}
                <NativeSelect
                  id="caretaker-relation"
                  value={caretakerRelation}
                  onChange={(e) => setCaretakerRelation(e.target.value)}
                  className="h-11"
                >
                  <option value="">เลือกผู้ดูแล</option>
                  {CARETAKER_RELATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </NativeSelect>
                {caretakerRelation !== "" && caretakerRelation !== "นักเรียนอยู่บ้านเอง" && (
                  <Input
                    id="caretaker"
                    aria-label="ชื่อผู้ดูแล"
                    value={caretaker}
                    onChange={(e) => setCaretaker(e.target.value)}
                    placeholder={
                      caretakerRelation === "อื่น ๆ" ? "ระบุว่าเป็นใคร เช่น พี่เลี้ยง" : "ชื่อผู้ดูแล (ไม่บังคับ)"
                    }
                  />
                )}
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
                  store.saveGuardianInfo(appointment.appointmentId, {
                    guardianPhone: phone,
                    caretakerRelation,
                    caretakerName: caretakerRelation === "นักเรียนอยู่บ้านเอง" ? "" : caretaker,
                    guardianNote: note,
                  });
                  setSent(true);
                  setTimeout(() => setSent(false), 2500);
                }}
              >
                ส่งข้อมูลให้ครู
              </Button>

              {sent && (
                <p className="rounded-lg bg-risk-green-bg px-3 py-2 text-center text-[12.5px] font-semibold text-risk-green">
                  ส่งข้อมูลให้ครูประจำชั้นเรียบร้อยแล้ว
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
        <div className="truncate text-[13.5px] font-semibold">{title}</div>
        <div className="text-[11.5px] text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}
