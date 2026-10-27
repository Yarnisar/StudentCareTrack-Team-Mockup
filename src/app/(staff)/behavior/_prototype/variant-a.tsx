"use client";

/**
 * PROTOTYPE — แบบ A "ตารางเต็มความกว้าง"
 * แนวคิด: ต้นเหตุที่ข้อความถูกตัดคือแถบฟอร์มด้านขวากินพื้นที่ไปหนึ่งในสาม
 * แบบนี้จึงยกฟอร์มออกไปเป็นแผงที่กดเปิด แล้วคืนความกว้างทั้งหน้าให้ตาราง
 * คอลัมน์รายละเอียดกว้างที่สุดและตัดบรรทัดได้เอง ไม่มีการ truncate เลย
 */

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatThaiDate, formatThaiTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { BehaviorRecord } from "@/lib/types";
import {
  NewRecordFields,
  ScoreChip,
  SourceBadge,
  Stat,
  ruleOf,
  type BehaviorForm,
} from "./shared";

export const VARIANT_A_NAME = "ตารางเต็มความกว้าง";

export function VariantA({ records, form }: { records: BehaviorRecord[]; form: BehaviorForm }) {
  const store = useStore();
  const [showForm, setShowForm] = useState(false);

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

      {showForm && (
        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center">
              <h2 className="flex-1 text-[15.5px] font-bold">บันทึกพฤติกรรมใหม่</h2>
              <button
                type="button"
                aria-label="ปิดฟอร์ม"
                onClick={() => setShowForm(false)}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="max-w-xl">
              <NewRecordFields form={form} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="mb-3 flex items-center gap-3">
            <div>
              <h2 className="text-[15.5px] font-bold">ประวัติการบันทึกความประพฤติ</h2>
              <p className="text-xs text-muted-foreground">
                ครูทั่วไปบันทึกได้ทุกห้องที่สอน · ครูประจำชั้นดูแลนักเรียนในห้องตนเอง
              </p>
            </div>
            <span className="flex-1" />
            {!showForm && (
              <Button size="lg" onClick={() => setShowForm(true)}>
                <Plus className="size-4" /> บันทึกพฤติกรรมใหม่
              </Button>
            )}
          </div>

          <table className="w-full text-[13.5px]">
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
                    <td className="py-3 pr-3">{rule?.name}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{rec.description}</td>
                    <td className="py-3 pr-3">
                      <SourceBadge source={rec.source} evidence={rec.evidence} />
                    </td>
                    <td className="py-3 pr-3 text-[12.5px] text-muted-foreground">
                      {rec.recordedByName}
                    </td>
                    <td className="py-3">
                      <ScoreChip delta={rule?.scoreDelta ?? 0} />
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
