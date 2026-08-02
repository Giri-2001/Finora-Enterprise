/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   DASHBOARD SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface DashboardSummaryProps {

  totalCustomers?: number;

  activeLoans?: number;

  totalCollections?: number;

  outstandingAmount?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function DashboardSummary({

  totalCustomers = 0,

  activeLoans = 0,

  totalCollections = 0,

  outstandingAmount = 0,

}: DashboardSummaryProps) {

  return (

    <SummaryCard title="Business Summary">

      <span>

        Customers :
        <strong> {totalCustomers}</strong>

      </span>

      <span>

        Active Loans :
        <strong> {activeLoans}</strong>

      </span>

      <span>

        Total Collections :
        <strong> ₹ {totalCollections}</strong>

      </span>

      <span>

        Outstanding Amount :
        <strong> ₹ {outstandingAmount}</strong>

      </span>

    </SummaryCard>

  );

}
