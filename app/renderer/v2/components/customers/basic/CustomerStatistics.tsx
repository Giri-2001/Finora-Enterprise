/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER STATISTICS
--------------------------------------------------------------
Reusable Customer Statistics Card
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

export interface CustomerStatisticsData {

  customerSince: string;

  totalLoans: number;

  activeLoans: number;

  closedLoans: number;

}

interface CustomerStatisticsProps {

  value: CustomerStatisticsData;

}

/* ===========================================================
   STYLES
=========================================================== */

const cardStyle: CSSProperties = {

  padding: "24px",

  borderRadius: "18px",

  border: "1px solid #e5e7eb",

  background: "#ffffff",

};

const titleStyle: CSSProperties = {

  margin: 0,

  marginBottom: "22px",

  fontSize: "22px",

  fontWeight: 700,

};

const gridStyle: CSSProperties = {

  display: "grid",

  gridTemplateColumns: "repeat(2,1fr)",

  gap: "16px",

};

const statCardStyle: CSSProperties = {

  padding: "18px",

  borderRadius: "14px",

  background: "#f8fafc",

  border: "1px solid #e5e7eb",

};

const labelStyle: CSSProperties = {

  fontSize: "12px",

  color: "#6b7280",

  textTransform: "uppercase",

};

const valueStyle: CSSProperties = {

  marginTop: "8px",

  fontSize: "24px",

  fontWeight: 700,

  color: "#111827",

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerStatistics({

  value,

}: CustomerStatisticsProps) {

  return (

    <section style={cardStyle}>

      <h3 style={titleStyle}>
        Customer Statistics
      </h3>

      <div style={gridStyle}>

        <div style={statCardStyle}>

          <div style={labelStyle}>
            Customer Since
          </div>

          <div style={valueStyle}>
            {value.customerSince || "--"}
          </div>

        </div>

        <div style={statCardStyle}>

          <div style={labelStyle}>
            Total Loans
          </div>

          <div style={valueStyle}>
            {value.totalLoans}
          </div>

        </div>

        <div style={statCardStyle}>

          <div style={labelStyle}>
            Active Loans
          </div>

          <div style={valueStyle}>
            {value.activeLoans}
          </div>

        </div>

        <div style={statCardStyle}>

          <div style={labelStyle}>
            Closed Loans
          </div>

          <div style={valueStyle}>
            {value.closedLoans}
          </div>

        </div>

      </div>

    </section>

  );

}
