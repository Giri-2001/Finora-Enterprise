/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER ADDRESS LOCATION™

   Version     : 2.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   Responsibility:

   - Address location status
   - Latitude display
   - Longitude display
   - Future GIS integration indicator
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   TYPES
=========================================================== */

interface AddressMapCardProps {
  latitude?: string;

  longitude?: string;
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
    "1.5px solid rgba(214,176,106,.28)",

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

  justifyContent: "space-between",

  gap: "10px",

  marginBottom:
    "10px",
};

/* ===========================================================
   TITLE GROUP
=========================================================== */

const titleGroupStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  gap: "9px",

  minWidth: 0,
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
   STATUS
=========================================================== */

const statusStyle: CSSProperties = {
  display:
    "inline-flex",

  alignItems:
    "center",

  padding:
    "4px 8px",

  borderRadius:
    "999px",

  border:
    "1px solid rgba(214,176,106,.24)",

  background:
    "rgba(214,176,106,.07)",

  color:
    "#F3E4C2",

  fontSize:
    "8px",

  fontWeight:
    800,

  whiteSpace:
    "nowrap",
};

/* ===========================================================
   INFO GRID
=========================================================== */

const infoGridStyle: CSSProperties = {
  display:
    "grid",

  gridTemplateColumns:
    "repeat(2,minmax(0,1fr))",

  gap:
    "8px 12px",

  width:
    "100%",
};

/* ===========================================================
   INFO ITEM
=========================================================== */

const infoItemStyle: CSSProperties = {
  minWidth:
    0,

  padding:
    "8px 9px",

  borderRadius:
    "8px",

  border:
    "1px solid rgba(255,255,255,.08)",

  background:
    "rgba(255,255,255,.035)",
};

/* ===========================================================
   LABEL
=========================================================== */

const labelStyle: CSSProperties = {
  color:
    "rgba(255,255,255,.48)",

  fontSize:
    "8px",

  fontWeight:
    700,

  letterSpacing:
    ".4px",

  textTransform:
    "uppercase",
};

/* ===========================================================
   VALUE
=========================================================== */

const valueStyle: CSSProperties = {
  marginTop:
    "3px",

  color:
    "#F8FAFC",

  fontSize:
    "10px",

  fontWeight:
    600,

  fontVariantNumeric:
    "tabular-nums",

  whiteSpace:
    "nowrap",

  overflow:
    "hidden",

  textOverflow:
    "ellipsis",
};

/* ===========================================================
   FUTURE NOTE
=========================================================== */

const noteStyle: CSSProperties = {
  marginTop:
    "9px",

  color:
    "rgba(255,255,255,.40)",

  fontSize:
    "8px",

  lineHeight:
    1.4,
};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function AddressMapCard({
  latitude,
  longitude,
}: AddressMapCardProps) {

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
          style={titleGroupStyle}
        >

          <div
            style={iconStyle}
            aria-hidden="true"
          >
            📍
          </div>

          <h3
            style={titleStyle}
          >
            Address Location
          </h3>

        </div>

        <div
          style={statusStyle}
        >
          GIS Future
        </div>

      </header>

      {/* =================================================
          LOCATION DATA
      ================================================= */}

      <div
        style={infoGridStyle}
      >

        <div
          style={infoItemStyle}
        >

          <div
            style={labelStyle}
          >
            Latitude
          </div>

          <div
            style={valueStyle}
          >
            {latitude || "--"}
          </div>

        </div>

        <div
          style={infoItemStyle}
        >

          <div
            style={labelStyle}
          >
            Longitude
          </div>

          <div
            style={valueStyle}
          >
            {longitude || "--"}
          </div>

        </div>

      </div>

      {/* =================================================
          FUTURE GIS NOTE
      ================================================= */}

      <div
        style={noteStyle}
      >
        GPS / GIS integration will be available
        in a future FINORA version.
      </div>

    </section>
  );
}
