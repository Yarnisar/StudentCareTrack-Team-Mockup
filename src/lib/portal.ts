"use client";

/**
 * นักเรียนที่หน้า portal กำลังแสดง
 * - นักเรียน: ตัวเอง
 * - ผู้ปกครอง: บุตรหลานที่เลือกไว้ (จำข้ามการ reload) ถ้ายังไม่เลือกใช้คนแรก
 */

import { useSyncExternalStore } from "react";
import { createPersistedString } from "@/lib/demo/persisted";
import { useStore } from "@/lib/store";

const storedChildId = createPersistedString("sct-demo:portal-child");

/** ผู้ใช้ฝั่งครูที่เปิดดู portal (เช่นตอนสาธิต) จะเห็นนักเรียนคนนี้ */
const FALLBACK_STUDENT_ID = "30125";

export function usePortalStudent() {
  const store = useStore();
  const storedId = useSyncExternalStore(storedChildId.subscribe, storedChildId.get, () => null);
  const user = store.currentUser;

  const children = user.role === "parent" ? store.studentsOfGuardian(user.userId) : [];
  const studentId =
    user.role === "student"
      ? (user.refId ?? FALLBACK_STUDENT_ID)
      : user.role === "parent"
        ? ((children.find((c) => c.studentId === storedId) ?? children[0])?.studentId ?? null)
        : FALLBACK_STUDENT_ID;

  return {
    studentId,
    student: studentId ? store.getStudent(studentId) : undefined,
    children,
    selectChild: (id: string) => storedChildId.set(id),
  };
}
