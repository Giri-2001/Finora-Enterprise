/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER SELECTION HOOK™

   MANUAL SELECTION ENGINE
   -----------------------------------------------------------
   Customer automatically select avvakudadhu.
   User card click chesinappude selection create avvali.
=========================================================== */

import {
  useEffect,
  useState,
} from "react";

import type {
  OfficeCustomer,
} from "../../CustomerOffice/types";

/* ===========================================================
   HOOK
=========================================================== */

export default function useCustomerSelection(

  customers: OfficeCustomer[],

) {

/* ===========================================================
   STATE
=========================================================== */

const [
  selectedCustomer,
  setSelectedCustomer,
] = useState<
  OfficeCustomer | undefined
>(undefined);


/* ===========================================================
   SYNC SELECTED CUSTOMER
   -----------------------------------------------------------
   Existing selected customer data update ayithe
   latest customer object tho sync chestham.

   IMPORTANT:
   Empty selection ni automatic ga create cheyyamu.
=========================================================== */

useEffect(() => {

  if (!selectedCustomer) {

    return;

  }

  const updatedCustomer =
    customers.find(

      (customer) =>
        customer.id ===
        selectedCustomer.id,

    );

  if (!updatedCustomer) {

    /*
     * Selected customer current dataset lo
     * lekapothe selection clear.
     */

    setSelectedCustomer(
      undefined,
    );

    return;

  }

  if (
    updatedCustomer !==
    selectedCustomer
  ) {

    setSelectedCustomer(
      updatedCustomer,
    );

  }

}, [
  customers,
  selectedCustomer,
]);


/* ===========================================================
   SELECT CUSTOMER
   -----------------------------------------------------------
   Only explicit customer card click valla
   selection create avutundi.
=========================================================== */

function selectCustomer(

  customer: OfficeCustomer,

) {

  setSelectedCustomer(
    customer,
  );

}


/* ===========================================================
   CLEAR SELECTION
   -----------------------------------------------------------
   Reception empty area click chesinappudu
   selected customer completely remove chestham.
=========================================================== */

function clearSelection() {

  setSelectedCustomer(
    undefined,
  );

}


/* ===========================================================
   EXPORT
=========================================================== */

return {

  selectedCustomer,

  selectCustomer,

  clearSelection,

};

}
