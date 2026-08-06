/* ===========================================================
   FINORA ENTERPRISE OS™
   COLLECTION STUDIO™

   HOOKS
=========================================================== */

import {
  useEffect,
} from "react";

import type {
  Loan,
} from "../../types";

import type {
  CollectionReviewData,
} from "./types";

import {
  buildReviewDataFromLoan,
  resetCollectionForm,
} from "./helpers";

/* ===========================================================
   SYNC SELECTED LOAN
=========================================================== */

export function useLoanSynchronization(
  customerId: string | undefined,
  customerName: string | undefined,
  phoneNumber: string | undefined,
  selectedLoan: Loan | undefined,
  setReviewData: React.Dispatch<
    React.SetStateAction<CollectionReviewData>
  >,
) {
  useEffect(() => {
    setReviewData((previous) => ({
      ...buildReviewDataFromLoan(
        previous,
        selectedLoan,
      ),

      customerId: customerId ?? "",
      customerName: customerName ?? "",
      customerPhone: phoneNumber ?? "",
    }));
  }, [
    customerId,
    customerName,
    phoneNumber,
    selectedLoan,
    setReviewData,
  ]);
}

/* ===========================================================
   RESET COLLECTION FORM
=========================================================== */

export function useCollectionReset(
  setReviewData: React.Dispatch<
    React.SetStateAction<CollectionReviewData>
  >,
) {
  useEffect(() => {
    function handleLoanUpdated() {
      setReviewData((previous) =>
        resetCollectionForm(previous),
      );
    }

    window.addEventListener(
      "FINORA_LOAN_UPDATED",
      handleLoanUpdated,
    );

    return () => {
      window.removeEventListener(
        "FINORA_LOAN_UPDATED",
        handleLoanUpdated,
      );
    };
  }, [setReviewData]);
}
