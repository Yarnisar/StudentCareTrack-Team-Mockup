"use client";

import { useState } from "react";
import { CheckCircle2, Copy } from "lucide-react";
import { useSwitchUser } from "@/components/layout/role-switcher";
import { Button } from "@/components/ui/button";
import type { ImportCommitSummary } from "@/lib/store";
import { useStore } from "@/lib/store";
import { IMPORT_KIND_LABEL, type ImportKind } from "@/lib/types";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * ผลหลังยืนยันนำเข้า — รหัสผ่านชั่วคราวของบัญชีใหม่แสดงที่นี่ครั้งเดียว (อยู่ใน state ของหน้านี้เท่านั้น
 * ไม่ถูกเก็บในสโตร์/audit) ปิดผลหรือออกจากหน้าแล้วดูอีกไม่ได้ บัญชีบังคับเปลี่ยนรหัสผ่านเมื่อเข้าครั้งแรก
 */
export function ImportResult({ kind, summary, onClose }: { kind: ImportKind; summary: ImportCommitSummary; onClose: () => void }) {
  const store = useStore();
  const switchUser = useSwitchUser();
  const [copied, setCopied] = useState<string | null>(null);
  const { job, accounts } = summary;
  const withPassword = accounts.filter((a) => a.tempPassword);

  const copy = async (key: string, text: string) => {
    if (await copyText(text)) {
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 2500);
    }
  };

  return (
    <section
      aria-label="ผลนำเข้า"
      data-testid="import-result"
      className="space-y-3 rounded-xl border border-risk-green bg-risk-green-bg p-4"
    >
      <div className="flex items-start gap-2">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-risk-green" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-bold text-risk-green">นำเข้า{IMPORT_KIND_LABEL[kind]}แล้ว</h2>
          <p className="text-[13px]">
            สร้างใหม่ {job.createdRows} · อัปเดต {job.updatedRows} · ข้าม {job.unchangedRows + job.invalidRows}
            {summary.statusChanges > 0 ? ` · เปลี่ยนสถานะ ${summary.statusChanges}` : ""}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose}>
          ปิด
        </Button>
      </div>

      {withPassword.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] font-semibold">
              รหัสผ่านชั่วคราว {withPassword.length} บัญชี — แสดงครั้งนี้ครั้งเดียว
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                copy("all", withPassword.map((a) => `${a.name}\t${a.username}\t${a.tempPassword}`).join("\n"))
              }
            >
              <Copy data-icon="inline-start" />
              {copied === "all" ? "คัดลอกแล้ว" : "คัดลอกทั้งหมด"}
            </Button>
          </div>
          <ul className="max-h-60 divide-y divide-border overflow-auto rounded-lg border border-border bg-card">
            {withPassword.map((a) => (
              <li key={a.userId} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{a.name}</span>
                  <span className="block text-[12px] text-muted-foreground">
                    {a.roleLabel} · ผู้ใช้ {a.username}
                  </span>
                </span>
                <code data-testid="temp-password" className="rounded bg-muted px-2 py-0.5 text-[13px]">
                  {a.tempPassword}
                </code>
                <Button size="sm" variant="outline" onClick={() => copy(a.userId, `${a.username}\t${a.tempPassword}`)}>
                  {copied === a.userId ? "คัดลอกแล้ว" : "คัดลอก"}
                </Button>
                {store.getUser(a.userId) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const u = store.getUser(a.userId);
                      if (u) switchUser(u, { stay: false });
                    }}
                  >
                    ใช้บัญชีนี้
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <p className="text-[12px] text-muted-foreground">ต้องเปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบครั้งแรก</p>
        </div>
      )}
    </section>
  );
}
