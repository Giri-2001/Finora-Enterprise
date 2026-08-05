/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER SMART WALL™

   COMPONENT
=========================================================== */

import type {
  CustomerSmartWallProps,
} from "./types";

import {
  hasCustomers,
  buildEmptyLabel,
} from "./helpers";

import {
  containerStyle,
  railWrapperStyle,
  railStyle,
  hangerAreaStyle,
} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerSmartWall({

  customers = [],

  children,

}: CustomerSmartWallProps) {

  return (

    <section style={containerStyle}>

      {/* ==========================================
          TOP PREMIUM STEEL RAIL™
      ========================================== */}

      <div style={railWrapperStyle}>

        <div style={railStyle} />

      </div>

      {/* ==========================================
          SMART WALL CONTENT
      ========================================== */}

      <div style={hangerAreaStyle}>

        {

          hasCustomers(customers.length)

            ? children

            : buildEmptyLabel()

        }

      </div>

    </section>

  );

}
