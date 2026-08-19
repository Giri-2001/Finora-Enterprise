/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER ACTIONS PANEL™

   COMPONENT
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  CUSTOMER_ACTIONS_TITLE,
} from "./constants";

import {
  buildCustomerActions,
} from "./helpers";

import {
  useResponsive,
} from "../../../../../../utils/responsive";

import {
  createCustomerActionsPanelStyles,
} from "./styles";

import type {
  CustomerActionsPanelProps,
} from "./types";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerActionsPanel(
  props: CustomerActionsPanelProps,
) {


  /* =========================================================
     RESPONSIVE TOKENS
  ========================================================= */

  const {
    tokens,
  } = useResponsive();


  /* =========================================================
     RESPONSIVE STYLES
  ========================================================= */

  const styles =
    createCustomerActionsPanelStyles(
      tokens,
    );


  /* =========================================================
     ACTIONS
  ========================================================= */

  const actions =
    buildCustomerActions(
      props,
    );


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <section
      style={
        styles.containerStyle
      }
    >

      {/* ======================================
          HEADER
      ====================================== */}

      <div
        style={
          styles.headerStyle
        }
      >

        {
          CUSTOMER_ACTIONS_TITLE
        }

      </div>


      {/* ======================================
          ACTION GRID
      ====================================== */}

      <div
        style={
          styles.gridStyle
        }
      >

        {
          actions.map(
            (action) => (

              <button

                key={
                  action.title
                }

                onClick={
                  action.onClick
                }

                style={
                  styles.buttonStyle
                }

              >

                <span>
                  {action.icon}
                </span>

                <span>
                  {action.title}
                </span>

              </button>

            ),
          )
        }

      </div>

    </section>

  );

}


/* ===========================================================
   END
=========================================================== */