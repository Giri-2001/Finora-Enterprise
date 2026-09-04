// ============================================================
// FINORA ENTERPRISE OS™
//
// REJECTED LOAN APPLICATIONS PAGE
//
// RESPONSIBILITY:
// - Display permanently archived rejected Loan Applications.
// - Search rejected applications.
// - Display saved Loan Studio snapshot values.
// - Display archived application documents.
// - Reopen an eligible application through the domain service.
//
// IMPORTANT:
// - No direct StorageManager access.
// - No direct localStorage access.
// - No document persistence logic.
// - No Loan approval bypass.
// - Reopening restores a Loan Studio draft only.
// ============================================================

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Eye,
  FileText,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

import StudioLayout from "../../components/common/layout/StudioLayout";

import {
  DocumentViewer,
} from "../../components/loans/documents/DocumentsStudio.parts";

import type {
  DocumentsStudioItem,
} from "../../components/loans/documents/DocumentsStudio.types";

import {
  fetchRejectedLoanApplications,
} from "../../services/loan-applications/rejectedLoanApplicationService";

import {
  reopenRejectedLoanApplication,
} from "../../services/loan-applications/rejectedLoanApplicationReopenService";

import {
  loadRejectedLoanDocument,
} from "../../services/loan-applications/rejectedLoanDocumentStore";

import type {
  RejectedLoanApplication,
} from "../../types/loan-applications/rejectedLoanApplication.types";

import {
  applicationCardStyle,
  applicationGridStyle,
  backButtonStyle,
  cardActionsStyle,
  cardHeaderStyle,
  closeButtonStyle,
  countStyle,
  customerStyle,
  detailBackdropStyle,
  detailHeaderStyle,
  detailPanelStyle,
  detailSectionStyle,
  detailSectionTitleStyle,
  detailTitleStyle,
  documentButtonStyle,
  documentGridStyle,
  documentNameStyle,
  errorStyle,
  filterBarStyle,
  headerStyle,
  headingGroupStyle,
  metaGridStyle,
  metaItemStyle,
  metaLabelStyle,
  metaValueStyle,
  pageStyle,
  phoneStyle,
  reasonStyle,
  referenceStyle,
  refreshButtonStyle,
  reopenButtonStyle,
  searchInputStyle,
  stateStyle,
  statusBadgeStyle,
  subtitleStyle,
  summaryCardStyle,
  summaryGridStyle,
  summaryLabelStyle,
  summaryValueStyle,
  titleStyle,
  viewButtonStyle,
} from "./RejectedLoanApplicationsPage.styles";

// ============================================================
// TYPES
// ============================================================

interface RejectedLoanApplicationsPageProps {
  onBack: () => void;

  onReopenComplete: (
    application: RejectedLoanApplication,
  ) => void;
}

interface SnapshotField {
  label: string;

  value: string;
}

// ============================================================
// FORMATTERS
// ============================================================

function formatIndianAmount(
  value: number,
): string {
  const normalized =
    Number.isFinite(value)
      ? Math.max(0, value)
      : 0;

  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits: 2,
    },
  ).format(normalized);
}

function formatDateTime(
  value: string,
): string {
  const parsed =
    Date.parse(value);

  if (!Number.isFinite(parsed)) {
    return value || "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",

      month: "short",

      year: "numeric",

      hour: "2-digit",

      minute: "2-digit",
    },
  ).format(new Date(parsed));
}

function readableValue(
  value: unknown,
): string {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  return "—";
}

// ============================================================
// DOCUMENT VALIDATION
// ============================================================

function isDocumentItem(
  value: unknown,
): value is DocumentsStudioItem {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const document =
    value as Partial<DocumentsStudioItem>;

  return (
    typeof document.id === "string" &&
    Boolean(document.id.trim()) &&
    typeof document.categoryId === "string" &&
    typeof document.name === "string" &&
    typeof document.originalName === "string" &&
    (
      document.type === "image" ||
      document.type === "pdf"
    ) &&
    typeof document.mimeType === "string" &&
    typeof document.url === "string" &&
    typeof document.size === "number" &&
    typeof document.createdAt === "string"
  );
}

