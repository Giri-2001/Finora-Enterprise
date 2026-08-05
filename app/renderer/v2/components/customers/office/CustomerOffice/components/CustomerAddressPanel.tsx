/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER ADDRESS PANEL™

   WORK DESK ADAPTER
=========================================================== */

import AddressPreviewCard
  from "../../../address/AddressPreviewCard";

import type {
  OfficeCustomer,
} from "../types";

/* ===========================================================
   TYPES
=========================================================== */

interface CustomerAddressPanelProps {

  customer: OfficeCustomer;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerAddressPanel({

  customer,

}: CustomerAddressPanelProps) {

  return (

    <AddressPreviewCard

      value={{

        customerName:
          customer.name,

        currentAddress:
          "--",

        city:
          "--",

        state:
          "--",

        pinCode:
          "--",

      }}

    />

  );

}
