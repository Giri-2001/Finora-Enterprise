/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   CUSTOMER DASHBOARD STUDIO
   QUICK ACTIONS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface QuickActionsProps {

  canPayNow?: boolean;

  canDownloadReceipt?: boolean;

  canViewLoan?: boolean;

  canContactSupport?: boolean;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function QuickActions({

  canPayNow = true,

  canDownloadReceipt = true,

  canViewLoan = true,

  canContactSupport = true,

}: QuickActionsProps) {

  return (

    <SummaryCard title="Quick Actions">

      <span>

        Pay Now :
        <strong> {canPayNow ? "Available" : "Unavailable"}</strong>

      </span>

      <span>

        Download Receipt :
        <strong> {canDownloadReceipt ? "Available" : "Unavailable"}</strong>

      </span>

      <span>

        View Loan :
        <strong> {canViewLoan ? "Available" : "Unavailable"}</strong>

      </span>

      <span>

        Contact Support :
        <strong> {canContactSupport ? "Available" : "Unavailable"}</strong>

      </span>

    </SummaryCard>

  );

}
