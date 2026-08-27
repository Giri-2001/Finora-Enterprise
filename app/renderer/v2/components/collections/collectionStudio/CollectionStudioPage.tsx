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
// - Provide customer / loan selection inside the workspace
// - Normalize selected loan presentation data
// - Establish CollectionContext for the complete Studio tree
// - Render complete Collection Studio workflow
// - Connect System Generated section
// - Connect Collection Entry section
// - Connect Collection Summary section
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
// COLLECTION ELIGIBILITY
//
// A customer is shown in Collection Studio only when the
// customer has at least one:
//
// - ACTIVE loan
// - RUNNING loan
//
// and:
//
// - outstanding amount > 0
//
// CLOSED / REJECTED / zero-outstanding historical loans
// do not make a customer collection-ready.
//
// IMPORTANT:
//
// If 12 customers exist and only 2 customers have active/
// running loans, only those 2 customers are available in the
// Collection Studio customer selector.
//
// When Collection Studio opens:
//
// - First eligible customer is automatically selected.
// - First collection-ready loan of that customer is
//   automatically selected.
//
// The user can then change customer / loan from inside
// the Collection Studio workspace.
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

import type { CollectionReviewData } from "../CollectionReviewData";

import CollectionLoanSelection from "./CollectionLoanSelection";

import CollectionSelectedLoan from "./CollectionSelectedLoan";

import CollectionSystemGenerated from "./CollectionSystemGenerated";

import CollectionEntry from "./CollectionEntry";

import CollectionSummary from "../review/CollectionSummary";

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
//
// CollectionContext expects CollectionReviewData.
//
// Therefore reviewData itself is never null.
//
// An empty contract is used until a customer + loan
// is available.
//
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
  };
}

// ============================================================
// STORAGE MODE RESOLVER
// ============================================================
//
// Collection Studio must use the same authenticated storage
// mode selected during FINORA login.
//
// IMPORTANT:
//
// USB remains USB.
// LOCAL remains LOCAL.
// CLOUD remains CLOUD.
//
// There is no silent storage fallback here.
//
// ============================================================

