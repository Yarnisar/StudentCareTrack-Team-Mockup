/**
 * ปีการศึกษาและภาคเรียนจากวันที่ (พ.ศ.) ใช้แบ่งประวัติของนักเรียนตามภาคเรียน และรีเซ็ตคะแนนความประพฤติทุกปีการศึกษา
 * - ภาคเรียนที่ 1: พ.ค.–ต.ค. · ภาคเรียนที่ 2: พ.ย. ถึง เม.ย. ปีถัดไป (ม.ค.–เม.ย. นับเป็นภาคเรียนที่ 2 ของปีการศึกษาก่อนหน้า)
 * PROTOTYPE: ช่วงวันของภาคเรียนเป็นค่าตัวอย่าง Project 2 อ่านปฏิทินการศึกษาจากระบบทะเบียนของ Team B
 */

export interface TermInfo {
  termId: string;
  academicYear: number;
  semester: 1 | 2;
  /** เช่น ภาคเรียนที่ 2 ปีการศึกษา 2569 */
  label: string;
  /** เช่น 2/2569 */
  short: string;
  start: string;
  end: string;
}

export function termInfo(academicYear: number, semester: 1 | 2): TermInfo {
  return {
    termId: `T${academicYear}-${semester}`,
    academicYear,
    semester,
    label: `ภาคเรียนที่ ${semester} ปีการศึกษา ${academicYear}`,
    short: `${semester}/${academicYear}`,
    start: semester === 1 ? `${academicYear}-05-01` : `${academicYear}-11-01`,
    end: semester === 1 ? `${academicYear}-10-31` : `${academicYear + 1}-04-30`,
  };
}

/** แปลง termId (เช่น T2569-2) เป็นข้อมูลภาคเรียน */
export function termInfoOf(termId: string): TermInfo {
  const m = termId.match(/^T(\d{4})-([12])$/);
  if (!m) return termInfo(0, 1);
  return termInfo(Number(m[1]), Number(m[2]) as 1 | 2);
}

export function termOfDate(date: string): TermInfo {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  if (month >= 5 && month <= 10) return termInfo(year, 1);
  if (month >= 11) return termInfo(year, 2);
  return termInfo(year - 1, 2);
}

export const academicYearOfDate = (date: string) => termOfDate(date).academicYear;
