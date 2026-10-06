"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HOME_BY_ROLE } from "@/lib/permissions";
import { useStore } from "@/lib/store";

/**
 * ฟอร์มเข้าสู่ระบบของต้นแบบ — จับคู่ชื่อผู้ใช้กับบัญชีในข้อมูลตัวอย่าง (รหัสผ่านไม่ถูกตรวจ)
 * การสลับผู้ใช้ระหว่างสาธิตทำที่แผงสาธิตในหน้าหลัก ไม่ใช่ที่หน้านี้
 */
export function LoginForm() {
  const store = useStore();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const username = String(new FormData(event.currentTarget).get("username") ?? "")
      .trim()
      .toLowerCase();

    const user = store.users.find((u) => u.isActive && u.username.toLowerCase() === username);
    if (!user) {
      setError("ไม่พบบัญชีนี้ในระบบ กรุณาตรวจสอบชื่อผู้ใช้อีกครั้ง");
      return;
    }
    setError(null);
    store.setCurrentUser(user.userId);
    router.push(HOME_BY_ROLE[user.role]);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="username">ชื่อผู้ใช้ / อีเมล</Label>
        <Input
          id="username"
          name="username"
          defaultValue="somying.j"
          autoComplete="username"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "login-error" : undefined}
          onChange={() => error && setError(null)}
        />
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

      {error && (
        <p id="login-error" role="alert" className="text-[13px] font-medium text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Link href="#" className="text-[13px] font-semibold text-primary hover:underline">
          ลืมรหัสผ่าน?
        </Link>
      </div>
      <Button type="submit" className="w-full" size="lg">
        เข้าสู่ระบบ
      </Button>
    </form>
  );
}
