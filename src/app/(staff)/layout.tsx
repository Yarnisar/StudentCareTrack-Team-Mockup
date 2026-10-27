import { RoleGate } from "@/components/layout/role-gate";
import { Sidebar } from "@/components/layout/sidebar";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <RoleGate>{children}</RoleGate>
      </div>
    </div>
  );
}
