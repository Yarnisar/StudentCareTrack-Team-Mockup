"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, History, Lock, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { FillSource, SOURCE_LABEL, SOURCE_STYLE } from "@/components/home-visit/field-shell";
import { pickInput, useRecordForm } from "@/components/home-visit/record/form-state";
import { StudentSection } from "@/components/home-visit/record/student-section";
import { HouseholdSection } from "@/components/home-visit/record/household-section";
import { FamilySection } from "@/components/home-visit/record/family-section";
import { RiskSection } from "@/components/home-visit/record/risk-section";
import { FriendsSection } from "@/components/home-visit/record/friends-section";
import { CertifySection } from "@/components/home-visit/record/certify-section";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Checkbox } from "@/components/ui/checkbox";
import { WindowNotice } from "@/components/shared/window-notice";
import { useDemoPageTool } from "@/lib/demo/page-tools";
import { useSensitiveView, useStore } from "@/lib/store";
import { formatThaiDate, formatThaiDateTime, nowThaiIso } from "@/lib/format";
import {
  buildDemoAutofill,
  CARRIED_FORM_KEYS,
  emptyRecordInput,
  inputFromPrevious,
  signBlockers,
} from "@/lib/home-visit-form";
import {
  VISIT_TYPE_LABEL,
  type HomeVisitRecordInput,
} from "@/lib/types";

/** หน่วงเวลาก่อนบันทึกร่างอัตโนมัติหลังหยุดแก้ไข (มิลลิวินาที) */
const AUTOSAVE_DELAY_MS = 20_000;

