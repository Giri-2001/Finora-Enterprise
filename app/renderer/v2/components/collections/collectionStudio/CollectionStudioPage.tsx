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
// - Connect EMI Collection workspace
// - Connect System Generated middle workspace
// - Connect Manual Collection workspace
// - Connect full-width Payment Details
// - Connect full-width Loan Documents
// - Connect full-width Collection History
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
// PREMIUM COLLECTION WORKSPACE
//
// LEFT 40%
// - EMI Collection
//
// CENTER 20%
// - System Generated
//
// RIGHT 40%
// - Manual Collection
//
// BELOW
// - Payment Details       100%
// - Loan Documents        100%
// - Collection History    100%
//
// IMPORTANT:
//
// The top Customer + Customer Loans workspace is intentionally
// preserved.
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
// - System Generated remains presentation-only.
// - CollectionEntry retains all existing EMI / Manual logic.
//
// VERSION : 2.1
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { CSSProperties } from "react";

import { useEffect, useMemo, useState } from "react";

import { useTheme } from "../../../themes/provider";

import type { FinoraTheme } from "../../../themes/core/types";

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

import { customerDropdownStyles } from "./CustomerDropdown.styles";

// ============================================================
// THEME STYLE TYPE
// ============================================================

type CollectionStudioThemeStyle = CSSProperties & Record<`--${string}`, string>;

// ============================================================
// THEME VARIABLE FACTORY
// ============================================================

