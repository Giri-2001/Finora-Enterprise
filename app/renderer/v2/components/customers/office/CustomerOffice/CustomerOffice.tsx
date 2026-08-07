/* ===========================================================
FINORA ENTERPRISE OS™

CUSTOMER OFFICE™

COMPONENT
=========================================================== */


import {
  useEffect,
} from "react";


import EmptyState
from "../../../common/feedback/EmptyState";


import CustomerWorkspace
from "../CustomerWorkspace";


import {

  hasCustomer,

  buildEmptyDesk,

} from "./helpers";


import type {

  CustomerOfficeProps,

} from "./types";


import {

  containerStyle,

  workspaceStyle,

  panelStyle,

} from "./styles";



/* ===========================================================
COMPONENT
=========================================================== */


export default function CustomerOffice({

  selectedCustomer,

}: CustomerOfficeProps) {


  const emptyDesk =
    buildEmptyDesk();



  /* ==========================================
     CUSTOMER LOAN REFRESH LISTENER
  ========================================== */


  useEffect(() => {


    function refreshCustomerLoans() {


      console.log(
        "FINORA LOAN UPDATE RECEIVED",
      );


      window.dispatchEvent(
        new Event(
          "FINORA_CUSTOMER_REFRESH",
        ),
      );


    }



    window.addEventListener(

      "FINORA_LOAN_UPDATED",

      refreshCustomerLoans,

    );



    return () => {


      window.removeEventListener(

        "FINORA_LOAN_UPDATED",

        refreshCustomerLoans,

      );


    };


  }, []);




  return (


    <section

      style={containerStyle}

    >



      {/* ==========================================
          WORKSPACE ONLY

          HEADER REMOVED
          FULL RECEPTION VIEW
      ========================================== */}



      {


        hasCustomer(

          selectedCustomer,

        )


        ?


        (


          <section

            style={workspaceStyle}

          >



            <div

              style={panelStyle}

            >


              <CustomerWorkspace

                selectedCustomer={
                  selectedCustomer
                }

              />


            </div>



          </section>


        )


        :


        (


          <section

            style={{

              padding:"24px",

            }}

          >



            <div

              style={{

                maxWidth:"520px",

                margin:"0 auto",

              }}

            >


              <EmptyState


                title={
                  emptyDesk.title
                }


                description={
                  emptyDesk.description
                }


              />


            </div>



          </section>


        )


      }



    </section>


  );


}
