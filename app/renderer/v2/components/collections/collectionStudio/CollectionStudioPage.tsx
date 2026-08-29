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
// - Preserve closed Gold Loans while physical custody is active
// - Maintain selected customer state
// - Maintain selected loan state
// - Normalize selected loan presentation data
// - Carry persisted loan documents into Collection Studio
// - Carry authoritative loan principal, interest and date
// - Load active Gold custody location for Gold Loans
// - Display selected Gold custody direction read-only
// - Establish CollectionContext for the complete Studio tree
// - Render complete Collection Studio workflow
// - Connect FINORA Responsive Engine
// - Connect EMI Collection workspace
// - Connect System Generated middle workspace
// - Connect Manual Collection workspace
// - Connect full-width Payment Details
// - Connect full-width Loan Documents
// - Connect full-width Collection History
//
// ARCHITECTURE LOCK
//
// - No business calculations
// - No repository access
// - No localStorage access
// - No direct filesystem access
// - No Electron IPC
// - No local breakpoint logic
// - No local theme system
// - Responsive classification comes from FINORA Responsive Engine
// - Customer master data comes through Customer Store
// - Loan data comes through LoanService
// - Gold custody data comes through Gold custody services
// - Storage selection comes through StorageManager
// - Collection state is exposed through CollectionContext
//
// VERSION : 2.3
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

import type { GoldStorageSearchResult } from "../../../types/gold-loan/goldStorage.types";

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

import {
  loadPersistedGoldStorageState,
  releasePersistedGoldStorage,
} from "../../../services/gold-loan/goldCustodyPersistenceService";

import { getSession } from "../../../store/authStore";

import { findCurrentGoldStorageByLoanId } from "../../../services/gold-loan/goldStorageService";

import { storageManager } from "../../../storage/storageManager";

import { StorageMode } from "../../../storage/storage.types";

import { useResponsive } from "../../../utils/responsive";

import {
  createCollectionStudioPageInnerStyle,
  createCollectionStudioSelectionRowStyle,
  createCollectionStudioCustomerCardStyle,
  createCollectionStudioCustomerPhotoFrameStyle,
  createCollectionStudioPhotoPlaceholderStyle,
  createCollectionStudioWorkspaceStyle,
  createCollectionStudioPaymentDetailsSectionStyle,
  createCollectionStudioDocumentsHistoryRowStyle,
} from "../../../utils/responsive/collections/collectionStudio.layout";

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

type PersistedCollectionDocument = DocumentsStudioItem & {
  dataUrl?: string;
};

