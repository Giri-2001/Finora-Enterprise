// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// PAGE
//
// RESPONSIBILITY
//
// - Render Collection Studio page
// - Load authoritative Customer data through Customer Store
// - Load authoritative Loan data through LoanService
// - Show only customers having collection-ready loans
// - Automatically open the collection workspace
// - Maintain selected customer state
// - Maintain selected loan state
// - Normalize selected loan presentation data
// - Carry persisted loan documents into Collection Studio
// - Carry authoritative loan principal, interest and date
// - Establish CollectionContext for the complete Studio tree
// - Render complete Collection Studio workflow
// - Connect System Generated section
// - Connect Collection Entry section
// - Connect Payment Details section
// - Connect Loan Documents section
// - Connect Collection History section
// - Consume dedicated Collection Studio styles
//
// ARCHITECTURE LOCK
//
// - No business calculations
// - No persistence access
// - No repository access
// - No localStorage access
// - No direct filesystem access
// - No Electron IPC
// - No inline colour definitions
// - No inline responsive dimensions
// - No local breakpoint logic
// - No local theme system
// - Customer master data comes through Customer Store
// - Loan data comes through LoanService
// - Storage selection comes through StorageManager
// - Collection state is exposed through CollectionContext
// - Child collection sections remain controller-driven
//
// DOCUMENT WIRING
//
// - Selected Loan is authoritative.
// - Loan documents are carried unchanged from LoanService.
// - Collection Studio never uses dummy documents.
// - Collection Studio never mixes documents between loans.
// - Changing selected loan immediately changes its document gallery.
// - Persisted document dataUrl is preferred by LoanDocuments.
// - url remains the defensive fallback.
//
// FINANCIAL WIRING
//
// - Original loan principal comes from Loan.amount.
// - Monthly interest percentage comes from Loan.interest.
// - Loan date comes from Loan.loanDate.
// - EMI / schedule amount is NOT used by System Generated.
// - Step 3 calculates accrued interest from loan date.
// - Step 3 remains presentation-only.
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { useEffect, useMemo, useState } from "react";

import type { CustomerProfile } from "../../../types/customers";

import type { Loan } from "../../customers/office/CustomerOffice/types";

import type { DocumentsStudioItem } from "../../loans/documents/DocumentsStudio";

import type { CollectionReviewData } from "../CollectionReviewData";

import CollectionLoanSelection from "./CollectionLoanSelection";

import CollectionSystemGenerated from "./CollectionSystemGenerated";

import CollectionEntry from "./CollectionEntry";

import PaymentDetails from "./PaymentDetails";

import LoanDocuments from "./LoanDocuments";

import CollectionHistory from "./CollectionHistory";

import { CollectionContext } from "../context/CollectionContext";

import {
  hydrateCustomersFromStorage,
  clearCustomerCache,
} from "../../../store/customers/customer.store";

import { fetchLoans } from "../../../services/loan/loanService";

import { storageManager } from "../../../storage/storageManager";

import { StorageMode } from "../../../storage/storage.types";

import { collectionStudioStyles } from "./CollectionStudioPage.styles";

// ============================================================
// TYPES
// ============================================================

export interface CollectionLoanRecord {
  id: string;

  loanNumber: string;

  amount: number;

  repaymentType: string;

  status: string;

  outstanding: number;

  /*
   * Monthly flat interest percentage.
   */

  interest: number;

  /*
   * Original loan date.
   */

  loanDate: string;

  // ==========================================================
  // LOAN DOCUMENTS
  // ==========================================================

  documents: DocumentsStudioItem[];
}

export interface CollectionCustomerRecord {
  id: string;

  name: string;

  phone: string;

  photo?: string;

  loans: CollectionLoanRecord[];
}

// ============================================================
// CONSTANTS
// ============================================================

const STORAGE_MODE_SESSION_KEY = "FINORA_STORAGE_MODE";

// ============================================================
// EMPTY REVIEW DATA
// ============================================================