function createCollectionStudioThemeVariables(
  theme: FinoraTheme,
): CollectionStudioThemeStyle {
  return {
    "--finora-theme-brand-primary": theme.colors.brand.primary,

    "--finora-theme-brand-secondary": theme.colors.brand.secondary,

    "--finora-theme-brand-accent": theme.colors.brand.accent,

    "--finora-theme-brand-accent-soft": theme.colors.brand.accentSoft,

    "--finora-theme-page": theme.colors.background.page,

    "--finora-theme-background-page": theme.colors.background.page,

    "--finora-theme-surface": theme.colors.background.surface,

    "--finora-theme-background-surface": theme.colors.background.surface,

    "--finora-theme-surface-muted": theme.colors.background.surfaceMuted,

    "--finora-theme-background-surface-muted":
      theme.colors.background.surfaceMuted,

    "--finora-theme-surface-strong": theme.colors.background.surfaceStrong,

    "--finora-theme-text-primary": theme.colors.text.primary,

    "--finora-theme-text-secondary": theme.colors.text.secondary,

    "--finora-theme-text-body": theme.colors.text.secondary,

    "--finora-theme-text-muted": theme.colors.text.muted,

    "--finora-theme-text-inverse": theme.colors.text.inverse,

    "--finora-theme-border-default": theme.colors.border.default,

    "--finora-theme-border-strong": theme.colors.border.strong,

    "--finora-theme-border-subtle": theme.colors.border.subtle,

    "--finora-theme-focus": theme.colors.border.focus,

    "--finora-theme-success": theme.colors.status.success,

    "--finora-theme-success-soft": theme.colors.status.successSoft,

    "--finora-theme-success-border": theme.colors.border.strong,

    "--finora-theme-warning": theme.colors.status.warning,

    "--finora-theme-warning-soft": theme.colors.status.warningSoft,

    "--finora-theme-danger": theme.colors.status.danger,

    "--finora-theme-danger-soft": theme.colors.status.dangerSoft,

    "--finora-theme-info": theme.colors.status.info,

    "--finora-theme-info-soft": theme.colors.status.infoSoft,

    "--finora-theme-overlay-shadow": theme.colors.overlay.shadow,

    "--finora-theme-overlay-backdrop": theme.colors.overlay.backdrop,
  };
}

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

  interest: number;

  loanDate: string;

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

    loanAmount: loan.amount,

    outstandingBalance: loan.outstanding,

    loanInterestRate: loan.interest,

    loanDate: loan.loanDate,

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
  // FINORA THEME ENGINE
  // ==========================================================

  const { theme } = useTheme();

  const pageThemeStyle = {
    ...collectionStudioStyles.page,

    ...createCollectionStudioThemeVariables(theme),
  } as CollectionStudioThemeStyle;

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

  const [customerDropdownOpen, setCustomerDropdownOpen] =
    useState<boolean>(false);

  const [customerSearch, setCustomerSearch] = useState<string>("");

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
        // DO NOT AUTO-SELECT CUSTOMER
        // ------------------------------------------------------

        setSelectedCustomerId("");

        setSelectedLoanId("");

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
  // FILTERED CUSTOMER DROPDOWN OPTIONS
  // ==========================================================

  const filteredCollectionCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();

    if (!query) {
      return collectionCustomers;
    }

    return collectionCustomers.filter(
      (customer: CollectionCustomerRecord) =>
        customer.name.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query) ||
        customer.id.toLowerCase().includes(query),
    );
  }, [collectionCustomers, customerSearch]);

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

    if (!nextCustomer || nextCustomer.loans.length === 0) {
      return;
    }

    setSelectedCustomerId(customerId);

    // --------------------------------------------------------
    // Automatically select first collection-ready loan.
    // --------------------------------------------------------

    setSelectedLoanId(nextCustomer.loans[0]?.id ?? "");

    // --------------------------------------------------------
    // Close customer dropdown.
    // --------------------------------------------------------

    setCustomerDropdownOpen(false);

    // --------------------------------------------------------
    // Clear customer search.
    // --------------------------------------------------------

    setCustomerSearch("");
  }

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (loading) {
    return (
      <main style={pageThemeStyle}>
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
      <main style={pageThemeStyle}>
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
  // RENDER
  // ==========================================================

  return (
    <CollectionContext.Provider
      value={{
        reviewData,

        onReviewDataChange: setReviewData,
      }}
    >
      <main style={pageThemeStyle}>
        <div style={collectionStudioStyles.pageInner}>
          {/* ==================================================
              1. CUSTOMER + LOAN SELECTION

              IMPORTANT:
              EXISTING TOP LAYOUT PRESERVED.
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

                <div style={customerDropdownStyles.wrapper}>
                  {/* ==========================================
                      CUSTOMER SELECT BUTTON
                  ========================================== */}

                  <button
                    type="button"
                    id="collection-customer-select"
                    aria-haspopup="listbox"
                    aria-expanded={customerDropdownOpen}
                    onClick={() => {
                      setCustomerDropdownOpen((previous) => !previous);

                      setCustomerSearch("");
                    }}
                    style={{
                      ...collectionStudioStyles.select,

                      display: "flex",

                      alignItems: "center",

                      justifyContent: "space-between",

                      cursor: "pointer",

                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        overflow: "hidden",

                        textOverflow: "ellipsis",

                        whiteSpace: "nowrap",
                      }}
                    >
                      {selectedCustomer?.name || "Select Customer"}
                    </span>

                    <span
                      aria-hidden="true"
                      style={collectionStudioStyles.selectArrow}
                    >
                      ▾
                    </span>
                  </button>

                  {/* ==========================================
                      CUSTOMER SEARCH DROPDOWN
                  ========================================== */}

                  {customerDropdownOpen && (
                    <div
                      role="listbox"
                      aria-label="Customer list"
                      style={customerDropdownStyles.panel}
                    >
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(event) =>
                          setCustomerSearch(event.target.value)
                        }
                        onClick={(event) => event.stopPropagation()}
                        placeholder="Search customer..."
                        autoFocus
                        style={customerDropdownStyles.searchInput}
                      />

                      {filteredCollectionCustomers.length > 0 ? (
                        filteredCollectionCustomers.map(
                          (customer: CollectionCustomerRecord) => {
                            const isActive = customer.id === selectedCustomerId;

                            return (
                              <button
                                key={customer.id}
                                type="button"
                                role="option"
                                aria-selected={isActive}
                                onClick={() =>
                                  handleCustomerChange(customer.id)
                                }
                                style={{
                                  ...customerDropdownStyles.option,

                                  ...(isActive
                                    ? customerDropdownStyles.activeOption
                                    : {}),
                                }}
                              >
                                <span
                                  style={customerDropdownStyles.customerName}
                                >
                                  {customer.name}
                                </span>

                                <span
                                  style={customerDropdownStyles.customerMeta}
                                >
                                  {customer.phone || customer.id}
                                </span>
                              </button>
                            );
                          },
                        )
                      ) : (
                        <div style={customerDropdownStyles.emptyState}>
                          No customers found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={collectionStudioStyles.customerDetails}>
                  <div style={collectionStudioStyles.customerDetailLine}>
                    <span style={collectionStudioStyles.detailLabel}>
                      CUST ID
                    </span>

                    <span
                      style={collectionStudioStyles.detailValue}
                      title={selectedCustomerId}
                    >
                      {selectedCustomerId}
                    </span>
                  </div>

                  <div style={collectionStudioStyles.customerDetailLine}>
                    <span style={collectionStudioStyles.detailLabel}>
                      PHONE
                    </span>

                    <span style={collectionStudioStyles.detailValue}>
                      {selectedCustomer?.phone || "--"}
                    </span>
                  </div>
                </div>
              </div>

              {/* ===============================================
                  CUSTOMER PHOTO
              =============================================== */}

              <div style={collectionStudioStyles.customerPhotoFrame}>
                {selectedCustomer?.photo ? (
                  <img
                    src={selectedCustomer.photo}
                    alt={selectedCustomer.name || "Customer"}
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
              selectedLoanId={selectedLoanId}
              onSelectLoan={(loan) => handleLoanChange(loan.id)}
            />
          </div>

          {/* ==================================================
              PREMIUM COLLECTION WORKSPACE

              INTERNAL COLLECTION ENTRY GRID:

              40% EMI
              20% SYSTEM GENERATED
              40% MANUAL
          ================================================== */}

          <section style={collectionStudioStyles.collectionWorkspace}>
            {/* ==================================================
                FULL-WIDTH 40 / 20 / 40 ENTRY WORKSPACE

                CollectionEntry owns EMI + Manual interaction.

                System Generated is injected only as a visual
                middle slot.

                No financial ownership changes.
            ================================================== */}

            <div style={collectionStudioStyles.paymentDetailsSection}>
              <CollectionEntry middleSlot={<CollectionSystemGenerated />} />
            </div>

            {/* ==================================================
                PAYMENT DETAILS — FULL WIDTH
            ================================================== */}

            <section style={collectionStudioStyles.paymentDetailsSection}>
              <PaymentDetails />
            </section>
          </section>

          {/* ==================================================
              DOCUMENT GALLERY + COLLECTION HISTORY

              DOCUMENTS
              FULL WIDTH

              HISTORY
              FULL WIDTH BELOW DOCUMENTS
          ================================================== */}

          <section style={collectionStudioStyles.documentsHistoryRow}>
            {/* ==================================================
                LOAN DOCUMENTS — FULL WIDTH
            ================================================== */}

            <div style={collectionStudioStyles.loanDocumentsColumn}>
              {selectedLoan ? (
                <LoanDocuments documents={selectedLoan.documents} />
              ) : (
                <section style={collectionStudioStyles.emptyState}>
                  <strong style={collectionStudioStyles.emptyStateTitle}>
                    Select a Loan
                  </strong>

                  <span style={collectionStudioStyles.emptyStateMessage}>
                    Select a customer and collection-ready loan to view loan
                    documents.
                  </span>
                </section>
              )}
            </div>

            {/* ==================================================
                COLLECTION HISTORY — FULL WIDTH BELOW DOCUMENTS
            ================================================== */}

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
