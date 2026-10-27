"use client";

/**
 * PROTOTYPE — แบบ B "การ์ดรายบันทึก"
 * แนวคิด: เก็บแถบฟอร์มด้านขวาไว้ (ครูใช้บ่อย ไม่ต้องกดเปิด) แล้วเลิกใช้คอลัมน์ตายตัว
 * เปลี่ยนแต่ละบันทึกเป็นการ์ดสองบรรทัด ข้อความยาวก็ตัดบรรทัดลงมา ไม่มีอะไรถูกตัดหาย
 * แลกด้วยความสูงที่มากขึ้น เห็นได้น้อยรายการต่อหนึ่งหน้าจอ
 */

import { Card, CardContent } from "@/components/ui/card";
import { formatThaiDate, formatThaiTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { BehaviorRecord } from "@/lib/types";
import {
  NewRecordFields,
  SEVERITY_LABEL,
  ScoreChip,
  SourceBadge,
  Stat,
  ruleOf,
  type BehaviorForm,
} from "./shared";

export const VARIANT_B_NAME = "การ์ดรายบันทึก";

export function VariantB({ records, form }: { records: BehaviorRecord[]; form: BehaviorForm }) {
  const store = useStore();
  const qrCount = records.filter((r) => r.source === "card_scan").length;
  const studentsTouched = new Set(records.map((r) => r.studentId)).size;

  return (
    <div className="flex-1 overflow-y-auto p-8 pb-24">
      <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="บันทึกทั้งหมด" value={`${records.length} รายการ`} />
        <Stat label="นักเรียนที่ถูกบันทึก" value={`${studentsTouched} คน`} />
        <Stat label="บันทึกจากการสแกนบัตร" value={`${qrCount} รายการ`} accent />
        <Stat
          label="คะแนนบวกที่บันทึก"
          value={`${records.filter((r) => (ruleOf(r.ruleId)?.scoreDelta ?? 0) > 0).length} รายการ`}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.8fr_1fr]">
        <div>
          <h2 className="text-[15.5px] font-bold">ประวัติการบันทึกความประพฤติ</h2>
          <p className="mt-1 mb-3 text-xs text-muted-foreground">
            ครูทั่วไปบันทึกได้ทุกห้องที่สอน · ครูประจำชั้นดูแลนักเรียนในห้องตนเอง
          </p>

          <div className="space-y-2.5">
            {records.map((rec) => {
              const rule = ruleOf(rec.ruleId);
              const student = store.getStudent(rec.studentId);
              return (
                <div
                  key={rec.recordId}
                  className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-bold">{student?.fullName}</span>
                    <span className="text-[12px] text-muted-foreground">
                      {student?.roomName} เลขที่ {student?.classNo}
                    </span>
                    <span className="flex-1" />
                    <SourceBadge source={rec.source} evidence={rec.evidence} />
                    <ScoreChip delta={rule?.scoreDelta ?? 0} size="lg" />
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-[13.5px] font-semibold text-foreground">
                      {rule?.name}
                    </span>
                    {rule && (
                      <span className="rounded bg-surface px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {SEVERITY_LABEL[rule.severity]}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {rec.description}
                  </p>

                  <div className="mt-2.5 flex flex-wrap gap-x-3 border-t border-border pt-2 text-[11.5px] text-muted-foreground">
                    <span>
                      {formatThaiDate(rec.occurredAt)} · {formatThaiTime(rec.occurredAt)}
                    </span>
                    <span>บันทึกโดย {rec.recordedByName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-[15.5px] font-bold">บันทึกพฤติกรรมใหม่</h2>
              <NewRecordFields form={form} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
