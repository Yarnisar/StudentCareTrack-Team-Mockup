/**
 * ตัวตรวจและตัวเขียนของการนำเข้า (ADR-0005, โหมดเดี่ยว) — ฟังก์ชันล้วน ไม่แตะ state
 *
 * planImport  = ตรวจ (preview): ไม่เขียนอะไร คืนผลรายแถวและจำนวน
 * applyPlan   = เขียน (หลังยืนยัน): คืนตารางอ้างอิงชุดใหม่ + บัญชีที่สร้าง (พร้อมรหัสผ่านชั่วคราวครั้งเดียว)
 *
 * คีย์นำเข้าซ้ำ: นักเรียน = เลขประจำตัว · ห้อง = ชื่อห้อง + ปีการศึกษา · ผู้ปกครอง = เลขบัตรประชาชน (เชื่อมนักเรียนด้วยเลขประจำตัว)
 * · ครู = รหัสบุคลากร · ภาคเรียน = ปี + ภาคเรียน ไม่ลบแถวใด การย้ายออก/จบการศึกษา/ปิดบัญชีเป็นค่าสถานะ
 */

import {
  STUDENT_STATUS_LABEL,
  type AcademicTerm,
  type Classroom,
  type ImportKind,
  type Student,
  type StudentEnrollment,
  type StudentGuardian,
  type StudentStatus,
  type User,
} from "../types";
import type { CsvTable } from "./csv";
import { COL, IMPORT_TEMPLATES } from "./templates";

/** ตารางอ้างอิงที่การนำเข้าอ่าน/เขียน */
export interface RefSnapshot {
  students: Student[];
  users: User[];
  classrooms: Classroom[];
  guardians: StudentGuardian[];
  enrollments: StudentEnrollment[];
  terms: AcademicTerm[];
  /** ปีการศึกษาปัจจุบัน (ห้องที่ไม่ระบุปีถือเป็นปีนี้) */
  currentYear: number;
}

export type RowAction = "create" | "update" | "unchanged" | "invalid";

type Effect =
  | { kind: "student"; student: Student; isNew: boolean; prevStatus: StudentStatus | null }
  | { kind: "classroom"; roomName: string; gradeLevel: string; academicYear: number; existingRoomId: string | null }
  | {
      kind: "guardian";
      citizenId: string;
      name: string;
      phone: string | null;
      email: string | null;
      studentId: string;
      relation: string;
    }
  | { kind: "staff"; code: string; name: string; position: string; email: string | null; isActive: boolean | null; existingUserId: string | null }
  | { kind: "term"; term: AcademicTerm };

export interface PlannedRow {
  /** เลขบรรทัดในไฟล์ (หัวตาราง = 1) */
  line: number;
  /** ข้อความสั้นบอกว่าแถวนี้คืออะไร (ไม่มีเลขบัตรเต็ม) */
  label: string;
  action: RowAction;
  /** เหตุผลภาษาไทย (ผิด = สิ่งที่ต้องแก้, ไม่เปลี่ยน = บอกว่าเหมือนเดิม) */
  reasons: string[];
  effect: Effect | null;
}

export interface ImportCounts {
  total: number;
  create: number;
  update: number;
  unchanged: number;
  invalid: number;
}

export interface ImportPlan {
  kind: ImportKind;
  rows: PlannedRow[];
  counts: ImportCounts;
  /** ไฟล์ใช้ไม่ได้ทั้งไฟล์ (เช่น ขาดคอลัมน์) */
  fileError: string | null;
}

/** บัญชีที่สร้างใหม่ — tempPassword แสดงในผลครั้งเดียว ห้องเก็บลง state/audit */
export interface NewAccount {
  userId: string;
  name: string;
  username: string;
  roleLabel: string;
  tempPassword: string | null;
}

export interface AuditNote {
  entityType: "students" | "users";
  entityId: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}

export interface ApplyResult {
  next: RefSnapshot;
  accounts: NewAccount[];
  statusChanges: AuditNote[];
}

/* ------------------------------------------------------------------ */
/* ตัวช่วยตรวจ                                                           */
/* ------------------------------------------------------------------ */

export const GRADE_LEVELS = ["ป.1", "ป.2", "ป.3", "ป.4", "ป.5", "ป.6", "ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"];

