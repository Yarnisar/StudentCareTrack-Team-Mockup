"use client";

/**
 * PROTOTYPE ONLY — ปุ่มเข้าสู่ระบบตามบทบาทในหน้า login
 * ตั้งบทบาทใน store ก่อนพาไปหน้าแรกของบทบาทนั้น
 */

import type { ComponentProps } from "react";
import { LinkButton } from "@/components/ui/link-button";
import { ROLE_INFO, type Role } from "@/lib/roles";
import { useStore } from "@/lib/store";

export function RoleLink({
  role,
  children,
  ...props
}: { role: Role } & Omit<ComponentProps<typeof LinkButton>, "href" | "onClick">) {
  const { setRole } = useStore();
  return (
    <LinkButton {...props} href={ROLE_INFO[role].home} onClick={() => setRole(role)}>
      {children ?? ROLE_INFO[role].label}
    </LinkButton>
  );
}
