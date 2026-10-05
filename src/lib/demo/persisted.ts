/**
 * ค่าที่จำข้ามการ reload สำหรับการสาธิต (localStorage) — ใช้คู่กับ useSyncExternalStore
 * ฝั่ง server และรอบ hydrate ให้ใช้ค่าเริ่มต้นเสมอ เพื่อไม่ให้ HTML ไม่ตรงกัน
 * ถ้าเบราว์เซอร์ไม่ให้ใช้ storage (private mode ฯลฯ) จะจำได้แค่ในหน้าที่เปิดอยู่
 */

export interface PersistedString {
  subscribe: (listener: () => void) => () => void;
  /** ค่าปัจจุบัน (null = ยังไม่เคยตั้ง) — ใช้เป็น getSnapshot ฝั่ง client */
  get: () => string | null;
  set: (value: string | null) => void;
}

export function createPersistedString(key: string): PersistedString {
  const listeners = new Set<() => void>();
  let cache: string | null | undefined;

  const get = () => {
    if (cache === undefined) {
      try {
        cache = window.localStorage.getItem(key);
      } catch {
        cache = null;
      }
    }
    return cache;
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    get,
    set(value) {
      cache = value;
      try {
        if (value == null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, value);
      } catch {
        /* จำได้แค่ในหน่วยความจำ */
      }
      listeners.forEach((l) => l());
    },
  };
}

/** ผู้ใช้ที่เลือกสวมบทบาทล่าสุด (ข้อมูลอื่นของต้นแบบยังรีเซ็ตทุกครั้งที่ reload) */
export const storedCurrentUserId = createPersistedString("sct-demo:user");

/** แผงสาธิตถูกย่ออยู่หรือไม่ ("1" = ย่อ) */
export const storedPanelCollapsed = createPersistedString("sct-demo:panel-collapsed");
