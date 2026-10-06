/** ข้อมูลตัวอย่าง: คุณลักษณะอันพึงประสงค์ (ปพ.5 / ปพ.6) */

import type {
  DcCriteria,
  DcIndicator,
  DcLevel,
  DcScore,
  DcSubmissionDeadline,
  DcSummaryRow,
  Subject,
  SubjectTeaching,
} from "../types";
import { generatedRoster, USER } from "./core";
import { hashText, Rng } from "./prng";

export const dcCriteria: DcCriteria[] = [
  { criteriaId: 1, name: "รักชาติ ศาสน์ กษัตริย์", shortName: "รักชาติฯ", description: "" },
  { criteriaId: 2, name: "ซื่อสัตย์สุจริต", shortName: "ซื่อสัตย์", description: "" },
  { criteriaId: 3, name: "มีวินัย", shortName: "มีวินัย", description: "" },
  { criteriaId: 4, name: "ใฝ่เรียนรู้", shortName: "ใฝ่เรียนรู้", description: "" },
  { criteriaId: 5, name: "อยู่อย่างพอเพียง", shortName: "พอเพียง", description: "" },
  { criteriaId: 6, name: "มุ่งมั่นในการทำงาน", shortName: "มุ่งมั่น", description: "" },
  { criteriaId: 7, name: "รักความเป็นไทย", shortName: "รักไทย", description: "" },
  { criteriaId: 8, name: "มีจิตสาธารณะ", shortName: "จิตสาธารณะ", description: "" },
];

/**
 * ตัวชี้วัดตามหลักสูตรแกนกลางฯ 2551 (ต้องตรวจถ้อยคำกับเอกสารหลักสูตรอีกครั้ง)
 * ต้นแบบใช้ชุดเดียวกันสำหรับ ม.1-3
 */
const indicator = (criteriaId: number, n: number, description: string): DcIndicator => ({
  indicatorId: `IND-${criteriaId}.${n}`,
  criteriaId,
  code: `${criteriaId}.${n}`,
  description,
  gradeRange: "ม.1-3",
});

export const dcIndicators: DcIndicator[] = [
  indicator(1, 1, "เป็นพลเมืองดีของชาติ"),
  indicator(1, 2, "ธำรงไว้ซึ่งความเป็นชาติไทย"),
  indicator(1, 3, "ศรัทธา ยึดมั่น และปฏิบัติตนตามหลักของศาสนา"),
  indicator(1, 4, "เคารพเทิดทูนสถาบันพระมหากษัตริย์"),
  indicator(2, 1, "ประพฤติตรงตามความเป็นจริงต่อตนเองทั้งทางกาย วาจา ใจ"),
  indicator(2, 2, "ประพฤติตรงตามความเป็นจริงต่อผู้อื่นทั้งทางกาย วาจา ใจ"),
  indicator(3, 1, "ปฏิบัติตามข้อตกลง กฎเกณฑ์ ระเบียบ ข้อบังคับของครอบครัว โรงเรียน และสังคม"),
  indicator(4, 1, "ตั้งใจ เพียรพยายามในการเรียนและเข้าร่วมกิจกรรมการเรียนรู้"),
  indicator(4, 2, "แสวงหาความรู้จากแหล่งเรียนรู้ต่าง ๆ และนำไปใช้ในชีวิตประจำวันได้"),
  indicator(5, 1, "ดำเนินชีวิตอย่างพอประมาณ มีเหตุผล รอบคอบ มีคุณธรรม"),
  indicator(5, 2, "มีภูมิคุ้มกันในตัวที่ดี ปรับตัวเพื่ออยู่ในสังคมได้อย่างมีความสุข"),
  indicator(6, 1, "ตั้งใจและรับผิดชอบในการปฏิบัติหน้าที่การงาน"),
  indicator(6, 2, "ทำงานด้วยความเพียรพยายามและอดทนเพื่อให้งานสำเร็จตามเป้าหมาย"),
  indicator(7, 1, "ภาคภูมิใจในขนบธรรมเนียมประเพณี ศิลปวัฒนธรรมไทย และมีความกตัญญูกตเวที"),
  indicator(7, 2, "เห็นคุณค่าและใช้ภาษาไทยในการสื่อสารได้อย่างถูกต้องเหมาะสม"),
  indicator(7, 3, "อนุรักษ์และสืบทอดภูมิปัญญาไทย"),
  indicator(8, 1, "ช่วยเหลือผู้อื่นด้วยความเต็มใจโดยไม่หวังผลตอบแทน"),
  indicator(8, 2, "เข้าร่วมกิจกรรมที่เป็นประโยชน์ต่อโรงเรียน ชุมชน และสังคม"),
];

