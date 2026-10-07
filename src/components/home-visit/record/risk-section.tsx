"use client";

import { Field, SectionCard } from "../field-shell";
import { ChipGroup, ChipSelect } from "../option-inputs";
import { Input } from "@/components/ui/input";
import {
  DEVICE_OPTIONS,
  DUTY_OPTIONS,
  GAMING_OPTIONS,
  HEALTH_RISK_OPTIONS,
  HOBBY_OPTIONS,
  INTERNET_OPTIONS,
  SEXUAL_OPTIONS,
  SUBSTANCE_OPTIONS,
  TRAVEL_OPTIONS,
  VIOLENCE_OPTIONS,
  WELFARE_RISK_OPTIONS,
} from "@/lib/home-visit-form";
import type { RecordFormApi } from "./form-state";

/** ข้อ 6 : พฤติกรรมและความเสี่ยง (หน้า 2–3 ของแบบฟอร์ม) */
export function RiskSection({ api }: { api: RecordFormApi }) {
  const f = api.form;

  return (
    <SectionCard no="6." title="พฤติกรรมและความเสี่ยง">
      <div className="space-y-6">
        <ChipGroup
          label="6.1 สุขภาพ"
          options={HEALTH_RISK_OPTIONS}
          selected={f.healthRisks}
          onToggle={(id) => api.toggleIn("healthRisks", id)}
          onClear={() => api.setForm("healthRisks", [])}
          source={api.sourceOf("healthRisks")}
          noneLabel="สุขภาพปกติดี"
          columns={2}
        />

        <ChipGroup
          label="6.2 สวัสดิภาพหรือความปลอดภัย"
          options={WELFARE_RISK_OPTIONS}
          selected={f.welfareRisks}
          onToggle={(id) => api.toggleIn("welfareRisks", id)}
          onClear={() => api.setForm("welfareRisks", [])}
          source={api.sourceOf("welfareRisks")}
          noneLabel="ไม่พบความเสี่ยง"
          columns={2}
        />

        <div>
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-semibold">6.3 ระยะทางและการเดินทางมาโรงเรียน</span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="ระยะทางไป-กลับ (กิโลเมตร)" htmlFor="km" carry={api.carryOf("travelKm")}>
              <Input id="km" value={f.travelKm} onChange={(e) => api.setForm("travelKm", e.target.value)} />
            </Field>
            <Field label="เวลาเดินทาง (ชั่วโมง)" htmlFor="hh">
              <Input
                id="hh"
                value={f.travelHours}
                onChange={(e) => api.setForm("travelHours", e.target.value)}
              />
            </Field>
            <Field label="เวลาเดินทาง (นาที)" htmlFor="mm">
              <Input
                id="mm"
                value={f.travelMinutes}
                onChange={(e) => api.setForm("travelMinutes", e.target.value)}
              />
            </Field>
          </div>
          <div className="mt-4">
            <ChipSelect
              label="วิธีการเดินทาง"
              options={TRAVEL_OPTIONS}
              value={f.travelMode}
              onChange={(v) => api.setForm("travelMode", v)}
              carry={api.carryOf("travelMode")}
              columns={4}
            />
          </div>
        </div>

        <ChipGroup
          label="6.4 ภาระงานความรับผิดชอบของนักเรียนต่อครอบครัว"
          options={DUTY_OPTIONS}
          selected={f.duties}
          onToggle={(id) => api.toggleIn("duties", id)}
          onClear={() => api.setForm("duties", [])}
          source={api.sourceOf("duties")}
          carry={api.carryOf("duties")}
          noneLabel="ไม่มีภาระงาน"
          columns={2}
        />

        <ChipGroup
          label="6.5 กิจกรรมยามว่างหรืองานอดิเรก"
          options={HOBBY_OPTIONS}
          selected={f.hobbies}
          onToggle={(id) => api.toggleIn("hobbies", id)}
          onClear={() => api.setForm("hobbies", [])}
          columns={3}
        />

        <ChipGroup
          label="6.6 พฤติกรรมการใช้สารเสพติด"
          options={SUBSTANCE_OPTIONS}
          selected={f.substances}
          onToggle={(id) => api.toggleIn("substances", id)}
          onClear={() => api.setForm("substances", [])}
          noneLabel="ไม่พบความเสี่ยง"
          columns={2}
        />

        <ChipGroup
          label="6.7 พฤติกรรมการใช้ความรุนแรง"
          options={VIOLENCE_OPTIONS}
          selected={f.violence}
          onToggle={(id) => api.toggleIn("violence", id)}
          onClear={() => api.setForm("violence", [])}
          noneLabel="ไม่พบความเสี่ยง"
          columns={3}
        />

        <ChipGroup
          label="6.8 พฤติกรรมทางเพศ"
          options={SEXUAL_OPTIONS}
          selected={f.sexual}
          onToggle={(id) => api.toggleIn("sexual", id)}
          onClear={() => api.setForm("sexual", [])}
          noneLabel="ไม่พบความเสี่ยง"
          columns={2}
        />

        <ChipGroup
          label="6.9 การติดเกม"
          options={GAMING_OPTIONS}
          selected={f.gaming}
          onToggle={(id) => api.toggleIn("gaming", id)}
          onClear={() => api.setForm("gaming", [])}
          source={api.sourceOf("gaming")}
          noneLabel="ไม่พบความเสี่ยง"
          columns={3}
        />

        <ChipSelect
          label="6.10 การเข้าถึงสื่อคอมพิวเตอร์และอินเทอร์เน็ตที่บ้าน"
          options={INTERNET_OPTIONS}
          value={f.internet}
          onChange={(v) => api.setForm("internet", v)}
          source={api.sourceOf("internet")}
          carry={api.carryOf("internet")}
          columns={2}
        />

        <ChipGroup
          label="6.11 การใช้เครื่องมือสื่อสารอิเล็กทรอนิกส์"
          options={DEVICE_OPTIONS}
          selected={f.devices}
          onToggle={(id) => api.toggleIn("devices", id)}
          onClear={() => api.setForm("devices", [])}
          noneLabel="ไม่พบพฤติกรรมข้างต้น"
          columns={2}
        />
      </div>
    </SectionCard>
  );
}
