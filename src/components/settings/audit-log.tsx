"use client";

/** ประวัติการใช้งาน (audit_logs) — append-only อ่านจากสโตร์ แอดมินทุกคนอ่านได้ */

import { formatThaiDateTime } from "@/lib/format";
import { auditSummary, useStore } from "@/lib/store";

export interface AuditEntry {
  at: string;
  action: string;
  detail: string;
  by: string;
}

export function useAuditEntries(): AuditEntry[] {
  const store = useStore();
  return store.auditLogs.map((log) => ({
    at: log.createdAt,
    action: log.action,
    detail: auditSummary(log),
    by: store.nameOf(log.userId),
  }));
}

export function AuditLogList({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return <p className="py-6 text-[13px] text-muted-foreground">ยังไม่มีประวัติการใช้งาน</p>;
  }
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
