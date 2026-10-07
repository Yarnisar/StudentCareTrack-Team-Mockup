"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** ช่องวันที่ + เวลา (ค่าในรูปแบบของเบราว์เซอร์ แปลงเป็น พ.ศ. ด้วย fromDateInputs) */
export function AppointmentDateFields({
  idPrefix,
  date,
  time,
  onDate,
  onTime,
}: {
  idPrefix: string;
  date: string;
  time: string;
  onDate: (v: string) => void;
  onTime: (v: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-date`} className="text-[12px] text-muted-foreground">
          วันที่นัด
        </Label>
        <Input
          id={`${idPrefix}-date`}
          type="date"
          value={date}
          onChange={(e) => onDate(e.target.value)}
          className="h-11"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-time`} className="text-[12px] text-muted-foreground">
          เวลา
        </Label>
        <Input
          id={`${idPrefix}-time`}
          type="time"
          value={time}
          onChange={(e) => onTime(e.target.value)}
          className="h-11"
        />
      </div>
    </div>
  );
}
