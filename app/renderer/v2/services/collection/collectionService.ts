// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTIONS ENGINE™
//
// COLLECTION SERVICE
//
// RESPONSIBILITY
//
// - Provide application-level Collection service boundary
// - Build and persist collection records
// - Preserve complete collection workflow state
// - Preserve selected EMI payment information
// - Preserve EMI receipt / paid-date information
// - Load persisted collection records
// - Keep Collection UI independent from repositories
// - Keep StorageManager details outside UI code
//
// IMPORTANT
//
// - No localStorage access.
// - No filesystem access.
// - No Electron IPC.
// - No direct StorageManager access.
// - No direct LoanRepository access.
// - No UI logic.
// - CollectionRepository owns Collection persistence.
// - CollectionBuilder owns Collection record construction.
// - LoanService remains the Loan persistence boundary.
// - Selected EMI state belongs to the collection workflow payload
//   and must never be silently discarded by this service.
//
// EMI PAYMENT STATE
//
// The following controller values are intentionally preserved
// when building the persisted Collection:
//
// - selectedEmiNumbers
// - selectedEmiAmount
// - receiptNumber
// - receiptDate
//
// These values are required so Collection history retains the
// exact EMI selection/payment context associated with a receipt.
//
// IMPORTANT:
//
// CollectionService does NOT mutate Loan EMI rows.
// Loan EMI mutation remains exclusively inside LoanService /
// LoanRepository.
//
// VERSION : 2.1
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  CollectionReviewData,
} from "../../components/collections/CollectionReviewData";

import {
  buildCollection,
} from "./collectionBuilder";

import {
  collectionRepository,
} from "../../repositories/collection/collectionRepository";

// ============================================================
// COLLECTION WORKFLOW NORMALIZATION
// ============================================================
//
// CollectionBuilder remains the canonical Collection builder.
//
// This service-level normalization exists only to guarantee
// that workflow metadata carried by CollectionReviewData is
// not accidentally lost before persistence.
//
// No financial calculation is performed here.
//
// ============================================================

function normalizeCollectionWorkflow(
  reviewData: CollectionReviewData,
): CollectionReviewData {

  // ==========================================================
  // SELECTED EMI NUMBERS
  // ==========================================================
  //
  // Preserve only valid positive integer EMI numbers.
  //
  // Duplicates are removed.
  //
  // ==========================================================

  const selectedEmiNumbers = Array.isArray(
    reviewData.selectedEmiNumbers,
  )
    ? Array.from(
        new Set(
          reviewData.selectedEmiNumbers
            .map((value) => Number(value))
            .filter(
              (value) =>
                Number.isInteger(value) &&
                value > 0,
            ),
        ),
      )
    : [];

  // ==========================================================
  // SELECTED EMI AMOUNT
  // ==========================================================

  const selectedEmiAmountValue =
    Number(
      reviewData.selectedEmiAmount ?? 0,
    );

  const selectedEmiAmount =
    Number.isFinite(
      selectedEmiAmountValue,
    )
      ? Math.max(
          0,
          selectedEmiAmountValue,
        )
      : 0;

  // ==========================================================
  // RECEIPT NUMBER
  // ==========================================================

  const receiptNumber =
    String(
      reviewData.receiptNumber ?? "",
    ).trim();

  // ==========================================================
  // RECEIPT DATE
  // ==========================================================

  const receiptDate =
    String(
      reviewData.receiptDate ?? "",
    ).trim();

  // ==========================================================
  // RETURN COMPLETE COLLECTION STATE
  // ==========================================================
  //
  // IMPORTANT:
  //
  // Spread the complete reviewData first.
  //
  // This prevents unrelated CollectionReviewData fields from
  // being dropped by the service boundary.
  //
  // Workflow fields are then explicitly normalized.
  //
  // ==========================================================

  return {
    ...reviewData,

    selectedEmiNumbers,

    selectedEmiAmount,

    receiptNumber,

    receiptDate,
  };
}

// ============================================================
// BUILD COLLECTION PAYLOAD
// ============================================================
//
// The CollectionBuilder remains responsible for constructing
// the canonical persisted Collection object.
//
// This wrapper guarantees the complete workflow state reaches
// the builder.
//
// ============================================================

function buildPersistedCollection(
  reviewData: CollectionReviewData,
): CollectionReviewData {

  const normalizedReviewData =
    normalizeCollectionWorkflow(
      reviewData,
    );

  const collection =
    buildCollection(
      normalizedReviewData,
    );

  // ==========================================================
  // FINAL WORKFLOW STATE PRESERVATION
  // ==========================================================
  //
  // The builder may intentionally normalize Collection fields.
  //
  // These workflow fields must nevertheless remain available
  // on the persisted Collection record.
  //
  // ==========================================================

  return {
    ...collection,

    selectedEmiNumbers:
      normalizedReviewData.selectedEmiNumbers,

    selectedEmiAmount:
      normalizedReviewData.selectedEmiAmount,

    receiptNumber:
      normalizedReviewData.receiptNumber,

    receiptDate:
      normalizedReviewData.receiptDate,
  };
}

// ============================================================
// APPROVE COLLECTION
// ============================================================
//
// Collection persistence boundary.
//
// IMPORTANT:
//
// This function does NOT update the Loan.
//
// Loan outstanding / EMI mutation has already been delegated
// through LoanService by the Collection workflow action.
//
// Keeping the responsibilities separate prevents accidental
// double deduction of the Loan outstanding balance.
//
// ============================================================

export async function approveCollection(
  reviewData: CollectionReviewData,
): Promise<CollectionReviewData> {

  // ==========================================================
  // BUILD AUTHORITATIVE COLLECTION
  // ==========================================================

  const collection =
    buildPersistedCollection(
      reviewData,
    );

  // ==========================================================
  // PERSIST COLLECTION
  // ==========================================================

  return collectionRepository.save(
    collection,
  );
}

// ============================================================
// UPDATE COLLECTION
// ============================================================
//
// Existing Collection update workflows continue to use the
// same application boundary.
//
// ============================================================

export async function updateCollection(
  reviewData: CollectionReviewData,
): Promise<CollectionReviewData> {

  // ==========================================================
  // BUILD AUTHORITATIVE COLLECTION
  // ==========================================================

  const collection =
    buildPersistedCollection(
      reviewData,
    );

  // ==========================================================
  // PERSIST UPDATED COLLECTION
  // ==========================================================

  return collectionRepository.update(
    collection,
  );
}

// ============================================================
// LOAD ALL COLLECTIONS
// ============================================================
//
// Collection History uses this service boundary and then
// selects records belonging to the currently selected loan.
//
// No UI or persistence implementation is exposed to the
// component.
//
// ============================================================

export async function loadCollections():
  Promise<CollectionReviewData[]> {

  return collectionRepository.getAll();
}

// ============================================================
// LOAD SINGLE COLLECTION
// ============================================================

export async function loadCollection(
  id: string,
): Promise<CollectionReviewData | null> {

  if (!id) {
    return null;
  }

  return collectionRepository.findById(
    id,
  );
}

// ============================================================
// SINGLETON SERVICE BOUNDARY
// ============================================================
//
// Exporting the named functions above remains compatible with
// existing imports:
//
//   approveCollection
//   updateCollection
//   loadCollections
//   loadCollection
//
// The object below additionally provides a single application
// service surface for future consumers without changing the
// existing API.
//
// ============================================================

export const collectionService = {
  approveCollection,

  updateCollection,

  loadCollections,

  loadCollection,
};

// ============================================================
// END
// ============================================================