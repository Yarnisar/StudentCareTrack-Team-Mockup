import { RoleGate } from "@/components/layout/role-gate";
import { StaffShell } from "@/components/layout/staff-shell";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffShell>
      <RoleGate>{children}</RoleGate>
    </StaffShell>
  );
}
