/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HUB SUMMARY CARDS™

   TYPES
=========================================================== */


export interface CustomerHubSummaryCardsProps {

  totalCustomers: number;

  activeCustomers: number;


  // existing
  onOpenWorkspace?: () => void;

  onOpenCustomerData?: () => void;


  // NEW PAGINATION

  currentPage: number;

  totalPages: number;

  onPrevious: () => void;

  onNext: () => void;

}
