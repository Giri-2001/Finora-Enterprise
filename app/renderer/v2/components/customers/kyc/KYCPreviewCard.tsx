/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER KYC PREVIEW

   RESPONSIBILITY:
   - Live KYC preview presentation

   STYLES:
   KYCPreviewCard.styles.ts
=========================================================== */

import {
  cardStyle,
  titleStyle,
  subtitleStyle,
  rowStyle,
  labelStyle,
  valueStyle,
  statusStyle,
} from "./KYCPreviewCard.styles";

/* ===========================================================
   TYPES
=========================================================== */

export interface KYCPreviewData {
  customerName?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  verified?: boolean;
}

interface KYCPreviewCardProps {
  value: KYCPreviewData;
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function KYCPreviewCard({
  value,
}: KYCPreviewCardProps) {

  return (
    <section style={cardStyle}>

      <header>

        <h3 style={titleStyle}>
          KYC Preview
        </h3>

        <p style={subtitleStyle}>
          Live identity verification view
        </p>

      </header>

      <div style={rowStyle}>

        <span style={labelStyle}>
          Customer
        </span>

        <strong style={valueStyle}>
          {value.customerName || "--"}
        </strong>

      </div>

      <div style={rowStyle}>

        <span style={labelStyle}>
          Aadhaar
        </span>

        <strong style={valueStyle}>
          {value.aadhaarNumber || "--"}
        </strong>

      </div>

      <div style={rowStyle}>

        <span style={labelStyle}>
          PAN
        </span>

        <strong style={valueStyle}>
          {value.panNumber || "--"}
        </strong>

      </div>

      <div style={rowStyle}>

        <span style={labelStyle}>
          Status
        </span>

        <strong
          style={statusStyle(
            value.verified,
          )}
        >
          {value.verified
            ? "✓ Verified"
            : "⏳ Pending"}
        </strong>

      </div>

    </section>
  );
}
