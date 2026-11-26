"use client";

import { useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { capacityOf } from "@/lib/exam/seating";
import { useExam } from "@/lib/exam/store";
import { EXAM_METHOD_LABEL, type ExamMethod } from "@/lib/exam/types";

const toggleIn = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

/** สร้างรอบสอบ: เลือกกลุ่มนักเรียน ห้องสอบ และวิธีจัดที่นั่ง แล้วจัดให้อัตโนมัติ */
export function SessionForm({
  onCreated,
  onCancel,
}: {
  onCreated: (sessionId: string) => void;
  onCancel: () => void;
}) {
  const store = useExam();
  const [title, setTitle] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examTime, setExamTime] = useState("");
  const [scope, setScope] = useState<string[]>([]);
  const [roomIds, setRoomIds] = useState<string[]>([]);
  const [method, setMethod] = useState<ExamMethod>("by_student_code");
  const [error, setError] = useState("");

  const activeRooms = store.examRooms.filter((r) => r.isActive);
  const studentCount = store.studentsInScope(scope).length;
  const capacity = roomIds.reduce(
    (n, id) => n + capacityOf(store.examRooms.find((r) => r.examRoomId === id)?.layout ?? []),
    0
  );
  const tooSmall = scope.length > 0 && roomIds.length > 0 && capacity < studentCount;

  const submit = () => {
    const result = store.createExamSession({
      title,
      examDate,
      examTime,
      studentScope: scope,
      examRoomIds: roomIds,
      method,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onCreated(result.session.sessionId);
  };

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <h2 className="text-[15px] font-bold">สร้างรอบสอบ</h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ses-title" className="text-[13px]">
              ชื่อการสอบ
            </Label>
            <Input id="ses-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="สอบปลายภาค" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ses-date" className="text-[13px]">
              วันสอบ (ไม่บังคับ)
            </Label>
            <Input id="ses-date" value={examDate} onChange={(e) => setExamDate(e.target.value)} placeholder="2570-03-02" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ses-time" className="text-[13px]">
              เวลา (ไม่บังคับ)
            </Label>
            <Input id="ses-time" value={examTime} onChange={(e) => setExamTime(e.target.value)} placeholder="09:00–11:00" />
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-[13px] font-bold">นักเรียนที่สอบ</legend>
          <div className="flex flex-wrap gap-2">
            {store.classrooms.map((c) => {
              const n = store.studentsInScope([c.roomId]).length;
              return (
                <label
                  key={c.roomId}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-[13px]"
                >
                  <Checkbox checked={scope.includes(c.roomId)} onCheckedChange={() => setScope((s) => toggleIn(s, c.roomId))} />
                  {c.roomName}
                  <span className="text-[12px] text-muted-foreground">{n} คน</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-[13px] font-bold">ห้องสอบ</legend>
          <p className="text-[12px] text-muted-foreground">เติมที่นั่งตามลำดับที่เลือก</p>
          {activeRooms.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">ยังไม่มีห้องสอบที่ใช้งานอยู่ — เพิ่มที่แท็บห้องสอบ</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeRooms.map((r) => {
                const order = roomIds.indexOf(r.examRoomId);
                return (
                  <label
                    key={r.examRoomId}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[13px]",
                      order >= 0 ? "border-primary/50 bg-primary/5" : "border-border"
                    )}
                  >
                    <Checkbox
                      checked={order >= 0}
                      onCheckedChange={() => setRoomIds((s) => toggleIn(s, r.examRoomId))}
                    />
                    {r.name}
                    <span className="text-[12px] text-muted-foreground">{capacityOf(r.layout)} ที่นั่ง</span>
                    {order >= 0 && <span className="text-[12px] font-bold text-primary">ลำดับ {order + 1}</span>}
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-[13px] font-bold">วิธีจัดที่นั่ง</legend>
          <RadioGroup
            value={method}
            onValueChange={(v) => setMethod(v as ExamMethod)}
            className="flex w-auto flex-wrap gap-4"
          >
            {(Object.keys(EXAM_METHOD_LABEL) as ExamMethod[]).map((m) => (
              <label key={m} className="flex cursor-pointer items-center gap-2 text-[13px]">
                <RadioGroupItem value={m} />
                {EXAM_METHOD_LABEL[m]}
              </label>
            ))}
          </RadioGroup>
        </fieldset>

        <p className="text-[13px]" aria-live="polite">
          นักเรียน {studentCount} คน · ความจุ {capacity} ที่นั่ง
        </p>
        {tooSmall && (
          <p role="alert" className="text-[13px] font-bold text-destructive">
            ห้องสอบที่เลือกรองรับ {capacity} ที่นั่ง แต่มีนักเรียน {studentCount} คน — เลือกห้องเพิ่ม
          </p>
        )}
        {error && !tooSmall && (
          <p role="alert" className="text-[13px] text-destructive">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button onClick={submit} disabled={tooSmall}>
            จัดที่นั่ง
          </Button>
          <Button variant="outline" onClick={onCancel}>
            ยกเลิก
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
