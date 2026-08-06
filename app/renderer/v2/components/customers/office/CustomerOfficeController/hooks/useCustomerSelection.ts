/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER SELECTION HOOK™

   AUTO SELECTION ENGINE
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


  /* ==========================================
     STATE
  ========================================== */


  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState<
    OfficeCustomer | undefined
  >(undefined);





  /* ==========================================
     AUTO SELECT FIRST CUSTOMER
  ========================================== */


  useEffect(() => {


    if (

      !selectedCustomer &&

      customers.length > 0

    ) {


      setSelectedCustomer(

        customers[0],

      );


    }


  }, [

    customers,

    selectedCustomer,

  ]);






  /* ==========================================
     SYNC SELECTED CUSTOMER
  ========================================== */


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



    if (

      updatedCustomer &&

      updatedCustomer !== selectedCustomer

    ) {


      setSelectedCustomer(

        updatedCustomer,

      );


    }



  }, [

    customers,

    selectedCustomer,

  ]);







  /* ==========================================
     ACTIONS
  ========================================== */


  function selectCustomer(

    customer: OfficeCustomer,

  ) {


    setSelectedCustomer(

      customer,

    );


  }





  function clearSelection() {


    setSelectedCustomer(

      undefined,

    );


  }





  /* ==========================================
     EXPORT
  ========================================== */


  return {


    selectedCustomer,


    selectCustomer,


    clearSelection,


  };


}
