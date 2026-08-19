/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER PAGINATION HOOK™

   RESPONSIBILITY:
   - Paginate Customer Office records
   - Use Responsive Engine for cards-per-page
   - Reset pagination when responsive capacity changes
   - Reset pagination when filtered dataset changes
   - Keep pagination logic separate from presentation
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useEffect,
  useMemo,
  useState,
} from "react";


import type {
  OfficeCustomer,
} from "../../CustomerOffice/types";


import paginateCustomers
  from "../selectors/paginateCustomers";


import {
  getCustomerCardsPerPage,
} from "../../../../../utils/responsive";


import useResponsive
  from "../../../../../utils/responsive/useResponsive";


/* ===========================================================
   HOOK
=========================================================== */

export default function useCustomerPagination(
  customers: OfficeCustomer[],
) {


  /* =========================================================
     STATE
  ========================================================= */

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);


  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const responsive =
    useResponsive();


  const customersPerPage =
    getCustomerCardsPerPage(
      responsive.width,
    );


  /* =========================================================
     TOTAL PAGES
  ========================================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        customers.length /
        customersPerPage,
      ),
    );


  /* =========================================================
     RESPONSIVE RESET
     
     When the viewport changes and the number of customer
     cards per page changes, return to the first page.
  ========================================================= */

  useEffect(() => {

    setCurrentPage(1);

  }, [
    customersPerPage,
  ]);


  /* =========================================================
     DATASET RESET
     
     Search/filter changes can reduce the available dataset.
     
     Example:
     Page 3 → search → only 1 page remains.
     
     Customer Office must return to page 1 instead of showing
     an empty page.
  ========================================================= */

  useEffect(() => {

    setCurrentPage(1);

  }, [
    customers.length,
  ]);


  /* =========================================================
     PAGINATED CUSTOMERS
  ========================================================= */

  const paginatedCustomers =
    useMemo(() => {

      return paginateCustomers(
        customers,
        currentPage,
        customersPerPage,
      );

    }, [
      customers,
      currentPage,
      customersPerPage,
    ]);


  /* =========================================================
     NEXT PAGE
  ========================================================= */

  function nextPage() {

    setCurrentPage((page) =>
      Math.min(
        page + 1,
        totalPages,
      ),
    );

  }


  /* =========================================================
     PREVIOUS PAGE
  ========================================================= */

  function previousPage() {

    setCurrentPage((page) =>
      Math.max(
        page - 1,
        1,
      ),
    );

  }


  /* =========================================================
     RESET PAGE
  ========================================================= */

  function resetPage() {

    setCurrentPage(1);

  }


  /* =========================================================
     EXPORT
  ========================================================= */

  return {

    currentPage,

    totalPages,

    paginatedCustomers,

    nextPage,

    previousPage,

    resetPage,

    customersPerPage,

  };

}


/* ===========================================================
   END
=========================================================== */