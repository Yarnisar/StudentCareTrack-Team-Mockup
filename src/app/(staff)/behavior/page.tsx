"use client";

/**
 * หน้าการจัดการความประพฤติ: รายการบันทึกตามขอบเขตสิทธิ์
 * (ครูประจำชั้นเห็นทุกรายการของห้องตน ห้องที่สอนเห็นเฉพาะรายการที่ตนบันทึก)
 * ปุ่ม "บันทึกพฤติกรรม" เปิดตัวบันทึกตัวเดียว ใช้ได้ทั้งที่โต๊ะและครูเวรหน้าประตู (behavior-recorder.tsx)
 */

import { Suspense, useMemo, useState } from "react";
import { ScanLine } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { CURRENT_TERM } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { termOfDate } from "@/lib/terms";
import { BehaviorRecorder } from "./behavior-recorder";
import { RecordsTable } from "./records-table";

export default function BehaviorPage() {
  return (
    <Suspense fallback={null}>
      <BehaviorKeyed />
    </Suspense>
  );
}

/** ค้นหาจากหน้าเดิมแล้ว ?record= เปลี่ยน: สร้างหน้าใหม่เพื่อเปิดตัวบันทึกของนักเรียนคนใหม่ */
function BehaviorKeyed() {
  const params = useSearchParams();
  return <BehaviorContent key={params.get("record") ?? ""} />;
}

function BehaviorContent() {
  const params = useSearchParams();
  const store = useStore();
  // มาจากช่องค้นหา (?record=รหัส): เปิดตัวบันทึกพร้อมเลือกนักเรียนไว้แล้ว
  const [recording, setRecording] = useState<string | true | null>(() => params.get("record"));

  const { behaviorRecords, behaviorVisible } = store;
  const records = useMemo(
    // ครูประจำชั้นเห็นทุกรายการของห้องตน ห้องที่สอนเห็นเฉพาะรายการที่ตนบันทึก (ตารางขอบเขตสิทธิ์)
    // หน้านี้แสดงภาคเรียนปัจจุบัน ประวัติภาคก่อนดูในหน้าข้อมูลนักเรียน
    () =>
      behaviorRecords
        .filter((r) => behaviorVisible(r) && termOfDate(r.occurredAt).termId === CURRENT_TERM.termId)
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
    [behaviorRecords, behaviorVisible]
  );

  return (
    <>
      <PageHeader
        title="การจัดการความประพฤติ"
        subtitle={`บันทึกและติดตามพฤติกรรมนักเรียน · ${CURRENT_TERM.label}`}
        action={
          <Button onClick={() => setRecording(true)}>
            <ScanLine className="size-4" /> บันทึกพฤติกรรม
          </Button>
        }
      />

      <RecordsTable records={records} />
      {recording && (
        <BehaviorRecorder
          key={String(recording)}
          studentId={typeof recording === "string" ? recording : undefined}
          onClose={() => setRecording(null)}
        />
      )}
    </>
  );
}
