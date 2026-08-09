/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER IDENTITY PREVIEW CARD™

   LIVE CUSTOMER PREVIEW
=========================================================== */

import type {
  CSSProperties,
} from "react";

import {
  cardStyle,
  logoStyle,
  photoStyle,
  imageStyle,
  nameStyle,
  idStyle,
  infoLabelStyle,
  infoValueStyle,
  qrSectionStyle,
  qrTitleStyle,
  qrDescriptionStyle,
  statusStyle,
  footerStyle,
} from "./IdentityPreviewCard.styles";

/* ===========================================================
   TYPES
=========================================================== */

export interface IdentityPreviewCardProps {

  customerName: string;

  customerId: string;

  businessName: string;

  branchName: string;

  imageUrl: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function IdentityPreviewCard({

  customerName,

  customerId,

  businessName,

  branchName,

  imageUrl,

}: IdentityPreviewCardProps) {

  const displayName =
    customerName.trim() ||
    "Customer Name";

  return (

    <section
      style={cardStyle}
    >

      {/* =================================================
          FINORA BRAND
      ================================================= */}

      <div
        style={logoStyle}
      >

        FINORA ENTERPRISE

      </div>

      {/* =================================================
          CUSTOMER PHOTO
      ================================================= */}

      <div
        style={photoStyle}
      >

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

      {/* =================================================
          CUSTOMER NAME
      ================================================= */}

      <h2
        style={nameStyle}
      >

        {displayName}

      </h2>

      {/* =================================================
          CUSTOMER ID
      ================================================= */}

      <div
        style={idStyle}
      >

        {customerId}

      </div>

      {/* =================================================
          BUSINESS
      ================================================= */}

      <div
        style={infoLabelStyle}
      >

        Business

      </div>

      <div
        style={infoValueStyle}
      >

        {businessName}

      </div>

      {/* =================================================
          BRANCH
      ================================================= */}

      <div
        style={infoLabelStyle}
      >

        Branch

      </div>

      <div
        style={infoValueStyle}
      >

        {branchName}

      </div>

      {/* =================================================
          QR VERIFICATION
      ================================================= */}

      <div
        style={qrSectionStyle}
      >

        <div
          style={qrTitleStyle}
        >

          QR Verification

        </div>

        <div
          style={qrDescriptionStyle}
        >

          QR Code will be generated
          automatically after customer
          registration.

        </div>

      </div>

      {/* =================================================
          STATUS
      ================================================= */}

      <div
        style={statusStyle}
      >

        ● New Customer

      </div>

      {/* =================================================
          FOOTER
      ================================================= */}

      <div
        style={footerStyle}
      >

        Live FINORA Customer Identity
        Preview

      </div>

    </section>

  );

}
