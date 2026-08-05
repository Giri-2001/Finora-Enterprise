/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER HANGER™

   PREMIUM HANGING ANIMATION
=========================================================== */

import {
  useState,
} from "react";


import CustomerCardFlip from "../CustomerCardFlip";
import CustomerIdCard from "../CustomerIdCard";

import type {
  CustomerHangerProps,
} from "./types";

import {
  canOpen,
} from "./helpers";

import {
  containerStyle,
  pinStyle,
  ropeStyle,
  hangerStyle,
  cardContainerStyle,
} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerHanger({

  customer,

  onClick,

  flipped = false,

  onFlip,

}: CustomerHangerProps) {

const {

  id,

  name,

  branch,

  active,

  kycVerified,

  outstandingAmount,

  totalLoans,

activeLoans,

closedLoans,


  /* ==========================================
     BACK SIDE DETAILS
  ========================================== */

  fatherName,

  village,

  mandal,

  district,

  customerSince,


} = customer;

  /* ===========================================================
     ANIMATION STATE
  =========================================================== */

  const [isFlipped, setIsFlipped] =
  useState(false);


  /* ===========================================================
     HANGING PHYSICS
  =========================================================== */

  /* ===========================================================
     UI
  =========================================================== */

  return (

    <div

     style={{

  ...containerStyle,

}}

      onClick={() => {

        if (

          !canOpen(active)

        ) {

          return;

        }

        setIsFlipped(
  !isFlipped,
);

onFlip?.();

onClick?.(
  customer,
);

      }}

    >

      {/* ==========================================
          PIN
      ========================================== */}

      <div style={pinStyle} />

      {/* ==========================================
          ROPE
      ========================================== */}

      <div style={ropeStyle} />


      <div
  style={{
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background:
      "linear-gradient(180deg,#D6B06A,#8A612B)",
    border: "1px solid #6B4B1D",
    marginTop: "-5px",
    marginBottom: "4px",
    zIndex: 4,
    boxShadow:
      "0 1px 2px rgba(0,0,0,.25)",
  }}
/>

{/* ==========================================
    METAL CLIP
========================================== */}

<div
  style={{
    width: "34px",
    height: "12px",
    borderRadius: "4px",
    background:
      "linear-gradient(180deg,#F8FAFC,#CBD5E1,#94A3B8)",
    border: "1px solid #94A3B8",
    boxShadow:
      "0 2px 4px rgba(15,23,42,.18)",
    marginTop: "-2px",
    zIndex: 3,
  }}
/>

      {/* ==========================================
          HANGER
      ========================================== */}

      <div style={hangerStyle} />

      {/* ==========================================
          CARD
      ========================================== */}

      <div

  style={{

  ...cardContainerStyle,

  width: "190px",

  maxWidth: "190px",

}}

>

        <CustomerCardFlip

          front={

            <CustomerIdCard

              customerId={id}

              customerName={name}

              branchName={branch}

              kycVerified={kycVerified}

            />

          }

         back={

<div

style={{

width:175,

height:285,

maxHeight:"285px",

overflow:"hidden",

borderRadius:18,

background:
"linear-gradient(180deg,#FFFFFF,#F8FAFC)",

color:"#1F2937",

padding:"16px",

display:"flex",

justifyContent:"flex-start",

flexDirection:"column",

boxSizing:"border-box",

border:"1px solid rgba(180,145,82,.35)",

boxShadow:
"0 12px 25px rgba(0,0,0,.18)",

}}

>


{/* HEADER */}

<div

style={{

marginTop:"-8px",

fontSize:"11px",

fontWeight:600,

whiteSpace:"nowrap",

color:"#111827",

}}

>

{id}

</div>



{/* DETAILS */}

<div
style={{
  marginTop:"8px",
  fontSize:"10px",
  lineHeight:"1.8",
  color:"#374151",
}}
>

<div style={{display:"flex"}}>

  <span
    style={{
      width:"55px",
      fontWeight:700,
      textTransform:"uppercase",
    }}
  >
    Family
  </span>

  <span>
    :
  </span>

  <span
    style={{
      marginLeft:"6px",
    }}
  >
    {fatherName || "—"}
  </span>

</div>


<div style={{display:"flex"}}>
  <span style={{width:"55px", fontWeight:700, textTransform:"uppercase"}}>
    Village
  </span>

  <span>
    :
  </span>

  <span style={{marginLeft:"6px"}}>
    {village || "—"}
  </span>

</div>


<div style={{display:"flex"}}>
  <span style={{width:"55px", fontWeight:700, textTransform:"uppercase"}}>
    Mandal
  </span>

  <span>
    :
  </span>

  <span style={{marginLeft:"6px"}}>
    {mandal || "—"}
  </span>

</div>


<div style={{display:"flex"}}>
  <span style={{width:"55px", fontWeight:700, textTransform:"uppercase"}}>
    District
  </span>

  <span>
    :
  </span>

  <span style={{marginLeft:"6px"}}>
    {district || "—"}
  </span>

</div>


<div
style={{
  display:"flex",
  marginTop:"4px",
}}
>

  <span style={{width:"55px", fontWeight:700, textTransform:"uppercase"}}>
    Since
  </span>

  <span>
    :
  </span>

  <span style={{marginLeft:"6px"}}>
    {
      customerSince
      ? new Date(customerSince)
          .toLocaleDateString()
      : "—"
    }
  </span>

</div>

</div>


{/* LINE */}

<div

style={{

marginTop:"8px",

borderTop:
"1px solid #E5E7EB",

}}

/>



{/* LOAN */}

<div

style={{

marginTop:"8px",

fontSize:"10px",

fontWeight:700,

}}

>

LOAN SUMMARY

</div>



<div

style={{

marginTop:"8px",

fontSize:"11px",

}}

>

<div
style={{
display:"flex",
}}
>

<span
style={{
width:"70px",
fontWeight:700,
}}
>
Total Loans
</span>


<span>
:
</span>


<span
style={{
marginLeft:"6px",
}}
>
{totalLoans ?? 0}
</span>

</div>

<div
style={{
display:"flex",
fontSize:"11px",
marginTop:"6px",
}}
>

<span
style={{
width:"70px",
fontWeight:700,
}}
>
Active
</span>

<span>
:
</span>

<span
style={{
marginLeft:"6px",
}}
>
{activeLoans ?? 0}
</span>

</div>


<div
style={{
display:"flex",
fontSize:"11px",
marginTop:"6px",
}}
>

<span
style={{
width:"70px",
fontWeight:700,
}}
>
Closed
</span>

<span>
:
</span>

<span
style={{
marginLeft:"6px",
}}
>
{closedLoans ?? 0}
</span>

</div>

</div>

<div

style={{

marginTop:"6px",

fontSize:"11px",

fontWeight:700,

}}

>

<div
style={{
display:"flex",
marginTop:"2px",
fontWeight:700,
}}
>

<span
style={{
width:"70px",
}}
>
Outstanding
</span>


<span>
:
</span>


<span
style={{
marginLeft:"6px",
}}
>
₹ {outstandingAmount ?? 0}
</span>


</div>

</div>


<button

style={{

marginTop:"10px",

height:"30px",

borderRadius:"8px",

border:"1px solid #C9A45C",

background:"#8A612B",

color:"#FFFFFF",

fontSize:"10px",

fontWeight:700,

}}

>

VIEW FULL DETAILS

</button>

</div>

}
          flipped={flipped}

        />

      </div>

    </div>

  );

}
