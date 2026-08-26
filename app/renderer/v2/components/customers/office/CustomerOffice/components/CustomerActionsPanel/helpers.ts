/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER ACTIONS PANEL™

   HELPERS
=========================================================== */

import { CUSTOMER_ACTIONS } from "./constants";
import type { CustomerActionItem, CustomerActionsPanelProps } from "./types";

/* ===========================================================
   BUILD CUSTOMER ACTIONS
=========================================================== */

export function buildCustomerActions(
  handlers: CustomerActionsPanelProps,
): Array<CustomerActionItem & { onClick: () => void }> {
  return CUSTOMER_ACTIONS.map((action) => ({
    ...action,

    onClick: () => {
      switch (action.title) {
        case "Apply Loan":
          handlers.onApplyLoan?.();
          break;

        case "Collect Payment":
          handlers.onCollectPayment?.();
          break;

        case "Documents":
          handlers.onDocuments?.();
          break;

        case "Timeline":
          handlers.onTimeline?.();
          break;

        case "Reports":
          handlers.onReports?.();
          break;

        default:
          break;
      }
    },
  }));
}
