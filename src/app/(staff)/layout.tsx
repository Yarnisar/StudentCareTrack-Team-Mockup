import { RoleGate } from "@/components/layout/role-gate";
import { StaffShell } from "@/components/layout/staff-shell";
import { ExamProvider } from "@/lib/exam/store";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffShell>
      <RoleGate>
        <ExamProvider>{children}</ExamProvider>
      </RoleGate>
    </StaffShell>
  );
}
