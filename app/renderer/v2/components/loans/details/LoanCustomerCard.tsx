/* ===========================================================
FINORA ENTERPRISE V2
LOAN DETAILS STUDIO
LOAN CUSTOMER CARD
=========================================================== */


/* ===========================================================
IMPORTS
=========================================================== */


import {
  useMemo,
  useState,
} from "react";


import SummaryCard from "../../common/cards/SummaryCard";


import {
  cardStyle,
  contentStyle,
  customerNameStyle,
  detailStyle,
  selectorWrapperStyle,
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


/* ===========================================================
TYPES
=========================================================== */


export interface LoanCustomerOption {

  customerId: string;

  customerName: string;

  phoneNumber?: string;

}


interface LoanCustomerCardProps {

  customerName?: string;

  customerId?: string;

  phoneNumber?: string;

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

  customers = [],

  onCustomerSelect,

}: LoanCustomerCardProps) {


  // ==========================================================
  // SELECTOR STATE
  // ==========================================================

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);


  const [
    search,
    setSearch,
  ] = useState("");


  // ==========================================================
  // FILTER CUSTOMERS
  //
  // Search supports:
  // - Customer Name
  // - FIN-CUS Customer ID
  // - Phone Number
  // ==========================================================

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


  // ==========================================================
  // SELECT CUSTOMER
  // ==========================================================

  const handleSelectCustomer = (
    customer: LoanCustomerOption,
  ) => {

    onCustomerSelect?.(
      customer,
    );

    setSearch("");

    setIsOpen(false);

  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div style={cardStyle}>

      <SummaryCard
        title="Customer Information"
      >

        <div style={contentStyle}>


          {/* ==================================================
              CUSTOMER SELECTOR
          ================================================== */}

          <div style={selectorWrapperStyle}>


            <button
              type="button"
              onClick={() =>
                setIsOpen(
                  (previous) =>
                    !previous,
                )
              }
              style={selectorButtonStyle}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
            >

              <span
                style={selectorButtonTextStyle}
              >

                {customerName ||
                  "Select Customer"}

              </span>

              <span
                style={selectorArrowStyle}
              >

                {isOpen
                  ? "▲"
                  : "▼"}

              </span>

            </button>


            {isOpen && (

              <div
                style={dropdownStyle}
              >


                {/* SEARCH */}

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search Customers..."
                  autoFocus
                  style={searchInputStyle}
                  aria-label="Search Customers"
                />


                {/* CUSTOMER LIST */}

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
                      style={emptyStateStyle}
                    >

                      {customers.length === 0
                        ? "No customers available."
                        : "No customers match your search."}

                    </div>

                  )}

                </div>

              </div>

            )}

          </div>


          {/* ==================================================
              SELECTED CUSTOMER DETAILS
          ================================================== */}

          <span
            style={customerNameStyle}
          >

            {customerName ||
              "No customer selected"}

          </span>


          <span style={detailStyle}>

            Customer ID :
            {" "}
            {customerId || "--"}

          </span>


          <span style={detailStyle}>

            Phone :
            {" "}
            {phoneNumber || "--"}

          </span>


        </div>

      </SummaryCard>

    </div>

  );
}


/* ===========================================================
END
=========================================================== */
