"use client";

import { cn } from "cn";
import { useStore } from "@/lib/store";

/** ตั้งค่า "รับอีเมล" ของผู้ใช้ปัจจุบัน — การแจ้งเตือนในระบบปิดไม่ได้ */
export function EmailToggle() {
  const store = useStore();
  const { currentUser } = store;
  const enabled = store.emailEnabledOf(currentUser.userId);
  const hasEmail = Boolean(currentUser.email);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold">รับทางอีเมล</div>
        <div className="text-[12px] text-muted-foreground">
          {hasEmail
            ? `ส่งไปที่ ${currentUser.email}`
            : "ยังไม่มีอีเมลในบัญชีนี้"}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={hasEmail && enabled}
        aria-label="รับการแจ้งเตือนทางอีเมล"
        disabled={!hasEmail}
        onClick={() => store.setEmailEnabled(!enabled)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40",
          hasEmail && enabled ? "bg-primary" : "bg-muted-foreground/30"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
            hasEmail && enabled ? "left-[22px]" : "left-0.5"
          )}
        />
      </button>
    </div>
  );
}
