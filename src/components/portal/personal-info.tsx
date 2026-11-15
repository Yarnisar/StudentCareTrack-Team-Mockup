"use client";

/**
 * ดูข้อมูลส่วนบุคคลของตนเอง (UC3) ใช้ร่วมกันระหว่างนักเรียนและผู้ปกครอง
 * - ผู้ปกครองเลือกบุตรหลานที่เชื่อมบัญชี ไม่มีบุตรหลานที่เชื่อมบัญชีแจ้งและไม่แสดงข้อมูล (ข้อ 2–3, Alt-A)
 * - ข้อมูลส่วนบุคคล โดยไม่แสดงผลคัดกรองและรายละเอียดกรณีช่วยเหลือ (ข้อ 4)
 * - ความประพฤติ: คะแนนปัจจุบัน สถานะเฝ้าระวัง และรายการ (กฎ คะแนน วันที่ ครูผู้บันทึก) รวมรายการของกฎที่ถูกยกเลิก (ข้อ 5)
 * - การแจ้งเตือน: เรียงใหม่ไปเก่า เปิดอ่านแล้วเปลี่ยนเป็นอ่านแล้ว (ข้อ 6)
 * ไม่แสดงเลขบัตรประชาชน เพราะไม่จำเป็นต่อการใช้งานของนักเรียนและผู้ปกครอง (2.1.10)
 */

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { recordScoreText, ruleKind } from "@/lib/behavior-rules";
import { formatThaiDate } from "@/lib/format";
import { buildNotifications } from "@/lib/portal-notifications";
import { useStore } from "@/lib/store";
import { CURRENT_TERM } from "@/lib/mock-data";
import { academicYearOfDate } from "@/lib/terms";

type Section = "info" | "behavior" | "notifications";

