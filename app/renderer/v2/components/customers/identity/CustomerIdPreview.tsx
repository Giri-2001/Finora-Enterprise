/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER ID PREVIEW
--------------------------------------------------------------
Reusable FINORA Customer ID Preview
=========================================================== */

import type { CSSProperties } from "react";

interface CustomerIdPreviewProps {
  customerId: string;
}

const wrapperStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "14px",
  border: "1px solid #d1d5db",
  background: "#f9fafb",
};

const labelStyle: CSSProperties = {
  margin: 0,
  fontSize: "12px",
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const idStyle: CSSProperties = {
  marginTop: "10px",
  fontSize: "22px",
  fontWeight: 700,
  color: "#111827",
  wordBreak: "break-word",
};

const noteStyle: CSSProperties = {
  marginTop: "12px",
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: 1.6,
};

export default function CustomerIdPreview({
  customerId,
}: CustomerIdPreviewProps) {
  return (
    <section style={wrapperStyle}>

      <p style={labelStyle}>
        FINORA CUSTOMER ID
      </p>

      <div style={idStyle}>
        {customerId}
      </div>

      <div style={noteStyle}>
        This permanent FINORA Customer ID will be
        used across customer profile, loans,
        reports, receipts, PDF exports,
        WhatsApp sharing and future mobile login.
      </div>

    </section>
  );
}
