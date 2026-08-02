/* ===========================================================
   FINORA ENTERPRISE V2
   TWO COLUMN STUDIO
--------------------------------------------------------------
Reusable Studio Layout
=========================================================== */

import type {
  CSSProperties,
  ReactNode,
} from "react";

/* ===========================================================
   TYPES
=========================================================== */

interface TwoColumnStudioProps {

  left: ReactNode;

  right: ReactNode;

}

/* ===========================================================
   STYLES
=========================================================== */

const containerStyle: CSSProperties = {

  display: "grid",

  gridTemplateColumns: "2fr 1fr",

  gap: "32px",

  alignItems: "start",

  width: "100%",

};

const leftStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  gap: "24px",

};

const rightStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  gap: "24px",

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function TwoColumnStudio({

  left,

  right,

}: TwoColumnStudioProps) {

  return (

    <div style={containerStyle}>

      <section style={leftStyle}>

        {left}

      </section>

      <aside style={rightStyle}>

        {right}

      </aside>

    </div>

  );

}
