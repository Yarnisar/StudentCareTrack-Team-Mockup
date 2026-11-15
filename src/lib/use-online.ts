"use client";

import { useSyncExternalStore } from "react";

/** สถานะการเชื่อมต่อของเบราว์เซอร์ — ต้นแบบยังไม่มี server จึงบอกได้แค่ว่าเครื่องต่ออินเทอร์เน็ตอยู่หรือไม่ */
function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export function useOnline() {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
}
