import type { useStore } from "@/lib/store";

type Store = ReturnType<typeof useStore>;

/** นัดเยี่ยมบ้านที่ยังดำเนินอยู่ของนักเรียน (ข้ามนัดที่ยกเลิกและเสร็จสิ้นแล้ว) — ใกล้วันที่สุดก่อน */
export function openAppointmentOf(store: Store, studentId: string) {
  return store
    .appointmentsOf(studentId)
    .filter((a) => a.status !== "cancelled" && a.status !== "completed")
    .sort((a, b) => a.proposedDate.localeCompare(b.proposedDate))[0];
}
