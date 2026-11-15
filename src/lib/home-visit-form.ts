/**
 * โครงสร้างแบบบันทึกการเยี่ยมบ้านนักเรียน (4 หน้า)
 * อ้างอิงแบบฟอร์มจริงของ สพฐ. ซึ่งรวมการคัดกรองนักเรียนยากจนไว้ด้วยกัน
 */

import type { PreviousVisitForm } from "./mock-data";

export const OTHER_ID = "other";
/** ข้อความของตัวเลือก "อื่น ๆ" ในรายการแบบข้อความ — เลือกแล้วต้องระบุ */
export const OTHER_LABEL = "อื่น ๆ";

export interface CheckboxOption {
  id: string;
  label: string;
}

/** ข้อ 4.1 ภาระพึ่งพิงของครัวเรือน */
export const DEPENDENCY_OPTIONS: CheckboxOption[] = [
  { id: "dep_disabled", label: "มีคนพิการ" },
  { id: "dep_elderly", label: "มีผู้สูงอายุเกิน 60 ปี" },
  { id: "dep_single_parent", label: "เป็นพ่อ/แม่เลี้ยงเดี่ยว" },
  { id: "dep_unemployed", label: "มีคนอายุ 15–65 ปีว่างงาน (ที่ไม่ใช่นักเรียน/นักศึกษา)" },
];

/** ข้อ 4.2 ประเภทที่อยู่อาศัย (ตอบเพียง 1 ข้อ) */
export const HOUSING_TYPE_OPTIONS: CheckboxOption[] = [
  { id: "own", label: "บ้านของตนเอง" },
  { id: "rent", label: "บ้านเช่า" },
  { id: "with_others", label: "อาศัยอยู่กับผู้อื่น" },
];

/** ข้อ 4.3 สภาพที่อยู่อาศัย */
export const HOUSING_CONDITION_OPTIONS: CheckboxOption[] = [
  {
    id: "dilapidated",
    label: "สภาพบ้านชำรุดทรุดโทรม หรือบ้านทำจากวัสดุพื้นบ้าน เช่น ไม้ไผ่ ใบจาก หรือวัสดุเหลือใช้",
  },
  { id: "no_toilet", label: "ไม่มีห้องส้วมในที่อยู่อาศัยและบริเวณ" },
];

/** ข้อ 4.4 ยานพาหนะของครอบครัว */
export const VEHICLE_OPTIONS: CheckboxOption[] = [
  { id: "car", label: "รถยนต์ส่วนบุคคล" },
  { id: "pickup", label: "รถปิกอัพ / รถบรรทุกเล็ก / รถตู้" },
  { id: "farm", label: "รถไถ / เกี่ยวข้าว / รถอีแต๋น หรือรถประเภทเดียวกัน" },
];

/** ข้อ 4.5 ที่ดินทำกิน (ตอบเพียง 1 ข้อ) */
export const FARMLAND_OPTIONS: CheckboxOption[] = [
  { id: "under_1_rai", label: "เป็นเกษตรกร มีที่ดินทำกิน (รวมเช่า) ไม่เกิน 1 ไร่" },
  { id: "no_land", label: "ไม่มีที่ดินเป็นของตนเอง" },
];

/** ข้อ 5.2 ความสัมพันธ์ระหว่างนักเรียนกับสมาชิกในครอบครัว */
export const FAMILY_MEMBERS = [
  "บิดา",
  "มารดา",
  "พี่ชาย / น้องชาย",
  "พี่สาว / น้องสาว",
  "ปู่ / ย่า / ตา / ยาย",
  "ญาติ",
] as const;

export const RELATIONSHIP_LEVELS = ["สนิทสนม", "เฉยๆ", "ห่างเหิน", "ขัดแย้ง", "ไม่มี"] as const;
export type RelationshipLevel = (typeof RELATIONSHIP_LEVELS)[number];

/** ข้อ 5.3 ผู้ดูแลกรณีผู้ปกครองไม่อยู่บ้าน (ตอบเพียง 1 ข้อ) */
export const CARETAKER_OPTIONS: CheckboxOption[] = [
  { id: "relative", label: "ญาติ" },
  { id: "neighbor", label: "เพื่อนบ้าน" },
  { id: "alone", label: "นักเรียนอยู่บ้านด้วยตนเอง" },
  { id: "other", label: "อื่น ๆ" },
];

/** ข้อ 5.6 สิ่งที่ผู้ปกครองต้องการให้โรงเรียนช่วยเหลือ */
export const SUPPORT_REQUEST_OPTIONS: CheckboxOption[] = [
  { id: "academic", label: "ด้านการเรียน" },
  { id: "behavior", label: "ด้านพฤติกรรม" },
  { id: "economic", label: "ด้านเศรษฐกิจ (เช่น ขอรับทุน)" },
  { id: "other", label: "อื่น ๆ" },
];

/** ข้อ 5.7 ความช่วยเหลือที่เคยได้รับหรือต้องการ */
export const WELFARE_RECEIVED_OPTIONS: CheckboxOption[] = [
  { id: "elderly_allowance", label: "เบี้ยผู้สูงอายุ" },
  { id: "disability_allowance", label: "เบี้ยพิการ" },
  { id: "other", label: "อื่น ๆ" },
];

/** ข้อ 6.1 สุขภาพ */
export const HEALTH_RISK_OPTIONS: CheckboxOption[] = [
  { id: "weak", label: "ร่างกายไม่แข็งแรง" },
  { id: "chronic", label: "มีโรคประจำตัวหรือเจ็บป่วยบ่อย" },
  { id: "malnutrition", label: "มีภาวะทุพโภชนาการ" },
  { id: "severe_illness", label: "ป่วยเป็นโรคร้ายแรง / เรื้อรัง" },
  { id: "low_fitness", label: "สมรรถภาพทางร่างกายต่ำ" },
];