const STATUS_BY_LABEL: Record<string, StudentStatus> = Object.fromEntries(
  (Object.entries(STUDENT_STATUS_LABEL) as [StudentStatus, string][]).map(([k, v]) => [v, k])
);

export const maskCitizenId = (id: string): string => {
  const digits = id.replace(/\D/g, "");
  return digits.length >= 4 ? `${"x".repeat(Math.max(digits.length - 4, 0))}${digits.slice(-4)}` : "xxxx";
};

const isThirteenDigits = (v: string) => /^\d{13}$/.test(v);
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const roomYear = (c: Classroom, currentYear: number) => c.academicYear ?? currentYear;

/** วันที่ พ.ศ. แบบ yyyy-mm-dd หรือ dd/mm/yyyy → yyyy-mm-dd หรือข้อความผิดพลาด */
export function parseThaiDateCell(value: string): { ok: true; date: string } | { ok: false; error: string } {
  let y: number, m: number, d: number;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else if (dmy) [d, m, y] = [Number(dmy[1]), Number(dmy[2]), Number(dmy[3])];
  else return { ok: false, error: `วันที่ไม่ถูกต้อง "${value}" (ใช้ ปปปป-ดด-วว แบบ พ.ศ.)` };
  if (y < 2400) return { ok: false, error: `ปี ${y} ไม่ใช่ พ.ศ.` };
  const gy = y - 543;
  const daysInMonth = new Date(gy, m, 0).getDate();
  if (m < 1 || m > 12 || d < 1 || d > daysInMonth) return { ok: false, error: `วันที่ไม่ถูกต้อง "${value}"` };
  const p = (n: number) => String(n).padStart(2, "0");
  return { ok: true, date: `${y}-${p(m)}-${p(d)}` };
}

/** ตัวอ่านเซลล์ตามชื่อคอลัมน์ */
function reader(table: CsvTable) {
  const index = new Map(table.header.map((h, i) => [h, i]));
  return (cells: string[], name: string): string => {
    const i = index.get(name);
    return i === undefined ? "" : (cells[i] ?? "").trim();
  };
}

const emptyPlan = (kind: ImportKind, fileError: string): ImportPlan => ({
  kind,
  rows: [],
  counts: { total: 0, create: 0, update: 0, unchanged: 0, invalid: 0 },
  fileError,
});

/* ------------------------------------------------------------------ */
/* ตรวจ                                                                  */
/* ------------------------------------------------------------------ */

export function planImport(kind: ImportKind, table: CsvTable, ref: RefSnapshot): ImportPlan {
  const missing = IMPORT_TEMPLATES[kind].columns.filter((c) => c.required && !table.header.includes(c.name)).map((c) => c.name);
  if (table.header.length === 0) return emptyPlan(kind, "ไฟล์ว่าง");
  if (missing.length > 0) return emptyPlan(kind, `ไม่พบคอลัมน์ ${missing.join(", ")} — ใช้แม่แบบจากปุ่มดาวน์โหลด`);
  if (table.rows.length === 0) return emptyPlan(kind, "ไม่มีแถวข้อมูล");
  if (table.rows.length > 5000) return emptyPlan(kind, "ไฟล์ใหญ่เกิน 5,000 แถว — แบ่งไฟล์แล้วนำเข้าทีละส่วน");

  const get = reader(table);
  const rows =
    kind === "students"
      ? planStudents(table, get, ref)
      : kind === "classrooms"
        ? planClassrooms(table, get, ref)
        : kind === "guardians"
          ? planGuardians(table, get, ref)
          : kind === "staff"
            ? planStaff(table, get, ref)
            : planTerms(table, get, ref);

  const counts: ImportCounts = { total: rows.length, create: 0, update: 0, unchanged: 0, invalid: 0 };
  for (const r of rows) counts[r.action]++;
  return { kind, rows, counts, fileError: null };
}

type Get = ReturnType<typeof reader>;

const finish = (
  line: number,
  label: string,
  reasons: string[],
  effect: Effect,
  existing: boolean,
  changed: boolean
): PlannedRow => {
  if (reasons.length > 0) return { line, label, action: "invalid", reasons, effect: null };
  if (existing && !changed) return { line, label, action: "unchanged", reasons: ["ข้อมูลเหมือนเดิม"], effect: null };
  return { line, label, action: existing ? "update" : "create", reasons: [], effect };
};

