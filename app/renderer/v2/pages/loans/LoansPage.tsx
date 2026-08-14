// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 LOANS OFFICE™
//
// ROUTE ENTRY
//
// RESPONSIBILITY:
// - Open the V2 Loans Office
// - Listen for the V2 Loan Studio open event
// - Render Loan Studio without using V1 Loans
// - Keep Loans Office and Loan Studio as separate screens
//
// IMPORTANT:
// - NEVER import ../../../pages/loans/Loans
// - NEVER use the V1 Loans page
// - Loans.tsx owns the Loans Office UI
// - LoanStudio owns the Loan creation workflow
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import {
  useEffect,
  useState,
} from "react";

import Loans
  from "./Loans";

import LoanStudio
  from "../../components/customers/office/CustomerOffice/components/LoanStudio";


// ============================================================
// COMPONENT
// ============================================================

export default function LoansPage() {

  // ==========================================================
  // LOAN STUDIO VISIBILITY
  // ==========================================================

  const [
    showLoanStudio,
    setShowLoanStudio,
  ] = useState(false);


  // ==========================================================
  // OPEN LOAN STUDIO
  //
  // Loans.tsx dispatches:
  //
  // FINORA_V2_OPEN_LOAN_STUDIO
  //
  // This route boundary receives that event and switches from
  // Loans Office → Loan Studio.
  // ==========================================================

  useEffect(() => {

    function handleOpenLoanStudio(): void {

      setShowLoanStudio(true);

    }


    window.addEventListener(
      "FINORA_V2_OPEN_LOAN_STUDIO",
      handleOpenLoanStudio,
    );


    return () => {

      window.removeEventListener(
        "FINORA_V2_OPEN_LOAN_STUDIO",
        handleOpenLoanStudio,
      );

    };

  }, []);


  // ==========================================================
  // LOAN STUDIO
  // ==========================================================

  if (showLoanStudio) {

    return (
      <LoanStudio />
    );

  }


  // ==========================================================
  // LOANS OFFICE
  // ==========================================================

  return (
    <Loans />
  );

}


// ============================================================
// END
// ============================================================
