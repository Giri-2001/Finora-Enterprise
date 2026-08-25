/* ===========================================================
   FINORA ENTERPRISE OS™

   LOAN CUSTOMER CARD™

   CUSTOMER SELECTION + IDENTITY

   Module  : Loan Studio
   Layer   : Loan Details
   Version : 2.2
   Status  : Production

   RESPONSIBILITY:

   - Customer selection
   - Customer search
   - Customer ID display
   - Customer phone display
   - Existing customer photo display
   - Automatic photo change when customer changes

   IMPORTANT:

   - No photo upload
   - No photo capture
   - No photo persistence
   - Existing CustomerProfile photo only
   - Existing dropdown behavior preserved
   - Customer ID + Phone displayed as compact inline rows
   - FINORA default identity shown when customer has no photo
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useMemo,
  useState,
} from "react";

import {
  detailStyle,
  searchInputStyle,
  selectorButtonStyle,
  selectorButtonTextStyle,
  selectorArrowStyle,
  dropdownStyle,
  customerOptionStyle,
  customerOptionActiveStyle,
  customerOptionNameStyle,
  customerOptionMetaStyle,
  emptyStateStyle,
} from "./LoanCustomerCard.styles";

import finoraLogo
  from "../../../app/assets/finoraenterprise.png";


/* ===========================================================
   TYPES
=========================================================== */

export interface LoanCustomerOption {

  customerId: string;

  customerName: string;

  phoneNumber?: string;

  /* Existing saved customer photo */
  photo?: string;

}


interface LoanCustomerCardProps {

  customerName?: string;

  customerId?: string;

  phoneNumber?: string;

  /* Existing saved photo of selected customer */
  photo?: string;

  customers?: LoanCustomerOption[];

  onCustomerSelect?: (
    customer: LoanCustomerOption,
  ) => void;

}


/* ===========================================================
   COMPONENT
=========================================================== */