function planStudents(table: CsvTable, get: Get, ref: RefSnapshot): PlannedRow[] {
  const seenCode = new Map<string, number>();
  const seenCitizen = new Map<string, string>();
  const seenSeat = new Map<string, string>();
  const rooms = ref.classrooms.filter((c) => roomYear(c, ref.currentYear) === ref.currentYear);

  return table.rows.map(({ line, cells }) => {
    const code = get(cells, COL.studentCode);
    const existing = code ? ref.students.find((s) => s.studentId === code) : undefined;
    // นักเรียนที่มีอยู่แล้ว: ช่องที่เว้นว่างคือคงค่าเดิม (ส่งแค่เลขประจำตัว + สถานะก็ได้)
    const name = get(cells, COL.fullName) || existing?.fullName || "";
    const citizen = get(cells, COL.citizenId).replace(/[\s-]/g, "");
    const roomName = get(cells, COL.room) || existing?.roomName || "";
    const noText = get(cells, COL.classNo) || (existing ? String(existing.classNo) : "");
    const statusText = get(cells, COL.status);
    const address = get(cells, COL.address);
    const reasons: string[] = [];

    if (!code) reasons.push("ไม่มีเลขประจำตัวนักเรียน");
    else if (!/^[0-9A-Za-z]{3,15}$/.test(code)) reasons.push("เลขประจำตัวนักเรียนไม่ถูกต้อง");
    if (code) {
      const first = seenCode.get(code);
      if (first !== undefined) reasons.push(`เลขประจำตัวซ้ำกับบรรทัด ${first}`);
      else seenCode.set(code, line);
    }
    if (!name) reasons.push("ไม่มีชื่อ-สกุล");

    if (citizen) {
      if (!isThirteenDigits(citizen)) reasons.push("เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก");
      else {
        const other = ref.students.find((s) => s.citizenId === citizen && s.studentId !== code);
        const inFile = seenCitizen.get(citizen);
        if (other || (inFile && inFile !== code)) reasons.push("เลขบัตรประชาชนซ้ำกับนักเรียนอีกคน");
        seenCitizen.set(citizen, code);
      }
    } else if (!existing) reasons.push("นักเรียนใหม่ต้องมีเลขบัตรประชาชน");

    const room =
      existing && roomName === existing.roomName
        ? ref.classrooms.find((c) => c.roomId === existing.roomId)
        : roomName
          ? rooms.find((c) => c.roomName === roomName)
          : undefined;
    if (!roomName) reasons.push("ไม่มีห้อง");
    else if (!room) reasons.push(`ไม่พบห้อง ${roomName} ในปีการศึกษา ${ref.currentYear} (นำเข้าห้องเรียนก่อน)`);

    const classNo = Number(noText);
    if (!noText) reasons.push("ไม่มีเลขที่");
    else if (!Number.isInteger(classNo) || classNo < 1 || classNo > 99) reasons.push("เลขที่ต้องเป็น 1–99");

    let status: StudentStatus = existing?.status ?? "studying";
    if (statusText) {
      const mapped = STATUS_BY_LABEL[statusText];
      if (!mapped) reasons.push(`สถานะ "${statusText}" ไม่ถูกต้อง (กำลังศึกษา / ย้ายออก / จบการศึกษา)`);
      else status = mapped;
    }

    if (room && Number.isInteger(classNo) && classNo >= 1 && status === "studying") {
      const seat = `${room.roomId}#${classNo}`;
      const clash = ref.students.find(
        (s) => s.roomId === room.roomId && s.classNo === classNo && s.status === "studying" && s.studentId !== code
      );
      const inFile = seenSeat.get(seat);
      if (clash || (inFile && inFile !== code)) reasons.push(`เลขที่ ${classNo} ในห้อง ${roomName} มีคนอื่นแล้ว`);
      else seenSeat.set(seat, code);
    }

    const label = [code, name].filter(Boolean).join(" · ") || "(แถวว่าง)";
    if (reasons.length > 0 || !room) return { line, label, action: "invalid", reasons, effect: null };

    const student: Student = {
      studentId: code,
      fullName: name,
      citizenId: citizen || existing?.citizenId || "",
      roomId: room.roomId,
      roomName: room.roomName,
      gradeLevel: room.gradeLevel,
      classNo,
      status,
      address: address || existing?.address || "",
      sourceSystem: existing?.sourceSystem ?? "standalone_import",
    };
    const changed =
      !existing ||
      existing.fullName !== student.fullName ||
      existing.citizenId !== student.citizenId ||
      existing.roomId !== student.roomId ||
      existing.classNo !== student.classNo ||
      existing.status !== student.status ||
      existing.address !== student.address;
    const effect: Effect = { kind: "student", student, isNew: !existing, prevStatus: existing?.status ?? null };
    return finish(line, label, [], effect, !!existing, changed);
  });
}

