/**
 * โครงสร้างแบบบันทึกการเยี่ยมบ้านนักเรียน (4 หน้า)
 * อ้างอิงแบบฟอร์มจริงของ สพฐ. ซึ่งรวมการคัดกรองนักเรียนยากจนไว้ด้วยกัน
 */

import type {
  HomeVisitForm,
  HomeVisitPhoto,
  HomeVisitPhotoType,
  HomeVisitRecordInput,
  HouseholdMember,
  IncomeKey,
} from "./types";

export interface CheckboxOption {
  id: string;
  label: string;
}

/** ข้อ 2 ประเภทความด้อยโอกาส (ไม่เลือกเลย = ไม่ด้อยโอกาส) */
export const DISADVANTAGE_OPTIONS: CheckboxOption[] = [
  { id: "poor", label: "เด็กยากจน" },
  { id: "aids", label: "เด็กที่ได้รับผลกระทบจากเอดส์" },
  { id: "sex_business", label: "เด็กที่อยู่ในธุรกิจทางเพศ" },
  { id: "abused", label: "เด็กที่ถูกทำร้ายทารุณ" },
  { id: "forced_labour", label: "เด็กที่ถูกบังคับให้ขายแรงงาน" },
  { id: "orphan", label: "เด็กกำพร้า" },
  { id: "drugs", label: "เด็กที่มีปัญหาเกี่ยวกับยาเสพติด" },
  { id: "minority", label: "เด็กชนกลุ่มน้อย" },
  { id: "juvenile", label: "เด็กในสถานพินิจและคุ้มครองเด็กและเยาวชน" },
  { id: "abandoned", label: "เด็กถูกทอดทิ้ง" },
  { id: "homeless", label: "เด็กเร่ร่อน" },
];

/** ข้อ 2 ประเภทความพิการ 9 ประเภท (ไม่เลือกเลย = ไม่พิการ) */
export const DISABILITY_OPTIONS: CheckboxOption[] = [
  { id: "physical", label: "บกพร่องทางร่างกายหรือสุขภาพ" },
  { id: "hearing", label: "บกพร่องทางการได้ยิน" },
  { id: "autistic", label: "ออทิสติก" },
  { id: "speech", label: "บกพร่องทางการพูดและภาษา" },
  { id: "vision", label: "บกพร่องทางการมองเห็น" },
  { id: "intellect", label: "บกพร่องทางสติปัญญา" },
  { id: "learning", label: "บกพร่องทางการเรียนรู้" },
  { id: "emotional", label: "บกพร่องทางพฤติกรรมหรืออารมณ์" },
  { id: "multiple", label: "ความพิการซ้อน" },
];

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

/** ข้อ 4.6 แหล่งไฟฟ้าหลักของที่พักอาศัย (ตอบเพียง 1 ข้อ) */
export const ELECTRICITY_OPTIONS: CheckboxOption[] = [
  { id: "none", label: "ไม่มีไฟฟ้า / ใช้เครื่องทำแสงสว่างอื่น ๆ" },
  { id: "meter", label: "มีไฟฟ้า — ไฟบ้านหรือมิเตอร์ของตนเอง" },
  { id: "shared", label: "มีไฟฟ้า — ไฟต่อพ่วงหรือแบตเตอรี่" },
  { id: "generator", label: "มีไฟฟ้า — เครื่องปั่นไฟหรือโซลาร์เซลล์" },
];

/** ข้อ 4.7 แหล่งน้ำดื่ม */
export const WATER_OPTIONS: CheckboxOption[] = [
  { id: "bottled", label: "น้ำดื่มบรรจุขวด / ตู้หยอดน้ำ" },
  { id: "tap", label: "น้ำประปา" },
  { id: "well", label: "น้ำบ่อ / น้ำบาดาล" },
  { id: "rain", label: "น้ำฝน / น้ำประปาภูเขา / ลำธาร" },
];

