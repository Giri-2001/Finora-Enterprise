/* ===========================================================
   FINORA ENTERPRISE V2
   STUDIO HEADER
--------------------------------------------------------------
Universal Studio Header
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

}

/* ===========================================================
   STYLES
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
   COMPONENT
=========================================================== */

export default function StudioHeader({

  title,

  subtitle,

  icon,

}: StudioHeaderProps) {

  return (

    <header style={wrapperStyle}>

      <div style={titleRowStyle}>

        {icon}

        <h2 style={titleStyle}>

          {title}

        </h2>

      </div>

      <p style={subtitleStyle}>

        {subtitle}

      </p>

    </header>

  );

}
