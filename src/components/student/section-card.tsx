import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export { termLabelOf } from "@/lib/terms";

/** การ์ดหัวข้อในหน้าข้อมูลนักเรียนรายบุคคล */
export function SectionCard({
  title,
  aside,
  note,
  children,
}: {
  title: string;
  aside?: ReactNode;
  note?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[15px] font-bold">{title}</h3>
          {aside}
        </div>
        {note && <p className="-mt-1.5 mb-3 text-[12px] text-muted-foreground">{note}</p>}
        {children}
      </CardContent>
    </Card>
  );
}

export function Chip({ tone = "muted", children }: { tone?: "muted" | "green" | "amber" | "red" | "blue"; children: ReactNode }) {
  const style = {
    muted: "bg-muted text-muted-foreground",
    green: "bg-risk-green-bg text-risk-green",
    amber: "bg-risk-amber-bg text-risk-amber",
    red: "bg-risk-red-bg text-risk-red",
    blue: "bg-accent text-primary",
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold ${style}`}>{children}</span>;
}
