/**
 * PROTOTYPE ONLY — ข้อมูลจำลองขนาดโรงเรียนจริง (ทิ้งได้)
 *
 * คำถามที่ต้นแบบนี้ตอบ:
 *   1) หน้าภาพรวมของ "แอดมินโรงเรียน" ควรแสดงอะไร ต่างจากของครูประจำชั้นอย่างไร
 *   2) เมื่อข้อมูลมีหลักพันแถว ควรแบ่งหน้าแบบไหน แทนการเลื่อนจอยาว ๆ
 *
 * ข้อมูลตัวอย่างจริงในระบบมีนักเรียนแค่ 8 คน ซึ่งน้อยเกินกว่าจะเห็นปัญหา
 * ไฟล์นี้จึงสร้างนักเรียน ~1,500 คนตามสมมติฐานโรงเรียนขนาดกลางที่ตกลงกันไว้
 * สร้างด้วยสุ่มแบบมีเมล็ดคงที่ ตัวเลขจึงเท่าเดิมทุกครั้ง เทียบระหว่างแบบร่างได้
 */

export const LEVELS = [1, 2, 3, 4, 5, 6];
export const ROOMS_PER_LEVEL = 8;

/** ห้องของครูที่ล็อกอินอยู่ ใช้ตอนสลับขอบเขตเป็นมุมมองครูประจำชั้น */
export const MY_ROOM = "ม.3/1";

export type Risk = "green" | "amber" | "red";

export interface ProtoStudent {
  id: string;
  name: string;
  level: number;
  room: string;
  classNo: number;
  screened: boolean;
  risk: Risk | null;
  hasCase: boolean;
  /** จำนวนวันนับจากการติดตามครั้งล่าสุด (null = ยังไม่มีเคส) */
  daysSinceFollowup: number | null;
  /** จำนวนฉบับ SDQ ที่เปิดไว้แล้วแต่ยังไม่มีใครทำ */
  sdqPending: number;
}

export interface RoomSummary {
  room: string;
  level: number;
  teacher: string;
  total: number;
  screened: number;
  green: number;
  amber: number;
  red: number;
  openCases: number;
  /** ยังคัดกรองไม่ครบทั้งที่เลยกำหนดรอบแล้ว */
  overdue: boolean;
}

/** สุ่มแบบมีเมล็ด (mulberry32) เพื่อให้ผลเหมือนเดิมทุกครั้งที่เปิดหน้า */
function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = [
  "ณัฐวุฒิ", "ปาริชาต", "ธนกร", "ศิรประภา", "กิตติพงษ์", "อรอนงค์", "ชนาธิป", "พิมพ์ชนก",
  "ภาณุพงศ์", "สุพรรษา", "วรากร", "เบญจวรรณ", "อนุชา", "จิราพร", "ธีรภัทร", "กัญญา",
  "ศุภกร", "นภัสสร", "พีรพัฒน์", "ชลธิชา", "อดิศร", "วิภาวี", "ณภัทร", "รติมา",
];

const LAST_NAMES = [
  "ใจงาม", "ศรีสุข", "ทองดี", "วงศ์สว่าง", "แก้วมณี", "พันธุ์ดี", "รักเรียน", "บุญมาก",
  "สุขสันต์", "ตั้งมั่น", "เจริญพร", "อินทร์ทอง", "มีชัย", "สายทอง", "ดวงแก้ว", "พรหมมา",
];

const TEACHER_FIRST = ["สมชาย", "สมหญิง", "วราภรณ์", "ประยุทธ", "อัจฉรา", "ธนพล", "ศิริพร", "กมล"];
const TEACHER_LAST = ["ใจดี", "รอบรู้", "สอนดี", "ตั้งใจ", "พากเพียร", "มุ่งมั่น", "อบรม", "ปัญญา"];

