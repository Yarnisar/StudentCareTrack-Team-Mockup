/** แม่แบบไฟล์นำเข้า (หัวตารางภาษาไทย + 1 แถวตัวอย่าง) และไฟล์ตัวอย่างสำหรับสาธิต */

import type { ImportKind } from "../types";
import { toCsv } from "./csv";

export interface ImportColumn {
  name: string;
  /** ต้องมีคอลัมน์นี้ในไฟล์ */
  required: boolean;
}

export type SampleVariant = "ok" | "mixed";

export interface ImportTemplate {
  columns: ImportColumn[];
  filename: string;
  example: string[];
  /** ไฟล์ตัวอย่าง: ok = ผ่านทุกแถว, mixed = มีแถวที่ผิดปนอยู่ */
  samples: Record<SampleVariant, string[][]>;
}

const col = (name: string, required = true): ImportColumn => ({ name, required });

/** ชื่อคอลัมน์ที่ใช้ร่วมกันระหว่างแม่แบบกับตัวตรวจ */
export const COL = {
  studentCode: "เลขประจำตัวนักเรียน",
  fullName: "ชื่อ-สกุล",
  citizenId: "เลขบัตรประชาชน",
  room: "ห้อง",
  classNo: "เลขที่",
  status: "สถานะ",
  address: "ที่อยู่",
  year: "ปีการศึกษา",
  grade: "ระดับชั้น",
  roomName: "ชื่อห้อง",
  guardianCitizenId: "เลขบัตรประชาชนผู้ปกครอง",
  phone: "เบอร์โทร",
  email: "อีเมล",
  relation: "ความสัมพันธ์",
  staffCode: "รหัสบุคลากร",
  position: "ตำแหน่ง",
  semester: "ภาคเรียน",
  startDate: "วันเริ่ม",
  endDate: "วันสิ้นสุด",
} as const;

const studentHeader = [COL.studentCode, COL.fullName, COL.citizenId, COL.room, COL.classNo, COL.status, COL.address];
const guardianHeader = [COL.guardianCitizenId, COL.fullName, COL.phone, COL.email, COL.studentCode, COL.relation];
const staffHeader = [COL.staffCode, COL.fullName, COL.position, COL.email, COL.status];
const termHeader = [COL.year, COL.semester, COL.startDate, COL.endDate];
const classroomHeader = [COL.year, COL.grade, COL.roomName];

