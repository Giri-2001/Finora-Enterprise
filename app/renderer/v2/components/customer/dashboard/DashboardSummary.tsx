/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   CUSTOMER DASHBOARD STUDIO
   DASHBOARD SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface DashboardSummaryProps {

  activeLoans?: number;

  pendingEmis?: number;

  totalPaid?: number;

  unreadNotifications?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function DashboardSummary({

  activeLoans = 0,

  pendingEmis = 0,

  totalPaid = 0,

  unreadNotifications = 0,

}: DashboardSummaryProps) {

  return (

    <SummaryCard title="Dashboard Summary">

      <span>

        Active Loans :
        <strong> {activeLoans}</strong>

      </span>

      <span>

        Pending EMIs :
        <strong> {pendingEmis}</strong>

      </span>

      <span>

        Total Paid :
        <strong> ₹ {totalPaid}</strong>

      </span>

      <span>

        Notifications :
        <strong> {unreadNotifications}</strong>

      </span>

    </SummaryCard>

  );

}
