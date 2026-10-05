import { academicTerms } from "@/lib/mock-data";

/** ชื่อภาคเรียนจากรหัส เช่น "ภาคเรียนที่ 1 ปีการศึกษา 2569" */
export const termLabelOf = (termId: string) =>
  academicTerms.find((t) => t.termId === termId)?.label ?? termId;
