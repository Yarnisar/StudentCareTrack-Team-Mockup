"use client";

import { useState } from "react";
import { Camera, Check, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { draftKey, useStore } from "@/lib/store";
import { formatBaht, formatThaiDate, formatThaiTime } from "@/lib/format";
import { APPOINTMENT_STATUS_LABEL, AppointmentStatus } from "@/lib/types";
import { formatCaretaker } from "@/lib/home-visit-form";

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  pending: "bg-risk-amber-bg text-risk-amber",
  confirmed: "bg-risk-green-bg text-risk-green",
  reschedule_requested: "bg-risk-amber-bg text-risk-amber",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-risk-red-bg text-risk-red",
};

export default function HomeVisitsPage() {
  const store = useStore();
  const [selected, setSelected] = useState(store.appointments[0]?.appointmentId ?? "");

  const appointment = store.appointments.find((a) => a.appointmentId === selected);
  const student = appointment ? store.getStudent(appointment.studentId) : undefined;
  const record = store.homeVisitRecords.find((r) => r.appointmentId === selected);
  const hasDraft = store.getDraft(draftKey("home_visit", selected)) !== undefined;
  const recordLabel = hasDraft ? "ทำต่อจากร่างที่บันทึกไว้" : "บันทึกผลการเยี่ยมบ้าน";

  const totalIncome = record?.householdMembers.reduce((s, m) => s + m.monthlyIncome, 0) ?? 0;
  const perCapita = record ? Math.round(totalIncome / record.householdMembers.length) : 0;

  return (
    <>
      <PageHeader
        title="จัดการการเยี่ยมบ้าน"
        subtitle="นัดหมาย ยืนยัน และบันทึกผลตามแบบฟอร์มการเยี่ยมบ้านนักเรียน"
        action={
          <Button size="sm" variant="outline">
            <Plus className="size-4" /> สร้างนัดหมาย
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
          <Card className="h-fit">
            <CardContent className="p-5">
              <h2 className="mb-3 text-[15px] font-bold">นัดหมายทั้งหมด</h2>
              <div className="space-y-2">
                {store.appointments.map((a) => {
                  const s = store.getStudent(a.studentId);
                  const active = a.appointmentId === selected;
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
                      <div className="mt-1 text-[11.5px] text-muted-foreground">
                        {formatThaiDate(a.proposedDate)} {formatThaiTime(a.proposedDate)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {appointment && student ? (
            <div className="space-y-5">
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold">{student.fullName}</h2>
                    <p className="mt-1 text-[13.5px] text-muted-foreground">
                      {student.roomName} เลขที่ {student.classNo} · นัดหมาย{" "}
                      {formatThaiDate(appointment.proposedDate)}{" "}
                      {formatThaiTime(appointment.proposedDate)} · ครูผู้เยี่ยม{" "}
                      {appointment.teacherName}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${STATUS_STYLE[appointment.status]}`}
                  >
                    {APPOINTMENT_STATUS_LABEL[appointment.status]}
                  </span>
                  {appointment.status === "confirmed" && (
                    <LinkButton href={`/home-visits/${appointment.appointmentId}/record`}>
                      <Check className="size-4" /> {recordLabel}
                    </LinkButton>
                  )}
                </CardContent>
              </Card>

              {appointment.guardianNote && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-[15.5px] font-bold">ข้อมูลที่ผู้ปกครองให้ไว้ล่วงหน้า</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Field label="เบอร์ติดต่อที่สะดวก" value={appointment.guardianPhone ?? "-"} />
                      <Field label="ผู้ดูแลหลักกรณีไม่อยู่บ้าน" value={formatCaretaker(appointment.caretakerRelation, appointment.caretakerName) || "-"} />
                    </div>
                    <div className="mt-3">
                      <Field label="สิ่งที่อยากให้ครูช่วยเหลือ" value={appointment.guardianNote} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {record ? (
                <>
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="mb-3 text-[15.5px] font-bold">สมาชิกครัวเรือนและรายได้</h3>
                      <div className="overflow-hidden rounded-xl border border-border">
                        <div className="flex bg-surface px-4 py-2.5 text-[12.5px] font-semibold text-muted-foreground">
                          <span className="w-36">ความสัมพันธ์</span>
                          <span className="w-20">อายุ</span>
                          <span className="flex-1">อาชีพ</span>
                          <span className="w-32 text-right">รายได้ (บาท/เดือน)</span>
                        </div>
                        {record.householdMembers.map((m) => (
                          <div
                            key={m.memberId}
                            className="flex border-t border-border px-4 py-2.5 text-[13.5px]"
                          >
                            <span className="w-36">{m.relation}</span>
                            <span className="w-20">{m.age}</span>
                            <span className="flex-1">{m.occupation}</span>
                            <span className="w-32 text-right">{formatBaht(m.monthlyIncome)}</span>
                          </div>
                        ))}
                        <div className="flex border-t border-border bg-risk-amber-bg px-4 py-2.5 text-[13.5px] font-bold text-risk-amber">
                          <span className="flex-1">รายได้เฉลี่ยต่อคนต่อเดือน</span>
                          <span className="w-32 text-right">{formatBaht(perCapita)} บาท</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="mb-3 text-[15.5px] font-bold">ความเสี่ยงที่พบ</h3>
                        <ul className="space-y-2">
                          {record.riskFindings.map((f) => (
                            <li key={f} className="flex gap-2.5 text-[13.5px]">
                              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-risk-amber" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4 border-t border-border pt-3 text-[13px] text-muted-foreground">
                          ผู้ให้ข้อมูล: {record.informantName} ({record.informantRelation}) ·
                          รับรองโดย {record.signedBy} เมื่อ {formatThaiDate(record.signedAt)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <h3 className="mb-3 text-[15.5px] font-bold">ภาพถ่ายที่อยู่อาศัย</h3>
                        <div className="flex gap-3">
                          {record.photoLabels.map((label) => (
                            <div
                              key={label}
                              className="flex h-32 flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface"
                            >
                              <Camera className="size-6 text-muted-foreground" />
                              <span className="text-[12.5px] text-muted-foreground">{label}</span>
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
                          กรณีเข้าเยี่ยมที่บ้านไม่ได้ ให้ใช้ภาพนักเรียนคู่กับป้ายโรงเรียนแทน
                          พร้อมระบุเหตุผล
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="p-10 text-center">
                    <p className="text-sm text-muted-foreground">
                      ยังไม่มีการบันทึกผลการเยี่ยมบ้านสำหรับนัดหมายนี้
                    </p>
                    {appointment.status === "confirmed" ? (
                      <LinkButton
                        className="mt-4"
                        href={`/home-visits/${appointment.appointmentId}/record`}
                      >
                        {hasDraft ? "ทำต่อจากร่างที่บันทึกไว้" : "เปิดแบบฟอร์มบันทึกผลการเยี่ยมบ้าน"}
                      </LinkButton>
                    ) : (
                      <Button className="mt-4" disabled>
                        เปิดแบบฟอร์มบันทึกผลการเยี่ยมบ้าน
                      </Button>
                    )}
                    {appointment.status === "pending" && (
                      <p className="mt-2 text-[12.5px] text-muted-foreground">
                        รอผู้ปกครองยืนยันนัดหมายก่อนจึงจะบันทึกผลได้
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                ยังไม่มีนัดหมายเยี่ยมบ้าน
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-[12.5px] text-muted-foreground">{label}</Label>
      <div className="mt-1.5 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[13.5px]">
        {value}
      </div>
    </div>
  );
}
