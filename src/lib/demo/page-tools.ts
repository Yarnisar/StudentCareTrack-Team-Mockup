"use client";

/**
 * เครื่องมือของหน้า (สำหรับแผงสาธิต)
 * หน้าใดต้องการปุ่มใน "เครื่องมือของหน้านี้" ให้เรียก useDemoPageTool — แผงสาธิตอ่านรายการผ่าน useDemoPageTools
 */

import { useEffect, useId, useRef, useSyncExternalStore } from "react";

export interface DemoPageTool {
  id: string;
  label: string;
  description?: string;
  run: () => void;
}

const tools = new Map<string, DemoPageTool>();
const listeners = new Set<() => void>();
let snapshot: DemoPageTool[] = [];

function emit() {
  snapshot = [...tools.values()];
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const EMPTY: DemoPageTool[] = [];

/** รายการเครื่องมือของหน้าที่เปิดอยู่ */
export function useDemoPageTools(): DemoPageTool[] {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY
  );
}

/** ลงทะเบียนปุ่มในแผงสาธิตตลอดช่วงที่ component นี้แสดงอยู่ */
export function useDemoPageTool(label: string, run: () => void, description?: string) {
  const id = useId();
  const runRef = useRef(run);

  useEffect(() => {
    runRef.current = run;
  });

  useEffect(() => {
    tools.set(id, { id, label, description, run: () => runRef.current() });
    emit();
    return () => {
      tools.delete(id);
      emit();
    };
  }, [id, label, description]);
}
