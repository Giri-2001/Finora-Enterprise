/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HUB SUMMARY CARDS™

   THEME + RESPONSIVE PRESENTATION
   -----------------------------------------------------------
   RESPONSIVE:
   - Geometry comes exclusively from Customer Responsive Engine.

   THEME:
   - Visual colours come exclusively from FINORA Theme Engine.
   - Active theme is resolved through useTheme().
   - Theme CSS variables are exposed on the Summary Cards root.
   - No local theme palette exists here.
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import type { CSSProperties } from "react";

import type { CustomerHubSummaryCardsProps } from "./types";

import {
  containerStyle,
  cardStyle,
  titleStyle,
  valueStyle,
  descriptionStyle,
  paginationCardStyle,
  paginationButtonStyle,
  paginationCenterStyle,
  paginationPageInputStyle,
  getCustomerHubSummaryCardsStyles,
} from "./styles";

import { useCustomerResponsive } from "../../../../../../utils/responsive/customers/customers.useResponsive";

import { useTheme } from "../../../../../../themes/provider";

/* ===========================================================
   THEME STYLE TYPE
=========================================================== */

type ThemeStyle = CSSProperties & Record<`--${string}`, string>;

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerHubSummaryCards({
  totalCustomers,

  activeCustomers,

  currentPage,

  totalPages,

  onPrevious,

  onNext,

  onPageChange,

  onOpenCustomerData,
}: CustomerHubSummaryCardsProps) {
  /* =========================================================
     CUSTOMER RESPONSIVE ENGINE
  ========================================================= */

  const { tokens } = useCustomerResponsive();

  /* =========================================================
     FINORA THEME ENGINE
  ========================================================= */

  const { theme } = useTheme();

  /* =========================================================
     SUMMARY CARDS RESPONSIVE TOKENS
  ========================================================= */

  const summaryStyles = getCustomerHubSummaryCardsStyles(tokens.meta.viewport);
  /* =========================================================
     DIRECT PAGE INPUT
  ========================================================= */

  function commitPageInput(
    input: HTMLInputElement,
  ) {

    const raw =
      input.value.trim();

    if (
      !/^\d+$/.test(raw)
    ) {

      input.value =
        String(currentPage);

      return;

    }

    const requestedPage =
      Number(raw);

    if (
      !Number.isSafeInteger(requestedPage) ||
      requestedPage < 1 ||
      requestedPage > totalPages
    ) {

      input.value =
        String(currentPage);

      return;

    }

    onPageChange(
      requestedPage,
    );

    input.value =
      String(requestedPage);

  }

  /* =========================================================
     THEME CSS VARIABLES

     These variables are attached to the Summary Cards root.

     This is important because the Summary Cards live outside
     the CustomerHanger root where the same theme variables are
     normally exposed.

     Therefore all five bottom cards now receive the exact same
     active FINORA Theme Engine values.
  ========================================================= */

  const themeVariables: ThemeStyle = {
    "--finora-theme-brand-primary": theme.colors.brand.primary,

    "--finora-theme-brand-secondary": theme.colors.brand.secondary,

    "--finora-theme-brand-accent": theme.colors.brand.accent,

    "--finora-theme-brand-accent-soft": theme.colors.brand.accentSoft,

    "--finora-theme-border-default": theme.colors.border.default,

    "--finora-theme-border-strong": theme.colors.border.strong,

    "--finora-theme-border-subtle": theme.colors.border.subtle,

    "--finora-theme-overlay-shadow": theme.colors.overlay.shadow,

    "--finora-theme-surface": theme.colors.background.surface,

    "--finora-theme-background-surface": theme.colors.background.surface,

    "--finora-theme-surface-muted": theme.colors.background.surfaceMuted,

    "--finora-theme-background-surface-muted":
      theme.colors.background.surfaceMuted,

    "--finora-theme-text-primary": theme.colors.text.primary,

    "--finora-theme-text-secondary": theme.colors.text.secondary,

    "--finora-theme-text-body": theme.colors.text.secondary,

    "--finora-theme-text-muted": theme.colors.text.muted,

    "--finora-theme-success": theme.colors.status.success,

    "--finora-theme-success-soft": theme.colors.status.successSoft,

    "--finora-theme-success-border": theme.colors.border.strong,
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      style={{
        ...themeVariables,

        ...containerStyle(summaryStyles),
      }}
    >
      {/* =====================================================
          TOTAL CUSTOMERS
      ===================================================== */}

      <div
        style={{
          ...cardStyle(summaryStyles),

          order: summaryStyles.totalCustomersOrder,
        }}
      >
        <div style={titleStyle(summaryStyles)}>Total Customers</div>

        <div style={valueStyle(summaryStyles)}>{totalCustomers}</div>

        <div style={descriptionStyle(summaryStyles)}>
          All Registered Customers
        </div>
      </div>

      {/* =====================================================
          ACTIVE CUSTOMERS
      ===================================================== */}

      <div
        style={{
          ...cardStyle(summaryStyles),

          order: summaryStyles.activeCustomersOrder,
        }}
      >
        <div style={titleStyle(summaryStyles)}>Active Customers</div>

        <div style={valueStyle(summaryStyles)}>{activeCustomers}</div>

        <div style={descriptionStyle(summaryStyles)}>Currently Active</div>
      </div>

      {/* =====================================================
          PAGINATION
      ===================================================== */}

      <div
        style={{
          ...paginationCardStyle(summaryStyles),

          order: summaryStyles.paginationOrder,
        }}
      >
                <button
          type="button"
          onClick={onPrevious}
          disabled={currentPage <= 1}
          aria-label="Previous customer page"
          style={paginationButtonStyle(summaryStyles)}
        >
          {"←"}
        </button>

        <div style={paginationCenterStyle(summaryStyles)}>
          <input
            key={currentPage}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            spellCheck={false}
            maxLength={String(totalPages).length}
            defaultValue={String(currentPage)}
            aria-label={`Customer page ${currentPage} of ${totalPages}`}
            title={`Enter page 1 to ${totalPages}`}
            style={paginationPageInputStyle(summaryStyles)}
            onFocus={(event) => {
              event.currentTarget.select();
            }}
            onChange={(event) => {
              event.currentTarget.value =
                event.currentTarget.value.replace(/\D/g, "");
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") {
                return;
              }

              event.preventDefault();

              commitPageInput(
                event.currentTarget,
              );
            }}
            onBlur={(event) => {
              commitPageInput(
                event.currentTarget,
              );
            }}
          />
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={currentPage >= totalPages}
          aria-label="Next customer page"
          style={paginationButtonStyle(summaryStyles)}
        >
          {"→"}
        </button>
      </div>

      {/* =====================================================
          WORK DESK
      ===================================================== */}

      <div
        style={{
          ...cardStyle(summaryStyles),

          order: summaryStyles.workDeskOrder,
        }}
      >
        <div style={titleStyle(summaryStyles)}>Work Desk</div>

        <div style={valueStyle(summaryStyles)}>Open</div>

        <div style={descriptionStyle(summaryStyles)}>Customer Workspace</div>
      </div>

      {/* =====================================================
          CUSTOMER DATA
      ===================================================== */}

      <div
        style={{
          ...cardStyle(summaryStyles),

          order: summaryStyles.customerDataOrder,
        }}
        onClick={onOpenCustomerData}
      >
        <div style={titleStyle(summaryStyles)}>Customer Data</div>

        <div style={valueStyle(summaryStyles)}>View</div>

        <div style={descriptionStyle(summaryStyles)}>Profile Details</div>
      </div>
    </div>
  );
}

/* ===========================================================
   END
=========================================================== */
