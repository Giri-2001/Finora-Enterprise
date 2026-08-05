/* ===========================================================
   FINORA ENTERPRISE OS™
   SMART WALL PAGINATION™

   PREMIUM PAGINATION
=========================================================== */

import type {
  SmartWallPaginationProps,
} from "./types";

import {
  IDS_PER_PAGE,
  CUSTOMERS_LABEL,
  PREVIOUS_LABEL,
  NEXT_LABEL,
} from "./constants";

import {
  buildTotalPages,
} from "./helpers";

import {
  containerStyle,
  buttonStyle,
  infoStyle,
  totalStyle,
} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function SmartWallPagination({

  currentPage,

  totalCustomers,

  customersPerPage = IDS_PER_PAGE,

  onPrevious,

  onNext,

}: SmartWallPaginationProps) {

  const totalPages =
    buildTotalPages(
      totalCustomers,
      customersPerPage,
    );

  return (

    <div style={containerStyle}>

      {/* ==========================================
          PREVIOUS
      ========================================== */}

      <button

        style={buttonStyle}

        onClick={onPrevious}

        disabled={currentPage <= 1}

      >

        {PREVIOUS_LABEL}

      </button>

      {/* ==========================================
          TOTAL CUSTOMERS
      ========================================== */}

      <div style={infoStyle}>

        <div style={totalStyle}>

          {totalCustomers} {CUSTOMERS_LABEL}

        </div>

      </div>

      {/* ==========================================
          NEXT
      ========================================== */}

      <button

        style={buttonStyle}

        onClick={onNext}

        disabled={
          currentPage >= totalPages
        }

      >

        {NEXT_LABEL}

      </button>

    </div>

  );

}
