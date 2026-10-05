import { DemoPanel } from "@/components/demo/demo-panel";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <DemoPanel />
    </>
  );
}
