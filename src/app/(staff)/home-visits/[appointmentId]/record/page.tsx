"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Check, ChevronLeft, Lock, Plus, Sparkles, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  AutoBadge,
  Field,
  FillSource,
  SectionCard,
  SOURCE_LABEL,
  SOURCE_STYLE,
} from "@/components/home-visit/field-shell";
import {
  ChipGroup,
  ChipSelect,
  SegmentedRows,
  YesNoRows,
} from "@/components/home-visit/option-inputs";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WindowNotice } from "@/components/shared/window-notice";
import { useDemoPageTool } from "@/lib/demo/page-tools";
import { SCHOOL_NAME } from "@/lib/mock-data";
import { useSensitiveView, useStore } from "@/lib/store";
import { nextId, nextSeq } from "@/lib/store/ids";
import { formatBaht, formatThaiDate, formatThaiDateTime, nowThaiIso } from "@/lib/format";
import {
  buildDemoAutofill,
  CARETAKER_OPTIONS,
  DEPENDENCY_OPTIONS,
  DEVICE_OPTIONS,
  DUTY_OPTIONS,
  FAMILY_MEMBERS,
  FARMLAND_OPTIONS,
  GAMING_OPTIONS,
  HEALTH_RISK_OPTIONS,
  HOBBY_OPTIONS,
  HOUSING_CONDITION_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  INCOME_COLUMNS,
  INFORMANT_OPTIONS,
  INTERNET_OPTIONS,
  IncomeKey,
  HouseholdMemberRow,
  emptyRecordInput,
  inputFromPrevious,
  LIVES_WITH_OPTIONS,
  memberTotal,
  mockPhoto,
  perCapitaIncome,
  PHOTO_SLOTS_HOME,
  PHOTO_SLOTS_INACCESSIBLE,
  signBlockers,
  RELATIONSHIP_LEVELS,
  SEXUAL_OPTIONS,
  SUBSTANCE_OPTIONS,
  SUPPORT_REQUEST_OPTIONS,
  TRAVEL_OPTIONS,
  VEHICLE_OPTIONS,
  VIOLENCE_OPTIONS,
  WELFARE_RECEIVED_OPTIONS,
  WELFARE_RISK_OPTIONS,
} from "@/lib/home-visit-form";
import {
  PHOTO_TYPE_LABEL,
  VISIT_TYPE_LABEL,
  type HomeVisitForm,
  type HomeVisitPhotoType,
  type HomeVisitRecord,
  type HomeVisitRecordInput,
} from "@/lib/types";

