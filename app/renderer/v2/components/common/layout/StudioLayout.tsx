// ============================================================
// FINORA ENTERPRISE OS™
//
// STUDIO LAYOUT™
//
// GLOBAL RESPONSIVE SHELL
//
// RESPONSIBILITY:
// - Global studio header
// - Exact remaining viewport height
// - Full-width studio workspace
// - No unwanted outer spacing
// - Studio owns the complete area below header
//
// ============================================================

import type {
  CSSProperties,
  ReactNode,
} from "react";

import GlobalHeader from "../header/GlobalHeader";

// ============================================================
// TYPES
// ============================================================

interface StudioLayoutProps {

  children: ReactNode;

  department?: string;

  allowScroll?: boolean;

  showHeader?: boolean;
}

// ============================================================
// ROOT
// ============================================================

const layoutStyle: CSSProperties = {

  width: "100%",

  height: "100%",

  minHeight: 0,

  minWidth: 0,

  maxWidth: "100%",

  margin: 0,

  padding: 0,

  background: "#321B12",

  display: "flex",

  flexDirection: "column",

  overflow: "hidden",
};

// ============================================================
// CONTENT
// ============================================================
//
// IMPORTANT:
//
// NO padding here.
//
// The Studio must touch the GlobalHeader directly.
// The LoanStudio itself occupies the complete area.
//
// ============================================================

function buildContentStyle(
  allowScroll: boolean,
): CSSProperties {

  return {

    flex: "1 1 auto",

    width: "100%",

    height: "100%",

    minWidth: 0,

    minHeight: 0,

    maxWidth: "100%",

    margin: 0,

    padding: 0,

    boxSizing: "border-box",

    overflowX: "hidden",

    overflowY:
      allowScroll
        ? "auto"
        : "hidden",

    display: "flex",

    flexDirection: "column",

    gap: 0,
  };
}

// ============================================================
// COMPONENT
// ============================================================

export default function StudioLayout({

  children,

  department = "Reception",

  allowScroll = true,

  showHeader = true,

}: StudioLayoutProps) {

  return (

    <div style={layoutStyle}>

      {/* =====================================================
          GLOBAL HEADER
      ===================================================== */}

      {showHeader && (

        <GlobalHeader
          department={department}
        />

      )}

      {/* =====================================================
          FULL WORKSPACE
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

// ============================================================
// END
// ============================================================