function planClassrooms(table: CsvTable, get: Get, ref: RefSnapshot): PlannedRow[] {
  const seen = new Map<string, number>();
  return table.rows.map(({ line, cells }) => {
    const yearText = get(cells, COL.year);
    const grade = get(cells, COL.grade);
    const roomName = get(cells, COL.roomName);
    const reasons: string[] = [];

    const year = Number(yearText);
    if (!yearText) reasons.push("ไม่มีปีการศึกษา");
    else if (!Number.isInteger(year) || year < 2500 || year > 2700) reasons.push("ปีการศึกษาต้องเป็น พ.ศ. (เช่น 2569)");
    if (!grade) reasons.push("ไม่มีระดับชั้น");
    else if (!GRADE_LEVELS.includes(grade)) reasons.push(`ระดับชั้น "${grade}" ไม่อยู่ในช่วง ป.1–ม.6`);
    if (!roomName) reasons.push("ไม่มีชื่อห้อง");
    else if (GRADE_LEVELS.includes(grade) && !roomName.startsWith(`${grade}/`)) reasons.push(`ชื่อห้องต้องขึ้นต้นด้วย ${grade}/`);

    if (roomName && Number.isInteger(year)) {
      const key = `${roomName}#${year}`;
      const first = seen.get(key);
      if (first !== undefined) reasons.push(`ห้องและปีนี้ซ้ำกับบรรทัด ${first}`);
      else seen.set(key, line);
    }

    const label = [roomName, yearText && `ปี ${yearText}`].filter(Boolean).join(" · ") || "(แถวว่าง)";
    const existing = ref.classrooms.find((c) => c.roomName === roomName && roomYear(c, ref.currentYear) === year);
    const effect: Effect = { kind: "classroom", roomName, gradeLevel: grade, academicYear: year, existingRoomId: existing?.roomId ?? null };
    return finish(line, label, reasons, effect, !!existing, existing ? existing.gradeLevel !== grade : true);
  });
}

