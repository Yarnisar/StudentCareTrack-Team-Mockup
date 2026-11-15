"use client";

/**
 * ปุ่มส่งออกรายงานกลาง ใช้ร่วมกันทุกกระบวนการ
 * - แต่ละหน้าส่งแค่คอลัมน์ แถว ขอบเขตของไฟล์ (scope) และชื่อไฟล์
 * - ปุ่มสร้าง CSV พร้อมบรรทัดผู้ส่งออก/เวลา/ขอบเขต และบันทึกประวัติการส่งออกให้เองทุกครั้ง
 * - สิทธิ์ตามบทบาท: หน้าที่เรียกใช้ต้องส่งแถวที่บทบาทนั้นเห็นอยู่แล้วเท่านั้น (ผู้ดูแลระบบส่งได้เฉพาะสถิติ ไม่มีชื่อนักเรียน)
 */

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/csv";
import { useStore } from "@/lib/store";

export function ExportButton({
  filename,
  header,
  rows,
  summary,
  scope,
  label = "ส่งออก",
  count,
  disabled,
}: {
  /** ชื่อไฟล์ ไม่ต้องใส่นามสกุล */
  filename: string;
  header: string[];
  /** ฟังก์ชันสร้างแถว เรียกตอนกดเท่านั้น เพื่อไม่คำนวณซ้ำทุกครั้งที่หน้าวาดใหม่ */
  rows: () => (string | number)[][];
  /** ตารางสรุปที่วางก่อนตารางหลัก (เช่น สรุปรวมทั้งโรงเรียนก่อนตารางรายห้อง) */
  summary?: () => (string | number)[][];
  /** ขอบเขตข้อมูลที่ส่งออก บันทึกลงประวัติการส่งออก เช่น "ผลคัดกรอง ห้อง ม.3/1" */
  scope: string;
  label?: string;
  /** จำนวนรายการที่จะส่งออก แสดงต่อท้ายปุ่ม */
  count?: number;
  disabled?: boolean;
}) {
  const { logExport } = useStore();
  const empty = count === 0;
  return (
    <Button
      variant="outline"
      className="h-10"
      disabled={disabled || empty}
      onClick={() => downloadCsv(`${filename}.csv`, header, rows(), logExport(scope), summary?.())}
    >
      <Download className="size-4" /> {label}
      {count !== undefined && ` (${count.toLocaleString("th-TH")})`}
    </Button>
  );
}
