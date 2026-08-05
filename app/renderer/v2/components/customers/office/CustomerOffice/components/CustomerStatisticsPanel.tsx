/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER STATISTICS PANEL™

   WORK DESK ADAPTER
=========================================================== */

import CustomerStatistics from "../../../basic/CustomerStatistics";

import type {
  OfficeCustomer,
} from "../types";

/* ===========================================================
   TYPES
=========================================================== */

interface CustomerStatisticsPanelProps {

  customer: OfficeCustomer;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerStatisticsPanel({

  customer,

}: CustomerStatisticsPanelProps) {

  return (

    <CustomerStatistics

      value={{

        customerSince: "--",

        totalLoans: 0,

        activeLoans:
          customer.active ? 1 : 0,

        closedLoans:
          customer.active ? 0 : 1,

      }}

    />

  );

}
