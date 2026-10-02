/* ===========================================================
   FINORA ENTERPRISE V2
   IDENTITY HEADER
--------------------------------------------------------------
Reusable header for Customer Identity Studio.
=========================================================== */

import type { CSSProperties } from "react";

import {
  formTitleStyle,
  formSubtitleStyle,
} from "../wizard/steps/Step2Basic.styles";

interface IdentityHeaderProps {
  title: string;
  subtitle: string;
}

const wrapperStyle: CSSProperties = {
  marginBottom: "28px",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, sans-serif",
};





export default function IdentityHeader({
  title,
  subtitle,
}: IdentityHeaderProps) {
  return (
    <header style={wrapperStyle}>

      <h1 style={{ fontSize: "19px", fontWeight: 750, fontFamily: "var(--finora-theme-font-family, Inter, sans-serif)", margin: 0, color: "var(--finora-theme-text-primary, #F5F2EA)" }}>
        {title}
      </h1>

      <p style={{ fontSize: "12px", fontWeight: 500, fontFamily: "var(--finora-theme-font-family, Inter, sans-serif)", marginTop: "6px", maxWidth: "100%", whiteSpace: "normal", overflowWrap: "break-word", color: "var(--finora-theme-text-secondary, #B9B5AC)" }}>
        {subtitle}
      </p>

    </header>
  );
}
