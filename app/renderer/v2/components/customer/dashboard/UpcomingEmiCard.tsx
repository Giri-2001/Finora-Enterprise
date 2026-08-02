/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   CUSTOMER DASHBOARD STUDIO
   UPCOMING EMI CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface UpcomingEmiCardProps {

  emiAmount?: number;

  dueDate?: string;

  daysRemaining?: number;

  paymentStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function UpcomingEmiCard({

  emiAmount = 0,

  dueDate = "--",

  daysRemaining = 0,

  paymentStatus = "Upcoming",

}: UpcomingEmiCardProps) {

  return (

    <SummaryCard title="Upcoming EMI">

      <span>

        EMI Amount :
        <strong> ₹ {emiAmount}</strong>

      </span>

      <span>

        Due Date :
        <strong> {dueDate}</strong>

      </span>

      <span>

        Days Remaining :
        <strong> {daysRemaining}</strong>

      </span>

      <span>

        Status :
        <strong> {paymentStatus}</strong>

      </span>

    </SummaryCard>

  );

}
