"use client";

import { cn } from "cn";
import { usePortalStudent } from "@/lib/portal";

/** ตัวเลือกบุตรหลาน — แสดงเฉพาะผู้ปกครองที่มีนักเรียนในความดูแลมากกว่า 1 คน */
export function ChildSwitcher() {
  const { children, studentId, selectChild } = usePortalStudent();
  if (children.length < 2) return null;

  return (
    <div role="tablist" aria-label="เลือกบุตรหลาน" className="flex gap-2 overflow-x-auto">
      {children.map((child) => {
        const active = child.studentId === studentId;
        return (
          <button
            key={child.studentId}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => selectChild(child.studentId)}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-[13px] transition-colors",
              active
                ? "border-primary bg-accent font-semibold text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-[12px] font-bold",
                active ? "bg-primary text-primary-foreground" : "bg-muted"
              )}
            >
              {child.fullName.replace(/^(ด\.ช\.|ด\.ญ\.)\s*/, "").charAt(0)}
            </span>
            <span>
              <span className="block leading-tight">{child.fullName}</span>
              <span className="block text-[11.5px] font-normal text-muted-foreground">
                {child.roomName} เลขที่ {child.classNo}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
