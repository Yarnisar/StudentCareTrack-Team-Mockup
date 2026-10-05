/** ข้อมูลตัวอย่าง: เอกสาร ปพ. ที่ออกแล้ว */

import type { EducationDocument } from "../types";
import { USER } from "./core";

export const educationDocuments: EducationDocument[] = [
  { docId: "DOC-001", docType: "ปพ.6", target: "ด.ญ. ชลิดา พากเพียร", generatedBy: USER.somying, generatedAt: "2570-02-16" },
  { docId: "DOC-002", docType: "ปพ.4", target: "ทั้งห้อง ม.3/1 (38 คน)", generatedBy: USER.somying, generatedAt: "2570-02-14" },
  { docId: "DOC-003", docType: "ปพ.7", target: "ด.ช. ธนากร รักเรียน", generatedBy: USER.admin, generatedAt: "2570-02-10" },
  { docId: "DOC-004", docType: "ปพ.5", target: "วิชาคณิตศาสตร์ ม.3/1", generatedBy: USER.wichai, generatedAt: "2570-02-02" },
];
