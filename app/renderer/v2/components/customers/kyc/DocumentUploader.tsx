/* ===========================================================
   FINORA ENTERPRISE V2
   DOCUMENT UPLOADER
--------------------------------------------------------------
Customer KYC Document Upload
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

interface DocumentUploaderProps {

  documentName?: string;

  uploaded?: boolean;

}

/* ===========================================================
   STYLES
=========================================================== */

const cardStyle: CSSProperties = {

  padding: "24px",

  border: "2px dashed #d1d5db",

  borderRadius: "18px",

  background: "#ffffff",

  textAlign: "center",

};

const titleStyle: CSSProperties = {

  margin: 0,

  marginBottom: "12px",

  fontSize: "20px",

  fontWeight: 700,

};

const textStyle: CSSProperties = {

  color: "#6b7280",

  lineHeight: 1.6,

};

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

      <p style={textStyle}>

        {uploaded
          ? `Uploaded: ${documentName ?? "Document"}`
          : "No document uploaded yet."}

      </p>

      <p style={textStyle}>

        Future versions will support drag & drop,
        camera capture, OCR and AI verification.

      </p>

    </section>

  );

}
