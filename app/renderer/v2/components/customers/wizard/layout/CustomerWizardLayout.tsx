/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER WIZARD LAYOUT
--------------------------------------------------------------
Reusable layout for all FINORA wizard screens.
=========================================================== */

import type { CSSProperties, ReactNode } from "react";

interface CustomerWizardLayoutProps {
  children: ReactNode;
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  padding: "32px 20px",
  boxSizing: "border-box",
  background: "#f5f7fb",
};

const containerStyle: CSSProperties = {
  width: "100%",
  maxWidth: "1200px",
  background: "#ffffff",
  borderRadius: "20px",
  boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
  border: "1px solid #e5e7eb",
  overflow: "hidden",
};

const headerStyle: CSSProperties = {
  padding: "28px 32px",
  borderBottom: "1px solid #e5e7eb",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "28px",
  fontWeight: 700,
};

const subtitleStyle: CSSProperties = {
  marginTop: "8px",
  color: "#6b7280",
  fontSize: "15px",
};

const contentStyle: CSSProperties = {
  padding: "32px",
};

export default function CustomerWizardLayout({
  children,
}: CustomerWizardLayoutProps) {
  return (
    <main style={pageStyle}>

      <section style={containerStyle}>

        <header style={headerStyle}>

          <h1 style={titleStyle}>
            Customer Registration
          </h1>

          <p style={subtitleStyle}>
            FINORA Enterprise • Customer Wizard
          </p>

        </header>

        <div style={contentStyle}>
          {children}
        </div>

      </section>

    </main>
  );
}
