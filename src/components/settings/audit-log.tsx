"use client";

/** ประวัติการใช้งาน (audit_logs) — append-only อ่านจากสโตร์ แอดมินทุกคนอ่านได้ */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatThaiDateTime } from "@/lib/format";
import { auditSummary, useStore } from "@/lib/store";

interface AuditEntry {
  at: string;
  action: string;
  detail: string;
  by: string;
}

function useAuditEntries(): AuditEntry[] {
  const store = useStore();
  return store.auditLogs.map((log) => ({
    at: log.createdAt,
    action: log.action,
    detail: auditSummary(log),
    by: store.nameOf(log.userId),
  }));
}

const RECENT = 10;

/** ประวัติการใช้งาน — แสดง 10 รายการล่าสุด ดูทั้งหมดได้ (ไม่มีการลบ) */
export function AuditLogSection() {
  const entries = useAuditEntries();
  const [all, setAll] = useState(false);
  const shown = all ? entries : entries.slice(0, RECENT);

  return (
    <Card>
      <CardContent className="p-5 lg:p-6">
        <h2 className="text-[15px] font-bold">ประวัติการใช้งาน</h2>
        <p className="mt-0.5 mb-3 text-[12px] text-muted-foreground">
          ทุกการแก้ไขข้อมูล พร้อมผู้ทำและเวลา
        </p>
        {entries.length === 0 ? (
          <p className="py-4 text-[13px] text-muted-foreground">ยังไม่มีประวัติการใช้งาน</p>
        ) : (
          <ul className="divide-y divide-border">
            {shown.map((entry, i) => (
              <li key={i} className="py-2.5">
                <p className="text-[13px]">{entry.detail}</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {formatThaiDateTime(entry.at)} · {entry.by} · {entry.action}
                </p>
              </li>
            ))}
          </ul>
        )}
        {entries.length > RECENT && (
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setAll((v) => !v)}>
            {all ? "แสดงเฉพาะล่าสุด" : `ดูทั้งหมด (${entries.length})`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
