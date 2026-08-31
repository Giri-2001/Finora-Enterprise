// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// COLLECTION REVIEW DATA
//
// RESPONSIBILITY
//
// - Canonical data contract for the Collection Studio review flow
// - Carries authoritative customer information
// - Carries authoritative loan information
// - Carries EMI selection information
// - Carries payment / settlement information
// - Carries receipt information
// - Carries collection workflow state
//
// IMPORTANT
//
// - This file contains TYPES ONLY.
// - No business logic belongs here.
// - No calculations belong here.
// - No API / repository access belongs here.
// - No UI logic belongs here.
// - Existing fields are preserved for compatibility.
// - EMI selection remains separate from final paymentAmount.
// - System Generated collection calculations consume the original
//   loan principal, loan interest rate and loan date.
// - EMI amount is not the interest calculation basis.
//
// VERSION : 2.2
// STATUS  : Production
// ============================================================

// ============================================================
// COLLECTION REVIEW DATA
// ============================================================

export interface CollectionReviewData {
  // ==========================================================
  // CUSTOMER
  // ==========================================================

  customerId: string;

  customerName: string;

  customerPhone: string;

  // ==========================================================
  // LOAN
  // ==========================================================

  loanId: string;

  loanNumber: string;

  /**
   * Original principal amount actually disbursed.
   *
   * IMPORTANT:
   *
   * This remains the authoritative principal basis for
   * System Generated collection interest.
   *
   * EMI / installment amount must NOT replace this value.
   */
  loanAmount: number;

  /**
   * Current persisted outstanding loan balance.
   *
   * This value remains part of the existing collection
   * workflow and must not be confused with loanAmount.
   */
  outstandingBalance: number;

  /**
   * Monthly flat interest percentage attached to the
   * selected loan.
   */
  loanInterestRate: number;

  /**
   * Original loan date.
   *
   * System Generated accrued interest uses this date
   * as the interest start date.
   */
  loanDate: string;

  /**
   * Existing calculated / workflow due values.
   *
   * IMPORTANT:
   *
   * todayDue is retained for existing collection workflow
   * compatibility.
   *
   * It is NOT used as accrued interest by the
   * System Generated panel.
   */
  todayDue: number;

  previousDue: number;

  // ==========================================================
  // EMI SELECTION
  // ==========================================================

  /**
   * Canonical selected EMI numbers for the current
   * collection transaction.
   *
   * Examples:
   *
   * [1]
   * [1, 2]
   * [2, 3, 4]
   *
   * These values identify the exact persisted EMI rows
   * selected by the user.
   *
   * Paid / Preclosed EMI rows must never be selected
   * by the collection workflow.
   */
  selectedEmiNumbers?: number[];

  /**
   * Total amount represented by the selected EMI rows.
   *
   * This is intentionally separate from paymentAmount.
   *
   * selectedEmiAmount
   *   = sum of selected eligible EMI amounts
   *
   * paymentAmount
   *   = final collection transaction amount
   */
  selectedEmiAmount?: number;

  // ==========================================================
  // PAYMENT
  // ==========================================================

  /**
   * Final collection transaction amount prepared by
   * Collection Entry / Collection Controller.
   *
   * This value is intentionally separate from
   * selectedEmiAmount because manual collection and
   * other settlement workflows may use a different amount.
   */
  paymentAmount: number;

  /**
   * Selected collection payment method.
   *
   * Example values may include:
   *
   * Cash
   * UPI
   * Bank Transfer
   * Other
   *
   * The actual allowed values remain controlled by the
   * payment workflow rather than this data contract.
   */
  paymentMethod: string;

  /**
   * Optional payment reference / transaction reference.
   */
  paymentReference: string;

  // ==========================================================
  // SETTLEMENT
  // ==========================================================

  /**
   * Late fee / penalty amount.
   *
   * System Generated collection presentation treats this
   * as an additional generated amount.
   */
  penaltyAmount: number;

  /**
   * Discount applied during settlement.
   */
  discountAmount: number;

  /**
   * Manual principal / advance adjustment value.
   *
   * Existing Collection Entry workflow uses this field
   * for manual principal handling.
   */
  advanceAdjustment: number;

  /**
   * Collection remarks / operator notes.
   */
  remarks: string;

  // ==========================================================
  // COLLECTION / RECEIPT IDENTITY
  // ==========================================================

  /**
   * Authoritative human-readable FINORA Collection Number.
   *
   * Example:
   *
   * FIN-COL-RGG-BR1-100001-001-001
   *
   * Internal Collection storage identity remains separate.
   */
  collectionNumber: string;

  /**
   * Authoritative FINORA Receipt Number.
   *
   * Receipt mirrors the exact Collection transaction sequence
   * and owns no separate counter.
   *
   * Example:
   *
   * FIN-RCP-RGG-BR1-100001-001-001
   */
  receiptNumber: string;

  /**
   * Collection receipt date.
   */
  receiptDate: string;

  // ==========================================================
  // REVIEW
  // ==========================================================

  /**
   * Current review state.
   *
   * Draft:
   *   Collection data is still being prepared.
   *
   * Approved:
   *   Collection data has passed the review stage.
   */
  status: "Draft" | "Approved";

  /**
   * Collection review creation timestamp.
   */
  createdAt: string;

  /**
   * Last collection review update timestamp.
   */
  updatedAt: string;

  // ==========================================================
  // COLLECTION TYPE
  // ==========================================================

  /**
   * Presentation / workflow collection mode.
   *
   * emi:
   *   Collection is based on selected persisted EMI rows.
   *
   * manual:
   *   Collection is entered manually.
   *
   * IMPORTANT:
   *
   * This remains optional for backward compatibility with
   * existing collection records / controller initialization.
   */
  collectionType?: "emi" | "manual";
}

// ============================================================
// END
// ============================================================
