import { GlobalSearch } from "./global-search";
import { NotificationBell } from "./notification-bell";
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
    <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border bg-card px-4 py-4 sm:px-8 sm:py-5">
      <div className="min-w-[12rem] flex-1">
        <h1 className="text-xl font-bold">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13.5px] text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
        {action}
        <GlobalSearch />
        <NotificationBell />
      </div>
    </header>
  );
}