/** ข้อ 6.2 สวัสดิภาพหรือความปลอดภัย */
export const WELFARE_RISK_OPTIONS: CheckboxOption[] = [
  { id: "separated", label: "พ่อแม่แยกทางกัน หรือแต่งงานใหม่" },
  { id: "slum", label: "ที่พักอาศัยอยู่ในชุมชนแออัดหรือใกล้แหล่งมั่วสุม / สถานเริงรมย์" },
  { id: "family_illness", label: "มีบุคคลในครอบครัวเจ็บป่วยด้วยโรคร้ายแรง / เรื้อรัง / ติดต่อ" },
  { id: "family_drugs", label: "บุคคลในครอบครัวติดสารเสพติด" },
  { id: "family_gambling", label: "บุคคลในครอบครัวเล่นการพนัน" },
  { id: "family_conflict", label: "มีความขัดแย้ง / ทะเลาะกันในครอบครัว" },
  { id: "no_caretaker", label: "ไม่มีผู้ดูแล" },
  { id: "family_violence", label: "มีความขัดแย้งและมีการใช้ความรุนแรงในครอบครัว" },
  { id: "abused", label: "ถูกทารุณ / ทำร้ายจากบุคคลในครอบครัว / เพื่อนบ้าน" },
  { id: "sexual_abuse", label: "ถูกล่วงละเมิดทางเพศ" },
  { id: "gambling", label: "เล่นการพนัน" },
];

/** ข้อ 6.3 การเดินทางมาโรงเรียน (ตอบเพียง 1 ข้อ) */
export const TRAVEL_OPTIONS: CheckboxOption[] = [
  { id: "guardian", label: "ผู้ปกครองมาส่ง" },
  { id: "bus", label: "รถโดยสารประจำทาง" },
  { id: "motorcycle", label: "รถจักรยานยนต์" },
  { id: "school_bus", label: "รถโรงเรียน" },
  { id: "car", label: "รถยนต์" },
  { id: "bicycle", label: "รถจักรยาน" },
  { id: "walk", label: "เดิน" },
  { id: "other", label: "อื่น ๆ" },
];

/** ข้อ 6.4 ภาระงานความรับผิดชอบต่อครอบครัว */
export const DUTY_OPTIONS: CheckboxOption[] = [
  { id: "housework", label: "ช่วยงานบ้าน" },
  { id: "care_sick", label: "ช่วยดูแลคนเจ็บป่วย / พิการ" },
  { id: "small_trade", label: "ช่วยค้าขายเล็ก ๆ น้อย ๆ" },
  { id: "work_nearby", label: "ทำงานแถวบ้าน" },
  { id: "farm_work", label: "ช่วยงานในนาไร่" },
  { id: "other", label: "อื่น ๆ" },
];

/** ข้อ 6.5 กิจกรรมยามว่างหรืองานอดิเรก */
export const HOBBY_OPTIONS: CheckboxOption[] = [
  { id: "tv", label: "ดูทีวี / ฟังเพลง" },
  { id: "mall", label: "ไปเที่ยวห้าง / ดูหนัง" },
  { id: "reading", label: "อ่านหนังสือ" },
  { id: "friends", label: "ไปหาเพื่อน" },
  { id: "racing", label: "แว้น / สก๊อย" },
  { id: "games", label: "เล่นเกมคอมพิวเตอร์ / มือถือ" },
  { id: "park", label: "ไปสวนสาธารณะ" },
  { id: "snooker", label: "ไปร้านสนุกเกอร์" },
  { id: "other", label: "อื่น ๆ" },
];

/** ข้อ 6.6 พฤติกรรมการใช้สารเสพติด */
export const SUBSTANCE_OPTIONS: CheckboxOption[] = [
  { id: "friends_use", label: "คบเพื่อนในกลุ่มที่ใช้สารเสพติด" },
  { id: "family_involved", label: "สมาชิกในครอบครัวข้องเกี่ยวกับยาเสพติด" },
  { id: "environment", label: "อยู่ในสภาพแวดล้อมที่ใช้สารเสพติด" },
  { id: "currently_involved", label: "ปัจจุบันเกี่ยวข้องกับสารเสพติด" },
  { id: "addicted", label: "เป็นผู้ติดบุหรี่ สุรา หรือการใช้สารเสพติดอื่น ๆ" },
];

/** ข้อ 6.7 พฤติกรรมการใช้ความรุนแรง */
export const VIOLENCE_OPTIONS: CheckboxOption[] = [
  { id: "quarrel", label: "มีการทะเลาะวิวาท" },
  { id: "aggressive", label: "ก้าวร้าว เกเร" },
  { id: "frequent_quarrel", label: "ทะเลาะวิวาทเป็นประจำ" },
  { id: "harm_others", label: "ทำร้ายร่างกายผู้อื่น" },
  { id: "self_harm", label: "ทำร้ายร่างกายตนเอง" },
];

/** ข้อ 6.8 พฤติกรรมทางเพศ */
export const SEXUAL_OPTIONS: CheckboxOption[] = [
  { id: "sex_work_group", label: "อยู่ในกลุ่มขายบริการ" },
  { id: "device_sex_long", label: "ใช้เครื่องมือสื่อสารที่เกี่ยวข้องด้านเพศเป็นเวลานานและบ่อยครั้ง" },
  { id: "pregnant", label: "ตั้งครรภ์" },
  { id: "sex_work", label: "ขายบริการทางเพศ" },
  { id: "obsessed", label: "หมกมุ่นในการใช้เครื่องมือสื่อสารที่เกี่ยวข้องทางเพศ" },
  { id: "group_sex", label: "มีการมั่วสุมทางเพศ" },
];

