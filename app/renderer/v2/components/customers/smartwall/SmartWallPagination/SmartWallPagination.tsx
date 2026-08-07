/* ===========================================================
   FINORA ENTERPRISE OS™
   SMART WALL PAGINATION™

   PREMIUM PAGINATION
=========================================================== */

import type {
  SmartWallPaginationProps,
} from "./types";

import {
  getPageDots,
} from "./helpers";

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

      {/* ==========================================
    PAGE DOTS
========================================== */}

<div
  style={{
    display:"flex",
    alignItems:"center",
    gap:"10px",
  }}
>

{
Array.from(
{
length: totalPages,
},
(_,index)=>(

<span
key={index}
style={{
width:"10px",
height:"10px",
borderRadius:"50%",
background:
currentPage === index + 1
? "#D4AF37"
: "rgba(255,255,255,.35)",
boxShadow:
currentPage === index + 1
?
"0 0 10px rgba(212,175,55,.8)"
:
"none",
}}
/>

))
}

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
