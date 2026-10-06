"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { useStore } from "@/lib/store";

const TABS = [
  { href: "/checkin", label: "เช็กชื่อด้วย QR" },
  { href: "/cards", label: "ออกบัตรนักเรียน" },
];

/** สลับระหว่างเช็กชื่อกับออกบัตร — เฉพาะแอดมิน (ครูอื่นเห็นแค่หน้าเช็กชื่อ) */
export function CheckinCardsTabs() {
  const pathname = usePathname();
  const { currentUser } = useStore();
  if (currentUser.role !== "admin_school") return null;

  return (
    <nav aria-label="บัตรและเช็กชื่อ" className="flex gap-1 border-b border-border bg-card px-8 pt-2">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3.5 py-2 text-[13.5px] transition-colors",
              active
                ? "border-primary font-semibold text-primary"
                : "border-transparent font-medium text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
