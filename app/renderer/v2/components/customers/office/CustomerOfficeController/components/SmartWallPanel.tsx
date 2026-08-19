/* ===========================================================
   FINORA ENTERPRISE OS™

   SMART WALL PANEL™

   CUSTOMER HUB PRESENTATION

   RESPONSIVE MIGRATION:
   - All responsive sizing comes from Customers Responsive Engine
   - No viewport calculations in component
   - No breakpoint logic in component
   - Toolbar geometry comes from Customer Toolbar Engine
   - Buttons remain controlled by toolbar responsive tokens
   - Search uses the available center space
   - Existing customer-card behavior preserved
   - Customer ID Card code remains untouched
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useState,
} from "react";

import {
  UserPlus,
  SquarePen,
} from "lucide-react";

import CustomerSmartWall
  from "../../../smartwall/CustomerSmartWall";

import CustomerHangerRail
  from "../../../hub/sections/CustomerHangerRail";

import CustomerSearchBar
  from "../../../hub/topbar/components/CustomerSearchBar/CustomerSearchBar";

import CustomerHubSummaryCards
  from "./CustomerHubSummaryCards/CustomerHubSummaryCards";

import type {
  SmartWallPanelProps,
} from "./SmartWallPanel.types";

import {
  useCustomerResponsive,
} from "../../../../../utils/responsive/customers/customers.useResponsive";

import {
  getCustomerToolbarTokens,
} from "../../../../../utils/responsive/customers/customerToolbar.tokens";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function SmartWallPanel({

  title,

  smartWallCustomers,

  railCustomers,

  selectedCustomerId,

  selectedCustomer,

  onCustomerSelect,

  onOpenCustomerWizard,

  onEditCustomer,

  onClearSelection,

  currentPage,

  totalCustomers,

  customersPerPage,

  onPrevious,

  onNext,

}: SmartWallPanelProps) {


  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const {
    tokens,
  } =
    useCustomerResponsive();


  /* =========================================================
     CUSTOMER TOOLBAR RESPONSIVE ENGINE
  ========================================================= */

  const toolbar =
    getCustomerToolbarTokens(
      tokens.meta.viewport,
    );


  /* =========================================================
     SELECTION STATE
  ========================================================= */

  const hasSelectedCustomer =
    Boolean(
      selectedCustomer,
    );


  const [
    showEditHint,
    setShowEditHint,
  ] =
    useState(false);


  /* =========================================================
     TOOLBAR RESPONSIVE CONTRACT
  ========================================================= */

  /*
   * IMPORTANT
   *
   * Toolbar geometry belongs exclusively to the
   * Customer Toolbar Responsive Engine.
   *
   * SmartWallPanel does NOT calculate:
   *
   * - viewport width
   * - breakpoints
   * - responsive widths
   * - responsive gaps
   * - responsive heights
   *
   * It only consumes the resolved toolbar tokens.
   */

  const toolbarGridTemplateColumns =
    toolbar.gridTemplateColumns;


  const toolbarGridTemplateAreas =
    toolbar.gridTemplateAreas;


  const toolbarGap =
    toolbar.gap;


  const actionButtonWidth =
    toolbar.button.width;


  const actionButtonMaxWidth =
    toolbar.button.maxWidth;


  const actionButtonHeight =
    toolbar.button.height;


  const actionButtonMinHeight =
    toolbar.button.minHeight;


  const actionButtonFontSize =
    toolbar.button.fontSize;


  const actionButtonIconSize =
    toolbar.button.iconSize;


  const actionButtonPaddingX =
    toolbar.button.paddingX;


  const actionButtonGap =
    toolbar.button.gap;


  const actionButtonRadius =
    toolbar.button.radius;


  const searchMaxWidth =
    toolbar.search.maxWidth;


  const toolbarMarginBottom =
    tokens.spacing.inline +
    tokens.spacing.small;


  const wallSummaryMarginTop =
    tokens.spacing.small +
    tokens.spacing.inline;


  /* =========================================================
     ACTION BUTTON STYLE
  ========================================================= */

  const actionButtonStyle = {

    width:
      actionButtonWidth,

    maxWidth:
      actionButtonMaxWidth,

    minWidth:
      0,

    height:
      actionButtonHeight,

    minHeight:
      actionButtonMinHeight,

    padding:
      `0 ${actionButtonPaddingX}px`,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      actionButtonGap,

    borderRadius:
      actionButtonRadius,

    border:
      "none",

    cursor:
      "pointer",

    fontWeight:
      800,

    fontSize:
      actionButtonFontSize,

    lineHeight:
      1.1,

    color:
      "#FFFFFF",

    background:
      "linear-gradient(180deg,#C99A55,#8A612B)",

    boxShadow:
      "0 8px 20px rgba(0,0,0,.25)",

    transition:
      "transform .2s ease, box-shadow .2s ease",

    boxSizing:
      "border-box" as const,

    whiteSpace:
      "nowrap" as const,

    overflow:
      "hidden",

  };


  /* =========================================================
     TOOLBAR CELL STYLE
  ========================================================= */

  const toolbarCellStyle = {

    minWidth:
      0,

    display:
      "flex",

    alignItems:
      "center",

    boxSizing:
      "border-box" as const,

  };


  /* =========================================================
     ADD CUSTOMER CELL
  ========================================================= */

  const addCustomerCellStyle = {

    ...toolbarCellStyle,

    gridArea:
      "add",

    justifyContent:
      "flex-start",

  };


  /* =========================================================
     SEARCH CELL STYLE
  ========================================================= */

  const searchCellStyle = {

    ...toolbarCellStyle,

    gridArea:
      "search",

    width:
      "100%",

    justifyContent:
      "center",

  };


  /* =========================================================
     SEARCH WRAPPER STYLE
  ========================================================= */

  const searchWrapperStyle = {

    width:
      "100%",

    maxWidth:
      searchMaxWidth,

    minWidth:
      0,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    boxSizing:
      "border-box" as const,

  };


  /* =========================================================
     EDIT CUSTOMER CELL STYLE
  ========================================================= */

  const editCellStyle = {

    ...toolbarCellStyle,

    gridArea:
      "edit",

    position:
      "relative" as const,

    justifyContent:
      "flex-end",

  };


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <CustomerSmartWall

      title={
        title
      }

      customers={
        smartWallCustomers
      }

    >

      {/* =====================================================
          TOP TOOLBAR
      ===================================================== */}

      <div
        style={{

          display:
            "grid",

          gridTemplateColumns:
            toolbarGridTemplateColumns,

          gridTemplateAreas:
            toolbarGridTemplateAreas,

          alignItems:
            "center",

          width:
            "100%",

          minWidth:
            0,

          marginBottom:
            toolbarMarginBottom,

          gap:
            toolbarGap,

          boxSizing:
            "border-box",

        }}
      >

        {/* ===================================================
            LEFT — ADD CUSTOMER
        =================================================== */}

        <div
          style={
            addCustomerCellStyle
          }
        >

          <button

            type="button"

            onClick={
              onOpenCustomerWizard
            }

            aria-label="Add Customer"

            title="Add Customer"

            style={
              actionButtonStyle
            }

          >

            <UserPlus

              size={
                actionButtonIconSize
              }

              strokeWidth={
                2.2
              }

              aria-hidden="true"

            />

            <span
              style={{

                minWidth:
                  0,

                overflow:
                  "hidden",

                textOverflow:
                  "ellipsis",

              }}
            >
              Add Customer
            </span>

          </button>

        </div>


        {/* ===================================================
            CENTER — SEARCH
        =================================================== */}

        <div
          style={
            searchCellStyle
          }
        >

          <div
            style={
              searchWrapperStyle
            }
          >

            <CustomerSearchBar />

          </div>

        </div>


        {/* ===================================================
            RIGHT — EDIT CUSTOMER
        =================================================== */}

        <div

          style={
            editCellStyle
          }

          onMouseEnter={() => {

            setShowEditHint(
              true,
            );

          }}

          onMouseLeave={() => {

            setShowEditHint(
              false,
            );

          }}

        >

          <button

            type="button"

            onClick={() => {

              /* =============================================
                 NO CUSTOMER SELECTED
              ============================================= */

              if (
                !selectedCustomer
              ) {

                return;

              }


              /* =============================================
                 EDIT SELECTED CUSTOMER
              ============================================= */

              if (
                onEditCustomer
              ) {

                onEditCustomer(
                  selectedCustomer,
                );

              }

            }}

            aria-label="Edit Customer"

            title="Edit Customer"

            style={
              actionButtonStyle
            }

          >

            <SquarePen

              size={
                actionButtonIconSize
              }

              strokeWidth={
                2.2
              }

              aria-hidden="true"

            />

            <span
              style={{

                minWidth:
                  0,

                overflow:
                  "hidden",

                textOverflow:
                  "ellipsis",

              }}
            >
              Edit Customer
            </span>

          </button>


          {/* ================================================
              PREMIUM EDIT HINT
          ================================================= */}

          {showEditHint && (

            <div
              style={{

                position:
                  "absolute",

                top:
                  `calc(
                    100% +
                    ${tokens.spacing.inline}px
                  )`,

                right:
                  "0",

                zIndex:
                  1000,

                maxWidth:
                  "min(320px, 100%)",

                padding:
                  `${tokens.spacing.small + 3}px ${
                    tokens.spacing.medium + 2
                  }px`,

                borderRadius:
                  tokens.panel.radius,

                background:
                  "rgba(15,23,42,0.96)",

                color:
                  "#FFFFFF",

                fontSize:
                  tokens.typography.small,

                fontWeight:
                  700,

                whiteSpace:
                  "normal",

                textAlign:
                  "center",

                border:
                  "1px solid rgba(201,154,85,0.45)",

                boxShadow:
                  "0 8px 24px rgba(0,0,0,0.28)",

                pointerEvents:
                  "none",

                boxSizing:
                  "border-box" as const,

              }}
            >

              <div
                style={{

                  color:
                    hasSelectedCustomer
                      ? "#86EFAC"
                      : "#FCA5A5",

                  fontWeight:
                    500,

                  textShadow:
                    hasSelectedCustomer

                      ? "0 0 10px rgba(34,197,94,0.35)"

                      : "0 0 10px rgba(239,68,68,0.35)",

                }}
              >

                {
                  hasSelectedCustomer

                    ? "Edit Selected Customer"

                    : "Select a Customer to Continue"
                }

              </div>

            </div>

          )}

        </div>

      </div>


      {/* =====================================================
          CUSTOMER ID WALL
      ===================================================== */}

      <div

        style={{

          flex:
            1,

          minHeight:
            0,

          overflow:
            "hidden",

          position:
            "relative",

        }}

        onMouseDownCapture={(event) => {

          const target =
            event.target as HTMLElement;


          /*
           * =================================================
           * PROTECTED INTERACTIVE AREA
           *
           * Never clear selected customer while interacting
           * with a real interactive element.
           * =================================================
           */

          const protectedElement =
            target.closest(

              [

                '[data-finora-customer-card="true"]',

                '[data-finora-interactive="true"]',

                "button",

                "input",

                "textarea",

                "select",

                "a",

              ].join(","),

            );


          if (
            protectedElement
          ) {

            return;

          }


          /*
           * =================================================
           * EMPTY SMART WALL AREA
           *
           * Clicking genuinely empty wall space clears
           * selection.
           * =================================================
           */

          onClearSelection?.();

        }}

      >

        <CustomerHangerRail

          customers={
            railCustomers
          }

          selectedCustomerId={
            selectedCustomerId
          }

          onCustomerSelect={
            onCustomerSelect
          }

        />

      </div>


      {/* =====================================================
          CUSTOMER HUB SUMMARY
      ===================================================== */}

      <div
        style={{

          width:
            "100%",

          marginTop:
            wallSummaryMarginTop,

        }}
      >

        <CustomerHubSummaryCards

          totalCustomers={
            totalCustomers
          }

          activeCustomers={
            totalCustomers
          }

          currentPage={
            currentPage
          }

          totalPages={
            Math.ceil(
              totalCustomers /
              customersPerPage,
            )
          }

          onPrevious={
            onPrevious
          }

          onNext={
            onNext
          }

        />

      </div>

    </CustomerSmartWall>

  );

}


/* ===========================================================
   END
=========================================================== */