/** ข้อ 4.8 สภาพที่พักอาศัยและความปลอดภัยด้านภัยพิบัติ (ไม่เลือกเลย = ไม่มีความเสี่ยง) */
export const DISASTER_OPTIONS: CheckboxOption[] = [
  { id: "flood", label: "อาศัยอยู่ในพื้นที่อุทกภัย / น้ำท่วมซ้ำซาก" },
  { id: "storm", label: "อาศัยอยู่ในพื้นที่ที่เกิดวาตภัย" },
  { id: "landslide", label: "อาศัยอยู่ในพื้นที่แผ่นดินไหว / ดินโคลนถล่ม" },
  { id: "air_pollution", label: "อาศัยอยู่ในพื้นที่ที่มีมลพิษทางอากาศ" },
  { id: "noise_pollution", label: "อาศัยอยู่ในพื้นที่ที่มีมลพิษทางเสียง" },
  { id: "epidemic", label: "อาศัยอยู่ในพื้นที่โรคระบาด" },
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

/**
 * แถวของตารางความสัมพันธ์: ใช้สมาชิกครัวเรือนที่ครูกรอกไว้จริง (ไม่นับตัวนักเรียน)
 * แล้วต่อท้ายด้วยรายการมาตรฐานที่ยังไม่มี เพื่อให้ครบตามแบบฟอร์ม
 */
export function relationRowsOf(members: HouseholdMember[]): string[] {
  const fromMembers = members
    .map((m) => m.relation.trim())
    .filter((r) => r !== "" && r !== "นักเรียน" && r !== "ตัวนักเรียน");
  const rows = [...new Set(fromMembers)];
  for (const standard of FAMILY_MEMBERS) if (!rows.includes(standard)) rows.push(standard);
  return rows;
}

/** ข้อ 5.9 สถานภาพของบิดา-มารดา (ตอบเพียง 1 ข้อ) ตามแบบฟอร์มจริง ข้อ 7 */
export const PARENT_STATUS_OPTIONS: CheckboxOption[] = [
  { id: "together", label: "อยู่ด้วยกัน" },
  { id: "separated", label: "แยกกันอยู่" },
  { id: "divorced", label: "หย่าร้าง" },
  { id: "abandoned", label: "บิดา-มารดาทอดทิ้ง" },
  { id: "mother_deceased", label: "มารดาเสียชีวิต/สาบสูญ" },
  { id: "mother_remarried", label: "มารดาสมรสใหม่" },
  { id: "father_deceased", label: "บิดาเสียชีวิต/สาบสูญ" },
  { id: "father_remarried", label: "บิดาสมรสใหม่" },
  { id: "both_deceased", label: "บิดา-มารดาเสียชีวิต/สาบสูญ" },
  { id: "other", label: "อื่น ๆ (ระบุ)" },
];

/** ข้อ 5.10 ลำดับการเกิด */
export const SIBLING_KIND_OPTIONS: CheckboxOption[] = [
  { id: "only", label: "เป็นบุตรคนเดียว" },
  { id: "order", label: "เป็นบุตรคนที่" },
];

/** ข้อ 5.10 จำนวนพี่น้อง (ช่องตัวเลข) */
export const SIBLING_COUNT_FIELDS = [
  { key: "siblingsBrothers", label: "มีพี่ชาย/น้องชาย (บิดา-มารดาเดียวกัน)" },
  { key: "siblingsSisters", label: "มีพี่สาว/น้องสาว (บิดา-มารดาเดียวกัน)" },
  { key: "siblingsHalfOlder", label: "มีพี่ต่างบิดา-มารดา" },
  { key: "siblingsHalfYounger", label: "มีน้องต่างบิดา-มารดา" },
  { key: "siblingsStudying", label: "พี่น้องที่ศึกษาอยู่ (ไม่นับรวมตัวนักเรียน)" },
] as const satisfies readonly { key: keyof HomeVisitForm; label: string }[];

/** ข้อ 4.3 ลักษณะกายภาพของบ้าน (ตอบเพียง 1 ข้อ) ตามแบบฟอร์มจริง ข้อ 14 */
export const HOUSE_BUILDING_OPTIONS: CheckboxOption[] = [
  { id: "single_storey", label: "บ้านชั้นเดียว" },
  { id: "two_storey", label: "บ้านสองชั้น" },
  { id: "townhouse", label: "ทาวน์เฮ้าส์" },
  { id: "other", label: "อื่น ๆ (ระบุ)" },
];

/** ข้อ 5.11 ในครอบครัวนักเรียนสนิทสนมกับใครมากที่สุด (ไม่บังคับ) */
export const CLOSEST_TO_OPTIONS: CheckboxOption[] = [
  { id: "father", label: "บิดา" },
  { id: "mother", label: "มารดา" },
  { id: "older_brother", label: "พี่ชาย" },
  { id: "older_sister", label: "พี่สาว" },
  { id: "younger_brother", label: "น้องชาย" },
  { id: "younger_sister", label: "น้องสาว" },
  { id: "guardian", label: "ผู้ปกครอง" },
  { id: "other", label: "อื่น ๆ (ระบุ)" },
];

/** ข้อ 5.12 เมื่อทุกข์ใจ/มีปัญหา ส่วนใหญ่นักเรียนปรึกษาใคร (ไม่บังคับ) */
export const CONFIDE_IN_OPTIONS: CheckboxOption[] = [
  { id: "father", label: "บิดา" },
  { id: "mother", label: "มารดา" },
  { id: "guardian", label: "ผู้ปกครอง" },
  { id: "sibling", label: "พี่น้อง" },
  { id: "relative", label: "ญาติ" },
  { id: "friend", label: "เพื่อน" },
  { id: "teacher", label: "ครู" },
  { id: "online_friend", label: "เพื่อนในโลกออนไลน์" },
  { id: "keep_to_self", label: "เก็บไว้ในใจ ไม่เล่าให้ใครฟัง" },
  { id: "hotline", label: "Hotline (ระบุ)" },
  { id: "other", label: "อื่น ๆ (ระบุ)" },
];

/** ที่มาของภาพถ่ายที่พักอาศัย (ต่อการเยี่ยม) ตามแบบฟอร์มจริง ข้อ 12 */
export const PHOTO_SOURCE_OPTIONS: CheckboxOption[] = [
  { id: "teacher", label: "คุณครูเยี่ยมบ้านด้วยตนเอง" },
  { id: "student", label: "ให้นักเรียนถ่ายภาพมาให้" },
];

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

/** ผู้ที่นักเรียนอาศัยอยู่ด้วยจริง (ข้อมูลประกอบ ไม่เปลี่ยนสิทธิ์ของผู้ปกครองในระบบ) */
export const LIVES_WITH_OPTIONS: CheckboxOption[] = [
  { id: "บิดาและมารดา", label: "บิดาและมารดา" },
  { id: "บิดา", label: "บิดา" },
  { id: "มารดา", label: "มารดา" },
  { id: "ปู่ / ย่า / ตา / ยาย", label: "ปู่ / ย่า / ตา / ยาย" },
  { id: "ญาติ", label: "ญาติ" },
  { id: "อื่น ๆ (วัด มูลนิธิ หอพัก นายจ้าง)", label: "อื่น ๆ (วัด มูลนิธิ หอพัก นายจ้าง)" },
];

/** ลำดับช่องภาพถ่าย (หน้า 4) — กรณีเข้าบ้านไม่ได้ใช้ภาพคู่ป้ายโรงเรียนแทน */
export const PHOTO_SLOTS_HOME: HomeVisitPhotoType[] = ["exterior", "interior"];
export const PHOTO_SLOTS_INACCESSIBLE: HomeVisitPhotoType[] = ["with_signboard"];

/** ประเภทรายได้ตามแบบฟอร์ม (บาท/เดือน) */
export const INCOME_COLUMNS: readonly { key: IncomeKey; label: string }[] = [
  { key: "wage", label: "ค่าจ้าง / เงินเดือน" },
  { key: "agriculture", label: "ทางการเกษตร (หลังหักค่าใช้จ่าย)" },
  { key: "business", label: "ธุรกิจส่วนตัว (หลังหักค่าใช้จ่าย)" },
  { key: "welfare", label: "สวัสดิการจากรัฐ / เอกชน" },
  { key: "other", label: "รายได้จากแหล่งอื่น" },
]

export type { IncomeKey };
export type HouseholdMemberRow = HouseholdMember;

export function memberTotal(row: HouseholdMemberRow): number {
  return INCOME_COLUMNS.reduce((sum, col) => sum + (row.income[col.key] || 0), 0);
}

export function perCapitaIncome(members: HouseholdMember[]): number {
  if (members.length === 0) return 0;
  const total = members.reduce((sum, m) => sum + memberTotal(m), 0);
  return Math.round(total / members.length);
}

const ZERO_INCOME: Record<IncomeKey, number> = { wage: 0, agriculture: 0, business: 0, welfare: 0, other: 0 };

export function emptyMember(id: string): HouseholdMember {
  return { id, relation: "", age: "", disability: false, income: { ...ZERO_INCOME } };
}

export function emptyHomeVisitForm(): HomeVisitForm {
  return {
    guardianOccupation: "",
    guardianEducation: "",
    currentAddress: "",
    disadvantages: [],
    disabilities: [],
    members: [emptyMember("m1")],
    dependencies: [],
    housingType: "",
    housingConditions: [],
    vehicles: {},
    farmland: "",
    electricity: "",
    waterSources: [],
    disasterRisks: [],
    hoursTogether: "",
    relations: {},
    caretakerWhenAway: "",
    supportRequests: [],
    welfareReceived: [],
    guardianConcern: "",
    healthRisks: [],
    welfareRisks: [],
    travelKm: "",
    travelHours: "",
    travelMinutes: "",
    travelMode: "",
    duties: [],
    hobbies: [],
    substances: [],
    violence: [],
    sexual: [],
    gaming: [],
    internet: "",
    devices: [],
    friendInSchoolName: "",
    friendInSchoolRoom: "",
    friendInSchoolPhone: "",
    friendOutsideName: "",
    friendOutsidePhone: "",
    parentStatus: "",
    parentStatusOther: "",
    siblingKind: "",
    birthOrder: "",
    siblingsBrothers: "",
    siblingsSisters: "",
    siblingsHalfOlder: "",
    siblingsHalfYounger: "",
    siblingsStudying: "",
    houseBuilding: "",
    houseBuildingOther: "",
    closestTo: [],
    closestToOther: "",
    confideIn: [],
    confideInOther: "",
    confideInHotline: "",
    photoSource: "",
  };
}

export function emptyRecordInput(): HomeVisitRecordInput {
  return {
    form: emptyHomeVisitForm(),
    livesWith: "",
    informantName: "",
    informantRelation: "",
    cannotAccessHome: false,
    cannotAccessReason: "",
    photos: [],
  };
}

/** ข้อมูลที่ยกมาจากการเยี่ยมครั้งก่อน: สถานะครัวเรือนที่ไม่ค่อยเปลี่ยน (ไม่ยกความเสี่ยงรายปี ภาพ หรือการรับรอง) */
export const CARRIED_FORM_KEYS = [
  "guardianOccupation",
  "guardianEducation",
  "currentAddress",
  "disadvantages",
  "disabilities",
  "members",
  "dependencies",
  "housingType",
  "housingConditions",
  "vehicles",
  "farmland",
  "electricity",
  "waterSources",
  "disasterRisks",
  "hoursTogether",
  "caretakerWhenAway",
  "travelKm",
  "travelHours",
  "travelMinutes",
  "travelMode",
  "duties",
  "internet",
  "friendInSchoolName",
  "friendInSchoolRoom",
  "friendInSchoolPhone",
  "friendOutsideName",
  "friendOutsidePhone",
  "parentStatus",
  "parentStatusOther",
  "siblingKind",
  "birthOrder",
  "siblingsBrothers",
  "siblingsSisters",
  "siblingsHalfOlder",
  "siblingsHalfYounger",
  "siblingsStudying",
  "houseBuilding",
  "houseBuildingOther",
  "closestTo",
  "closestToOther",
  "confideIn",
  "confideInOther",
  "confideInHotline",
] as const satisfies readonly (keyof HomeVisitForm)[];

export type CarriedFormKey = (typeof CARRIED_FORM_KEYS)[number];

export function inputFromPrevious(previous: HomeVisitRecordInput): HomeVisitRecordInput {
  const form = emptyHomeVisitForm();
  const carried = Object.fromEntries(
    CARRIED_FORM_KEYS.map((k) => [k, structuredClone(previous.form[k])])
  ) as Partial<HomeVisitForm>;
  return { ...emptyRecordInput(), form: { ...form, ...carried }, livesWith: previous.livesWith };
}

/** สถานะของข้อมูลที่ยกมาจากการเยี่ยมครั้งก่อน: เหมือนเดิม หรือครูแก้ไขแล้ว */
export type CarryState = "same" | "changed";

/**
 * เทียบค่าปัจจุบันกับผลการเยี่ยมครั้งก่อน เฉพาะกลุ่มข้อมูลที่ยกมาให้
 * คืน map ของ key → "same" | "changed" (ไม่มีผลครั้งก่อน = map ว่าง)
 */
export function carryStates(
  form: HomeVisitForm,
  previous: HomeVisitRecordInput | undefined
): Map<CarriedFormKey, CarryState> {
  const map = new Map<CarriedFormKey, CarryState>();
  if (!previous) return map;
  for (const key of CARRIED_FORM_KEYS) {
    const before = JSON.stringify(previous.form[key] ?? null);
    const after = JSON.stringify(form[key] ?? null);
    map.set(key, before === after ? "same" : "changed");
  }
  return map;
}

/** รายการความเสี่ยงที่พบ (ข้อ 6) เป็นข้อความ สำหรับสรุปผล */
export function riskFindingLabels(form: HomeVisitForm): string[] {
  const groups: [string[], CheckboxOption[]][] = [
    [form.healthRisks, HEALTH_RISK_OPTIONS],
    [form.welfareRisks, WELFARE_RISK_OPTIONS],
    [form.substances, SUBSTANCE_OPTIONS],
    [form.violence, VIOLENCE_OPTIONS],
    [form.sexual, SEXUAL_OPTIONS],
    [form.gaming, GAMING_OPTIONS],
    [form.devices, DEVICE_OPTIONS],
  ];
  return groups.flatMap(([ids, opts]) =>
    ids.map((id) => opts.find((o) => o.id === id)?.label ?? id)
  );
}

/**
 * ตรวจก่อนรับรอง — คืนรายการข้อความที่ยังขาด (ว่าง = รับรองได้)
 * เข้าบ้านไม่ได้: ต้องมีเหตุผลและภาพคู่ป้ายโรงเรียน
 */
export function signBlockers(input: HomeVisitRecordInput): string[] {
  const issues: string[] = [];
  if (!input.informantRelation) issues.push("เลือกผู้ให้ข้อมูลนักเรียน");
  if (input.cannotAccessHome) {
    if (!input.cannotAccessReason.trim()) issues.push("ระบุเหตุผลที่เข้าเยี่ยมที่บ้านไม่ได้");
    if (!input.photos.some((p) => p.photoType === "with_signboard"))
      issues.push("แนบภาพนักเรียนคู่ป้ายชื่อโรงเรียน");
  } else {
    // แบบฟอร์มจริงบังคับ 2 ภาพ: ภายนอกที่พักอาศัย และภายในที่พักอาศัย
    if (!input.photos.some((p) => p.photoType === "exterior")) issues.push("แนบภาพภายนอกที่พักอาศัย");
    if (!input.photos.some((p) => p.photoType === "interior")) issues.push("แนบภาพภายในที่พักอาศัย");
  }
  return issues;
}

export function mockPhoto(photoType: HomeVisitPhotoType, uploadedAt: string, seq: number): HomeVisitPhoto {
  return {
    photoId: `PH-${seq}-${photoType}`,
    photoType,
    fileUrl: `mock://home-visit/${photoType}-${seq}.jpg`,
    uploadedAt,
  };
}

/* ------------------------------------------------------------------ */
/* เครื่องมือสาธิต: กรอกข้อมูลอัตโนมัติ                                  */
/* ------------------------------------------------------------------ */

function hashOf(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * ข้อมูลตัวอย่างสำหรับปุ่ม "กรอกข้อมูลอัตโนมัติ" ของแผงสาธิต (pure, ผลเหมือนเดิมทุกครั้งต่อนักเรียนคนเดิม)
 * - มีผลเยี่ยมครั้งก่อน: ยกข้อมูลครัวเรือนเดิมมา แล้วเติมส่วนที่เหลือ
 * - ไม่มี: สร้างข้อมูลตัวอย่างที่สมจริงจากรหัสนักเรียน
 * ไม่รับรองให้ — ครูยังต้องตรวจและกดรับรองเอง
 */
export function buildDemoAutofill({
  studentId,
  now,
  previous,
  informant,
  registryAddress,
}: {
  studentId: string;
  now: string;
  previous?: HomeVisitRecordInput;
  /** ผู้ปกครองที่เชื่อมกับนักเรียน (ใช้เป็นผู้ให้ข้อมูล) */
  informant?: { name: string; relation: string };
  /** ที่อยู่ตามทะเบียนบ้านจากทะเบียนนักเรียน (ใช้เติมที่อยู่ปัจจุบัน) */
  registryAddress?: string;
}): HomeVisitRecordInput {
  const h = hashOf(studentId);
  const pick = <T,>(list: readonly T[], salt: number): T => list[(h + salt) % list.length];

  const base = previous ? inputFromPrevious(previous) : emptyRecordInput();
  const form = base.form;

  if (!previous) {
    const fatherWage = 6000 + (h % 7) * 1500;
    const motherBusiness = (h >> 3) % 2 === 0 ? 0 : 2000 + ((h >> 5) % 4) * 1000;
    const withGrandparent = (h >> 2) % 3 === 0;
    form.guardianOccupation = pick(["รับจ้างทั่วไป", "ค้าขาย", "เกษตรกร", "พนักงานบริษัท"], 1);
    form.guardianEducation = pick(["ประถมศึกษา", "มัธยมศึกษาตอนต้น", "มัธยมศึกษาตอนปลาย / ปวช.", "ปริญญาตรี"], 2);
    form.members = [
      { ...emptyMember("m1"), relation: "บิดา", age: 40 + (h % 9), income: { ...ZERO_INCOME, wage: fatherWage } },
      { ...emptyMember("m2"), relation: "มารดา", age: 37 + ((h >> 4) % 8), income: { ...ZERO_INCOME, business: motherBusiness } },
      { ...emptyMember("m3"), relation: "นักเรียน", age: 15 },
      ...(withGrandparent
        ? [{ ...emptyMember("m4"), relation: "ยาย", age: 68 + (h % 7), income: { ...ZERO_INCOME, welfare: 600 } }]
        : []),
    ];
    form.dependencies = withGrandparent ? ["dep_elderly"] : [];
    form.housingType = pick(["own", "own", "rent", "with_others"], 3);
    form.vehicles = { car: false, pickup: (h >> 1) % 3 === 0, farm: false };
    form.farmland = pick(["no_land", "under_1_rai"], 4);
    form.hoursTogether = String(3 + (h % 4));
    form.caretakerWhenAway = withGrandparent ? "relative" : pick(["relative", "neighbor", "alone"], 5);
    form.travelKm = ((h % 60) / 10 + 1).toFixed(1);
    form.travelHours = "0";
    form.travelMinutes = String(10 + (h % 4) * 5);
    form.travelMode = pick(["motorcycle", "guardian", "bicycle", "school_bus"], 6);
    form.duties = ["housework"];
    form.internet = "can_access";
    form.currentAddress = registryAddress ?? "";
    form.disadvantages = fatherWage + motherBusiness < 9000 ? ["poor"] : [];
    form.disabilities = [];
    form.electricity = pick(["meter", "meter", "shared", "generator"], 10);
    form.waterSources = [pick(["bottled", "tap", "well", "rain"], 11)];
    form.disasterRisks = (h >> 7) % 3 === 0 ? [pick(["flood", "storm", "air_pollution"], 12)] : [];
    form.friendInSchoolName = pick(["ด.ช.วีระ สีขาว", "ด.ญ.พิมพ์ชนก ใจงาม", "ด.ช.ธนกร แก้วใส"], 13);
    form.friendInSchoolRoom = pick(["ม.3/1", "ม.3/2", "ม.3/3"], 14);
    form.friendInSchoolPhone = "08x-xxx-" + String(1000 + (h % 9000));
    form.friendOutsideName = (h >> 8) % 2 === 0 ? "เพื่อนบ้านวัยเดียวกัน (ไม่ได้เรียนที่โรงเรียนนี้)" : "";
    form.friendOutsidePhone = "";
    form.parentStatus = withGrandparent ? pick(["separated", "divorced"], 15) : "together";
    form.siblingKind = (h >> 9) % 3 === 0 ? "only" : "order";
    form.birthOrder = form.siblingKind === "order" ? String(1 + (h % 2)) : "";
    if (form.siblingKind === "order") {
      form.siblingsBrothers = String(h % 2);
      form.siblingsSisters = String(1 - (h % 2));
      form.siblingsStudying = "1";
    }
    form.houseBuilding = pick(["single_storey", "single_storey", "two_storey", "townhouse"], 16);
    form.closestTo = [pick(["mother", "father", "older_sister"], 17)];
    form.confideIn = [pick(["friend", "mother", "teacher"], 18)];
  }
  form.photoSource = "teacher";

  form.relations = Object.fromEntries(
    relationRowsOf(form.members).map((m, i) => [
      m,
      m === "บิดา" || m === "มารดา" ? "สนิทสนม" : m === "ญาติ" ? "เฉยๆ" : i % 2 === 0 ? "สนิทสนม" : "ไม่มี",
    ])
  );
  form.supportRequests = [pick(["academic", "economic", "behavior"], 7)];
  form.guardianConcern = pick(
    [
      "อยากให้ลูกตั้งใจเรียนมากขึ้น และลดเวลาเล่นโทรศัพท์",
      "เป็นห่วงเรื่องค่าใช้จ่ายในการเรียนต่อ",
      "อยากให้ครูช่วยดูเรื่องการคบเพื่อน",
    ],
    8
  );
  form.hobbies = [pick(["tv", "games", "reading", "friends"], 9)];
  form.devices = (h >> 6) % 2 === 0 ? ["social_1h"] : [];

  const relation =
    informant && INFORMANT_OPTIONS.includes(informant.relation)
      ? informant.relation
      : form.members.some((m) => m.relation === "มารดา")
        ? "มารดา"
        : "บิดา";
  return {
    ...base,
    form,
    livesWith: previous?.livesWith || (form.members.some((m) => m.relation === "ยาย") ? "ปู่ / ย่า / ตา / ยาย" : "บิดาและมารดา"),
    informantRelation: relation,
    informantName: informant?.name ?? "",
    cannotAccessHome: false,
    cannotAccessReason: "",
    photos: PHOTO_SLOTS_HOME.map((t, i) => mockPhoto(t, now, h + i)),
  };
}

/* ------------------------------------------------------------------ */
/* แปลงวันที่ พ.ศ. ↔ ช่องกรอกวันที่ของเบราว์เซอร์ (ค.ศ.)                  */
/* ------------------------------------------------------------------ */

/** "2570-02-18T15:30:00" → { date: "2027-02-18", time: "15:30" } */
export function toDateInputs(thaiIso: string): { date: string; time: string } {
  const [d, t = ""] = thaiIso.split("T");
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return { date: "", time: t.slice(0, 5) };
  return { date: `${Number(y) - 543}-${m}-${day}`, time: t.slice(0, 5) };
}

/** { date: "2027-02-18", time: "15:30" } → "2570-02-18T15:30:00" ("" ถ้ากรอกไม่ครบ) */
export function fromDateInputs(date: string, time: string): string {
  const [y, m, d] = date.split("-");
  if (!y || !m || !d || !/^\d{2}:\d{2}$/.test(time)) return "";
  return `${Number(y) + 543}-${m}-${d}T${time}:00`;
}