/** รายการข้อมูลทะเบียนของนักเรียน ใช้ทั้งในแท็บข้อมูลของผู้ปกครองและหน้าโปรไฟล์ของนักเรียน */
export function RegistryInfo({ studentId }: { studentId: string }) {
  const student = useStore().getStudent(studentId);
  if (!student) return null;
  return (
    <>
      <dl className="divide-y divide-border text-[13px]">
        {[
          ["เลขประจำตัวนักเรียน", student.studentId],
          ["ชั้น / ห้อง", `${student.roomName} เลขที่ ${student.classNo}`],
          ["ผู้ปกครอง", `${student.guardianName} (${student.guardianRelation})`],
          ["เบอร์ติดต่อ", student.guardianPhone],
          ["ที่อยู่", student.address],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-3 py-2">
            <dt className="w-32 shrink-0 text-muted-foreground">{k}</dt>
            <dd className="min-w-0 flex-1">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
        ข้อมูลมาจากงานทะเบียนของโรงเรียน หากไม่ถูกต้องแจ้งครูประจำชั้น
      </p>
    </>
  );
}

export function PersonalInfo({
  viewer,
  studentIds,
  hideInfo = false,
}: {
  viewer: "student" | "parent";
  studentIds: string[];
  /** นักเรียนดูข้อมูลทะเบียนที่หน้าโปรไฟล์ จึงซ่อนแท็บข้อมูลส่วนบุคคลไม่ให้ซ้ำ */
  hideInfo?: boolean;
}) {
  const store = useStore();
  const [studentId, setStudentId] = useState(studentIds[0] ?? "");
  const [section, setSection] = useState<Section>(hideInfo ? "behavior" : "info");
  const [opened, setOpened] = useState<string | null>(null);

  if (studentIds.length === 0)
    return (
      <p className="m-5 rounded-xl border border-dashed border-border p-4 text-center text-[13px] text-muted-foreground">
        ไม่พบบุตรหลานที่เชื่อมกับบัญชีนี้ ติดต่อครูประจำชั้นหรือฝ่ายทะเบียนเพื่อเชื่อมบัญชี
      </p>
    );

  const student = store.getStudent(studentId);
  if (!student) return null;

  // คะแนนเริ่มใหม่ทุกปีการศึกษา แสดงเฉพาะรายการของปีปัจจุบัน
  const behaviors = store.behaviorOf(studentId).filter((b) => academicYearOfDate(b.occurredAt) === CURRENT_TERM.academicYear);
  const score = store.behaviorScoreOf(studentId);
  const watchLevel = store.behaviorWatchLevelOf(studentId);
  const ceiling = store.behaviorScoreConfig.ceiling;
  const notifications = buildNotifications({
    viewer,
    behaviors,
    rules: store.behaviorRules,
    watchLevel,
    appointments: store.appointments.filter((a) => a.studentId === studentId),
    sdq: store.sdqOf(studentId),
    eq: store.eqOf(studentId),
    withdrawals: store.watchDecisions.filter((d) => d.studentId === studentId && d.withdraw),
    windows: store.assessmentWindows,
    room: student.roomName,
  });
  const unread = notifications.filter((n) => !store.readNotifications.includes(n.id)).length;

  const tabs: { key: Section; label: string }[] = [
    ...(hideInfo ? [] : [{ key: "info" as Section, label: "ข้อมูลส่วนบุคคล" }]),
    { key: "behavior", label: "ความประพฤติ" },
    { key: "notifications", label: unread > 0 ? `แจ้งเตือน (${unread})` : "แจ้งเตือน" },
  ];

  return (
    <div className="space-y-4 p-5">
      {viewer === "parent" && (
        <div>
          <div className="mb-1.5 text-[12px] text-muted-foreground">บุตรหลานที่เชื่อมบัญชี</div>
          <div className="flex flex-wrap gap-1.5">
            {studentIds.map((id) => {
              const s = store.getStudent(id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={id === studentId}
                  onClick={() => setStudentId(id)}
                  className={`rounded-lg border px-3 py-1.5 text-[13px] ${id === studentId ? "border-primary bg-accent font-semibold text-primary" : "border-border"}`}
                >
                  {s?.fullName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div role="tablist" className="flex rounded-xl bg-muted p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={section === t.key}
            onClick={() => setSection(t.key)}
            className={`flex-1 rounded-lg py-2 text-[12.5px] ${section === t.key ? "bg-card font-semibold shadow-sm" : "text-muted-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {section === "info" && (
        <Card>
          <CardContent className="p-5">
            <div className="text-[16px] font-bold">{student.fullName}</div>
            <div className="mt-3">
              <RegistryInfo studentId={studentId} />
            </div>
          </CardContent>
        </Card>
      )}

      {section === "behavior" && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-[12px] text-muted-foreground">คะแนนความประพฤติปัจจุบัน</div>
                <div className="text-[26px] leading-tight font-bold tabular-nums">
                  {score}
                  {ceiling !== null && <span className="text-[14px] font-normal text-muted-foreground"> / {ceiling}</span>}
                </div>
              </div>
              <span className="rounded-md bg-muted px-2.5 py-1 text-[12px] font-semibold">
                {watchLevel > 0 ? `เฝ้าระวังระดับ ${watchLevel}` : "ไม่อยู่ในสถานะเฝ้าระวัง"}
              </span>
            </div>
            <div className="mt-4 divide-y divide-border">
              {behaviors.map((b) => {
                const rule = store.behaviorRules.find((r) => r.ruleId === b.ruleId);
                const refer = rule ? ruleKind(rule) === "refer" : false;
                return (
                  <div key={b.recordId} className="flex items-start gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px]">
                        {rule?.name}
                        {(rule?.cancelled || b.cancelled) && (
                          <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                            {b.cancelled ? "ครูยกเลิกรายการนี้แล้ว" : "กฎถูกยกเลิก"}
                          </span>
                        )}
                      </div>
                      <div className="text-[11.5px] text-muted-foreground">
                        {formatThaiDate(b.occurredAt)} · บันทึกโดย {b.recordedByName}
                      </div>
                    </div>
                    <span className={`text-[13.5px] font-bold ${refer || rule?.cancelled || b.cancelled ? "text-muted-foreground" : ""} ${b.cancelled ? "line-through" : ""}`}>
                      {rule ? recordScoreText(b, rule) : ""}
                    </span>
                  </div>
                );
              })}
              {behaviors.length === 0 && <p className="py-3 text-[13px] text-muted-foreground">ยังไม่มีบันทึกความประพฤติ</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {section === "notifications" && (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {notifications.map((n) => {
              const read = store.readNotifications.includes(n.id);
              const open = opened === n.id;
              return (
                <button
                  key={n.id}
                  type="button"
                  aria-expanded={open}
                  onClick={() => {
                    setOpened(open ? null : n.id);
                    store.markNotificationRead(n.id);
                  }}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left"
                >
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${read ? "bg-transparent" : "bg-primary"}`} aria-label={read ? "อ่านแล้ว" : "ยังไม่อ่าน"} />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[13.5px] ${read ? "" : "font-semibold"}`}>{n.title}</span>
                    <span className="block text-[11.5px] text-muted-foreground">{formatThaiDate(n.at)}</span>
                    {open && <span className="mt-1 block text-[12.5px] leading-relaxed">{n.body}</span>}
                  </span>
                  <ChevronDown className={`mt-1 size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
              );
            })}
            {notifications.length === 0 && <p className="p-4 text-[13px] text-muted-foreground">ยังไม่มีการแจ้งเตือน</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
