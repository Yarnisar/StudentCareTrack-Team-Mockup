"use client";

import { AutoBadge, Field, SectionCard } from "../field-shell";
import { ChipGroup, ChipSelect, SegmentedRows } from "../option-inputs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CARETAKER_OPTIONS,
  LIVES_WITH_OPTIONS,
  RELATIONSHIP_LEVELS,
  SUPPORT_REQUEST_OPTIONS,
  WELFARE_RECEIVED_OPTIONS,
  relationRowsOf,
} from "@/lib/home-visit-form";
import type { RecordFormApi } from "./form-state";

/** ข้อ 5 : ความสัมพันธ์ในครอบครัว (หน้า 2 ของแบบฟอร์ม) */
export function FamilySection({
  api,
  awayStayWith,
}: {
  api: RecordFormApi;
  /** สิ่งที่ผู้ปกครองแจ้งล่วงหน้าผ่านระบบ */
  awayStayWith?: string;
}) {
  const f = api.form;
  const relationRows = relationRowsOf(f.members);

  return (
    <SectionCard no="5." title="ความสัมพันธ์ในครอบครัว" description="หน้า 2 ของแบบฟอร์ม">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="5.1 สมาชิกในครอบครัวมีเวลาอยู่ร่วมกันกี่ชั่วโมงต่อวัน"
            htmlFor="hours"
            source={api.sourceOf("hoursTogether")}
            carry={api.carryOf("hoursTogether")}
          >
            <Input
              id="hours"
              value={f.hoursTogether}
              onChange={(e) => api.setForm("hoursTogether", e.target.value)}
              placeholder="ชั่วโมง/วัน"
            />
          </Field>
        </div>

        <SegmentedRows
          label="5.2 ความสัมพันธ์ระหว่างนักเรียนกับสมาชิกในครอบครัว"
          hint="แถวมาจากสมาชิกครัวเรือนที่กรอกไว้ในข้อ 3 หากไม่มีสมาชิกคนนั้นให้เลือก “ไม่มี”"
          rows={relationRows}
          choices={RELATIONSHIP_LEVELS}
          values={f.relations}
          onChange={(row, choice) => api.setForm("relations", { ...f.relations, [row]: choice })}
        />

        <ChipSelect
          label="5.3 กรณีที่ผู้ปกครองไม่อยู่บ้าน ฝากนักเรียนอยู่บ้านกับใคร"
          options={CARETAKER_OPTIONS}
          value={f.caretakerWhenAway}
          onChange={(v) => api.setForm("caretakerWhenAway", v)}
          source={api.sourceOf("caretakerWhenAway")}
          carry={api.carryOf("caretakerWhenAway")}
          columns={4}
        />

        {awayStayWith && (
          <div className="flex items-center gap-2 rounded-lg bg-risk-green-bg px-3.5 py-2.5">
            <AutoBadge source="guardian" />
            <span className="text-[12.5px] text-risk-green">
              ผู้ปกครองระบุไว้ล่วงหน้าว่า: {awayStayWith}
            </span>
          </div>
        )}

        <ChipSelect
          label="5.4 นักเรียนอาศัยอยู่กับใครจริง"
          options={LIVES_WITH_OPTIONS}
          value={api.input.livesWith}
          onChange={(v) => api.setTop("livesWith", v)}
          source={api.sourceOf("livesWith")}
          columns={3}
        />
        <p className="-mt-4 text-[12px] text-muted-foreground">
          เป็นข้อมูลประกอบเท่านั้น ไม่ทำให้ผู้ปกครองคนใดมีสิทธิ์ในระบบมากกว่าคนอื่น
        </p>

        <ChipGroup
          label="5.6 สิ่งที่ผู้ปกครองต้องการให้โรงเรียนช่วยเหลือนักเรียน"
          options={SUPPORT_REQUEST_OPTIONS}
          selected={f.supportRequests}
          onToggle={(id) => api.toggleIn("supportRequests", id)}
          onClear={() => api.setForm("supportRequests", [])}
          source={api.sourceOf("supportRequests")}
          columns={2}
        />

        <ChipGroup
          label="5.7 ความช่วยเหลือที่ครอบครัวเคยได้รับหรือต้องการได้รับ"
          options={WELFARE_RECEIVED_OPTIONS}
          selected={f.welfareReceived}
          onToggle={(id) => api.toggleIn("welfareReceived", id)}
          onClear={() => api.setForm("welfareReceived", [])}
          noneLabel="ไม่เคยได้รับ"
          columns={3}
        />

        <Field
          label="5.8 ข้อห่วงใยของผู้ปกครองที่มีต่อนักเรียน"
          htmlFor="concern"
          source={api.sourceOf("guardianConcern")}
        >
          <Textarea
            id="concern"
            value={f.guardianConcern}
            onChange={(e) => api.setForm("guardianConcern", e.target.value)}
            rows={3}
            placeholder="บันทึกสิ่งที่ผู้ปกครองห่วงใย"
          />
        </Field>
      </div>
    </SectionCard>
  );
}