function planGuardians(table: CsvTable, get: Get, ref: RefSnapshot): PlannedRow[] {
  const nameOfCitizen = new Map<string, string>();
  const seenPair = new Map<string, number>();

  return table.rows.map(({ line, cells }) => {
    const citizen = get(cells, COL.guardianCitizenId).replace(/[\s-]/g, "");
    const name = get(cells, COL.fullName);
    const phone = get(cells, COL.phone);
    const email = get(cells, COL.email);
    const code = get(cells, COL.studentCode);
    const relation = get(cells, COL.relation);
    const reasons: string[] = [];

    if (!citizen) reasons.push("ไม่มีเลขบัตรประชาชนผู้ปกครอง");
    else if (!isThirteenDigits(citizen)) reasons.push("เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก");
    if (!name) reasons.push("ไม่มีชื่อ-สกุล");
    if (email && !isEmail(email)) reasons.push("รูปแบบอีเมลไม่ถูกต้อง");
    if (!code) reasons.push("ไม่มีเลขประจำตัวนักเรียน");
    else if (!ref.students.some((s) => s.studentId === code)) reasons.push(`ไม่พบนักเรียน ${code} (นำเข้านักเรียนก่อน)`);
    if (!relation) reasons.push("ไม่มีความสัมพันธ์");

    if (isThirteenDigits(citizen) && name) {
      const prev = nameOfCitizen.get(citizen);
      if (prev !== undefined && prev !== name) reasons.push("ชื่อไม่ตรงกับแถวก่อนหน้าของเลขบัตรเดียวกัน");
      else nameOfCitizen.set(citizen, name);
    }
    if (isThirteenDigits(citizen) && code) {
      const pair = `${citizen}#${code}`;
      const first = seenPair.get(pair);
      if (first !== undefined) reasons.push(`ผู้ปกครองกับนักเรียนคู่นี้ซ้ำกับบรรทัด ${first}`);
      else seenPair.set(pair, line);
    }

    const label = [name, citizen && maskCitizenId(citizen), code && `→ ${code}`].filter(Boolean).join(" · ") || "(แถวว่าง)";
    const user = ref.users.find((u) => u.role === "parent" && u.citizenId === citizen);
    const link = ref.guardians.find((g) => g.guardianUserId === user?.userId && g.studentId === code);
    const effect: Effect = { kind: "guardian", citizenId: citizen, name, phone: phone || null, email: email || null, studentId: code, relation };
    const changed =
      !user ||
      !link ||
      link.relation !== relation ||
      user.name !== name ||
      (phone !== "" && (user.phone ?? "") !== phone) ||
      (email !== "" && (user.email ?? "") !== email);
    // แถวแรกของผู้ปกครองใหม่สร้างบัญชี แถวต่อ ๆ ไปเพิ่มการเชื่อมนักเรียน — ทั้งคู่นับเป็น "สร้าง"
    return finish(line, label, reasons, effect, !!link, changed);
  });
}

function planStaff(table: CsvTable, get: Get, ref: RefSnapshot): PlannedRow[] {
  const seen = new Map<string, number>();
  return table.rows.map(({ line, cells }) => {
    const code = get(cells, COL.staffCode);
    const name = get(cells, COL.fullName);
    const position = get(cells, COL.position);
    const email = get(cells, COL.email);
    const statusText = get(cells, COL.status);
    const reasons: string[] = [];

    if (!code) reasons.push("ไม่มีรหัสบุคลากร");
    else {
      const first = seen.get(code);
      if (first !== undefined) reasons.push(`รหัสบุคลากรซ้ำกับบรรทัด ${first}`);
      else seen.set(code, line);
    }
    if (!name) reasons.push("ไม่มีชื่อ-สกุล");
    if (email && !isEmail(email)) reasons.push("รูปแบบอีเมลไม่ถูกต้อง");

    let isActive: boolean | null = null;
    if (statusText === "ใช้งาน") isActive = true;
    else if (statusText === "ไม่ใช้งาน") isActive = false;
    else if (statusText) reasons.push(`สถานะ "${statusText}" ไม่ถูกต้อง (ใช้งาน / ไม่ใช้งาน)`);

    const holder = code ? ref.users.find((u) => u.refId === code) : undefined;
    if (holder?.role === "admin_school") reasons.push("บัญชีผู้ดูแลระบบแก้จากการนำเข้าไม่ได้");
    else if (holder && holder.role !== "teacher_general" && holder.role !== "teacher_homeroom") reasons.push("รหัสนี้เป็นของบัญชีอื่น");

    const label = [code, name].filter(Boolean).join(" · ") || "(แถวว่าง)";
    const effect: Effect = { kind: "staff", code, name, position, email: email || null, isActive, existingUserId: holder?.userId ?? null };
    const changed =
      !holder ||
      holder.name !== name ||
      (position !== "" && (holder.title ?? "") !== position) ||
      (email !== "" && (holder.email ?? "") !== email) ||
      (isActive !== null && holder.isActive !== isActive);
    return finish(line, label, reasons, effect, !!holder, changed);
  });
}

