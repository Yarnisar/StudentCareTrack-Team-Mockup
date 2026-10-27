import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { RoleSwitcher } from "@/components/prototype/role-switcher";

const sarabun = Sarabun({
  weight: ["400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Student Care Track — ระบบดูแลช่วยเหลือนักเรียน",
  description:
    "ระบบคัดกรอง ประเมิน และติดตามการช่วยเหลือนักเรียน สำหรับงานกิจการนักเรียนและสนับสนุนผู้เรียน",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body>
        <StoreProvider>
          {children}
          <RoleSwitcher />
        </StoreProvider>
      </body>
    </html>
  );
}