function createEmptyReviewData(): CollectionReviewData {
  const today = new Date().toISOString().slice(0, 10);

  return {
    customerId: "",

    customerName: "",

    customerPhone: "",

    loanId: "",

    loanNumber: "",

    loanAmount: 0,

    outstandingBalance: 0,

    loanInterestRate: 0,

    loanDate: "",

    todayDue: 0,

    previousDue: 0,

    paymentAmount: 0,

    paymentMethod: "cash",

    paymentReference: "",

    penaltyAmount: 0,

    discountAmount: 0,

    advanceAdjustment: 0,

    remarks: "",

    receiptNumber: "",

    receiptDate: today,

    status: "Draft",

    createdAt: "",

    updatedAt: "",

    collectionType: "manual",
  };
}

// ============================================================
// STORAGE MODE RESOLVER
// ============================================================

function getAuthenticatedStorageMode(): StorageMode {
  try {
    const storedMode = window.sessionStorage.getItem(STORAGE_MODE_SESSION_KEY);

    if (storedMode === StorageMode.USB) {
      return StorageMode.USB;
    }

    if (storedMode === StorageMode.CLOUD) {
      return StorageMode.CLOUD;
    }

    return StorageMode.LOCAL;
  } catch {
    return StorageMode.LOCAL;
  }
}

// ============================================================
// LOAN STATUS NORMALIZATION
// ============================================================

function normalizeLoanStatus(
  status: Loan["status"] | string | undefined,
): string {
  return String(status ?? "")
    .trim()
    .toUpperCase();
}

// ============================================================
// COLLECTION-READY LOAN CHECK
// ============================================================

function isCollectionReadyLoan(loan: Loan): boolean {
  const status = normalizeLoanStatus(loan.status);

  const outstanding = Number(loan.outstanding ?? 0);

  return (
    (status === "ACTIVE" || status === "RUNNING") &&
    Number.isFinite(outstanding) &&
    outstanding > 0
  );
}

// ============================================================
// CUSTOMER ACTIVE CHECK
// ============================================================

function isCollectionEligibleCustomer(customer: CustomerProfile): boolean {
  return (
    customer.identity.isDeleted !== true &&
    customer.internal.isArchived !== true &&
    customer.identity.isActive !== false
  );
}

// ============================================================
// LOAN → COLLECTION LOAN RECORD
//
// IMPORTANT:
//
// Loan.amount
//   → Original principal
//
// Loan.interest
//   → Monthly interest percentage
//
// Loan.loanDate
//   → Interest calculation start date
//
// EMI / schedule is intentionally not copied into
// the System Generated calculation boundary.
// ============================================================

function mapLoanToCollectionLoan(loan: Loan): CollectionLoanRecord {
  return {
    id: loan.id,

    loanNumber: loan.loanNumber || loan.id,

    amount: Number.isFinite(loan.amount) ? loan.amount : 0,

    repaymentType: String(loan.repaymentType ?? loan.loanType ?? ""),

    status: String(loan.status ?? ""),

    outstanding: Number.isFinite(loan.outstanding) ? loan.outstanding : 0,

    interest: Number.isFinite(loan.interest) ? loan.interest : 0,

    loanDate: String(loan.loanDate ?? ""),

    documents: Array.isArray(loan.documents) ? loan.documents : [],
  };
}

// ============================================================
// CUSTOMER → COLLECTION RECORD
// ============================================================

function buildCollectionCustomerRecord(
  customer: CustomerProfile,
  loans: Loan[],
): CollectionCustomerRecord {
  const customerId = customer.identity.customerId;

  const customerLoans = loans
    .filter((loan: Loan) => loan.customerId === customerId)
    .filter((loan: Loan) => isCollectionReadyLoan(loan))
    .map((loan: Loan) => mapLoanToCollectionLoan(loan));

  return {
    id: customerId,

    name: customer.basic.displayName || customer.basic.fullName || "Unknown",

    phone: customer.basic.mobileNumber || "",

    photo: customer.photo,

    loans: customerLoans,
  };
}

// ============================================================
// BUILD COLLECTION REVIEW DATA
//
// IMPORTANT:
//
// The selected loan remains the authoritative source.
//
// Principal:
//   loan.amount
//
// Interest:
//   loan.interest
//
// Interest start:
//   loan.loanDate
//
// EMI / todayDue is deliberately not used to build
// the Step 3 financial values.
// ============================================================

