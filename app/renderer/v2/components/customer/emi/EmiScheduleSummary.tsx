/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   EMI SCHEDULE STUDIO
   EMI SCHEDULE SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface EmiScheduleSummaryProps {

  totalInstallments?: number;

  paidInstallments?: number;

  upcomingInstallments?: number;

  overdueInstallments?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function EmiScheduleSummary({

  totalInstallments = 0,

  paidInstallments = 0,

  upcomingInstallments = 0,

  overdueInstallments = 0,

}: EmiScheduleSummaryProps) {

  return (

    <SummaryCard title="EMI Schedule Summary">

      <span>

        Total Installments :
        <strong> {totalInstallments}</strong>

      </span>

      <span>

        Paid Installments :
        <strong> {paidInstallments}</strong>

      </span>

      <span>

        Upcoming Installments :
        <strong> {upcomingInstallments}</strong>

      </span>

      <span>

        Overdue Installments :
        <strong> {overdueInstallments}</strong>

      </span>

    </SummaryCard>

  );

}
