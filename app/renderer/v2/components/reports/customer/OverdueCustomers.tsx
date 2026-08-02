/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   CUSTOMER REPORTS STUDIO
   OVERDUE CUSTOMERS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface OverdueCustomersProps {

  overdueCustomers?: number;

  overdueAmount?: number;

  highestOverdueCustomer?: string;

  oldestPendingDays?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function OverdueCustomers({

  overdueCustomers = 0,

  overdueAmount = 0,

  highestOverdueCustomer = "--",

  oldestPendingDays = 0,

}: OverdueCustomersProps) {

  return (

    <SummaryCard title="Overdue Customers">

      <span>

        Overdue Customers :
        <strong> {overdueCustomers}</strong>

      </span>

      <span>

        Outstanding Amount :
        <strong> ₹ {overdueAmount}</strong>

      </span>

      <span>

        Highest Overdue :
        <strong> {highestOverdueCustomer}</strong>

      </span>

      <span>

        Oldest Pending :
        <strong> {oldestPendingDays} Days</strong>

      </span>

    </SummaryCard>

  );

}
