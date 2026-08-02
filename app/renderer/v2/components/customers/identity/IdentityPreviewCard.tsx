/* ===========================================================
   FINORA ENTERPRISE V2
   IDENTITY PREVIEW CARD
--------------------------------------------------------------
Reusable Live Customer Identity Card
=========================================================== */

import type { CSSProperties } from "react";

export interface IdentityPreviewCardProps {

  customerName: string;

  customerId: string;

  businessName: string;

  branchName: string;

  imageUrl: string;

}

const cardStyle: CSSProperties = {

  width: "100%",

  maxWidth: "340px",

  borderRadius: "22px",

  background:
    "linear-gradient(135deg,#0f172a,#1e293b)",

  color: "#ffffff",

  padding: "24px",

  boxSizing: "border-box",

  boxShadow:
    "0 18px 40px rgba(15,23,42,.35)",

};

const logoStyle: CSSProperties = {

  fontSize: "12px",

  letterSpacing: "2px",

  opacity: .8,

  marginBottom: "18px",

};

const photoStyle: CSSProperties = {

  width: "110px",

  height: "110px",

  borderRadius: "18px",

  background: "#334155",

  display: "flex",

  justifyContent: "center",

  alignItems: "center",

  overflow: "hidden",

  marginBottom: "22px",

};

const imageStyle: CSSProperties = {

  width: "100%",

  height: "100%",

  objectFit: "cover",

};

const nameStyle: CSSProperties = {

  margin: 0,

  fontSize: "22px",

  fontWeight: 700,

};

const idStyle: CSSProperties = {

  marginTop: "10px",

  color: "#cbd5e1",

  fontSize: "13px",

  wordBreak: "break-word",

};

const infoLabelStyle: CSSProperties = {

  marginTop: "22px",

  fontSize: "11px",

  textTransform: "uppercase",

  opacity: .75,

};

const infoValueStyle: CSSProperties = {

  marginTop: "4px",

  fontWeight: 600,

};

export default function IdentityPreviewCard({

  customerName,

  customerId,

  businessName,

  branchName,

  imageUrl,

}: IdentityPreviewCardProps) {

  const displayName =

    customerName.trim() || "Customer Name";

      return (

    <section style={cardStyle}>

      <div style={logoStyle}>
        FINORA ENTERPRISE
      </div>

      <div style={photoStyle}>

        {imageUrl ? (

          <img
            src={imageUrl}
            alt="Customer"
            style={imageStyle}
          />

        ) : (

          <span>
            PHOTO
          </span>

        )}

      </div>

      <h2 style={nameStyle}>
        {displayName}
      </h2>

      <div style={idStyle}>
        {customerId}
      </div>

      <div style={infoLabelStyle}>
        Business
      </div>

      <div style={infoValueStyle}>
        {businessName}
      </div>

      <div style={infoLabelStyle}>
        Branch
      </div>

      <div style={infoValueStyle}>
        {branchName}
      </div>

      <div
        style={{
          marginTop: "28px",
          padding: "16px",
          borderRadius: "14px",
          background: "rgba(255,255,255,0.08)",
        }}
      >

        <div
          style={{
            fontWeight: 700,
            marginBottom: "10px",
          }}
        >
          QR Verification
        </div>

        <div
          style={{
            fontSize: "13px",
            opacity: 0.75,
            lineHeight: 1.6,
          }}
        >
          QR Code will be generated
          automatically after customer
          registration.
        </div>

      </div>

      <div
        style={{
          marginTop: "26px",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 14px",
          borderRadius: "999px",
          background: "rgba(34,197,94,.15)",
          color: "#86efac",
          fontSize: "13px",
          fontWeight: 600,
        }}
      >
        ● New Customer
      </div>

      <div
        style={{
          marginTop: "22px",
          paddingTop: "18px",
          borderTop: "1px solid rgba(255,255,255,.12)",
          fontSize: "11px",
          opacity: 0.65,
          lineHeight: 1.8,
        }}
      >
        This is a live preview of the
        FINORA Customer Identity Card.

        The same design will be reused
        for profile view, print,
        PDF export and customer sharing.
      </div>

    </section>

  );

}
