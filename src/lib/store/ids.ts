/** รหัสชั่วคราวของบันทึกที่สร้างในต้นแบบ (ใช้ร่วมกันทุก slice เพื่อไม่ให้รหัสซ้ำกัน) */
let seq = 1000;

/** เลขลำดับถัดไป (ใช้ร่วมตัวนับเดียวกับ nextId) */
export const nextSeq = () => ++seq;

export const nextId = (prefix: string) => `${prefix}-${nextSeq()}`;
