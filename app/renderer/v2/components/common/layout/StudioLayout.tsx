// ============================================================
// FINORA ENTERPRISE OS™
//
// STUDIO LAYOUT™
//
// GLOBAL RESPONSIVE WORKSPACE
//
// RESPONSIBILITY:
// - Provide the studio workspace below GlobalHeader
// - Exact remaining viewport height
// - Full-width studio workspace
// - No unwanted outer spacing
// - Preserve child studio dimensions
//
// IMPORTANT:
//
// GlobalHeader is owned by AppShell.
// StudioLayout MUST NOT render another GlobalHeader.
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  CSSProperties,
  ReactNode,
} from "react";

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
// No padding here.
//
// The Studio workspace occupies the complete area provided
// by AppShell below the single GlobalHeader.
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

  // ----------------------------------------------------------
  // Kept for backward compatibility with existing callers.
  // StudioLayout no longer owns the GlobalHeader.
  // ----------------------------------------------------------

  department: _department = "Reception",

  allowScroll = true,

  showHeader: _showHeader = false,

}: StudioLayoutProps) {

  return (

    <div style={layoutStyle}>

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
