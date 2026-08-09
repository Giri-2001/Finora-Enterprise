/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER KYC DOCUMENT UPLOAD

   RESPONSIBILITY:
   - Document upload presentation state

   STYLES:
   DocumentUploader.styles.ts
=========================================================== */

import {
  cardStyle,
  titleStyle,
  statusStyle,
  textStyle,
} from "./DocumentUploader.styles";

/* ===========================================================
   TYPES
=========================================================== */

interface DocumentUploaderProps {
  documentName?: string;
  uploaded?: boolean;
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function DocumentUploader({
  documentName,
  uploaded,
}: DocumentUploaderProps) {

  return (
    <section style={cardStyle}>

      <h3 style={titleStyle}>
        Document Upload
      </h3>

      <div style={statusStyle}>
        {uploaded
          ? `Uploaded: ${documentName ?? "Document"}`
          : "⏳ No document uploaded yet"}
      </div>

      <p style={textStyle}>
        Drag & drop, camera capture, OCR and AI
        verification can be connected to this workspace
        in future releases.
      </p>

    </section>
  );
}
