"use client";

import { Camera, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { formatBaht, formatThaiDateTime } from "@/lib/format";
import {
  DISABILITY_OPTIONS,
  DISADVANTAGE_OPTIONS,
  DISASTER_OPTIONS,
  memberTotal,
  riskFindingLabels,
} from "@/lib/home-visit-form";
import type { CheckboxOption } from "@/lib/home-visit-form";
import { PHOTO_TYPE_LABEL, type HomeVisitRecord } from "@/lib/types";

/** สรุปผลการเยี่ยมบ้าน (อ่านอย่างเดียว) สำหรับหน้ารายการนัดหมาย */
export function VisitRecordSummary({ record }: { record: HomeVisitRecord }) {
  const store = useStore();
  const risks = riskFindingLabels(record.form);
  const labelsOf = (ids: string[], options: CheckboxOption[]) =>
    ids.map((id) => options.find((o) => o.id === id)?.label ?? id);
  const disadvantages = labelsOf(record.form.disadvantages, DISADVANTAGE_OPTIONS);
  const disabilities = labelsOf(record.form.disabilities, DISABILITY_OPTIONS);
  const disasters = labelsOf(record.form.disasterRisks, DISASTER_OPTIONS);

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="flex-1 text-[15.5px] font-bold">สมาชิกครัวเรือนและรายได้</h3>
            {record.signedAt ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-risk-green-bg px-2.5 py-1 text-[11.5px] font-semibold text-risk-green">
                <Lock className="size-3" /> รับรองแล้ว
              </span>
            ) : (
              <span className="rounded-full bg-risk-amber-bg px-2.5 py-1 text-[11.5px] font-semibold text-risk-amber">
                ร่าง — ยังไม่รับรอง
              </span>
            )}
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="flex bg-surface px-4 py-2.5 text-[12.5px] font-semibold text-muted-foreground">
              <span className="w-36">ความสัมพันธ์</span>
              <span className="w-20">อายุ</span>
              <span className="flex-1">พิการ</span>
              <span className="w-32 text-right">รายได้ (บาท/เดือน)</span>
            </div>
            {record.form.members.map((m) => (
              <div key={m.id} className="flex border-t border-border px-4 py-2.5 text-[13.5px]">
                <span className="w-36">{m.relation || "-"}</span>
                <span className="w-20">{m.age === "" ? "-" : m.age}</span>
                <span className="flex-1">{m.disability ? "มี" : "-"}</span>
                <span className="w-32 text-right">{formatBaht(memberTotal(m))}</span>
              </div>
            ))}
            <div className="flex border-t border-border bg-risk-amber-bg px-4 py-2.5 text-[13.5px] font-bold text-risk-amber">
              <span className="flex-1">รายได้เฉลี่ยต่อคนต่อเดือน</span>
              <span className="w-32 text-right">{formatBaht(record.householdIncomeAvg)} บาท</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[12.5px]">
            <StatusChip label="ความด้อยโอกาส" labels={disadvantages} none="ไม่ด้อยโอกาส" />
            <StatusChip label="ความพิการ" labels={disabilities} none="ไม่พิการ" />
            <StatusChip label="ภัยพิบัติในพื้นที่" labels={disasters} none="ไม่มีความเสี่ยง" />
          </div>
          {record.livesWith && (
            <p className="mt-3 text-[13px] text-muted-foreground">
              นักเรียนอาศัยอยู่กับ: <span className="text-foreground">{record.livesWith}</span>{" "}
              (ข้อมูลประกอบ ไม่เปลี่ยนสิทธิ์ของผู้ปกครองในระบบ)
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-3 text-[15.5px] font-bold">ความเสี่ยงที่พบ</h3>
            {risks.length > 0 ? (
              <ul className="space-y-2">
                {risks.map((f) => (
                  <li key={f} className="flex gap-2.5 text-[13.5px]">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-risk-amber" />
                    {f}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13.5px] text-muted-foreground">ไม่พบความเสี่ยงตามแบบบันทึก</p>
            )}
            <div className="mt-4 border-t border-border pt-3 text-[13px] text-muted-foreground">
              ผู้ให้ข้อมูล: {record.informantName || "-"}
              {record.informantRelation && ` (${record.informantRelation})`}
              {record.signedAt && record.signedBy && (
                <>
                  {" "}
                  · รับรองโดย {store.nameOf(record.signedBy)} เมื่อ {formatThaiDateTime(record.signedAt)}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="mb-3 text-[15.5px] font-bold">ภาพถ่ายประกอบ</h3>
            {record.cannotAccessHome && (
              <div className="mb-3 rounded-lg bg-accent px-3.5 py-2.5 text-[13px] text-accent-foreground">
                <b>เข้าเยี่ยมที่บ้านไม่ได้</b> — {record.cannotAccessReason || "-"}
              </div>
            )}
            {record.photos.length > 0 ? (
              <div className="flex gap-3">
                {record.photos.map((p) => (
                  <div
                    key={p.photoId}
                    className="flex h-32 flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface px-3 text-center"
                  >
                    <Camera className="size-6 text-muted-foreground" />
                    <span className="text-[12px] text-muted-foreground">{PHOTO_TYPE_LABEL[p.photoType]}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13.5px] text-muted-foreground">ยังไม่ได้แนบภาพ</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

/** สรุปสั้น ๆ ของกลุ่มสถานะ (ไม่มีรายการ = ข้อความ "ไม่มี" ของกลุ่มนั้น) */
function StatusChip({ label, labels, none }: { label: string; labels: string[]; none: string }) {
  const has = labels.length > 0;
  return (
    <span
      className={
        has
          ? "rounded-md bg-risk-amber-bg px-2.5 py-1 font-semibold text-risk-amber"
          : "rounded-md bg-surface px-2.5 py-1 text-muted-foreground"
      }
    >
      {label}: {has ? labels.join(", ") : none}
    </span>
  );
}