type ListKey = {
  [K in keyof HomeVisitForm]: HomeVisitForm[K] extends string[] ? K : never;
}[keyof HomeVisitForm];

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
  const previous = appointment ? store.latestSignedVisitOf(appointment.studentId, appointmentId) : undefined;
  const guardians = student ? store.guardiansOf(student.studentId) : [];

  /* ---------------- ค่าเริ่มต้นที่ระบบกรอกให้อัตโนมัติ ---------------- */

  const autoFilled = useMemo(() => {
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
      [
        "householdMembers",
        "dependencies",
        "housingType",
        "housingConditions",
        "vehicles",
        "farmland",
        "hoursTogether",
        "caretakerWhenAway",
        "travel",
        "duties",
        "internet",
        "livesWith",
      ].forEach((k) => map.set(k, "previous"));
    }
    // จากผลการคัดกรอง 6 มิติ
    if (screening) {
      const flagged = screening.results.filter((r) => r.group !== "green").map((r) => r.dimension);
      if (flagged.includes("physical")) map.set("healthRisks", "screening");
      if (flagged.includes("welfare")) map.set("welfareRisks", "screening");
      if (flagged.includes("behavior")) map.set("gaming", "screening");
    }
    return map;
  }, [student, appointment, previous, screening]);

  const [input, setInput] = useState<HomeVisitRecordInput>(() => {
    if (existing) return structuredClone(pickInput(existing));
    const start = previous ? inputFromPrevious(previous) : emptyRecordInput();
    if (appointment?.guardianNote) {
      start.form.guardianConcern = appointment.guardianNote;
      start.form.supportRequests = ["economic"];
    }
    return start;
  });
  const [onlyEmpty, setOnlyEmpty] = useState(false);
  const [confirmSign, setConfirmSign] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const signed = !!existing?.signedAt;
  const block = appointment ? store.homeVisitBlockReason(appointment.studentId) : null;
  const notConfirmed = appointment ? appointment.status !== "confirmed" && !signed : true;
  const readOnly = signed || !!block || notConfirmed;
  const sensitive = appointment ? store.canSeeSensitive(appointment.studentId) : false;
  const canOpen =
    !!appointment &&
    (sensitive || store.canViewRecord(appointment.studentId, existing?.recordedBy ?? appointment.teacherId));

  // แอดมิน/ผู้บริหารเปิดผลเยี่ยมบ้านรายคน → VIEW_SENSITIVE
  useSensitiveView("home_visit_records", appointmentId, { enabled: canOpen, note: "เปิดแบบบันทึกการเยี่ยมบ้าน" });

  // เครื่องมือสาธิต: กรอกข้อมูลอัตโนมัติ (ไม่รับรองให้ — ครูต้องตรวจและรับรองเอง)
  useDemoPageTool(
    "กรอกข้อมูลอัตโนมัติ",
    () => {
      if (!appointment || readOnly) return;
      const g = guardians[0];
      setInput(
        buildDemoAutofill({
          studentId: appointment.studentId,
          now: nowThaiIso(),
          previous,
          informant: g ? { name: g.user.name, relation: g.relation } : undefined,
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

  const f = input.form;
  const setForm = <K extends keyof HomeVisitForm>(key: K, value: HomeVisitForm[K]) =>
    setInput((prev) => ({ ...prev, form: { ...prev.form, [key]: value } }));
  /** สลับค่าในรายการแบบ functional update — กันการกดติดกันเร็ว ๆ แล้วค่าหาย */
  const toggleIn = (key: ListKey, id: string) =>
    setInput((prev) => {
      const cur = prev.form[key];
      return {
        ...prev,
        form: { ...prev.form, [key]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] },
      };
    });
  const setTop = <K extends keyof HomeVisitRecordInput>(key: K, value: HomeVisitRecordInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));
  const setMembers = (fn: (prev: HouseholdMemberRow[]) => HouseholdMemberRow[]) =>
    setInput((prev) => ({ ...prev, form: { ...prev.form, members: fn(prev.form.members) } }));
  const members = f.members;

  const photoSlots = input.cannotAccessHome ? PHOTO_SLOTS_INACCESSIBLE : PHOTO_SLOTS_HOME;
  const hasPhoto = (t: HomeVisitPhotoType) => input.photos.some((p) => p.photoType === t);
  const togglePhoto = (t: HomeVisitPhotoType) => {
    if (hasPhoto(t)) {
      setInput((prev) => ({ ...prev, photos: prev.photos.filter((p) => p.photoType !== t) }));
      return;
    }
    // สร้างภาพนอก updater เพื่อให้ updater บริสุทธิ์
    const photo = mockPhoto(t, nowThaiIso(), nextSeq());
    setInput((prev) => ({ ...prev, photos: [...prev.photos.filter((p) => p.photoType !== t), photo] }));
  };

  /** ข้อมูลที่จะบันทึก: เก็บเฉพาะภาพของกรณีที่เลือก (เข้าบ้านได้ / ไม่ได้) */
  const collect = (): HomeVisitRecordInput => ({
    ...input,
    photos: input.photos.filter((p) => photoSlots.includes(p.photoType)),
  });
  const blockers = signBlockers(collect());

  const totalIncome = members.reduce((sum, m) => sum + memberTotal(m), 0);
  const perCapita = perCapitaIncome(members);

  const autoCount = autoFilled.size;
  const totalFields = 24;
  const percent = Math.round((autoCount / totalFields) * 100);

  const bySource = (source: FillSource) =>
    [...autoFilled.values()].filter((v) => v === source).length;

  const save = (sign: boolean) => {
    const result = store.saveHomeVisitRecord(appointmentId, collect(), { sign });
    if (!result.ok) {
      setMessage({ tone: "error", text: result.error });
      setConfirmSign(false);
      return;
    }
    if (sign) {
      router.push("/home-visits");
      return;
    }
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
                <Checkbox
                  checked={onlyEmpty}
                  onCheckedChange={() => setOnlyEmpty((v) => !v)}
                />
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
              {previous && (
                <span className="rounded-md bg-card px-2.5 py-1 text-[11.5px] text-muted-foreground">
                  ข้อมูลเดิมจากการเยี่ยมบ้านเมื่อ {formatThaiDate(previous.signedAt ?? previous.updatedAt)}
                </span>
              )}
            </div>
          </div>

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
                <p className="rounded-xl bg-muted px-4 py-3 text-[13px] text-muted-foreground">{block} — ดูได้อย่างเดียว</p>
              )}
              {!block && notConfirmed && (
                <p className="rounded-xl bg-risk-amber-bg px-4 py-3 text-[13px] text-risk-amber">
                  รอผู้ปกครองยืนยันนัดหมายก่อนจึงจะบันทึกผลได้
                </p>
              )}
              {existing && !block && !notConfirmed && (
                <p className="rounded-xl bg-risk-amber-bg px-4 py-3 text-[13px] text-risk-amber">
                  กรอกต่อจากร่างที่บันทึกไว้เมื่อ {formatThaiDateTime(existing.updatedAt)}
                </p>
              )}
            </>
          )}

          <fieldset disabled={readOnly} className="m-0 min-w-0 space-y-5 border-0 p-0">
          {/* หน้า 1 : ข้อมูลนักเรียนและผู้ปกครอง */}
          {!onlyEmpty && (
            <SectionCard no="1." title="ข้อมูลนักเรียนและผู้ปกครอง" description="หน้า 1 ของแบบฟอร์ม">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="โรงเรียน" source="registry">
                  <ReadOnly value={SCHOOL_NAME} />
                </Field>
                <Field label="ชื่อ-นามสกุลนักเรียน" source="registry">
                  <ReadOnly value={student.fullName} />
                </Field>
                <Field label="ชั้น / เลขที่" source="registry">
                  <ReadOnly value={`${student.roomName} เลขที่ ${student.classNo}`} />
                </Field>
                <Field label="เลขที่บัตรประชาชนนักเรียน" source="registry">
                  <ReadOnly value={sensitive ? student.citizenId : "—"} />
                </Field>
                <Field label="ชื่อผู้ปกครอง" source="registry">
                  <ReadOnly value={guardians.map((g) => g.user.name).join(", ") || "-"} />
                </Field>
                <Field label="ความสัมพันธ์กับนักเรียน" source="registry">
                  <ReadOnly value={guardians.map((g) => g.relation).join(", ") || "-"} />
                </Field>
                <Field
                  label="เบอร์โทรศัพท์"
                  source={autoFilled.get("guardianPhone")}
                >
                  <ReadOnly value={sensitive ? (appointment.guardianPhone ?? guardians[0]?.user.phone ?? "-") : "—"} />
                </Field>
                <Field label="ที่อยู่" source="registry" className="md:col-span-2">
                  <ReadOnly value={sensitive ? student.address : "—"} />
                </Field>
                <Field label="อาชีพผู้ปกครอง" htmlFor="occupation">
                  <Input
                    id="occupation"
                    value={f.guardianOccupation}
                    onChange={(e) => setForm("guardianOccupation", e.target.value)}
                    placeholder="สอบถามในวันเยี่ยมบ้าน"
                  />
                </Field>
                <Field label="การศึกษาสูงสุดของผู้ปกครอง" htmlFor="education">
                  <Input
                    id="education"
                    value={f.guardianEducation}
                    onChange={(e) => setForm("guardianEducation", e.target.value)}
                    placeholder="สอบถามในวันเยี่ยมบ้าน"
                  />
                </Field>
              </div>
            </SectionCard>
          )}

          {/* ข้อ 3 : สมาชิกครัวเรือนและรายได้ */}
          <SectionCard
            no="3."
            title="จำนวนสมาชิกในครัวเรือนและรายได้"
            description="รวมตัวนักเรียน · รายได้เฉลี่ยต่อเดือนแยกตามประเภท (บาท/เดือน)"
          >
            {autoFilled.get("householdMembers") && (
              <div className="mb-3 flex items-center gap-2">
                <AutoBadge source="previous" />
                <span className="text-[12.5px] text-muted-foreground">
                  ดึงรายชื่อสมาชิกและรายได้จากการเยี่ยมบ้านครั้งก่อนมาแล้ว ครูเพียงตรวจสอบและแก้ไขเฉพาะที่เปลี่ยนแปลง
                </span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-[13px]">
                <thead>
                  <tr className="border-b-2 border-border text-[11.5px] text-muted-foreground">
                    <th className="pb-2 text-left font-semibold">ความสัมพันธ์</th>
                    <th className="w-16 pb-2 text-center font-semibold">อายุ</th>
                    <th className="w-16 pb-2 text-center font-semibold">พิการ</th>
                    {INCOME_COLUMNS.map((c) => (
                      <th key={c.key} className="w-28 pb-2 text-center font-semibold">
                        {c.label}
                      </th>
                    ))}
                    <th className="w-24 pb-2 text-right font-semibold">รวม</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, i) => (
                    <tr key={m.id} className="border-b border-border">
                      <td className="py-1.5 pr-2">
                        <Input
                          value={m.relation}
                          onChange={(e) =>
                            setMembers((prev) =>
                              prev.map((x, xi) =>
                                xi === i ? { ...x, relation: e.target.value } : x
                              )
                            )
                          }
                          placeholder="เช่น บิดา"
                          className="h-9"
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <Input
                          value={m.age}
                          onChange={(e) =>
                            setMembers((prev) =>
                              prev.map((x, xi) =>
                                xi === i
                                  ? { ...x, age: e.target.value === "" ? "" : Number(e.target.value) }
                                  : x
                              )
                            )
                          }
                          className="h-9 text-center"
                        />
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <Checkbox
                          checked={m.disability}
                          disabled={readOnly}
                          onCheckedChange={() =>
                            setMembers((prev) =>
                              prev.map((x, xi) =>
                                xi === i ? { ...x, disability: !x.disability } : x
                              )
                            )
                          }
                          aria-label={`ความพิการของสมาชิกคนที่ ${i + 1}`}
                        />
                      </td>
                      {INCOME_COLUMNS.map((col) => (
                        <td key={col.key} className="px-1 py-1.5">
                          <Input
                            value={m.income[col.key as IncomeKey] || ""}
                            onChange={(e) =>
                              setMembers((prev) =>
                                prev.map((x, xi) =>
                                  xi === i
                                    ? {
                                        ...x,
                                        income: {
                                          ...x.income,
                                          [col.key]: Number(e.target.value) || 0,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                            className="h-9 text-right"
                            placeholder="0"
                          />
                        </td>
                      ))}
                      <td className="py-1.5 pl-2 text-right font-semibold">
                        {formatBaht(memberTotal(m))}
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => setMembers((prev) => prev.filter((_, xi) => xi !== i))}
                          aria-label={`ลบสมาชิกคนที่ ${i + 1}`}
                          className="text-muted-foreground hover:text-risk-red"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const id = nextId("m");
                  setMembers((prev) => [
                    ...prev,
                    {
                      id,
                      relation: "",
                      age: "",
                      disability: false,
                      income: { wage: 0, agriculture: 0, business: 0, welfare: 0, other: 0 },
                    },
                  ]);
                }}
              >
                <Plus className="size-4" /> เพิ่มสมาชิก
              </Button>

              <div className="flex gap-3">
                <div className="rounded-lg bg-surface px-4 py-2.5 text-[13px]">
                  รวมรายได้ครัวเรือน{" "}
                  <b className="ml-1 text-foreground">{formatBaht(totalIncome)} บาท</b>
                </div>
                <div
                  className={
                    perCapita > 0 && perCapita < 3000
                      ? "rounded-lg bg-risk-amber-bg px-4 py-2.5 text-[13px] font-semibold text-risk-amber"
                      : "rounded-lg bg-surface px-4 py-2.5 text-[13px]"
                  }
                >
                  รายได้เฉลี่ยต่อคน{" "}
                  <b className="ml-1">{formatBaht(perCapita)} บาท/เดือน</b>
                  {perCapita > 0 && perCapita < 3000 && " · เข้าเกณฑ์ยากจน"}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ข้อ 4 : สถานะของครัวเรือน */}
          <SectionCard no="4." title="สถานะของครัวเรือน" description="กรอกเฉพาะบุคคลที่อาศัยในบ้านปัจจุบัน">
            <div className="space-y-6">
              <ChipGroup
                label="4.1 ภาระพึ่งพิงของครัวเรือน"
                options={DEPENDENCY_OPTIONS}
                selected={f.dependencies}
                onToggle={(id) => toggleIn("dependencies", id)}
                onClear={() => setForm("dependencies", [])}
                source={autoFilled.get("dependencies")}
                noneLabel="ไม่มีภาระพึ่งพิง"
                columns={2}
              />
              <ChipSelect
                label="4.2 ประเภทที่อยู่อาศัย"
                options={HOUSING_TYPE_OPTIONS}
                value={f.housingType}
                onChange={(v) => setForm("housingType", v)}
                source={autoFilled.get("housingType")}
                columns={3}
              />
              <ChipGroup
                label="4.3 สภาพที่อยู่อาศัย"
                options={HOUSING_CONDITION_OPTIONS}
                selected={f.housingConditions}
                onToggle={(id) => toggleIn("housingConditions", id)}
                onClear={() => setForm("housingConditions", [])}
                source={autoFilled.get("housingConditions")}
                noneLabel="สภาพบ้านปกติ"
                columns={1}
              />
              <YesNoRows
                label="4.4 ยานพาหนะของครอบครัว"
                rows={VEHICLE_OPTIONS}
                values={f.vehicles}
                onChange={(id, value) => setForm("vehicles", { ...f.vehicles, [id]: value })}
                source={autoFilled.get("vehicles")}
              />
              <ChipSelect
                label="4.5 ที่ดินทำกิน"
                options={FARMLAND_OPTIONS}
                value={f.farmland}
                onChange={(v) => setForm("farmland", v)}
                source={autoFilled.get("farmland")}
                columns={2}
              />
            </div>
          </SectionCard>

          {/* ข้อ 5 : ความสัมพันธ์ในครอบครัว */}
          <SectionCard no="5." title="ความสัมพันธ์ในครอบครัว" description="หน้า 2 ของแบบฟอร์ม">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="5.1 สมาชิกในครอบครัวมีเวลาอยู่ร่วมกันกี่ชั่วโมงต่อวัน"
                  htmlFor="hours"
                  source={autoFilled.get("hoursTogether")}
                >
                  <Input
                    id="hours"
                    value={f.hoursTogether}
                    onChange={(e) => setForm("hoursTogether", e.target.value)}
                    placeholder="ชั่วโมง/วัน"
                  />
                </Field>
              </div>

              <SegmentedRows
                label="5.2 ความสัมพันธ์ระหว่างนักเรียนกับสมาชิกในครอบครัว"
                hint="เลือกระดับความสัมพันธ์ของแต่ละคน หากไม่มีสมาชิกคนนั้นให้เลือก “ไม่มี”"
                rows={FAMILY_MEMBERS}
                choices={RELATIONSHIP_LEVELS}
                values={f.relations}
                onChange={(row, choice) => setForm("relations", { ...f.relations, [row]: choice })}
              />

              <ChipSelect
                label="5.3 กรณีที่ผู้ปกครองไม่อยู่บ้าน ฝากนักเรียนอยู่บ้านกับใคร"
                options={CARETAKER_OPTIONS}
                value={f.caretakerWhenAway}
                onChange={(v) => setForm("caretakerWhenAway", v)}
                source={autoFilled.get("caretakerWhenAway")}
                columns={4}
              />

              {appointment.awayStayWith && (
                <div className="flex items-center gap-2 rounded-lg bg-risk-green-bg px-3.5 py-2.5">
                  <AutoBadge source="guardian" />
                  <span className="text-[12.5px] text-risk-green">
                    ผู้ปกครองระบุไว้ล่วงหน้าว่า: {appointment.awayStayWith}
                  </span>
                </div>
              )}

              <ChipSelect
                label="นักเรียนอาศัยอยู่กับใครจริง"
                options={LIVES_WITH_OPTIONS}
                value={input.livesWith}
                onChange={(v) => setTop("livesWith", v)}
                source={autoFilled.get("livesWith")}
                columns={3}
              />
              <p className="-mt-4 text-[12px] text-muted-foreground">
                เป็นข้อมูลประกอบเท่านั้น ไม่ทำให้ผู้ปกครองคนใดมีสิทธิ์ในระบบมากกว่าคนอื่น
              </p>

              <ChipGroup
                label="5.6 สิ่งที่ผู้ปกครองต้องการให้โรงเรียนช่วยเหลือนักเรียน"
                options={SUPPORT_REQUEST_OPTIONS}
                selected={f.supportRequests}
                onToggle={(id) => toggleIn("supportRequests", id)}
                onClear={() => setForm("supportRequests", [])}
                source={autoFilled.get("supportRequests")}
                columns={2}
              />

              <ChipGroup
                label="5.7 ความช่วยเหลือที่ครอบครัวเคยได้รับหรือต้องการได้รับ"
                options={WELFARE_RECEIVED_OPTIONS}
                selected={f.welfareReceived}
                onToggle={(id) => toggleIn("welfareReceived", id)}
                onClear={() => setForm("welfareReceived", [])}
                noneLabel="ไม่เคยได้รับ"
                columns={3}
              />

              <Field
                label="5.8 ข้อห่วงใยของผู้ปกครองที่มีต่อนักเรียน"
                htmlFor="concern"
                source={autoFilled.get("guardianConcern")}
              >
                <Textarea
                  id="concern"
                  value={f.guardianConcern}
                  onChange={(e) => setForm("guardianConcern", e.target.value)}
                  rows={3}
                  placeholder="บันทึกสิ่งที่ผู้ปกครองห่วงใย"
                />
              </Field>
            </div>
          </SectionCard>


          <SectionCard no="6." title="พฤติกรรมและความเสี่ยง" description="หน้า 2–3 ของแบบฟอร์ม">
            <div className="space-y-6">
              <ChipGroup
                label="6.1 สุขภาพ"
                options={HEALTH_RISK_OPTIONS}
                selected={f.healthRisks}
                onToggle={(id) => toggleIn("healthRisks", id)}
                onClear={() => setForm("healthRisks", [])}
                source={autoFilled.get("healthRisks")}
                hint={
                  autoFilled.get("healthRisks")
                    ? "ผลคัดกรองมิติสุขภาพกายของนักเรียนเข้าเกณฑ์ — ตรวจสอบและเลือกรายการที่พบจริง"
                    : undefined
                }
                noneLabel="สุขภาพปกติดี"
                columns={2}
              />

              <ChipGroup
                label="6.2 สวัสดิภาพหรือความปลอดภัย"
                options={WELFARE_RISK_OPTIONS}
                selected={f.welfareRisks}
                onToggle={(id) => toggleIn("welfareRisks", id)}
                onClear={() => setForm("welfareRisks", [])}
                source={autoFilled.get("welfareRisks")}
                hint={
                  autoFilled.get("welfareRisks")
                    ? "ผลคัดกรองมิติสวัสดิภาพเข้าเกณฑ์ — ตรวจสอบรายการที่เกี่ยวข้อง"
                    : undefined
                }
                noneLabel="ไม่พบความเสี่ยง"
                columns={2}
              />

              <div>
                <div className="mb-2.5 flex flex-wrap items-center gap-2">
                  <span className="text-[13.5px] font-semibold">
                    6.3 ระยะทางและการเดินทางมาโรงเรียน
                  </span>
                  {autoFilled.get("travel") && <AutoBadge source="previous" />}
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="ระยะทางไป-กลับ (กิโลเมตร)" htmlFor="km">
                    <Input id="km" value={f.travelKm} onChange={(e) => setForm("travelKm", e.target.value)} />
                  </Field>
                  <Field label="เวลาเดินทาง (ชั่วโมง)" htmlFor="hh">
                    <Input id="hh" value={f.travelHours} onChange={(e) => setForm("travelHours", e.target.value)} />
                  </Field>
                  <Field label="เวลาเดินทาง (นาที)" htmlFor="mm">
                    <Input
                      id="mm"
                      value={f.travelMinutes}
                      onChange={(e) => setForm("travelMinutes", e.target.value)}
                    />
                  </Field>
                </div>
                <div className="mt-4">
                  <ChipSelect
                    label="วิธีการเดินทาง"
                    options={TRAVEL_OPTIONS}
                    value={f.travelMode}
                    onChange={(v) => setForm("travelMode", v)}
                    columns={4}
                  />
                </div>
              </div>

              <ChipGroup
                label="6.4 ภาระงานความรับผิดชอบของนักเรียนต่อครอบครัว"
                options={DUTY_OPTIONS}
                selected={f.duties}
                onToggle={(id) => toggleIn("duties", id)}
                onClear={() => setForm("duties", [])}
                source={autoFilled.get("duties")}
                noneLabel="ไม่มีภาระงาน"
                columns={2}
              />

              <ChipGroup
                label="6.5 กิจกรรมยามว่างหรืองานอดิเรก"
                options={HOBBY_OPTIONS}
                selected={f.hobbies}
                onToggle={(id) => toggleIn("hobbies", id)}
                onClear={() => setForm("hobbies", [])}
                columns={3}
              />

              <ChipGroup
                label="6.6 พฤติกรรมการใช้สารเสพติด"
                options={SUBSTANCE_OPTIONS}
                selected={f.substances}
                onToggle={(id) => toggleIn("substances", id)}
                onClear={() => setForm("substances", [])}
                noneLabel="ไม่พบความเสี่ยง"
                columns={2}
              />

              <ChipGroup
                label="6.7 พฤติกรรมการใช้ความรุนแรง"
                options={VIOLENCE_OPTIONS}
                selected={f.violence}
                onToggle={(id) => toggleIn("violence", id)}
                onClear={() => setForm("violence", [])}
                noneLabel="ไม่พบความเสี่ยง"
                columns={3}
              />

              <ChipGroup
                label="6.8 พฤติกรรมทางเพศ"
                options={SEXUAL_OPTIONS}
                selected={f.sexual}
                onToggle={(id) => toggleIn("sexual", id)}
                onClear={() => setForm("sexual", [])}
                noneLabel="ไม่พบความเสี่ยง"
                columns={2}
              />

              <ChipGroup
                label="6.9 การติดเกม"
                options={GAMING_OPTIONS}
                selected={f.gaming}
                onToggle={(id) => toggleIn("gaming", id)}
                onClear={() => setForm("gaming", [])}
                source={autoFilled.get("gaming")}
                hint={
                  autoFilled.get("gaming")
                    ? "ผลคัดกรองมิติพฤติกรรมเข้าเกณฑ์ — ตรวจสอบรายการที่เกี่ยวข้อง"
                    : undefined
                }
                noneLabel="ไม่พบความเสี่ยง"
                columns={3}
              />

              <ChipSelect
                label="6.10 การเข้าถึงสื่อคอมพิวเตอร์และอินเทอร์เน็ตที่บ้าน"
                options={INTERNET_OPTIONS}
                value={f.internet}
                onChange={(v) => setForm("internet", v)}
                source={autoFilled.get("internet")}
                columns={2}
              />

              <ChipGroup
                label="6.11 การใช้เครื่องมือสื่อสารอิเล็กทรอนิกส์"
                options={DEVICE_OPTIONS}
                selected={f.devices}
                onToggle={(id) => toggleIn("devices", id)}
                onClear={() => setForm("devices", [])}
                noneLabel="ไม่พบพฤติกรรมข้างต้น"
                columns={2}
              />
            </div>
          </SectionCard>


          <SectionCard no="7." title="ผู้ให้ข้อมูลและการรับรองข้อมูล" description="หน้า 3–4 ของแบบฟอร์ม">
            <div className="space-y-6">
              <div>
                <Label className="text-[13px] font-semibold">ผู้ให้ข้อมูลนักเรียน</Label>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {INFORMANT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      aria-pressed={input.informantRelation === opt}
                      onClick={() => setTop("informantRelation", input.informantRelation === opt ? "" : opt)}
                      className={
                        input.informantRelation === opt
                          ? "min-h-12 rounded-xl border border-primary bg-accent px-3 py-2 text-[13.5px] font-semibold text-primary"
                          : "min-h-12 rounded-xl border border-border bg-card px-3 py-2 text-[13.5px] text-muted-foreground hover:bg-muted"
                      }
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <div className="mt-3 max-w-md">
                  <Field label="ชื่อ-นามสกุลผู้ให้ข้อมูล" htmlFor="informant-name">
                    <Input
                      id="informant-name"
                      value={input.informantName}
                      onChange={(e) => setTop("informantName", e.target.value)}
                      placeholder="เช่น นางรัตนา สายใจ"
                      className="h-11"
                    />
                  </Field>
                </div>
              </div>

              <div>
                <Label className="text-[13px] font-semibold">การเข้าเยี่ยม</Label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {[
                    { v: false, label: "เข้าเยี่ยมในบ้านได้", sub: "แนบภาพสภาพบ้านและภายในบ้าน" },
                    { v: true, label: "เข้าเยี่ยมที่บ้านไม่ได้", sub: "ใช้ภาพนักเรียนคู่ป้ายโรงเรียน พร้อมเหตุผล" },
                  ].map((o) => (
                    <button
                      key={o.label}
                      type="button"
                      aria-pressed={input.cannotAccessHome === o.v}
                      onClick={() => setTop("cannotAccessHome", o.v)}
                      className={
                        input.cannotAccessHome === o.v
                          ? "min-h-14 rounded-xl border border-primary bg-accent px-4 py-2.5 text-left text-primary"
                          : "min-h-14 rounded-xl border border-border bg-card px-4 py-2.5 text-left hover:bg-muted"
                      }
                    >
                      <div className="text-[13.5px] font-semibold">{o.label}</div>
                      <div className="text-[12px] text-muted-foreground">{o.sub}</div>
                    </button>
                  ))}
                </div>
                {input.cannotAccessHome && (
                  <div className="mt-3">
                    <Field label="เหตุผลที่เข้าเยี่ยมที่บ้านไม่ได้ (บังคับ)" htmlFor="no-access-reason">
                      <Textarea
                        id="no-access-reason"
                        rows={2}
                        value={input.cannotAccessReason}
                        onChange={(e) => setTop("cannotAccessReason", e.target.value)}
                        placeholder="เช่น พักอาศัยในหอพักของนายจ้าง ไม่อนุญาตให้บุคคลภายนอกเข้า"
                      />
                    </Field>
                    <p className="mt-1.5 text-[12px] text-muted-foreground">
                      นับว่าเยี่ยมแล้ว แต่รายงานแยกนับเป็นกลุ่มเข้าบ้านไม่ได้
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {photoSlots.map((t, i) => {
                  const attached = hasPhoto(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={attached}
                      onClick={() => togglePhoto(t)}
                      className={
                        attached
                          ? "flex h-36 flex-col items-center justify-center gap-2 rounded-xl border border-risk-green bg-risk-green-bg px-4 text-center text-risk-green"
                          : "flex h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface px-4 text-center text-muted-foreground hover:bg-muted"
                      }
                    >
                      {attached ? <Check className="size-6" /> : <Camera className="size-6" />}
                      <span className="text-[12.5px]">
                        รูปที่ {i + 1} {PHOTO_TYPE_LABEL[t]}
                      </span>
                      <span className="text-[11.5px]">{attached ? "แนบแล้ว · แตะเพื่อนำออก" : "แตะเพื่อถ่าย / แนบภาพ"}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="ครูผู้ไปเยี่ยมและรับรองข้อมูล (1 คน)" source="registry">
                  <ReadOnly value={signed && existing?.signedBy ? store.nameOf(existing.signedBy) : store.currentUser.name} />
                </Field>
                <Field label="ตำแหน่ง" source="registry">
                  <ReadOnly value="ครูประจำชั้น" />
                </Field>
              </div>
            </div>
          </SectionCard>
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

function ReadOnly({ value }: { value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[13.5px] font-medium">
      {value}
    </div>
  );
}

/** ส่วนที่ครูกรอกของบันทึกเดิม (ตัด metadata ออก) */
function pickInput(r: HomeVisitRecord): HomeVisitRecordInput {
  return {
    form: r.form,
    livesWith: r.livesWith,
    informantName: r.informantName,
    informantRelation: r.informantRelation,
    cannotAccessHome: r.cannotAccessHome,
    cannotAccessReason: r.cannotAccessReason,
    photos: r.photos,
  };
}
