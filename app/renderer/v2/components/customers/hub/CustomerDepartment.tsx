/* ===========================================================
FINORA ENTERPRISE OS™

CUSTOMER DEPARTMENT™

DIGITAL FINANCE OFFICE
=========================================================== */


import {
  useEffect,
  useMemo,
  useState,
} from "react";


import StudioLayout
from "../../common/layout/StudioLayout";


import CustomerOfficeController
from "../office/CustomerOfficeController";


import CustomerWizard
from "../wizard/CustomerWizard";


import {
  getCustomers,
} from "../../../store/customers/customer.store";


import customerOfficeMapper
from "../office/CustomerOfficeController/mappers/customerOfficeMapper";



/* ===========================================================
COMPONENT
=========================================================== */


export default function CustomerDepartment() {



  const [
    showCustomerWizard,
    setShowCustomerWizard,
  ] = useState(false);



  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);




  /* ==========================================
     FINORA DATA UPDATE LISTENER
  ========================================== */


  useEffect(() => {


    function handleLoanUpdate() {


      console.log(
        "FINORA CUSTOMER DATA REFRESH",
      );


      setRefreshKey(

        (previous) => previous + 1,

      );


    }



    window.addEventListener(

      "FINORA_LOAN_UPDATED",

      handleLoanUpdate,

    );



    return () => {


      window.removeEventListener(

        "FINORA_LOAN_UPDATED",

        handleLoanUpdate,

      );


    };


  }, []);





  const customers = useMemo(() => {


    return customerOfficeMapper(

      getCustomers(),

    );


  }, [

    refreshKey,

  ]);






  return (



    <StudioLayout
  department="Customers Hub"
  allowScroll={false}
>




      {/* ==========================================
          CUSTOMER OFFICE CONTENT ONLY

          HEADER REMOVED
          RECEPTION STYLE VIEW
      ========================================== */}




      {


        showCustomerWizard


        ?


        (

          <CustomerWizard />

        )


        :


        (

          <CustomerOfficeController

            customers={customers}

          />

        )


      }



    </StudioLayout>



  );

}
