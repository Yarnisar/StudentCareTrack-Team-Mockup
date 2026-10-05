/** การติดตามและช่วยเหลือนักเรียน (care case) */

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

export interface CareFollowup {
  followupId: string;
  actionTaken: string;
  result: string;
  followupDate: string;
  /** userId ของผู้บันทึก */
  recordedBy: string;
}

export interface CareCase {
  caseId: string;
  studentId: string;
  triggerSource: string;
  status: "active" | "closed";
  openedAt: string;
  closedAt: string | null;
  supportType: SupportType;
  careMethods: CareMethod[];
  goal: string;
  targetDate: string;
  followups: CareFollowup[];
}
