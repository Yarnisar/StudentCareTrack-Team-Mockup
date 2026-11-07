"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Heart, Home, LayoutGrid, QrCode, User, ClipboardList, UserRound } from "lucide-react";
import type { ReactNode } from "react";

const STUDENT_TABS = [
  { href: "/portal/student", label: "ข้อมูลของฉัน", icon: UserRound },
  { href: "/portal/student/card", label: "บัตรของฉัน", icon: QrCode },
  { href: "/portal/student/sdq", label: "แบบประเมิน", icon: ClipboardList },
  { href: "/portal/student/appointment", label: "นัดหมาย", icon: Home },
];

const PARENT_TABS = [
  { href: "/portal/parent", label: "หน้าหลัก", icon: LayoutGrid },
  { href: "/portal/parent/appointment", label: "นัดหมาย", icon: Home },
  { href: "/portal/parent/results", label: "ผลประเมิน", icon: Heart },
  { href: "/portal/parent/child", label: "ข้อมูลบุตร", icon: UserRound },
];

export function MobileShell({
  title,
  subtitle,
  role,
  back,
  brand = false,
  children,
}: {
  title: string;
  subtitle?: string;
  role: "student" | "parent";
  back?: string;
  brand?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const tabs = role === "student" ? STUDENT_TABS : PARENT_TABS;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col border-x border-border bg-surface">
      {brand ? (
        <header className="bg-primary px-5 py-5">
          <h1 className="text-[18.5px] font-bold text-primary-foreground">{title}</h1>
          {subtitle && <p className="mt-0.5 text-[12.5px] text-blue-100">{subtitle}</p>}
        </header>
      ) : (
        <header className="flex items-center gap-2.5 border-b border-border bg-card px-5 py-4">
          {back && (
            <Link href={back} aria-label="ย้อนกลับ">
              <ChevronLeft className="size-5" />
            </Link>
          )}
          <div>
            <h1 className="text-[17px] font-bold">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </header>
      )}

      <main className="flex-1 overflow-y-auto">{children}</main>

      <nav className="flex border-t border-border bg-card pb-3">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href === "/portal/student/sdq" && pathname === "/portal/student/eq");
          return (
            <Link
              key={href}
              href={href}
              className={
                active
                  ? "flex h-14 flex-1 flex-col items-center justify-center gap-1 text-primary"
                  : "flex h-14 flex-1 flex-col items-center justify-center gap-1 text-muted-foreground"
              }
            >
              <Icon className="size-5" />
              <span className={active ? "text-[10.5px] font-semibold" : "text-[10.5px]"}>
                {label}
              </span>
            </Link>
          );
        })}
        <Link
          href="/login"
          className="flex h-14 flex-1 flex-col items-center justify-center gap-1 text-muted-foreground"
        >
          <User className="size-5" />
          <span className="text-[10.5px]">โปรไฟล์</span>
        </Link>
      </nav>
    </div>
  );
}
