/* ===========================================================
   FINORA ENTERPRISE OS™
   PAGINATION PANEL™

   TYPES
=========================================================== */

export interface PaginationPanelProps {

  currentPage: number;

  totalCustomers: number;

  customersPerPage: number;

  onPrevious: () => void;

  onNext: () => void;

}
