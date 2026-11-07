import { Bell } from "lucide-react";
import { GlobalSearch } from "./global-search";
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
        <GlobalSearch />
        <Bell className="size-5 shrink-0 text-muted-foreground" />
      </div>
    </header>
  );
}
