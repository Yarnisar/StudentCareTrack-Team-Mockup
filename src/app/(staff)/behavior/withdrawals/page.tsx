"use client";

/**
 * รายการนักเรียนที่รอครูที่ปรึกษายืนยันถอนสถานะเฝ้าระวัง (UC8 สถานการณ์ C ข้อ 1) แสดงเฉพาะนักเรียนที่ตนรับผิดชอบ
 * คะแนนกลับเข้าเกณฑ์แล้วแต่ระบบไม่ถอนเอง เลยระยะเวลาที่ผู้ดูแลระบบกำหนดจะเตือนซ้ำและแจ้งผู้ดูแลระบบโดยไม่ระบุชื่อ (Alt-F)
 */

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { WatchWithdrawal } from "@/components/behavior/watch-withdrawal";
import { StudentId } from "@/components/shared/student-id";
import { Card, CardContent } from "@/components/ui/card";
import { formatThaiDate } from "@/lib/format";
import { daysBetween } from "@/lib/periods";
import { DEMO_TODAY } from "@/lib/mock-data";
import { TEACHER_ASSIGNMENTS } from "@/lib/roles";
import { useStore } from "@/lib/store";

export default function WithdrawalsPage() {
  const store = useStore();
  const homeroom = TEACHER_ASSIGNMENTS[store.role]?.homeroomRoom;
  const rows = store.students
    .filter((s) => s.roomName === homeroom && store.watchWithdrawalPending(s.studentId))
    .map((student) => ({ student, wait: store.withdrawalWait(student.studentId) }));

  return (
    <>
      <PageHeader
        title="รอยืนยันถอนสถานะเฝ้าระวัง"
        subtitle={homeroom ? `${homeroom} · นักเรียนที่คะแนนกลับเข้าเกณฑ์แล้ว` : "เฉพาะครูที่ปรึกษา"}
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <Link
          href="/behavior"
          className="mb-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> กลับไปหน้าความประพฤติ
        </Link>
        <Card>
          <CardContent className="p-4 sm:p-6">
            {!homeroom ? (
              <p className="py-8 text-center text-[13px] text-muted-foreground">หน้านี้สำหรับครูที่ปรึกษา ครูผู้สอนไม่ต้องยืนยันถอนสถานะ</p>
            ) : rows.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-muted-foreground">ไม่มีนักเรียนที่รอยืนยันถอนสถานะ</p>
            ) : (
              <div className="divide-y divide-border">
                {rows.map(({ student, wait }) => (
                  <div key={student.studentId} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <StudentId id={student.studentId} className="w-14 text-sm" />
                      <span className="text-[14.5px] font-bold">{student.fullName}</span>
                      <span className="text-[12px] text-muted-foreground">เลขที่ {student.classNo}</span>
                      <span className="flex-1" />
                      {wait?.overdue && (
                        <span className="rounded-md bg-foreground px-2 py-0.5 text-[11.5px] font-semibold text-background">
                          เลยกำหนดยืนยัน {daysBetween(wait.dueOn, DEMO_TODAY)} วัน
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[12.5px] text-muted-foreground">
                      คะแนนปัจจุบัน {store.behaviorScoreOf(student.studentId)} · ระดับเฝ้าระวังที่ยังคงไว้ {store.behaviorWatchLevelOf(student.studentId)}
                      {wait && ` · กลับเข้าเกณฑ์เมื่อ ${formatThaiDate(wait.since)} · ควรยืนยันภายใน ${formatThaiDate(wait.dueOn)}`}
                    </p>
                    <WatchWithdrawal studentId={student.studentId} className="mt-2.5" />
                    <Link href={`/students/${student.studentId}`} className="mt-2 inline-block text-[12.5px] font-semibold text-primary hover:underline">
                      เปิดประวัติความประพฤติของนักเรียน
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
