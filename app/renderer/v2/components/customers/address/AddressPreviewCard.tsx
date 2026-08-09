/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER ADDRESS PREVIEW™

   Version     : 2.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   Responsibility:

   - Live customer address preview
   - Customer identity reference
   - Address summary
   - Location summary
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   TYPES
=========================================================== */

export interface AddressPreviewData {
  customerName?: string;

  currentAddress?: string;

  city?: string;

  state?: string;

  pinCode?: string;
}

interface AddressPreviewCardProps {
  value: AddressPreviewData;
}

/* ===========================================================
   STYLES
=========================================================== */

const cardStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  minHeight: 0,

  boxSizing: "border-box",

  padding:
    "12px 14px",

  borderRadius:
    "13px",

  border:
    "1.5px solid rgba(214,176,106,.30)",

  background:
    "rgba(255,255,255,.035)",

  boxShadow:
    "0 8px 20px rgba(0,0,0,.10)",

  overflow:
    "hidden",
};

/* ===========================================================
   HEADER
=========================================================== */

const headerStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  gap: "9px",

  marginBottom:
    "10px",
};

/* ===========================================================
   ICON
=========================================================== */

const iconStyle: CSSProperties = {
  width:
    "30px",

  height:
    "30px",

  minWidth:
    "30px",

  flexShrink:
    0,

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  borderRadius:
    "50%",

  border:
    "1.5px solid rgba(214,176,106,.52)",

  background:
    "rgba(214,176,106,.07)",

  fontSize:
    "13px",
};

/* ===========================================================
   TITLE
=========================================================== */

const titleStyle: CSSProperties = {
  margin: 0,

  color:
    "#F3E4C2",

  fontSize:
    "13px",

  fontWeight:
    800,

  letterSpacing:
    ".15px",
};

/* ===========================================================
   CUSTOMER
=========================================================== */

const customerStyle: CSSProperties = {
  marginBottom:
    "9px",

  padding:
    "8px 10px",

  borderRadius:
    "8px",

  border:
    "1px solid rgba(214,176,106,.18)",

  background:
    "rgba(214,176,106,.045)",
};

const customerLabelStyle: CSSProperties = {
  color:
    "rgba(255,255,255,.44)",

  fontSize:
    "8px",

  fontWeight:
    700,

  letterSpacing:
    ".4px",

  textTransform:
    "uppercase",
};

const customerValueStyle: CSSProperties = {
  marginTop:
    "3px",

  color:
    "#F8FAFC",

  fontSize:
    "11px",

  fontWeight:
    700,
};

/* ===========================================================
   ADDRESS
=========================================================== */

const addressStyle: CSSProperties = {
  marginBottom:
    "9px",

  padding:
    "8px 10px",

  borderRadius:
    "8px",

  border:
    "1px solid rgba(255,255,255,.08)",

  background:
    "rgba(255,255,255,.035)",
};

const addressLabelStyle: CSSProperties = {
  color:
    "rgba(255,255,255,.44)",

  fontSize:
    "8px",

  fontWeight:
    700,

  letterSpacing:
    ".4px",

  textTransform:
    "uppercase",
};

const addressValueStyle: CSSProperties = {
  marginTop:
    "4px",

  color:
    "#F8FAFC",

  fontSize:
    "10px",

  fontWeight:
    500,

  lineHeight:
    1.4,

  display:
    "-webkit-box",

  WebkitLineClamp:
    2,

  WebkitBoxOrient:
    "vertical",

  overflow:
    "hidden",

  wordBreak:
    "break-word",
};

/* ===========================================================
   LOCATION GRID
=========================================================== */

const locationGridStyle: CSSProperties = {
  display:
    "grid",

  gridTemplateColumns:
    "1fr 1fr 1fr",

  gap:
    "8px",

  width:
    "100%",
};

/* ===========================================================
   LOCATION ITEM
=========================================================== */

const locationItemStyle: CSSProperties = {
  minWidth:
    0,

  padding:
    "7px 8px",

  borderRadius:
    "8px",

  border:
    "1px solid rgba(255,255,255,.08)",

  background:
    "rgba(255,255,255,.035)",
};

/* ===========================================================
   LOCATION LABEL
=========================================================== */

const locationLabelStyle: CSSProperties = {
  color:
    "rgba(255,255,255,.42)",

  fontSize:
    "7px",

  fontWeight:
    700,

  letterSpacing:
    ".35px",

  textTransform:
    "uppercase",
};

/* ===========================================================
   LOCATION VALUE
=========================================================== */

const locationValueStyle: CSSProperties = {
  marginTop:
    "3px",

  color:
    "#F8FAFC",

  fontSize:
    "9px",

  fontWeight:
    650,

  whiteSpace:
    "nowrap",

  overflow:
    "hidden",

  textOverflow:
    "ellipsis",
};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function AddressPreviewCard({
  value,
}: AddressPreviewCardProps) {

  return (
    <section
      style={cardStyle}
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <header
        style={headerStyle}
      >

        <div
          style={iconStyle}
          aria-hidden="true"
        >
          🏠
        </div>

        <h3
          style={titleStyle}
        >
          Address Preview
        </h3>

      </header>

      {/* =================================================
          CUSTOMER
      ================================================= */}

      <div
        style={customerStyle}
      >

        <div
          style={customerLabelStyle}
        >
          Customer
        </div>

        <div
          style={customerValueStyle}
        >
          {value.customerName || "--"}
        </div>

      </div>

      {/* =================================================
          ADDRESS
      ================================================= */}

      <div
        style={addressStyle}
      >

        <div
          style={addressLabelStyle}
        >
          Current Address
        </div>

        <div
          style={addressValueStyle}
        >
          {value.currentAddress || "--"}
        </div>

      </div>

      {/* =================================================
          LOCATION
      ================================================= */}

      <div
        style={locationGridStyle}
      >

        <div
          style={locationItemStyle}
        >

          <div
            style={locationLabelStyle}
          >
            City
          </div>

          <div
            style={locationValueStyle}
          >
            {value.city || "--"}
          </div>

        </div>

        <div
          style={locationItemStyle}
        >

          <div
            style={locationLabelStyle}
          >
            State
          </div>

          <div
            style={locationValueStyle}
          >
            {value.state || "--"}
          </div>

        </div>

        <div
          style={locationItemStyle}
        >

          <div
            style={locationLabelStyle}
          >
            PIN
          </div>

          <div
            style={locationValueStyle}
          >
            {value.pinCode || "--"}
          </div>

        </div>

      </div>

    </section>
  );
}
