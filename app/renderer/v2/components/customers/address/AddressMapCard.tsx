/* ===========================================================
   FINORA ENTERPRISE V2
   ADDRESS MAP CARD
--------------------------------------------------------------
Future GIS / Map Integration Card
=========================================================== */

import type { CSSProperties } from "react";

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

  padding: "24px",

  border: "1px solid #e5e7eb",

  borderRadius: "18px",

  background: "#ffffff",

};

const titleStyle: CSSProperties = {

  margin: 0,

  fontSize: "20px",

  fontWeight: 700,

};

const infoStyle: CSSProperties = {

  marginTop: "14px",

  color: "#6b7280",

  lineHeight: 1.6,

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function AddressMapCard({

  latitude,

  longitude,

}: AddressMapCardProps) {

  return (

    <section style={cardStyle}>

      <h3 style={titleStyle}>

        Address Location

      </h3>

      <div style={infoStyle}>

        GPS integration will be available in a future
        version of FINORA.

      </div>

      <div style={infoStyle}>

        Latitude :

        {" "}

        {latitude || "--"}

      </div>

      <div style={infoStyle}>

        Longitude :

        {" "}

        {longitude || "--"}

      </div>

    </section>

  );

}
