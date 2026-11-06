import { Bell, Search } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-4 sm:px-8 sm:py-5">
      <div className="min-w-0">
        <h1 className="text-xl font-bold">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13.5px] text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-4">
        {action}
        <div className="hidden w-56 items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-[13.5px] text-muted-foreground lg:flex">
          <Search className="size-4" />
          <span>ค้นหานักเรียน...</span>
        </div>
        <Bell className="size-5 shrink-0 text-muted-foreground" />
      </div>
    </header>
  );
}
