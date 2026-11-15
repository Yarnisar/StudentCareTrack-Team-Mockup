import { RoleGate } from "@/components/layout/role-gate";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <RoleGate>{children}</RoleGate>
    </div>
  );
}
