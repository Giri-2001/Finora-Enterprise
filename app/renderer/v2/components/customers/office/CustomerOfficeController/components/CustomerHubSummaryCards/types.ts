/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HUB SUMMARY CARDS™

   TYPES

   RESPONSIBILITY:
   - Define Summary Cards component contract
   - Expose pagination handlers
   - Expose existing Work Desk navigation
   - Expose existing Customer Data navigation
   - Do not create navigation logic here
=========================================================== */

/* ===========================================================
   PROPS
=========================================================== */

export interface CustomerHubSummaryCardsProps {
  /* =========================================================
     CUSTOMER COUNTS
  ========================================================= */

  totalCustomers: number;

  activeCustomers: number;

  /* =========================================================
     PAGINATION
  ========================================================= */

  currentPage: number;

  totalPages: number;

  onPrevious: () => void;

  onNext: () => void;

  /* =========================================================
     WORK DESK
     
     Opens the EXISTING Customer Work Desk destination.
     
     This component only emits the click.
     Navigation/state ownership remains with
     CustomerOfficeController.
  ========================================================= */

  onOpenWorkspace?: () => void;

  /* =========================================================
     CUSTOMER DATA
     
     Opens the EXISTING Customer Data destination.
     
     This component only emits the click.
     No new Customer Data page is created here.
  ========================================================= */

  onOpenCustomerData?: () => void;
}

/* ===========================================================
   END
=========================================================== */