/** รายวิชา ม.3 ภาคเรียนที่ 2 (Team A) */
export const subjects: Subject[] = [
  { subjectId: "SUB-TH", subjectCode: "ท23102", name: "ภาษาไทย" },
  { subjectId: "SUB-MA", subjectCode: "ค23102", name: "คณิตศาสตร์" },
  { subjectId: "SUB-SC", subjectCode: "ว23102", name: "วิทยาศาสตร์" },
  { subjectId: "SUB-SO", subjectCode: "ส23102", name: "สังคมศึกษา" },
  { subjectId: "SUB-EN", subjectCode: "อ23102", name: "ภาษาอังกฤษ" },
  { subjectId: "SUB-PE", subjectCode: "พ23102", name: "สุขศึกษาและพลศึกษา" },
  { subjectId: "SUB-AR", subjectCode: "ศ23102", name: "ศิลปะ" },
  { subjectId: "SUB-CT", subjectCode: "ง23102", name: "การงานอาชีพ" },
];

const TEACHER_OF: Record<string, string> = {
  "SUB-TH": USER.wimon,
  "SUB-MA": USER.wichai,
  "SUB-SC": USER.napa,
  "SUB-SO": USER.prayong,
  "SUB-EN": USER.anna,
  "SUB-PE": USER.somchaiK,
  "SUB-AR": USER.malee,
  "SUB-CT": USER.arun,
};

/** ห้อง ม.3/1 เรียนครบ 8 รายวิชาในทั้งสองภาคเรียนของปี 2569 */
export const subjectTeachings: SubjectTeaching[] = ["T2569-1", "T2569-2"].flatMap((termId) =>
  subjects.map((s) => ({
    teachingId: `TCH-${termId}-${s.subjectId}-R-301`,
    subjectId: s.subjectId,
    roomId: "R-301",
    termId,
    teacherId: TEACHER_OF[s.subjectId],
  }))
);

/**
 * กำหนดส่งคะแนน ปพ.5 จากงานวิชาการ (Team A) — ค่าจำลอง
 * ภาคเรียนปัจจุบันเลยกำหนดแล้ว (DEMO_TODAY 2570-02-16) จึงสรุปได้แม้ยังมีรายวิชาที่ไม่ส่ง
 */
export const DC_SUBMISSION_DEADLINE = "2570-02-13";

export const dcSubmissionDeadlines: DcSubmissionDeadline[] = [
  { termId: "T2569-1", date: "2569-09-30", source: "team_a_academic" },
  { termId: "T2569-2", date: DC_SUBMISSION_DEADLINE, source: "team_a_academic" },
];

/** ระดับที่ตั้งใจให้เป็นฐานนิยมของนักเรียนแต่ละคนต่อคุณลักษณะ (ใช้สร้างคะแนนตัวอย่าง) */
const PROFILE: Record<string, DcLevel[]> = {
  "30118": [3, 2, 1, 2, 3, 1, 2, 3],
  "30171": [3, 3, 2, 3, 3, 2, 3, 3],
  "30125": [3, 3, 2, 2, 3, 1, 2, 3],
  "30160": [3, 3, 3, 3, 3, 3, 3, 3],
  "30131": [2, 2, 0, 1, 2, 1, 2, 2],
  "30140": [3, 3, 3, 2, 3, 2, 3, 3],
  "30152": [3, 2, 2, 3, 2, 2, 3, 2],
  "30183": [3, 3, 3, 3, 2, 3, 3, 3],
};

/**
 * นักเรียนที่สร้างเพิ่ม (generated-roster.ts): ระดับฐานนิยมต่อคุณลักษณะสุ่มแบบกำหนดผลได้ตามบทบาท
 * ภาคเรียนที่ 1 (สรุปแล้ว) ต่างจากฐานปัจจุบันเล็กน้อยบางคุณลักษณะ
 */
