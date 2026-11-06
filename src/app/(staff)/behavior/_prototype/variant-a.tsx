"use client";

/**
 * PROTOTYPE — แบบ A "ตารางเต็มความกว้าง"
 * แนวคิด: ต้นเหตุที่ข้อความถูกตัดคือแถบฟอร์มด้านขวากินพื้นที่ไปหนึ่งในสาม
 * แบบนี้จึงยกฟอร์มออกไปเป็นแผงที่กดเปิด แล้วคืนความกว้างทั้งหน้าให้ตาราง
 * คอลัมน์รายละเอียดกว้างที่สุดและตัดบรรทัดได้เอง ไม่มีการ truncate เลย
 */

import { Card, CardContent } from "@/components/ui/card";
import { formatThaiDate, formatThaiTime } from "@/lib/format";
import { DEMO_TODAY } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import type { BehaviorRecord } from "@/lib/types";
import {
  ScoreChip,
  SourceBadge,
  Stat,
  useRuleOf,
} from "./shared";

export const VARIANT_A_NAME = "ตารางเต็มความกว้าง";

export function VariantA({ records }: { records: BehaviorRecord[] }) {
  const store = useStore();
  const ruleOf = useRuleOf();

  const studentsTouched = new Set(records.map((r) => r.studentId)).size;

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-24 sm:p-8 sm:pb-24">
      <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="บันทึกทั้งหมด" value={`${records.length} รายการ`} />
        <Stat label="นักเรียนที่ถูกบันทึก" value={`${studentsTouched} คน`} />
        <Stat label="บันทึกวันนี้" value={`${records.filter((r) => r.occurredAt.startsWith(DEMO_TODAY)).length} รายการ`} accent />
        <Stat
          label="คะแนนบวกที่บันทึก"
          value={`${records.filter((r) => (ruleOf(r.ruleId)?.scoreDelta ?? 0) > 0).length} รายการ`}
        />
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-3 flex items-center gap-3">
            <div>
              <h2 className="text-[15.5px] font-bold">ประวัติการบันทึกความประพฤติ</h2>
              <p className="text-xs text-muted-foreground">
                ครูทั่วไปบันทึกได้ทุกห้องที่สอน · ครูประจำชั้นดูแลนักเรียนในห้องตนเอง
              </p>
            </div>
            <span className="flex-1" />
          </div>

          {/* จอแคบ: การ์ดรายการ ใครทำอะไร เมื่อไร อยู่บรรทัดบน รายละเอียดอยู่ล่าง */}
          <div className="divide-y divide-border md:hidden">
            {records.map((rec) => {
              const rule = ruleOf(rec.ruleId);
              const student = store.getStudent(rec.studentId);
              return (
                <div key={rec.recordId} className="flex gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-[14px] font-semibold">{student?.fullName}</span>
                      <span className="text-[12px] text-muted-foreground">
                        {student?.roomName} เลขที่ {student?.classNo}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[13.5px]">{rule?.name}{rule?.cancelled && <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground">กฎถูกยกเลิก</span>}</div>
                    {rec.description !== "-" && (
                      <div className="mt-0.5 text-[12.5px] text-muted-foreground">{rec.description}</div>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted-foreground">
                      <span>
                        {formatThaiDate(rec.occurredAt)} {formatThaiTime(rec.occurredAt)}
                      </span>
                      <span>· {rec.recordedByName}</span>
                      <SourceBadge source={rec.source} evidence={rec.evidence} />
                    </div>
                  </div>
                  <div className="flex self-start">
                    <ScoreChip delta={rule?.scoreDelta ?? 0} cancelled={!!rule?.cancelled} />
                  </div>
                </div>
              );
            })}
          </div>

          <table className="hidden w-full text-[13.5px] md:table">
            <thead>
              <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
                <th className="w-32 py-2 font-medium">วันที่</th>
                <th className="w-52 py-2 font-medium">นักเรียน</th>
                <th className="w-48 py-2 font-medium">พฤติกรรม</th>
                <th className="py-2 font-medium">รายละเอียดเหตุการณ์</th>
                <th className="w-28 py-2 font-medium">ที่มา</th>
                <th className="w-40 py-2 font-medium">ผู้บันทึก</th>
                <th className="w-16 py-2 text-center font-medium">คะแนน</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => {
                const rule = ruleOf(rec.ruleId);
                const student = store.getStudent(rec.studentId);
                return (
                  <tr key={rec.recordId} className="border-b border-border align-top">
                    <td className="py-3 pr-3">
                      <div>{formatThaiDate(rec.occurredAt)}</div>
                      <div className="text-[11.5px] text-muted-foreground">
                        {formatThaiTime(rec.occurredAt)}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="font-semibold">{student?.fullName}</div>
                      <div className="text-[11.5px] text-muted-foreground">
                        {student?.roomName} เลขที่ {student?.classNo}
                      </div>
                    </td>
                    <td className="py-3 pr-3">{rule?.name}{rule?.cancelled && <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground">กฎถูกยกเลิก</span>}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{rec.description}</td>
                    <td className="py-3 pr-3">
                      <SourceBadge source={rec.source} evidence={rec.evidence} />
                    </td>
                    <td className="py-3 pr-3 text-[12.5px] text-muted-foreground">
                      {rec.recordedByName}
                    </td>
                    <td className="py-3">
                      <ScoreChip delta={rule?.scoreDelta ?? 0} cancelled={!!rule?.cancelled} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

    </div>
  );
}
