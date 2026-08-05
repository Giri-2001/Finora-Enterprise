/* ===========================================================
   FINORA ENTERPRISE OS™
   STUDIO LAYOUT™

   GLOBAL RESPONSIVE SHELL
=========================================================== */

import type {
  CSSProperties,
  ReactNode,
} from "react";

import GlobalHeader
  from "../header/GlobalHeader";

/* ===========================================================
   TYPES
=========================================================== */

interface StudioLayoutProps {

  children: ReactNode;

  department?: string;

}

/* ===========================================================
   ROOT
=========================================================== */

const layoutStyle: CSSProperties = {

  width: "100%",

  minWidth: 0,

  maxWidth: "100%",

  minHeight: "100vh",

  margin: 0,

  background: "#F8FAFC",

  display: "flex",

  flexDirection: "column",

  overflow: "hidden",

};

const contentStyle: CSSProperties = {

  flex: 1,

  width: "100%",

  padding: "2px 16px 16px",

  boxSizing: "border-box",

  overflowX: "hidden",

  overflowY: "auto",

  display: "flex",

  flexDirection: "column",

  gap: "16px",

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function StudioLayout({

  children,

  department = "Reception",

}: StudioLayoutProps) {

  return (

    <main style={layoutStyle}>

      <GlobalHeader

        department={department}

      />

      <section style={contentStyle}>

        {children}

      </section>

    </main>

  );

}