const dcRng = new Rng(hashText("sct-class-38:dc"));
const LEVEL_POOL: Record<"strong" | "mid" | "weak", DcLevel[]> = {
  strong: [3, 3, 3, 2],
  mid: [3, 2, 2, 3, 1],
  weak: [2, 1, 2, 1, 0],
};
const PREVIOUS_GENERATED: Record<string, DcLevel[]> = {};
const MATH_GENERATED: string[] = [];
generatedRoster.profiles.forEach((p, i) => {
  const kind = p.scenario.startsWith("green") ? "strong" : p.scenario.startsWith("red") ? "weak" : "mid";
  const levels = Array.from({ length: 8 }, () => dcRng.pick(LEVEL_POOL[kind]));
  PROFILE[p.studentId] = levels;
  PREVIOUS_GENERATED[p.studentId] = levels.map((l) => (dcRng.chance(0.15) ? (Math.max(0, Math.min(3, l + (dcRng.chance(0.5) ? 1 : -1))) as DcLevel) : l));
  // คณิตศาสตร์ยังให้คะแนนไม่ครบทั้งห้อง: 4 คนที่ยังไม่ได้ให้คะแนน
  if (i % 8 !== 5) MATH_GENERATED.push(p.studentId);
});

/** ค่าสุ่มแบบคงที่จากข้อความ (ให้ข้อมูลตัวอย่างเหมือนเดิมทุกครั้ง) */
const hash = (text: string) => [...text].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 9973, 7);

const levelFor = (studentId: string, ind: DcIndicator, subjectId: string): DcLevel => {
  const base = PROFILE[studentId][ind.criteriaId - 1];
  const h = hash(`${studentId}|${ind.indicatorId}|${subjectId}`) % 10;
  // ราว 1 ใน 5 ของคะแนนต่างจากฐาน 1 ระดับ ฐานนิยมจึงยังเป็นค่าเดิม
  const shifted = h === 0 ? base - 1 : h === 1 ? base + 1 : base;
  return Math.max(0, Math.min(3, shifted)) as DcLevel;
};

/**
 * ภาคเรียนปัจจุบัน: 6 วิชาส่งครบ, คณิตศาสตร์ (ครูวิชัย — อยู่ในตัวสลับผู้ใช้) ให้คะแนนแล้ว 5 คน,
 * การงานอาชีพยังไม่ให้คะแนน
 * (ภาคเรียนที่ 1 สรุปไปแล้ว — ต้นแบบเก็บเฉพาะ dc_summary ของภาคนั้น)
 */
const MATH_FILLED = ["30118", "30125", "30131", "30140", "30152", ...MATH_GENERATED];

export const dcScores: DcScore[] = Object.keys(PROFILE).flatMap((studentId) =>
  subjects.flatMap((s) => {
    if (s.subjectId === "SUB-CT") return [];
    if (s.subjectId === "SUB-MA" && !MATH_FILLED.includes(studentId)) return [];
    return dcIndicators.map(
      (ind): DcScore => ({
        scoreId: `DCS-${studentId}-${s.subjectId}-${ind.code}`,
        studentId,
        indicatorId: ind.indicatorId,
        subjectId: s.subjectId,
        subjectTeacherId: TEACHER_OF[s.subjectId],
        termId: "T2569-2",
        level: levelFor(studentId, ind, s.subjectId),
        updatedAt: s.subjectId === "SUB-MA" ? "2570-02-15T16:20:00" : "2570-02-11T15:30:00",
      })
    );
  })
);

/** สรุป ปพ.6 ภาคเรียนที่ 1/2569 (สรุปครบแล้ว) */
const PREVIOUS: Record<string, DcLevel[]> = {
  "30118": [3, 2, 1, 2, 3, 1, 2, 3],
  "30171": [3, 3, 2, 3, 3, 2, 3, 3],
  "30125": [3, 3, 2, 2, 3, 2, 2, 3],
  "30160": [3, 3, 3, 3, 3, 3, 3, 3],
  "30131": [2, 2, 1, 1, 2, 1, 2, 2],
  "30140": [3, 3, 3, 2, 3, 2, 3, 3],
  "30152": [3, 2, 2, 3, 2, 2, 3, 2],
  "30183": [3, 3, 3, 3, 2, 3, 3, 3],
};

export const dcSummaryRows: DcSummaryRow[] = Object.entries({ ...PREVIOUS, ...PREVIOUS_GENERATED }).flatMap(([studentId, levels]) =>
  levels.map(
    (level, i): DcSummaryRow => ({
      summaryId: `DSM-${studentId}-T2569-1-${i + 1}`,
      studentId,
      criteriaId: i + 1,
      termId: "T2569-1",
      suggestedLevel: level,
      level,
      adjustReason: null,
      missingSubjects: [],
      summarizedBy: USER.somying,
      summarizedAt: "2569-10-05T15:00:00",
    })
  )
);