function getCollectionDocumentSource(document: DocumentsStudioItem): string {
  const persistedDocument = document as PersistedCollectionDocument;

  return persistedDocument.dataUrl || document.url || "";
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

function isCollectionReadyLoan(
  loan: Loan,
  hasActiveGoldCustody: boolean,
): boolean {
  const status = normalizeLoanStatus(loan.status);

  const outstanding = Number(loan.outstanding ?? 0);

  if (!Number.isFinite(outstanding)) {
    return false;
  }

  // ----------------------------------------------------------
  // STANDARD FINANCIAL COLLECTION
  // ----------------------------------------------------------

  const isFinanciallyCollectible =
    (status === "ACTIVE" || status === "RUNNING") && outstanding > 0;

  // ----------------------------------------------------------
  // GOLD CUSTODY RELEASE PENDING
  //
  // Financial liability may already be CLOSED, but the
  // physical Gold packet still remains under FINORA custody.
  //
  // Keep this Loan available in Collection Studio until the
  // physical custody release workflow is completed.
  // ----------------------------------------------------------

  const isGoldCustodyReleasePending =
    hasActiveGoldCustody && status === "CLOSED" && outstanding === 0;

  return isFinanciallyCollectible || isGoldCustodyReleasePending;
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
  activeGoldCustodyLoanIds: ReadonlySet<string>,
): CollectionCustomerRecord {
  const customerId = customer.identity.customerId;

  const customerLoans = loans
    .filter((loan: Loan) => loan.customerId === customerId)
    .filter((loan: Loan) =>
      isCollectionReadyLoan(loan, activeGoldCustodyLoanIds.has(loan.id)),
    )
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

  // ==========================================================
  // FINORA RESPONSIVE ENGINE
  // ==========================================================

  const { viewport, tokens } = useResponsive();

  // ==========================================================
  // THEME PAGE STYLE
  // ==========================================================

  const pageThemeStyle = {
    ...collectionStudioStyles.page,

    ...createCollectionStudioThemeVariables(theme),
  } as CollectionStudioThemeStyle;

  // ==========================================================
  // RESPONSIVE PAGE INNER
  // ==========================================================

  const responsivePageInnerStyle: CSSProperties = {
    ...collectionStudioStyles.pageInner,

    ...createCollectionStudioPageInnerStyle(tokens, viewport),
  };

  // ==========================================================
  // RESPONSIVE CUSTOMER + LOAN ROW
  // ==========================================================

  const responsiveSelectionRowStyle: CSSProperties = {
    ...collectionStudioStyles.selectionRow,

    ...createCollectionStudioSelectionRowStyle(tokens, viewport),
  };

  // ==========================================================
  // RESPONSIVE CUSTOMER CARD
  // ==========================================================

  const responsiveCustomerCardStyle: CSSProperties = {
    ...collectionStudioStyles.customerCard,

    ...createCollectionStudioCustomerCardStyle(tokens, viewport),
  };

  // ==========================================================
  // RESPONSIVE CUSTOMER PHOTO
  // ==========================================================

  const responsiveCustomerPhotoFrameStyle: CSSProperties = {
    ...collectionStudioStyles.customerPhotoFrame,

    ...createCollectionStudioCustomerPhotoFrameStyle(tokens, viewport),
  };

  const responsivePhotoPlaceholderStyle: CSSProperties = {
    ...collectionStudioStyles.photoPlaceholder,

    ...createCollectionStudioPhotoPlaceholderStyle(tokens, viewport),
  };

  // ==========================================================
  // RESPONSIVE COLLECTION WORKSPACE
  // ==========================================================

  const responsiveCollectionWorkspaceStyle: CSSProperties = {
    ...collectionStudioStyles.collectionWorkspace,

    ...createCollectionStudioWorkspaceStyle(tokens, viewport),
  };

  // ==========================================================
  // RESPONSIVE PAYMENT DETAILS SECTION
  // ==========================================================

  const responsivePaymentDetailsSectionStyle: CSSProperties = {
    ...collectionStudioStyles.paymentDetailsSection,

    ...createCollectionStudioPaymentDetailsSectionStyle(viewport),
  };

  // ==========================================================
  // RESPONSIVE DOCUMENTS + HISTORY
  // ==========================================================

  const responsiveDocumentsHistoryRowStyle: CSSProperties = {
    ...collectionStudioStyles.documentsHistoryRow,

    ...createCollectionStudioDocumentsHistoryRowStyle(tokens, viewport),
  };

  // ==========================================================
  // COLLECTION CUSTOMER DATA
  // ==========================================================

  const [collectionCustomers, setCollectionCustomers] = useState<
    CollectionCustomerRecord[]
  >([]);

  // ==========================================================
  // GOLD CUSTODY DATA
  // ==========================================================

  const [activeGoldCustodyByLoanId, setActiveGoldCustodyByLoanId] = useState<
    Record<string, GoldStorageSearchResult>
  >({});

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
  // GOLD RELEASE STATE
  // ==========================================================

  const [goldReleaseModalOpen, setGoldReleaseModalOpen] =
    useState<boolean>(false);

  const [goldReleaseInProgress, setGoldReleaseInProgress] =
    useState<boolean>(false);

  const [goldReleaseError, setGoldReleaseError] = useState<string>("");

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
  // LOAD AUTHORITATIVE CUSTOMER + LOAN + GOLD CUSTODY DATA
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
        // LOAD ACTIVE GOLD CUSTODY
        // ------------------------------------------------------

        const activeGoldCustodyLoanIds = new Set<string>();

        const activeGoldCustodyMap: Record<string, GoldStorageSearchResult> =
          {};

        const goldStorageResult = await loadPersistedGoldStorageState();

        if (goldStorageResult.success && goldStorageResult.state) {
          for (const loan of loans) {
            const activeCustody = findCurrentGoldStorageByLoanId(
              goldStorageResult.state,
              loan.id,
            );

            if (activeCustody) {
              activeGoldCustodyLoanIds.add(loan.id);

              activeGoldCustodyMap[loan.id] = activeCustody;
            }
          }
        } else {
          console.warn(
            "FINORA COLLECTION GOLD CUSTODY LOAD WARNING:",
            goldStorageResult.error ??
              "Unable to load active Gold custody state.",
          );
        }

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
            buildCollectionCustomerRecord(
              customer,
              loans,
              activeGoldCustodyLoanIds,
            ),
          )
          .filter(
            (customer: CollectionCustomerRecord) => customer.loans.length > 0,
          );

        if (cancelled) {
          return;
        }

        setActiveGoldCustodyByLoanId(activeGoldCustodyMap);

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

          setActiveGoldCustodyByLoanId({});

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
  // SELECTED GOLD CUSTODY
  // ==========================================================

  const selectedGoldCustody = useMemo(() => {
    const loanId = selectedLoan?.id ?? "";

    if (!loanId) {
      return null;
    }

    return activeGoldCustodyByLoanId[loanId] ?? null;
  }, [activeGoldCustodyByLoanId, selectedLoan]);

  // ==========================================================
  // GOLD RELEASE ELIGIBILITY
  // ==========================================================

  const liveOutstandingBalance = Number(reviewData.outstandingBalance ?? 0);

  const canReleaseSelectedGold =
    Boolean(selectedGoldCustody && selectedLoan) &&
    Number.isFinite(liveOutstandingBalance) &&
    liveOutstandingBalance === 0;

  // ==========================================================
  // SELECTED GOLD EVIDENCE
  // ==========================================================

  const selectedGoldEvidence = useMemo(
    () =>
      selectedLoan
        ? selectedLoan.documents.filter((document) => Boolean(document?.id))
        : [],
    [selectedLoan],
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
  // OPEN GOLD RELEASE CONFIRMATION
  // ==========================================================

  function openGoldReleaseConfirmation(): void {
    if (!selectedGoldCustody || !selectedLoan || !canReleaseSelectedGold) {
      return;
    }

    setGoldReleaseError("");

    setGoldReleaseModalOpen(true);
  }

  // ==========================================================
  // CLOSE GOLD RELEASE CONFIRMATION
  // ==========================================================

  function closeGoldReleaseConfirmation(): void {
    if (goldReleaseInProgress) {
      return;
    }

    setGoldReleaseError("");

    setGoldReleaseModalOpen(false);
  }

  // ==========================================================
  // CONFIRM GOLD RELEASE
  // ==========================================================

  async function confirmGoldRelease(): Promise<void> {
    if (goldReleaseInProgress) {
      return;
    }

    const custody = selectedGoldCustody;

    const loan = selectedLoan;

    if (!custody || !loan) {
      setGoldReleaseError("Active Gold custody could not be resolved.");

      return;
    }

    const outstandingBalance = Number(reviewData.outstandingBalance ?? 0);

    if (!Number.isFinite(outstandingBalance) || outstandingBalance !== 0) {
      setGoldReleaseError(
        "Gold cannot be released until the remaining loan balance is zero.",
      );

      return;
    }

    const session = getSession();

    const releasedBy = session?.username?.trim() ?? "";

    if (!releasedBy) {
      setGoldReleaseError("Authenticated FINORA user could not be resolved.");

      return;
    }

    setGoldReleaseInProgress(true);

    setGoldReleaseError("");

    try {
      const releaseResult = await releasePersistedGoldStorage({
        allocationId: custody.allocationId,

        loanId: loan.id,

        releasedBy,

        releasedAt: new Date().toISOString(),

        remarks:
          "Physical Gold released from Collection Studio after full loan settlement.",
      });

      if (!releaseResult.success || !releaseResult.allocation) {
        setGoldReleaseError(
          releaseResult.error ?? "Unable to release Gold custody.",
        );

        return;
      }

      const releasedLoanId = loan.id;

      // --------------------------------------------------------
      // REMOVE RELEASED CUSTODY FROM LIVE PAGE STATE
      // --------------------------------------------------------

      setActiveGoldCustodyByLoanId((previous) => {
        const next = {
          ...previous,
        };

        delete next[releasedLoanId];

        return next;
      });

      // --------------------------------------------------------
      // REMOVE RELEASED CLOSED GOLD LOAN FROM COLLECTION QUEUE
      //
      // Release is only allowed at authoritative outstanding = 0.
      // Therefore after custody release this loan no longer has
      // any Collection Studio responsibility.
      // --------------------------------------------------------

      setCollectionCustomers((previousCustomers) =>
        previousCustomers
          .map((customer) => ({
            ...customer,

            loans: customer.loans.filter(
              (customerLoan) => customerLoan.id !== releasedLoanId,
            ),
          }))
          .filter((customer) => customer.loans.length > 0),
      );

      // --------------------------------------------------------
      // RESET SELECTION
      // --------------------------------------------------------

      setGoldReleaseModalOpen(false);

      setSelectedCustomerId("");

      setSelectedLoanId("");

      setCustomerDropdownOpen(false);

      setCustomerSearch("");

      setReviewData(createEmptyReviewData());

      window.alert("Gold custody released successfully.");
    } catch (error) {
      setGoldReleaseError(
        error instanceof Error
          ? error.message
          : "Unable to release Gold custody.",
      );
    } finally {
      setGoldReleaseInProgress(false);
    }
  }

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

    setSelectedLoanId(nextCustomer.loans[0]?.id ?? "");

    setCustomerDropdownOpen(false);

    setCustomerSearch("");
  }

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (loading) {
    return (
      <main style={pageThemeStyle}>
        <div style={responsivePageInnerStyle}>
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
        <div style={responsivePageInnerStyle}>
          <section style={collectionStudioStyles.emptyState}>
            <strong style={collectionStudioStyles.emptyStateTitle}>
              No collection-ready customers
            </strong>

            <span style={collectionStudioStyles.emptyStateMessage}>
              Customers will appear here automatically when they have an active
              or running loan with an outstanding balance, or a closed Gold Loan
              awaiting physical custody release.
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
        <div style={responsivePageInnerStyle}>
          {/* ==================================================
              CUSTOMER + LOAN SELECTION
          ================================================== */}

          <div style={responsiveSelectionRowStyle}>
            {/* ==================================================
                CUSTOMER INFORMATION
            ================================================== */}

            <section style={responsiveCustomerCardStyle}>
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

              <div style={responsiveCustomerPhotoFrameStyle}>
                {selectedCustomer?.photo ? (
                  <img
                    src={selectedCustomer.photo}
                    alt={selectedCustomer.name || "Customer"}
                    style={collectionStudioStyles.customerPhoto}
                  />
                ) : (
                  <div style={responsivePhotoPlaceholderStyle}>
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
              GOLD CUSTODY LOCATION
          ================================================== */}

          {selectedGoldCustody ? (
            <section
              aria-label="Gold Custody Location"
              style={collectionStudioStyles.workflowSection}
            >
              {/* ==============================================
                  HEADER
              ============================================== */}

              <div style={collectionStudioStyles.workflowSectionHeader}>
                <div style={collectionStudioStyles.workflowSectionHeading}>
                  <span style={collectionStudioStyles.workflowSectionEyebrow}>
                    GOLD CUSTODY
                  </span>

                  <h2 style={collectionStudioStyles.workflowSectionTitle}>
                    Physical Gold Location
                  </h2>

                  <p style={collectionStudioStyles.workflowSectionSubtitle}>
                    Verify the secured Gold packet location before collection or
                    physical release.
                  </p>
                </div>

                <span style={collectionStudioStyles.selectedLoanStatus}>
                  {selectedGoldCustody.custodyStatus}
                </span>
              </div>

              {/* ==============================================
                  ROOM
              ============================================== */}

              <div style={collectionStudioStyles.customerDetailLine}>
                <span style={collectionStudioStyles.detailLabel}>ROOM</span>

                <strong style={collectionStudioStyles.detailValue}>
                  {selectedGoldCustody.location.roomName}
                </strong>
              </div>

              {/* ==============================================
                  LOCKER
              ============================================== */}

              <div style={collectionStudioStyles.customerDetailLine}>
                <span style={collectionStudioStyles.detailLabel}>LOCKER</span>

                <strong style={collectionStudioStyles.detailValue}>
                  {selectedGoldCustody.location.lockerName}
                </strong>
              </div>

              {/* ==============================================
                  RACK
              ============================================== */}

              <div style={collectionStudioStyles.customerDetailLine}>
                <span style={collectionStudioStyles.detailLabel}>RACK</span>

                <strong style={collectionStudioStyles.detailValue}>
                  {selectedGoldCustody.location.rackName}
                </strong>
              </div>

              {/* ==============================================
                  BAG / PACKET
              ============================================== */}

              <div style={collectionStudioStyles.customerDetailLine}>
                <span style={collectionStudioStyles.detailLabel}>BAG</span>

                <strong style={collectionStudioStyles.detailValue}>
                  Bag / Packet {selectedGoldCustody.location.bagNumber}
                </strong>
              </div>

              {/* ==============================================
                  LOCATION CODE
              ============================================== */}

              <div style={collectionStudioStyles.customerDetailLine}>
                <span style={collectionStudioStyles.detailLabel}>CODE</span>

                <strong style={collectionStudioStyles.detailValue}>
                  {selectedGoldCustody.locationCode.fullCode}
                </strong>
              </div>

              {/* ==============================================
                  PHYSICAL DIRECTION
              ============================================== */}

              <p style={collectionStudioStyles.futureSectionText}>
                Physical Direction: {selectedGoldCustody.location.roomName}
                {" → "}
                {selectedGoldCustody.location.lockerName}
                {" → "}
                {selectedGoldCustody.location.rackName}
                {" → "}
                Bag / Packet {selectedGoldCustody.location.bagNumber}
              </p>

              {/* ==============================================
    GOLD RELEASE ACTION
============================================== */}

              <div style={collectionStudioStyles.goldCustodyActions}>
                <p
                  style={{
                    ...collectionStudioStyles.goldCustodyReleaseHint,

                    ...(canReleaseSelectedGold
                      ? collectionStudioStyles.goldCustodyReleaseHintReady
                      : {}),
                  }}
                >
                  {canReleaseSelectedGold
                    ? "Loan balance is fully settled. Physical Gold custody is ready for verified release."
                    : `Gold release is locked until the remaining balance becomes zero. Current remaining balance: ₹ ${Math.max(
                        0,
                        Number.isFinite(liveOutstandingBalance)
                          ? liveOutstandingBalance
                          : 0,
                      ).toLocaleString("en-IN")}`}
                </p>

                <button
                  type="button"
                  disabled={!canReleaseSelectedGold || goldReleaseInProgress}
                  onClick={openGoldReleaseConfirmation}
                  style={{
                    ...collectionStudioStyles.primaryAction,

                    ...(!canReleaseSelectedGold || goldReleaseInProgress
                      ? collectionStudioStyles.goldCustodyReleaseActionDisabled
                      : {}),
                  }}
                >
                  RELEASE GOLD
                </button>
              </div>
            </section>
          ) : null}

          {/* ==================================================
              COLLECTION WORKSPACE
          ================================================== */}

          <section style={responsiveCollectionWorkspaceStyle}>
            {/* ==================================================
                EMI + SYSTEM GENERATED + MANUAL
            ================================================== */}

            <div style={responsivePaymentDetailsSectionStyle}>
              <CollectionEntry middleSlot={<CollectionSystemGenerated />} />
            </div>

            {/* ==================================================
                PAYMENT DETAILS
            ================================================== */}

            <section style={responsivePaymentDetailsSectionStyle}>
              <PaymentDetails />
            </section>
          </section>

          {/* ==================================================
              DOCUMENTS + COLLECTION HISTORY
          ================================================== */}

          <section style={responsiveDocumentsHistoryRowStyle}>
            {/* ==================================================
                LOAN DOCUMENTS
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
                COLLECTION HISTORY
            ================================================== */}

            <div style={collectionStudioStyles.collectionHistoryColumn}>
              <CollectionHistory />
            </div>
          </section>
        </div>
      </main>
      {/* ==================================================
    GOLD RELEASE CONFIRMATION
================================================== */}

      {goldReleaseModalOpen &&
      selectedGoldCustody &&
      selectedLoan &&
      selectedCustomer ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Release Gold Custody"
          style={collectionStudioStyles.goldReleaseBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeGoldReleaseConfirmation();
            }
          }}
        >
          <div style={collectionStudioStyles.goldReleaseDialog}>
            {/* ============================================
          HEADER
      ============================================ */}

            <div style={collectionStudioStyles.goldReleaseHeader}>
              <div style={collectionStudioStyles.goldReleaseHeaderCopy}>
                <span style={collectionStudioStyles.goldReleaseEyebrow}>
                  GOLD CUSTODY
                </span>

                <h2 style={collectionStudioStyles.goldReleaseTitle}>
                  Release Gold Custody
                </h2>

                <p style={collectionStudioStyles.goldReleaseSubtitle}>
                  Verify the customer, loan, physical location and evidence
                  before confirming handover.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close Gold release confirmation"
                disabled={goldReleaseInProgress}
                onClick={closeGoldReleaseConfirmation}
                style={collectionStudioStyles.goldReleaseClose}
              >
                ×
              </button>
            </div>

            {/* ============================================
          BODY
      ============================================ */}

            <div style={collectionStudioStyles.goldReleaseBody}>
              {/* ==========================================
            LOAN SUMMARY
        ========================================== */}

              <div style={collectionStudioStyles.goldReleaseSummaryGrid}>
                <div style={collectionStudioStyles.goldReleaseSummaryMetric}>
                  <span style={collectionStudioStyles.goldReleaseSummaryLabel}>
                    Customer
                  </span>

                  <strong
                    style={collectionStudioStyles.goldReleaseSummaryValue}
                    title={selectedCustomer.name}
                  >
                    {selectedCustomer.name}
                  </strong>
                </div>

                <div style={collectionStudioStyles.goldReleaseSummaryMetric}>
                  <span style={collectionStudioStyles.goldReleaseSummaryLabel}>
                    Loan Number
                  </span>

                  <strong
                    style={collectionStudioStyles.goldReleaseSummaryValue}
                    title={selectedLoan.loanNumber}
                  >
                    {selectedLoan.loanNumber}
                  </strong>
                </div>

                <div style={collectionStudioStyles.goldReleaseSummaryMetric}>
                  <span style={collectionStudioStyles.goldReleaseSummaryLabel}>
                    Outstanding
                  </span>

                  <strong
                    style={{
                      ...collectionStudioStyles.goldReleaseSummaryValue,

                      ...collectionStudioStyles.goldReleaseSettledValue,
                    }}
                  >
                    ₹{" "}
                    {Math.max(
                      0,
                      Number.isFinite(liveOutstandingBalance)
                        ? liveOutstandingBalance
                        : 0,
                    ).toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>

              {/* ==========================================
            PHYSICAL LOCATION
        ========================================== */}

              <div style={collectionStudioStyles.goldReleaseDirectionCard}>
                <span style={collectionStudioStyles.goldReleaseDirectionLabel}>
                  Current Physical Location
                </span>

                <strong
                  style={collectionStudioStyles.goldReleaseDirectionValue}
                >
                  {selectedGoldCustody.location.roomName}
                  {" → "}
                  {selectedGoldCustody.location.lockerName}
                  {" → "}
                  {selectedGoldCustody.location.rackName}
                  {" → "}
                  Bag / Packet {selectedGoldCustody.location.bagNumber}
                </strong>

                <span style={collectionStudioStyles.goldReleaseLocationCode}>
                  LOCATION CODE: {selectedGoldCustody.locationCode.fullCode}
                </span>
              </div>

              {/* ==========================================
            EVIDENCE
        ========================================== */}

              <section
                style={collectionStudioStyles.goldReleaseEvidenceSection}
              >
                <div style={collectionStudioStyles.goldReleaseEvidenceHeader}>
                  <h3 style={collectionStudioStyles.goldReleaseEvidenceTitle}>
                    Loan Evidence / Images
                  </h3>

                  <span style={collectionStudioStyles.goldReleaseEvidenceCount}>
                    {selectedGoldEvidence.length}{" "}
                    {selectedGoldEvidence.length === 1
                      ? "document"
                      : "documents"}
                  </span>
                </div>

                {selectedGoldEvidence.length === 0 ? (
                  <div style={collectionStudioStyles.goldReleaseEvidenceEmpty}>
                    No loan evidence is stored for this Gold Loan.
                  </div>
                ) : (
                  <div style={collectionStudioStyles.goldReleaseEvidenceGrid}>
                    {selectedGoldEvidence.map((document) => {
                      const source = getCollectionDocumentSource(document);

                      return (
                        <article
                          key={document.id}
                          style={collectionStudioStyles.goldReleaseEvidenceCard}
                        >
                          <div
                            style={
                              collectionStudioStyles.goldReleaseEvidencePreview
                            }
                          >
                            {document.type === "image" && source ? (
                              <img
                                src={source}
                                alt={document.name}
                                style={
                                  collectionStudioStyles.goldReleaseEvidenceImage
                                }
                              />
                            ) : (
                              <span
                                style={
                                  collectionStudioStyles.goldReleaseEvidencePlaceholder
                                }
                              >
                                {document.type === "pdf"
                                  ? "PDF"
                                  : "PREVIEW UNAVAILABLE"}
                              </span>
                            )}
                          </div>

                          <span
                            style={
                              collectionStudioStyles.goldReleaseEvidenceName
                            }
                            title={document.name}
                          >
                            {document.name}
                          </span>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* ==========================================
            HANDOVER WARNING
        ========================================== */}

              <div style={collectionStudioStyles.goldReleaseWarning}>
                Confirm only after physically verifying and handing over this
                exact Gold packet to the authorized customer. This action
                changes the custody status from OCCUPIED to RELEASED and frees
                the storage position.
              </div>

              {/* ==========================================
            RELEASE ERROR
        ========================================== */}

              {goldReleaseError ? (
                <div
                  role="alert"
                  style={collectionStudioStyles.goldReleaseError}
                >
                  {goldReleaseError}
                </div>
              ) : null}
            </div>

            {/* ============================================
          FOOTER
      ============================================ */}

            <div style={collectionStudioStyles.goldReleaseFooter}>
              <button
                type="button"
                disabled={goldReleaseInProgress}
                onClick={closeGoldReleaseConfirmation}
                style={collectionStudioStyles.secondaryAction}
              >
                CANCEL
              </button>

              <button
                type="button"
                disabled={goldReleaseInProgress}
                onClick={() => {
                  void confirmGoldRelease();
                }}
                style={{
                  ...collectionStudioStyles.goldReleaseConfirmAction,

                  ...(goldReleaseInProgress
                    ? collectionStudioStyles.goldReleaseConfirmActionBusy
                    : {}),
                }}
              >
                {goldReleaseInProgress
                  ? "RELEASING..."
                  : "CONFIRM GOLD RELEASE"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </CollectionContext.Provider>
  );
}

// ============================================================
// END
// ============================================================
