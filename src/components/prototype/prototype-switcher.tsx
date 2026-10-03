"use client";

/**
 * PROTOTYPE ONLY — แถบสลับแบบร่าง (ทิ้งได้)
 * สลับ variant ผ่าน search param บน route เดิม ไม่แสดงผลใน production build
 * รองรับได้ 2 แกน: แกนหลัก (← →) และแกนรอง (↑ ↓) เช่น "หน้าตา" กับ "รูปแบบการยืนยัน"
 */

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, FlaskConical } from "lucide-react";

export interface PrototypeVariant {
  key: string;
  name: string;
}

export interface PrototypeAxis {
  /** ชื่อ search param ที่ใช้เก็บค่า */
  param: string;
  label: string;
  variants: PrototypeVariant[];
}

export function PrototypeSwitcher({
  variants,
  secondary,
}: {
  variants: PrototypeVariant[];
  secondary?: PrototypeAxis;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const move = useCallback(
    (axis: PrototypeAxis, delta: number) => {
      const current = params.get(axis.param) ?? axis.variants[0].key;
      const i = Math.max(
        0,
        axis.variants.findIndex((v) => v.key === current)
      );
      const next = axis.variants[(i + delta + axis.variants.length) % axis.variants.length];
      const sp = new URLSearchParams(params.toString());
      sp.set(axis.param, next.key);
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    },
    [params, pathname, router]
  );

  const primary: PrototypeAxis = { param: "variant", label: "หน้าตา", variants };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") move(primary, -1);
      if (e.key === "ArrowRight") move(primary, 1);
      if (secondary && e.key === "ArrowUp") move(secondary, -1);
      if (secondary && e.key === "ArrowDown") move(secondary, 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [move, secondary, variants]);

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center">
      <div className="pointer-events-auto rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 shadow-xl">
        <div className="mb-1 flex items-center gap-1.5">
          <FlaskConical className="size-3.5 text-amber-400" />
          <span className="text-[10.5px] font-semibold tracking-wide text-amber-400 uppercase">
            prototype
          </span>
        </div>

        <AxisRow
          axis={primary}
          current={params.get(primary.param) ?? primary.variants[0].key}
          onPrev={() => move(primary, -1)}
          onNext={() => move(primary, 1)}
          icons={[ChevronLeft, ChevronRight]}
        />

        {secondary && (
          <AxisRow
            axis={secondary}
            current={params.get(secondary.param) ?? secondary.variants[0].key}
            onPrev={() => move(secondary, -1)}
            onNext={() => move(secondary, 1)}
            icons={[ChevronUp, ChevronDown]}
          />
        )}
      </div>
    </div>
  );
}

function AxisRow({
  axis,
  current,
  onPrev,
  onNext,
  icons,
}: {
  axis: PrototypeAxis;
  current: string;
  onPrev: () => void;
  onNext: () => void;
  icons: [typeof ChevronLeft, typeof ChevronRight];
}) {
  const [Prev, Next] = icons;
  const v = axis.variants.find((x) => x.key === current) ?? axis.variants[0];
  return (
    <div className="flex items-center gap-1">
      <span className="w-24 shrink-0 text-[11px] text-zinc-400">{axis.label}</span>
      <button
        type="button"
        onClick={onPrev}
        aria-label={`${axis.label}: ก่อนหน้า`}
        className="flex size-7 items-center justify-center rounded-full hover:bg-zinc-700"
      >
        <Prev className="size-4" />
      </button>
      <span className="min-w-56 text-center text-[12.5px] font-semibold">
        {v.key} · {v.name}
      </span>
      <button
        type="button"
        onClick={onNext}
        aria-label={`${axis.label}: ถัดไป`}
        className="flex size-7 items-center justify-center rounded-full hover:bg-zinc-700"
      >
        <Next className="size-4" />
      </button>
    </div>
  );
}
