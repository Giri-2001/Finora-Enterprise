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

import {
  beginFinoraPostCollectionOperation,
} from "../../../services/activation/finoraCommercialWriteOperation";

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

import {
  finoraError,
  finoraSuccess,
  finoraWarning,
} from "../../common/dialog/finoraDialog.service";

import {
  startFinoraProcessing,
  stopFinoraProcessing,
} from "../../common/feedback/finoraProcessing.service";


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

      await finoraWarning(
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

      await finoraWarning(
        "Please enter collection amount",
      );

      return;

    }


    // ========================================================
    // COLLECTION WORKFLOW
    // ========================================================

    const processingId =
      startFinoraProcessing(
        "Completing Collection...",
      );

    try {

      // ------------------------------------------------------
      // FRESH COMMERCIAL TRANSACTION AUTHORIZATION
      //
      // Legacy path skips Collection number reservation.
      // ------------------------------------------------------

      const operationResult =
        await beginFinoraPostCollectionOperation();

      if (!operationResult.success) {
        throw new Error(
          operationResult.error,
        );
      }

      const commercialWriteAuthorization =
        operationResult.authorization;


      // ------------------------------------------------------
      // UPDATE LOAN OUTSTANDING
      //
      // Loan access now goes through LoanService.
      // ------------------------------------------------------

      const updatedLoan =
        await updateLoanOutstandingAmount(
          reviewData.loanId,
          reviewData.paymentAmount,
          undefined,
          commercialWriteAuthorization,
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
        commercialWriteAuthorization,
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

      stopFinoraProcessing(
        processingId,
      );

      await finoraSuccess(
        "Collection Completed Successfully",
      );

    } catch (
      error
    ) {

      console.error(
        "COLLECTION ERROR:",
        error,
      );


      stopFinoraProcessing(
        processingId,
      );

      await finoraError(
        error instanceof Error
          ? error.message
          : "Collection failed",
      );

    } finally {
      stopFinoraProcessing(
        processingId,
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
