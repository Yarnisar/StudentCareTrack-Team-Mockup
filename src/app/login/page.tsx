import Link from "next/link";
import { LinkButton } from "@/components/ui/link-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginRolePicker } from "@/components/layout/role-switcher";
import { SCHOOL_NAME } from "@/lib/mock-data";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-primary p-12 lg:flex">
        <div className="absolute -top-20 -right-20 size-80 rounded-full bg-white/10" />
        <div className="absolute -bottom-28 -left-16 size-96 rounded-full bg-white/[0.07]" />

        <div className="relative flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-white/20 text-[18px] font-bold text-white">
            SC
          </div>
          <span className="text-[18px] font-bold text-white">Student Care Track</span>
        </div>

        <div className="relative">
          <h2 className="max-w-md text-[34px] leading-snug font-bold text-white">
            ระบบดูแลช่วยเหลือนักเรียน
            <br />
            แบบครบวงจร
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-blue-100">
            คัดกรอง ประเมิน เยี่ยมบ้าน และติดตามช่วยเหลือนักเรียนในที่เดียว
          </p>
        </div>

        <p className="relative text-xs text-blue-200">
          © 2569 {SCHOOL_NAME} — งานกิจการนักเรียนและสนับสนุนผู้เรียน
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-card px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold">เข้าสู่ระบบ</h1>
          <p className="mt-1.5 mb-8 text-sm text-muted-foreground">
            ใช้บัญชีของโรงเรียน
          </p>

          <form className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">ชื่อผู้ใช้ / อีเมล</Label>
              <Input id="username" name="username" defaultValue="somying.j" autoComplete="username" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                name="password"
                type="password"
                defaultValue="password"
                autoComplete="current-password"
              />
            </div>
            <div className="flex justify-end">
              <Link href="#" className="text-[13px] font-semibold text-primary hover:underline">
                ลืมรหัสผ่าน?
              </Link>
            </div>
            <LinkButton className="w-full" size="lg" href="/dashboard">
              เข้าสู่ระบบ
            </LinkButton>
          </form>

          <div className="my-7 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">เลือกบทบาทเพื่อดูต้นแบบ</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <LoginRolePicker />
        </div>
      </div>
    </div>
  );
}
