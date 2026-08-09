// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTIONS ENGINE
//
// REVIEW ACTIONS
//
// RESPONSIBILITY:
//
// - Complete collection workflow
// - Validate collection review data
// - Update related Loan through LoanService
// - Save Collection through CollectionService
// - Notify Customer Office about Loan updates
//
// IMPORTANT:
//
// - No direct LoanRepository access.
// - No direct localStorage access.
// - Loan persistence remains below LoanService.
// - Collection persistence remains below CollectionService.
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import Button
  from "../../common/buttons/Button";

import SummaryCard
  from "../../common/cards/SummaryCard";

import {
  useCollectionController,
} from "../controller";

import {
  updateLoanOutstandingAmount,
} from "../../../services/loan/loanService";

import {
  approveCollection,
} from "../../../services/collection/collectionService";


// ============================================================
// COMPONENT
// ============================================================

export default function ReviewActions() {

  const {
    reviewData,
  } = useCollectionController();


  // ==========================================================
  // COMPLETE COLLECTION
  // ==========================================================

  async function handleCompleteCollection():
    Promise<void> {

    console.log(
      "COLLECTION LOAN ID:",
      reviewData.loanId,
    );


    console.log(
      "PAYMENT AMOUNT:",
      reviewData.paymentAmount,
    );


    // ========================================================
    // LOAN VALIDATION
    // ========================================================

    if (
      !reviewData.loanId
    ) {

      alert(
        "Please select loan",
      );

      return;

    }


    // ========================================================
    // PAYMENT VALIDATION
    // ========================================================

    if (
      !reviewData.paymentAmount ||
      reviewData.paymentAmount <= 0
    ) {

      alert(
        "Please enter collection amount",
      );

      return;

    }


    // ========================================================
    // COLLECTION WORKFLOW
    // ========================================================

    try {

      // ------------------------------------------------------
      // UPDATE LOAN OUTSTANDING
      //
      // Loan access now goes through LoanService.
      // ------------------------------------------------------

      const updatedLoan =
        await updateLoanOutstandingAmount(
          reviewData.loanId,
          reviewData.paymentAmount,
        );


      // ------------------------------------------------------
      // LOAN UPDATE VALIDATION
      //
      // A missing Loan means the persistence layer could not
      // find or update the requested Loan.
      // ------------------------------------------------------

      if (
        !updatedLoan
      ) {

        throw new Error(
          "Unable to update the selected loan.",
        );

      }


      // ------------------------------------------------------
      // SAVE COLLECTION RECORD
      // ------------------------------------------------------

      await approveCollection(
        reviewData,
      );


      // ------------------------------------------------------
      // REFRESH CUSTOMER OFFICE DATA
      // ------------------------------------------------------

      window.dispatchEvent(
        new Event(
          "FINORA_LOAN_UPDATED",
        ),
      );


      // ------------------------------------------------------
      // SUCCESS
      // ------------------------------------------------------

      alert(
        "Collection Completed Successfully",
      );

    } catch (
      error
    ) {

      console.error(
        "COLLECTION ERROR:",
        error,
      );


      alert(
        "Collection failed",
      );

    }

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <SummaryCard
      title="Review Actions"
    >

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >

        {/* ==================================================
            SAVE DRAFT
        ================================================== */}

        <Button
          onClick={() => {

            console.log(
              "Save Draft",
            );

          }}
        >

          Save Draft

        </Button>


        {/* ==================================================
            COMPLETE COLLECTION
        ================================================== */}

        <Button
          onClick={
            handleCompleteCollection
          }
        >

          Complete Collection

        </Button>


        {/* ==================================================
            GENERATE REPORT
        ================================================== */}

        <Button
          onClick={() => {

            console.log(
              "Generate Report",
            );

          }}
        >

          Generate Report

        </Button>

      </div>

    </SummaryCard>

  );

}


// ============================================================
// END
// ============================================================
