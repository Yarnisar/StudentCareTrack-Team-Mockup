/**
 * PROTOTYPE ONLY — ข้อมูลจำลองขนาดโรงเรียนจริง สำหรับภาพรวมของแอดมินเท่านั้น
 *
 * ข้อมูลตัวอย่างจริงในระบบมีนักเรียนแค่ 8 คนห้องเดียว ซึ่งน้อยเกินกว่าจะเห็นปัญหาของมุมมองทั้งโรงเรียน
 * ไฟล์นี้จึงสร้างนักเรียน ~1,500 คนตามสมมติฐานโรงเรียนขนาดกลาง สุ่มแบบมีเมล็ดคงที่ ตัวเลขจึงเท่าเดิมทุกครั้ง
 * ไม่เชื่อมกับ store — ทำงานในหน้าอื่นแล้วตัวเลขตรงนี้ไม่เปลี่ยน (หน้าจอบอกผู้ใช้ไว้)
 * Project 2: แทนด้วย API สรุปรายห้องจาก backend
 */

export const LEVELS = [1, 2, 3, 4, 5, 6];
/** เป้าความคืบหน้าการคัดกรอง ใช้ไปก่อนจนกว่าจะมีวันปิดรอบจาก UC8 */
export const SCREENING_TARGET = 0.9;
/** case ที่ไม่มีการติดตามนานกว่านี้ถือว่าค้าง — PROTOTYPE: ยังไม่ได้ตกลงกับทีม */
export const STALE_CASE_DAYS = 30;
export const ROOMS_PER_LEVEL = 8;

/** ห้องของครูประจำชั้นในข้อมูลตัวอย่าง (ชื่อครูให้ตรงกับบัญชี demo) */
const MY_ROOM = "ม.3/1";

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
  /** คัดกรองไม่ถึง 90% — ยังไม่ใช่ "เลยกำหนด" เพราะยังไม่มีระบบช่วงเวลา (UC8) */
  lowProgress: boolean;
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
        lowProgress: screened < total * SCREENING_TARGET,
      });
    }
  }

  return { students, rooms };
}

const SCHOOL = buildSchool();

export const allStudents = SCHOOL.students;
export const allRooms = SCHOOL.rooms;

export interface Totals {
  total: number;
  screened: number;
  green: number;
  amber: number;
  red: number;
  openCases: number;
  lowProgressRooms: number;
}

export function schoolTotals(): Totals {
  return {
    total: allStudents.length,
    screened: allStudents.filter((s) => s.screened).length,
    green: allStudents.filter((s) => s.risk === "green").length,
    amber: allStudents.filter((s) => s.risk === "amber").length,
    red: allStudents.filter((s) => s.risk === "red").length,
    openCases: allStudents.filter((s) => s.hasCase).length,
    lowProgressRooms: allRooms.filter((r) => r.lowProgress).length,
  };
}

/** ห้องที่แอดมินควรติดตาม — แอดมินตามเป็นรายห้องหรือรายครู ไม่ได้ตามนักเรียนทีละคน */
export interface RoomIssue {
  room: RoomSummary;
  /** กลุ่มมีปัญหาที่ยังไม่มี case */
  problemNoCase: number;
  /** case ที่ไม่มีการติดตามเกิน STALE_CASE_DAYS วัน */
  staleCases: number;
}

export function roomIssues(): RoomIssue[] {
  return allRooms
    .map((room) => {
      const own = allStudents.filter((s) => s.room === room.room);
      return {
        room,
        problemNoCase: own.filter((s) => s.risk === "red" && !s.hasCase).length,
        staleCases: own.filter((s) => s.hasCase && (s.daysSinceFollowup ?? 0) > STALE_CASE_DAYS).length,
      };
    })
    .filter((i) => i.problemNoCase > 0 || i.staleCases > 0 || i.room.lowProgress)
    // เรื่องของนักเรียนที่มีปัญหาก่อน แล้วจึงความคืบหน้าการคัดกรอง
    .sort(
      (a, b) =>
        b.problemNoCase - a.problemNoCase ||
        b.staleCases - a.staleCases ||
        a.room.screened / a.room.total - b.room.screened / b.room.total
    );
}
