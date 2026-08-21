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
// - Consume FINORA Theme Engine for workspace surface
//
// IMPORTANT:
//
// GlobalHeader is owned by AppShell.
// StudioLayout MUST NOT render another GlobalHeader.
//
// THEME CONTRACT:
//
// - Workspace background comes only from the active
//   FINORA Theme Engine.
// - No local theme color is defined here.
// - No hard-coded page background is allowed.
//
// RESPONSIVE CONTRACT:
//
// - Width / height / spacing / overflow remain layout
//   responsibilities.
// - Theme Engine controls visual appearance only.
//
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import type {
  CSSProperties,
  ReactNode,
} from "react";


import {
  useTheme,
} from "../../../themes/provider/ThemeProvider";


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


  // ==========================================================
  // FINORA THEME ENGINE
  //
  // Active application theme:
  //
  // ThemeProvider
  //      ↓
  // FINORA Theme Registry
  //      ↓
  // useTheme()
  //      ↓
  // StudioLayout
  //
  // Theme controls visual appearance only.
  // ==========================================================

  const {
    theme,
  } = useTheme();


  // ==========================================================
  // ROOT
  // ==========================================================

  const layoutStyle:
    CSSProperties = {

    width:
      "100%",

    height:
      "100%",

    minHeight:
      0,

    minWidth:
      0,

    maxWidth:
      "100%",

    margin:
      0,

    padding:
      0,

    /*
     * THEME ENGINE
     *
     * This replaces the previous hard-coded:
     *
     *   #321B12
     *
     * Every FINORA theme now controls the complete
     * Studio workspace background.
     */

    background:
      theme
        .colors
        .background
        .page,

    display:
      "flex",

    flexDirection:
      "column",

    overflow:
      "hidden",

  };


  // ==========================================================
  // CONTENT
  // ==========================================================
  //
  // IMPORTANT:
  //
  // No padding here.
  //
  // The Studio workspace occupies the complete area provided
  // by AppShell below the single GlobalHeader.
  //
  // ==========================================================

  function buildContentStyle(
    scrollable:
      boolean,
  ): CSSProperties {

    return {

      flex:
        "1 1 auto",

      width:
        "100%",

      height:
        "100%",

      minWidth:
        0,

      minHeight:
        0,

      maxWidth:
        "100%",

      margin:
        0,

      padding:
        0,

      boxSizing:
        "border-box",

      overflowX:
        "hidden",

      overflowY:
        scrollable
          ? "auto"
          : "hidden",

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        0,

    };

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      style={
        layoutStyle
      }
    >

      {/* ====================================================
          FULL WORKSPACE
      ==================================================== */}

      <main
        style={
          buildContentStyle(
            allowScroll,
          )
        }
      >

        {children}

      </main>

    </div>

  );

}


// ============================================================
// END
// ============================================================