/**
 * รอบประเมินนี้มีผู้เริ่มตอบแล้วหรือยัง (UC9 Scenario B ข้อ 4)
 * ถ้ามีแล้ว ระบบล็อกชนิดแบบประเมิน ภาคเรียน คำถามและเกณฑ์คะแนน ไม่ให้แก้ เพราะจะทำให้คำตอบเดิมเทียบกันไม่ได้
 * PROTOTYPE: นับจากข้อมูลของภาคเรียนเดียวกันใน store (คำถามของแบบประเมินแก้ไม่ได้ในต้นแบบอยู่แล้ว)
 */

import { CURRENT_TERM } from "./mock-data";
import type { AssessmentWindow } from "./periods";
import type { useStore } from "./store";

type Store = ReturnType<typeof useStore>;

export function windowStarted(store: Store, w: AssessmentWindow): number {
  const termId = w.termId ?? CURRENT_TERM.termId;
  switch (w.kind) {
    case "screening":
      return store.screenings.filter((s) => s.termId === termId).length;
    case "red_flag":
      return store.redFlags.filter((r) => r.termId === termId).length;
    case "nine_s":
      return store.nineS.filter((r) => r.termId === termId).length;
    case "sdq":
      return store.sdq.filter((s) => s.termId === termId && s.round === (w.round ?? 1) && s.status === "completed").length;
    case "eq":
      return store.eq.filter((e) => e.termId === termId && e.status !== "pending").length;
    case "home_visit":
      return store.appointments.length;
  }
}