export default function LoanCustomerCard({

  customerName = "",

  customerId = "--",

  phoneNumber = "--",

  photo,

  customers = [],

  onCustomerSelect,

}: LoanCustomerCardProps) {


  /* =========================================================
     SELECTOR STATE
  ========================================================= */

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);


  const [
    search,
    setSearch,
  ] = useState("");


  /* =========================================================
     FILTER CUSTOMERS
  ========================================================= */

  const filteredCustomers =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLowerCase();


        if (!query) {

          return customers;

        }


        return customers.filter(
          (
            customer,
          ) => {

            return (

              customer.customerName
                .toLowerCase()
                .includes(query)

              ||

              customer.customerId
                .toLowerCase()
                .includes(query)

              ||

              (
                customer.phoneNumber ??
                ""
              )
                .toLowerCase()
                .includes(query)

            );

          },
        );

      },
      [
        customers,
        search,
      ],
    );


  /* =========================================================
     SELECT CUSTOMER
  ========================================================= */

  function handleSelectCustomer(
    customer: LoanCustomerOption,
  ): void {

    onCustomerSelect?.(
      customer,
    );

    setSearch("");

    setIsOpen(false);

  }


  /* =========================================================
     UI
  ========================================================= */

  return (

    <div
      style={{
        width: "100%",
        height: "100%",
        minWidth: 0,
        minHeight: 0,

        boxSizing: "border-box",

        display: "flex",
        flexDirection: "column",

        padding: "16px 18px",

        background:
  "linear-gradient(180deg, var(--finora-theme-surface, #111C2E), var(--finora-theme-surface-muted, #142238))",

        border:
          "1px solid rgba(148,163,184,0.20)",

        borderRadius: "16px",

        color: "#FFFFFF",

        boxShadow:
          "0 8px 24px rgba(0,0,0,0.16)",

        overflow: "visible",

        position: "relative",

        zIndex: 10,
      }}
    >

      {/* ===================================================
          CUSTOMER SELECTOR
      =================================================== */}

      <div
        style={{
          position: "relative",

          width: "60%",

          minWidth: 0,

          maxWidth: "60%",

          zIndex: 20,
        }}
      >

        <button
          type="button"

          onClick={() =>
            setIsOpen(
              (previous) =>
                !previous,
            )
          }

          style={
            selectorButtonStyle
          }

          aria-haspopup="listbox"

          aria-expanded={
            isOpen
          }
        >

          <span
            style={
              selectorButtonTextStyle
            }
          >

            {customerName ||
              "Select Customer"}

          </span>


          <span
            style={
              selectorArrowStyle
            }
          >

            {isOpen
              ? "▲"
              : "▼"}

          </span>

        </button>


        {/* =================================================
            CUSTOMER DROPDOWN
        ================================================= */}

        {isOpen && (

          <div
            style={{
              ...dropdownStyle,

              position: "absolute",

              top: "calc(100% + 5px)",

              left: 0,

              right: 0,

              zIndex: 99999,

              overflowY: "auto",

              overflowX: "hidden",

              maxHeight: "280px",
            }}
          >

            {/* =============================================
                SEARCH
            ============================================= */}

            <input
              type="text"

              value={
                search
              }

              onChange={
                (event) =>
                  setSearch(
                    event.target.value,
                  )
              }

              placeholder="Search Customers..."

              autoFocus

              style={
                searchInputStyle
              }

              aria-label="Search Customers"
            />


            {/* =============================================
                CUSTOMER LIST
            ============================================= */}

            <div
              role="listbox"

              aria-label="Customer list"
            >

              {filteredCustomers.length > 0 ? (

                filteredCustomers.map(
                  (
                    customer,
                  ) => {

                    const active =
                      customer.customerId ===
                      customerId;


                    return (

                      <button
                        key={
                          customer.customerId
                        }

                        type="button"

                        role="option"

                        aria-selected={
                          active
                        }

                        onClick={() =>
                          handleSelectCustomer(
                            customer,
                          )
                        }

                        style={
                          active
                            ? customerOptionActiveStyle
                            : customerOptionStyle
                        }
                      >

                        <span
                          style={
                            customerOptionNameStyle
                          }
                        >

                          {
                            customer.customerName
                          }

                        </span>


                        <span
                          style={
                            customerOptionMetaStyle
                          }
                        >

                          {
                            customer.customerId
                          }

                          {"  •  "}

                          {
                            customer.phoneNumber ||
                            "--"
                          }

                        </span>

                      </button>

                    );

                  },
                )

              ) : (

                <div
                  style={
                    emptyStateStyle
                  }
                >

                  {
                    customers.length === 0
                      ? "No customers available."
                      : "No customers match your search."
                  }

                </div>

              )}

            </div>

          </div>

        )}

      </div>


      {/* ===================================================
          CUSTOMER INFORMATION + PHOTO

          IMPORTANT LAYOUT:

          - Selector remains in the normal left 50% area.
          - Customer ID + Phone remain below the selector.
          - ID and Phone are displayed as compact inline rows.
          - Photo is independent from that vertical flow.
          - Photo is positioned directly on the RIGHT side
            of the existing customer card.
          - Photo top aligns with the selector top.
          - No separate photo card / background.
      =================================================== */}


      {/* =================================================
          LEFT — CUSTOMER DETAILS
      ================================================= */}

      <div
        style={{
          width: "60%",

          minWidth: 0,

          marginTop: "15px",

          display: "flex",

          flexDirection: "column",

          gap: "10px",

          boxSizing: "border-box",

          overflow: "hidden",
        }}
      >

        {/* ===============================================
            CUSTOMER ID — ROW 1
        =============================================== */}

        <div
          style={{
            width: "100%",

            minWidth: 0,

            display: "flex",

            alignItems: "center",

            gap: "6px",

            boxSizing: "border-box",
          }}
        >

          <span
            style={{
              flexShrink: 0,

              fontSize: "12px",

              fontWeight: 600,

              letterSpacing: "0.25px",

              textTransform: "uppercase",

              color: "var(--finora-theme-text-muted)",

              whiteSpace: "nowrap",
            }}
          >

            CUST ID :

          </span>


          <span
            style={{
              minWidth: 0,

              flex: 1,

              fontSize: "12px",

              fontWeight: 600,

              color: "var(--finora-theme-text-primary)",

              lineHeight: 1.3,

              overflow: "visible",

              textOverflow: "clip",

              whiteSpace: "nowrap",
            }}

            title={
              customerId ||
              "--"
            }
          >

            {
              customerId ||
              "--"
            }

          </span>

        </div>


        {/* ===============================================
            PHONE NUMBER — ROW 2
        =============================================== */}

        <div
          style={{
            width: "100%",

            minWidth: 0,

            display: "flex",

            alignItems: "center",

            gap: "6px",

            boxSizing: "border-box",
          }}
        >

          <span
            style={{
              flexShrink: 0,

              fontSize: "12px",

              fontWeight: 600,

              letterSpacing: "0.95px",

              textTransform: "uppercase",

              color: "var(--finora-theme-text-muted)",

              whiteSpace: "nowrap",
            }}
          >

            PHONE :

          </span>


          <span
            style={{
              minWidth: 0,

              flex: 1,

              fontSize: "12px",

              fontWeight: 600,

              color: "var(--finora-theme-text-primary)",

              lineHeight: 1.3,

              letterSpacing: "0.8px",

              overflow: "hidden",

              textOverflow: "ellipsis",

              whiteSpace: "nowrap",
            }}

            title={
              phoneNumber ||
              "--"
            }
          >

            {
              phoneNumber ||
              "--"
            }

          </span>

        </div>

      </div>


      {/* =================================================
          RIGHT — CUSTOMER PHOTO

          The photo is absolutely positioned against the
          EXISTING customer selection card.

          Therefore the selector does NOT push the photo
          downward anymore.

          The photo starts at the same top padding as the
          selector and stays on the right side.

          IMPORTANT:

          If the customer has no saved photo, the same
          presentation area is filled with the FINORA
          default identity instead of showing "No Photo".
      ================================================= */}

      <div
        style={{
          position: "absolute",

          top: "11px",

          right: "15px",

          width: "52%",

          height: "105px",

          minWidth: 0,

          display: "flex",

          alignItems: "flex-start",

          justifyContent: "flex-end",

          overflow: "hidden",

          boxSizing: "border-box",

          pointerEvents: "none",

          zIndex: 5,
        }}
      >

        {photo ? (

          <img
            src={
              photo
            }

            alt={
              customerName ||
              "Customer"
            }

            style={{
              width: "auto",

              height: "105px",

              maxWidth: "100%",

              maxHeight: "105px",

              display: "block",

              objectFit: "contain",

              objectPosition: "top right",

              borderRadius: "6px",

              imageRendering: "auto",
            }}
          />

        ) : (

          /* =================================================
             DEFAULT FINORA IDENTITY

             Same presentation area.
             No "No Photo" text.
          ================================================= */

          <div
            style={{
              width: "96px",

              height: "105px",

              flexShrink: 0,

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              overflow: "hidden",

              borderRadius: "6px",

              border:
              "1px solid var(--finora-theme-border-strong, var(--finora-theme-border-default, #334155))",

            background:
              "linear-gradient(145deg, var(--finora-theme-surface-muted, #142238), var(--finora-theme-surface-strong, #0D192D))",

            boxShadow:
              "0 6px 18px var(--finora-theme-overlay-shadow, rgba(0,0,0,0.22))",

              boxSizing: "border-box",
            }}
          >

            <img
              src={
                finoraLogo
              }

              alt="FINORA"

              style={{
                width: "58%",

                height: "58%",

                objectFit: "contain",

                objectPosition: "center",

                display: "block",

                filter:
                  "drop-shadow(0 4px 8px rgba(0,0,0,0.35))",
              }}
            />

          </div>

        )}

      </div>

    </div>

  );

}


/* ===========================================================
   END
=========================================================== */
