/* ===========================================================
   FINORA ENTERPRISE OS™
   SMART WALL PAGINATION™

   TYPES
=========================================================== */

/* ===========================================================
   COMPONENT PROPS
=========================================================== */

export interface SmartWallPaginationProps {

  currentPage: number;

  totalCustomers: number;

  customersPerPage?: number;

  onPrevious?: () => void;

  onNext?: () => void;

}
