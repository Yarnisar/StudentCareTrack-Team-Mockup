/** Documents slice: เอกสาร ปพ. ที่ออกแล้ว */

import { useMemo, useState } from "react";
import { educationDocuments as seedDocuments } from "../mock-data";
import type { EducationDocument } from "../types";
import type { PlatformSlice } from "./platform";

export interface DocumentsSlice {
  educationDocuments: EducationDocument[];
}

export function useDocumentsSlice(base: PlatformSlice): DocumentsSlice {
  const [educationDocuments] = useState<EducationDocument[]>(seedDocuments);

  return useMemo<DocumentsSlice>(() => {
    void base;
    return { educationDocuments };
  }, [base, educationDocuments]);
}
