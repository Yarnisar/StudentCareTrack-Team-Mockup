import Link from "next/link";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";

/**
 * ปุ่มที่ทำงานเป็นลิงก์
 * ตั้ง nativeButton={false} เพื่อบอก Base UI ว่าองค์ประกอบจริงคือ <a>
 * ทำให้ semantics ของลิงก์ถูกต้องและไม่เสียการเข้าถึงด้วยคีย์บอร์ด
 */
export function LinkButton({
  href,
  children,
  ...props
}: { href: string } & Omit<ComponentProps<typeof Button>, "render" | "nativeButton">) {
  return (
    <Button {...props} nativeButton={false} render={<Link href={href} />}>
      {children}
    </Button>
  );
}
