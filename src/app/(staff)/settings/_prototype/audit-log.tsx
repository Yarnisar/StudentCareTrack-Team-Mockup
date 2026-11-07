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

/**
 * ประวัติที่แอดมินเห็นบอกแค่ว่ามีการทำอะไร โดยใคร เมื่อไร ไม่ระบุชื่อนักเรียนหรือรายละเอียดเหตุการณ์ (3.4.1)
 */
export function useAuditEntries(): AuditEntry[] {
  const store = useStore();
  return [
    ...store.behaviorRecords.slice(0, 4).map((b) => ({
      at: b.occurredAt,
      action: "CREATE_BEHAVIOR",
      detail: "บันทึกความประพฤติ 1 รายการ",
      by: b.recordedByName,
    })),
    ...store.screenings.slice(0, 3).map((s) => ({
      at: s.screenedAt,
      action: "CREATE_SCREENING",
      detail: "บันทึกผลคัดกรอง 1 คน",
      by: s.screenedBy,
    })),
    // บันทึกการส่งแจ้งเตือน (อีเมลและผู้รับตามระดับที่แอดมินกำหนด) ไม่ระบุชื่อนักเรียน
    ...store.notificationLog.map((l) => ({
      at: l.at,
      action: "SEND_NOTIFICATION",
      detail: `${l.channel} → ${l.to}: ${l.text}`,
      by: "ระบบ",
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
          <span className="min-w-0 flex-1 text-[13px]">{entry.detail}</span>
          <span className="w-40 shrink-0 text-right text-[12px] text-muted-foreground">
            {entry.by}
          </span>
        </div>
      ))}
    </div>
  );
}
