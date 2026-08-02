/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   PAYMENT HISTORY STUDIO
   PAYMENT TIMELINE CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface PaymentTimelineCardProps {

  latestPaymentDate?: string;

  nextDueDate?: string;

  totalTransactions?: number;

  timelineStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PaymentTimelineCard({

  latestPaymentDate = "--",

  nextDueDate = "--",

  totalTransactions = 0,

  timelineStatus = "On Track",

}: PaymentTimelineCardProps) {

  return (

    <SummaryCard title="Payment Timeline">

      <span>

        Last Payment :
        <strong> {latestPaymentDate}</strong>

      </span>

      <span>

        Next Due :
        <strong> {nextDueDate}</strong>

      </span>

      <span>

        Transactions :
        <strong> {totalTransactions}</strong>

      </span>

      <span>

        Timeline Status :
        <strong> {timelineStatus}</strong>

      </span>

    </SummaryCard>

  );

}