/** ข้อ 6.9 การติดเกม */
export const GAMING_OPTIONS: CheckboxOption[] = [
  { id: "over_1h", label: "เล่นเกมเกินวันละ 1 ชั่วโมง" },
  { id: "no_creativity", label: "ขาดจินตนาการและความคิดสร้างสรรค์" },
  { id: "isolated", label: "เก็บตัว แยกตัวจากกลุ่มเพื่อน" },
  { id: "spending", label: "ใช้จ่ายเงินผิดปกติ" },
  { id: "gamer_friends", label: "อยู่ในกลุ่มเพื่อนเล่นเกม" },
  { id: "shop_nearby", label: "ร้านเกมอยู่ใกล้บ้านหรือโรงเรียน" },
  { id: "over_2h", label: "ใช้เวลาเล่นเกมเกิน 2 ชั่วโมง" },
  { id: "obsessed", label: "หมกมุ่น จริงจังในการเล่นเกม" },
  { id: "steal_money", label: "ใช้เงินสิ้นเปลือง โกหก ลักขโมยเงินเพื่อเล่นเกม" },
];

/** ข้อ 6.10 การเข้าถึงอินเทอร์เน็ตที่บ้าน (ตอบเพียง 1 ข้อ) */
export const INTERNET_OPTIONS: CheckboxOption[] = [
  { id: "can_access", label: "สามารถเข้าถึง Internet ได้จากที่บ้าน" },
  { id: "cannot_access", label: "ไม่สามารถเข้าถึง Internet ได้จากที่บ้าน" },
];

/** ข้อ 6.11 การใช้เครื่องมือสื่อสารอิเล็กทรอนิกส์ */
export const DEVICE_OPTIONS: CheckboxOption[] = [
  { id: "phone_in_class", label: "เคยใช้โทรศัพท์มือถือในระหว่างการเรียน" },
  { id: "social_1h", label: "เข้าใช้ LINE, Facebook, X หรือแชท เกินวันละ 1 ชั่วโมง" },
  { id: "phone_in_class_often", label: "ใช้โทรศัพท์มือถือในระหว่างเรียน 2–3 ครั้ง/วัน" },
  { id: "social_2h", label: "เข้าใช้ LINE, Facebook, X หรือแชท เกินวันละ 2 ชั่วโมง" },
];

/** ความสัมพันธ์กับนักเรียนของสมาชิกครัวเรือน (ข้อ 3) — ใช้คำเดียวกันทุกที่เพื่อให้ข้อ 4.1 และ 5.2 คำนวณได้แม่น */
export const MEMBER_RELATION_OPTIONS = [
  "นักเรียน",
  "บิดา", "มารดา", "พ่อเลี้ยง", "แม่เลี้ยง",
  "พี่ชาย", "พี่สาว", "น้องชาย", "น้องสาว",
  "ปู่", "ย่า", "ตา", "ยาย", "ทวด",
  "ลุง", "ป้า", "น้า", "อา",
  "ญาติอื่น", "ผู้อาศัยที่ไม่ใช่ญาติ",
];

/** การศึกษาสูงสุดของผู้ปกครอง */
export const EDUCATION_OPTIONS = [
  "ไม่ได้เรียน",
  "ประถมศึกษา",
  "มัธยมศึกษาตอนต้น",
  "มัธยมศึกษาตอนปลาย / ปวช.",
  "ปวส. / อนุปริญญา",
  "ปริญญาตรี",
  "สูงกว่าปริญญาตรี",
];

/** อาชีพหลักของผู้ปกครอง — PROTOTYPE: ยังไม่ได้เทียบกับหมวดอาชีพในแบบฟอร์ม สพฐ. */
export const OCCUPATION_OPTIONS = [
  "เกษตรกร",
  "รับจ้างทั่วไป",
  "ค้าขาย / ธุรกิจส่วนตัว",
  "พนักงานบริษัท / โรงงาน",
  "รับราชการ / รัฐวิสาหกิจ",
  "ประมง",
  "แม่บ้าน / พ่อบ้าน",
  "ว่างงาน",
  OTHER_LABEL,
];

/** ตัวเลือกเวลาเดินทางไปโรงเรียน (นาที) */
export const TRAVEL_TIME_MINUTES = [5, 10, 15, 20, 25, 30, 40, 45, 60, 75, 90, 120, 150, 180, 240];

