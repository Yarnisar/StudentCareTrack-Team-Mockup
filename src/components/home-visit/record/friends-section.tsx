"use client";

import { Field, SectionCard } from "../field-shell";
import { Input } from "@/components/ui/input";
import type { RecordFormApi } from "./form-state";

/** ข้อ 7 : เพื่อนสนิทของนักเรียน (ข้อมูลเชิงลึก — ใช้ติดต่อเมื่อจำเป็นเท่านั้น) */
export function FriendsSection({ api }: { api: RecordFormApi }) {
  const f = api.form;

  return (
    <SectionCard
      no="7."
      title="เพื่อนสนิทของนักเรียน"
      description="ไม่บังคับกรอก · ใช้เป็นช่องทางติดต่อเมื่อจำเป็น ไม่เปิดเผยในรายงานหรือการแจ้งเตือน"
    >
      <div className="space-y-5">
        <div>
          <h3 className="mb-2.5 text-[13.5px] font-semibold">7.1 เพื่อนสนิทในโรงเรียน</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Field
              label="ชื่อ-นามสกุล"
              htmlFor="friend-in-name"
              carry={api.carryOf("friendInSchoolName")}
            >
              <Input
                id="friend-in-name"
                value={f.friendInSchoolName}
                onChange={(e) => api.setForm("friendInSchoolName", e.target.value)}
              />
            </Field>
            <Field label="ชั้น / ห้อง" htmlFor="friend-in-room" carry={api.carryOf("friendInSchoolRoom")}>
              <Input
                id="friend-in-room"
                value={f.friendInSchoolRoom}
                onChange={(e) => api.setForm("friendInSchoolRoom", e.target.value)}
                placeholder="เช่น ม.3/1"
              />
            </Field>
            <Field
              label="หมายเลขโทรศัพท์"
              htmlFor="friend-in-phone"
              carry={api.carryOf("friendInSchoolPhone")}
            >
              <Input
                id="friend-in-phone"
                value={f.friendInSchoolPhone}
                onChange={(e) => api.setForm("friendInSchoolPhone", e.target.value)}
              />
            </Field>
          </div>
        </div>

        <div>
          <h3 className="mb-2.5 text-[13.5px] font-semibold">7.2 เพื่อนสนิทนอกโรงเรียน</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="ชื่อ-นามสกุล"
              htmlFor="friend-out-name"
              carry={api.carryOf("friendOutsideName")}
            >
              <Input
                id="friend-out-name"
                value={f.friendOutsideName}
                onChange={(e) => api.setForm("friendOutsideName", e.target.value)}
              />
            </Field>
            <Field
              label="หมายเลขโทรศัพท์"
              htmlFor="friend-out-phone"
              carry={api.carryOf("friendOutsidePhone")}
            >
              <Input
                id="friend-out-phone"
                value={f.friendOutsidePhone}
                onChange={(e) => api.setForm("friendOutsidePhone", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
