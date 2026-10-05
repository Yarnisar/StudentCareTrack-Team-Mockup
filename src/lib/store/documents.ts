/** Documents slice: เอกสาร ปพ. ที่ออกแล้ว */

import { useMemo, useState } from "react";
import { educationDocuments as seedDocuments } from "../mock-data";
import type { EducationDocument } from "../types";
import type { CoreSlice } from "./core";

export interface DocumentsSlice {
  educationDocuments: EducationDocument[];
}

export function useDocumentsSlice(core: CoreSlice): DocumentsSlice {
  const [educationDocuments] = useState<EducationDocument[]>(seedDocuments);

  return useMemo<DocumentsSlice>(() => {
    void core;
    return { educationDocuments };
  }, [core, educationDocuments]);
}