export default function HomeVisitRecordPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = use(params);
  const router = useRouter();
  const store = useStore();

  const appointment = store.appointments.find((a) => a.appointmentId === appointmentId);
  const student = appointment ? store.getStudent(appointment.studentId) : undefined;
  const screening = appointment ? store.latestScreening(appointment.studentId) : undefined;
  const existing = store.recordOfAppointment(appointmentId);
  const previous = appointment
    ? store.latestSignedVisitOf(appointment.studentId, appointmentId)
    : undefined;
  const guardians = student ? store.guardiansOf(student.studentId) : [];

  /* ---------------- ค่าเริ่มต้นที่ระบบกรอกให้อัตโนมัติ ---------------- */

  const autoFilled = ((): Map<string, FillSource> => {
    const map = new Map<string, FillSource>();
    if (!student) return map;

    // จากทะเบียนนักเรียน
    ["school", "studentName", "classRoom", "studentCitizenId", "guardianName", "guardianRelation", "address"].forEach(
      (k) => map.set(k, "registry")
    );
    // จากข้อมูลที่ผู้ปกครองกรอกล่วงหน้าผ่านระบบ
    if (appointment?.guardianPhone) map.set("guardianPhone", "guardian");
    if (appointment?.awayStayWith) map.set("awayStayWith", "guardian");
    if (appointment?.guardianNote) map.set("guardianConcern", "guardian");
    if (appointment?.guardianNote) map.set("supportRequests", "guardian");
    // จากการเยี่ยมบ้านครั้งก่อน (ที่รับรองแล้ว)
    if (previous) {
      ["livesWith", ...CARRIED_FORM_KEYS].forEach((k) => map.set(k, "previous"));
    }
    // จากผลการคัดกรอง 6 มิติ
    if (screening) {
      const flagged = screening.results.filter((r) => r.group !== "green").map((r) => r.dimension);
      if (flagged.includes("physical")) map.set("healthRisks", "screening");
      if (flagged.includes("welfare")) map.set("welfareRisks", "screening");
      if (flagged.includes("behavior")) map.set("gaming", "screening");
    }
    return map;
  })();

  const signed = !!existing?.signedAt;
  const block = appointment ? store.homeVisitBlockReason(appointment.studentId) : null;
  const notConfirmed = appointment ? appointment.status !== "confirmed" && !signed : true;
  const readOnly = signed || !!block || notConfirmed;
  const sensitive = appointment ? store.canSeeSensitive(appointment.studentId) : false;
  const canOpen =
    !!appointment &&
    (sensitive || store.canViewRecord(appointment.studentId, existing?.recordedBy ?? appointment.teacherId));

  const api = useRecordForm({
    initial: () => {
      if (existing) return structuredClone(pickInput(existing));
      const start = previous ? inputFromPrevious(pickInput(previous)) : emptyRecordInput();
      if (!appointment?.guardianNote) return start;
      // ข้อห่วงใยที่ผู้ปกครองกรอกล่วงหน้า → เติมให้เป็นค่าเริ่มต้น
      return {
        ...start,
        form: {
          ...start.form,
          guardianConcern: appointment.guardianNote,
          supportRequests: ["economic"],
        },
      };
    },
    readOnly,
    autoFilled,
    previous,
  });

  const [onlyEmpty, setOnlyEmpty] = useState(false);
  const [confirmSign, setConfirmSign] = useState(false);
  const [autoSavedAt, setAutoSavedAt] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  /** ข้อมูลที่จะบันทึก: เก็บเฉพาะภาพของกรณีที่เลือก (เข้าบ้านได้ / ไม่ได้) */
  const photoTypes = api.input.cannotAccessHome
    ? ["with_signboard"]
    : ["exterior", "interior"];
  const collected: HomeVisitRecordInput = {
    ...api.input,
    photos: api.input.photos.filter((p) => photoTypes.includes(p.photoType)),
  };
  const snapshot = JSON.stringify(collected);

  // บันทึกร่างอัตโนมัติเมื่อหยุดแก้ไข (ไม่รับรองให้ — ครูยังต้องกดรับรองเอง)
  const lastSavedRef = useRef<string | null>(null);
  if (lastSavedRef.current === null) lastSavedRef.current = snapshot;
  useEffect(() => {
    if (readOnly || snapshot === lastSavedRef.current) return;
    const timer = setTimeout(() => {
      const draft = JSON.parse(snapshot) as HomeVisitRecordInput;
      const result = store.saveHomeVisitRecord(appointmentId, draft, { sign: false, silent: true });
      if (!result.ok) return;
      lastSavedRef.current = snapshot;
      setAutoSavedAt(result.value.updatedAt);
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [snapshot, readOnly, store, appointmentId]);

  // ผู้ดูแลระบบเปิดผลเยี่ยมบ้านรายคน → VIEW_SENSITIVE
  useSensitiveView("home_visit_records", appointmentId, { enabled: canOpen, note: "เปิดแบบบันทึกการเยี่ยมบ้าน" });

  // เครื่องมือสาธิต: กรอกข้อมูลอัตโนมัติ (ไม่รับรองให้ — ครูต้องตรวจและรับรองเอง)
  useDemoPageTool(
    "กรอกข้อมูลอัตโนมัติ",
    () => {
      if (!appointment || readOnly) return;
      const g = guardians[0];
      api.setInput(
        buildDemoAutofill({
          studentId: appointment.studentId,
          now: nowThaiIso(),
          previous: previous ? pickInput(previous) : undefined,
          informant: g ? { name: g.user.name, relation: g.relation } : undefined,
          registryAddress: student?.address,
        })
      );
      setConfirmSign(false);
      setMessage({ tone: "ok", text: "กรอกข้อมูลตัวอย่างแล้ว — ตรวจสอบ แล้วบันทึกร่างหรือรับรองเอง" });
    },
    "เติมแบบบันทึกเยี่ยมบ้านของนักเรียนคนนี้ (จากผลเยี่ยมครั้งก่อนถ้ามี) ยังต้องกดรับรองเอง"
  );

  if (!appointment || !student) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">ไม่พบนัดหมายเยี่ยมบ้าน</p>
      </div>
    );
  }
  if (!canOpen) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">
          แบบบันทึกการเยี่ยมบ้านเป็นข้อมูลอ่อนไหว เปิดได้เฉพาะครูประจำชั้นของนักเรียนและแอดมิน
        </p>
      </div>
    );
  }

  const blockers = signBlockers(collected);
  const changedFromPrevious = CARRIED_FORM_KEYS.filter((k) => api.carryOf(k) === "changed").length;

  const autoCount = autoFilled.size;
  // กลุ่มข้อมูลทั้งหมด = ทุกข้อในแบบฟอร์ม + ข้อมูลหัวกระดาษที่มาจากทะเบียนนักเรียน
  const totalFields = Object.keys(api.form).length + 9;
  const percent = Math.min(100, Math.round((autoCount / totalFields) * 100));
  const bySource = (source: FillSource) => [...autoFilled.values()].filter((v) => v === source).length;

  const guardianRows = guardians.map((g) => ({
    name: g.user.name,
    relation: g.relation,
    phone: g.user.phone ?? undefined,
  }));
  const parent = guardianRows.find((g) => g.relation === "บิดา" || g.relation === "มารดา");
  const lastSavedAt = autoSavedAt ?? existing?.updatedAt ?? null;

  const save = (sign: boolean) => {
    const result = store.saveHomeVisitRecord(appointmentId, collected, { sign });
    if (!result.ok) {
      setMessage({ tone: "error", text: result.error });
      setConfirmSign(false);
      return;
    }
    lastSavedRef.current = snapshot;
    if (sign) {
      router.push("/home-visits");
      return;
    }
    setAutoSavedAt(result.value.updatedAt);
    setMessage({ tone: "ok", text: "บันทึกร่างแล้ว — กลับมากรอกต่อหรือรับรองภายหลังได้" });
  };

  return (
    <>
      <PageHeader
        title="แบบบันทึกการเยี่ยมบ้านนักเรียน"
        subtitle="แบบฟอร์มรวมการคัดกรองนักเรียนยากจน (4 หน้า) ตามแบบของ สพฐ."
      />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-5xl space-y-5">
          <Link
            href="/home-visits"
            className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" /> กลับไปรายการนัดหมาย
          </Link>

          {/* สรุปการกรอกอัตโนมัติ */}
          <div className="rounded-xl border border-blue-200 bg-accent p-5">
            <div className="flex flex-wrap items-center gap-3">
              <Sparkles className="size-5 text-primary" />
              <div className="flex-1">
                <h2 className="text-[15px] font-bold text-accent-foreground">
                  ระบบกรอกข้อมูลให้อัตโนมัติแล้ว {autoCount} จาก {totalFields} กลุ่มข้อมูล ({percent}%)
                </h2>
                <p className="mt-1 text-[13px] text-accent-foreground">
                  ครูกรอกเพิ่มเฉพาะข้อมูลที่ต้องสอบถามจริงในวันลงพื้นที่
                </p>
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-blue-200 bg-card px-3 py-2 text-[12.5px] font-medium">
                <Checkbox checked={onlyEmpty} onCheckedChange={() => setOnlyEmpty((v) => !v)} />
                แสดงเฉพาะส่วนที่ต้องกรอกเพิ่ม
              </label>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {(["registry", "guardian", "previous", "screening"] as FillSource[]).map((s) => {
                const count = bySource(s);
                if (count === 0) return null;
                return (
                  <span
                    key={s}
                    className={`rounded-md px-2.5 py-1 text-[11.5px] font-semibold ${SOURCE_STYLE[s]}`}
                  >
                    {SOURCE_LABEL[s]} · {count} กลุ่ม
                  </span>
                );
              })}
            </div>
          </div>

          {/* ข้อมูลที่ยกมาจากการเยี่ยมครั้งก่อน */}
          {previous && (
            <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-border bg-surface px-4 py-3 text-[12.5px]">
              <History className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">
                เติมข้อมูลเดิมจากการเยี่ยมบ้านที่รับรองเมื่อ{" "}
                {formatThaiDate(previous.signedAt ?? previous.updatedAt)} ให้แล้ว —
                ช่องที่มีป้าย “ข้อมูลจากภาคเรียนก่อน” คือข้อมูลเดิมที่ยังไม่ได้แก้
              </span>
              <span className="flex-1" />
              <span
                className={
                  changedFromPrevious > 0
                    ? "rounded-md bg-risk-amber-bg px-2.5 py-1 font-semibold text-risk-amber"
                    : "rounded-md bg-card px-2.5 py-1 font-semibold text-muted-foreground"
                }
              >
                แก้จากภาคเรียนก่อนแล้ว {changedFromPrevious} กลุ่ม
              </span>
            </div>
          )}

          {/* ประเภทการเยี่ยม / สถานะการแก้ไข */}
          <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
            <span className="rounded-md bg-surface px-2.5 py-1 font-semibold">
              {VISIT_TYPE_LABEL[appointment.visitType]} · ปีการศึกษา {appointment.academicYear}
            </span>
            {appointment.caseId && (
              <span className="rounded-md bg-accent px-2.5 py-1 font-semibold text-primary">
                ติดตาม case {appointment.caseId}
              </span>
            )}
            <span className="text-muted-foreground">
              {student.fullName} · นัด {formatThaiDate(appointment.proposedDate)}
            </span>
          </div>

          {signed && existing?.signedAt ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted px-4 py-3 text-[13px] text-muted-foreground">
              <Lock className="size-4 shrink-0" />
              รับรองแล้วโดย {store.nameOf(existing.signedBy)} เมื่อ {formatThaiDateTime(existing.signedAt)} —
              แก้ไขไม่ได้
            </div>
          ) : (
            <>
              <WindowNotice activity="home_visit" />
              {block && store.isWindowOpen("home_visit") && (
                <p className="rounded-xl bg-muted px-4 py-3 text-[13px] text-muted-foreground">
                  {block} — ดูได้อย่างเดียว
                </p>
              )}
              {!block && notConfirmed && (
                <p className="rounded-xl bg-risk-amber-bg px-4 py-3 text-[13px] text-risk-amber">
                  รอผู้ปกครองยืนยันนัดหมายก่อนจึงจะบันทึกผลได้
                </p>
              )}
              {!readOnly && (
                <p className="text-[12.5px] text-muted-foreground">
                  ระบบบันทึกร่างให้อัตโนมัติเมื่อหยุดกรอก —{" "}
                  {lastSavedAt
                    ? `บันทึกร่างล่าสุดเมื่อ ${formatThaiDateTime(lastSavedAt)}`
                    : "ยังไม่มีการบันทึกร่างในครั้งนี้"}
                </p>
              )}
            </>
          )}

          <fieldset disabled={readOnly} className="m-0 min-w-0 space-y-5 border-0 p-0">
            {!onlyEmpty && (
              <StudentSection
                api={api}
                student={student}
                appointment={appointment}
                guardians={guardianRows}
                sensitive={sensitive}
              />
            )}
            <HouseholdSection api={api} />
            <FamilySection api={api} awayStayWith={appointment.awayStayWith} />
            <RiskSection api={api} />
            <FriendsSection api={api} />
            <CertifySection
              api={api}
              parent={parent}
              certifierName={
                signed && existing?.signedBy ? store.nameOf(existing.signedBy) : store.currentUser.name
              }
            />
          </fieldset>

          {message && (
            <p
              className={
                message.tone === "ok"
                  ? "rounded-lg bg-risk-green-bg px-4 py-3 text-[13px] font-medium text-risk-green"
                  : "rounded-lg bg-risk-red-bg px-4 py-3 text-[13px] font-medium text-risk-red"
              }
            >
              {message.text}
            </p>
          )}

          {readOnly ? (
            <div className="flex justify-end pb-6">
              <LinkButton variant="outline" className="h-12" href="/home-visits">
                กลับไปรายการนัดหมาย
              </LinkButton>
            </div>
          ) : (
            <div className="space-y-3 pb-6">
              {blockers.length > 0 && (
                <p className="text-[12.5px] text-muted-foreground">ก่อนรับรอง: {blockers.join(" · ")}</p>
              )}
              {confirmSign ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-risk-amber-bg p-4">
                  <p className="flex items-center gap-2 text-[13px] font-medium text-risk-amber">
                    <Lock className="size-4 shrink-0" /> หลังรับรองแล้วจะแก้ไขแบบบันทึกนี้ไม่ได้อีก
                  </p>
                  <div className="flex gap-2.5">
                    <Button variant="outline" className="h-12" onClick={() => setConfirmSign(false)}>
                      ตรวจอีกครั้ง
                    </Button>
                    <Button className="h-12" onClick={() => save(true)}>
                      ยืนยันรับรองผล
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <Button variant="outline" className="h-12" onClick={() => save(false)}>
                    บันทึกร่าง
                  </Button>
                  <Button className="h-12" disabled={blockers.length > 0} onClick={() => setConfirmSign(true)}>
                    รับรองและบันทึกผลการเยี่ยมบ้าน
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
