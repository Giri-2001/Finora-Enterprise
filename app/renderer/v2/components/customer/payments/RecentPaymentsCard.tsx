/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   PAYMENT HISTORY STUDIO
   RECENT PAYMENTS CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface RecentPaymentsCardProps {

  latestPaymentDate?: string;

  latestPaymentAmount?: number;

  paymentMethod?: string;

  paymentReference?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function RecentPaymentsCard({

  latestPaymentDate = "--",

  latestPaymentAmount = 0,

  paymentMethod = "--",

  paymentReference = "--",

}: RecentPaymentsCardProps) {

  return (

    <SummaryCard title="Recent Payment">

      <span>

        Payment Date :
        <strong> {latestPaymentDate}</strong>

      </span>

      <span>

        Amount :
        <strong> ₹ {latestPaymentAmount}</strong>

      </span>

      <span>

        Method :
        <strong> {paymentMethod}</strong>

      </span>

      <span>

        Reference :
        <strong> {paymentReference}</strong>

      </span>

    </SummaryCard>

  );

}
