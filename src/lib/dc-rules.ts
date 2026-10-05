/** กฎของคุณลักษณะอันพึงประสงค์ (pure functions) */

import type { DcLevel } from "./types";

/**
 * ฐานนิยมของระดับคะแนน (ค่าที่ระบบเสนอใน dc_summary.suggested_level)
 * ถ้ามีหลายค่าที่ความถี่เท่ากัน เลือกค่าที่ต่ำกว่า (ประเมินแบบระมัดระวัง ครูประจำชั้นแก้ได้พร้อมเหตุผล)
 * ไม่มีคะแนนเลย → null
 */
export function modeLevel(levels: DcLevel[]): DcLevel | null {
  if (levels.length === 0) return null;
  const counts = [0, 0, 0, 0];
  for (const l of levels) counts[l] += 1;
  let best = 0;
  for (let l = 1; l <= 3; l++) if (counts[l] > counts[best]) best = l;
  return best as DcLevel;
}

/** ผ่านเกณฑ์คุณลักษณะ = ได้ "ผ่าน" ขึ้นไปทุกด้าน */
export const passesAllCriteria = (levels: (DcLevel | null | undefined)[]) =>
  levels.length > 0 && levels.every((l) => l != null && l >= 1);
