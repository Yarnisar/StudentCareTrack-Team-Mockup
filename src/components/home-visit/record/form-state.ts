"use client";

import { useMemo, useState } from "react";
import { carryStates, mockPhoto } from "@/lib/home-visit-form";
import type { CarriedFormKey, CarryState } from "@/lib/home-visit-form";
import { nowThaiIso } from "@/lib/format";
import { nextSeq } from "@/lib/store/ids";
import type {
  HomeVisitForm,
  HomeVisitPhotoType,
  HomeVisitRecord,
  HomeVisitRecordInput,
  HouseholdMember,
} from "@/lib/types";
import type { FillSource } from "../field-shell";

/** คีย์ของกลุ่มข้อมูลที่เก็บเป็นรายการรหัสตัวเลือก */
export type ListKey = {
  [K in keyof HomeVisitForm]: HomeVisitForm[K] extends string[] ? K : never;
}[keyof HomeVisitForm];

/** ส่วนที่ครูกรอกของบันทึกเดิม (ตัด metadata ออก) */
export function pickInput(r: HomeVisitRecord): HomeVisitRecordInput {
  return {
    form: r.form,
    livesWith: r.livesWith,
    informantName: r.informantName,
    informantRelation: r.informantRelation,
    cannotAccessHome: r.cannotAccessHome,
    cannotAccessReason: r.cannotAccessReason,
    photos: r.photos,
  };
}

/** ตัวช่วยกรอกแบบบันทึก ส่งต่อให้คอมโพเนนต์ของแต่ละส่วน */
export interface RecordFormApi {
  input: HomeVisitRecordInput;
  form: HomeVisitForm;
  readOnly: boolean;
  setInput: (next: HomeVisitRecordInput) => void;
  setForm: <K extends keyof HomeVisitForm>(key: K, value: HomeVisitForm[K]) => void;
  /** สลับค่าในรายการแบบ functional update — กันการกดติดกันเร็ว ๆ แล้วค่าหาย */
  toggleIn: (key: ListKey, id: string) => void;
  setTop: <K extends keyof HomeVisitRecordInput>(key: K, value: HomeVisitRecordInput[K]) => void;
  setMembers: (fn: (prev: HouseholdMember[]) => HouseholdMember[]) => void;
  hasPhoto: (type: HomeVisitPhotoType) => boolean;
  togglePhoto: (type: HomeVisitPhotoType) => void;
  /** แหล่งที่ระบบกรอกให้อัตโนมัติ (คีย์ตามชื่อกลุ่มข้อมูลในหน้า) */
  sourceOf: (key: string) => FillSource | undefined;
  /** สถานะของข้อมูลที่ยกมาจากการเยี่ยมครั้งก่อน */
  carryOf: (key: CarriedFormKey) => CarryState | undefined;
}

export function useRecordForm({
  initial,
  readOnly,
  autoFilled,
  previous,
}: {
  initial: () => HomeVisitRecordInput;
  readOnly: boolean;
  autoFilled: Map<string, FillSource>;
  /** บันทึกการเยี่ยมครั้งก่อน (ฉบับรับรองแล้ว) — ใช้คำนวณสถานะข้อมูลที่ยกมา */
  previous: HomeVisitRecord | undefined;
}): RecordFormApi {
  const [input, setInputState] = useState<HomeVisitRecordInput>(initial);
  const carry = useMemo(
    () => carryStates(input.form, previous ? pickInput(previous) : undefined),
    [input.form, previous]
  );

  const api: RecordFormApi = {
    input,
    form: input.form,
    readOnly,
    setInput: (next) => setInputState(next),
    setForm: (key, value) =>
      setInputState((prev) => ({ ...prev, form: { ...prev.form, [key]: value } })),
    toggleIn: (key, id) =>
      setInputState((prev) => {
        const cur = prev.form[key];
        return {
          ...prev,
          form: { ...prev.form, [key]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] },
        };
      }),
    setTop: (key, value) => setInputState((prev) => ({ ...prev, [key]: value })),
    setMembers: (fn) =>
      setInputState((prev) => ({ ...prev, form: { ...prev.form, members: fn(prev.form.members) } })),
    hasPhoto: (type) => input.photos.some((p) => p.photoType === type),
    togglePhoto: (type) => {
      if (input.photos.some((p) => p.photoType === type)) {
        setInputState((prev) => ({ ...prev, photos: prev.photos.filter((p) => p.photoType !== type) }));
        return;
      }
      // สร้างภาพนอก updater เพื่อให้ updater บริสุทธิ์
      const photo = mockPhoto(type, nowThaiIso(), nextSeq());
      setInputState((prev) => ({
        ...prev,
        photos: [...prev.photos.filter((p) => p.photoType !== type), photo],
      }));
    },
    sourceOf: (key) => autoFilled.get(key),
    carryOf: (key) => carry.get(key),
  };

  return api;
}
