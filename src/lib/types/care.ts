/**
 * การติดตามและช่วยเหลือนักเรียน (care case)
 * data_dictionary.md — care_cases, care_case_triggers, care_plans, care_followups, referral_documents
 *
 * - case ผูกกับนักเรียน ไม่ผูกกับครู มี case ที่เปิดอยู่ได้ครั้งละ 1 case ต่อนักเรียน
 * - 1 case มีได้หลายเหตุ (trigger) และหลายแผน (plan) ติดตามผล (follow-up) ผูกกับแผน
 * - การส่งต่อภายนอกไม่ทำให้ case ปิด
 */

/** 4 ประเภทการช่วยเหลือ ตามแนวทาง HERO OBEC CARE */
export type SupportType = "promote" | "prevent" | "refer_internal" | "refer_external";

export const SUPPORT_TYPE_LABEL: Record<SupportType, string> = {
  promote: "ส่งเสริมพัฒนา",
  prevent: "ป้องกันแก้ไข",
  refer_internal: "ส่งต่อภายใน",
  refer_external: "ส่งต่อภายนอก",
};

/** 5 วิธีการดูแล */
export type CareMethod =
  | "behavior_adjust"
  | "life_skills"
  | "counseling"
  | "guidance_teacher"
  | "school_psychologist";

export const CARE_METHOD_LABEL: Record<CareMethod, string> = {
  behavior_adjust: "ปรับพฤติกรรม",
  life_skills: "พัฒนาทักษะชีวิต",
  counseling: "ให้คำปรึกษาเด็ก / ผู้ปกครอง",
  guidance_teacher: "ปรึกษาครูแนะแนว",
  school_psychologist: "ปรึกษานักจิตวิทยาโรงเรียน",
};

/** แผนหนึ่งเลือกวิธีการดูแลได้ 1–5 วิธี */
export const CARE_METHODS_MIN = 1;
export const CARE_METHODS_MAX = 5;

/** ที่มาของเหตุเปิด case (care_case_triggers.source) */
export type CaseTriggerSource = "screening" | "red_flag" | "sdq" | "behavior" | "manual";

export const CASE_TRIGGER_SOURCE_LABEL: Record<CaseTriggerSource, string> = {
  screening: "ผลคัดกรอง 6 มิติ",
  red_flag: "แบบคัดกรอง Red Flag",
  sdq: "ผลประเมิน SDQ",
  behavior: "คะแนนความประพฤติ",
  manual: "ครูประจำชั้นเปิดเอง",
};

/**
 * auto = ระบบเปิด case ให้ (ผลรายมิติที่คำนวณได้ "มีปัญหา", Red Flag ควรดูแล, SDQ รวม "มีปัญหา")
 * suggest = ระบบแค่แนะนำ ครูเป็นผู้เปิด ("เสี่ยง", คะแนนความประพฤติต่ำกว่าเกณฑ์)
 */
export type TriggerMode = "auto" | "suggest";

/** care_case_triggers */
export interface CareCaseTrigger {
  triggerId: string;
  caseId: string;
  source: CaseTriggerSource;
  /** รหัส record ต้นเหตุ เช่น screeningId (null ได้เมื่อ manual) */
  sourceRefId: string | null;
  detectedAt: string;
  /** แผนที่รองรับเหตุนี้ (null = ยังไม่มีแผน → แจ้งครู) */
  planId: string | null;
  /** สรุปสั้นของเหตุ แสดงในหน้า case เท่านั้น (ไม่ส่งไปในการแจ้งเตือน) */
  summary?: string;
}

/** care_plans */
export interface CarePlan {
  planId: string;
  caseId: string;
  supportType: SupportType;
  careMethods: CareMethod[];
  goal: string;
  targetDate: string;
  /** userId ของครูประจำชั้นผู้จัดทำ */
  createdBy: string;
  createdAt: string;
}

/** care_followups — append-only: แก้ไขไม่ได้ เพิ่มบันทึกใหม่ได้อย่างเดียว */
export interface CareFollowup {
  followupId: string;
  caseId: string;
  planId: string;
  actionTaken: string;
  result: string;
  followupDate: string;
  /** userId ของผู้บันทึก */
  recordedBy: string;
}

/** referral_documents — สร้างได้เมื่อ guardian_consents ของปีนั้น granted = true */
export interface ReferralDocument {
  referralId: string;
  caseId: string;
  externalAgency: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export type CaseCloseReason = "resolved" | "transferred" | "graduated";

export const CASE_CLOSE_REASON_LABEL: Record<CaseCloseReason, string> = {
  resolved: "ช่วยเหลือสำเร็จ",
  transferred: "นักเรียนย้ายออก",
  graduated: "นักเรียนจบการศึกษา",
};

/** care_cases (ข้อมูลลูกเก็บซ้อนในต้นแบบเพื่อความง่าย แต่ละรายการมี caseId ตามตาราง) */
export interface CareCase {
  caseId: string;
  studentId: string;
  /** userId ของครูผู้เปิด (null = ระบบเปิดอัตโนมัติ) */
  openedBy: string | null;
  status: "active" | "closed";
  openedAt: string;
  /** userId ของครูประจำชั้นผู้ปิด (null = ระบบปิดเมื่อนักเรียนย้ายออก/จบ หรือยังไม่ปิด) */
  closedBy: string | null;
  closeReason: CaseCloseReason | null;
  closedAt: string | null;
  triggers: CareCaseTrigger[];
  plans: CarePlan[];
  /** ใหม่สุดก่อน */
  followups: CareFollowup[];
  referrals: ReferralDocument[];
}

/**
 * คำแนะนำให้เปิด case (เหตุแบบ suggest ของนักเรียนที่ยังไม่มี case เปิดอยู่)
 * ไม่ใช่ตารางในพจนานุกรมข้อมูล — ต้นแบบเก็บไว้เพื่อแสดงแถบแนะนำ
 * ส่วนคำแนะนำจากคะแนนความประพฤติคำนวณสดจากคะแนน (id ขึ้นต้นด้วย "SUG-BH-")
 */
export interface CaseSuggestion {
  suggestionId: string;
  studentId: string;
  source: Exclude<CaseTriggerSource, "manual">;
  sourceRefId: string | null;
  detectedAt: string;
  summary?: string;
  status: "pending" | "accepted" | "dismissed";
}
