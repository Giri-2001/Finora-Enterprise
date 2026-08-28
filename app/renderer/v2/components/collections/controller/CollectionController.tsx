/* ============================================================
   FINORA ENTERPRISE OS™

   COLLECTION STUDIO™

   COLLECTION CONTROLLER

   RESPONSIBILITY

   - Expose CollectionContext state
   - Provide controlled field updates
   - Provide collection-specific update helpers
   - Keep CollectionContext as the source of truth
   - Preserve sequential field updates safely
   - Keep business calculations outside the controller
   - Keep persistence outside the controller

   IMPORTANT

   - No financial calculations
   - No persistence
   - No repository access
   - No API access
   - No localStorage access
   - No EMI schedule generation
   - No business-rule duplication
   - No useEffect synchronization
   - Existing controller methods remain compatible

   CRITICAL STATE RULE

   Multiple updateField() calls may occur synchronously inside
   one user action.

   Example:

     updateField("selectedEmiNumbers", [3, 4]);
     updateField("selectedEmiAmount", 5800);
     updateField("paymentAmount", 5800);

   React state updates do not immediately update the reviewData
   object captured by the current render.

   Therefore every controller write must merge against the
   latest controller snapshot, not against a stale render
   snapshot.

   A synchronous ref is used as the transaction snapshot.

   This preserves:

     selectedEmiNumbers
     selectedEmiAmount
     paymentAmount

   across consecutive updates without introducing an effect or
   render loop.

   VERSION : 2.2
   STATUS  : Production
============================================================ */

/* ============================================================
   IMPORTS
============================================================ */

import { useRef } from "react";

import { useCollection } from "../context/CollectionContext";

/* ============================================================
   COLLECTION CONTROLLER
============================================================ */

export function useCollectionController() {
  const { reviewData, onReviewDataChange } = useCollection();

  /* ==========================================================
     LATEST REVIEW DATA SNAPSHOT

     IMPORTANT:

     reviewData represents the state from the current React
     render.

     When several updateField() calls happen before React
     renders again, reviewData itself is still the old snapshot.

     This ref is updated synchronously whenever the controller
     writes state, allowing the next write in the same event to
     build from the immediately previous controller update.
  ========================================================== */

  const latestReviewDataRef = useRef(reviewData);

  /*
   * Keep the ref aligned with authoritative context state on
   * every render.
   *
   * This is a synchronous ref assignment only.
   *
   * It does NOT trigger rendering.
   * It does NOT create an effect.
   * It does NOT create a state synchronization loop.
   */

  latestReviewDataRef.current = reviewData;

  /* ==========================================================
     GENERIC REVIEW DATA UPDATE
  ========================================================== */

  function updateReviewData(updates: Partial<typeof reviewData>): void {
    /*
     * Always merge against the latest controller snapshot.
     *
     * Never merge directly against the reviewData variable
     * captured by this render because consecutive writes in the
     * same event could otherwise overwrite each other.
     */

    const nextReviewData = {
      ...latestReviewDataRef.current,
      ...updates,
    };

    /*
     * Update the synchronous transaction snapshot BEFORE
     * notifying React.
     *
     * Therefore a second updateField() call in the same event
     * sees the result of this first update immediately.
     */

    latestReviewDataRef.current = nextReviewData;

    /*
     * CollectionContext remains the authoritative state owner.
     */

    onReviewDataChange(nextReviewData);
  }

  /* ==========================================================
     FIELD UPDATE
  ========================================================== */

  function updateField<K extends keyof typeof reviewData>(
    field: K,
    value: (typeof reviewData)[K],
  ): void {
    updateReviewData({
      [field]: value,
    } as Partial<typeof reviewData>);
  }

  /* ==========================================================
     COLLECTION TYPE
  ========================================================== */

  function updateCollectionType(value: "emi" | "manual"): void {
    updateField("collectionType", value);
  }

  /* ==========================================================
     EMI SELECTION

     selectedEmiNumbers and selectedEmiAmount remain separate
     from paymentAmount.

     selectedEmiNumbers
       = exact EMI rows selected by the operator

     selectedEmiAmount
       = total value represented by those EMI rows

     paymentAmount
       = final collection transaction amount

     The controller does not calculate these values.

     It only preserves and stores values supplied by the
     presentation / workflow layer.
  ========================================================== */

  function updateSelectedEmiNumbers(value: number[]): void {
    updateField("selectedEmiNumbers", value);
  }

  function updateSelectedEmiAmount(value: number): void {
    updateField("selectedEmiAmount", value);
  }

  /* ==========================================================
     COLLECTION DATE
  ========================================================== */

  function updateCollectionDate(value: string): void {
    updateField("receiptDate", value);
  }

  /* ==========================================================
     COLLECTION AMOUNT
  ========================================================== */

  function updateCollectionAmount(value: number): void {
    updateField("paymentAmount", value);
  }

  /* ==========================================================
     PAYMENT METHOD
  ========================================================== */

  function updatePaymentMethod(value: string): void {
    updateField("paymentMethod", value);
  }

  /* ==========================================================
     PAYMENT REFERENCE
  ========================================================== */

  function updatePaymentReference(value: string): void {
    updateField("paymentReference", value);
  }

  /* ==========================================================
     MANUAL PRINCIPAL
  ========================================================== */

  function updateManualPrincipal(value: number): void {
    updateField("advanceAdjustment", value);
  }

  /* ==========================================================
     DISCOUNT
  ========================================================== */

  function updateDiscount(value: number): void {
    updateField("discountAmount", value);
  }

  /* ==========================================================
     PENALTY / LATE FEE
  ========================================================== */

  function updatePenalty(value: number): void {
    updateField("penaltyAmount", value);
  }

  /* ==========================================================
     REMARKS
  ========================================================== */

  function updateRemarks(value: string): void {
    updateField("remarks", value);
  }

  /* ==========================================================
     RECEIPT NUMBER
  ========================================================== */

  function updateReceiptNumber(value: string): void {
    updateField("receiptNumber", value);
  }

  /* ==========================================================
     REVIEW STATUS
  ========================================================== */

  function updateStatus(value: "Draft" | "Approved"): void {
    updateField("status", value);
  }

  /* ==========================================================
     RETURN CONTROLLER API
  ========================================================== */

  return {
    /* ========================================================
       DATA
    ======================================================== */

    reviewData,

    /* ========================================================
       GENERIC UPDATE
    ======================================================== */

    updateReviewData,

    updateField,

    /* ========================================================
       COLLECTION TYPE
    ======================================================== */

    updateCollectionType,

    /* ========================================================
       EMI
    ======================================================== */

    updateSelectedEmiNumbers,

    updateSelectedEmiAmount,

    /* ========================================================
       COLLECTION
    ======================================================== */

    updateCollectionDate,

    updateCollectionAmount,

    /* ========================================================
       PAYMENT
    ======================================================== */

    updatePaymentMethod,

    updatePaymentReference,

    /* ========================================================
       SETTLEMENT
    ======================================================== */

    updateManualPrincipal,

    updateDiscount,

    updatePenalty,

    /* ========================================================
       REMARKS
    ======================================================== */

    updateRemarks,

    /* ========================================================
       RECEIPT
    ======================================================== */

    updateReceiptNumber,

    /* ========================================================
       REVIEW
    ======================================================== */

    updateStatus,
  };
}

/* ============================================================
   END
============================================================ */
