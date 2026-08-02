/* ===========================================================
   FINORA ENTERPRISE V2
   STUDIO LAYOUT
--------------------------------------------------------------
Master Studio Layout Wrapper
=========================================================== */

import type {
  CSSProperties,
  ReactNode,
} from "react";

/* ===========================================================
   TYPES
=========================================================== */

interface StudioLayoutProps {

  children: ReactNode;

}

/* ===========================================================
   STYLES
=========================================================== */

const layoutStyle: CSSProperties = {

  width: "100%",

  maxWidth: "1600px",

  margin: "0 auto",

  padding: "32px",

  boxSizing: "border-box",

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function StudioLayout({

  children,

}: StudioLayoutProps) {

  return (

    <main style={layoutStyle}>

      {children}

    </main>

  );

}
