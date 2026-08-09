/* ===========================================================
   FINORA ENTERPRISE OS™

   STUDIO LAYOUT™

   GLOBAL RESPONSIVE SHELL

   RESPONSIBILITY:
   - Studio workspace shell
   - Optional studio-level GlobalHeader
   - Content height management
   - Scroll behavior

   NOTE:
   Customer Wizard can disable the studio-level header
   because the Customer Workspace already owns the global header.
=========================================================== */

import type {
  CSSProperties,
  ReactNode,
} from "react";

import GlobalHeader from "../header/GlobalHeader";

/* ===========================================================
   TYPES
=========================================================== */

interface StudioLayoutProps {

  children: ReactNode;

  department?: string;

  allowScroll?: boolean;

  /*
   * Allows individual workflows to prevent a duplicate
   * GlobalHeader when their parent workspace already owns it.
   */
  showHeader?: boolean;
}

/* ===========================================================
   ROOT
=========================================================== */

const layoutStyle: CSSProperties = {

  width: "100%",

  height: "100vh",

  minHeight: 0,

  minWidth: 0,

  maxWidth: "100%",

  margin: 0,

  background: "#321B12",

  display: "flex",

  flexDirection: "column",

  overflow: "hidden",
};

/* ===========================================================
   CONTENT BUILDER
=========================================================== */

function buildContentStyle(
  allowScroll: boolean,
): CSSProperties {

  return {

    flex: 1,

    width: "100%",

    padding:
      allowScroll
        ? "16px"
        : "0",

    boxSizing: "border-box",

    overflowX: "hidden",

    overflowY:
      allowScroll
        ? "auto"
        : "hidden",

    display: "flex",

    flexDirection: "column",

    gap:
      allowScroll
        ? "16px"
        : "0px",

    minHeight: 0,
  };
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function StudioLayout({

  children,

  department = "Reception",

  allowScroll = true,

  showHeader = true,

}: StudioLayoutProps) {

  return (

    <div style={layoutStyle}>

      {/* =====================================================
         OPTIONAL STUDIO HEADER

         Disabled by Customer Wizard when the parent workspace
         already provides the global header.
      ===================================================== */}

      {showHeader && (
        <GlobalHeader
          department={department}
        />
      )}

      {/* =====================================================
         CONTENT
      ===================================================== */}

      <main
        style={buildContentStyle(
          allowScroll,
        )}
      >
        {children}
      </main>

    </div>
  );
}