function getSnapshotDocuments(
  application: RejectedLoanApplication,
): DocumentsStudioItem[] {
  const value =
    application.snapshot.payload.documents;

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isDocumentItem);
}

// ============================================================
// SNAPSHOT FIELD RESOLUTION
// ============================================================

function getSnapshotFields(
  application: RejectedLoanApplication,
): SnapshotField[] {
  const payload =
    application.snapshot.payload;

  const duration =
    [
      readableValue(payload.duration),

      readableValue(payload.durationType),
    ]
      .filter((value) => value !== "—")
      .join(" ");

  return [
    {
      label: "Loan Amount",

      value:
        payload.loanAmount
          ? `₹ ${formatIndianAmount(
              Number(
                String(payload.loanAmount)
                  .replace(/,/g, ""),
              ),
            )}`
          : "—",
    },

    {
      label: "Interest",

      value:
        payload.interest
          ? `${readableValue(payload.interest)}%`
          : "—",
    },

    {
      label: "EMI Calculation",

      value:
        readableValue(
          payload.emiCalculation,
        ),
    },

    {
      label: "Repayment Type",

      value:
        readableValue(
          payload.repaymentType,
        ),
    },

    {
      label: "Duration",

      value:
        duration || "—",
    },

    {
      label: "First Installment Date",

      value:
        readableValue(
          payload.firstInstallmentDate,
        ),
    },

    {
      label: "Processing Fee",

      value:
        readableValue(
          payload.processingFee,
        ),
    },

    {
      label: "Advance Deduction",

      value:
        readableValue(
          payload.advanceDeduction,
        ),
    },

    {
      label: "Penalty Type",

      value:
        readableValue(
          payload.penaltyType,
        ),
    },

    {
      label: "Penalty Value",

      value:
        readableValue(
          payload.penaltyValue,
        ),
    },

    {
      label: "Late Fee",

      value:
        readableValue(
          payload.lateFee,
        ),
    },

    {
      label: "Guarantor Name",

      value:
        readableValue(
          payload.guarantorName,
        ),
    },

    {
      label: "Guarantor Phone",

      value:
        readableValue(
          payload.guarantorPhone,
        ),
    },

    {
      label: "Guarantor Occupation",

      value:
        readableValue(
          payload.guarantorOccupation,
        ),
    },

    {
      label: "Guarantor Relationship",

      value:
        readableValue(
          payload.guarantorRelationship,
        ),
    },

    {
      label: "Verification Status",

      value:
        readableValue(
          payload.guarantorVerificationStatus,
        ),
    },

    {
      label: "Identity Verification",

      value:
        readableValue(
          payload.guarantorIdentityVerification,
        ),
    },

    {
      label: "Payment Mode",

      value:
        readableValue(
          payload.paymentMode,
        ),
    },

    {
      label: "Transaction Status",

      value:
        readableValue(
          payload.transactionStatus,
        ),
    },
  ];
}

// ============================================================
// COMPONENT
// ============================================================

