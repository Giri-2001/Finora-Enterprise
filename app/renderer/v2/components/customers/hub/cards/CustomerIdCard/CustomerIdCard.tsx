/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER ID CARD™

   PREMIUM IDENTITY CARD COMPONENT

   Module  : Customer Hub
   Layer   : Cards
   Version : 2.5
   Status  : Production

   FINAL THEME / FONT CONTRACT
   -----------------------------------------------------------

   - Customer Responsive Engine owns geometry.
   - FINORA Theme Engine owns visual colours.
   - FINORA ENTERPRISE and the active Business name use the
     SAME TYPOGRAPHY FAMILY as the customer-name typography.
   - Brand/company text uses THEME.textPrimary so it never
     becomes a low-contrast purple/green/gold accent.
   - Customer name, phone and customer ID use the same
     high-contrast primary text colour.
   - KYC badge remains fully theme-linked.
   - No viewport detection.
   - No independent responsive sizing.
   - No layout / spacing changes are introduced by this fix.
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import finoraLogo from "../../../../../app/assets/finoraenterprise.png";

import type { CustomerIdCardProps } from "./types";

import { BRAND_NAME } from "./constants";

import {
  createCardStyle,
  createCardInnerStyle,
  createStatusHeaderStyle,
  createBrandStyle,
  createCompanyStyle,
  createPhotoStyle,
  createPhotoImageStyle,
  createLogoImageStyle,
  createNameStyle,
  createPhoneStyle,
  createCustomerIdStyle,
  createKycStyle,
} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerIdCard({
  customerId,

  customerName,

  companyName,

  phoneNumber,

  profilePhoto,

  kycVerified = false,

  responsiveTokens,

  compact = false,
}: CustomerIdCardProps) {
  /* =========================================================
     COMPATIBILITY
  ========================================================= */

  void compact;

  const resolvedCompanyName = companyName?.trim() || BRAND_NAME;

  /* =========================================================
     RESPONSIVE TOKEN CONTRACT

     CustomerIdCard never resolves breakpoints itself.

     Parent responsive layer supplies the resolved token set.
  ========================================================= */

  if (!responsiveTokens) {
    return null;
  }

  /* =========================================================
     RESPONSIVE STYLE CONTRACTS
  ========================================================= */

  const resolvedCardStyle = createCardStyle(responsiveTokens);

  const resolvedCardInnerStyle = createCardInnerStyle();

  const resolvedStatusHeaderStyle = createStatusHeaderStyle(responsiveTokens);

  const resolvedBrandStyle = createBrandStyle(responsiveTokens);

  const resolvedCompanyStyle = createCompanyStyle(responsiveTokens);

  const resolvedPhotoStyle = createPhotoStyle(responsiveTokens);

  const resolvedNameStyle = createNameStyle(responsiveTokens);

  const resolvedPhoneStyle = createPhoneStyle(responsiveTokens);

  const resolvedCustomerIdStyle = createCustomerIdStyle(responsiveTokens);

  const resolvedKycStyle = createKycStyle(responsiveTokens, kycVerified);

  /* =========================================================
     CARD PRESENTATION
     ---------------------------------------------------------
     Geometry continues to come entirely from the responsive
     style factory.
  ========================================================= */

  const presentationCardStyle = {
    ...resolvedCardStyle,

    boxSizing: "border-box" as const,

    position: "relative" as const,

    overflow: "hidden" as const,
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <article data-finora-customer-card="true" style={presentationCardStyle}>
      {/* =====================================================
          PREMIUM LAMINATE LAYER
      ===================================================== */}

      <div style={resolvedCardInnerStyle}>
        {/* =================================================
            STATUS STRIP

            Theme-aware through the existing style factory.
        ================================================= */}

        <div style={resolvedStatusHeaderStyle} />

        {/* =================================================
            FINORA BRAND

            IMPORTANT:
            Same font family / weight as customer name.
            Colour follows semantic primary text.
        ================================================= */}

        <div style={resolvedBrandStyle}>{BRAND_NAME}</div>

        {/* =================================================
            COMPANY NAME BAND
        ================================================= */}

        <div style={resolvedCompanyStyle}>{resolvedCompanyName}</div>

        {/* =================================================
            PROFILE PHOTO
        ================================================= */}

        <div style={resolvedPhotoStyle}>
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt={customerName || "Customer"}
              style={createPhotoImageStyle()}
            />
          ) : (
            <img src={finoraLogo} alt="FINORA" style={createLogoImageStyle()} />
          )}
        </div>

        {/* =================================================
            CUSTOMER NAME + PHONE
        ================================================= */}

        <div style={resolvedNameStyle}>
          {customerName || "Unknown"}

          {/* ===============================================
              PHONE

              Same primary text colour as the customer name.
              Existing responsive phone sizing is preserved.
          =============================================== */}

          <div style={resolvedPhoneStyle}>📞 {phoneNumber || "—"}</div>
        </div>

        {/* =================================================
            CUSTOMER ID

            Same semantic primary text colour as the
            customer name. No theme accent colour.
        ================================================= */}

        <div style={resolvedCustomerIdStyle}>{customerId}</div>

        {/* =================================================
            CUSTOMER STATUS / KYC

            Fully linked to the FINORA theme.
        ================================================= */}

        <div style={resolvedKycStyle}>
          <span aria-hidden="true">●</span>{" "}
          {kycVerified ? "KYC Verified" : "KYC Pending"}
        </div>
      </div>
    </article>
  );
}

/* ===========================================================
   END
=========================================================== */
