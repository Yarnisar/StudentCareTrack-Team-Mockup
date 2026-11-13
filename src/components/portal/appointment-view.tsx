"use client";

/**
 * นัดหมายเยี่ยมบ้านฝั่งนักเรียนและผู้ปกครอง (UC4) ใช้ร่วมกันทั้งสองบทบาท
 * - สถานการณ์ C: ให้ข้อมูลติดต่อและเวลาที่สะดวก
 * - สถานการณ์ D: ยืนยันนัด (คนใดคนหนึ่งยืนยันได้) หรือขอเปลี่ยนวันพร้อมเหตุผล (Alt-C) วันเดิมยังมีผลระหว่างรอครูพิจารณา
 * - สถานการณ์ E: หลังครูบันทึกผล ยืนยันว่าได้เยี่ยมจริงภายในเวลาที่กำหนด หรือแจ้งว่าไม่ได้เยี่ยม (Alt-E)
 *   ยืนยันแล้วยังไม่ปิดงานจนครบกำหนด อีกฝ่ายยังแจ้งว่าไม่ได้เยี่ยมได้ (ข้อเสนอแก้ Scenario E ข้อ 6)
 * นัดที่ยกเลิกแล้วไม่แสดงปุ่มยืนยัน
 */

import { useState } from "react";
import { Home, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { formatThaiDate, formatThaiTime } from "@/lib/format";
import { CARETAKER_RELATION_OPTIONS } from "@/lib/home-visit-form";
import { DEMO_TODAY } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { AppointmentStatusBadge } from "@/components/shared/appointment-status";

const ACTIVE = ["pending", "confirmed", "reschedule_requested", "awaiting_visit_confirmation", "visit_confirmed", "visit_disputed"];
/** PROTOTYPE: ตัวเลือกเป็นข้อเสนอ */
const CONVENIENT_TIMES = ["หลังเลิกเรียน 15:30–17:00 น.", "หลัง 18:00 น.", "วันเสาร์–อาทิตย์"];
const TIMES = ["15:30", "16:00", "16:30", "17:00"];
const RESCHEDULE_REASONS = ["ผู้ปกครองติดธุระ", "ไม่มีผู้ใหญ่อยู่บ้านวันนั้น"];

const chip = (on: boolean) =>
  on
    ? "rounded-lg border border-primary bg-accent px-3 py-1.5 text-[13px] font-semibold text-primary"
    : "rounded-lg border border-border px-3 py-1.5 text-[13px]";

export function AppointmentView({ viewer, studentId }: { viewer: "student" | "parent"; studentId: string }) {
  const store = useStore();
  const student = store.getStudent(studentId);
  const appointment = store.appointments
    .filter((a) => a.studentId === studentId && ACTIVE.includes(a.status))
    .sort((a, b) => b.proposedDate.localeCompare(a.proposedDate))[0];
  const me = viewer === "parent" ? (student?.guardianName ?? "ผู้ปกครอง") : (student?.fullName ?? "นักเรียน");
  const window_ = store.assessmentWindows.find((w) => w.kind === "home_visit" && w.enabled);

  const [phone, setPhone] = useState(appointment?.guardianPhone ?? "");
  const [caretakerRelation, setCaretakerRelation] = useState(appointment?.caretakerRelation ?? "");
  const [caretaker, setCaretaker] = useState(appointment?.caretakerName ?? "");
  const [convenient, setConvenient] = useState(appointment?.convenientTime ?? "");
  const [note, setNote] = useState(appointment?.guardianNote ?? "");
  const [sent, setSent] = useState(false);
  const [asking, setAsking] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");

  if (!student || !appointment) return <p className="p-6 text-sm text-muted-foreground">ยังไม่มีนัดหมายเยี่ยมบ้านในขณะนี้</p>;

  const finalReason = reason === "อื่น ๆ" ? otherReason.trim() : reason;
  const dateOk = newDate !== "" && newDate > DEMO_TODAY && (!window_ || newDate <= window_.closeDate);
  const canAsk = dateOk && newTime !== "" && finalReason !== "";
  const editable = ["pending", "confirmed", "reschedule_requested"].includes(appointment.status);

  return (
    <div className="space-y-4 p-5">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-muted-foreground">นัดหมายเยี่ยมบ้าน</span>
            <AppointmentStatusBadge status={appointment.status} />
          </div>
          <div className="mt-3 text-[22px] font-bold">{formatThaiDate(appointment.proposedDate)}</div>
          <div className="mt-0.5 text-base font-semibold text-primary">เวลา {formatThaiTime(appointment.proposedDate)}</div>
          {appointment.confirmedBy && appointment.status === "confirmed" && (
            <div className="mt-1 text-[12px] text-muted-foreground">ยืนยันโดย {appointment.confirmedBy}</div>
          )}
          <div className="my-4 h-px bg-border" />
          <div className="space-y-2.5">
            <Row icon={<User className="size-4" />} title={appointment.teacherName} sub="ครูประจำชั้น" />
            <Row icon={<Home className="size-4" />} title={student.address} sub="ที่อยู่ตามทะเบียนนักเรียน" />
          </div>
        </CardContent>
      </Card>

      {appointment.status === "reschedule_requested" && appointment.reschedule && (
        <p className="rounded-xl bg-surface px-4 py-3 text-[13px]">
          ขอเปลี่ยนเป็น {formatThaiDate(appointment.reschedule.date)} {formatThaiTime(appointment.reschedule.date)} แล้ว รอครูพิจารณา ·
          วันนัดเดิมยังมีผลจนกว่าครูจะยืนยันวันใหม่
        </p>
      )}

      {(appointment.status === "pending" || appointment.status === "reschedule_requested") && !asking && (
        <div className="flex gap-2.5">
          {appointment.status === "pending" && (
            <Button variant="outline" className="h-12 flex-1" onClick={() => setAsking(true)}>
              ขอเปลี่ยนวันเวลา
            </Button>
          )}
          <Button className="h-12 flex-[1.2]" onClick={() => store.confirmAppointment(appointment.appointmentId, me)}>
            ยืนยันนัดหมาย{appointment.status === "reschedule_requested" && "วันเดิม"}
          </Button>
        </div>
      )}

      {asking && (
        <Card>
          <CardContent className="space-y-3 p-5">
            <h2 className="text-[15px] font-bold">ขอเปลี่ยนวันเวลา</h2>
            <div>
              <Label htmlFor="new-date">วันที่ต้องการ</Label>
              <Input
                id="new-date"
                type="date"
                value={newDate}
                min={DEMO_TODAY}
                max={window_?.closeDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="mt-1.5 h-11"
              />
              {newDate !== "" && !dateOk && (
                <p className="mt-1 text-[12px] text-destructive">เลือกวันหลังวันนี้ และไม่เกิน {formatThaiDate(window_?.closeDate ?? "")}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TIMES.map((t) => (
                <button key={t} type="button" aria-pressed={newTime === t} onClick={() => setNewTime(t)} className={chip(newTime === t)}>
                  {t} น.
                </button>
              ))}
            </div>
            <div>
              <div className="mb-1.5 text-[13px] font-medium">เหตุผล</div>
              <div className="flex flex-wrap gap-1.5">
                {[...RESCHEDULE_REASONS, "อื่น ๆ"].map((r) => (
                  <button key={r} type="button" aria-pressed={reason === r} onClick={() => setReason(r)} className={chip(reason === r)}>
                    {r}
                  </button>
                ))}
              </div>
              {reason === "อื่น ๆ" && (
                <Input aria-label="เหตุผลอื่น" value={otherReason} onChange={(e) => setOtherReason(e.target.value)} placeholder="ระบุเหตุผลสั้น ๆ" className="mt-2 h-11" />
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="h-11" onClick={() => setAsking(false)}>
                ยกเลิก
              </Button>
              <Button
                className="h-11 flex-1"
                disabled={!canAsk}
                onClick={() => {
                  store.requestReschedule(appointment.appointmentId, `${newDate}T${newTime}:00`, finalReason, me);
                  setAsking(false);
                }}
              >
                ส่งคำขอให้ครู
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {appointment.status === "awaiting_visit_confirmation" && (
        <Card>
          <CardContent className="p-5">
            <h2 className="text-[15px] font-bold">ครูบันทึกผลการเยี่ยมบ้านแล้ว</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              {appointment.teacherName} บันทึกว่าได้เยี่ยมบ้านเมื่อ {formatThaiDate(appointment.proposedDate)} กรุณายืนยันภายใน{" "}
              {formatThaiDate(appointment.visitConfirmDeadline ?? "")} (นักเรียนหรือผู้ปกครองคนใดคนหนึ่งยืนยันได้)
            </p>
            <div className="mt-4 flex gap-2.5">
              <Button
                variant="outline"
                className="h-12 flex-1"
                onClick={() => {
                  if (window.confirm("แจ้งครูว่าไม่ได้มีการเยี่ยมบ้านจริงใช่ไหม")) store.respondVisit(appointment.appointmentId, false, me);
                }}
              >
                ไม่ได้เยี่ยมจริง
              </Button>
              <Button className="h-12 flex-[1.2]" onClick={() => store.respondVisit(appointment.appointmentId, true, me)}>
                ยืนยันว่าได้เยี่ยมจริง
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {appointment.status === "visit_confirmed" && (
        <Card>
          <CardContent className="p-5">
            <h2 className="text-[15px] font-bold">ยืนยันว่าได้เยี่ยมบ้านจริงแล้ว</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              ยืนยันโดย {appointment.visitRespondedBy} · ปิดงานเมื่อครบกำหนด {formatThaiDate(appointment.visitConfirmDeadline ?? "")}
              {" "}ถ้าไม่ได้มีการเยี่ยมบ้านจริง ยังแจ้งครูได้จนถึงวันนั้น
            </p>
            <Button
              variant="outline"
              className="mt-4 h-11 w-full"
              onClick={() => {
                if (window.confirm("แจ้งครูว่าไม่ได้มีการเยี่ยมบ้านจริงใช่ไหม การยืนยันเดิมจะถูกยกเลิก")) store.respondVisit(appointment.appointmentId, false, me);
              }}
            >
              ไม่ได้เยี่ยมจริง
            </Button>
          </CardContent>
        </Card>
      )}

      {appointment.status === "visit_disputed" && (
        <p className="rounded-xl bg-surface px-4 py-3 text-[13px]">แจ้งครูแล้วว่าไม่ได้เยี่ยมบ้านจริง ครูจะตรวจสอบและนัดหมายใหม่</p>
      )}

      {editable && (
        <Card>
          <CardContent className="p-5">
            <h2 className="text-[15px] font-bold">ข้อมูลประกอบการเยี่ยมบ้าน</h2>
            <p className="mt-1 mb-4 text-[12px] leading-relaxed text-muted-foreground">กรอกล่วงหน้าเพื่อให้ครูเตรียมตัวก่อนลงพื้นที่ (ไม่บังคับ)</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">เบอร์ติดต่อที่สะดวก</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <div className="text-[13px] font-medium">เวลาที่สะดวก</div>
                <div className="flex flex-wrap gap-1.5">
                  {CONVENIENT_TIMES.map((t) => (
                    <button key={t} type="button" aria-pressed={convenient === t} onClick={() => setConvenient(convenient === t ? "" : t)} className={chip(convenient === t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="caretaker-relation">ผู้ดูแลหลักกรณีไม่อยู่บ้าน</Label>
                <NativeSelect id="caretaker-relation" value={caretakerRelation} onChange={(e) => setCaretakerRelation(e.target.value)} className="h-11">
                  <option value="">เลือกผู้ดูแล</option>
                  {CARETAKER_RELATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </NativeSelect>
                {caretakerRelation !== "" && caretakerRelation !== "นักเรียนอยู่บ้านเอง" && (
                  <Input
                    aria-label="ชื่อผู้ดูแล"
                    value={caretaker}
                    onChange={(e) => setCaretaker(e.target.value)}
                    placeholder={caretakerRelation === "อื่น ๆ" ? "ระบุว่าเป็นใคร เช่น พี่เลี้ยง" : "ชื่อผู้ดูแล (ไม่บังคับ)"}
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="note">สิ่งที่อยากให้ครูช่วยเหลือ</Label>
                <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="เช่น อยากขอคำแนะนำเรื่องทุนการศึกษา" />
              </div>
              <Button
                className="h-12 w-full"
                onClick={() => {
                  store.saveGuardianInfo(appointment.appointmentId, {
                    guardianPhone: phone,
                    caretakerRelation,
                    caretakerName: caretakerRelation === "นักเรียนอยู่บ้านเอง" ? "" : caretaker,
                    guardianNote: note,
                    convenientTime: convenient,
                  });
                  setSent(true);
                }}
              >
                ส่งข้อมูลให้ครู
              </Button>
              {sent && <p className="rounded-lg bg-accent px-3 py-2 text-center text-[12.5px] font-semibold text-primary">ส่งข้อมูลให้ครูประจำชั้นแล้ว</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <div className="truncate text-[13.5px] font-semibold">{title}</div>
        <div className="text-[11.5px] text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}
