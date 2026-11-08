import Link from "next/link";
import { RoleLink } from "@/components/prototype/role-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SCHOOL_NAME } from "@/lib/mock-data";
import { ROLE_ORDER } from "@/lib/roles";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-primary p-12 lg:flex">
        <div className="absolute -top-20 -right-20 size-80 rounded-full bg-white/10" />
        <div className="absolute -bottom-28 -left-16 size-96 rounded-full bg-white/[0.07]" />

        <div className="relative flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-white/20 text-[17px] font-bold text-white">
            SC
          </div>
          <span className="text-[19px] font-bold text-white">Student Care Track</span>
        </div>

        <div className="relative">
          <h2 className="max-w-md text-[34px] leading-snug font-bold text-white">
            ระบบคัดกรอง ประเมิน และติดตามการดูแลช่วยเหลือนักเรียนภายในสถานศึกษา
          </h2>
          <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-violet-100">
            คัดกรองและประเมินนักเรียน บันทึกความประพฤติ เยี่ยมบ้าน และติดตามการช่วยเหลือต่อเนื่องทุกภาคเรียน
            สำหรับครู นักเรียน และผู้ปกครอง
          </p>
        </div>

        <p className="relative text-xs text-violet-200">
          © 2569 {SCHOOL_NAME} — งานกิจการนักเรียนและสนับสนุนผู้เรียน
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-card px-6">
        <div className="w-full max-w-md py-10">
          <h1 className="text-2xl font-bold">เข้าสู่ระบบ</h1>
          <p className="mt-1.5 mb-6 text-sm text-muted-foreground">
            กรอกข้อมูลบัญชีของโรงเรียนเพื่อเข้าใช้งาน
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
            {/* ต้นแบบ: ยังไม่ตรวจรหัสผ่าน เข้าในบทบาทครูประจำชั้น */}
            <RoleLink role="homeroom" className="w-full" size="lg">
              เข้าสู่ระบบ
            </RoleLink>
          </form>

          {/* ต้นแบบ: ปุ่มเข้าแต่ละบทบาท (สลับบทบาทด้วยการออกจากระบบแล้วเลือกใหม่) */}
          <div className="mt-8 border-t border-border pt-6">
            <div className="flex flex-wrap justify-center gap-2">
              {ROLE_ORDER.map((role) => (
                <RoleLink key={role} role={role} variant="outline" className="h-9 rounded-full px-4 text-[13px] font-medium" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
