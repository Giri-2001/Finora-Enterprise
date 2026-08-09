/* ===========================================================
   FINORA ENTERPRISE OS™

   SMART WALL PANEL™

   CUSTOMER HUB PRESENTATION
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
  from "../../../topbar/components/CustomerSearchBar/CustomerSearchBar";

import type {
  SmartWallPanelProps,
} from "./SmartWallPanel.types";

import CustomerHubSummaryCards
  from "./CustomerHubSummaryCards/CustomerHubSummaryCards";

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
     SELECTION STATE
  ========================================================= */

  const hasSelectedCustomer =
    Boolean(
      selectedCustomer,
    );

    const [
  showEditHint,
  setShowEditHint,
] = useState(false);

  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <CustomerSmartWall

      title={title}

      customers={
        smartWallCustomers
      }

    >

      {/* =====================================================
          TOP TOOLBAR
      ===================================================== */}

      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "260px minmax(420px,1fr) 260px",

          alignItems: "center",

          width: "100%",

          marginBottom: "14px",

          gap: "20px",
        }}
      >

        {/* ======================================
            LEFT — ADD CUSTOMER
        ====================================== */}

        <div>

          <button

            type="button"

            onClick={
              onOpenCustomerWizard
            }

            aria-label="Add Customer"

            title="Add Customer"

            style={{
              width: "160px",

              height: "42px",

              padding: "0",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              gap: "8px",

              borderRadius: "14px",

              border: "none",

              cursor: "pointer",

              fontWeight: 800,

              color: "#FFFFFF",

              background:
                "linear-gradient(180deg,#C99A55,#8A612B)",

              boxShadow:
                "0 8px 20px rgba(0,0,0,.25)",

              transition:
                "transform .2s ease, box-shadow .2s ease",
            }}

          >

            <UserPlus
              size={18}
              strokeWidth={2.2}
              aria-hidden="true"
            />

            <span>
              Add Customer
            </span>

          </button>

        </div>

        {/* ======================================
            CENTER — SEARCH
        ====================================== */}

        <div
          style={{
            display: "flex",

            justifyContent: "center",
          }}
        >

          <CustomerSearchBar />

        </div>

       {/* ======================================
    RIGHT — EDIT CUSTOMER
====================================== */}

<div
  style={{
    position: "relative",

    display: "flex",

    justifyContent: "flex-end",
  }}

  onMouseEnter={() => {
    setShowEditHint(true);
  }}

  onMouseLeave={() => {
    setShowEditHint(false);
  }}
>

  <button

    type="button"

    onClick={() => {

      /* =================================
         NO CUSTOMER SELECTED
      ================================= */

      if (!selectedCustomer) {

        return;

      }

      /* =================================
         EDIT SELECTED CUSTOMER
      ================================= */

      if (onEditCustomer) {

        onEditCustomer(
          selectedCustomer,
        );

      }

    }}

    aria-label="Edit Customer"

    style={{
      width: "160px",

      height: "42px",

      padding: "0",

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      gap: "8px",

      borderRadius: "14px",

      border: "none",

      cursor: "pointer",

      fontWeight: 800,

      color: "#FFFFFF",

      background:
        "linear-gradient(180deg,#C99A55,#8A612B)",

      boxShadow:
        "0 8px 20px rgba(0,0,0,.25)",

      transition:
        "transform .2s ease, box-shadow .2s ease",
    }}

  >

    <SquarePen
      size={18}
      strokeWidth={2.2}
      aria-hidden="true"
    />

    <span>
      Edit Customer
    </span>

  </button>

  {/* ======================================
      PREMIUM EDIT HINT
  ====================================== */}

  {showEditHint && (

    <div
      style={{
        position: "absolute",

        top: "calc(100% + 10px)",

        right: "0",

        zIndex: 1000,

        padding: "9px 14px",

        borderRadius: "10px",

        background:
          "rgba(15,23,42,0.96)",

        color: "#FFFFFF",

        fontSize: "12px",

        fontWeight: 700,

        whiteSpace: "nowrap",

        border:
          "1px solid rgba(201,154,85,0.45)",

        boxShadow:
          "0 8px 24px rgba(0,0,0,0.28)",

        pointerEvents: "none",
      }}
    >

      <div
  style={{
    color: hasSelectedCustomer
      ? "#86EFAC"
      : "#FCA5A5",

    fontWeight: 500,

    textShadow: hasSelectedCustomer
      ? "0 0 10px rgba(34,197,94,0.35)"
      : "0 0 10px rgba(239,68,68,0.35)",
  }}
>
  {hasSelectedCustomer
    ? "Edit Selected Customer"
    : "Select a Customer to Continue"}
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
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
    position: "relative",
  }}

  onMouseDownCapture={(event) => {

  const target =
    event.target as HTMLElement;

  /*
   * =========================================================
   * PROTECTED INTERACTIVE AREA
   *
   * Never clear the selected customer while interacting with
   * a real control.
   * =========================================================
   */

  const protectedElement =
    target.closest(
      [
        '[data-finora-customer-card="true"]',
        '[data-finora-interactive="true"]',
        'button',
        'input',
        'textarea',
        'select',
        'a',
      ].join(","),
    );

  if (protectedElement) {

    return;

  }

  /*
   * =========================================================
   * EMPTY SMART WALL AREA
   *
   * Clicking genuinely empty wall space clears selection.
   * =========================================================
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
          width: "100%",

          marginTop: "12px",
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
