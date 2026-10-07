"use client";

/**
 * หน้าการจัดการความประพฤติ
 *
 * จัดวางแบบ "ฟีดการ์ด" จัดกลุ่มตามวันที่ — ชื่อความประพฤติและรายละเอียดเหตุการณ์แสดงครบ ไม่ถูกตัด
 * แถบด้านขวาเก็บฟอร์มบันทึกใหม่และกฎความประพฤติไว้ให้ครูใช้ได้ทันที
 *
 * ส่วนบนเป็นงานที่ต้องตัดสินใจก่อน:
 * - BehaviorPendingQueue: บันทึกมาสายรอยืนยัน (ยืนยัน / ยกเว้นพร้อมเหตุผล)
 * - BehaviorRecordManager: แก้ไขภายใน 24 ชม. / ยกเลิกพร้อมเหตุผล (ไม่มีการลบ)
 * ฟีดด้านล่างแสดงเฉพาะบันทึกที่มีผล (confirmed)
 */

import { useMemo, useState } from "react";
import { BehaviorPendingQueue } from "@/components/behavior/pending-queue";
import { NewRecordFields, RulesList, useBehaviorForm } from "@/components/behavior/record-form";
import { BehaviorRecordFeed, BehaviorStats } from "@/components/behavior/record-feed";
import { BehaviorRecordManager } from "@/components/behavior/record-manager";
import { PageHeader } from "@/components/layout/page-header";
import { PagerNumbered, usePagination } from "@/components/shared/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { CURRENT_TERM } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

export default function BehaviorPage() {
  const store = useStore();
  const form = useBehaviorForm();

  // ฟีดแสดงเฉพาะบันทึกที่มีผลกับคะแนน — รอยืนยัน/ยกเว้น/ยกเลิก อยู่ในส่วนด้านบน
  const records = useMemo(
    () => store.behaviorRecords.filter((r) => r.status === "confirmed"),
    [store.behaviorRecords]
  );

  // แบ่งหน้าก่อนจัดกลุ่มตามวันที่ ฟีดจึงแสดงเฉพาะบันทึกของหน้าปัจจุบัน
  const [pageSize, setPageSize] = useState(10);
  const pager = usePagination(records, pageSize);

  return (
    <>
      <PageHeader
        title="การจัดการความประพฤติ"
        subtitle={`${CURRENT_TERM.label}`}
      />

      <div className="flex-1 overflow-y-auto p-8 pb-24">
        <div className="space-y-5">
          <BehaviorPendingQueue />
          <BehaviorRecordManager />
          <BehaviorStats records={records} />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.8fr_1fr]">
          <div>
            <h2 className="text-[15px] font-bold">ประวัติการบันทึกความประพฤติ</h2>
            <div className="mb-3" />
            <BehaviorRecordFeed records={pager.slice} />
            <PagerNumbered
              page={pager.page}
              totalPages={pager.totalPages}
              setPage={pager.setPage}
              from={pager.from}
              to={pager.to}
              total={pager.total}
              pageSize={pageSize}
              onPageSize={(n) => {
                setPageSize(n);
                pager.reset();
              }}
            />
          </div>

          <div className="space-y-5">
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 text-[15px] font-bold">บันทึกความประพฤติใหม่</h2>
                <NewRecordFields form={form} />
                <p className="mt-3 text-[12px] text-muted-foreground">
                  กฎที่ตั้งให้แจ้งผู้ปกครอง จะแจ้งทันทีเมื่อบันทึกมีผล
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-[15px] font-bold">กฎความประพฤติ</h2>
                  <span className="text-[12px] text-muted-foreground">จัดการโดยแอดมิน</span>
                </div>
                <RulesList />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
