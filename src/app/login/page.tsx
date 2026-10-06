import { LoginForm } from "@/components/auth/login-form";
import { SCHOOL_NAME } from "@/lib/mock-data";

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
            ระบบดูแลช่วยเหลือนักเรียน
            <br />
            แบบครบวงจร
          </h2>
          <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-blue-100">
            คัดกรอง ประเมิน บันทึกความประพฤติ เยี่ยมบ้าน และติดตามช่วยเหลือนักเรียนในที่เดียว
            สำหรับครูประจำชั้นและบุคลากรโรงเรียน
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
            กรอกข้อมูลบัญชีของโรงเรียนเพื่อเข้าใช้งาน
          </p>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
