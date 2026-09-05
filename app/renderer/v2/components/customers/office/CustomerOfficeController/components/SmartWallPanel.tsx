/* ===========================================================
   FINORA ENTERPRISE OS™

   SMART WALL PANEL™

   CUSTOMER HUB PRESENTATION

   RESPONSIVE + THEME ENGINE INTEGRATION

   RESPONSIVE MIGRATION:
   - All responsive sizing comes from Customers Responsive Engine
   - No viewport calculations in component
   - No breakpoint logic in component
   - Toolbar geometry comes from Customer Toolbar Engine
   - Buttons remain controlled by toolbar responsive tokens
   - Search uses the available center space
   - Existing customer-card behavior preserved
   - Customer ID Card code remains untouched

   THEME MIGRATION:
   - All visual theme values come from FINORA Theme Engine
   - No local theme color definitions
   - No hard-coded page background
   - No hard-coded theme-specific color mapping
   - Theme switching affects toolbar / hints / presentation

   NAVIGATION:
   - Work Desk uses the existing Customer Office / Workspace flow.
   - Customer Data uses the existing Customer Data destination.
   - No new page is created here.
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import { useState } from "react";

import { UserPlus, SquarePen } from "lucide-react";

/* ===========================================================
   CUSTOMER COMPONENTS
=========================================================== */

import CustomerSmartWall from "../../../smartwall/CustomerSmartWall";

import CustomerHangerRail from "../../../hub/sections/CustomerHangerRail";

import CustomerSearchBar from "../../../hub/topbar/components/CustomerSearchBar/CustomerSearchBar";

import CustomerHubSummaryCards from "./CustomerHubSummaryCards/CustomerHubSummaryCards";

/* ===========================================================
   TYPES
=========================================================== */

import type { SmartWallPanelProps } from "./SmartWallPanel.types";

/* ===========================================================
   RESPONSIVE ENGINE
=========================================================== */

import { useCustomerResponsive } from "../../../../../utils/responsive/customers/customers.useResponsive";

import { getCustomerToolbarTokens } from "../../../../../utils/responsive/customers/customerToolbar.tokens";

/* ===========================================================
   THEME ENGINE
=========================================================== */

