"use client";

import Link from "next/link";
import { formatThaiDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import {
  ANNUAL_VISIT_STATUS_LABEL,
  APPOINTMENT_STATUS_LABEL,
  VISIT_TYPE_LABEL,
  type AnnualVisitStatus,
} from "@/lib/types";
import { Chip, SectionCard } from "./section-card";

const ANNUAL_TONE: Record<AnnualVisitStatus, "green" | "blue" | "amber" | "muted" | "red"> = {
  visited: "green",
  visited_inaccessible: "blue",
  draft: "amber",
  scheduled: "muted",
  none: "red",
};

/** การเยี่ยมบ้าน: สถานะประจำปี + ประวัติทุกนัด — ข้อมูลอ่อนไหว */
export function HomeVisitCard({ studentId }: { studentId: string }) {
  const store = useStore();
  const annual = store.annualVisitStatusOf(studentId);
  const appointments = store.appointmentsOf(studentId);
  const latestSigned = store.latestSignedVisitOf(studentId);

  return (
    <SectionCard
      title="การเยี่ยมบ้าน"
      aside={
        <span className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
          ประจำปี {store.currentTerm.academicYear}
          <Chip tone={ANNUAL_TONE[annual]}>{ANNUAL_VISIT_STATUS_LABEL[annual]}</Chip>
        </span>
      }
    >
      {latestSigned?.livesWith && (
        <p className="mb-3 text-[12.5px]">
          <span className="text-muted-foreground">อาศัยอยู่กับ:</span> {latestSigned.livesWith}
          <span className="ml-1 text-[11px] text-muted-foreground">
            (ข้อมูลประกอบจากการเยี่ยมบ้าน ไม่เปลี่ยนสิทธิ์ผู้ปกครอง)
          </span>
        </p>
      )}
      <div className="divide-y divide-border">
        {appointments.map((a) => {
          const record = store.recordOfAppointment(a.appointmentId);
          return (
            <div key={a.appointmentId} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-[13px]">
              <span className="w-28 shrink-0 text-[12.5px] text-muted-foreground">{formatThaiDate(a.proposedDate)}</span>
              <span className="flex-1">
                {VISIT_TYPE_LABEL[a.visitType]} {a.academicYear}
                {a.caseId && <span className="ml-1 text-[11.5px] text-muted-foreground">· ติดตาม {a.caseId}</span>}
              </span>
              {record?.signedAt ? (
                <Chip tone={record.cannotAccessHome ? "blue" : "green"}>
                  {record.cannotAccessHome ? "รับรองแล้ว (เข้าบ้านไม่ได้)" : "รับรองแล้ว"}
                </Chip>
              ) : record ? (
                <Chip tone="amber">บันทึกร่าง</Chip>
              ) : (
                <Chip tone={a.status === "cancelled" ? "red" : "muted"}>{APPOINTMENT_STATUS_LABEL[a.status]}</Chip>
              )}
              {record && (
                <Link
                  href={`/home-visits/${a.appointmentId}/record`}
                  className="text-[12.5px] font-semibold text-primary hover:underline"
                >
                  ดูบันทึก
                </Link>
              )}
            </div>
          );
        })}
        {appointments.length === 0 && <p className="py-2 text-sm text-muted-foreground">ยังไม่มีนัดหมายเยี่ยมบ้าน</p>}
      </div>
    </SectionCard>
  );
}
