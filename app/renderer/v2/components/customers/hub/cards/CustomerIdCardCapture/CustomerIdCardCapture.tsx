/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER ID CARD CAPTURE™

   OFFSCREEN RENDER BOUNDARY

   RESPONSIBILITY:
   - Render the exact production CustomerIdCard
   - Provide a stable DOM target for html-to-image
   - Use the canonical Customer Responsive Engine tokens
   - Remain inside the existing FINORA ThemeProvider tree
   - Never persist Notification artifacts
   - Never access filesystem / storage / IPC

   IMPORTANT:
   - This component does NOT capture by itself.
   - This component does NOT call Notification services.
   - The parent capture service owns html-to-image.
   - The visible Customer Hub card is never modified.
=========================================================== */

import type {
  CSSProperties,
} from "react";

import CustomerIdCard from "../CustomerIdCard";

import {
  getCustomerTokens,
} from "../../../../../utils/responsive/customers/customers.tokens";

import type {
  CustomerProfile,
} from "../../../../../types/customers";

import {
  BRAND_NAME,
} from "../CustomerIdCard/constants";

/* ===========================================================
   PROPS
=========================================================== */

export interface CustomerIdCardCaptureProps {
  customer:
    CustomerProfile;

  companyName?:
    string;

  captureWidth?:
    number;

  captureHeight?:
    number;
}

/* ===========================================================
   DEFAULT CAPTURE GEOMETRY
=========================================================== */

export const DEFAULT_CAPTURE_WIDTH = 210;

export const DEFAULT_CAPTURE_HEIGHT = 360;

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerIdCardCapture({
  customer,
  companyName,
  captureWidth = DEFAULT_CAPTURE_WIDTH,
  captureHeight = DEFAULT_CAPTURE_HEIGHT,
}: CustomerIdCardCaptureProps) {

  const responsiveTokens =
    getCustomerTokens(
      captureWidth,
    );

  const customerName =
    customer.basic.displayName?.trim() ||
    customer.basic.fullName?.trim() ||
    "Unknown";

  const phoneNumber =
    customer.basic.mobileNumber?.trim() ||
    "";

  const branchName =
    customer.identity.businessName?.trim() ||
    "";

  const resolvedCompanyName =
    companyName?.trim() ||
    branchName ||
    BRAND_NAME;

  const kycVerified =
    customer.kyc?.overallStatus === "VERIFIED";

  const captureHostStyle:
    CSSProperties = {
      width:
        `${captureWidth}px`,

      height:
        `${captureHeight}px`,

      minWidth:
        `${captureWidth}px`,

      minHeight:
        `${captureHeight}px`,

      maxWidth:
        `${captureWidth}px`,

      maxHeight:
        `${captureHeight}px`,

      boxSizing:
        "border-box",

      position:
        "fixed",

      left:
        "-100000px",

      top:
        "0",

      margin:
        "0",

      padding:
        "0",

      overflow:
        "hidden",

      pointerEvents:
        "none",

      userSelect:
        "none",

      visibility:
        "visible",

      zIndex:
        -1,
    };

  return (
    <div
      data-finora-customer-id-card-capture="true"
      style={
        captureHostStyle
      }
    >
      <CustomerIdCard
        customerId={
          customer.identity.customerId
        }

        customerName={
          customerName
        }

        companyName={
          resolvedCompanyName
        }

        profilePhoto={
          customer.photo
        }

        phoneNumber={
          phoneNumber
        }

        branchName={
          branchName
        }

        kycVerified={
          kycVerified
        }

        active={
          true
        }

        responsiveTokens={
          responsiveTokens
        }

        compact={
          true
        }
      />
    </div>
  );
}

/* ===========================================================
   END
=========================================================== */


