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

  display:"flex",

  flexDirection:"column",

  height:"calc(100vh - 80px)",

  overflow:"hidden",

  width:"100%",

};

const leftStyle: CSSProperties = {

 height:"40%",

 overflow:"hidden",

};


const rightStyle: CSSProperties = {

 height:"60%",

 overflow:"auto",

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
