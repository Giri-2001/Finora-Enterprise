/* ===========================================================
   FINORA ENTERPRISE OS™
   PAGINATION PANEL™

   COMPONENT
=========================================================== */

import SmartWallPagination
  from "../../../smartwall/SmartWallPagination";

import type {
  PaginationPanelProps,
} from "./PaginationPanel.types";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PaginationPanel({

  currentPage,

  totalCustomers,

  customersPerPage,

  onPrevious,

  onNext,

}: PaginationPanelProps) {

  return (

    <SmartWallPagination

      currentPage={
        currentPage
      }

      totalCustomers={
        totalCustomers
      }

      customersPerPage={
        customersPerPage
      }

      onPrevious={
        onPrevious
      }

      onNext={
        onNext
      }

    />

  );

}
