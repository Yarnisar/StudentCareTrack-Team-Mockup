"use client";

/**
 * การจัดการ "ข้อที่ยังไม่ได้ตอบ" ของแบบประเมินทุกชุด
 *
 * แนวทาง: ไม่ปิดปุ่มถัดไป/บันทึก แต่ให้กดได้เสมอ
 * ถ้ายังตอบไม่ครบ ระบบจะพาไปที่ข้อแรกที่ขาดทันที (ข้ามหน้าได้ถ้าฟอร์มแบ่งหน้า) และ focus ตัวเลือกแรกของข้อนั้น
 * กล่องสรุปจำนวนข้อที่ขาดใช้เฉพาะฟอร์มยาว ผู้ใช้กดเลขข้อเพื่อกระโดดไปข้ออื่นได้
 */

import { useCallback, useRef, useState } from "react";
import { AlertCircle, Check } from "lucide-react";

const FOCUSABLE = '[role="radio"], [role="checkbox"], input, textarea, select, button';

export interface MissingItem {
  /** คีย์ของคำถาม ใช้จับคู่กับ registerNode */
  key: string;
  /** ข้อความบนชิป เช่น "ข้อ 3" */
  label: string;
  /** หน้าที่คำถามนี้อยู่ สำหรับฟอร์มที่แบ่งหน้า */
  page?: number;
}

const scrollAndFocus = (el: HTMLElement | null | undefined) => {
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });
};

export function useMissingAnswers(onGoToPage?: (page: number) => void) {
  const [missing, setMissing] = useState<MissingItem[]>([]);
  const nodes = useRef(new Map<string, HTMLElement>());

  const registerNode = useCallback(
    (key: string) => (el: HTMLElement | null) => {
      if (el) nodes.current.set(key, el);
      else nodes.current.delete(key);
    },
    []
  );

  const jumpTo = useCallback(
    (item: MissingItem) => {
      if (item.page !== undefined) onGoToPage?.(item.page);
      // รอให้ React วาดหน้าใหม่ก่อน เผื่อกรณีต้องข้ามไปหน้าอื่น
      requestAnimationFrame(() => scrollAndFocus(nodes.current.get(item.key)));
    },
    [onGoToPage]
  );

  /** เรียกเมื่อผู้ใช้กดถัดไป/บันทึกทั้งที่ยังตอบไม่ครบ — พาไปที่ข้อแรกที่ขาด */
  const report = useCallback(
    (items: MissingItem[]) => {
      setMissing(items);
      if (items[0]) jumpTo(items[0]);
    },
    [jumpTo]
  );

  /** เอาข้อออกจากรายการเมื่อผู้ใช้ตอบแล้ว */
  const resolve = useCallback(
    (key: string) => setMissing((prev) => prev.filter((m) => m.key !== key)),
    []
  );

  const reset = useCallback(() => setMissing([]), []);

  const isMissing = useCallback((key: string) => missing.some((m) => m.key === key), [missing]);

  return { missing, isMissing, registerNode, jumpTo, report, resolve, reset };
}

export function MissingSummary({
  missing,
  onJump,
}: {
  missing: MissingItem[];
  onJump: (item: MissingItem) => void;
}) {
  if (missing.length === 0) return null;

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex gap-2.5">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-destructive">
            ยังตอบไม่ครบ เหลืออีก {missing.length} ข้อ
          </p>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">กดเลขข้อเพื่อไปที่คำถามนั้น</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {missing.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onJump(item)}
                className="rounded-lg border border-destructive/40 bg-card px-3 py-1.5 text-[13px] font-semibold text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * คลาสของกล่องคำถาม — แถบซ้ายเมื่อเป็นข้อที่ยังไม่ได้ตอบ
 * ใช้สี destructive (ข้อผิดพลาดของฟอร์ม) ไม่ใช้ risk-red ที่สงวนไว้สำหรับผลกลุ่มมีปัญหา
 * ไม่ลงพื้นและไม่ตีกรอบ เพื่อไม่ชนมุมโค้งของการ์ดและไม่ทำให้ตัวเลือกดูจาง
 */
export function questionShellClass(missing: boolean) {
  return missing ? "shadow-[inset_3px_0_0_0_var(--destructive)]" : "";
}

/** เลขข้อ: เขียวติ๊กถูกเมื่อตอบแล้ว แดงเมื่อถูกทำเครื่องหมายว่ายังไม่ได้ตอบ */
export function QuestionNumber({
  no,
  answered,
  missing,
}: {
  no: number;
  answered: boolean;
  missing: boolean;
}) {
  return (
    <span
      className={`flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
        missing
          ? "bg-destructive text-destructive-foreground"
          : answered
            ? "bg-risk-green-bg text-risk-green"
            : "bg-muted text-muted-foreground"
      }`}
    >
      {answered && !missing ? <Check className="size-3.5" strokeWidth={3} /> : no}
    </span>
  );
}

export function MissingNote({ show }: { show: boolean }) {
  if (!show) return null;
  return <p className="mt-1 text-[12.5px] font-semibold text-destructive">ยังไม่ได้ตอบข้อนี้</p>;
}
