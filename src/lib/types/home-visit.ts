/** การเยี่ยมบ้าน */

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "reschedule_requested"
  | "completed"
  | "cancelled";

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "รอการยืนยัน",
  confirmed: "ยืนยันแล้ว",
  reschedule_requested: "ขอเปลี่ยนวันเวลา",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

/** annual = เยี่ยมบ้านประจำปี (ทุกคน ปีการศึกษาละ 1 ครั้ง) · follow_up = เยี่ยมเพิ่ม (ไม่บังคับ) */
export type VisitType = "annual" | "follow_up";

export const VISIT_TYPE_LABEL: Record<VisitType, string> = {
  annual: "เยี่ยมบ้านประจำปี",
  follow_up: "เยี่ยมเพิ่ม",
};

export interface HomeVisitAppointment {
  appointmentId: string;
  studentId: string;
  /** userId ของครูประจำชั้นผู้สร้างนัดหมาย */
  teacherId: string;
  academicYear: number;
  visitType: VisitType;
  /** case ที่เป็นเหตุให้เยี่ยมเพิ่ม (อ้างอิงด้วยรหัสเท่านั้น) */
  caseId: string | null;
  proposedDate: string;
  status: AppointmentStatus;
  /** เหตุผลการยกเลิกนัด (บังคับเมื่อ status = cancelled) */
  cancelReason?: string;
  guardianNote?: string;
  guardianPhone?: string;
  /** ผู้ปกครองแจ้งล่วงหน้า: เมื่อผู้ปกครองไม่อยู่บ้าน นักเรียนอยู่กับใคร (ข้อมูลประกอบเท่านั้น) */
  awayStayWith?: string;
}

export type IncomeKey = "wage" | "agriculture" | "business" | "welfare" | "other";

/** สมาชิกครัวเรือน 1 คน (home_visit_household_members) */
export interface HouseholdMember {
  id: string;
  relation: string;
  age: number | "";
  disability: boolean;
  income: Record<IncomeKey, number>;
}

/**
 * คำตอบในแบบบันทึกการเยี่ยมบ้าน (household_status / family_relationship / risk_notes ฯลฯ)
 * ค่าในรายการเป็นรหัสตัวเลือกจาก lib/home-visit-form.ts
 */
export interface HomeVisitForm {
  guardianOccupation: string;
  guardianEducation: string;
  members: HouseholdMember[];
  dependencies: string[];
  housingType: string;
  housingConditions: string[];
  vehicles: Record<string, boolean | undefined>;
  farmland: string;
  hoursTogether: string;
  relations: Record<string, string>;
  caretakerWhenAway: string;
  supportRequests: string[];
  welfareReceived: string[];
  guardianConcern: string;
  healthRisks: string[];
  welfareRisks: string[];
  travelKm: string;
  travelHours: string;
  travelMinutes: string;
  travelMode: string;
  duties: string[];
  hobbies: string[];
  substances: string[];
  violence: string[];
  sexual: string[];
  gaming: string[];
  internet: string;
  devices: string[];
}

export type HomeVisitPhotoType = "exterior" | "interior" | "with_signboard";

export const PHOTO_TYPE_LABEL: Record<HomeVisitPhotoType, string> = {
  exterior: "ภาพสภาพบ้านนักเรียน (มีหลังคาและฝาบ้าน)",
  interior: "ภาพภายในบ้านนักเรียน",
  with_signboard: "ภาพนักเรียนคู่ป้ายชื่อโรงเรียน",
};

export interface HomeVisitPhoto {
  photoId: string;
  photoType: HomeVisitPhotoType;
  fileUrl: string;
  uploadedAt: string;
}

/** ข้อมูลที่ครูกรอก (ร่างหรือส่งรับรอง) */
export interface HomeVisitRecordInput {
  form: HomeVisitForm;
  /** ผู้ที่นักเรียนอาศัยอยู่ด้วยจริง — ข้อมูลประกอบ ไม่เปลี่ยนสิทธิ์ผู้ปกครอง */
  livesWith: string;
  informantName: string;
  informantRelation: string;
  /** เข้าเยี่ยมที่บ้านไม่ได้จริง (ต้องมีเหตุผลและภาพคู่ป้ายโรงเรียน) */
  cannotAccessHome: boolean;
  cannotAccessReason: string;
  photos: HomeVisitPhoto[];
}

export interface HomeVisitRecord extends HomeVisitRecordInput {
  recordId: string;
  appointmentId: string;
  studentId: string;
  /** รายได้เฉลี่ยต่อคนต่อเดือน (คำนวณตอนบันทึก) */
  householdIncomeAvg: number;
  travelDistanceKm: number | null;
  /** userId ผู้บันทึกล่าสุด */
  recordedBy: string;
  updatedAt: string;
  /** userId ของครูผู้ไปเยี่ยมและลงนามรับรอง (คนเดียว) — null = ยังเป็นร่าง */
  signedBy: string | null;
  /** เวลารับรอง — หลังรับรองแล้วแก้ไขไม่ได้ · นับว่าเยี่ยมแล้วเมื่อมีค่านี้ */
  signedAt: string | null;
}

/** สถานะการเยี่ยมบ้านประจำปีของนักเรียน 1 คน */
export type AnnualVisitStatus = "visited" | "visited_inaccessible" | "draft" | "scheduled" | "none";

export const ANNUAL_VISIT_STATUS_LABEL: Record<AnnualVisitStatus, string> = {
  visited: "เยี่ยมแล้ว",
  visited_inaccessible: "เยี่ยมแล้ว (เข้าบ้านไม่ได้)",
  draft: "บันทึกร่างไว้",
  scheduled: "นัดหมายแล้ว",
  none: "ยังไม่ได้นัด",
};
