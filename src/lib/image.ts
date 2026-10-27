/**
 * ย่อรูปในเครื่องก่อนแนบ — รูปจากมือถือมักใหญ่ 3–5 MB ส่งช้าเมื่อครูอยู่ในพื้นที่สัญญาณไม่ดี
 * PROTOTYPE: คืนค่าเป็น data URL เก็บไว้ในหน่วยความจำ (หายเมื่อรีเฟรช)
 * Project 2: อัปโหลดไฟล์ที่ย่อแล้วไปที่เก็บไฟล์บน server และเก็บแค่ลิงก์ไว้ในผลการเยี่ยมบ้าน
 */
export const PHOTO_MAX_SIDE = 1600;

export async function resizeImage(file: File, maxSide = PHOTO_MAX_SIDE, quality = 0.8): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}
