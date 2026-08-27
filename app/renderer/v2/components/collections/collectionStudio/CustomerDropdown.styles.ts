// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// CUSTOMER DROPDOWN STYLES
//
// RESPONSIBILITY
//
// - Customer dropdown wrapper
// - Customer dropdown container
// - Customer search field
// - Customer option rows
// - Customer option typography
// - Empty search state
//
// ARCHITECTURE LOCK
//
// - No business logic
// - No component logic
// - No local breakpoint logic
// - No inline styles required for customer dropdown
// - Uses the central FINORA Theme Engine variables
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// CUSTOMER DROPDOWN STYLES
// ============================================================

export const customerDropdownStyles: Record<string, CSSProperties> = {
  // ==========================================================
  // DROPDOWN WRAPPER
  // ==========================================================

  wrapper: {
    position: "relative",
    width: "100%",
  },

  // ==========================================================
  // DROPDOWN PANEL
  // ==========================================================

  panel: {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    width: "100%",

    maxHeight: "300px",

    overflowY: "auto",
    overflowX: "hidden",

    boxSizing: "border-box",

    padding: "8px",

    borderRadius: "10px",

    border: "1px solid var(--finora-theme-border-default, #d5dce5)",

    // Fully opaque active-theme surface prevents underlying
    // Collection Studio content from showing through.
    backgroundColor:
      "var(--finora-theme-background-surface, var(--finora-theme-surface, #ffffff))",

    opacity: 1,

    boxShadow:
      "0 12px 28px var(--finora-theme-overlay-shadow, rgba(15, 23, 42, 0.18))",

    zIndex: 100000,
  },

  // ==========================================================
  // SEARCH INPUT
  // ==========================================================

  searchInput: {
    width: "100%",
    height: "36px",
    minHeight: "36px",

    boxSizing: "border-box",

    marginBottom: "8px",
    padding: "0 11px",

    borderRadius: "8px",
    border: "1px solid var(--finora-theme-border-default, #d5dce5)",

    background:
      "var(--finora-theme-background-surface-muted, var(--finora-theme-surface-muted, #f5f7fa))",

    color: "var(--finora-theme-text-primary, #111827)",

    fontSize: "12px",
    fontWeight: 600,

    outline: "none",
  },

  // ==========================================================
  // CUSTOMER OPTION
  // ==========================================================

  option: {
    width: "100%",
    minHeight: "58px",

    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",

    gap: "4px",

    padding: "9px 11px",
    margin: "2px 0",

    boxSizing: "border-box",

    border: "1px solid var(--finora-theme-border-default, #d5dce5)",

    borderRadius: "8px",

    background:
      "var(--finora-theme-background-surface, var(--finora-theme-surface, #ffffff))",

    color: "var(--finora-theme-text-primary, #111827)",

    cursor: "pointer",
    textAlign: "left",

    transition:
      "background 140ms ease, border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease",
  },

  // ==========================================================
  // ACTIVE CUSTOMER OPTION
  // ==========================================================

  activeOption: {
    border: "1px solid var(--finora-theme-brand-primary, #c69214)",

    background:
      "var(--finora-theme-brand-accent-soft, rgba(198, 146, 20, 0.10))",

    boxShadow:
      "0 2px 8px var(--finora-theme-overlay-shadow, rgba(15, 23, 42, 0.08))",
  },

  // ==========================================================
  // CUSTOMER NAME
  // ==========================================================

  customerName: {
    width: "100%",

    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",

    color: "var(--finora-theme-text-primary, #111827)",

    fontSize: "12px",
    fontWeight: 700,
    lineHeight: 1.3,
  },

  // ==========================================================
  // CUSTOMER PHONE / ID
  // ==========================================================

  customerMeta: {
    width: "100%",

    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",

    color: "var(--finora-theme-text-secondary, #4b5563)",

    fontSize: "10px",
    fontWeight: 500,
    lineHeight: 1.3,
  },

  // ==========================================================
  // EMPTY SEARCH STATE
  // ==========================================================

  emptyState: {
    width: "100%",

    boxSizing: "border-box",

    padding: "12px 8px",

    color: "var(--finora-theme-text-muted, #6b7280)",

    fontSize: "11px",
    fontWeight: 500,

    textAlign: "center",
  },
};

// ============================================================
// END
// ============================================================
