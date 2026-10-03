/**
 * โครงสร้างแบบบันทึกการเยี่ยมบ้านนักเรียน (4 หน้า)
 * อ้างอิงแบบฟอร์มจริงของ สพฐ. ซึ่งรวมการคัดกรองนักเรียนยากจนไว้ด้วยกัน
 */

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

/** ผู้ให้ข้อมูลนักเรียน */
export const INFORMANT_OPTIONS = [
  "บิดา", "มารดา", "พี่ชาย", "พี่สาว", "น้า", "อา",
  "ป้า", "ลุง", "ปู่", "ย่า", "ตา", "ยาย",
  "ทวด", "พ่อเลี้ยง", "แม่เลี้ยง",
];

/** ประเภทภาพถ่ายที่แนบ (หน้า 4) */
export const PHOTO_TYPE_OPTIONS: CheckboxOption[] = [
  { id: "parents_home", label: "บ้านที่อาศัยอยู่กับพ่อแม่ (เป็นเจ้าของ / เช่า)" },
  { id: "relative_home", label: "บ้านของญาติ / ผู้ปกครองที่ไม่ใช่ญาติ" },
  { id: "institution", label: "บ้านหรือที่พักประเภท วัด มูลนิธิ หอพัก โรงงาน อยู่กับนายจ้าง" },
  {
    id: "school_sign",
    label: "ภาพนักเรียนและป้ายชื่อโรงเรียน เนื่องจากถ่ายภาพบ้านไม่ได้",
  },
];

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
