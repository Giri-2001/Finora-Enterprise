/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER IDENTITY PANEL™

   WORK DESK ADAPTER
=========================================================== */

import IdentityPreviewCard from "../../../identity/IdentityPreviewCard";

import type {
  OfficeCustomer,
} from "../types";

/* ===========================================================
   TYPES
=========================================================== */

interface CustomerIdentityPanelProps {

  customer: OfficeCustomer;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerIdentityPanel({

  customer,

}: CustomerIdentityPanelProps) {

  return (

    <IdentityPreviewCard

      customerName={
        customer.name
      }

      customerId={
        customer.id
      }

      businessName={
        customer.branch
      }

      branchName={
        customer.branch
      }

      imageUrl=""

    />

  );

}
