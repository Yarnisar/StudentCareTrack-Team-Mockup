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

export interface HouseholdMember {
  memberId: string;
  relation: string;
  age: number;
  occupation: string;
  monthlyIncome: number;
}

export interface HomeVisitAppointment {
  appointmentId: string;
  studentId: string;
  /** userId ของครูผู้นัดหมาย */
  teacherId: string;
  proposedDate: string;
  status: AppointmentStatus;
  guardianNote?: string;
  guardianPhone?: string;
  caretakerName?: string;
}

export interface HomeVisitRecord {
  recordId: string;
  appointmentId: string;
  studentId: string;
  householdMembers: HouseholdMember[];
  riskFindings: string[];
  informantName: string;
  informantRelation: string;
  photoLabels: string[];
  /** userId ของครูผู้รับรอง */
  signedBy: string;
  signedAt: string;
}