function planTerms(table: CsvTable, get: Get, ref: RefSnapshot): PlannedRow[] {
  const seen = new Map<string, number>();
  return table.rows.map(({ line, cells }) => {
    const yearText = get(cells, COL.year);
    const semText = get(cells, COL.semester);
    const startText = get(cells, COL.startDate);
    const endText = get(cells, COL.endDate);
    const reasons: string[] = [];

    const year = Number(yearText);
    if (!Number.isInteger(year) || year < 2500 || year > 2700) reasons.push("ปีการศึกษาต้องเป็น พ.ศ. (เช่น 2569)");
    const semester = Number(semText);
    if (semester !== 1 && semester !== 2) reasons.push("ภาคเรียนต้องเป็น 1 หรือ 2");

    const start = parseThaiDateCell(startText);
    const end = parseThaiDateCell(endText);
    if (!start.ok) reasons.push(`วันเริ่ม: ${start.error}`);
    if (!end.ok) reasons.push(`วันสิ้นสุด: ${end.error}`);
    if (start.ok && end.ok && start.date >= end.date) reasons.push("วันสิ้นสุดต้องอยู่หลังวันเริ่ม");

    const termId = `T${yearText}-${semText}`;
    if (reasons.length === 0) {
      const first = seen.get(termId);
      if (first !== undefined) reasons.push(`ภาคเรียนนี้ซ้ำกับบรรทัด ${first}`);
      else seen.set(termId, line);
    }

    const label = `ภาคเรียนที่ ${semText || "?"} ปี ${yearText || "?"}`;
    const term: AcademicTerm = {
      termId,
      academicYear: year,
      semester: semester === 2 ? 2 : 1,
      startDate: start.ok ? start.date : "",
      endDate: end.ok ? end.date : "",
      label: `ภาคเรียนที่ ${semText} ปีการศึกษา ${yearText}`,
    };
    const existing = ref.terms.find((t) => t.termId === termId);
    const changed = !existing || existing.startDate !== term.startDate || existing.endDate !== term.endDate;
    return finish(line, label, reasons, { kind: "term", term }, !!existing, changed);
  });
}

/* ------------------------------------------------------------------ */
/* เขียน                                                                 */
/* ------------------------------------------------------------------ */

const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/** รหัสผ่านชั่วคราว 10 ตัว (ไม่มีตัวที่สับสนง่าย) — ใช้ crypto ของเบราว์เซอร์ */
export function generateTempPassword(): string {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => PASSWORD_ALPHABET[b % PASSWORD_ALPHABET.length]).join("");
}

export interface IdFactory {
  /** รหัสห้องเรียนใหม่ */
  roomId: () => string;
  /** รหัสผู้ปกครองใหม่ (ใช้ทำทั้ง userId และ username) */
  guardianSeq: () => number;
}

