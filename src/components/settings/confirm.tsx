"use client";

/**
 * การยืนยันของหน้าตั้งค่า — สองแบบตามผลกระทบของการกระทำ
 * - InlineConfirm: ยืนยันในที่ (แก้ช่วงดำเนินงาน / ตั้งค่าโรงเรียน) ยังเห็นค่าที่กำลังแก้อยู่รอบ ๆ
 * - ConfirmModal: กล่องกลางจอ (ปิดใช้งานกฎความประพฤติ) เพราะกระทบบันทึกเดิมและตัวเลือกของครูทุกคน
 *
 * ข้อความบอก "ผลที่จะเกิดขึ้นจริง" พร้อมตัวเลขจากข้อมูลจริง ไม่ใช่ "แน่ใจหรือไม่" ลอย ๆ
 */

import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ConfirmContent {
  title: string;
  description: string;
  confirmLabel: string;
  danger: boolean;
}

export function InlineConfirm({
  content,
  onConfirm,
  onCancel,
}: {
  content: ConfirmContent;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      role="group"
      aria-label={content.title}
      className="rounded-xl border border-risk-amber bg-risk-amber-bg p-3"
    >
      <div className="flex gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-risk-amber" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-risk-amber">{content.title}</p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-risk-amber">
            {content.description}
          </p>
          <div className="mt-2.5 flex gap-2">
            <Button size="sm" variant={content.danger ? "destructive" : "default"} onClick={onConfirm}>
              {content.confirmLabel}
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel}>
              ยกเลิก
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConfirmModal({
  content,
  onConfirm,
  onCancel,
}: {
  content: ConfirmContent;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={content.title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
              content.danger ? "bg-risk-red-bg text-risk-red" : "bg-accent text-primary"
            }`}
          >
            <AlertTriangle className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15.5px] font-bold">{content.title}</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              {content.description}
            </p>
          </div>
          <button
            type="button"
            aria-label="ปิด"
            onClick={onCancel}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button size="lg" variant="ghost" onClick={onCancel}>
            ยกเลิก
          </Button>
          <Button
            size="lg"
            variant={content.danger ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {content.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
