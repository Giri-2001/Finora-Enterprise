/* ===========================================================
FINORA ENTERPRISE OS™
UNIVERSAL STUDIO HEADER

RESPONSIBILITY:
- Shared studio header
- Preserve existing default appearance
- Support enterprise FINORA theme-aware workspace variant
- No local enterprise colour palette
- Consume FINORA Theme Engine CSS variables
=========================================================== */

import type { CSSProperties, ReactNode } from "react";

/* ===========================================================
THEME TOKENS
=========================================================== */

const THEME = {
  surface:
    "var(--finora-theme-surface, var(--finora-theme-background-surface, #111C2E))",

  surfaceMuted:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #16243A))",

  border: "var(--finora-theme-border-default, rgba(148,163,184,.16))",

  textPrimary: "var(--finora-theme-text-primary, #F8FAFC)",

  textSecondary: "var(--finora-theme-text-secondary, #CBD5E1)",

  overlayShadow: "var(--finora-theme-overlay-shadow, rgba(0,0,0,.18))",
} as const;

/* ===========================================================
TYPES
=========================================================== */

interface StudioHeaderProps {
  title: string;
  subtitle: string;
  icon?: ReactNode;

  /**
   * Default:
   * Existing Studio Header appearance.
   *
   * Enterprise:
   * Theme-aware FINORA workspace header with visible title,
   * subtitle and bordered container.
   */
  variant?: "default" | "enterprise";
}

/* ===========================================================
DEFAULT STYLES
=========================================================== */

const wrapperStyle: CSSProperties = {
  marginBottom: "28px",
};

const titleRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "30px",
  fontWeight: 700,
  color: "#111827",
};

const subtitleStyle: CSSProperties = {
  marginTop: "10px",
  color: "#6b7280",
  fontSize: "15px",
  lineHeight: 1.7,
};

/* ===========================================================
ENTERPRISE VARIANT STYLES
=========================================================== */

const enterpriseWrapperStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,

  marginBottom: "10px",
  padding: "12px 16px",

  display: "flex",
  flexDirection: "column",

  boxSizing: "border-box",

  background: `linear-gradient(
    135deg,
    ${THEME.surface},
    ${THEME.surfaceMuted}
  )`,

  border: `1px solid ${THEME.border}`,

  borderRadius: "10px",

  boxShadow: "none",
};

const enterpriseTitleRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const enterpriseTitleStyle: CSSProperties = {
  margin: 0,

  fontSize: "20px",
  fontWeight: 700,

  lineHeight: 1.2,

  color: THEME.textPrimary,

  letterSpacing: "0.2px",
};

const enterpriseSubtitleStyle: CSSProperties = {
  margin: "4px 0 0 0",

  color: THEME.textSecondary,

  fontSize: "12px",
  fontWeight: 500,

  lineHeight: 2.4,
};

/* ===========================================================
COMPONENT
=========================================================== */

export default function StudioHeader({
  title,
  subtitle,
  icon,
  variant = "default",
}: StudioHeaderProps) {
  const isEnterprise = variant === "enterprise";

  return (
    <header style={isEnterprise ? enterpriseWrapperStyle : wrapperStyle}>
      <div style={isEnterprise ? enterpriseTitleRowStyle : titleRowStyle}>
        {icon}

        <h2 style={isEnterprise ? enterpriseTitleStyle : titleStyle}>
          {title}
        </h2>
      </div>

      <p style={isEnterprise ? enterpriseSubtitleStyle : subtitleStyle}>
        {subtitle}
      </p>
    </header>
  );
}

/* ===========================================================
END
=========================================================== */
