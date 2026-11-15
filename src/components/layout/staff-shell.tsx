"use client";

/**
 * โครงหน้าฝั่งครูและผู้ดูแลระบบ
 * - จอใหญ่ (lg ขึ้นไป): เมนูค้างไว้ด้านซ้ายเหมือนเดิม
 * - จอแคบ: แถบบนมีปุ่มเปิดเมนู เมนูเปิดเป็นลิ้นชักทับหน้า กดเมนู กดพื้นที่ด้านนอก หรือกด Esc แล้วปิด
 * ครูใช้มือถือหน้างาน เช่น เยี่ยมบ้านและบันทึกพฤติกรรม (NFR ข้อ 1 Responsive) ส่วนงานผู้ดูแลระบบออกแบบให้คอมพิวเตอร์เป็นหลัก
 */

import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./sidebar";

export function StaffShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar className="hidden lg:flex" />

      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-label="เมนู">
          <div aria-hidden className="absolute inset-0 bg-foreground/20" onClick={() => setOpen(false)} />
          <Sidebar className="relative h-full max-w-[85vw] shadow-lg" onNavigate={() => setOpen(false)} />
          <button
            type="button"
            aria-label="ปิดเมนู"
            onClick={() => setOpen(false)}
            className="relative m-2 flex size-10 items-center justify-center rounded-lg bg-card text-muted-foreground shadow"
          >
            <X className="size-5" />
          </button>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-card px-2 py-2 lg:hidden">
          <button
            type="button"
            aria-label="เปิดเมนู"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="flex size-10 items-center justify-center rounded-lg hover:bg-muted"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-[11px] font-bold text-primary-foreground">
            SC
          </div>
          <span className="text-[14px] font-bold">Student Care Track</span>
        </div>
        {children}
      </div>
    </div>
  );
}