export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} นาที`;
  return m === 0 ? `${h} ชม.` : `${h} ชม. ${m} นาที`;
}

/** ผู้ดูแลเมื่อผู้ปกครองไม่อยู่บ้าน ที่ผู้ปกครองเลือกล่วงหน้าใน portal */
export const CARETAKER_RELATION_OPTIONS = [
  "ปู่", "ย่า", "ตา", "ยาย", "ลุง", "ป้า", "น้า", "อา", "พี่", "ญาติอื่น",
  "เพื่อนบ้าน",
  "นักเรียนอยู่บ้านเอง",
  OTHER_LABEL,
];

export function formatCaretaker(relation?: string, name?: string): string {
  if (!relation && !name) return "";
  if (!relation) return name ?? "";
  return name ? `${relation} (${name})` : relation;
}

/** ผู้ให้ข้อมูลนักเรียน */
export const INFORMANT_OPTIONS = [
  "บิดา", "มารดา", "พี่ชาย", "พี่สาว", "น้า", "อา",
  "ป้า", "ลุง", "ปู่", "ย่า", "ตา", "ยาย",
  "ทวด", "พ่อเลี้ยง", "แม่เลี้ยง",
];

/**
 * ภาพถ่ายหน้า 4: แบบฟอร์มรวม "ภาพนักเรียนและป้ายชื่อโรงเรียน" ไว้ในรายการเดียวกับประเภทบ้าน
 * หน้าจอแยกเป็นคำถามก่อนว่าถ่ายรูปบ้านได้ไหม เพื่อไม่ให้ครูเข้าใจว่าเป็นแค่ประเภทของรูป
 */
export const CAN_PHOTO_HOME_OPTIONS: CheckboxOption[] = [
  { id: "yes", label: "ถ่ายรูปบ้านได้" },
  { id: "no", label: "ถ่ายรูปบ้านไม่ได้ ใช้ภาพนักเรียนคู่ป้ายชื่อโรงเรียนแทน" },
];

/** ประเภทบ้านในภาพถ่าย (เมื่อถ่ายรูปบ้านได้) */
export const HOME_PHOTO_TYPE_OPTIONS: CheckboxOption[] = [
  { id: "parents_home", label: "บ้านที่อาศัยอยู่กับพ่อแม่ (เป็นเจ้าของ / เช่า)" },
  { id: "relative_home", label: "บ้านของญาติ / ผู้ปกครองที่ไม่ใช่ญาติ" },
  { id: "institution", label: "บ้านหรือที่พักประเภท วัด มูลนิธิ หอพัก โรงงาน อยู่กับนายจ้าง" },
];

/** ค่าในแบบฟอร์มเมื่อถ่ายรูปบ้านไม่ได้ — แนบรูปเดียวและต้องเลือกเหตุผล */
export const SCHOOL_SIGN_PHOTO = "school_sign";

/** เหตุผลที่ถ่ายรูปบ้านไม่ได้ — PROTOTYPE: รายการเสนอ ยังไม่ได้เทียบกับคู่มือ สพฐ. */
export const PHOTO_REASON_OPTIONS: CheckboxOption[] = [
  { id: "guardian_declined", label: "ผู้ปกครองไม่สะดวกให้เข้าบ้าน" },
  { id: "dormitory", label: "นักเรียนพักหอพัก / วัด / มูลนิธิ" },
  { id: "unreachable", label: "เดินทางไปที่บ้านไม่ได้" },
  { id: OTHER_ID, label: OTHER_LABEL },
];

/** ช่องรูปที่ต้องแนบตามประเภทภาพถ่าย (หน้า 4 ของแบบฟอร์ม) */
export function photoSlots(photoType: string): { label: string; short: string }[] {
  return photoType === SCHOOL_SIGN_PHOTO
    ? [{ label: "ภาพนักเรียนคู่กับป้ายชื่อโรงเรียน", short: "ภาพนักเรียนคู่ป้ายโรงเรียน" }]
    : [
        { label: "รูปที่ 1 ภาพถ่ายสภาพบ้านนักเรียน (มีหลังคาและฝาบ้าน)", short: "ภาพภายนอกบ้าน" },
        { label: "รูปที่ 2 ภาพถ่ายภายในบ้านนักเรียน", short: "ภาพภายในบ้าน" },
      ];
}

/** ประเภทรายได้ตามแบบฟอร์ม (บาท/เดือน) */
export const INCOME_COLUMNS = [
  { key: "wage", label: "ค่าจ้าง / เงินเดือน" },
  { key: "agriculture", label: "ทางการเกษตร (หลังหักค่าใช้จ่าย)" },
  { key: "business", label: "ธุรกิจส่วนตัว (หลังหักค่าใช้จ่าย)" },
  { key: "welfare", label: "สวัสดิการจากรัฐ / เอกชน" },
  { key: "other", label: "รายได้จากแหล่งอื่น" },
] as const;

export type IncomeKey = (typeof INCOME_COLUMNS)[number]["key"];

export interface HouseholdMemberRow {
  id: string;
  relation: string;
  age: number | "";
  disability: boolean;
  income: Record<IncomeKey, number>;
}

export function memberTotal(row: HouseholdMemberRow): number {
  return INCOME_COLUMNS.reduce((sum, col) => sum + (row.income[col.key] || 0), 0);
}

/* ------------------------------------------------------------------ */
/* ค่าของแบบฟอร์มทั้งชุด (เก็บเป็นร่างอัตโนมัติ และส่งเข้า store เมื่อบันทึก) */
/* ------------------------------------------------------------------ */

/** หมวดที่มีปุ่ม "ไม่พบ/ไม่มี" — ต้องเลือกรายการที่พบ หรือยืนยันว่าไม่พบ จึงนับว่าตรวจแล้ว */
export const NONE_FIELDS = [
  "dependencies",
  "housingConditions",
  "welfareReceived",
  "healthRisks",
  "welfareRisks",
  "duties",
  "substances",
  "violence",
  "sexual",
  "gaming",
  "devices",
] as const;
export type NoneField = (typeof NONE_FIELDS)[number];
export type ListField = NoneField | "supportRequests" | "hobbies";

/** ข้อที่มีตัวเลือก "อื่น ๆ" และต้องระบุเพิ่ม */
export type OtherField =
  | "occupation"
  | "caretakerWhenAway"
  | "supportRequests"
  | "welfareReceived"
  | "travelMode"
  | "duties"
  | "hobbies"
  | "photoReason";

/** เลือก "อื่น ๆ" ในข้อนั้นอยู่หรือไม่ */
export function choseOther(form: VisitForm, field: OtherField): boolean {
  const value = form[field];
  if (field === "occupation") return value === OTHER_LABEL;
  return Array.isArray(value) ? value.includes(OTHER_ID) : value === OTHER_ID;
}

export interface VisitForm {
  occupation: string;
  education: string;
  members: HouseholdMemberRow[];
  dependencies: string[];
  housingType: string;
  housingConditions: string[];
  vehicles: Record<string, boolean | undefined>;
  farmland: string;
  hoursTogether: string;
  relations: Record<string, string>;
  caretakerWhenAway: string;
  supportRequests: string[];
  welfareReceived: string[];
  guardianConcern: string;
  healthRisks: string[];
  welfareRisks: string[];
  travelKm: string;
  travelHours: string;
  travelMinutes: string;
  travelMode: string;
  duties: string[];
  hobbies: string[];
  substances: string[];
  violence: string[];
  sexual: string[];
  gaming: string[];
  internet: string;
  devices: string[];
  informant: string;
  photoType: string;
  /** หมวดที่ครูยืนยันว่าไม่พบ — แยก "ยังไม่ได้ตรวจ" ออกจาก "ไม่พบ" */
  noneFound: NoneField[];
  /** ส่วนที่ดึงจากการเยี่ยมครั้งก่อนและต้องให้ครูยืนยันว่ายังถูกต้อง (UC5) */
  needsConfirm: ConfirmSection[];
  confirmed: ConfirmSection[];
  /** ข้อความที่ระบุเมื่อเลือก "อื่น ๆ" */
  otherNotes: Partial<Record<OtherField, string>>;
  /** ถ่ายรูปบ้านได้ไหม: "yes" | "no" (ยังไม่ตอบ = "") */
  canPhotoHome: string;
  /** รูปตามลำดับช่องใน photoSlots (ต้นแบบ: data URL ที่ย่อแล้ว) */
  photos: string[];
  /** เหตุผลที่ถ่ายรูปบ้านไม่ได้ (id จาก PHOTO_REASON_OPTIONS) */
  photoReason: string;
  /** ข้อมูลทะเบียนที่แก้เฉพาะการเยี่ยมครั้งนี้ ระบบไม่แก้ข้อมูลต้นทาง (UC5 Alt-D ข้อ 1) */
  registryOverrides?: Partial<Record<"guardianName" | "guardianRelation" | "guardianPhone" | "address", string>>;
}

/** ชื่อหัวข้อสำหรับประวัติการแก้ไข (UC5 สถานการณ์ B ข้อ 10) */
const VISIT_FIELD_LABEL: Partial<Record<keyof VisitForm, string>> = {
  occupation: "อาชีพผู้ปกครอง",
  education: "การศึกษาผู้ปกครอง",
  members: "สมาชิกครัวเรือนและรายได้",
  dependencies: "ภาระพึ่งพิง",
  housingType: "ลักษณะที่อยู่อาศัย",
  housingConditions: "สภาพที่อยู่อาศัย",
  vehicles: "ยานพาหนะ",
  farmland: "ที่ดินทำกิน",
  hoursTogether: "เวลาที่อยู่ร่วมกัน",
  relations: "ความสัมพันธ์ในครอบครัว",
  caretakerWhenAway: "ผู้ดูแลเมื่อไม่อยู่บ้าน",
  supportRequests: "ความช่วยเหลือที่ต้องการ",
  welfareReceived: "สวัสดิการที่ได้รับ",
  guardianConcern: "ความห่วงใยของผู้ปกครอง",
  healthRisks: "สุขภาพ",
  welfareRisks: "สวัสดิภาพและความปลอดภัย",
  travelKm: "การเดินทาง",
  travelHours: "การเดินทาง",
  travelMinutes: "การเดินทาง",
  travelMode: "การเดินทาง",
  duties: "หน้าที่ในบ้าน",
  hobbies: "งานอดิเรก",
  substances: "สารเสพติด",
  violence: "ความรุนแรง",
  sexual: "พฤติกรรมทางเพศ",
  gaming: "การติดเกม",
  internet: "อินเทอร์เน็ต",
  devices: "อุปกรณ์",
  informant: "ผู้ให้ข้อมูล",
  photoType: "รูปถ่าย",
  canPhotoHome: "รูปถ่าย",
  photos: "รูปถ่าย",
  photoReason: "รูปถ่าย",
  otherNotes: "ข้อความระบุเพิ่ม",
  registryOverrides: "ข้อมูลพื้นฐานสำหรับการเยี่ยมครั้งนี้",
};

/** หัวข้อที่เปลี่ยนระหว่างผลเดิมกับผลที่แก้ (ไม่รวมสถานะภายในของฟอร์ม) */
export function diffVisitForm(before: VisitForm | undefined, after: VisitForm): string[] {
  if (!before) return ["บันทึกคำตอบทั้งแบบฟอร์ม"];
  const changed = new Set<string>();
  for (const key of Object.keys(VISIT_FIELD_LABEL) as (keyof VisitForm)[]) {
    if (JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null)) changed.add(VISIT_FIELD_LABEL[key]!);
  }
  return [...changed];
}

export type ConfirmSection = "household" | "status";

/** ขั้นของแบบฟอร์ม เรียงตามลำดับที่ถามในวันเยี่ยมบ้าน */
export const VISIT_STEPS = [
  { title: "ครอบครัวและรายได้", sections: "ข้อ 1–3" },
  { title: "สถานะครัวเรือน", sections: "ข้อ 4" },
  { title: "ความสัมพันธ์ในครอบครัว", sections: "ข้อ 5" },
  { title: "พฤติกรรมและความเสี่ยง", sections: "ข้อ 6" },
  { title: "ผู้ให้ข้อมูลและรับรอง", sections: "ข้อ 7" },
] as const;

/** แถวในข้อ 5.2 จับคู่กับคำที่ครูพิมพ์ในช่องความสัมพันธ์ของข้อ 3 */
const RELATION_KEYWORDS: Record<(typeof FAMILY_MEMBERS)[number], string[]> = {
  "บิดา": ["บิดา", "พ่อเลี้ยง"],
  "มารดา": ["มารดา", "แม่เลี้ยง"],
  "พี่ชาย / น้องชาย": ["พี่ชาย", "น้องชาย"],
  "พี่สาว / น้องสาว": ["พี่สาว", "น้องสาว"],
  "ปู่ / ย่า / ตา / ยาย": ["ปู่", "ย่า", "ตา", "ยาย", "ทวด"],
  "ญาติ": ["ญาติอื่น", "น้า", "อา", "ป้า", "ลุง"],
};

/**
 * ข้อ 5.2 ที่ใช้จริง: คำตอบของครู หรือ "ไม่มี" สำหรับคนที่ไม่อยู่ในสมาชิกครัวเรือนข้อ 3
 * ครูเปลี่ยนได้ เช่น บิดาไม่ได้อยู่บ้านแต่ยังติดต่อกัน
 */
export function effectiveRelations(form: VisitForm): Record<string, string> {
  const relations = form.members.map((m) => m.relation.trim()).filter(Boolean);
  return Object.fromEntries(
    FAMILY_MEMBERS.map((row) => {
      if (form.relations[row]) return [row, form.relations[row]];
      const present = relations.some((r) => RELATION_KEYWORDS[row].includes(r));
      return [row, present ? "" : "ไม่มี"];
    })
  );
}

/**
 * ข้อ 4.1 ที่คำนวณได้จากตารางสมาชิกข้อ 3 — ระบบเลือกให้และล็อกไว้ ถ้าผิดให้แก้ที่ข้อ 3
 * ข้อ "ว่างงาน" ดูจากรายได้อย่างเดียวไม่ได้ จึงเป็นแค่ข้อเสนอให้ครูถาม (ดู possibleUnemployed)
 */
export function derivedDependencies(form: VisitForm): string[] {
  return [
    ...(form.members.some((m) => m.disability) ? ["dep_disabled"] : []),
    ...(form.members.some((m) => Number(m.age) > 60) ? ["dep_elderly"] : []),
  ];
}

/** สมาชิกอายุ 15–65 ปีที่ไม่ใช่นักเรียนและไม่มีรายได้ — อาจว่างงาน ให้ครูถามยืนยัน */
export function possibleUnemployed(form: VisitForm): HouseholdMemberRow[] {
  return form.members.filter((m) => {
    const age = Number(m.age);
    return m.age !== "" && age >= 15 && age <= 65 && m.relation !== "นักเรียน" && memberTotal(m) === 0;
  });
}

/** เหตุผลที่ถ่ายรูปบ้านไม่ได้เป็นข้อความ (ใช้แสดงและเก็บในผล) */
export function photoReasonText(form: VisitForm): string | undefined {
  if (form.canPhotoHome !== "no" || !form.photoReason) return undefined;
  if (form.photoReason === OTHER_ID) return form.otherNotes?.photoReason?.trim() || OTHER_LABEL;
  return PHOTO_REASON_OPTIONS.find((o) => o.id === form.photoReason)?.label;
}

/** ค่าที่ใช้จริงตอนบันทึก: รวมค่าที่ระบบคำนวณให้ (ข้อ 4.1 และ 5.2) */
export function finalizeVisitForm(form: VisitForm): VisitForm {
  return {
    ...form,
    dependencies: [...new Set([...derivedDependencies(form), ...form.dependencies])],
    relations: effectiveRelations(form),
  };
}

/** แถวในข้อ 5.2 ที่ระบบเลือก "ไม่มี" ให้ (ครูยังไม่ได้เลือกเอง) */
export function suggestedNoRelation(form: VisitForm): string[] {
  const effective = effectiveRelations(form);
  return FAMILY_MEMBERS.filter((row) => !form.relations[row] && effective[row] === "ไม่มี");
}

export const emptyMember = (id: string): HouseholdMemberRow => ({
  id,
  relation: "",
  age: "",
  disability: false,
  income: { wage: 0, agriculture: 0, business: 0, welfare: 0, other: 0 },
});

/** ข้อ 5.3 จากผู้ดูแลที่ผู้ปกครองเลือกไว้ล่วงหน้า (ตัวเลือกเดียวกันจึงไม่ต้องเดา) */
export function caretakerOptionFrom(relation: string | undefined): string {
  if (!relation) return "";
  if (relation === "เพื่อนบ้าน") return "neighbor";
  if (relation === "นักเรียนอยู่บ้านเอง") return "alone";
  if (relation === OTHER_LABEL) return OTHER_ID;
  return "relative";
}

export interface VisitContext {
  /** ความสัมพันธ์ของผู้ปกครองตามทะเบียน ใช้เป็นผู้ให้ข้อมูลและสมาชิกเริ่มต้น */
  guardianRelation?: string;
  /** ผู้ดูแลเมื่อผู้ปกครองไม่อยู่ ที่ผู้ปกครองเลือกไว้ล่วงหน้า */
  caretakerRelation?: string;
  caretakerName?: string;
}

/**
 * ค่าเริ่มต้น: ดึงจากการเยี่ยมบ้านครั้งก่อน ทะเบียนนักเรียน และคำตอบล่วงหน้าของผู้ปกครอง
 * ไม่เดาข้อ 5.6 และ 5.8 จากข้อความอิสระของผู้ปกครอง — แสดงข้อความให้ครูอ่านประกอบแทน
 */
export function initialVisitForm(
  previous: PreviousVisitForm | undefined,
  { guardianRelation, caretakerRelation, caretakerName }: VisitContext
): VisitForm {
  const firstVisitMembers = [
    { ...emptyMember("m1"), relation: "นักเรียน" },
    ...(guardianRelation ? [{ ...emptyMember("m2"), relation: guardianRelation }] : []),
  ];

  // คำตอบ "ไม่มี" จากครั้งก่อนถือว่าตรวจแล้ว ครูแก้ได้ถ้าเปลี่ยนไป
  const previousNone = previous
    ? (["dependencies", "housingConditions", "duties"] as const).filter((f) => previous[f].length === 0)
    : [];

  return {
    occupation: "",
    education: "",
    members: previous ? previous.householdMembers.map((m) => ({ ...m })) : firstVisitMembers,
    dependencies: previous?.dependencies ?? [],
    housingType: previous?.housingType ?? "",
    housingConditions: previous?.housingConditions ?? [],
    vehicles: previous
      ? Object.fromEntries(VEHICLE_OPTIONS.map((v) => [v.id, previous.vehicles.includes(v.id)]))
      : {},
    farmland: previous?.farmland ?? "",
    hoursTogether: previous?.hoursTogether ?? "",
    relations: {},
    caretakerWhenAway: previous?.caretakerWhenAway ?? caretakerOptionFrom(caretakerRelation),
    supportRequests: [],
    welfareReceived: [],
    guardianConcern: "",
    healthRisks: [],
    welfareRisks: [],
    travelKm: previous?.travelKm ?? "",
    travelHours: previous?.travelHours ?? "",
    travelMinutes: previous?.travelMinutes ?? "",
    travelMode: previous?.travelMode ?? "",
    duties: previous?.duties ?? [],
    hobbies: [],
    substances: [],
    violence: [],
    sexual: [],
    gaming: [],
    internet: previous?.internet ?? "",
    devices: [],
    informant: guardianRelation && INFORMANT_OPTIONS.includes(guardianRelation) ? guardianRelation : "",
    photoType: "",
    canPhotoHome: "",
    photos: [],
    photoReason: "",
    noneFound: [...previousNone],
    needsConfirm: previous ? ["household", "status"] : [],
    confirmed: [],
    // ผู้ปกครองเลือก "อื่น ๆ" และระบุชื่อไว้ → ใช้เป็นข้อความระบุของข้อ 5.3
    otherNotes:
      !previous && caretakerOptionFrom(caretakerRelation) === OTHER_ID && caretakerName
        ? { caretakerWhenAway: caretakerName }
        : {},
  };
}

/**
 * ข้อบังคับที่ยังไม่ได้ตอบ เรียงตามลำดับในแบบฟอร์ม
 * ข้อไม่บังคับ: อาชีพ/การศึกษาผู้ปกครอง, 5.6, 5.8 และ 6.5 (ไม่มีตัวเลือก "ไม่มี" ในแบบฟอร์ม)
 */
export function missingVisitAnswers(
  form: VisitForm
): { key: string; label: string; page: number }[] {
  const listDone = (f: NoneField) =>
    form[f].length > 0 ||
    form.noneFound.includes(f) ||
    (f === "dependencies" && derivedDependencies(form).length > 0);
  const confirmDone = (s: ConfirmSection) => !form.needsConfirm.includes(s) || form.confirmed.includes(s);
  const relations = effectiveRelations(form);
  /** เลือก "อื่น ๆ" แล้วต้องระบุด้วย */
  const otherDone = (f: OtherField) => !choseOther(form, f) || !!form.otherNotes?.[f]?.trim();
  const checks: [key: string, done: boolean][] = [
    ["3", form.members.length > 0 && form.members.every((m) => m.relation.trim() !== "")],
    ["confirm-household", confirmDone("household")],
    ["confirm-status", confirmDone("status")],
    ["4.1", listDone("dependencies")],
    ["4.2", form.housingType !== ""],
    ["4.3", listDone("housingConditions")],
    ["4.4", VEHICLE_OPTIONS.every((v) => form.vehicles[v.id] !== undefined)],
    ["4.5", form.farmland !== ""],
    ["5.1", form.hoursTogether.trim() !== ""],
    ["5.2", FAMILY_MEMBERS.every((m) => !!relations[m])],
    ["5.3", form.caretakerWhenAway !== "" && otherDone("caretakerWhenAway")],
    ["5.7", listDone("welfareReceived") && otherDone("welfareReceived")],
    ["6.1", listDone("healthRisks")],
    ["6.2", listDone("welfareRisks")],
    ["6.3", form.travelKm.trim() !== "" && form.travelMode !== "" && otherDone("travelMode")],
    ["6.4", listDone("duties") && otherDone("duties")],
    ["6.6", listDone("substances")],
    ["6.7", listDone("violence")],
    ["6.8", listDone("sexual")],
    ["6.9", listDone("gaming")],
    ["6.10", form.internet !== ""],
    ["6.11", listDone("devices")],
    ["informant", form.informant !== ""],
    ["canPhotoHome", !!form.canPhotoHome],
    ["photoType", form.canPhotoHome !== "yes" || form.photoType !== ""],
    ["photoReason", form.canPhotoHome !== "no" || (!!form.photoReason && otherDone("photoReason"))],
    // ช่องรูปแสดงหลังตอบว่าถ่ายรูปบ้านได้ไหม จึงเช็กหลังจากนั้น
    ["photos", !form.canPhotoHome || photoSlots(form.photoType).every((_, i) => !!form.photos?.[i])],
  ];
  const LABELS: Record<string, string> = {
    "confirm-household": "ยืนยันข้อ 3",
    "confirm-status": "ยืนยันข้อ 4",
    informant: "ผู้ให้ข้อมูล",
    canPhotoHome: "ถ่ายรูปบ้านได้ไหม",
    photoType: "ประเภทบ้าน",
    photos: "แนบรูปถ่าย",
    photoReason: "เหตุผลที่ถ่ายรูปบ้านไม่ได้",
  };
  return checks
    .filter(([, done]) => !done)
    .map(([key]) => ({ key, label: LABELS[key] ?? `ข้อ ${key}`, page: stepOf(key) }));
}

/** ขั้นของแบบฟอร์มที่ข้อนั้นอยู่ (ลำดับตาม VISIT_STEPS) */
export function stepOf(key: string): number {
  if (key === "confirm-household" || key === "3") return 0;
  if (key === "confirm-status" || key.startsWith("4.")) return 1;
  if (key.startsWith("5.")) return 2;
  if (key.startsWith("6.")) return 3;
  return 4;
}

/** หมวดความเสี่ยงของนักเรียน (ข้อ 6) ที่ใช้สรุปผลและเสนอเปิด case */
const RISK_GROUPS: [field: NoneField, options: CheckboxOption[]][] = [
  ["healthRisks", HEALTH_RISK_OPTIONS],
  ["welfareRisks", WELFARE_RISK_OPTIONS],
  ["substances", SUBSTANCE_OPTIONS],
  ["violence", VIOLENCE_OPTIONS],
  ["sexual", SEXUAL_OPTIONS],
  ["gaming", GAMING_OPTIONS],
];

export function visitRiskFindings(form: VisitForm): string[] {
  return RISK_GROUPS.flatMap(([field, options]) =>
    options.filter((o) => form[field].includes(o.id)).map((o) => o.label)
  );
}

/** เกณฑ์รายได้เฉลี่ยต่อคนต่อเดือนของการคัดกรองนักเรียนยากจน */
export const POVERTY_LINE = 3000;

/** รูปแทนสำหรับคำตอบตัวอย่าง (ภาพสีเทามีข้อความ) — ใช้แทนรูปถ่ายจริงตอนสาธิต */
const SAMPLE_PHOTO =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><rect width="640" height="420" fill="#e5e7eb"/><text x="320" y="215" font-size="28" text-anchor="middle" fill="#6b7280" font-family="sans-serif">ภาพตัวอย่าง (ต้นแบบ)</text></svg>`
  );

