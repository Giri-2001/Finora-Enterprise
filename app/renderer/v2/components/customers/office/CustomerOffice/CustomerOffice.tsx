/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER OFFICE™

   COMPONENT

   RESPONSIBILITY:
   - Render Customer Office
   - Consume Customer Responsive Engine
   - Keep responsive dimensions centralized
   - Preserve customer refresh behavior
=========================================================== */


/* ===========================================================
   IMPORTS
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
  useResponsive,
} from "../../../../utils/responsive";


import {
  createCustomerOfficeStyles,
} from "./styles";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerOffice({

  selectedCustomer,

}: CustomerOfficeProps) {


  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const {
    tokens,
  } = useResponsive();


  /* =========================================================
     RESPONSIVE STYLES
  ========================================================= */

  const {

    containerStyle,

    workspaceStyle,

    panelStyle,

  } =
    createCustomerOfficeStyles(
      tokens,
    );


  /* =========================================================
     EMPTY DESK
  ========================================================= */

  const emptyDesk =
    buildEmptyDesk();


  /* =========================================================
     CUSTOMER LOAN REFRESH LISTENER
  ========================================================= */

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


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <section
      style={containerStyle}
    >


      {/* ==========================================
          CUSTOMER WORKSPACE
      ========================================== */}

      {

        hasCustomer(
          selectedCustomer,
        )

          ? (

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

          : (

            <section
              style={{
                padding:
                  tokens.spacing.page,

                boxSizing:
                  "border-box",

                width:
                  "100%",
              }}
            >

              <div
                style={{
                  width:
                    "100%",

                  maxWidth:
                    tokens.modal.width,

                  margin:
                    "0 auto",
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


/* ===========================================================
   END
=========================================================== */