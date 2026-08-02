/* ===========================================================
   FINORA ENTERPRISE V2
   IDENTITY HEADER
--------------------------------------------------------------
Reusable header for Customer Identity Studio.
=========================================================== */

import type { CSSProperties } from "react";

interface IdentityHeaderProps {
  title: string;
  subtitle: string;
}

const wrapperStyle: CSSProperties = {
  marginBottom: "28px",
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

export default function IdentityHeader({
  title,
  subtitle,
}: IdentityHeaderProps) {
  return (
    <header style={wrapperStyle}>

      <h2 style={titleStyle}>
        {title}
      </h2>

      <p style={subtitleStyle}>
        {subtitle}
      </p>

    </header>
  );
}