import { useTheme } from "../../../../../themes/provider/ThemeProvider";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function SmartWallPanel({
  title,

  smartWallCustomers,

  railCustomers,

  companyName,

  branchName,

  selectedCustomerId,

  selectedCustomer,

  onCustomerSelect,

  onOpenCustomerWizard,

  onEditCustomer,

  onOpenWorkspace,

  onOpenCustomerData,

  onClearSelection,

  currentPage,

  totalCustomers,

  customersPerPage,

  onPrevious,

  onNext,

  searchText,

  onSearchChange,
}: SmartWallPanelProps) {
  /* =========================================================
     FINORA THEME ENGINE
  ========================================================= */

  const { theme } = useTheme();

  /* =========================================================
     CUSTOMER RESPONSIVE ENGINE
  ========================================================= */

  const { tokens } = useCustomerResponsive();

  /* =========================================================
     CUSTOMER TOOLBAR RESPONSIVE ENGINE
  ========================================================= */

  const toolbar = getCustomerToolbarTokens(tokens.meta.viewport);

  /* =========================================================
     SELECTION STATE
  ========================================================= */

  const hasSelectedCustomer = Boolean(selectedCustomer);

  const [showEditHint, setShowEditHint] = useState(false);

  /* =========================================================
     TOOLBAR RESPONSIVE CONTRACT
  ========================================================= */

  const toolbarGridTemplateColumns = toolbar.gridTemplateColumns;

  const toolbarGridTemplateAreas = toolbar.gridTemplateAreas;

  const toolbarGap = toolbar.gap;

  const actionButtonWidth = toolbar.button.width;

  const actionButtonMaxWidth = toolbar.button.maxWidth;

  const actionButtonHeight = toolbar.button.height;

  const actionButtonMinHeight = toolbar.button.minHeight;

  const actionButtonFontSize = toolbar.button.fontSize;

  const actionButtonIconSize = toolbar.button.iconSize;

  const actionButtonPaddingX = toolbar.button.paddingX;

  const actionButtonGap = toolbar.button.gap;

  const actionButtonRadius = toolbar.button.radius;

  const searchMaxWidth = toolbar.search.maxWidth;

  const toolbarMarginBottom = tokens.spacing.inline + tokens.spacing.small;

  const wallSummaryMarginTop = tokens.spacing.small + tokens.spacing.inline;

  /* =========================================================
     THEME VISUAL TOKENS
  ========================================================= */

  const themePrimary = theme.colors.brand.primary;

  const themeAccent = theme.colors.brand.accent;

  const themeSurface = theme.colors.background.surface;

  const themeSurfaceMuted = theme.colors.background.surfaceMuted;

  const themePageBackground = theme.colors.background.page;

  const themeBorder = theme.colors.border.default;

  const themeStrongBorder = theme.colors.border.strong;

  const themeText = theme.colors.text.primary;

  const themeTextMuted = theme.colors.text.secondary;

  const themeShadow = theme.colors.overlay.shadow;

  /* =========================================================
     ACTION BUTTON STYLE
  ========================================================= */

  const actionButtonStyle = {
    width: actionButtonWidth,

    maxWidth: actionButtonMaxWidth,

    minWidth: 0,

    height: actionButtonHeight,

    minHeight: actionButtonMinHeight,

    padding: `0 ${actionButtonPaddingX}px`,

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    gap: actionButtonGap,

    borderRadius: actionButtonRadius,

    border: `1px solid ${themeStrongBorder}`,

    cursor: "pointer",

    fontWeight: 800,

    fontSize: actionButtonFontSize,

    lineHeight: 1.1,

    color: themeText,

    background: themeSurface,

    boxShadow: `0 8px 20px ${themeShadow}`,

    transition:
      "transform .2s ease, box-shadow .2s ease, background .2s ease, border-color .2s ease",

    boxSizing: "border-box" as const,

    whiteSpace: "nowrap" as const,

    overflow: "hidden",
  };

  /* =========================================================
     TOOLBAR CELL STYLE
  ========================================================= */

  const toolbarCellStyle = {
    minWidth: 0,

    display: "flex",

    alignItems: "center",

    boxSizing: "border-box" as const,
  };

  /* =========================================================
     ADD CUSTOMER CELL
  ========================================================= */

  const addCustomerCellStyle = {
    ...toolbarCellStyle,

    gridArea: "add",

    justifyContent: "flex-start",
  };

  /* =========================================================
     SEARCH CELL STYLE
  ========================================================= */

  const searchCellStyle = {
    ...toolbarCellStyle,

    gridArea: "search",

    width: "100%",

    justifyContent: "center",
  };

  /* =========================================================
     SEARCH WRAPPER STYLE
  ========================================================= */

  const searchWrapperStyle = {
    width: "100%",

    maxWidth: searchMaxWidth,

    minWidth: 0,

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    boxSizing: "border-box" as const,
  };

  /* =========================================================
     EDIT CUSTOMER CELL STYLE
  ========================================================= */

  const editCellStyle = {
    ...toolbarCellStyle,

    gridArea: "edit",

    position: "relative" as const,

    justifyContent: "flex-end",
  };

  /* =========================================================
     EDIT HINT THEME COLORS
  ========================================================= */

  const editHintBorder = themeStrongBorder;

  const editHintBackground = themeSurface;

  const editHintText = themeText;

  const editHintActiveColor = themeAccent || themePrimary;

  const editHintInactiveColor = themeTextMuted || themePrimary;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <CustomerSmartWall title={title} customers={smartWallCustomers}>
      {/* =====================================================
          TOP TOOLBAR
      ===================================================== */}

      <div
        style={{
          display: "grid",

          gridTemplateColumns: toolbarGridTemplateColumns,

          gridTemplateAreas: toolbarGridTemplateAreas,

          alignItems: "center",

          width: "100%",

          minWidth: 0,

          marginBottom: toolbarMarginBottom,

          gap: toolbarGap,

          boxSizing: "border-box",
        }}
      >
        {/* ===================================================
            LEFT — ADD CUSTOMER
        =================================================== */}

        <div style={addCustomerCellStyle}>
          <button
            type="button"
            onClick={onOpenCustomerWizard}
            aria-label="Add Customer"
            title="Add Customer"
            style={actionButtonStyle}
          >
            <UserPlus
              size={actionButtonIconSize}
              strokeWidth={2.2}
              aria-hidden="true"
            />

            <span
              style={{
                minWidth: 0,

                overflow: "hidden",

                textOverflow: "ellipsis",
              }}
            >
              Add Customer
            </span>
          </button>
        </div>

        {/* ===================================================
            CENTER — SEARCH
        =================================================== */}

        <div style={searchCellStyle}>
          <div style={searchWrapperStyle}>
            <CustomerSearchBar value={searchText} onChange={onSearchChange} />
          </div>
        </div>

        {/* ===================================================
            RIGHT — EDIT CUSTOMER
        =================================================== */}

        <div
          style={editCellStyle}
          onMouseEnter={() => {
            setShowEditHint(true);
          }}
          onMouseLeave={() => {
            setShowEditHint(false);
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (!selectedCustomer) {
                return;
              }

              if (onEditCustomer) {
                onEditCustomer(selectedCustomer);
              }
            }}
            aria-label="Edit Customer"
            title="Edit Customer"
            style={actionButtonStyle}
          >
            <SquarePen
              size={actionButtonIconSize}
              strokeWidth={2.2}
              aria-hidden="true"
            />

            <span
              style={{
                minWidth: 0,

                overflow: "hidden",

                textOverflow: "ellipsis",
              }}
            >
              Edit Customer
            </span>
          </button>

          {/* =================================================
              PREMIUM EDIT HINT
          ================================================= */}

          {showEditHint && (
            <div
              style={{
                position: "absolute",

                top: `calc(
                    100% +
                    ${tokens.spacing.inline}px
                  )`,

                right: "0",

                zIndex: 1000,

                maxWidth: "min(320px, 100%)",

                padding: `${tokens.spacing.small + 3}px ${
                  tokens.spacing.medium + 2
                }px`,

                borderRadius: tokens.panel.radius,

                background: editHintBackground,

                color: editHintText,

                fontSize: tokens.typography.small,

                fontWeight: 700,

                whiteSpace: "normal",

                textAlign: "center",

                border: `1px solid ${editHintBorder}`,

                boxShadow: `0 8px 24px ${themeShadow}`,

                pointerEvents: "none",

                boxSizing: "border-box" as const,
              }}
            >
              <div
                style={{
                  color: hasSelectedCustomer
                    ? editHintActiveColor
                    : editHintInactiveColor,

                  fontWeight: 500,

                  textShadow: `0 0 10px ${themeShadow}`,
                }}
              >
                {hasSelectedCustomer
                  ? "Edit Selected Customer"
                  : "Select a Customer to Continue"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          CUSTOMER ID WALL
      ===================================================== */}

      <div
        style={{
          flex: 1,

          minHeight: 0,

          overflow: "hidden",

          position: "relative",

          background: themePageBackground,
        }}
        onMouseDownCapture={(event) => {
          const target = event.target as HTMLElement;

          const protectedElement = target.closest(
            [
              '[data-finora-customer-card="true"]',

              '[data-finora-interactive="true"]',

              "button",

              "input",

              "textarea",

              "select",

              "a",
            ].join(","),
          );

          if (protectedElement) {
            return;
          }

          onClearSelection?.();
        }}
      >
        <CustomerHangerRail
          customers={railCustomers}
          companyName={companyName}
          branchName={branchName}
          selectedCustomerId={selectedCustomerId}
          onCustomerSelect={onCustomerSelect}
        />
      </div>

      {/* =====================================================
          CUSTOMER HUB SUMMARY
      ===================================================== */}

      <div
        style={{
          width: "100%",

          marginTop: wallSummaryMarginTop,

          background: themePageBackground,
        }}
      >
        <CustomerHubSummaryCards
          totalCustomers={totalCustomers}
          activeCustomers={totalCustomers}
          currentPage={currentPage}
          totalPages={Math.ceil(totalCustomers / customersPerPage)}
          onPrevious={onPrevious}
          onNext={onNext}
          /* ===============================================
             EXISTING WORK DESK DESTINATION
          =============================================== */

          onOpenWorkspace={onOpenWorkspace}
          /* ===============================================
             EXISTING CUSTOMER DATA DESTINATION
          =============================================== */

          onOpenCustomerData={onOpenCustomerData}
        />
      </div>
    </CustomerSmartWall>
  );
}

/* ===========================================================
   END
=========================================================== */
