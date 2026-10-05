/** ข้อมูลตัวอย่าง: การคัดกรอง 6 มิติ */

import { classifyDimension, SCREENING_ITEMS } from "../rules";
import {
  DIMENSION_ORDER,
  type DimensionResult,
  type RiskGroup,
  type Screening,
  type ScreeningDimension,
  type ScreeningResult,
  type ScreeningStatus,
} from "../types";
import { CURRENT_TERM, USER } from "./core";

interface SeedInput {
  screeningId: string;
  studentId: string;
  termId: string;
  screenedBy: string;
  screenedAt: string;
  status: ScreeningStatus;
  /** รายการทั้งหมดที่พบ (ทั้งที่ครูติ๊กและรายการอัตโนมัติ — แยกให้เองจาก SCREENING_ITEMS) */
  items?: string[];
  /** ครูปรับผล ±1 ระดับ พร้อมเหตุผล */
  adjust?: Partial<Record<ScreeningDimension, { to: RiskGroup; reason: string }>>;
  /** มิติสุขภาพจิตยังรอผลประเมิน */
  mentalPending?: boolean;
}

const derivedIds = new Set(SCREENING_ITEMS.filter((i) => i.derived).map((i) => i.id));

function seed(input: SeedInput): Screening {
  const items = input.items ?? [];
  const results: ScreeningResult[] = DIMENSION_ORDER.map((dimension) => {
    const inDim = items.filter((id) => SCREENING_ITEMS.find((i) => i.id === id)?.dimension === dimension);
    const computed: DimensionResult =
      dimension === "mental" && input.mentalPending ? "pending" : classifyDimension(dimension, inDim);
    const adj = input.adjust?.[dimension];
    return {
      resultId: `${input.screeningId}-${dimension}`,
      dimension,
      computedGroup: computed,
      teacherGroup: adj?.to ?? null,
      adjustReason: adj?.reason ?? null,
      group: adj?.to ?? computed,
      checkedItemIds: inDim.filter((id) => !derivedIds.has(id)),
      derivedItemIds: inDim.filter((id) => derivedIds.has(id)),
    };
  });
  const certified = input.status === "certified";
  return {
    screeningId: input.screeningId,
    studentId: input.studentId,
    termId: input.termId,
    screenedBy: input.screenedBy,
    screenedAt: input.screenedAt,
    status: input.status,
    certifiedBy: certified ? input.screenedBy : null,
    certifiedAt: certified ? `${input.screenedAt.split("T")[0]}T15:30:00` : null,
    unlock: null,
    results,
  };
}

/**
 * ภาคเรียนที่ 2/2569: 30125–30152 รับรองแล้ว, 30160 ยังเป็นร่าง, 30171 และ 30183 ยังไม่คัดกรอง
 * รายการอัตโนมัติ (mt3/mt4) สอดคล้องกับผล Red Flag/9S ภาคเรียนที่ 1 ใน mock-data/assessment.ts
 */
export const screenings: Screening[] = [
  seed({
    screeningId: "SC-001",
    studentId: "30125",
    termId: CURRENT_TERM.termId,
    screenedBy: USER.somying,
    screenedAt: "2570-02-12T10:00:00",
    status: "certified",
    items: ["ec1", "ec2", "mt1", "mt3"],
  }),
  seed({
    screeningId: "SC-002",
    studentId: "30118",
    termId: CURRENT_TERM.termId,
    screenedBy: USER.somying,
    screenedAt: "2570-02-12T10:30:00",
    status: "certified",
    items: ["ac3", "bh2", "bh3", "mt2", "mt3"],
  }),
  seed({
    screeningId: "SC-003",
    studentId: "30131",
    termId: CURRENT_TERM.termId,
    screenedBy: USER.somying,
    screenedAt: "2570-02-11T10:00:00",
    status: "certified",
    items: ["ac1", "ac4", "ec1", "bh2"],
  }),
  seed({
    screeningId: "SC-004",
    studentId: "30140",
    termId: CURRENT_TERM.termId,
    screenedBy: USER.theerapong,
    screenedAt: "2570-02-11T10:00:00",
    status: "certified",
    items: ["wf2", "mt3"],
    adjust: {
      physical: { to: "amber", reason: "ภูมิแพ้กำเริบบ่อยช่วงนี้ ขาดเรียน 2 วันในสัปดาห์ที่ผ่านมา" },
    },
  }),
  seed({
    screeningId: "SC-005",
    studentId: "30152",
    termId: CURRENT_TERM.termId,
    screenedBy: USER.somying,
    screenedAt: "2570-02-10T10:00:00",
    status: "certified",
    items: ["mt3"],
  }),
  seed({
    screeningId: "SC-006",
    studentId: "30160",
    termId: CURRENT_TERM.termId,
    screenedBy: USER.theerapong,
    screenedAt: "2570-02-10T11:00:00",
    status: "draft",
  }),
  // ปีการศึกษาก่อน (ม.2/1) — บันทึกโดยครูประจำชั้นคนเดิม ใช้สาธิตกฎหลังเลื่อนชั้น
  seed({
    screeningId: "SC-0568-01",
    studentId: "30125",
    termId: "T2568-2",
    screenedBy: USER.prapa,
    screenedAt: "2569-01-20T10:00:00",
    status: "certified",
    items: ["ec1"],
  }),
  seed({
    screeningId: "SC-0568-02",
    studentId: "30118",
    termId: "T2568-2",
    screenedBy: USER.wichai,
    screenedAt: "2569-01-21T10:00:00",
    status: "certified",
    items: ["ac3", "bh2", "mt3"],
  }),
];
