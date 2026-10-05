"use client";

/**
 * PROTOTYPE ONLY — ตัวสลับแบบร่าง (ทิ้งได้)
 * หน้าที่มีหลายแบบให้เปรียบเทียบวาง <PrototypeSwitcher /> ไว้ — ตัวมันเองไม่แสดงอะไร
 * แต่ลงทะเบียนแกนให้แผงสาธิตแสดงในส่วน "แบบที่กำลังเปรียบเทียบ" และรับปุ่มลูกศรบนคีย์บอร์ด
 * สลับ variant ผ่าน search param บน route เดิม รองรับได้ 2 แกน: แกนหลัก (← →) และแกนรอง (↑ ↓)
 */

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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

/* ---------- ทะเบียนแกนของหน้าที่เปิดอยู่ ---------- */

const listeners = new Set<() => void>();
const EMPTY: PrototypeAxis[] = [];
let registered: PrototypeAxis[] = EMPTY;

function setRegistered(axes: PrototypeAxis[]) {
  registered = axes;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** แกนแบบร่างของหน้าที่เปิดอยู่ (ว่าง = หน้านี้ไม่มีแบบให้เปรียบเทียบ) */
export function usePrototypeAxes(): PrototypeAxis[] {
  return useSyncExternalStore(
    subscribe,
    () => registered,
    () => EMPTY
  );
}

/** ค่าที่เลือกอยู่ของแกน และฟังก์ชันเลื่อนไปแบบก่อนหน้า/ถัดไป */
export function usePrototypeNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const current = useCallback(
    (axis: PrototypeAxis) => {
      const key = params.get(axis.param);
      return axis.variants.find((v) => v.key === key) ?? axis.variants[0];
    },
    [params]
  );

  const move = useCallback(
    (axis: PrototypeAxis, delta: number) => {
      const i = Math.max(0, axis.variants.indexOf(current(axis)));
      const next = axis.variants[(i + delta + axis.variants.length) % axis.variants.length];
      const sp = new URLSearchParams(params.toString());
      sp.set(axis.param, next.key);
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    },
    [current, params, pathname, router]
  );

  return { current, move };
}

/* ---------- component ที่หน้าต่าง ๆ วางไว้ ---------- */

export function PrototypeSwitcher({
  variants,
  secondary,
}: {
  variants: PrototypeVariant[];
  secondary?: PrototypeAxis;
}) {
  const { move } = usePrototypeNavigation();

  // props มักสร้างใหม่ทุก render — เทียบด้วยเนื้อหาแทน reference
  const axesKey = JSON.stringify([{ param: "variant", label: "หน้าตา", variants }, ...(secondary ? [secondary] : [])]);

  useEffect(() => {
    setRegistered(JSON.parse(axesKey) as PrototypeAxis[]);
    return () => setRegistered(EMPTY);
  }, [axesKey]);

  useEffect(() => {
    const [primary, second] = JSON.parse(axesKey) as PrototypeAxis[];
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
      if (second && e.key === "ArrowUp") move(second, -1);
      if (second && e.key === "ArrowDown") move(second, 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [axesKey, move]);

  return null;
}
