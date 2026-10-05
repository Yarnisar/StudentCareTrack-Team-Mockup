"use client";

/** PROTOTYPE ONLY — เนื้อหา Audit Log เดิมของหน้าตั้งค่า ใช้ร่วมกันทุก variant */

import { formatThaiDateTime } from "@/lib/format";
import { useStore } from "@/lib/store";

export interface AuditEntry {
  at: string;
  action: string;
  detail: string;
  by: string;
}

export function useAuditEntries(): AuditEntry[] {
  const store = useStore();
  return [
    ...store.checkins.slice(0, 4).map((c) => ({
      at: c.scannedAt,
      action: "CHECKIN",
      detail: `สแกน QR เช็คอินนักเรียน ${store.getStudent(c.studentId)?.fullName ?? c.studentId}`,
      by: store.nameOf(c.scannedBy),
    })),
    ...store.behaviorRecords.slice(0, 4).map((b) => ({
      at: b.occurredAt,
      action: "CREATE_BEHAVIOR",
      detail: `บันทึกความประพฤติ: ${b.description}`,
      by: store.nameOf(b.recordedBy),
    })),
    ...store.screenings.slice(0, 3).map((s) => ({
      at: s.screenedAt,
      action: "CREATE_SCREENING",
      detail: `คัดกรองนักเรียน ${store.getStudent(s.studentId)?.fullName ?? s.studentId}`,
      by: store.nameOf(s.screenedBy),
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));
}

export function AuditLogList({ entries }: { entries: AuditEntry[] }) {
  return (
    <div className="divide-y divide-border">
      {entries.map((entry, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5">
          <span className="w-36 shrink-0 text-[12px] text-muted-foreground">
            {formatThaiDateTime(entry.at)}
          </span>
          <span className="w-36 shrink-0 rounded-md bg-surface px-2 py-1 text-[11.5px] font-semibold text-muted-foreground">
            {entry.action}
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px]">{entry.detail}</span>
          <span className="w-40 shrink-0 text-right text-[12px] text-muted-foreground">
            {entry.by}
          </span>
        </div>
      ))}
    </div>
  );
}