/** เขียนเฉพาะแถวที่ผ่านของแผนลงตารางอ้างอิงชุดใหม่ (ไม่ลบแถวใด) */
export function applyPlan(plan: ImportPlan, ref: RefSnapshot, ids: IdFactory): ApplyResult {
  let students = ref.students;
  let users = ref.users;
  let classrooms = ref.classrooms;
  let guardians = ref.guardians;
  let enrollments = ref.enrollments;
  let terms = ref.terms;
  const accounts: NewAccount[] = [];
  const statusChanges: AuditNote[] = [];

  const upsertUser = (user: User) => {
    users = users.some((u) => u.userId === user.userId) ? users.map((u) => (u.userId === user.userId ? user : u)) : [...users, user];
  };
  const newAccount = (user: User, roleLabel: string, withPassword: boolean) => {
    accounts.push({
      userId: user.userId,
      name: user.name,
      username: user.username,
      roleLabel,
      tempPassword: withPassword ? generateTempPassword() : null,
    });
  };

  for (const row of plan.rows) {
    const e = row.effect;
    if (!e || (row.action !== "create" && row.action !== "update")) continue;

    if (e.kind === "student") {
      const s = e.student;
      students = e.isNew ? [...students, s] : students.map((x) => (x.studentId === s.studentId ? s : x));
      const year = classrooms.find((c) => c.roomId === s.roomId);
      const enrollYear = year ? roomYear(year, ref.currentYear) : ref.currentYear;
      enrollments = [
        ...enrollments.filter((en) => !(en.studentId === s.studentId && en.academicYear === enrollYear)),
        { studentId: s.studentId, roomId: s.roomId, academicYear: enrollYear },
      ];
      const userId = `U-S${s.studentId}`;
      const existingUser = users.find((u) => u.userId === userId);
      const studentUser: User = {
        userId,
        username: existingUser?.username ?? s.studentId,
        role: "student",
        refId: s.studentId,
        name: s.fullName,
        title: `นักเรียน ${s.roomName}`,
        email: existingUser?.email ?? null,
        isActive: s.status === "studying",
        mustChangePassword: existingUser ? existingUser.mustChangePassword : true,
      };
      upsertUser(studentUser);
      if (!existingUser) newAccount(studentUser, "นักเรียน", true);
      if (!e.isNew && e.prevStatus !== null && e.prevStatus !== s.status) {
        statusChanges.push({
          entityType: "students",
          entityId: s.studentId,
          before: { status: e.prevStatus },
          after: { status: s.status },
        });
      }
    } else if (e.kind === "classroom") {
      if (e.existingRoomId) {
        classrooms = classrooms.map((c) => (c.roomId === e.existingRoomId ? { ...c, gradeLevel: e.gradeLevel } : c));
        students = students.map((s) => (s.roomId === e.existingRoomId ? { ...s, gradeLevel: e.gradeLevel } : s));
      } else {
        classrooms = [...classrooms, { roomId: ids.roomId(), gradeLevel: e.gradeLevel, roomName: e.roomName, academicYear: e.academicYear }];
      }
    } else if (e.kind === "guardian") {
      let user = users.find((u) => u.role === "parent" && u.citizenId === e.citizenId);
      if (!user) {
        const seq = ids.guardianSeq();
        user = {
          userId: `U-G${seq}`,
          username: `g${seq}`,
          role: "parent",
          refId: null,
          name: e.name,
          title: "ผู้ปกครอง",
          email: e.email,
          phone: e.phone,
          isActive: true,
          citizenId: e.citizenId,
          mustChangePassword: true,
        };
        upsertUser(user);
        newAccount(user, "ผู้ปกครอง", true);
      } else if (
        user.name !== e.name ||
        (e.phone !== null && user.phone !== e.phone) ||
        (e.email !== null && user.email !== e.email)
      ) {
        user = { ...user, name: e.name, phone: e.phone ?? user.phone, email: e.email ?? user.email };
        upsertUser(user);
      }
      const uid = user.userId;
      const has = guardians.some((g) => g.guardianUserId === uid && g.studentId === e.studentId);
      guardians = has
        ? guardians.map((g) => (g.guardianUserId === uid && g.studentId === e.studentId ? { ...g, relation: e.relation } : g))
        : [...guardians, { studentId: e.studentId, guardianUserId: uid, relation: e.relation }];
    } else if (e.kind === "staff") {
      const existing = e.existingUserId ? users.find((u) => u.userId === e.existingUserId) : undefined;
      if (existing) {
        const nextActive = e.isActive ?? existing.isActive;
        const updated: User = {
          ...existing,
          name: e.name,
          title: e.position || existing.title,
          email: e.email ?? existing.email,
          isActive: nextActive,
        };
        upsertUser(updated);
        if (existing.isActive !== nextActive) {
          statusChanges.push({
            entityType: "users",
            entityId: existing.userId,
            before: { isActive: existing.isActive },
            after: { isActive: nextActive },
          });
        }
      } else {
        const active = e.isActive ?? true;
        const user: User = {
          userId: users.some((u) => u.userId === `U-STAFF-${e.code}`) ? `U-STAFF-${e.code}-${ids.guardianSeq()}` : `U-STAFF-${e.code}`,
          username: e.code.toLowerCase(),
          // ครูใหม่เริ่มเป็นครูทั่วไป — core คำนวณบทบาทจากการมอบหมาย (ADR-0003)
          role: "teacher_general",
          refId: e.code,
          name: e.name,
          title: e.position || "ครู",
          email: e.email,
          isActive: active,
          mustChangePassword: true,
        };
        upsertUser(user);
        newAccount(user, "ครู", active);
      }
    } else if (e.kind === "term") {
      terms = terms.some((t) => t.termId === e.term.termId)
        ? terms.map((t) => (t.termId === e.term.termId ? { ...t, ...e.term } : t))
        : [...terms, e.term].sort((a, b) => a.termId.localeCompare(b.termId));
    }
  }

  return { next: { ...ref, students, users, classrooms, guardians, enrollments, terms }, accounts, statusChanges };
}
