"use client";

import { Plus, Trash2 } from "lucide-react";
import { AutoBadge, CarryBadge, Field, SectionCard } from "../field-shell";
import { ChipGroup, ChipSelect, YesNoRows } from "../option-inputs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  DEPENDENCY_OPTIONS,
  DISASTER_OPTIONS,
  ELECTRICITY_OPTIONS,
  FARMLAND_OPTIONS,
  HOUSE_BUILDING_OPTIONS,
  HOUSING_CONDITION_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  INCOME_COLUMNS,
  VEHICLE_OPTIONS,
  WATER_OPTIONS,
  memberTotal,
  perCapitaIncome,
} from "@/lib/home-visit-form";
import type { IncomeKey } from "@/lib/home-visit-form";
import { formatBaht } from "@/lib/format";
import { nextId } from "@/lib/store/ids";
import type { RecordFormApi } from "./form-state";

/** ข้อ 3–4 : สมาชิกครัวเรือน รายได้ และสถานะของครัวเรือน */
export function HouseholdSection({ api }: { api: RecordFormApi }) {
  const f = api.form;
  const members = f.members;
  const totalIncome = members.reduce((sum, m) => sum + memberTotal(m), 0);
  const perCapita = perCapitaIncome(members);
  const membersCarry = api.carryOf("members");

  return (
    <>
      <SectionCard
        no="3."
        title="จำนวนสมาชิกในครัวเรือนและรายได้"
        description="รวมตัวนักเรียน · รายได้เฉลี่ยต่อเดือนแยกตามประเภท (บาท/เดือน)"
      >
        {api.sourceOf("members") && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <AutoBadge source="previous" />
            {membersCarry && <CarryBadge state={membersCarry} />}
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
                        api.setMembers((prev) =>
                          prev.map((x, xi) => (xi === i ? { ...x, relation: e.target.value } : x))
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
                        api.setMembers((prev) =>
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
                      disabled={api.readOnly}
                      onCheckedChange={() =>
                        api.setMembers((prev) =>
                          prev.map((x, xi) => (xi === i ? { ...x, disability: !x.disability } : x))
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
                          api.setMembers((prev) =>
                            prev.map((x, xi) =>
                              xi === i
                                ? {
                                    ...x,
                                    income: { ...x.income, [col.key]: Number(e.target.value) || 0 },
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
                  <td className="py-1.5 pl-2 text-right font-semibold">{formatBaht(memberTotal(m))}</td>
                  <td className="text-center">
                    <button
                      onClick={() => api.setMembers((prev) => prev.filter((_, xi) => xi !== i))}
                      aria-label={`นำสมาชิกคนที่ ${i + 1} ออก`}
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
              api.setMembers((prev) => [
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
              รวมรายได้ครัวเรือน <b className="ml-1 text-foreground">{formatBaht(totalIncome)} บาท</b>
            </div>
            <div
              className={
                perCapita > 0 && perCapita < 3000
                  ? "rounded-lg bg-risk-amber-bg px-4 py-2.5 text-[13px] font-semibold text-risk-amber"
                  : "rounded-lg bg-surface px-4 py-2.5 text-[13px]"
              }
            >
              รายได้เฉลี่ยต่อคน <b className="ml-1">{formatBaht(perCapita)} บาท/เดือน</b>
              {perCapita > 0 && perCapita < 3000 && " · เข้าเกณฑ์ยากจน"}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard no="4." title="สถานะของครัวเรือน" description="กรอกเฉพาะบุคคลที่อาศัยในบ้านปัจจุบัน">
        <div className="space-y-6">
          <ChipGroup
            label="4.1 ภาระพึ่งพิงของครัวเรือน"
            options={DEPENDENCY_OPTIONS}
            selected={f.dependencies}
            onToggle={(id) => api.toggleIn("dependencies", id)}
            onClear={() => api.setForm("dependencies", [])}
            source={api.sourceOf("dependencies")}
            carry={api.carryOf("dependencies")}
            noneLabel="ไม่มีภาระพึ่งพิง"
            columns={2}
          />
          <ChipSelect
            label="4.2 ประเภทที่อยู่อาศัย"
            options={HOUSING_TYPE_OPTIONS}
            value={f.housingType}
            onChange={(v) => api.setForm("housingType", v)}
            source={api.sourceOf("housingType")}
            carry={api.carryOf("housingType")}
            columns={3}
          />
          <ChipSelect
            label="4.3 ลักษณะกายภาพของบ้าน"
            options={HOUSE_BUILDING_OPTIONS}
            value={f.houseBuilding}
            onChange={(v) => api.setForm("houseBuilding", v)}
            source={api.sourceOf("houseBuilding")}
            carry={
              api.carryOf("houseBuilding") === "changed" || api.carryOf("houseBuildingOther") === "changed"
                ? "changed"
                : api.carryOf("houseBuilding")
            }
            columns={4}
          />
          {f.houseBuilding === "other" && (
            <Field label="ระบุลักษณะบ้านอื่น ๆ" htmlFor="house-building-other" className="-mt-3 max-w-md">
              <Input
                id="house-building-other"
                value={f.houseBuildingOther}
                onChange={(e) => api.setForm("houseBuildingOther", e.target.value)}
              />
            </Field>
          )}
          <ChipGroup
            label="4.4 สภาพที่อยู่อาศัย"
            options={HOUSING_CONDITION_OPTIONS}
            selected={f.housingConditions}
            onToggle={(id) => api.toggleIn("housingConditions", id)}
            onClear={() => api.setForm("housingConditions", [])}
            source={api.sourceOf("housingConditions")}
            carry={api.carryOf("housingConditions")}
            noneLabel="สภาพบ้านปกติ"
            columns={1}
          />
          <YesNoRows
            label="4.5 ยานพาหนะของครอบครัว"
            rows={VEHICLE_OPTIONS}
            values={f.vehicles}
            onChange={(id, value) => api.setForm("vehicles", { ...f.vehicles, [id]: value })}
            source={api.sourceOf("vehicles")}
            carry={api.carryOf("vehicles")}
          />
          <ChipSelect
            label="4.6 ที่ดินทำกิน"
            options={FARMLAND_OPTIONS}
            value={f.farmland}
            onChange={(v) => api.setForm("farmland", v)}
            source={api.sourceOf("farmland")}
            carry={api.carryOf("farmland")}
            columns={2}
          />
          <ChipSelect
            label="4.7 แหล่งไฟฟ้าหลักของที่พักอาศัย"
            options={ELECTRICITY_OPTIONS}
            value={f.electricity}
            onChange={(v) => api.setForm("electricity", v)}
            carry={api.carryOf("electricity")}
            columns={2}
          />
          <ChipGroup
            label="4.8 แหล่งน้ำดื่มของครัวเรือน"
            options={WATER_OPTIONS}
            selected={f.waterSources}
            onToggle={(id) => api.toggleIn("waterSources", id)}
            onClear={() => api.setForm("waterSources", [])}
            carry={api.carryOf("waterSources")}
            columns={2}
          />
          <ChipGroup
            label="4.9 ความปลอดภัยของที่พักอาศัยด้านภัยพิบัติ"
            options={DISASTER_OPTIONS}
            selected={f.disasterRisks}
            onToggle={(id) => api.toggleIn("disasterRisks", id)}
            onClear={() => api.setForm("disasterRisks", [])}
            carry={api.carryOf("disasterRisks")}
            noneLabel="ไม่มีความเสี่ยง"
            columns={2}
          />
        </div>
      </SectionCard>
    </>
  );
}