function getAuthenticatedStorageMode(): StorageMode {
  try {
    const storedMode = window.sessionStorage.getItem(
      STORAGE_MODE_SESSION_KEY,
    );

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
//
// Only an unresolved loan with outstanding balance should
// appear in Collection Studio.
//
// ACTIVE / RUNNING are the collection-ready states.
//
// A CLOSED loan with an old outstanding value must not
// accidentally make a customer appear collection-ready.
//
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
//
// Deleted / archived customers must never appear in the
// Collection Studio selector.
//
// ============================================================

function isCollectionEligibleCustomer(
  customer: CustomerProfile,
): boolean {
  return (
    customer.identity.isDeleted !== true &&
    customer.internal.isArchived !== true &&
    customer.identity.isActive !== false
  );
}

// ============================================================
// LOAN → COLLECTION LOAN RECORD
// ============================================================
//
// This is a presentation boundary only.
//
// No financial calculation is performed here.
//
// ============================================================

function mapLoanToCollectionLoan(
  loan: Loan,
): CollectionLoanRecord {
  return {
    id: loan.id,

    loanNumber: loan.loanNumber || loan.id,

    amount: Number.isFinite(loan.amount) ? loan.amount : 0,

    repaymentType: String(
      loan.repaymentType ?? loan.loanType ?? "",
    ),

    status: String(loan.status ?? ""),

    outstanding: Number.isFinite(loan.outstanding)
      ? loan.outstanding
      : 0,
  };
}

// ============================================================
// CUSTOMER → COLLECTION RECORD
// ============================================================
//
// Only the customer's collection-ready loans are attached
// to the presentation record.
//
// ============================================================

function buildCollectionCustomerRecord(
  customer: CustomerProfile,
  loans: Loan[],
): CollectionCustomerRecord {
  const customerId = customer.identity.customerId;

  const customerLoans = loans
    .filter(
      (loan: Loan) => loan.customerId === customerId,
    )
    .filter(
      (loan: Loan) => isCollectionReadyLoan(loan),
    )
    .map(
      (loan: Loan) => mapLoanToCollectionLoan(loan),
    );

  return {
    id: customerId,

    name:
      customer.basic.displayName ||
      customer.basic.fullName ||
      "Unknown",

    phone: customer.basic.mobileNumber || "",

    photo: customer.photo,

    loans: customerLoans,
  };
}

// ============================================================
// BUILD COLLECTION REVIEW DATA
// ============================================================
//
// CollectionContext requires the canonical
// CollectionReviewData contract.
//
// The selected customer / loan presentation data is normalized
// into that contract at the page boundary.
//
// No business calculation is performed here.
//
// ============================================================

function buildReviewData(
  customer: CollectionCustomerRecord,
  loan: CollectionLoanRecord,
): CollectionReviewData {
  const now = new Date().toISOString();

  return {
    // ----------------------------------------------------------
    // CUSTOMER
    // ----------------------------------------------------------

    customerId: customer.id,

    customerName: customer.name,

    customerPhone: customer.phone,

    // ----------------------------------------------------------
    // LOAN
    // ----------------------------------------------------------

    loanId: loan.id,

    loanNumber: loan.loanNumber,

    loanAmount: loan.amount,

    outstandingBalance: loan.outstanding,

    todayDue: 0,

    previousDue: 0,

    // ----------------------------------------------------------
    // PAYMENT
    // ----------------------------------------------------------

    paymentAmount: 0,

    paymentMethod: "cash",

    paymentReference: "",

    // ----------------------------------------------------------
    // SETTLEMENT
    // ----------------------------------------------------------

    penaltyAmount: 0,

    discountAmount: 0,

    advanceAdjustment: 0,

    remarks: "",

    // ----------------------------------------------------------
    // RECEIPT
    // ----------------------------------------------------------

    receiptNumber: "",

    receiptDate: new Date().toISOString().slice(0, 10),

    // ----------------------------------------------------------
    // REVIEW
    // ----------------------------------------------------------

    status: "Draft",

    createdAt: now,

    updatedAt: now,
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

  const [selectedCustomerId, setSelectedCustomerId] =
    useState<string>("");

  // ==========================================================
  // LOAN STATE
  // ==========================================================

  const [selectedLoanId, setSelectedLoanId] =
    useState<string>("");

  // ==========================================================
  // COLLECTION REVIEW STATE
  //
  // IMPORTANT:
  //
  // Never use null here.
  //
  // CollectionContext expects a complete
  // CollectionReviewData object.
  //
  // ==========================================================

  const [reviewData, setReviewData] =
    useState<CollectionReviewData>(
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

        const storageMode =
          getAuthenticatedStorageMode();

        const storageResult =
          await storageManager.selectStorageMode(
            storageMode,
          );

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
        //
        // Persisted customer data is NOT deleted.
        // ------------------------------------------------------

        clearCustomerCache();

        // ------------------------------------------------------
        // HYDRATE AUTHORITATIVE CUSTOMER DATA
        // ------------------------------------------------------

        const customers =
          await hydrateCustomersFromStorage();

        if (cancelled) {
          return;
        }

        // ------------------------------------------------------
        // LOAD AUTHORITATIVE LOAN DATA
        //
        // Loan access remains behind LoanService.
        // ------------------------------------------------------

        const loans = await fetchLoans();

        if (cancelled) {
          return;
        }

        // ------------------------------------------------------
        // BUILD COLLECTION-READY CUSTOMER LIST
        //
        // Customers without an ACTIVE / RUNNING loan are
        // intentionally removed from this list.
        // ------------------------------------------------------

        const eligibleCustomers =
          customers
            .filter(
              (customer: CustomerProfile) =>
                isCollectionEligibleCustomer(customer),
            )
            .map(
              (customer: CustomerProfile) =>
                buildCollectionCustomerRecord(
                  customer,
                  loans,
                ),
            )
            .filter(
              (
                customer: CollectionCustomerRecord,
              ) => customer.loans.length > 0,
            );

        if (cancelled) {
          return;
        }

        setCollectionCustomers(
          eligibleCustomers,
        );

        // ------------------------------------------------------
        // AUTO-OPEN COLLECTION WORKSPACE
        //
        // IMPORTANT:
        //
        // Collection Studio no longer shows a separate
        // customer-selection landing page.
        //
        // The first eligible customer is selected
        // automatically when the page opens.
        //
        // The first collection-ready loan belonging to that
        // customer is also selected automatically.
        //
        // The user can still change both selections from
        // inside the workspace.
        // ------------------------------------------------------

        const firstCustomer =
          eligibleCustomers[0];

        const firstLoan =
          firstCustomer?.loans[0];

        setSelectedCustomerId(
          firstCustomer?.id ?? "",
        );

        setSelectedLoanId(
          firstLoan?.id ?? "",
        );

        // ------------------------------------------------------
        // REVIEW DATA WILL BE SYNCHRONIZED BY THE EFFECT
        // BELOW AFTER CUSTOMER / LOAN SELECTION IS AVAILABLE.
        // ------------------------------------------------------

        setReviewData(
          createEmptyReviewData(),
        );
      } catch (error) {
        console.error(
          "FINORA COLLECTION CUSTOMER/LOAN LOAD ERROR:",
          error,
        );

        if (!cancelled) {
          setCollectionCustomers([]);

          setSelectedCustomerId("");

          setSelectedLoanId("");

          setReviewData(
            createEmptyReviewData(),
          );
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
        (
          customer: CollectionCustomerRecord,
        ) =>
          customer.id === selectedCustomerId,
      ) ?? null,

    [
      collectionCustomers,
      selectedCustomerId,
    ],
  );

  // ==========================================================
  // CUSTOMER LOANS
  //
  // IMPORTANT:
  //
  // These are ONLY the loans belonging to the selected
  // customer.
  //
  // ==========================================================

  const customerLoans =
    selectedCustomer?.loans ?? [];

  // ==========================================================
  // SELECTED LOAN
  // ==========================================================

  const selectedLoan = useMemo(
    () =>
      customerLoans.find(
        (
          loan: CollectionLoanRecord,
        ) =>
          loan.id === selectedLoanId,
      ) ?? null,

    [
      customerLoans,
      selectedLoanId,
    ],
  );

  // ==========================================================
  // SELECTED LOAN VIEW DATA
  //
  // CollectionSelectedLoan expects "principal".
  //
  // The collection loan record uses "amount".
  //
  // Keep that normalization at the page boundary.
  //
  // ==========================================================

  const selectedLoanView = useMemo(() => {
    if (!selectedLoan) {
      return null;
    }

    return {
      loanNumber:
        selectedLoan.loanNumber,

      principal:
        selectedLoan.amount,

      repaymentType:
        selectedLoan.repaymentType,

      outstanding:
        selectedLoan.outstanding,

      status:
        selectedLoan.status,
    };
  }, [selectedLoan]);

  // ==========================================================
  // SYNC SELECTED CUSTOMER / LOAN INTO COLLECTION CONTEXT
  // ==========================================================

  useEffect(() => {
    if (!selectedCustomer || !selectedLoan) {
      setReviewData(
        createEmptyReviewData(),
      );

      return;
    }

    setReviewData(
      buildReviewData(
        selectedCustomer,
        selectedLoan,
      ),
    );
  }, [
    selectedCustomer,
    selectedLoan,
  ]);

  // ==========================================================
  // CUSTOMER CHANGE
  // ==========================================================

  function handleCustomerChange(
    customerId: string,
  ): void {
    const nextCustomer =
      collectionCustomers.find(
        (
          customer: CollectionCustomerRecord,
        ) =>
          customer.id === customerId,
      );

    setSelectedCustomerId(
      customerId,
    );

    // --------------------------------------------------------
    // IMPORTANT:
    //
    // Customer change immediately selects that customer's
    // first collection-ready loan.
    // --------------------------------------------------------

    setSelectedLoanId(
      nextCustomer?.loans[0]?.id ?? "",
    );
  }

  // ==========================================================
  // LOAN CHANGE
  // ==========================================================

  function handleLoanChange(
    loanId: string,
  ): void {
    // --------------------------------------------------------
    // SECURITY / DATA BOUNDARY
    //
    // Only allow selection of a loan already belonging to
    // the currently selected customer.
    // --------------------------------------------------------

    const loanBelongsToCustomer =
      customerLoans.some(
        (
          loan: CollectionLoanRecord,
        ) =>
          loan.id === loanId,
      );

    if (!loanBelongsToCustomer) {
      return;
    }

    setSelectedLoanId(
      loanId,
    );
  }

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (loading) {
    return (
      <main
        style={
          collectionStudioStyles.page
        }
      >
        <div
          style={
            collectionStudioStyles.pageInner
          }
        >
          <section
            style={
              collectionStudioStyles.emptyState
            }
          >
            <strong
              style={
                collectionStudioStyles.emptyStateTitle
              }
            >
              Loading Collection Studio
            </strong>

            <span
              style={
                collectionStudioStyles.emptyStateMessage
              }
            >
              Loading collection-ready customers
              and loans.
            </span>
          </section>
        </div>
      </main>
    );
  }

  // ==========================================================
  // NO COLLECTION-READY CUSTOMERS
  // ==========================================================

  if (
    collectionCustomers.length === 0
  ) {
    return (
      <main
        style={
          collectionStudioStyles.page
        }
      >
        <div
          style={
            collectionStudioStyles.pageInner
          }
        >
          <section
            style={
              collectionStudioStyles.emptyState
            }
          >
            <strong
              style={
                collectionStudioStyles.emptyStateTitle
              }
            >
              No collection-ready customers
            </strong>

            <span
              style={
                collectionStudioStyles.emptyStateMessage
              }
            >
              Customers will appear here
              automatically when they have an
              active or running loan with an
              outstanding balance.
            </span>
          </section>
        </div>
      </main>
    );
  }

  // ==========================================================
  // CUSTOMER / LOAN SAFETY FALLBACK
  // ==========================================================
  //
  // This is NOT a landing page.
  //
  // Under normal operation the first eligible
  // customer + first loan are automatically selected.
  //
  // This guard only protects the render tree if the
  // authoritative selection disappears unexpectedly.
  //
  // ==========================================================

  if (
    !selectedCustomer ||
    !selectedLoan ||
    !selectedLoanView
  ) {
    return (
      <main
        style={
          collectionStudioStyles.page
        }
      >
        <div
          style={
            collectionStudioStyles.pageInner
          }
        >
          <section
            style={
              collectionStudioStyles.emptyState
            }
          >
            <strong
              style={
                collectionStudioStyles.emptyStateTitle
              }
            >
              Preparing Collection Workspace
            </strong>

            <span
              style={
                collectionStudioStyles.emptyStateMessage
              }
            >
              Preparing the selected customer
              and collection-ready loan.
            </span>
          </section>
        </div>
      </main>
    );
  }

  // ==========================================================
  // RENDER
  //
  // IMPORTANT:
  //
  // There is NO Collection Studio title/subtitle here.
  //
  // The Collection Studio workspace begins directly with
  // Customer + Loan Selection underneath the global FINORA
  // header.
  //
  // ==========================================================

  return (
    <CollectionContext.Provider
      value={{
        reviewData,
        onReviewDataChange:
          setReviewData,
      }}
    >
      <main
        style={
          collectionStudioStyles.page
        }
      >
        <div
          style={
            collectionStudioStyles.pageInner
          }
        >
          {/* ==================================================
              1. CUSTOMER + LOAN SELECTION
          ================================================== */}

          <div
            style={
              collectionStudioStyles.selectionRow
            }
          >
            {/* ==================================================
                CUSTOMER INFORMATION
            ================================================== */}

            <section
              style={
                collectionStudioStyles.customerCard
              }
            >
              <div
                style={
                  collectionStudioStyles.customerSelectionArea
                }
              >
                <label
                  htmlFor="collection-customer-select"
                  style={
                    collectionStudioStyles.fieldLabel
                  }
                >
                  Select Customer
                </label>

                <div
                  style={
                    collectionStudioStyles.selectWrapper
                  }
                >
                  <select
                    id="collection-customer-select"
                    value={
                      selectedCustomer.id
                    }
                    onChange={(event) =>
                      handleCustomerChange(
                        event.target.value,
                      )
                    }
                    style={
                      collectionStudioStyles.select
                    }
                  >
                    <option
                      value=""
                      disabled
                    >
                      Select Customer
                    </option>

                    {collectionCustomers.map(
                      (
                        customer: CollectionCustomerRecord,
                      ) => (
                        <option
                          key={
                            customer.id
                          }
                          value={
                            customer.id
                          }
                        >
                          {customer.name}
                        </option>
                      ),
                    )}
                  </select>

                  <span
                    aria-hidden="true"
                    style={
                      collectionStudioStyles.selectArrow
                    }
                  >
                    ▾
                  </span>
                </div>

                <div
                  style={
                    collectionStudioStyles.customerDetails
                  }
                >
                  <div
                    style={
                      collectionStudioStyles.customerDetailLine
                    }
                  >
                    <span
                      style={
                        collectionStudioStyles.detailLabel
                      }
                    >
                      CUST ID
                    </span>

                    <span
                      style={
                        collectionStudioStyles.detailValue
                      }
                      title={
                        selectedCustomer.id
                      }
                    >
                      {
                        selectedCustomer.id
                      }
                    </span>
                  </div>

                  <div
                    style={
                      collectionStudioStyles.customerDetailLine
                    }
                  >
                    <span
                      style={
                        collectionStudioStyles.detailLabel
                      }
                    >
                      PHONE
                    </span>

                    <span
                      style={
                        collectionStudioStyles.detailValue
                      }
                    >
                      {
                        selectedCustomer.phone ||
                        "--"
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* ===============================================
                  CUSTOMER PHOTO
              =============================================== */}

              <div
                style={
                  collectionStudioStyles.customerPhotoFrame
                }
              >
                {selectedCustomer.photo ? (
                  <img
                    src={
                      selectedCustomer.photo
                    }
                    alt={
                      selectedCustomer.name
                    }
                    style={
                      collectionStudioStyles.customerPhoto
                    }
                  />
                ) : (
                  <div
                    style={
                      collectionStudioStyles.photoPlaceholder
                    }
                  >
                    <span
                      style={
                        collectionStudioStyles.photoPlaceholderMark
                      }
                    >
                      F
                    </span>

                    <span
                      style={
                        collectionStudioStyles.photoPlaceholderText
                      }
                    >
                      FINORA
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* ==================================================
                CUSTOMER LOANS
            ==================================================
            
                IMPORTANT:
                
                This receives ONLY:
                
                selectedCustomer.loans
                
                Therefore:
                
                Customer A → Customer A loans only
                Customer B → Customer B loans only
            ================================================== */}

            <CollectionLoanSelection
              loans={
                customerLoans
              }
              selectedLoanId={
                selectedLoan.id
              }
              onSelectLoan={(loan) =>
                handleLoanChange(
                  loan.id,
                )
              }
            />
          </div>

          {/* ==================================================
              SELECTED LOAN
          ================================================== */}

          <CollectionSelectedLoan
            loan={
              selectedLoanView
            }
            formatCurrency={(
              value: number,
            ) => {
              const safeValue =
                Number.isFinite(value)
                  ? value
                  : 0;

              return `₹ ${safeValue.toLocaleString(
                "en-IN",
              )}`;
            }}
          />

          {/* ==================================================
              3 + 4. COLLECTION WORKSPACE
          ================================================== */}

          <section
            style={
              collectionStudioStyles.collectionWorkspace
            }
          >
            <div
              style={
                collectionStudioStyles.systemGeneratedColumn
              }
            >
              {/* ==============================================
                  3. SYSTEM GENERATED
              ============================================== */}

              <CollectionSystemGenerated />
            </div>

            <div
              style={
                collectionStudioStyles.collectionEntryColumn
              }
            >
              {/* ==============================================
                  4. COLLECTION ENTRY
              ============================================== */}

              <CollectionEntry />
            </div>
          </section>

          {/* ==================================================
              5. COLLECTION SUMMARY
          ================================================== */}

          <section
            style={
              collectionStudioStyles.collectionSummarySection
            }
          >
            <CollectionSummary />
          </section>

          {/* ==================================================
              6. PAYMENT DETAILS
          ================================================== */}

          <section
            style={
              collectionStudioStyles.paymentDetailsSection
            }
          >
            <PaymentDetails />
          </section>

          {/* ==================================================
              7 + 8. DOCUMENTS / HISTORY
          ================================================== */}

          <section
            style={
              collectionStudioStyles.documentsHistoryRow
            }
          >
            <div
              style={
                collectionStudioStyles.loanDocumentsColumn
              }
            >
              <LoanDocuments />
            </div>

            <div
              style={
                collectionStudioStyles.collectionHistoryColumn
              }
            >
              <CollectionHistory />
            </div>
          </section>

          {/* ==================================================
              COLLECTION STUDIO FOOTER
          ================================================== */}
        </div>
      </main>
    </CollectionContext.Provider>
  );
}

// ============================================================
// END
// ============================================================