export const IMPORT_TEMPLATES: Record<ImportKind, ImportTemplate> = {
  students: {
    columns: [
      col(COL.studentCode),
      col(COL.fullName),
      col(COL.citizenId, false),
      col(COL.room),
      col(COL.classNo),
      col(COL.status, false),
      col(COL.address, false),
    ],
    filename: "แม่แบบ-นักเรียน.csv",
    example: ["30301", "ด.ช. ธนา รักเรียน", "1100200300011", "ม.3/1", "39", "กำลังศึกษา", "10 ซ.สุขใจ ต.บางพลี อ.บางพลี จ.สมุทรปราการ"],
    samples: {
      ok: [
        studentHeader,
        ["30301", "ด.ช. ธนา รักเรียน", "1100200300011", "ม.3/1", "39", "กำลังศึกษา", "10 ซ.สุขใจ ต.บางพลี อ.บางพลี จ.สมุทรปราการ"],
        ["30302", "ด.ญ. นภัส ใจงาม", "1100200300029", "ม.3/2", "1", "กำลังศึกษา", "12 ซ.สุขใจ ต.บางพลี อ.บางพลี จ.สมุทรปราการ"],
        ["30303", "ด.ช. ปกรณ์ ศรีสุข", "1100200300037", "ม.3/1", "40", "", ""],
        ["30152", "ด.ช. กิตติ ขยันดี", "", "ม.3/1", "30", "กำลังศึกษา", "23/4 ซ.ใหม่ ต.บางพลี อ.เมือง จ.สมุทรปราการ"],
      ],
      mixed: [
        studentHeader,
        ["30301", "ด.ช. ธนา รักเรียน", "1100200300011", "ม.3/1", "39", "กำลังศึกษา", ""],
        ["30303", "ด.ช. ปกรณ์ ศรีสุข", "1100200300037", "ม.3/1", "40", "", ""],
        ["30304", "", "1100200300045", "ม.3/1", "41", "", ""],
        ["30305", "ด.ญ. พิมพ์ชนก แสนดี", "1100200300052", "ม.9/9", "1", "", ""],
        ["30301", "ด.ช. ธนา รักเรียน (ซ้ำ)", "1100200300011", "ม.3/1", "42", "", ""],
        ["30306", "ด.ช. วีรภัทร มีสุข", "12345", "ม.3/2", "2", "ลาออก", ""],
        ["30118", "", "", "", "", "จบการศึกษา", ""],
      ],
    },
  },
  classrooms: {
    columns: [col(COL.year), col(COL.grade), col(COL.roomName)],
    filename: "แม่แบบ-ห้องเรียน.csv",
    example: ["2569", "ม.3", "ม.3/3"],
    samples: {
      ok: [classroomHeader, ["2569", "ม.3", "ม.3/3"], ["2569", "ม.2", "ม.2/2"], ["2569", "ม.3", "ม.3/1"]],
      mixed: [
        classroomHeader,
        ["2569", "ม.3", "ม.3/3"],
        ["2569", "ม.7", "ม.7/1"],
        ["2569", "ม.3", "ม.4/1"],
        ["", "ม.1", "ม.1/1"],
        ["2569", "ม.3", "ม.3/3"],
      ],
    },
  },
  guardians: {
    columns: [col(COL.guardianCitizenId), col(COL.fullName), col(COL.phone, false), col(COL.email, false), col(COL.studentCode), col(COL.relation)],
    filename: "แม่แบบ-ผู้ปกครอง.csv",
    example: ["1100200400011", "นางสุดา รักเรียน", "081-000-0001", "suda@mail.example", "30140", "มารดา"],
    samples: {
      ok: [
        guardianHeader,
        ["1100200400011", "นางสุดา รักเรียน", "081-000-0001", "suda@mail.example", "30140", "มารดา"],
        ["1100200400011", "นางสุดา รักเรียน", "081-000-0001", "suda@mail.example", "30152", "มารดา"],
        ["1100200400029", "นายสมบัติ รักเรียน", "081-000-0002", "", "30140", "บิดา"],
      ],
      mixed: [
        guardianHeader,
        ["1100200400011", "นางสุดา รักเรียน", "081-000-0001", "suda@mail.example", "30140", "มารดา"],
        ["1100200400011", "นางสุดา รักเรียน", "081-000-0001", "suda@mail.example", "30140", "มารดา"],
        ["1100200400037", "นายวิทยา ใจดี", "081-000-0003", "", "39999", "บิดา"],
        ["12345", "นางมาลัย สุขใจ", "", "", "30152", "ป้า"],
        ["1100200400045", "นางสมใจ มั่นคง", "", "ไม่ใช่อีเมล", "30152", ""],
      ],
    },
  },
  staff: {
    columns: [col(COL.staffCode), col(COL.fullName), col(COL.position, false), col(COL.email, false), col(COL.status, false)],
    filename: "แม่แบบ-ครู.csv",
    example: ["S-14", "ครูนิรันดร์ ทองดี", "ครูชำนาญการ", "niran.t@school.example", "ใช้งาน"],
    samples: {
      ok: [
        staffHeader,
        ["S-14", "ครูนิรันดร์ ทองดี", "ครูชำนาญการ", "niran.t@school.example", "ใช้งาน"],
        ["S-15", "ครูวรรณา ใจเย็น", "ครู", "", "ใช้งาน"],
        ["S-13", "ครูกมล พัฒนา", "ครูผู้ช่วย", "", "ใช้งาน"],
      ],
      mixed: [
        staffHeader,
        ["S-14", "ครูนิรันดร์ ทองดี", "ครูชำนาญการ", "niran.t@school.example", "ใช้งาน"],
        ["S-15", "ครูวรรณา ใจเย็น", "ครู", "", "ไม่ใช้งาน"],
        ["S-16", "", "ครู", "", ""],
        ["S-A1", "นางสาวกนกพร ธุรการ", "แอดมิน", "", "ไม่ใช้งาน"],
        ["S-17", "ครูสุนิสา พูนสุข", "ครู", "ไม่ใช่อีเมล", ""],
        ["S-14", "ครูนิรันดร์ ทองดี", "ครู", "", ""],
      ],
    },
  },
  terms: {
    columns: [col(COL.year), col(COL.semester), col(COL.startDate), col(COL.endDate)],
    filename: "แม่แบบ-ภาคเรียน.csv",
    example: ["2570", "1", "2570-05-16", "2570-10-10"],
    samples: {
      ok: [
        termHeader,
        ["2570", "1", "2570-05-16", "2570-10-10"],
        ["2570", "2", "2570-11-01", "2571-03-31"],
        ["2568", "2", "2568-11-01", "2569-03-30"],
      ],
      mixed: [
        termHeader,
        ["2570", "1", "2570-05-16", "2570-10-10"],
        ["2570", "3", "2570-11-01", "2571-03-31"],
        ["2571", "1", "2571-02-30", "2571-10-10"],
        ["2571", "2", "2571-11-01", "2571-05-01"],
        ["2027", "1", "2027-05-16", "2027-10-10"],
        ["2570", "1", "2570-05-17", "2570-10-11"],
      ],
    },
  },
};

export const templateCsv = (kind: ImportKind): string =>
  toCsv([IMPORT_TEMPLATES[kind].columns.map((c) => c.name), IMPORT_TEMPLATES[kind].example]);

export const sampleCsv = (kind: ImportKind, variant: SampleVariant): string => toCsv(IMPORT_TEMPLATES[kind].samples[variant]);
