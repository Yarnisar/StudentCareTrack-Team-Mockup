"use client";

/** แผงแก้ไขด้านขวา (ซ้อนทับหน้า) — กด Esc หรือคลิกฉากหลังเพื่อปิด */

import { useEffect } from "react";
import { X } from "lucide-react";

export function SideDrawer({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="ปิดแผง"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/30"
      />
      <aside
        role="dialog"
        aria-label={title}
        className="relative h-full w-[26rem] max-w-full overflow-y-auto border-l border-border bg-card p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold">{title}</h3>
            {subtitle && <p className="text-[12px] text-muted-foreground">{subtitle}</p>}
          </div>
          <button
            type="button"
            aria-label="ปิดแผง"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}
