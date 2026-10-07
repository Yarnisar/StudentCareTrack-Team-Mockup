"use client";

import { CopyButton, Field, ReadOnly, SectionCard } from "../field-shell";
import { ChipGroup } from "../option-inputs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DISABILITY_OPTIONS, DISADVANTAGE_OPTIONS } from "@/lib/home-visit-form";
import { SCHOOL_NAME } from "@/lib/mock-data";
import type { HomeVisitAppointment, Student } from "@/lib/types";
import type { RecordFormApi } from "./form-state";

/** ข้อ 1–2 : ข้อมูลนักเรียน ผู้ปกครอง ที่อยู่ ด้อยโอกาสและความพิการ (หน้า 1 ของแบบฟอร์ม) */
export function StudentSection({
  api,
  student,
  appointment,
  guardians,
  sensitive,
}: {
  api: RecordFormApi;
  student: Student;
  appointment: HomeVisitAppointment;
  guardians: { name: string; relation: string; phone?: string }[];
  sensitive: boolean;
}) {
  const f = api.form;
  const registryAddress = sensitive ? student.address : "";

  return (
    <>
      <SectionCard no="1." title="ข้อมูลนักเรียนและผู้ปกครอง" description="ข้อมูลจากทะเบียนนักเรียน">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="โรงเรียน">
            <ReadOnly value={SCHOOL_NAME} />
          </Field>
          <Field label="ชื่อ-นามสกุลนักเรียน">
            <ReadOnly value={student.fullName} />
          </Field>
          <Field label="ชั้น / เลขที่">
            <ReadOnly value={`${student.roomName} เลขที่ ${student.classNo}`} />
          </Field>
          <Field label="เลขที่บัตรประชาชนนักเรียน">
            <ReadOnly value={sensitive ? student.citizenId : "—"} />
          </Field>
          <Field label="ชื่อผู้ปกครอง">
            <ReadOnly value={guardians.map((g) => g.name).join(", ") || "-"} />
          </Field>
          <Field label="ความสัมพันธ์กับนักเรียน">
            <ReadOnly value={guardians.map((g) => g.relation).join(", ") || "-"} />
          </Field>
          <Field label="เบอร์โทรศัพท์" source={api.sourceOf("guardianPhone")}>
            <ReadOnly
              value={sensitive ? (appointment.guardianPhone ?? guardians[0]?.phone ?? "-") : "—"}
            />
          </Field>
          <Field label="ที่อยู่ตามทะเบียนบ้าน" className="md:col-span-2">
            <ReadOnly value={sensitive ? student.address : "—"} />
          </Field>
          <Field
            label="ที่อยู่ปัจจุบัน (ที่ไปเยี่ยมจริง)"
            htmlFor="current-address"
            className="md:col-span-2"
            carry={api.carryOf("currentAddress")}
            action={
              <CopyButton
                label="คัดลอกจากทะเบียนบ้าน"
                disabled={api.readOnly || !registryAddress}
                onClick={() => api.setForm("currentAddress", registryAddress)}
              />
            }
          >
            <Textarea
              id="current-address"
              rows={2}
              value={f.currentAddress}
              onChange={(e) => api.setForm("currentAddress", e.target.value)}
              placeholder="กรอกเมื่อที่อยู่ปัจจุบันต่างจากทะเบียนบ้าน"
            />
          </Field>
          <Field
            label="อาชีพผู้ปกครอง"
            htmlFor="occupation"
            carry={api.carryOf("guardianOccupation")}
          >
            <Input
              id="occupation"
              value={f.guardianOccupation}
              onChange={(e) => api.setForm("guardianOccupation", e.target.value)}
              placeholder="สอบถามในวันเยี่ยมบ้าน"
            />
          </Field>
          <Field
            label="การศึกษาสูงสุดของผู้ปกครอง"
            htmlFor="education"
            carry={api.carryOf("guardianEducation")}
          >
            <Input
              id="education"
              value={f.guardianEducation}
              onChange={(e) => api.setForm("guardianEducation", e.target.value)}
              placeholder="สอบถามในวันเยี่ยมบ้าน"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        no="2."
        title="ประเภทความด้อยโอกาสและความพิการ"
        description="เลือกได้หลายข้อ"
      >
        <div className="space-y-6">
          <ChipGroup
            label="2.1 ประเภทความด้อยโอกาส"
            options={DISADVANTAGE_OPTIONS}
            selected={f.disadvantages}
            onToggle={(id) => api.toggleIn("disadvantages", id)}
            onClear={() => api.setForm("disadvantages", [])}
            carry={api.carryOf("disadvantages")}
            noneLabel="ไม่ด้อยโอกาส"
            columns={2}
          />
          <ChipGroup
            label="2.2 ประเภทความพิการ"
            options={DISABILITY_OPTIONS}
            selected={f.disabilities}
            onToggle={(id) => api.toggleIn("disabilities", id)}
            onClear={() => api.setForm("disabilities", [])}
            carry={api.carryOf("disabilities")}
            hint="ใช้ผลการวินิจฉัยหรือเอกสารรับรองที่ผู้ปกครองแจ้ง ไม่ใช่การประเมินของครู"
            noneLabel="ไม่พิการ"
            columns={2}
          />
        </div>
      </SectionCard>
    </>
  );
}
