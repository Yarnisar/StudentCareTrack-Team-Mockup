import { cn } from "cn";

/**
 * รหัสนักเรียนในรายการ: อยู่หน้าชื่อทุกหน้าในรูปแบบเดียวกัน ตัวหนังสือจาง ตัวเลขกว้างเท่ากัน เรียงตรงกันทุกแถว
 * ใช้แยกคนชื่อซ้ำ และเทียบกับช่องค้นหาที่หัวหน้า (ค้นด้วยรหัสได้) หรือฝ่ายทะเบียน
 */
export function StudentId({ id, className }: { id: string; className?: string }) {
  return (
    <span className={cn("inline-block w-12 shrink-0 text-[12.5px] font-normal text-muted-foreground tabular-nums", className)}>
      {id}
    </span>
  );
}
