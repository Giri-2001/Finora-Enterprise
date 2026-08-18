/* ===========================================================
   FINORA ENTERPRISE OS™

   SMART WALL PANEL™

   CUSTOMER HUB PRESENTATION

   RESPONSIVE MIGRATION:
   - All responsive sizing comes from Customers Responsive Engine
   - No viewport calculations in component
   - No breakpoint logic in component
   - Existing behavior preserved
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
    layout,
  } =
    useCustomerResponsive();


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
     RESPONSIVE VALUES
  ========================================================= */

  const toolbarGridTemplateColumns =
    `minmax(160px, 260px) minmax(0, 1fr) minmax(160px, 260px)`;


  const actionButtonWidth =
    Math.min(
      160,
      Math.max(
        120,
        layout.grid.minCardWidth,
      ),
    );


  const actionButtonHeight =
    tokens.button.height;


  const actionButtonRadius =
    tokens.button.radius;


  const actionButtonFontSize =
    tokens.button.fontSize;


  const actionButtonIconSize =
    tokens.button.iconSize;


  const toolbarGap =
    tokens.card.gap;


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

    height:
      actionButtonHeight,

    minHeight:
      actionButtonHeight,

    padding:
      `0 ${tokens.button.paddingX}px`,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      tokens.control.gap,

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

          alignItems:
            "center",

          width:
            "100%",

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

        <div>

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

            <span>
              Add Customer
            </span>

          </button>

        </div>


        {/* ===================================================
            CENTER — SEARCH
        =================================================== */}

        <div
          style={{

            display:
              "flex",

            justifyContent:
              "center",

            minWidth:
              0,

            width:
              "100%",

          }}
        >

          <CustomerSearchBar />

        </div>


        {/* ===================================================
            RIGHT — EDIT CUSTOMER
        =================================================== */}

        <div

          style={{

            position:
              "relative",

            display:
              "flex",

            justifyContent:
              "flex-end",

            minWidth:
              0,

          }}

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

            <span>
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
                  `calc(100% + ${tokens.spacing.inline}px)`,

                right:
                  "0",

                zIndex:
                  1000,

                padding:
                  `${tokens.spacing.small + 3}px ${tokens.spacing.medium + 2}px`,

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
                  "nowrap",

                border:
                  "1px solid rgba(201,154,85,0.45)",

                boxShadow:
                  "0 8px 24px rgba(0,0,0,0.28)",

                pointerEvents:
                  "none",

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