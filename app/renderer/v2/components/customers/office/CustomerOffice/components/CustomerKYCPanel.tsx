/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER KYC PANEL™

   WORK DESK ADAPTER
=========================================================== */

import KYCPreviewCard
  from "../../../kyc/KYCPreviewCard";

import type {
  OfficeCustomer,
} from "../types";

/* ===========================================================
   TYPES
=========================================================== */

interface CustomerKYCPanelProps {

  customer: OfficeCustomer;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerKYCPanel({

  customer,

}: CustomerKYCPanelProps) {

  return (

    <KYCPreviewCard

      value={{

        customerName:
          customer.name,

        aadhaarNumber:
          "--",

        panNumber:
          "--",

        verified:
          customer.kycVerified,

      }}

    />

  );

}
