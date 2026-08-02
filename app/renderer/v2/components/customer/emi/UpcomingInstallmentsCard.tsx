/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   EMI SCHEDULE STUDIO
   UPCOMING INSTALLMENTS CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface UpcomingInstallmentsCardProps {

  installmentNumber?: number;

  emiAmount?: number;

  dueDate?: string;

  remainingDays?: number;

  paymentStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function UpcomingInstallmentsCard({

  installmentNumber = 1,

  emiAmount = 0,

  dueDate = "--",

  remainingDays = 0,

  paymentStatus = "Upcoming",

}: UpcomingInstallmentsCardProps) {

  return (

    <SummaryCard title="Upcoming Installment">

      <span>

        Installment :
        <strong> #{installmentNumber}</strong>

      </span>

      <span>

        EMI Amount :
        <strong> ₹ {emiAmount}</strong>

      </span>

      <span>

        Due Date :
        <strong> {dueDate}</strong>

      </span>

      <span>

        Remaining Days :
        <strong> {remainingDays}</strong>

      </span>

      <span>

        Status :
        <strong> {paymentStatus}</strong>

      </span>

    </SummaryCard>

  );

}
