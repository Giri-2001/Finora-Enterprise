// ===========================================================
// FINORA ENTERPRISE OS™
// CUSTOMER SMART WALL™
//
// COMPONENT
//
// RESPONSIBILITY:
//
// - Render the FINORA Smart Customers Hub shell
// - Render toolbar / workspace children regardless of
//   customer count
// - Allow Add Customer when no customers exist
// - Preserve empty-state messaging
// - Preserve customer rail and pagination rendering
//
// IMPORTANT:
//
// - Empty customer state must NOT hide the Customer Office
//   controls.
// - Add Customer must remain accessible when customer count
//   is zero.
// - Existing children remain responsible for toolbar,
//   customer rail, search, edit and summary presentation.
//
// VERSION : 2.1
// STATUS  : Production
// ===========================================================

// ===========================================================
// IMPORTS
// ===========================================================

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

// ===========================================================
// COMPONENT
// ===========================================================

export default function CustomerSmartWall({
  customers = [],
  children,
}: CustomerSmartWallProps) {

  const hasCustomerRecords =
    hasCustomers(
      customers.length,
    );

  return (

    <section
      style={containerStyle}
    >

      {/* =====================================================
          TOP PREMIUM STEEL RAIL™
      ===================================================== */}

      <div
        style={railWrapperStyle}
      >

        <div
          style={railStyle}
        />

      </div>

      {/* =====================================================
          SMART WALL CONTENT
      ===================================================== */}

      <div
        style={{
          ...hangerAreaStyle,
          position: "relative",
        }}
      >

        {/* ===================================================
            CUSTOMER OFFICE CONTENT

            IMPORTANT:

            Children MUST ALWAYS render.

            Even when there are zero customers, the following
            controls must remain available:

            - Add Customer
            - Search Customers
            - Edit Customer
            - Customer Rail
            - Summary / Pagination

            This is required so the first customer can be
            created from an empty FINORA Customer Office.
        =================================================== */}

        {children}

        {/* ===================================================
            EMPTY CUSTOMER STATE

            The empty message is supplementary UI.

            It must NOT replace the Customer Office controls.
        =================================================== */}

        {!hasCustomerRecords && (

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              pointerEvents: "none",
              marginTop: "14px",
            }}
          >

            {buildEmptyLabel()}

          </div>

        )}

      </div>

    </section>

  );
}

// ===========================================================
// END
// ===========================================================