/**
 * PROTOTYPE ONLY — เติมคำตอบตัวอย่างให้ครบทุกข้อบังคับ สำหรับสาธิตโดยไม่ต้องกรอก 27 ข้อสด
 * เรื่องเข้ากับกรณีตัวอย่าง (ครอบครัวรายได้ต่ำ อยู่กับมารดาและยาย ขอทุนการศึกษา เล่นเกมเกิน 1 ชั่วโมง)
 * คงค่าที่ระบบกรอกให้แล้ว (สมาชิกตามทะเบียน ผู้ดูแลที่ผู้ปกครองเลือก ผู้ให้ข้อมูล) ครูตรวจทานและแก้ก่อนบันทึกได้
 */
export function sampleVisitForm(form: VisitForm): VisitForm {
  const [student, guardian] = form.members;
  const members: HouseholdMemberRow[] = [
    { ...(student ?? emptyMember("m1")), relation: "นักเรียน", age: 15 },
    {
      ...(guardian ?? emptyMember("m2")),
      relation: guardian?.relation || "มารดา",
      age: 38,
      income: { wage: 5000, agriculture: 0, business: 0, welfare: 0, other: 0 },
    },
    {
      ...emptyMember("m3"),
      relation: "ยาย",
      age: 62,
      income: { wage: 0, agriculture: 0, business: 0, welfare: 800, other: 0 },
    },
  ];
  return {
    ...form,
    occupation: form.occupation || "รับจ้างทั่วไป",
    education: form.education || "มัธยมศึกษาตอนต้น",
    members,
    housingType: form.housingType || "rent",
    vehicles: Object.fromEntries(VEHICLE_OPTIONS.map((v) => [v.id, form.vehicles[v.id] ?? false])),
    farmland: form.farmland || "no_land",
    hoursTogether: form.hoursTogether || "3",
    relations: { ...form.relations, "มารดา": "สนิทสนม", "ปู่ / ย่า / ตา / ยาย": "สนิทสนม" },
    caretakerWhenAway: form.caretakerWhenAway || "relative",
    supportRequests: ["economic"],
    welfareReceived: ["elderly_allowance"],
    guardianConcern: form.guardianConcern || "ห่วงเรื่องค่าใช้จ่ายในการเรียน และการใช้โทรศัพท์ของลูก",
    gaming: ["over_1h"],
    devices: ["social_1h"],
    duties: ["housework"],
    hobbies: ["games"],
    travelKm: form.travelKm || "4",
    travelHours: form.travelHours || "0",
    travelMinutes: form.travelMinutes || "20",
    travelMode: form.travelMode || "bus",
    internet: form.internet || "can_access",
    informant: form.informant || "มารดา",
    canPhotoHome: "no",
    photoType: SCHOOL_SIGN_PHOTO,
    photoReason: "guardian_declined",
    photos: [SAMPLE_PHOTO],
    // หมวดที่ไม่พบอะไร ถือว่าตรวจแล้ว
    noneFound: ["housingConditions", "healthRisks", "welfareRisks", "substances", "violence", "sexual"],
    needsConfirm: [],
    confirmed: [],
  };
}
