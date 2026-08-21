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
// - Consume the active FINORA Theme Engine
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
// THEME CONTRACT:
//
// ThemeProvider
//      ↓
// useTheme()
//      ↓
// active FINORA theme
//      ↓
// theme.colors.background.page
//      ↓
// buildContainerStyle()
//      ↓
// Smart Wall workspace background
//
// - No Smart Wall background color is hard-coded here.
// - No local theme definition is created here.
// - Theme selection remains owned by ThemeProvider.
//
// VERSION : 2.2
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
  buildContainerStyle,
  railWrapperStyle,
  railStyle,
  hangerAreaStyle,
} from "./styles";


import {
  useTheme,
} from "../../../../themes/provider/ThemeProvider";


// ===========================================================
// COMPONENT
// ===========================================================

export default function CustomerSmartWall({

  customers = [],

  children,

}: CustomerSmartWallProps) {


  // =========================================================
  // FINORA THEME ENGINE
  //
  // ThemeProvider
  //      ↓
  // useTheme()
  //      ↓
  // active theme
  //
  // The Smart Wall receives its workspace background from
  // the currently active FINORA theme.
  // =========================================================

  const {
    theme,
  } =
    useTheme();


  // =========================================================
  // THEME SURFACE
  // =========================================================
  //
  // Smart Wall must not own its own background color.
  //
  // The active FINORA theme controls the page/workspace
  // background.
  //
  // =========================================================

  const smartWallBackground =
    theme
      .colors
      .background
      .page;


  // =========================================================
  // ROOT STYLE
  // =========================================================
  //
  // buildContainerStyle() owns Smart Wall presentation
  // geometry while the Theme Engine supplies the visual
  // background.
  //
  // =========================================================

  const smartWallContainerStyle =
    buildContainerStyle(
      smartWallBackground,
    );


  // =========================================================
  // CUSTOMER STATE
  // =========================================================

  const hasCustomerRecords =
    hasCustomers(
      customers.length,
    );


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <section
      style={
        smartWallContainerStyle
      }
    >

      {/* =====================================================
          TOP PREMIUM STEEL RAIL™
      ===================================================== */}

      <div
        style={
          railWrapperStyle
        }
      >

        <div
          style={
            railStyle
          }
        />

      </div>


      {/* =====================================================
          SMART WALL CONTENT
      ===================================================== */}

      <div
        style={{
          ...hangerAreaStyle,

          position:
            "relative",
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

              width:
                "100%",

              display:
                "flex",

              justifyContent:
                "center",

              alignItems:
                "center",

              pointerEvents:
                "none",

              marginTop:
                "14px",

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