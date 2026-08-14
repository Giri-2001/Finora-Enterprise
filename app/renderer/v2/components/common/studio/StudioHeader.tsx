/* ===========================================================
FINORA ENTERPRISE V2
UNIVERSAL STUDIO HEADER

RESPONSIBILITY:
- Shared studio header
- Preserve existing default appearance
- Support enterprise dark workspace variant
=========================================================== */

import type {
  CSSProperties,
  ReactNode,
} from "react";

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
   * Dark FINORA workspace header with visible title,
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

  background:
    "linear-gradient(135deg, #111d31 0%, #16243a 100%)",

  border: "1px solid #2b3d57",

  borderRadius: "10px",

  boxShadow:
    "0 4px 12px rgba(0, 0, 0, 0.18)",
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

  color: "#f8fafc",

  letterSpacing: "0.2px",
};

const enterpriseSubtitleStyle: CSSProperties = {
  margin: "4px 0 0 0",

  color: "#b8c5d8",

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
  const isEnterprise =
    variant === "enterprise";

  return (
    <header
      style={
        isEnterprise
          ? enterpriseWrapperStyle
          : wrapperStyle
      }
    >
      <div
        style={
          isEnterprise
            ? enterpriseTitleRowStyle
            : titleRowStyle
        }
      >
        {icon}

        <h2
          style={
            isEnterprise
              ? enterpriseTitleStyle
              : titleStyle
          }
        >
          {title}
        </h2>
      </div>

      <p
        style={
          isEnterprise
            ? enterpriseSubtitleStyle
            : subtitleStyle
        }
      >
        {subtitle}
      </p>
    </header>
  );
}

/* ===========================================================
END
=========================================================== */
