"use client";

import { Camera, Check } from "lucide-react";
import { CopyButton, Field, ReadOnly, SectionCard } from "../field-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  INFORMANT_OPTIONS,
  PHOTO_SLOTS_HOME,
  PHOTO_SLOTS_INACCESSIBLE,
} from "@/lib/home-visit-form";
import { PHOTO_TYPE_LABEL } from "@/lib/types";
import type { RecordFormApi } from "./form-state";

/** ข้อ 8 : ผู้ให้ข้อมูล ภาพประกอบ และการรับรองข้อมูล (หน้า 3–4 ของแบบฟอร์ม) */
export function CertifySection({
  api,
  parent,
  certifierName,
}: {
  api: RecordFormApi;
  /** บิดา/มารดาที่ลงทะเบียนไว้ ใช้ปุ่มคัดลอกเป็นผู้ให้ข้อมูล */
  parent?: { name: string; relation: string };
  certifierName: string;
}) {
  const input = api.input;
  const photoSlots = input.cannotAccessHome ? PHOTO_SLOTS_INACCESSIBLE : PHOTO_SLOTS_HOME;

  return (
    <SectionCard no="8." title="ผู้ให้ข้อมูลและการรับรองข้อมูล" description="หน้า 3–4 ของแบบฟอร์ม">
      <div className="space-y-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-[13px] font-semibold">ผู้ให้ข้อมูลนักเรียน</Label>
            <span className="flex-1" />
            <CopyButton
              label="คัดลอกจากข้อมูลบิดา/มารดา"
              disabled={api.readOnly || !parent}
              onClick={() => {
                if (!parent) return;
                api.setTop("informantName", parent.name);
                api.setTop("informantRelation", parent.relation);
              }}
            />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {INFORMANT_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                aria-pressed={input.informantRelation === opt}
                onClick={() =>
                  api.setTop("informantRelation", input.informantRelation === opt ? "" : opt)
                }
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
                onChange={(e) => api.setTop("informantName", e.target.value)}
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
              { v: false, label: "เข้าเยี่ยมในบ้านได้", sub: "แนบภาพภายนอกและภายในที่พักอาศัย (2 ภาพ)" },
              { v: true, label: "เข้าเยี่ยมที่บ้านไม่ได้", sub: "ใช้ภาพนักเรียนคู่ป้ายโรงเรียน พร้อมเหตุผล" },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                aria-pressed={input.cannotAccessHome === o.v}
                onClick={() => api.setTop("cannotAccessHome", o.v)}
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
                  onChange={(e) => api.setTop("cannotAccessReason", e.target.value)}
                  placeholder="เช่น ที่พักอาศัยอยู่ต่างจังหวัด หรือไม่ได้รับอนุญาตให้ถ่ายภาพที่พักอาศัย"
                />
              </Field>
              <p className="mt-1.5 text-[12px] text-muted-foreground">
                นับว่าเยี่ยมแล้ว แต่รายงานแยกนับเป็นกลุ่มเข้าบ้านไม่ได้
              </p>
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-[12.5px] text-muted-foreground">
            {input.cannotAccessHome
              ? "กรณีที่พักอาศัยอยู่ต่างจังหวัด/ต่างประเทศ หรือไม่ได้รับอนุญาตให้ถ่ายภาพ ใช้ภาพนักเรียนคู่ป้ายสถานศึกษาแทน"
              : "แบบฟอร์มบังคับ 2 ภาพ: ภายนอกที่พักอาศัย และภายในที่พักอาศัย"}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {photoSlots.map((t, i) => {
              const attached = api.hasPhoto(t);
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={attached}
                  onClick={() => api.togglePhoto(t)}
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
                  <span className="text-[11.5px]">
                    {attached ? "แนบแล้ว · แตะเพื่อนำออก" : "แตะเพื่อถ่าย / แนบภาพ"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="ครูผู้ไปเยี่ยมและรับรองข้อมูล (1 คน)" source="registry">
            <ReadOnly value={certifierName} />
          </Field>
          <Field label="ตำแหน่ง" source="registry">
            <ReadOnly value="ครูประจำชั้น" />
          </Field>
        </div>
      </div>
    </SectionCard>
  );
}
