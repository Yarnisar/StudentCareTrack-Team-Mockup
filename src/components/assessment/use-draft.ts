"use client";

/**
 * ค่าของแบบฟอร์มที่บันทึกเป็นร่างอัตโนมัติทุกครั้งที่เปลี่ยน
 * ครูไม่ต้องกดบันทึกร่างเอง — ร่างจะถูกลบเมื่อส่งแบบฟอร์มสำเร็จ (ฝั่ง store)
 * Project 2: saveDraft จะเรียก API แบบหน่วงเวลา (debounce) และเก็บร่างไว้ฝั่ง server ไม่ใช่ในเครื่อง
 */

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";

export function useDraft<T>(key: string, initial: () => T) {
  const store = useStore();
  const [restored] = useState(() => store.getDraft(key) !== undefined);
  const [value, setValue] = useState<T>(() => store.getDraft<T>(key) ?? initial());
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  // เก็บค่าล่าสุดไว้ใน ref เพราะกดต่อเนื่องเร็ว ๆ ก่อนเรนเดอร์ใหม่ ค่า value ในรอบนั้นยังเป็นค่าเก่า คำตอบที่กดก่อนหน้าจะหาย
  const latest = useRef(value);

  const update = (next: T | ((prev: T) => T)) => {
    const resolved = typeof next === "function" ? (next as (prev: T) => T)(latest.current) : next;
    latest.current = resolved;
    setValue(resolved);
    store.saveDraft(key, resolved);
    setSavedAt(new Date());
  };

  return { value, update, restored, savedAt };
}
