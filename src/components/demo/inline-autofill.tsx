"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemoPageTools, type DemoPageTool } from "@/lib/demo/page-tools";
import { cn } from "cn";

const DESCRIPTION = "เติมข้อมูลตัวอย่างทั้งฟอร์ม แล้วตรวจ/แก้ไขก่อนบันทึกได้";

/**
 * ปุ่มกรอกข้อมูลอัตโนมัติบนหน้าฟอร์ม — ใช้รายการเดียวกับ "เครื่องมือของหน้านี้" ในแผงสาธิต
 * - ปุ่มหลัก = เครื่องมือตัวแรกที่หน้าลงทะเบียน (ชุดที่ใช้บ่อยที่สุด) กดครั้งเดียวกรอกทั้งฟอร์ม
 * - มีเครื่องมือมากกว่า 1 → มีเมนูเลือกชุดอื่น
 * - ไม่มีเครื่องมือ (ฟอร์มล็อก/อ่านอย่างเดียว) → ไม่แสดงอะไร
 * การเติมแก้เฉพาะ state ของฟอร์ม ไม่บันทึก/ส่ง/รับรองให้
 */
export function InlineAutofill({ className }: { className?: string }) {
  const tools = useDemoPageTools();
  const [done, setDone] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(null), 6000);
    return () => clearTimeout(t);
  }, [done]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (tools.length === 0) return null;
  const [primary, ...others] = tools;

  const run = (tool: DemoPageTool) => {
    tool.run();
    setOpen(false);
    setDone(tool.label);
  };

  return (
    <div
      ref={rootRef}
      data-testid="inline-autofill"
      className={cn(
        "relative mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dashed border-primary/40 bg-accent/60 px-4 py-3",
        className
      )}
    >
      <div className="flex items-center">
        <Button
          type="button"
          onClick={() => run(primary)}
          title={DESCRIPTION}
          aria-describedby={`${menuId}-desc`}
          className={cn("h-9 px-3.5 text-[13.5px] font-semibold", others.length > 0 && "rounded-r-none")}
        >
          <Wand2 data-icon="inline-start" />
          กรอกข้อมูลอัตโนมัติ
        </Button>
        {others.length > 0 && (
          <Button
            type="button"
            aria-label="เลือกชุดข้อมูลตัวอย่างอื่น"
            aria-haspopup="true"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
            className="h-9 rounded-l-none border-l border-l-primary-foreground/30 px-2"
          >
            <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
          </Button>
        )}
      </div>

      <p id={`${menuId}-desc`} className="min-w-0 flex-1 text-[12.5px] text-muted-foreground">
        {DESCRIPTION}
      </p>

      <p
        role="status"
        aria-live="polite"
        className={cn(
          "flex w-full items-center gap-1.5 text-[12.5px] font-medium text-risk-green",
          !done && "sr-only"
        )}
      >
        {done && (
          <>
            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
            เติมข้อมูลแล้ว — ตรวจสอบก่อนบันทึก
          </>
        )}
      </p>

      {open && others.length > 0 && (
        <ul
          id={menuId}
          aria-label="ชุดข้อมูลตัวอย่างอื่น"
          className="absolute top-full left-4 z-30 mt-1 w-[min(22rem,calc(100%-2rem))] rounded-xl border border-border bg-popover p-1 shadow-lg"
        >
          {others.map((tool) => (
            <li key={tool.id}>
              <button
                type="button"
                onClick={() => run(tool)}
                className="block w-full rounded-lg px-3 py-2 text-left outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <span className="block text-[13px] font-semibold">
                  {tool.label.replace(/^กรอกอัตโนมัติ · /, "")}
                </span>
                {tool.description && (
                  <span className="block text-[12px] text-muted-foreground">{tool.description}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