function buildSchool() {
  const rnd = seeded(2569);
  const students: ProtoStudent[] = [];
  const rooms: RoomSummary[] = [];

  let running = 0;

  for (const level of LEVELS) {
    for (let r = 1; r <= ROOMS_PER_LEVEL; r++) {
      const room = `ม.${level}/${r}`;
      const total = 28 + Math.floor(rnd() * 8); // 28–35 คนต่อห้อง
      const teacher =
        room === MY_ROOM
          ? "ครูสมหญิง ใจดี"
          : `ครู${TEACHER_FIRST[Math.floor(rnd() * TEACHER_FIRST.length)]} ${
              TEACHER_LAST[Math.floor(rnd() * TEACHER_LAST.length)]
            }`;

      // ความคืบหน้าการคัดกรองของแต่ละห้องไม่เท่ากัน บางห้องยังไม่เริ่มเลย
      const progress = rnd();
      const screenedRatio = progress < 0.12 ? rnd() * 0.3 : 0.6 + rnd() * 0.4;

      let green = 0;
      let amber = 0;
      let red = 0;
      let screened = 0;
      let openCases = 0;

      for (let n = 1; n <= total; n++) {
        running += 1;
        const isScreened = rnd() < screenedRatio;
        let risk: Risk | null = null;

        if (isScreened) {
          screened += 1;
          const roll = rnd();
          risk = roll < 0.74 ? "green" : roll < 0.92 ? "amber" : "red";
          if (risk === "green") green += 1;
          else if (risk === "amber") amber += 1;
          else red += 1;
        }

        const hasCase = risk === "red" ? rnd() < 0.55 : risk === "amber" ? rnd() < 0.2 : false;
        if (hasCase) openCases += 1;

        students.push({
          id: String(30000 + running),
          name: `${rnd() < 0.5 ? "ด.ช." : "ด.ญ."} ${
            FIRST_NAMES[Math.floor(rnd() * FIRST_NAMES.length)]
          } ${LAST_NAMES[Math.floor(rnd() * LAST_NAMES.length)]}`,
          level,
          room,
          classNo: n,
          screened: isScreened,
          risk,
          hasCase,
          daysSinceFollowup: hasCase ? Math.floor(rnd() * 70) : null,
          sdqPending: risk === "red" || risk === "amber" ? Math.floor(rnd() * 4) : 0,
        });
      }

      rooms.push({
        room,
        level,
        teacher,
        total,
        screened,
        green,
        amber,
        red,
        openCases,
        overdue: screened < total * 0.9,
      });
    }
  }

  return { students, rooms };
}

const SCHOOL = buildSchool();

export const allStudents = SCHOOL.students;
export const allRooms = SCHOOL.rooms;

export type Scope = "school" | "room";

export const SCOPE_LABEL: Record<Scope, string> = {
  school: "ทั้งโรงเรียน (แอดมิน)",
  room: `เฉพาะ ${MY_ROOM} (ครูประจำชั้น)`,
};

export function studentsInScope(scope: Scope) {
  return scope === "school" ? allStudents : allStudents.filter((s) => s.room === MY_ROOM);
}

export function roomsInScope(scope: Scope) {
  return scope === "school" ? allRooms : allRooms.filter((r) => r.room === MY_ROOM);
}

export interface Totals {
  total: number;
  screened: number;
  green: number;
  amber: number;
  red: number;
  openCases: number;
  overdueRooms: number;
  redWithoutCase: number;
  staleCases: number;
  pendingSdq: number;
}

export function totalsOf(scope: Scope): Totals {
  const students = studentsInScope(scope);
  const rooms = roomsInScope(scope);
  return {
    total: students.length,
    screened: students.filter((s) => s.screened).length,
    green: students.filter((s) => s.risk === "green").length,
    amber: students.filter((s) => s.risk === "amber").length,
    red: students.filter((s) => s.risk === "red").length,
    openCases: students.filter((s) => s.hasCase).length,
    overdueRooms: rooms.filter((r) => r.overdue).length,
    redWithoutCase: students.filter((s) => s.risk === "red" && !s.hasCase).length,
    staleCases: students.filter((s) => s.hasCase && (s.daysSinceFollowup ?? 0) > 30).length,
    pendingSdq: students.reduce((sum, s) => sum + s.sdqPending, 0),
  };
}

export type TaskKind = "red_no_case" | "stale_case" | "sdq_pending" | "not_screened";

export const TASK_META: Record<TaskKind, { label: string; tone: "red" | "amber" | "blue" }> = {
  red_no_case: { label: "กลุ่มแดงยังไม่เปิดเคส", tone: "red" },
  stale_case: { label: "เคสไม่มีการติดตามเกิน 30 วัน", tone: "red" },
  sdq_pending: { label: "SDQ เปิดไว้แต่ยังไม่มีใครทำ", tone: "amber" },
  not_screened: { label: "ยังไม่ได้คัดกรอง", tone: "blue" },
};

export interface Task {
  student: ProtoStudent;
  kind: TaskKind;
  detail: string;
}

/** คิวงานที่ต้องจัดการ เรียงตามความเร่งด่วน */
export function tasksOf(scope: Scope): Task[] {
  const students = studentsInScope(scope);
  const tasks: Task[] = [];

  for (const s of students) {
    if (s.risk === "red" && !s.hasCase) {
      tasks.push({ student: s, kind: "red_no_case", detail: "คัดกรองพบกลุ่มแดงแต่ยังไม่มีแผนช่วยเหลือ" });
    } else if (s.hasCase && (s.daysSinceFollowup ?? 0) > 30) {
      tasks.push({
        student: s,
        kind: "stale_case",
        detail: `ติดตามครั้งล่าสุดเมื่อ ${s.daysSinceFollowup} วันก่อน`,
      });
    } else if (s.sdqPending > 0) {
      tasks.push({ student: s, kind: "sdq_pending", detail: `ค้างอยู่ ${s.sdqPending} ฉบับ` });
    } else if (!s.screened) {
      tasks.push({ student: s, kind: "not_screened", detail: "ยังไม่มีผลคัดกรองในภาคเรียนนี้" });
    }
  }

  const order: TaskKind[] = ["red_no_case", "stale_case", "sdq_pending", "not_screened"];
  return tasks.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
}
