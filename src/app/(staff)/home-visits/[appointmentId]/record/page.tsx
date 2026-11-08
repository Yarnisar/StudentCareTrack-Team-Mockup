"use client";

import { colorResults } from "@/lib/screening-view";
import { use, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { cn } from "cn";
import { AutosaveStatus } from "@/components/assessment/autosave-status";
import {
  MissingNote,
  MissingSummary,
  questionShellClass,
  useMissingAnswers,
} from "@/components/assessment/missing-answers";
import { useDraft } from "@/components/assessment/use-draft";
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
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { DEMO_TODAY, previousVisitForms, SCHOOL_NAME } from "@/lib/mock-data";
import { useOnline } from "@/lib/use-online";
import { REGISTRY_FIELD_LABEL, type RegistryField, type Student } from "@/lib/types";
import { ROLE_INFO } from "@/lib/roles";
import { resizeImage } from "@/lib/image";
import { draftKey, useStore } from "@/lib/store";
import { formatBaht, formatThaiDate, maskCitizenId } from "@/lib/format";
import {
  CARETAKER_OPTIONS,
  caretakerOptionFrom,
  DEPENDENCY_OPTIONS,
  derivedDependencies,
  DEVICE_OPTIONS,
  type ConfirmSection,
  DUTY_OPTIONS,
  EDUCATION_OPTIONS,
  formatCaretaker,
  formatMinutes,
  effectiveRelations,
  emptyMember,
  diffVisitForm,
  finalizeVisitForm,
  FAMILY_MEMBERS,
  FARMLAND_OPTIONS,
  GAMING_OPTIONS,
  HEALTH_RISK_OPTIONS,
  HOBBY_OPTIONS,
  HOUSING_CONDITION_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  INCOME_COLUMNS,
  INFORMANT_OPTIONS,
  MEMBER_RELATION_OPTIONS,
  OCCUPATION_OPTIONS,
  OTHER_LABEL,
  type OtherField,
  initialVisitForm,
  INTERNET_OPTIONS,
  IncomeKey,
  HouseholdMemberRow,
  type ListField,
  memberTotal,
  missingVisitAnswers,
  type NoneField,
  CAN_PHOTO_HOME_OPTIONS,
  HOME_PHOTO_TYPE_OPTIONS,
  PHOTO_REASON_OPTIONS,
  photoReasonText,
  photoSlots,
  SCHOOL_SIGN_PHOTO,
  possibleUnemployed,
  POVERTY_LINE,
  RELATIONSHIP_LEVELS,
  SEXUAL_OPTIONS,
  SUBSTANCE_OPTIONS,
  suggestedNoRelation,
  SUPPORT_REQUEST_OPTIONS,
  TRAVEL_OPTIONS,
  TRAVEL_TIME_MINUTES,
  VEHICLE_OPTIONS,
  VIOLENCE_OPTIONS,
  WELFARE_RECEIVED_OPTIONS,
  WELFARE_RISK_OPTIONS,
  type VisitForm,
  VISIT_STEPS,
  visitRiskFindings,
} from "@/lib/home-visit-form";

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
  const previous = appointment ? previousVisitForms[appointment.studentId] : undefined;
  /** มีผลที่ส่งแล้ว = แก้ไขผลเดิม (UC5 สถานการณ์ B) */
  const existing = store.homeVisitRecords.find((r) => r.appointmentId === appointmentId);
  const editCloseDate = store.assessmentWindows.find((w) => w.kind === "home_visit")?.editCloseDate;
  const editClosed = !!existing && !!editCloseDate && DEMO_TODAY > editCloseDate;

  /* ---------------- ค่าเริ่มต้นที่ระบบกรอกให้อัตโนมัติ ---------------- */

  // นับเฉพาะคำตอบในแบบฟอร์มที่ระบบกรอกให้จริง (ไม่นับช่องอ่านอย่างเดียวของข้อ 1)
  const autoFilled = (() => {
    const map = new Map<string, FillSource>();
    if (!student) return map;

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
      ].forEach((k) => map.set(k, "previous"));
    } else {
      // เยี่ยมครั้งแรก: ใส่นักเรียนและผู้ปกครองตามทะเบียนเป็นสมาชิกเริ่มต้น
      map.set("householdMembers", "registry");
      if (caretakerOptionFrom(appointment?.caretakerRelation)) map.set("caretakerWhenAway", "guardian");
    }
    if (INFORMANT_OPTIONS.includes(student.guardianRelation)) map.set("informant", "registry");
    return map;
  })();

  /** มิติที่ผลคัดกรองเข้าเกณฑ์ — ไม่ได้กรอกให้ แต่เตือนให้ถามเรื่องนั้นเป็นพิเศษ */
  const flaggedDimensions = new Set(
    [
      ...(screening ? colorResults(screening.results) : []).filter((r) => r.group !== "green").map((r) => r.dimension),
      ...(store.mentalStatusOf(student?.studentId ?? "") === "needs_care" ? (["mental"] as const) : []),
    ]
  );

  // ทุกช่องอยู่ในก้อนเดียว บันทึกเป็นร่างอัตโนมัติทุกครั้งที่เปลี่ยน (ไม่ต้องกดบันทึกร่าง)
  const draft = useDraft<VisitForm>(draftKey("home_visit", appointmentId), () =>
    existing?.form ?? initialVisitForm(previous, {
      guardianRelation: student?.guardianRelation,
      caretakerRelation: appointment?.caretakerRelation,
      caretakerName: appointment?.caretakerName,
    })
  );
  const form = draft.value;
  // แบ่งเป็นขั้นตามหัวข้อของแบบฟอร์ม ข้ามไปขั้นไหนก็ได้ และพาข้ามขั้นได้เมื่อมีข้อที่ยังขาด
  // เปิดร่างที่ทำค้างไว้ → เริ่มที่ขั้นแรกที่ยังไม่ครบ
  const [step, setStep] = useState(() =>
    draft.restored ? (missingVisitAnswers(draft.value)[0]?.page ?? 0) : 0
  );
  const [showRegistry, setShowRegistry] = useState(false);
  const missing = useMissingAnswers(setStep);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState<{ findings: string[]; poor: boolean; changes?: string[] } | null>(null);

  if (!appointment || !student) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">ไม่พบนัดหมายเยี่ยมบ้าน</p>
      </div>
    );
  }

  if (editClosed) {
    return (
      <>
        <PageHeader title="แก้ไขผลการเยี่ยมบ้าน" subtitle={student.fullName} />
        <div className="p-4 sm:p-8">
          <p className="rounded-xl border border-border bg-card p-6 text-[13.5px]">
            พ้นวันปิดแก้ไขผลการเยี่ยมบ้าน ({formatThaiDate(editCloseDate ?? "")}) ที่ผู้ดูแลระบบกำหนดแล้ว จึงแก้ไขผลไม่ได้
          </p>
          <LinkButton variant="outline" className="mt-4" href="/home-visits">
            กลับไปรายการนัดหมาย
          </LinkButton>
        </div>
      </>
    );
  }

  const { members } = form;
  const totalIncome = members.reduce((sum, m) => sum + memberTotal(m), 0);
  const perCapita = members.length > 0 ? Math.round(totalIncome / members.length) : 0;

  const set = <K extends keyof VisitForm>(key: K, value: VisitForm[K]) =>
    draft.update((prev) => ({ ...prev, [key]: value }));

  const setMembers = (fn: (prev: HouseholdMemberRow[]) => HouseholdMemberRow[]) =>
    draft.update((prev) => ({ ...prev, members: fn(prev.members) }));

  /** เลือกรายการในหมวด = ตรวจแล้วและพบ จึงยกเลิก "ไม่พบ" ของหมวดนั้น */
  const toggleItem = (field: ListField, id: string) =>
    draft.update((prev) => ({
      ...prev,
      [field]: prev[field].includes(id) ? prev[field].filter((x) => x !== id) : [...prev[field], id],
      noneFound: prev.noneFound.filter((f) => f !== field),
    }));

  const toggleNone = (field: NoneField) =>
    draft.update((prev) =>
      prev.noneFound.includes(field)
        ? { ...prev, noneFound: prev.noneFound.filter((f) => f !== field) }
        : { ...prev, [field]: [], noneFound: [...prev.noneFound, field] }
    );

  /** props ของ ChipGroup สำหรับหมวดที่มีปุ่ม "ไม่พบ" */
  const noneGroup = (field: NoneField) => ({
    selected: form[field],
    onToggle: (id: string) => toggleItem(field, id),
    onClear: () => set(field, []),
    noneSelected: form.noneFound.includes(field),
    onNone: () => toggleNone(field),
  });

  /** ช่องระบุของตัวเลือก "อื่น ๆ" */
  const otherNote = (field: OtherField, placeholder?: string) => ({
    value: form.otherNotes?.[field] ?? "",
    onChange: (value: string) => set("otherNotes", { ...form.otherNotes, [field]: value }),
    placeholder,
  });

  // เวลาเดินทางเก็บเป็นชั่วโมงกับนาทีตามแบบฟอร์ม แต่เลือกจากรายการเดียว
  const travelTotal =
    form.travelHours === "" && form.travelMinutes === ""
      ? ""
      : String((Number(form.travelHours) || 0) * 60 + (Number(form.travelMinutes) || 0));
  // ค่าจากการเยี่ยมครั้งก่อนที่ไม่ตรงกับรายการ ยังแสดงเป็นตัวเลือกได้
  const travelChoices =
    travelTotal === "" || TRAVEL_TIME_MINUTES.includes(Number(travelTotal))
      ? TRAVEL_TIME_MINUTES
      : [...TRAVEL_TIME_MINUTES, Number(travelTotal)].sort((a, b) => a - b);

  const toggleConfirm = (section: ConfirmSection) =>
    set(
      "confirmed",
      form.confirmed.includes(section)
        ? form.confirmed.filter((c) => c !== section)
        : [...form.confirmed, section]
    );

  const relations = effectiveRelations(form);
  const derived = derivedDependencies(form);
  const unemployed = possibleUnemployed(form);
  const labelOf = (options: { id: string; label: string }[], id: string) =>
    options.find((o) => o.id === id)?.label;
  const statusSummary = [
    labelOf(HOUSING_TYPE_OPTIONS, form.housingType),
    ...VEHICLE_OPTIONS.filter((v) => form.vehicles[v.id]).map((v) => v.label),
    labelOf(FARMLAND_OPTIONS, form.farmland),
    ...[...new Set([...derived, ...form.dependencies])].map((id) => labelOf(DEPENDENCY_OPTIONS, id)),
  ]
    .filter(Boolean)
    .join(" · ");
  const suggestedNone = suggestedNoRelation(form);

  const pending = missingVisitAnswers(form);
  const pendingIn = (i: number) => pending.filter((m) => m.page === i).length;
  const lastStep = VISIT_STEPS.length - 1;

  const goToStep = (i: number) => {
    setStep(i);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  /** ถัดไป: ถ้าขั้นนี้ยังตอบไม่ครบ พาไปข้อแรกที่ขาดในขั้นนี้ (ไม่ปิดปุ่ม) */
  const handleNext = () => {
    const items = pending.filter((m) => m.page === step);
    if (items.length > 0) {
      missing.report(items);
      return;
    }
    goToStep(step + 1);
  };
  const flagged = (key: string) => missing.isMissing(key) && pending.some((m) => m.key === key);

  /** กล่องของข้อบังคับ: ใช้ระบุตำแหน่งเมื่อพาไปข้อที่ยังไม่ได้ตอบ และแสดงแถบซ้ายเมื่อยังขาด */
  const question = (key: string, children: ReactNode) => (
    <div
      ref={missing.registerNode(key)}
      className={cn("-mx-3 rounded-sm px-3", questionShellClass(flagged(key)))}
    >
      {children}
      <MissingNote show={flagged(key)} />
    </div>
  );


  const bySource = (source: FillSource) =>
    [...autoFilled.values()].filter((v) => v === source).length;

  const signer = ROLE_INFO[store.role].user;
  const poor = perCapita > 0 && perCapita < POVERTY_LINE;

  const handleSave = () => {
    if (pending.length > 0) {
      missing.report(pending);
      return;
    }
    const final = finalizeVisitForm(form);
    const findings = visitRiskFindings(final);
    const result = {
      householdMembers: members.map((m) => ({
        memberId: m.id,
        relation: m.relation,
        age: Number(m.age) || 0,
        occupation: "-",
        monthlyIncome: memberTotal(m),
      })),
      riskFindings: [...(poor ? ["รายได้เฉลี่ยต่อคนต่ำกว่าเกณฑ์ยากจน"] : []), ...findings],
      informantName: form.informant === student.guardianRelation ? student.guardianName : form.informant,
      informantRelation: form.informant,
      photoLabels: photoSlots(final.photoType).map((p) => p.short),
      photos: final.photos.slice(0, photoSlots(final.photoType).length),
      photoReason: photoReasonText(final),
      signedBy: signer.name,
      form: final,
    };
    if (existing) {
      const changes = diffVisitForm(existing.form, final);
      store.updateHomeVisit(appointmentId, result, changes);
      setSaved({ findings, poor, changes });
      return;
    }
    store.saveHomeVisit(appointmentId, result);
    setSaved({ findings, poor });
  };

  if (saved) {
    return (
      <VisitSaved
        studentId={student.studentId}
        studentName={student.fullName}
        findings={saved.findings}
        poor={saved.poor}
        hasCase={store.caseOf(student.studentId)?.status === "active"}
        changes={saved.changes}
      />
    );
  }

  return (
    <>
      <PageHeader
        title={existing ? "แก้ไขผลการเยี่ยมบ้าน" : "แบบบันทึกการเยี่ยมบ้านนักเรียน"}
        subtitle={
          existing
            ? `แก้ได้ถึง ${formatThaiDate(editCloseDate ?? "")} · บันทึกแล้วระบบเก็บประวัติการแก้ไขและส่งคำขอยืนยันใหม่`
            : "แบบฟอร์มรวมการคัดกรองนักเรียนยากจน (4 หน้า) ตามแบบของ สพฐ."
        }
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-5xl space-y-5">
          <Link
            href="/home-visits"
            className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" /> กลับไปรายการนัดหมาย
          </Link>

          <VisitStepper step={step} pendingIn={pendingIn} onSelect={goToStep} />

          {/* สรุปการกรอกอัตโนมัติ */}
          {step === 0 && (
          <div className="rounded-xl border border-blue-200 bg-accent p-5">
            <div className="flex flex-wrap items-center gap-3">
              <Sparkles className="size-5 text-primary" />
              <div className="flex-1">
                <h2 className="text-[15px] font-bold text-accent-foreground">
                  {pending.length === 0
                    ? "ตอบครบทุกข้อบังคับแล้ว"
                    : `เหลือ ${pending.length} ข้อที่ต้องถามในวันเยี่ยมบ้าน`}
                </h2>
                <p className="mt-1 text-[13px] text-accent-foreground">
                  {autoFilled.size > 0
                    ? `ระบบกรอกให้แล้ว ${autoFilled.size} ข้อ ครูตรวจทานและแก้เฉพาะที่เปลี่ยนไป`
                    : "ครูกรอกข้อมูลที่สอบถามในวันลงพื้นที่"}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {(["registry", "guardian", "previous"] as FillSource[]).map((s) => {
                const count = bySource(s);
                if (count === 0) return null;
                return (
                  <span
                    key={s}
                    className={`rounded-md px-2.5 py-1 text-[11.5px] font-semibold ${SOURCE_STYLE[s]}`}
                  >
                    {SOURCE_LABEL[s]} · {count} ข้อ
                  </span>
                );
              })}
              {previous && (
                <span className="rounded-md bg-card px-2.5 py-1 text-[11.5px] text-muted-foreground">
                  ข้อมูลเดิมจากการเยี่ยมบ้านเมื่อ {formatThaiDate(previous.visitedAt)}
                </span>
              )}
            </div>
          </div>
          )}

          {/* หน้า 1 : ข้อมูลนักเรียนและผู้ปกครอง */}
          {step === 0 && (
            <>
            <SectionCard no="1." title="ข้อมูลนักเรียนและผู้ปกครอง">
              {/* ข้อมูลทะเบียนอ่านอย่างเดียว: ย่อเป็นบรรทัดเดียว กดดูทั้งหมดได้ */}
              <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg bg-surface px-3.5 py-2.5 text-[13px]">
                <AutoBadge source="registry" />
                <span className="font-semibold">{student.fullName}</span>
                <span className="text-muted-foreground">
                  {student.roomName} เลขที่ {student.classNo} · ผู้ปกครอง {form.registryOverrides?.guardianName ?? student.guardianName} (
                  {form.registryOverrides?.guardianRelation ?? student.guardianRelation}) · โทร{" "}
                  {form.registryOverrides?.guardianPhone ?? appointment.guardianPhone ?? student.guardianPhone}
                </span>
                <button
                  type="button"
                  onClick={() => setShowRegistry((v) => !v)}
                  aria-expanded={showRegistry}
                  className="ml-auto text-[12.5px] font-semibold text-primary hover:underline"
                >
                  {showRegistry ? "ซ่อน" : "ดูข้อมูลทะเบียนทั้งหมด"}
                </button>
              </div>
              <RegistryMismatch
                student={student}
                overrides={form.registryOverrides ?? {}}
                onApply={(field, value) =>
                  set("registryOverrides", { ...(form.registryOverrides ?? {}), [field]: value })
                }
              />
              {showRegistry && (
              <div className="mb-4 grid gap-4 md:grid-cols-2">
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
                  <ReadOnly value={maskCitizenId(student.citizenId)} />
                </Field>
                <Field label="ชื่อผู้ปกครอง" source="registry">
                  <ReadOnly value={student.guardianName} />
                </Field>
                <Field label="ความสัมพันธ์กับนักเรียน" source="registry">
                  <ReadOnly value={student.guardianRelation} />
                </Field>
                <Field
                  label="เบอร์โทรศัพท์"
                  source={appointment.guardianPhone ? "guardian" : "registry"}
                >
                  <ReadOnly value={appointment.guardianPhone ?? student.guardianPhone} />
                </Field>
                <Field label="ที่อยู่" source="registry" className="md:col-span-2">
                  <ReadOnly value={student.address} />
                </Field>
              </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="อาชีพผู้ปกครอง" htmlFor="occupation">
                  <NativeSelect
                    id="occupation"
                    value={form.occupation}
                    onChange={(e) => set("occupation", e.target.value)}
                  >
                    <option value="">เลือกอาชีพ</option>
                    {OCCUPATION_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </NativeSelect>
                  {form.occupation === OTHER_LABEL && (
                    <Input
                      aria-label="ระบุอาชีพ"
                      value={form.otherNotes?.occupation ?? ""}
                      onChange={(e) => otherNote("occupation").onChange(e.target.value)}
                      placeholder="ระบุอาชีพ"
                      className="mt-2 h-10"
                    />
                  )}
                </Field>
                <Field label="การศึกษาสูงสุดของผู้ปกครอง" htmlFor="education">
                  <NativeSelect
                    id="education"
                    value={form.education}
                    onChange={(e) => set("education", e.target.value)}
                  >
                    <option value="">เลือกระดับการศึกษา</option>
                    {EDUCATION_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>
            </SectionCard>

          {/* ข้อ 3 : สมาชิกครัวเรือนและรายได้ */}
          <SectionCard
            no="2."
            title="จำนวนสมาชิกในครัวเรือนและรายได้"
            description="รวมตัวนักเรียน · รายได้เฉลี่ยต่อเดือนแยกตามประเภท (บาท/เดือน)"
          >
            {form.needsConfirm.includes("household") ? (
              <div className="mb-4">
                {question(
                  "confirm-household",
                  <ConfirmPrevious
                    what="สมาชิกครัวเรือนและรายได้"
                    summary={`${members.length} คน · รายได้รวม ${formatBaht(totalIncome)} บาท/เดือน`}
                    confirmed={form.confirmed.includes("household")}
                    onToggle={() => toggleConfirm("household")}
                  />
                )}
              </div>
            ) : (
              <div className="mb-3 flex items-center gap-2">
                <AutoBadge source="registry" />
                <span className="text-[12.5px] text-muted-foreground">
                  ใส่นักเรียนและผู้ปกครองตามทะเบียนไว้ให้แล้ว เพิ่มสมาชิกคนอื่นที่อาศัยอยู่ด้วย
                </span>
              </div>
            )}

            {question(
              "3",
            <>
            {/* มือถือ: การ์ดทีละคน กรอกเฉพาะประเภทรายได้ที่มีจริง */}
            <div className="space-y-3 md:hidden">
              {members.map((m, i) => (
                <MemberCard
                  key={m.id}
                  member={m}
                  index={i}
                  onChange={(patch) =>
                    setMembers((prev) => prev.map((x, xi) => (xi === i ? { ...x, ...patch } : x)))
                  }
                  onRemove={() => setMembers((prev) => prev.filter((_, xi) => xi !== i))}
                />
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
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
                        <RelationSelect
                          value={m.relation}
                          onChange={(relation) =>
                            setMembers((prev) =>
                              prev.map((x, xi) => (xi === i ? { ...x, relation } : x))
                            )
                          }
                          label={`ความสัมพันธ์ของสมาชิกคนที่ ${i + 1}`}
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
                          inputMode="numeric"
                          className="h-9 text-center"
                        />
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <Checkbox
                          checked={m.disability}
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
                            inputMode="numeric"
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
            </>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setMembers((prev) => [...prev, emptyMember(`m${Date.now()}`)])
                }
              >
                <Plus className="size-4" /> เพิ่มสมาชิก
              </Button>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-lg bg-surface px-4 py-2.5 text-[13px]">
                  รวมรายได้ครัวเรือน{" "}
                  <b className="ml-1 text-foreground">{formatBaht(totalIncome)} บาท</b>
                </div>
                <div
                  className={
                    poor
                      ? "rounded-lg bg-risk-amber-bg px-4 py-2.5 text-[13px] font-semibold text-risk-amber"
                      : "rounded-lg bg-surface px-4 py-2.5 text-[13px]"
                  }
                >
                  รายได้เฉลี่ยต่อคน{" "}
                  <b className="ml-1">{formatBaht(perCapita)} บาท/เดือน</b>
                  {poor && " · เข้าเกณฑ์ยากจน"}
                </div>
              </div>
            </div>

          </SectionCard>
            </>
          )}

          {/* ข้อ 4 : สถานะของครัวเรือน */}
          {step === 1 && (
          <SectionCard no="3." title="สถานะของครัวเรือน" description="กรอกเฉพาะบุคคลที่อาศัยในบ้านปัจจุบัน">
            {form.needsConfirm.includes("status") && (
              <div className="mb-6">
                {question(
                  "confirm-status",
                  <ConfirmPrevious
                    what="สถานะของครัวเรือน"
                    summary={statusSummary}
                    confirmed={form.confirmed.includes("status")}
                    onToggle={() => toggleConfirm("status")}
                  />
                )}
              </div>
            )}
            <div className="space-y-6">
              {question(
                "4.1",
                <ChipGroup
                  label="ภาระพึ่งพิงของครัวเรือน"
                  options={DEPENDENCY_OPTIONS}
                  {...noneGroup("dependencies")}
                  lockedIds={derived}
                  lockedNote="เลือกให้จากตารางสมาชิกครัวเรือน — แก้ที่ตาราง"
                  hint={
                    unemployed.length > 0
                      ? `ไม่มีรายได้ในตารางสมาชิกครัวเรือน: ${unemployed.map((m) => `${m.relation} (${m.age} ปี)`).join(", ")} — ถามว่าว่างงานหรือไม่`
                      : undefined
                  }
                  source={autoFilled.get("dependencies")}
                  noneLabel="ไม่มีภาระพึ่งพิง"
                  columns={2}
                />
              )}
              {question(
                "4.2",
                <ChipSelect
                  label="ประเภทที่อยู่อาศัย"
                  options={HOUSING_TYPE_OPTIONS}
                  value={form.housingType}
                  onChange={(v) => set("housingType", v)}
                  source={autoFilled.get("housingType")}
                  columns={3}
                />
              )}
              {question(
                "4.3",
                <ChipGroup
                  label="สภาพที่อยู่อาศัย"
                  options={HOUSING_CONDITION_OPTIONS}
                  {...noneGroup("housingConditions")}
                  source={autoFilled.get("housingConditions")}
                  noneLabel="สภาพบ้านปกติ"
                  columns={1}
                />
              )}
              {question(
                "4.4",
                <YesNoRows
                  label="ยานพาหนะของครอบครัว"
                  rows={VEHICLE_OPTIONS}
                  values={form.vehicles}
                  onChange={(id, value) => set("vehicles", { ...form.vehicles, [id]: value })}
                  source={autoFilled.get("vehicles")}
                />
              )}
              {question(
                "4.5",
                <ChipSelect
                  label="ที่ดินทำกิน"
                  options={FARMLAND_OPTIONS}
                  value={form.farmland}
                  onChange={(v) => set("farmland", v)}
                  source={autoFilled.get("farmland")}
                  columns={2}
                />
              )}
            </div>
          </SectionCard>
          )}

          {/* ข้อ 5 : ความสัมพันธ์ในครอบครัว */}
          {step === 2 && (
          <SectionCard no="4." title="ความสัมพันธ์ในครอบครัว">
            <div className="space-y-6">
              {question(
                "5.1",
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="สมาชิกในครอบครัวมีเวลาอยู่ร่วมกันกี่ชั่วโมงต่อวัน"
                    htmlFor="hours"
                    source={autoFilled.get("hoursTogether")}
                  >
                    <NativeSelect
                      id="hours"
                      value={form.hoursTogether}
                      onChange={(e) => set("hoursTogether", e.target.value)}
                    >
                      <option value="">เลือกจำนวนชั่วโมง</option>
                      {Array.from({ length: 25 }, (_, h) => (
                        <option key={h} value={String(h)}>
                          {h === 0 ? "ไม่ถึง 1 ชั่วโมง" : `${h} ชั่วโมง`}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                </div>
              )}

              {question(
                "5.2",
                <SegmentedRows
                  label="ความสัมพันธ์ระหว่างนักเรียนกับสมาชิกในครอบครัว"
                  hint={
                    suggestedNone.length > 0
                      ? `ระบบเลือก “ไม่มี” ให้ ${suggestedNone.join(", ")} เพราะไม่อยู่ในตารางสมาชิกครัวเรือน เปลี่ยนได้ถ้ายังติดต่อกันอยู่`
                      : "เลือกระดับความสัมพันธ์ของแต่ละคน หากไม่มีสมาชิกคนนั้นให้เลือก “ไม่มี”"
                  }
                  rows={FAMILY_MEMBERS}
                  choices={RELATIONSHIP_LEVELS}
                  values={relations}
                  onChange={(row, choice) => set("relations", { ...form.relations, [row]: choice })}
                />
              )}

              {question(
                "5.3",
                <ChipSelect
                  label="กรณีที่ผู้ปกครองไม่อยู่บ้าน ฝากนักเรียนอยู่บ้านกับใคร"
                  options={CARETAKER_OPTIONS}
                  value={form.caretakerWhenAway}
                  onChange={(v) => set("caretakerWhenAway", v)}
                  source={autoFilled.get("caretakerWhenAway")}
                  columns={4}
                  other={otherNote("caretakerWhenAway", "ระบุผู้ดูแล")}
                />
              )}

              {(appointment.caretakerRelation || appointment.caretakerName) && (
                <div className="flex items-center gap-2 rounded-lg bg-risk-green-bg px-3.5 py-2.5">
                  <AutoBadge source="guardian" />
                  <span className="text-[12.5px] text-risk-green">
                    ผู้ปกครองระบุไว้ล่วงหน้าว่า:{" "}
                    {formatCaretaker(appointment.caretakerRelation, appointment.caretakerName)}
                  </span>
                </div>
              )}

              {appointment.guardianNote && (
                <div className="flex items-start gap-2 rounded-lg bg-risk-green-bg px-3.5 py-2.5">
                  <AutoBadge source="guardian" />
                  <span className="text-[12.5px] text-risk-green">
                    สิ่งที่ผู้ปกครองอยากให้ครูช่วย (ใช้ประกอบคำถามถัดไป): {appointment.guardianNote}
                  </span>
                </div>
              )}

              <ChipGroup
                label="สิ่งที่ผู้ปกครองต้องการให้โรงเรียนช่วยเหลือนักเรียน"
                options={SUPPORT_REQUEST_OPTIONS}
                selected={form.supportRequests}
                onToggle={(id) => toggleItem("supportRequests", id)}
                onClear={() => set("supportRequests", [])}
                columns={2}
                other={otherNote("supportRequests", "ระบุความช่วยเหลือที่ต้องการ")}
              />

              {question(
                "5.7",
                <ChipGroup
                  label="ความช่วยเหลือที่ครอบครัวเคยได้รับหรือต้องการได้รับ"
                  options={WELFARE_RECEIVED_OPTIONS}
                  {...noneGroup("welfareReceived")}
                  noneLabel="ไม่เคยได้รับ"
                  columns={3}
                  other={otherNote("welfareReceived", "ระบุความช่วยเหลือ")}
                />
              )}

              <Field
                label="ข้อห่วงใยของผู้ปกครองที่มีต่อนักเรียน"
                htmlFor="concern"
              >
                <Textarea
                  id="concern"
                  value={form.guardianConcern}
                  onChange={(e) => set("guardianConcern", e.target.value)}
                  rows={3}
                  placeholder="บันทึกสิ่งที่ผู้ปกครองห่วงใย"
                />
              </Field>
            </div>
          </SectionCard>
          )}

          {step === 3 && (
          <SectionCard no="5." title="พฤติกรรมและความเสี่ยง">
            <div className="space-y-6">
              {question(
                "6.1",
                <ChipGroup
                  label="สุขภาพ"
                  options={HEALTH_RISK_OPTIONS}
                  {...noneGroup("healthRisks")}
                  hint={
                    flaggedDimensions.has("physical")
                      ? "ผลคัดกรองมิติสุขภาพกายของนักเรียนเข้าเกณฑ์ — ตรวจสอบและเลือกรายการที่พบจริง"
                      : undefined
                  }
                  noneLabel="สุขภาพปกติดี"
                  columns={2}
                />
              )}

              {question(
                "6.2",
                <ChipGroup
                  label="สวัสดิภาพหรือความปลอดภัย"
                  options={WELFARE_RISK_OPTIONS}
                  {...noneGroup("welfareRisks")}
                  hint={
                    flaggedDimensions.has("welfare")
                      ? "ผลคัดกรองมิติสวัสดิภาพเข้าเกณฑ์ — ตรวจสอบรายการที่เกี่ยวข้อง"
                      : undefined
                  }
                  noneLabel="ไม่พบความเสี่ยง"
                  columns={2}
                />
              )}

              {question(
                "6.3",
              <div>
                <div className="mb-2.5 flex flex-wrap items-center gap-2">
                  <span className="text-[13.5px] font-semibold">
                    ระยะทางและการเดินทางมาโรงเรียน
                  </span>
                  {autoFilled.get("travel") && <AutoBadge source="previous" />}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="ระยะทางไป-กลับ (กิโลเมตร)" htmlFor="km">
                    <Input
                      id="km"
                      inputMode="decimal"
                      value={form.travelKm}
                      onChange={(e) => set("travelKm", e.target.value)}
                    />
                  </Field>
                  <Field label="เวลาเดินทาง (เที่ยวเดียว)" htmlFor="travel-time">
                    <NativeSelect
                      id="travel-time"
                      value={travelTotal}
                      onChange={(e) => {
                        const total = e.target.value === "" ? null : Number(e.target.value);
                        draft.update((prev) => ({
                          ...prev,
                          travelHours: total === null ? "" : String(Math.floor(total / 60)),
                          travelMinutes: total === null ? "" : String(total % 60),
                        }));
                      }}
                    >
                      <option value="">เลือกเวลาเดินทาง</option>
                      {travelChoices.map((m) => (
                        <option key={m} value={String(m)}>
                          {formatMinutes(m)}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                </div>
                <div className="mt-4">
                  <ChipSelect
                    label="วิธีการเดินทาง"
                    options={TRAVEL_OPTIONS}
                    value={form.travelMode}
                    onChange={(v) => set("travelMode", v)}
                    columns={4}
                    other={otherNote("travelMode", "ระบุวิธีการเดินทาง")}
                  />
                </div>
              </div>
              )}

              {question(
                "6.4",
                <ChipGroup
                  label="ภาระงานความรับผิดชอบของนักเรียนต่อครอบครัว"
                  options={DUTY_OPTIONS}
                  {...noneGroup("duties")}
                  source={autoFilled.get("duties")}
                  noneLabel="ไม่มีภาระงาน"
                  columns={2}
                  other={otherNote("duties", "ระบุภาระงาน")}
                />
              )}

              <ChipGroup
                label="กิจกรรมยามว่างหรืองานอดิเรก"
                options={HOBBY_OPTIONS}
                selected={form.hobbies}
                onToggle={(id) => toggleItem("hobbies", id)}
                onClear={() => set("hobbies", [])}
                columns={3}
                other={otherNote("hobbies", "ระบุกิจกรรม")}
              />

              {question(
                "6.6",
                <ChipGroup
                  label="พฤติกรรมการใช้สารเสพติด"
                  options={SUBSTANCE_OPTIONS}
                  {...noneGroup("substances")}
                  noneLabel="ไม่พบความเสี่ยง"
                  columns={2}
                />
              )}

              {question(
                "6.7",
                <ChipGroup
                  label="พฤติกรรมการใช้ความรุนแรง"
                  options={VIOLENCE_OPTIONS}
                  {...noneGroup("violence")}
                  noneLabel="ไม่พบความเสี่ยง"
                  columns={3}
                />
              )}

              {question(
                "6.8",
                <ChipGroup
                  label="พฤติกรรมทางเพศ"
                  options={SEXUAL_OPTIONS}
                  {...noneGroup("sexual")}
                  noneLabel="ไม่พบความเสี่ยง"
                  columns={2}
                />
              )}

              {question(
                "6.9",
                <ChipGroup
                  label="การติดเกม"
                  options={GAMING_OPTIONS}
                  {...noneGroup("gaming")}
                  hint={
                    flaggedDimensions.has("behavior")
                      ? "ผลคัดกรองมิติพฤติกรรมเข้าเกณฑ์ — ตรวจสอบรายการที่เกี่ยวข้อง"
                      : undefined
                  }
                  noneLabel="ไม่พบความเสี่ยง"
                  columns={3}
                />
              )}

              {question(
                "6.10",
                <ChipSelect
                  label="การเข้าถึงสื่อคอมพิวเตอร์และอินเทอร์เน็ตที่บ้าน"
                  options={INTERNET_OPTIONS}
                  value={form.internet}
                  onChange={(v) => set("internet", v)}
                  source={autoFilled.get("internet")}
                  columns={2}
                />
              )}

              {question(
                "6.11",
                <ChipGroup
                  label="การใช้เครื่องมือสื่อสารอิเล็กทรอนิกส์"
                  options={DEVICE_OPTIONS}
                  {...noneGroup("devices")}
                  noneLabel="ไม่พบพฤติกรรมข้างต้น"
                  columns={2}
                />
              )}
            </div>
          </SectionCard>
          )}

          {step === 4 && (
          <SectionCard no="6." title="ผู้ให้ข้อมูลและการรับรองข้อมูล">
            <div className="space-y-5">
              {question(
                "informant",
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Label htmlFor="informant" className="text-[13px] font-semibold">
                    ผู้ให้ข้อมูลนักเรียน
                  </Label>
                  {autoFilled.get("informant") && form.informant === student.guardianRelation && (
                    <AutoBadge source="registry" />
                  )}
                </div>
                <NativeSelect
                  id="informant"
                  value={form.informant}
                  onChange={(e) => set("informant", e.target.value)}
                  className="mt-2 md:max-w-xs"
                >
                  <option value="">เลือกผู้ให้ข้อมูล</option>
                  {INFORMANT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              )}

              {question(
                "canPhotoHome",
                <ChipSelect
                  label="ภาพถ่ายประกอบแบบฟอร์ม"
                  options={CAN_PHOTO_HOME_OPTIONS}
                  value={form.canPhotoHome ?? ""}
                  onChange={(v) =>
                    draft.update((prev) => ({
                      ...prev,
                      canPhotoHome: v,
                      // ถ่ายไม่ได้ = ใช้ภาพนักเรียนคู่ป้ายโรงเรียน (ค่าเดียวกับแบบฟอร์ม)
                      photoType: v === "no" ? SCHOOL_SIGN_PHOTO : prev.photoType === SCHOOL_SIGN_PHOTO ? "" : prev.photoType,
                      // ช่องรูปของสองแบบไม่ตรงกัน จึงล้างรูปเมื่อเปลี่ยนคำตอบ
                      photos: v === prev.canPhotoHome ? prev.photos : [],
                    }))
                  }
                  columns={2}
                />
              )}

              {form.canPhotoHome === "yes" &&
                question(
                  "photoType",
                  <ChipSelect
                    label="บ้านในภาพเป็นแบบไหน"
                    options={HOME_PHOTO_TYPE_OPTIONS}
                    value={form.photoType}
                    onChange={(v) => set("photoType", v)}
                    columns={3}
                  />
                )}

              {form.canPhotoHome === "no" &&
                question(
                  "photoReason",
                  <ChipSelect
                    label="เหตุผลที่ถ่ายรูปบ้านไม่ได้"
                    options={PHOTO_REASON_OPTIONS}
                    value={form.photoReason ?? ""}
                    onChange={(v) => set("photoReason", v)}
                    columns={2}
                    other={otherNote("photoReason", "ระบุเหตุผล")}
                  />
                )}

              {!!form.canPhotoHome &&
                question(
                  "photos",
                  <div className="grid gap-3 md:grid-cols-2">
                    {photoSlots(form.photoType).map((slot, i) => (
                      <PhotoSlot
                        key={slot.label}
                        label={slot.label}
                        value={form.photos?.[i] ?? ""}
                        onChange={(url) =>
                          draft.update((prev) => {
                            const photos = [...(prev.photos ?? [])];
                            photos[i] = url;
                            return { ...prev, photos };
                          })
                        }
                      />
                    ))}
                  </div>
                )}


              <div className="grid gap-4 md:grid-cols-2">
                <Field label="ผู้รับรองข้อมูล" source="registry">
                  <ReadOnly value={signer.name} />
                </Field>
                <Field label="ตำแหน่ง" source="registry">
                  <ReadOnly value={signer.title} />
                </Field>
              </div>

              <div className="rounded-xl border border-dashed border-border bg-surface px-4 py-6 text-center text-[12.5px] text-muted-foreground">
                พื้นที่ลงลายมือชื่อผู้ปกครอง / ผู้แทน และครูผู้รับรองข้อมูล
              </div>
            </div>
          </SectionCard>
          )}

          <MissingSummary missing={missing.missing.filter((m) => flagged(m.key))} onJump={missing.jumpTo} />

          <div className="flex flex-wrap items-center justify-between gap-3 pb-6">
            <div className="flex flex-col gap-0.5">
              <AutosaveStatus restored={draft.restored} savedAt={draft.savedAt} />
              <p className="text-[13px] text-muted-foreground">
                {pending.length > 0 ? (
                  <span>ทั้งฟอร์มยังเหลือ {pending.length} ข้อ</span>
                ) : (
                  "ตอบครบทุกข้อแล้ว · หลังบันทึก ระบบจะสรุปความเสี่ยงที่พบให้ดูต่อ"
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" onClick={() => router.push("/home-visits")}>
                ออกและทำต่อภายหลัง
              </Button>
              {step > 0 && (
                <Button variant="outline" onClick={() => goToStep(step - 1)}>
                  <ChevronLeft className="size-4" /> ย้อนกลับ
                </Button>
              )}
              {step < lastStep ? (
                <Button onClick={handleNext}>
                  ถัดไป <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button onClick={handleSave}>บันทึกผลการเยี่ยมบ้าน</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** ความสัมพันธ์ของสมาชิกครัวเรือน — เลือกจากรายการเดียวกันทุกแถว ค่าเก่าที่ไม่อยู่ในรายการยังแสดงได้ */
function RelationSelect({
  value,
  onChange,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
}) {
  const options =
    value === "" || MEMBER_RELATION_OPTIONS.includes(value)
      ? MEMBER_RELATION_OPTIONS
      : [value, ...MEMBER_RELATION_OPTIONS];
  return (
    <NativeSelect
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <option value="">เลือก</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </NativeSelect>
  );
}

/** ช่องแนบรูป: กดเพื่อถ่ายหรือเลือกจากเครื่อง ระบบย่อรูปก่อนเก็บ */
function PhotoSlot({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await resizeImage(file));
    } catch {
      setError("เปิดไฟล์นี้ไม่ได้ ลองเลือกรูปอื่น");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      {/* ไม่ใส่ capture เพื่อให้มือถือถามว่าจะถ่ายใหม่หรือเลือกจากคลังรูป */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label={label}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {value ? (
        <div className="overflow-hidden rounded-xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL ในต้นแบบ ใช้ next/image ไม่ได้ */}
          <img src={value} alt={label} className="h-44 w-full object-cover" />
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="flex-1 truncate text-[12.5px] text-muted-foreground">{label}</span>
            <Button size="sm" variant="ghost" onClick={() => inputRef.current?.click()}>
              <RefreshCw className="size-3.5" /> เปลี่ยน
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onChange("")} aria-label={`ลบ${label}`}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface px-4 text-center transition-colors hover:border-primary/50 hover:bg-accent"
        >
          {busy ? (
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          ) : (
            <Camera className="size-6 text-primary" />
          )}
          <span className="text-[13px] font-semibold text-primary">
            {busy ? "กำลังย่อรูป..." : "ถ่ายรูปหรือเลือกจากเครื่อง"}
          </span>
          <span className="text-[12px] text-muted-foreground">{label}</span>
        </button>
      )}
      {error && <p className="mt-1 text-[12.5px] text-destructive">{error}</p>}
    </div>
  );
}

/** แถบขั้นของแบบฟอร์ม: กดไปขั้นไหนก็ได้ และบอกจำนวนข้อที่ยังเหลือของแต่ละขั้น */
function VisitStepper({
  step,
  pendingIn,
  onSelect,
}: {
  step: number;
  pendingIn: (i: number) => number;
  onSelect: (i: number) => void;
}) {
  return (
    <nav aria-label="ขั้นของแบบฟอร์ม" className="overflow-x-auto">
      <ol className="flex min-w-max gap-2">
        {VISIT_STEPS.map((s, i) => {
          const left = pendingIn(i);
          const active = i === step;
          return (
            <li key={s.title}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-colors",
                  active ? "border-primary bg-accent" : "border-border bg-card hover:bg-muted/60"
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    left === 0
                      ? "bg-risk-green-bg text-risk-green"
                      : active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {left === 0 ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <span>
                  <span
                    className={cn(
                      "block text-[13px] font-semibold",
                      active ? "text-primary" : "text-foreground"
                    )}
                  >
                    {s.title}
                  </span>
                  <span className="block text-[11.5px] text-muted-foreground">
                    {s.sections} · {left === 0 ? "ครบแล้ว" : `เหลือ ${left} ข้อ`}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** ยืนยันข้อมูลที่ดึงจากการเยี่ยมครั้งก่อนทั้งส่วนในครั้งเดียว (UC5 ทางเลือก A) */
function ConfirmPrevious({
  what,
  summary,
  confirmed,
  onToggle,
}: {
  what: string;
  /** สรุปสั้นของค่าปัจจุบัน ให้ครูยืนยันได้โดยไม่ต้องเลื่อนดูทุกข้อ */
  summary: string;
  confirmed: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3",
        confirmed ? "border-risk-green/40 bg-risk-green-bg" : "border-border bg-surface"
      )}
    >
      <div className="min-w-0 flex-1">
        <p className={cn("text-[13px] font-semibold", confirmed ? "text-risk-green" : "text-foreground")}>
          {confirmed
            ? `ยืนยันแล้วว่า${what}ถูกต้อง`
            : `${what}จากการเยี่ยมครั้งก่อน ยังเหมือนเดิมไหม`}
        </p>
        {summary && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{summary}</p>}
        {!confirmed && (
          <p className="mt-0.5 text-[12px] text-muted-foreground">ถ้ามีอะไรเปลี่ยน แก้ด้านล่างก่อนแล้วจึงยืนยัน</p>
        )}
      </div>
      <Button size="sm" variant={confirmed ? "ghost" : "default"} onClick={onToggle}>
        {confirmed ? "ยกเลิกการยืนยัน" : <><Check className="size-4" /> ข้อมูลถูกต้อง</>}
      </Button>
    </div>
  );
}

/** สมาชิกครัวเรือนบนมือถือ: แสดงเฉพาะประเภทรายได้ที่มีค่า ที่เหลือกดเพิ่มทีละประเภท */
function MemberCard({
  member,
  index,
  onChange,
  onRemove,
}: {
  member: HouseholdMemberRow;
  index: number;
  onChange: (patch: Partial<HouseholdMemberRow>) => void;
  onRemove: () => void;
}) {
  const [added, setAdded] = useState<IncomeKey[]>([]);
  const shown = INCOME_COLUMNS.filter((c) => member.income[c.key] > 0 || added.includes(c.key));
  const hidden = INCOME_COLUMNS.filter((c) => !shown.includes(c));

  return (
    <div className="rounded-xl border border-border p-3.5">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label className="text-[12px] text-muted-foreground">ความสัมพันธ์</Label>
          <RelationSelect
            value={member.relation}
            onChange={(relation) => onChange({ relation })}
            label={`ความสัมพันธ์ของสมาชิกคนที่ ${index + 1}`}
            className="mt-1"
          />
        </div>
        <div className="w-20">
          <Label className="text-[12px] text-muted-foreground">อายุ</Label>
          <Input
            inputMode="numeric"
            value={member.age}
            onChange={(e) => onChange({ age: e.target.value === "" ? "" : Number(e.target.value) })}
            className="mt-1 h-10 text-center"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`ลบสมาชิกคนที่ ${index + 1}`}
          className="flex size-10 items-center justify-center text-muted-foreground hover:text-risk-red"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <label className="mt-3 flex items-center gap-2 text-[13px]">
        <Checkbox
          checked={member.disability}
          onCheckedChange={() => onChange({ disability: !member.disability })}
        />
        มีความพิการ
      </label>

      <div className="mt-3 space-y-2">
        {shown.map((col) => (
          <div key={col.key} className="flex items-center gap-2">
            <span className="flex-1 text-[12.5px] text-muted-foreground">{col.label}</span>
            <Input
              inputMode="numeric"
              value={member.income[col.key] || ""}
              onChange={(e) =>
                onChange({ income: { ...member.income, [col.key]: Number(e.target.value) || 0 } })
              }
              placeholder="0"
              className="h-10 w-28 text-right"
            />
          </div>
        ))}
        {hidden.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {hidden.map((col) => (
              <button
                key={col.key}
                type="button"
                onClick={() => setAdded((prev) => [...prev, col.key])}
                className="flex items-center gap-1 rounded-lg border border-dashed border-border px-2.5 py-1.5 text-[12px] text-muted-foreground hover:bg-muted"
              >
                <Plus className="size-3.5" /> {col.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex justify-between border-t border-border pt-2 text-[13px]">
          <span className="text-muted-foreground">รวมรายได้</span>
          <b>{formatBaht(memberTotal(member))} บาท/เดือน</b>
        </div>
      </div>
    </div>
  );
}

/** หลังบันทึก: สรุปสิ่งที่พบ และเสนอเปิด case เมื่อพบความเสี่ยง (UC5 ทางเลือก B) */
function VisitSaved({
  studentId,
  studentName,
  findings,
  poor,
  hasCase,
  changes,
}: {
  studentId: string;
  studentName: string;
  findings: string[];
  poor: boolean;
  hasCase: boolean;
  /** มี = เป็นการแก้ไขผลที่ส่งแล้ว */
  changes?: string[];
}) {
  const atRisk = findings.length > 0 || poor;

  return (
    <>
      <PageHeader title="แบบบันทึกการเยี่ยมบ้านนักเรียน" subtitle={studentName} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-6 text-risk-green" />
              <h2 className="text-[17px] font-bold">{changes ? "บันทึกการแก้ไขผลแล้ว" : "บันทึกผลการเยี่ยมบ้านแล้ว"}</h2>
            </div>
            <p className="mt-1.5 text-[13.5px] text-muted-foreground">
              {changes
                ? `เปลี่ยน: ${changes.length > 0 ? changes.join(", ") : "ไม่มีหัวข้อที่เปลี่ยน"} · เก็บประวัติการแก้ไขแล้ว และส่งคำขอให้นักเรียนหรือผู้ปกครองยืนยันใหม่โดยเริ่มนับเวลาใหม่`
                : "ส่งคำขอให้นักเรียนหรือผู้ปกครองยืนยันว่าได้เยี่ยมจริงแล้ว ดูผลย้อนหลังได้ที่หน้าจัดการการเยี่ยมบ้าน"}
            </p>
          </div>

          {atRisk ? (
            <div className="rounded-xl border border-risk-amber/40 bg-risk-amber-bg p-6">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="size-5 text-risk-amber" />
                <h3 className="text-[15px] font-bold text-risk-amber">
                  พบสิ่งที่ควรติดตาม {findings.length + (poor ? 1 : 0)} รายการ
                </h3>
              </div>
              <ul className="mt-3 space-y-1.5">
                {poor && (
                  <li className="text-[13.5px]">
                    • รายได้เฉลี่ยต่อคนต่ำกว่าเกณฑ์ยากจน ({formatBaht(POVERTY_LINE)} บาท/เดือน)
                  </li>
                )}
                {findings.map((f) => (
                  <li key={f} className="text-[13.5px]">
                    • {f}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[13px] text-muted-foreground">
                {hasCase
                  ? "นักเรียนมีกรณีช่วยเหลืออยู่แล้ว ควรบันทึกผลการเยี่ยมบ้านเป็นการติดตามในกรณี"
                  : "ควรเปิดกรณีช่วยเหลือเพื่อวางแผนดูแลต่อ"}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <LinkButton href={`/care-cases?student=${studentId}&from=home_visit`}>
                  {hasCase ? "ไปที่กรณีของนักเรียน" : "เปิดกรณีช่วยเหลือ"}
                </LinkButton>
                <LinkButton variant="outline" href="/home-visits">
                  กลับไปรายการนัดหมาย
                </LinkButton>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="text-[13.5px]">ไม่พบความเสี่ยงจากการเยี่ยมบ้านครั้งนี้</p>
              <LinkButton className="mt-4" href="/home-visits">
                กลับไปรายการนัดหมาย
              </LinkButton>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * ข้อมูลพื้นฐานไม่ตรงทะเบียน (UC5 Alt-D)
 * แก้เฉพาะการเยี่ยมครั้งนี้ ระบบไม่แก้ข้อมูลต้นทาง เลือกส่งคำขอแก้ไปฝ่ายทะเบียนได้
 * ส่งไม่ได้ (ออฟไลน์) เก็บไว้ให้แอดมินส่งออกไปให้ฝ่ายทะเบียน
 */
function RegistryMismatch({
  student,
  overrides,
  onApply,
}: {
  student: Student;
  overrides: Partial<Record<RegistryField, string>>;
  onApply: (field: RegistryField, value: string) => void;
}) {
  const store = useStore();
  const online = useOnline();
  const [field, setField] = useState<RegistryField | null>(null);
  const [value, setValue] = useState("");
  const [request, setRequest] = useState(true);
  const fields = Object.keys(REGISTRY_FIELD_LABEL) as RegistryField[];
  const requests = store.registryCorrections.filter((r) => r.studentId === student.studentId);
  const original = (f: RegistryField) => student[f];

  return (
    <div className="mb-4">
      {Object.keys(overrides).length > 0 && (
        <ul className="mb-2 space-y-1 text-[12.5px]">
          {(Object.entries(overrides) as [RegistryField, string][]).map(([f, v]) => {
            const req = requests.filter((r) => r.field === f).at(-1);
            return (
              <li key={f} className="rounded-md bg-surface px-3 py-1.5">
                <b>{REGISTRY_FIELD_LABEL[f]}</b>: {original(f)} → {v} · ใช้เฉพาะการเยี่ยมครั้งนี้
                {req && (req.status === "sent" ? " · ส่งคำขอแก้ไปฝ่ายทะเบียนแล้ว" : " · ส่งคำขอไม่สำเร็จ เก็บไว้ให้แอดมินส่งต่อ")}
              </li>
            );
          })}
        </ul>
      )}
      {field === null ? (
        <button type="button" onClick={() => setField(fields[0])} className="text-[12.5px] font-semibold text-primary hover:underline">
          ข้อมูลพื้นฐานไม่ตรงกับที่พบจริง?
        </button>
      ) : (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex flex-wrap gap-1.5">
            {fields.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={field === f}
                onClick={() => {
                  setField(f);
                  setValue(overrides[f] ?? "");
                }}
                className={`rounded-md border px-2.5 py-1 text-[12.5px] ${field === f ? "border-primary bg-accent font-semibold text-primary" : "border-border"}`}
              >
                {REGISTRY_FIELD_LABEL[f]}
              </button>
            ))}
          </div>
          <div className="text-[12px] text-muted-foreground">ตามทะเบียน: {original(field)}</div>
          <Input aria-label="ข้อมูลที่พบจริง" value={value} onChange={(e) => setValue(e.target.value)} placeholder="ข้อมูลที่พบจริง" />
          <label className="flex items-center gap-2 text-[12.5px]">
            <Checkbox checked={request} onCheckedChange={(v) => setRequest(!!v)} />
            ส่งคำขอแก้ไขไปยังฝ่ายทะเบียน
          </label>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setField(null)}>
              ยกเลิก
            </Button>
            <Button
              size="sm"
              disabled={value.trim() === "" || value.trim() === original(field)}
              onClick={() => {
                onApply(field, value.trim());
                if (request)
                  store.requestRegistryCorrection(
                    { studentId: student.studentId, field, from: original(field), to: value.trim() },
                    online
                  );
                setField(null);
                setValue("");
              }}
            >
              ใช้สำหรับการเยี่ยมครั้งนี้
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReadOnly({ value }: { value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[13.5px] font-medium">
      {value}
    </div>
  );
}