function buildReviewData(
  customer: CollectionCustomerRecord,
  loan: CollectionLoanRecord,
): CollectionReviewData {
  const now = new Date().toISOString();

  return {
    customerId: customer.id,

    customerName: customer.name,

    customerPhone: customer.phone,

    loanId: loan.id,

    loanNumber: loan.loanNumber,

    /*
     * ORIGINAL PRINCIPAL
     *
     * This is the actual amount given to the customer.
     */

    loanAmount: loan.amount,

    /*
     * Existing persisted outstanding value.
     *
     * Retained for the collection workflow.
     *
     * System Generated Step 3 uses loanAmount as
     * the principal basis instead of deriving principal
     * from EMI/todayDue.
     */

    outstandingBalance: loan.outstanding,

    /*
     * AUTHORITATIVE INTEREST TERMS
     */

    loanInterestRate: loan.interest,

    loanDate: loan.loanDate,

    /*
     * Existing EMI-related fields remain available
     * to Collection Entry.
     *
     * Step 3 does not use todayDue as accrued interest.
     */

    todayDue: 0,

    previousDue: 0,

    paymentAmount: 0,

    paymentMethod: "cash",

    paymentReference: "",

    penaltyAmount: 0,

    discountAmount: 0,

    advanceAdjustment: 0,

    remarks: "",

    receiptNumber: "",

    receiptDate: new Date().toISOString().slice(0, 10),

    status: "Draft",

    createdAt: now,

    updatedAt: now,

    collectionType: "manual",
  };
}

// ============================================================
// PAGE
// ============================================================

