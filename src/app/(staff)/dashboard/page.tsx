"use client";

/**
 * หน้าภาพรวม แยกตามบทบาท (UC1)
 * - ครูประจำชั้น: ตารางสถานะ 5 กระบวนการของห้องตัวเองจากข้อมูลจริงใน store กดตัวเลขเพื่อดูรายชื่อและไปทำต่อ
 * - แอดมิน: ตารางสถานะ 5 กระบวนการชุดเดียวกัน + ตารางรายห้อง กดห้องเพื่อดูสถานะรายคน จากข้อมูลจำลองทั้งโรงเรียน (_admin/school-data.ts)
 * เทียบสองมุมมองได้จากแถบสลับบทบาท DEMO มุมขวาล่าง
 * วันปิดรอบที่ใช้คำนวณ "ใกล้ครบกำหนด / เกินกำหนด" เป็นค่าตัวอย่างใน lib/periods.ts จนกว่าจะมี UC9
 */

import { PageHeader } from "@/components/layout/page-header";
import { CLASS_SIZE, CURRENT_TERM } from "@/lib/mock-data";
import { ROLE_INFO } from "@/lib/roles";
import { useStore } from "@/lib/store";
import { AdminOverview } from "./_admin/admin-overview";
import { HomeroomOverview } from "./_homeroom/homeroom-overview";

export default function DashboardPage() {
  const store = useStore();
  const isAdmin = store.role === "admin";

  return (
    <>
      <PageHeader
        title="ภาพรวมการดูแลช่วยเหลือนักเรียน"
        subtitle={isAdmin ? CURRENT_TERM.label : `${CURRENT_TERM.label} · ${ROLE_INFO.homeroom.user.title} · แสดง ${store.students.length} จาก ${CLASS_SIZE} คน`}
      />
      {isAdmin ? <AdminOverview /> : <HomeroomOverview />}
    </>
  );
}
