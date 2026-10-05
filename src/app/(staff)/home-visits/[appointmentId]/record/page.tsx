"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, ChevronLeft, Plus, Sparkles, Trash2 } from "lucide-react";
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
import { previousVisitForms, SCHOOL_NAME } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { formatBaht, formatThaiDate } from "@/lib/format";
import {
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
  memberTotal,
  PHOTO_TYPE_OPTIONS,
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
    if (appointment?.caretakerName) map.set("caretakerNote", "guardian");
    if (appointment?.guardianNote) map.set("guardianConcern", "guardian");
    if (appointment?.guardianNote) map.set("supportRequests", "guardian");
    // จากการเยี่ยมบ้านครั้งก่อน
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

  const guardians = student ? store.guardiansOf(student.studentId) : [];

  const initialMembers: HouseholdMemberRow[] = previous
    ? previous.householdMembers.map((m) => ({ ...m }))
    : [
        {
          id: "m1",
          relation: "",
          age: "",
          disability: false,
          income: { wage: 0, agriculture: 0, business: 0, welfare: 0, other: 0 },
        },
      ];

  const [members, setMembers] = useState<HouseholdMemberRow[]>(initialMembers);
  const [dependencies, setDependencies] = useState<string[]>(previous?.dependencies ?? []);
  const [housingType, setHousingType] = useState(previous?.housingType ?? "");
  const [housingConditions, setHousingConditions] = useState<string[]>(
    previous?.housingConditions ?? []
  );
  const [vehicles, setVehicles] = useState<Record<string, boolean | undefined>>(() =>
    Object.fromEntries((previous?.vehicles ?? []).map((v) => [v, true]))
  );
  const [farmland, setFarmland] = useState(previous?.farmland ?? "");
  const [hoursTogether, setHoursTogether] = useState(previous?.hoursTogether ?? "");
  const [relations, setRelations] = useState<Record<string, string>>({});
  const [caretakerWhenAway, setCaretakerWhenAway] = useState(previous?.caretakerWhenAway ?? "");
  const [supportRequests, setSupportRequests] = useState<string[]>(
    appointment?.guardianNote ? ["economic"] : []
  );
  const [welfareReceived, setWelfareReceived] = useState<string[]>([]);
  const [guardianConcern, setGuardianConcern] = useState(appointment?.guardianNote ?? "");
  const [healthRisks, setHealthRisks] = useState<string[]>([]);
  const [welfareRisks, setWelfareRisks] = useState<string[]>([]);
  const [travelKm, setTravelKm] = useState(previous?.travelKm ?? "");
  const [travelHours, setTravelHours] = useState(previous?.travelHours ?? "");
  const [travelMinutes, setTravelMinutes] = useState(previous?.travelMinutes ?? "");
  const [travelMode, setTravelMode] = useState(previous?.travelMode ?? "");
  const [duties, setDuties] = useState<string[]>(previous?.duties ?? []);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [substances, setSubstances] = useState<string[]>([]);
  const [violence, setViolence] = useState<string[]>([]);
  const [sexual, setSexual] = useState<string[]>([]);
  const [gaming, setGaming] = useState<string[]>([]);
  const [internet, setInternet] = useState(previous?.internet ?? "");
  const [devices, setDevices] = useState<string[]>([]);
  const [informant, setInformant] = useState("");
  const [photoType, setPhotoType] = useState("");
  const [onlyEmpty, setOnlyEmpty] = useState(false);

  if (!appointment || !student) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">ไม่พบนัดหมายเยี่ยมบ้าน</p>
      </div>
    );
  }

  const totalIncome = members.reduce((sum, m) => sum + memberTotal(m), 0);
  const perCapita = members.length > 0 ? Math.round(totalIncome / members.length) : 0;

  /** สลับค่าในรายการแบบ functional update — กันการกดติดกันเร็ว ๆ แล้วค่าหาย */
  const toggle = (
    set: React.Dispatch<React.SetStateAction<string[]>>,
    id: string
  ) => set((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const autoCount = autoFilled.size;
  const totalFields = 24;
  const percent = Math.round((autoCount / totalFields) * 100);

  const bySource = (source: FillSource) =>
    [...autoFilled.values()].filter((v) => v === source).length;

  const handleSave = () => {
    store.setAppointmentStatus(appointmentId, "completed");
    router.push("/home-visits");
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
                  ข้อมูลเดิมจากการเยี่ยมบ้านเมื่อ {formatThaiDate(previous.visitedAt)}
                </span>
              )}
            </div>
          </div>

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
                  <ReadOnly value={student.citizenId} />
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
                  <ReadOnly value={appointment.guardianPhone ?? guardians[0]?.user.phone ?? "-"} />
                </Field>
                <Field label="ที่อยู่" source="registry" className="md:col-span-2">
                  <ReadOnly value={student.address} />
                </Field>
                <Field label="อาชีพผู้ปกครอง" htmlFor="occupation">
                  <Input id="occupation" placeholder="สอบถามในวันเยี่ยมบ้าน" />
                </Field>
                <Field label="การศึกษาสูงสุดของผู้ปกครอง" htmlFor="education">
                  <Input id="education" placeholder="สอบถามในวันเยี่ยมบ้าน" />
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
                onClick={() =>
                  setMembers((prev) => [
                    ...prev,
                    {
                      id: `m${Date.now()}`,
                      relation: "",
                      age: "",
                      disability: false,
                      income: { wage: 0, agriculture: 0, business: 0, welfare: 0, other: 0 },
                    },
                  ])
                }
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
                selected={dependencies}
                onToggle={(id) => toggle(setDependencies, id)}
                onClear={() => setDependencies([])}
                source={autoFilled.get("dependencies")}
                noneLabel="ไม่มีภาระพึ่งพิง"
                columns={2}
              />
              <ChipSelect
                label="4.2 ประเภทที่อยู่อาศัย"
                options={HOUSING_TYPE_OPTIONS}
                value={housingType}
                onChange={setHousingType}
                source={autoFilled.get("housingType")}
                columns={3}
              />
              <ChipGroup
                label="4.3 สภาพที่อยู่อาศัย"
                options={HOUSING_CONDITION_OPTIONS}
                selected={housingConditions}
                onToggle={(id) => toggle(setHousingConditions, id)}
                onClear={() => setHousingConditions([])}
                source={autoFilled.get("housingConditions")}
                noneLabel="สภาพบ้านปกติ"
                columns={1}
              />
              <YesNoRows
                label="4.4 ยานพาหนะของครอบครัว"
                rows={VEHICLE_OPTIONS}
                values={vehicles}
                onChange={(id, value) => setVehicles((prev) => ({ ...prev, [id]: value }))}
                source={autoFilled.get("vehicles")}
              />
              <ChipSelect
                label="4.5 ที่ดินทำกิน"
                options={FARMLAND_OPTIONS}
                value={farmland}
                onChange={setFarmland}
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
                    value={hoursTogether}
                    onChange={(e) => setHoursTogether(e.target.value)}
                    placeholder="ชั่วโมง/วัน"
                  />
                </Field>
              </div>

              <SegmentedRows
                label="5.2 ความสัมพันธ์ระหว่างนักเรียนกับสมาชิกในครอบครัว"
                hint="เลือกระดับความสัมพันธ์ของแต่ละคน หากไม่มีสมาชิกคนนั้นให้เลือก “ไม่มี”"
                rows={FAMILY_MEMBERS}
                choices={RELATIONSHIP_LEVELS}
                values={relations}
                onChange={(row, choice) =>
                  setRelations((prev) => ({ ...prev, [row]: choice }))
                }
              />

              <ChipSelect
                label="5.3 กรณีที่ผู้ปกครองไม่อยู่บ้าน ฝากนักเรียนอยู่บ้านกับใคร"
                options={CARETAKER_OPTIONS}
                value={caretakerWhenAway}
                onChange={setCaretakerWhenAway}
                source={autoFilled.get("caretakerWhenAway")}
                columns={4}
              />

              {appointment.caretakerName && (
                <div className="flex items-center gap-2 rounded-lg bg-risk-green-bg px-3.5 py-2.5">
                  <AutoBadge source="guardian" />
                  <span className="text-[12.5px] text-risk-green">
                    ผู้ปกครองระบุไว้ล่วงหน้าว่า: {appointment.caretakerName}
                  </span>
                </div>
              )}

              <ChipGroup
                label="5.6 สิ่งที่ผู้ปกครองต้องการให้โรงเรียนช่วยเหลือนักเรียน"
                options={SUPPORT_REQUEST_OPTIONS}
                selected={supportRequests}
                onToggle={(id) => toggle(setSupportRequests, id)}
                onClear={() => setSupportRequests([])}
                source={autoFilled.get("supportRequests")}
                columns={2}
              />

              <ChipGroup
                label="5.7 ความช่วยเหลือที่ครอบครัวเคยได้รับหรือต้องการได้รับ"
                options={WELFARE_RECEIVED_OPTIONS}
                selected={welfareReceived}
                onToggle={(id) => toggle(setWelfareReceived, id)}
                onClear={() => setWelfareReceived([])}
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
                  value={guardianConcern}
                  onChange={(e) => setGuardianConcern(e.target.value)}
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
                selected={healthRisks}
                onToggle={(id) => toggle(setHealthRisks, id)}
                onClear={() => setHealthRisks([])}
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
                selected={welfareRisks}
                onToggle={(id) => toggle(setWelfareRisks, id)}
                onClear={() => setWelfareRisks([])}
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
                    <Input id="km" value={travelKm} onChange={(e) => setTravelKm(e.target.value)} />
                  </Field>
                  <Field label="เวลาเดินทาง (ชั่วโมง)" htmlFor="hh">
                    <Input id="hh" value={travelHours} onChange={(e) => setTravelHours(e.target.value)} />
                  </Field>
                  <Field label="เวลาเดินทาง (นาที)" htmlFor="mm">
                    <Input
                      id="mm"
                      value={travelMinutes}
                      onChange={(e) => setTravelMinutes(e.target.value)}
                    />
                  </Field>
                </div>
                <div className="mt-4">
                  <ChipSelect
                    label="วิธีการเดินทาง"
                    options={TRAVEL_OPTIONS}
                    value={travelMode}
                    onChange={setTravelMode}
                    columns={4}
                  />
                </div>
              </div>

              <ChipGroup
                label="6.4 ภาระงานความรับผิดชอบของนักเรียนต่อครอบครัว"
                options={DUTY_OPTIONS}
                selected={duties}
                onToggle={(id) => toggle(setDuties, id)}
                onClear={() => setDuties([])}
                source={autoFilled.get("duties")}
                noneLabel="ไม่มีภาระงาน"
                columns={2}
              />

              <ChipGroup
                label="6.5 กิจกรรมยามว่างหรืองานอดิเรก"
                options={HOBBY_OPTIONS}
                selected={hobbies}
                onToggle={(id) => toggle(setHobbies, id)}
                onClear={() => setHobbies([])}
                columns={3}
              />

              <ChipGroup
                label="6.6 พฤติกรรมการใช้สารเสพติด"
                options={SUBSTANCE_OPTIONS}
                selected={substances}
                onToggle={(id) => toggle(setSubstances, id)}
                onClear={() => setSubstances([])}
                noneLabel="ไม่พบความเสี่ยง"
                columns={2}
              />

              <ChipGroup
                label="6.7 พฤติกรรมการใช้ความรุนแรง"
                options={VIOLENCE_OPTIONS}
                selected={violence}
                onToggle={(id) => toggle(setViolence, id)}
                onClear={() => setViolence([])}
                noneLabel="ไม่พบความเสี่ยง"
                columns={3}
              />

              <ChipGroup
                label="6.8 พฤติกรรมทางเพศ"
                options={SEXUAL_OPTIONS}
                selected={sexual}
                onToggle={(id) => toggle(setSexual, id)}
                onClear={() => setSexual([])}
                noneLabel="ไม่พบความเสี่ยง"
                columns={2}
              />

              <ChipGroup
                label="6.9 การติดเกม"
                options={GAMING_OPTIONS}
                selected={gaming}
                onToggle={(id) => toggle(setGaming, id)}
                onClear={() => setGaming([])}
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
                value={internet}
                onChange={setInternet}
                source={autoFilled.get("internet")}
                columns={2}
              />

              <ChipGroup
                label="6.11 การใช้เครื่องมือสื่อสารอิเล็กทรอนิกส์"
                options={DEVICE_OPTIONS}
                selected={devices}
                onToggle={(id) => toggle(setDevices, id)}
                onClear={() => setDevices([])}
                noneLabel="ไม่พบพฤติกรรมข้างต้น"
                columns={2}
              />
            </div>
          </SectionCard>


          <SectionCard no="7." title="ผู้ให้ข้อมูลและการรับรองข้อมูล" description="หน้า 3–4 ของแบบฟอร์ม">
            <div className="space-y-5">
              <div>
                <Label className="text-[13px] font-semibold">ผู้ให้ข้อมูลนักเรียน</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {INFORMANT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setInformant(opt)}
                      className={
                        informant === opt
                          ? "rounded-lg border border-primary bg-accent px-3.5 py-1.5 text-[13px] font-semibold text-primary"
                          : "rounded-lg border border-border px-3.5 py-1.5 text-[13px] text-muted-foreground hover:bg-muted"
                      }
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <ChipSelect
                label="ภาพถ่ายที่แนบมาคือ"
                options={PHOTO_TYPE_OPTIONS}
                value={photoType}
                onChange={setPhotoType}
                columns={2}
              />

              <div className="grid gap-3 md:grid-cols-2">
                {["รูปที่ 1 ภาพถ่ายสภาพบ้านนักเรียน (มีหลังคาและฝาบ้าน)", "รูปที่ 2 ภาพถ่ายภายในบ้านนักเรียน"].map(
                  (label) => (
                    <div
                      key={label}
                      className="flex h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface px-4 text-center"
                    >
                      <Camera className="size-6 text-muted-foreground" />
                      <span className="text-[12.5px] text-muted-foreground">{label}</span>
                    </div>
                  )
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="ผู้รับรองข้อมูล" source="registry">
                  <ReadOnly value={store.currentUser.name} />
                </Field>
                <Field label="ตำแหน่ง" source="registry">
                  <ReadOnly value="ครูประจำชั้น" />
                </Field>
              </div>

              <div className="rounded-xl border border-dashed border-border bg-surface px-4 py-6 text-center text-[12.5px] text-muted-foreground">
                พื้นที่ลงลายมือชื่อผู้ปกครอง / ผู้แทน และครูผู้รับรองข้อมูล
              </div>
            </div>
          </SectionCard>

          <div className="flex items-center justify-between pb-6">
            <p className="text-[13px] text-muted-foreground">
              ข้อมูลที่บันทึกจะเชื่อมกับผลการคัดกรองและ case การช่วยเหลือของนักเรียนโดยอัตโนมัติ
            </p>
            <div className="flex gap-3">
              <LinkButton variant="outline" href="/home-visits">
                บันทึกร่าง
              </LinkButton>
              <Button onClick={handleSave}>บันทึกผลการเยี่ยมบ้าน</Button>
            </div>
          </div>
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


