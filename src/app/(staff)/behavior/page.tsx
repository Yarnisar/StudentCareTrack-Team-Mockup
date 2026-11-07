"use client";

/**
 * หน้าการจัดการความประพฤติ
 *
 * PROTOTYPE: หน้านี้กำลังโฮสต์แบบร่าง 3 แบบของการจัดวางรายการบันทึก
 * เพื่อตอบคำถามว่า "จัดวางอย่างไรให้ชื่อพฤติกรรมและรายละเอียดเหตุการณ์ไม่ถูกตัด"
 * สลับด้วย ?variant=A|B|C จากแถบลอยด้านล่าง (แสดงเฉพาะตอน dev)
 * เมื่อเลือกแบบได้แล้ว ให้ยุบเหลือแบบเดียวและลบโฟลเดอร์ _prototype/ ทิ้ง
 * ปุ่ม "บันทึกพฤติกรรม" เปิดตัวบันทึกตัวเดียว ใช้ได้ทั้งที่โต๊ะและครูเวรหน้าประตู (behavior-recorder.tsx)
 */

import { Suspense, useMemo, useState } from "react";
import { ScanLine } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { PrototypeSwitcher } from "@/components/prototype/prototype-switcher";
import { Button } from "@/components/ui/button";
import { CURRENT_TERM } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { BehaviorRecorder } from "./behavior-recorder";
import { VariantA, VARIANT_A_NAME } from "./_prototype/variant-a";
import { VariantB, VARIANT_B_NAME } from "./_prototype/variant-b";
import { VariantC, VARIANT_C_NAME } from "./_prototype/variant-c";

const VARIANTS = [
  { key: "A", name: VARIANT_A_NAME },
  { key: "B", name: VARIANT_B_NAME },
  { key: "C", name: VARIANT_C_NAME },
];

export default function BehaviorPage() {
  return (
    <Suspense fallback={null}>
      <BehaviorContent />
    </Suspense>
  );
}

function BehaviorContent() {
  const params = useSearchParams();
  const variant = params.get("variant") ?? "A";

  const store = useStore();
  const [recording, setRecording] = useState(false);

  const records = useMemo(
    // ครูประจำชั้นเห็นทุกรายการของห้องตน ห้องที่สอนเห็นเฉพาะรายการที่ตนบันทึก (ตารางขอบเขตสิทธิ์)
    () => store.behaviorRecords.filter(store.behaviorVisible).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
    [store.behaviorRecords, store.behaviorVisible]
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

      {variant === "A" && <VariantA records={records} />}
      {variant === "B" && <VariantB records={records} />}
      {variant === "C" && <VariantC records={records} />}

      <PrototypeSwitcher variants={VARIANTS} />
      {recording && <BehaviorRecorder onClose={() => setRecording(false)} />}
    </>
  );
}