export default function RejectedLoanApplicationsPage({
  onBack,

  onReopenComplete,
}: RejectedLoanApplicationsPageProps) {
  const [
    applications,
    setApplications,
  ] = useState<RejectedLoanApplication[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    selectedApplication,
    setSelectedApplication,
  ] = useState<RejectedLoanApplication | null>(
    null,
  );

  const [
    viewerItem,
    setViewerItem,
  ] = useState<DocumentsStudioItem | null>(
    null,
  );

  const [
    loadingDocumentId,
    setLoadingDocumentId,
  ] = useState<string | null>(
    null,
  );

  const [
    reopeningApplicationId,
    setReopeningApplicationId,
  ] = useState<string | null>(
    null,
  );

  // ==========================================================
  // LOAD APPLICATIONS
  // ==========================================================

  const loadApplications =
    useCallback(
      async (
        refresh = false,
      ): Promise<void> => {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        try {
          const result =
            await fetchRejectedLoanApplications();

          if (!result.success) {
            setApplications([]);

            setError(
              result.error ??
                "Unable to load rejected Loan Applications.",
            );

            return;
          }

          const sorted =
            [...(result.data ?? [])]
              .sort(
                (
                  left,
                  right,
                ) =>
                  Date.parse(right.rejectedAt) -
                  Date.parse(left.rejectedAt),
              );

          setApplications(sorted);
        } catch (loadError) {
          console.error(
            "FINORA REJECTED LOAN APPLICATION LOAD ERROR:",
            loadError,
          );

          setApplications([]);

          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load rejected Loan Applications.",
          );
        } finally {
          setLoading(false);

          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredApplications =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();

        if (!normalizedSearch) {
          return applications;
        }

        return applications.filter(
          (application) =>
            [
              application.applicationReference,

              application.customerId,

              application.customerName,

              application.customerPhone,

              application.mode,

              application.status,

              application.rejectionReason,

              application.rejectedBy,
            ]
              .join(" ")
              .toLowerCase()
              .includes(normalizedSearch),
        );
      },
      [
        applications,

        search,
      ],
    );

  const rejectedCount =
    applications.filter(
      (application) =>
        application.status === "REJECTED",
    ).length;

  const reopenedCount =
    applications.filter(
      (application) =>
        application.status === "REOPENED",
    ).length;

  // ==========================================================
  // OPEN ARCHIVED DOCUMENT
  // ==========================================================

  async function handleOpenDocument(
    application: RejectedLoanApplication,

    document: DocumentsStudioItem,
  ): Promise<void> {
    if (loadingDocumentId) {
      return;
    }

    setLoadingDocumentId(
      document.id,
    );

    try {
      const archivedDataUrl =
        await loadRejectedLoanDocument(
          application.id,

          document.id,
        );

      const source =
        archivedDataUrl ||
        (
          document.url &&
          !document.url.startsWith("blob:")
            ? document.url
            : ""
        );

      if (!source) {
        alert(
          "Archived document content is unavailable.",
        );

        return;
      }

      setViewerItem({
        ...document,

        url:
          source,

        dataUrl:
          archivedDataUrl ?? document.dataUrl,
      });
    } catch (documentError) {
      console.error(
        "FINORA REJECTED LOAN DOCUMENT VIEW ERROR:",
        documentError,
      );

      alert(
        documentError instanceof Error
          ? documentError.message
          : "Unable to open the archived document.",
      );
    } finally {
      setLoadingDocumentId(
        null,
      );
    }
  }

  // ==========================================================
  // REOPEN APPLICATION
  // ==========================================================

  async function handleReopen(
    application: RejectedLoanApplication,
  ): Promise<void> {
    if (
      application.status !== "REJECTED" ||
      reopeningApplicationId
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        [
          `Reopen ${application.applicationReference}?`,

          "",

          "The saved values and documents will be restored into Loan Studio.",

          "A fresh Loan number will be created only after normal approval.",
        ].join("\n"),
      );

    if (!confirmed) {
      return;
    }

    setReopeningApplicationId(
      application.id,
    );

    try {
      const result =
        await reopenRejectedLoanApplication(
          application.id,
        );

      if (
        !result.success ||
        !result.data
      ) {
        alert(
          result.error ??
            "Unable to reopen the rejected Loan Application.",
        );

        return;
      }

      alert(
        "Rejected Loan Application restored successfully.",
      );

      onReopenComplete(
        result.data,
      );
    } catch (reopenError) {
      console.error(
        "FINORA REJECTED LOAN APPLICATION REOPEN ERROR:",
        reopenError,
      );

      alert(
        reopenError instanceof Error
          ? reopenError.message
          : "Unable to reopen the rejected Loan Application.",
      );
    } finally {
      setReopeningApplicationId(
        null,
      );
    }
  }

  // ==========================================================
  // SELECTED DETAIL DATA
  // ==========================================================

  const selectedDocuments =
    selectedApplication
      ? getSnapshotDocuments(
          selectedApplication,
        )
      : [];

  const selectedSnapshotFields =
    selectedApplication
      ? getSnapshotFields(
          selectedApplication,
        )
      : [];

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <StudioLayout
      department="Loans"
      allowScroll={true}
      showHeader={false}
    >
      <main style={pageStyle}>
        {/* ==================================================
            HEADER
        ================================================== */}

        <section style={headerStyle}>
          <div style={headingGroupStyle}>
            <h1 style={titleStyle}>
              Rejected Loan Applications
            </h1>

            <p style={subtitleStyle}>
              Review archived applications, documents and reopen an eligible application.
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            style={backButtonStyle}
          >
            <ArrowLeft
              size={16}
              strokeWidth={2}
            />

            Back to Loans
          </button>
        </section>

        {/* ==================================================
            SUMMARY
        ================================================== */}

        <section style={summaryGridStyle}>
          <article style={summaryCardStyle}>
            <span style={summaryLabelStyle}>
              Total Applications
            </span>

            <strong style={summaryValueStyle}>
              {applications.length}
            </strong>
          </article>

          <article style={summaryCardStyle}>
            <span style={summaryLabelStyle}>
              Rejected
            </span>

            <strong style={summaryValueStyle}>
              {rejectedCount}
            </strong>
          </article>

          <article style={summaryCardStyle}>
            <span style={summaryLabelStyle}>
              Reopened
            </span>

            <strong style={summaryValueStyle}>
              {reopenedCount}
            </strong>
          </article>
        </section>

        {/* ==================================================
            SEARCH / REFRESH
        ================================================== */}

        <section style={filterBarStyle}>
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(
                event.target.value,
              );
            }}
            placeholder="Search reference, customer, phone or reason"
            autoComplete="off"
            style={searchInputStyle}
          />

          <div style={cardActionsStyle}>
            <span style={countStyle}>
              {filteredApplications.length}{" "}
              {filteredApplications.length === 1
                ? "Application"
                : "Applications"}
            </span>

            <button
              type="button"
              onClick={() => {
                void loadApplications(true);
              }}
              disabled={refreshing}
              style={{
                ...refreshButtonStyle,

                opacity:
                  refreshing ? 0.55 : 1,

                cursor:
                  refreshing
                    ? "default"
                    : "pointer",
              }}
            >
              <RefreshCw
                size={15}
                strokeWidth={2}
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>
        </section>

        {/* ==================================================
            CONTENT
        ================================================== */}

        {error ? (
          <div style={errorStyle}>
            {error}
          </div>
        ) : loading ? (
          <div style={stateStyle}>
            Loading rejected Loan Applications...
          </div>
        ) : filteredApplications.length === 0 ? (
          <div style={stateStyle}>
            {applications.length === 0
              ? "No rejected Loan Applications are available."
              : "No rejected Loan Applications match this search."}
          </div>
        ) : (
          <section style={applicationGridStyle}>
            {filteredApplications.map(
              (application) => {
                const documentCount =
                  getSnapshotDocuments(
                    application,
                  ).length;

                const reopening =
                  reopeningApplicationId ===
                  application.id;

                const canReopen =
                  application.status ===
                  "REJECTED";

                return (
                  <article
                    key={application.id}
                    style={applicationCardStyle}
                  >
                    <div style={cardHeaderStyle}>
                      <div style={referenceStyle}>
                        {application.applicationReference}
                      </div>

                      <span
                        style={statusBadgeStyle(
                          application.status,
                        )}
                      >
                        {application.status}
                      </span>
                    </div>

                    <div>
                      <div style={customerStyle}>
                        {application.customerName || "Unknown Customer"}
                      </div>

                      <div style={phoneStyle}>
                        {application.customerId || "—"}
                        {" · "}
                        {application.customerPhone || "—"}
                      </div>
                    </div>

                    <div style={metaGridStyle}>
                      <div style={metaItemStyle}>
                        <span style={metaLabelStyle}>
                          Requested Amount
                        </span>

                        <span style={metaValueStyle}>
                          ₹{" "}
                          {formatIndianAmount(
                            application.requestedAmount,
                          )}
                        </span>
                      </div>

                      <div style={metaItemStyle}>
                        <span style={metaLabelStyle}>
                          Mode
                        </span>

                        <span style={metaValueStyle}>
                          {application.mode}
                        </span>
                      </div>

                      <div style={metaItemStyle}>
                        <span style={metaLabelStyle}>
                          Rejected At
                        </span>

                        <span style={metaValueStyle}>
                          {formatDateTime(
                            application.rejectedAt,
                          )}
                        </span>
                      </div>

                      <div style={metaItemStyle}>
                        <span style={metaLabelStyle}>
                          Documents
                        </span>

                        <span style={metaValueStyle}>
                          {documentCount}
                        </span>
                      </div>
                    </div>

                    <div style={reasonStyle}>
                      <strong>
                        Reason:
                      </strong>{" "}

                      {application.rejectionReason || "—"}
                    </div>

                    <div style={cardActionsStyle}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedApplication(
                            application,
                          );
                        }}
                        style={viewButtonStyle}
                      >
                        <Eye
                          size={15}
                          strokeWidth={2}
                        />

                        View
                      </button>

                      <button
                        type="button"
                        disabled={
                          !canReopen ||
                          reopening
                        }
                        onClick={() => {
                          void handleReopen(
                            application,
                          );
                        }}
                        style={{
                          ...reopenButtonStyle,

                          opacity:
                            canReopen && !reopening
                              ? 1
                              : 0.5,

                          cursor:
                            canReopen && !reopening
                              ? "pointer"
                              : "default",
                        }}
                      >
                        <RotateCcw
                          size={15}
                          strokeWidth={2}
                        />

                        {reopening
                          ? "Restoring..."
                          : canReopen
                            ? "Reopen Application"
                            : "Already Reopened"}
                      </button>
                    </div>
                  </article>
                );
              },
            )}
          </section>
        )}

        {/* ==================================================
            APPLICATION DETAIL
        ================================================== */}

        {selectedApplication ? (
          <div
            style={detailBackdropStyle}
            onClick={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setSelectedApplication(
                  null,
                );
              }
            }}
          >
            <section style={detailPanelStyle}>
              <header style={detailHeaderStyle}>
                <div>
                  <h2 style={detailTitleStyle}>
                    {selectedApplication.applicationReference}
                  </h2>

                  <p style={subtitleStyle}>
                    Complete archived Loan Application snapshot
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedApplication(
                      null,
                    );
                  }}
                  style={closeButtonStyle}
                  aria-label="Close application details"
                >
                  ×
                </button>
              </header>

              <section style={detailSectionStyle}>
                <h3 style={detailSectionTitleStyle}>
                  Rejection Information
                </h3>

                <div style={metaGridStyle}>
                  <div style={metaItemStyle}>
                    <span style={metaLabelStyle}>
                      Customer
                    </span>

                    <span style={metaValueStyle}>
                      {selectedApplication.customerName || "—"}
                    </span>
                  </div>

                  <div style={metaItemStyle}>
                    <span style={metaLabelStyle}>
                      Customer ID
                    </span>

                    <span style={metaValueStyle}>
                      {selectedApplication.customerId || "—"}
                    </span>
                  </div>

                  <div style={metaItemStyle}>
                    <span style={metaLabelStyle}>
                      Phone
                    </span>

                    <span style={metaValueStyle}>
                      {selectedApplication.customerPhone || "—"}
                    </span>
                  </div>

                  <div style={metaItemStyle}>
                    <span style={metaLabelStyle}>
                      Rejected By
                    </span>

                    <span style={metaValueStyle}>
                      {selectedApplication.rejectedBy || "—"}
                    </span>
                  </div>

                  <div style={metaItemStyle}>
                    <span style={metaLabelStyle}>
                      Rejected At
                    </span>

                    <span style={metaValueStyle}>
                      {formatDateTime(
                        selectedApplication.rejectedAt,
                      )}
                    </span>
                  </div>

                  <div style={metaItemStyle}>
                    <span style={metaLabelStyle}>
                      Saved Step
                    </span>

                    <span style={metaValueStyle}>
                      Step {selectedApplication.snapshot.step}
                    </span>
                  </div>
                </div>

                <div style={reasonStyle}>
                  <strong>
                    Rejection Reason:
                  </strong>{" "}

                  {selectedApplication.rejectionReason || "—"}
                </div>
              </section>

              <section style={detailSectionStyle}>
                <h3 style={detailSectionTitleStyle}>
                  Loan Studio Values
                </h3>

                <div style={metaGridStyle}>
                  {selectedSnapshotFields.map(
                    (field) => (
                      <div
                        key={field.label}
                        style={metaItemStyle}
                      >
                        <span style={metaLabelStyle}>
                          {field.label}
                        </span>

                        <span style={metaValueStyle}>
                          {field.value}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </section>

              <section style={detailSectionStyle}>
                <h3 style={detailSectionTitleStyle}>
                  Purpose & Remarks
                </h3>

                <div style={metaGridStyle}>
                  <div style={metaItemStyle}>
                    <span style={metaLabelStyle}>
                      Purpose
                    </span>

                    <span style={metaValueStyle}>
                      {readableValue(
                        selectedApplication.snapshot.payload.purpose,
                      )}
                    </span>
                  </div>

                  <div style={metaItemStyle}>
                    <span style={metaLabelStyle}>
                      Remarks
                    </span>

                    <span style={metaValueStyle}>
                      {readableValue(
                        selectedApplication.snapshot.payload.remarks,
                      )}
                    </span>
                  </div>

                  <div style={metaItemStyle}>
                    <span style={metaLabelStyle}>
                      Guarantor Address
                    </span>

                    <span style={metaValueStyle}>
                      {readableValue(
                        selectedApplication.snapshot.payload.guarantorAddress,
                      )}
                    </span>
                  </div>
                </div>
              </section>

              <section style={detailSectionStyle}>
                <h3 style={detailSectionTitleStyle}>
                  Archived Documents ({selectedDocuments.length})
                </h3>

                {selectedDocuments.length === 0 ? (
                  <div style={countStyle}>
                    No documents were uploaded for this application.
                  </div>
                ) : (
                  <div style={documentGridStyle}>
                    {selectedDocuments.map(
                      (document) => (
                        <button
                          key={document.id}
                          type="button"
                          disabled={
                            loadingDocumentId ===
                            document.id
                          }
                          onClick={() => {
                            void handleOpenDocument(
                              selectedApplication,

                              document,
                            );
                          }}
                          style={{
                            ...documentButtonStyle,

                            opacity:
                              loadingDocumentId === document.id
                                ? 0.55
                                : 1,
                          }}
                        >
                          <FileText
                            size={16}
                            strokeWidth={1.9}
                          />

                          <span style={documentNameStyle}>
                            {document.name}
                          </span>

                          <Eye
                            size={15}
                            strokeWidth={1.9}
                          />
                        </button>
                      ),
                    )}
                  </div>
                )}
              </section>

              <div style={cardActionsStyle}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedApplication(
                      null,
                    );
                  }}
                  style={backButtonStyle}
                >
                  Close
                </button>

                <button
                  type="button"
                  disabled={
                    selectedApplication.status !== "REJECTED" ||
                    reopeningApplicationId !== null
                  }
                  onClick={() => {
                    void handleReopen(
                      selectedApplication,
                    );
                  }}
                  style={{
                    ...reopenButtonStyle,

                    opacity:
                      selectedApplication.status === "REJECTED" &&
                      reopeningApplicationId === null
                        ? 1
                        : 0.5,
                  }}
                >
                  <RotateCcw
                    size={15}
                    strokeWidth={2}
                  />

                  {selectedApplication.status === "REJECTED"
                    ? "Reopen Application"
                    : "Already Reopened"}
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {/* ==================================================
            EXISTING DOCUMENT VIEWER
        ================================================== */}

        {viewerItem ? (
          <DocumentViewer
            item={viewerItem}
            onClose={() => {
              setViewerItem(
                null,
              );
            }}
          />
        ) : null}
      </main>
    </StudioLayout>
  );
}

// ============================================================
// END
// ============================================================
