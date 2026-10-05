/** เอกสารประเมินผลทางการศึกษา (ปพ.) */

export type DocumentType = "ปพ.3" | "ปพ.4" | "ปพ.5" | "ปพ.6" | "ปพ.7";

export interface EducationDocument {
  docId: string;
  docType: DocumentType;
  target: string;
  /** userId ของผู้ออกเอกสาร */
  generatedBy: string;
  generatedAt: string;
}
