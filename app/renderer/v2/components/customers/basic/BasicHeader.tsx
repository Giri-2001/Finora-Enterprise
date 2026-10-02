/* ===========================================================
   FINORA ENTERPRISE V2
   BASIC HEADER
--------------------------------------------------------------
Reusable Header for Customer Basic Details
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

interface BasicHeaderProps {

  title: string;

  subtitle: string;

}

/* ===========================================================
   STYLES
=========================================================== */

const wrapperStyle: CSSProperties = {

  marginBottom: "28px",

};

const titleStyle: CSSProperties = {

  margin: 0,

  fontSize: "28px",

  fontWeight: 600,

  color: "#111827",

};

const subtitleStyle: CSSProperties = {

  marginTop: "10px",

  color: "#6b7280",

  fontSize: "16px",

  lineHeight: 1.7,

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function BasicHeader({

  title,

  subtitle,

}: BasicHeaderProps) {

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
