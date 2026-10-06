"use client";

/**
 * หน้าภาพรวม — เนื้อหาต่างกันตามบทบาท
 * - แอดมินโรงเรียน / ผู้บริหาร: ตัวเลขรวมทั้งโรงเรียน + ตารางความคืบหน้ารายห้อง
 * - ครูประจำชั้น: หน้าเริ่มงานของห้องตัวเอง (สรุปห้อง รายการติดตาม งานประจำห้อง กำหนดการวันนี้)
 * ครูทั่วไปไม่มีเมนูนี้ (ดู lib/navigation.ts) — RoleGate กันไว้แล้ว
 */

import { PageHeader } from "@/components/layout/page-header";
import { TeacherCareOverview } from "@/components/dashboard/care-overview";
import { SchoolOverview } from "@/components/dashboard/school-overview";
import { useStore } from "@/lib/store";

export default function DashboardPage() {
  const store = useStore();
  const isAdmin = store.currentUser.role === "admin_school";

  if (isAdmin) {
    return (
      <>
        <PageHeader
          title="ภาพรวมการดูแลช่วยเหลือนักเรียน"
          subtitle={`ทั้งโรงเรียน · ${store.currentTerm.label}`}
        />
        <SchoolOverview />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="ภาพรวมห้องที่รับผิดชอบ"
        subtitle={`สวัสดี ${store.currentUser.name} · วันนี้มีอะไรต้องดูแลบ้าง`}
      />
      <TeacherCareOverview key={store.currentUser.userId} />
    </>
  );
}
