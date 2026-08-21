/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER OFFICE™

   COMPONENT

   RESPONSIBILITY:
   - Render Customer Office
   - Consume Customer Responsive Engine
   - Consume FINORA Theme Engine
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
  useTheme,
} from "../../../../themes/provider/ThemeProvider";


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
     ---------------------------------------------------------
     All responsive dimensions continue to come from the
     FINORA Responsive Engine.

     DO NOT move responsive geometry into Theme Engine.
  ========================================================= */

  const {
    tokens,
  } = useResponsive();


  /* =========================================================
     THEME ENGINE
     ---------------------------------------------------------
     Theme controls visual appearance only.

     No width / height / padding / gap / radius decisions
     are made here.
  ========================================================= */

  const {
    theme,
  } = useTheme();


  /* =========================================================
     RESPONSIVE + THEME STYLES
  ========================================================= */

  const {

    containerStyle,

    workspaceStyle,

    panelStyle,

  } =
    createCustomerOfficeStyles(
      tokens,
      theme,
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