export default function CollectionStudioPage() {
  // ==========================================================
  // COLLECTION CUSTOMER DATA
  // ==========================================================

  const [collectionCustomers, setCollectionCustomers] = useState<
    CollectionCustomerRecord[]
  >([]);

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  const [loading, setLoading] = useState(true);

  // ==========================================================
  // CUSTOMER STATE
  // ==========================================================

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  // ==========================================================
  // LOAN STATE
  // ==========================================================

  const [selectedLoanId, setSelectedLoanId] = useState<string>("");

  // ==========================================================
  // COLLECTION REVIEW STATE
  // ==========================================================

  const [reviewData, setReviewData] = useState<CollectionReviewData>(
    createEmptyReviewData(),
  );

  // ==========================================================
  // LOAD AUTHORITATIVE CUSTOMER + LOAN DATA
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    async function loadCollectionWorkspace(): Promise<void> {
      setLoading(true);

      try {
        // ------------------------------------------------------
        // RESTORE AUTHENTICATED STORAGE MODE
        // ------------------------------------------------------

        const storageMode = getAuthenticatedStorageMode();

        const storageResult =
          await storageManager.selectStorageMode(storageMode);

        if (!storageResult.success) {
          throw new Error(
            storageResult.error ??
              `Unable to restore FINORA ${storageMode} storage.`,
          );
        }

        if (cancelled) {
          return;
        }

        // ------------------------------------------------------
        // CLEAR ONLY IN-MEMORY CUSTOMER CACHE
        // ------------------------------------------------------

        clearCustomerCache();

        // ------------------------------------------------------
        // HYDRATE AUTHORITATIVE CUSTOMER DATA
        // ------------------------------------------------------

        const customers = await hydrateCustomersFromStorage();

        if (cancelled) {
          return;
        }

        // ------------------------------------------------------
        // LOAD AUTHORITATIVE LOAN DATA
        // ------------------------------------------------------

        const loans = await fetchLoans();

        if (cancelled) {
          return;
        }

        // ------------------------------------------------------
        // BUILD COLLECTION-READY CUSTOMER LIST
        // ------------------------------------------------------

        const eligibleCustomers = customers
          .filter((customer: CustomerProfile) =>
            isCollectionEligibleCustomer(customer),
          )
          .map((customer: CustomerProfile) =>
            buildCollectionCustomerRecord(customer, loans),
          )
          .filter(
            (customer: CollectionCustomerRecord) => customer.loans.length > 0,
          );

        if (cancelled) {
          return;
        }

        setCollectionCustomers(eligibleCustomers);

        // ------------------------------------------------------
        // AUTO-OPEN FIRST CUSTOMER
        // ------------------------------------------------------

        const firstCustomer = eligibleCustomers[0];

        const firstLoan = firstCustomer?.loans[0];

        setSelectedCustomerId(firstCustomer?.id ?? "");

        setSelectedLoanId(firstLoan?.id ?? "");

        setReviewData(createEmptyReviewData());
      } catch (error) {
        console.error("FINORA COLLECTION CUSTOMER/LOAN LOAD ERROR:", error);

        if (!cancelled) {
          setCollectionCustomers([]);

          setSelectedCustomerId("");

          setSelectedLoanId("");

          setReviewData(createEmptyReviewData());
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCollectionWorkspace();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================================
  // SELECTED CUSTOMER
  // ==========================================================

  const selectedCustomer = useMemo(
    () =>
      collectionCustomers.find(
        (customer: CollectionCustomerRecord) =>
          customer.id === selectedCustomerId,
      ) ?? null,

    [collectionCustomers, selectedCustomerId],
  );

  // ==========================================================
  // CUSTOMER LOANS
  // ==========================================================

  const customerLoans = selectedCustomer?.loans ?? [];

  // ==========================================================
  // SELECTED LOAN
  // ==========================================================

  const selectedLoan = useMemo(
    () =>
      customerLoans.find(
        (loan: CollectionLoanRecord) => loan.id === selectedLoanId,
      ) ??
      customerLoans[0] ??
      null,

    [customerLoans, selectedLoanId],
  );

  // ==========================================================
  // SYNC SELECTED CUSTOMER / LOAN INTO CONTEXT
  // ==========================================================

  useEffect(() => {
    if (!selectedCustomer || !selectedLoan) {
      setReviewData(createEmptyReviewData());

      return;
    }

    setReviewData(buildReviewData(selectedCustomer, selectedLoan));
  }, [selectedCustomer, selectedLoan]);

  // ==========================================================
  // CUSTOMER CHANGE
  // ==========================================================

  function handleCustomerChange(customerId: string): void {
    const nextCustomer = collectionCustomers.find(
      (customer: CollectionCustomerRecord) => customer.id === customerId,
    );

    setSelectedCustomerId(customerId);

    // --------------------------------------------------------
    // First collection-ready loan of the new customer.
    // --------------------------------------------------------

    setSelectedLoanId(nextCustomer?.loans[0]?.id ?? "");
  }

  // ==========================================================
  // LOAN CHANGE
  // ==========================================================

  function handleLoanChange(loanId: string): void {
    const loanBelongsToCustomer = customerLoans.some(
      (loan: CollectionLoanRecord) => loan.id === loanId,
    );

    if (!loanBelongsToCustomer) {
      return;
    }

    setSelectedLoanId(loanId);
  }

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (loading) {
    return (
      <main style={collectionStudioStyles.page}>
        <div style={collectionStudioStyles.pageInner}>
          <section style={collectionStudioStyles.emptyState}>
            <strong style={collectionStudioStyles.emptyStateTitle}>
              Loading Collection Studio
            </strong>

            <span style={collectionStudioStyles.emptyStateMessage}>
              Loading collection-ready customers and loans.
            </span>
          </section>
        </div>
      </main>
    );
  }

  // ==========================================================
  // NO COLLECTION-READY CUSTOMERS
  // ==========================================================

  if (collectionCustomers.length === 0) {
    return (
      <main style={collectionStudioStyles.page}>
        <div style={collectionStudioStyles.pageInner}>
          <section style={collectionStudioStyles.emptyState}>
            <strong style={collectionStudioStyles.emptyStateTitle}>
              No collection-ready customers
            </strong>

            <span style={collectionStudioStyles.emptyStateMessage}>
              Customers will appear here automatically when they have an active
              or running loan with an outstanding balance.
            </span>
          </section>
        </div>
      </main>
    );
  }

  // ==========================================================
  // CUSTOMER / LOAN SAFETY FALLBACK
  // ==========================================================

  if (!selectedCustomer || !selectedLoan) {
    return (
      <main style={collectionStudioStyles.page}>
        <div style={collectionStudioStyles.pageInner}>
          <section style={collectionStudioStyles.emptyState}>
            <strong style={collectionStudioStyles.emptyStateTitle}>
              Preparing Collection Workspace
            </strong>

            <span style={collectionStudioStyles.emptyStateMessage}>
              Preparing the selected customer and collection-ready loan.
            </span>
          </section>
        </div>
      </main>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <CollectionContext.Provider
      value={{
        reviewData,

        onReviewDataChange: setReviewData,
      }}
    >
      <main style={collectionStudioStyles.page}>
        <div style={collectionStudioStyles.pageInner}>
          {/* ==================================================
              1. CUSTOMER + LOAN SELECTION
          ================================================== */}

          <div style={collectionStudioStyles.selectionRow}>
            {/* ==================================================
                CUSTOMER INFORMATION
            ================================================== */}

            <section style={collectionStudioStyles.customerCard}>
              <div style={collectionStudioStyles.customerSelectionArea}>
                <label
                  htmlFor="collection-customer-select"
                  style={collectionStudioStyles.fieldLabel}
                >
                  Select Customer
                </label>

                <div style={collectionStudioStyles.selectWrapper}>
                  <select
                    id="collection-customer-select"
                    value={selectedCustomer.id}
                    onChange={(event) =>
                      handleCustomerChange(event.target.value)
                    }
                    style={collectionStudioStyles.select}
                  >
                    <option value="" disabled>
                      Select Customer
                    </option>

                    {collectionCustomers.map(
                      (customer: CollectionCustomerRecord) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ),
                    )}
                  </select>

                  <span
                    aria-hidden="true"
                    style={collectionStudioStyles.selectArrow}
                  >
                    ▾
                  </span>
                </div>

                <div style={collectionStudioStyles.customerDetails}>
                  <div style={collectionStudioStyles.customerDetailLine}>
                    <span style={collectionStudioStyles.detailLabel}>
                      CUST ID
                    </span>

                    <span
                      style={collectionStudioStyles.detailValue}
                      title={selectedCustomer.id}
                    >
                      {selectedCustomer.id}
                    </span>
                  </div>

                  <div style={collectionStudioStyles.customerDetailLine}>
                    <span style={collectionStudioStyles.detailLabel}>
                      PHONE
                    </span>

                    <span style={collectionStudioStyles.detailValue}>
                      {selectedCustomer.phone || "--"}
                    </span>
                  </div>
                </div>
              </div>

              {/* ===============================================
                  CUSTOMER PHOTO
              =============================================== */}

              <div style={collectionStudioStyles.customerPhotoFrame}>
                {selectedCustomer.photo ? (
                  <img
                    src={selectedCustomer.photo}
                    alt={selectedCustomer.name}
                    style={collectionStudioStyles.customerPhoto}
                  />
                ) : (
                  <div style={collectionStudioStyles.photoPlaceholder}>
                    <span style={collectionStudioStyles.photoPlaceholderMark}>
                      F
                    </span>

                    <span style={collectionStudioStyles.photoPlaceholderText}>
                      FINORA
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* ==================================================
                CUSTOMER LOANS
            ================================================== */}

            <CollectionLoanSelection
              loans={customerLoans}
              selectedLoanId={selectedLoan.id}
              onSelectLoan={(loan) => handleLoanChange(loan.id)}
            />
          </div>

          {/* ==================================================
              3 + 4. COLLECTION WORKSPACE
          ================================================== */}

          <section style={collectionStudioStyles.collectionWorkspace}>
            <div style={collectionStudioStyles.systemGeneratedColumn}>
              <CollectionSystemGenerated />
            </div>

            <div style={collectionStudioStyles.collectionEntryColumn}>
              <CollectionEntry />
            </div>
          </section>

          {/* ==================================================
              6. PAYMENT DETAILS
          ================================================== */}

          <section style={collectionStudioStyles.paymentDetailsSection}>
            <PaymentDetails />
          </section>

          {/* ==================================================
              7 + 8. DOCUMENTS / HISTORY
          ================================================== */}

          <section style={collectionStudioStyles.documentsHistoryRow}>
            <div style={collectionStudioStyles.loanDocumentsColumn}>
              <LoanDocuments documents={selectedLoan.documents} />
            </div>

            <div style={collectionStudioStyles.collectionHistoryColumn}>
              <CollectionHistory />
            </div>
          </section>
        </div>
      </main>
    </CollectionContext.Provider>
  );
}

// ============================================================
// END
// ============================================================
