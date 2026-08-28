/* ===========================================================
   FINORA ENTERPRISE OS™

   COLLECTION STUDIO™

   LOAN DOCUMENTS / IMAGES

   RESPONSIBILITY

   - Display documents belonging only to selected loan
   - Display persisted live image previews
   - Display persisted PDF documents
   - Display total document count
   - Provide individual View action for every document
   - Provide View All Documents action
   - Open image in full-size viewer
   - Open PDF in browser viewer
   - Never create dummy documents
   - Presentation only

   IMPORTANT

   - No business logic
   - No persistence
   - No repository access
   - No localStorage
   - No filesystem access
   - No Electron IPC
   - No local theme system
   - No responsive logic
   - No image generation
=========================================================== */

// ============================================================
// IMPORTS
// ============================================================

import { useEffect, useMemo, useState } from "react";

import { Files } from "lucide-react";

import type { DocumentsStudioItem } from "../../loans/documents/DocumentsStudio";

import { loanDocumentsStyles } from "./LoanDocuments.styles";

// ============================================================
// TYPES
// ============================================================

interface LoanDocumentsProps {
  documents?: DocumentsStudioItem[];
}

// ============================================================
// DOCUMENT WITH OPTIONAL PERSISTED DATA URL
// ============================================================

type PersistedDocumentItem = DocumentsStudioItem & {
  dataUrl?: string;
};

// ============================================================
// DOCUMENT SOURCE
// ============================================================

function getDocumentSource(document: DocumentsStudioItem): string {
  const persistedDocument = document as PersistedDocumentItem;

  return persistedDocument.dataUrl || document.url || "";
}

// ============================================================
// DOCUMENT TYPE LABEL
// ============================================================

function getDocumentTypeLabel(document: DocumentsStudioItem): string {
  if (document.type === "pdf") {
    return "PDF";
  }

  const mimeType = String(document.mimeType ?? "")
    .trim()
    .toLowerCase();

  if (mimeType.includes("png")) {
    return "PNG";
  }

  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
    return "JPG";
  }

  if (mimeType.includes("webp")) {
    return "WEBP";
  }

  if (mimeType.includes("gif")) {
    return "GIF";
  }

  return "IMAGE";
}

// ============================================================
// COMPONENT
// ============================================================

export default function LoanDocuments({ documents = [] }: LoanDocumentsProps) {
  // ==========================================================
  // NORMALIZED DOCUMENTS
  // ==========================================================

  const normalizedDocuments = useMemo(
    () =>
      Array.isArray(documents)
        ? documents.filter((document) => Boolean(document?.id))
        : [],
    [documents],
  );

  // ==========================================================
  // FULL VIEWER DOCUMENT
  // ==========================================================

  const [viewerDocument, setViewerDocument] =
    useState<DocumentsStudioItem | null>(null);

  // ==========================================================
  // VIEW ALL MODE
  // ==========================================================

  const [viewAllOpen, setViewAllOpen] = useState(false);

  // ==========================================================
  // IMAGE LOAD FAILURES
  // ==========================================================

  const [failedDocumentIds, setFailedDocumentIds] = useState<Set<string>>(
    () => new Set(),
  );

  // ==========================================================
  // RESET PRESENTATION STATE WHEN DOCUMENTS CHANGE
  // ==========================================================

  useEffect(() => {
    setViewerDocument(null);

    setViewAllOpen(false);

    setFailedDocumentIds(new Set());
  }, [documents]);

  // ==========================================================
  // DOCUMENT OPEN
  // ==========================================================

  function openDocument(document: DocumentsStudioItem): void {
    const source = getDocumentSource(document);

    if (!source) {
      return;
    }

    // --------------------------------------------------------
    // PDF
    // --------------------------------------------------------

    if (document.type === "pdf") {
      window.open(source, "_blank", "noopener,noreferrer");

      return;
    }

    // --------------------------------------------------------
    // IMAGE
    // --------------------------------------------------------

    setViewerDocument(document);
  }

  // ==========================================================
  // CLOSE FULL IMAGE VIEWER
  // ==========================================================

  function closeViewer(): void {
    setViewerDocument(null);
  }

  // ==========================================================
  // CLOSE VIEW ALL MODAL
  // ==========================================================

  function closeViewAll(): void {
    setViewAllOpen(false);
  }

  // ==========================================================
  // IMAGE ERROR
  // ==========================================================

  function handleImageError(documentId: string): void {
    setFailedDocumentIds((current) => {
      const next = new Set(current);

      next.add(documentId);

      return next;
    });
  }

  // ==========================================================
  // IMAGE PREVIEW
  // ==========================================================

  function renderImagePreview(
    document: DocumentsStudioItem,
    mode: "tile" | "viewer",
  ) {
    const source = getDocumentSource(document);

    const failed = failedDocumentIds.has(document.id);

    if (!source || failed) {
      return (
        <div
          style={
            mode === "viewer"
              ? loanDocumentsStyles.viewerPlaceholder
              : loanDocumentsStyles.placeholder
          }
        >
          <span style={loanDocumentsStyles.placeholderIcon}>IMG</span>

          <span style={loanDocumentsStyles.placeholderText}>
            PREVIEW UNAVAILABLE
          </span>
        </div>
      );
    }

    return (
      <img
        src={source}
        alt={document.name}
        style={
          mode === "viewer"
            ? loanDocumentsStyles.viewerImage
            : loanDocumentsStyles.image
        }
        onError={() => handleImageError(document.id)}
      />
    );
  }

  // ==========================================================
  // DOCUMENT PREVIEW
  // ==========================================================

  function renderDocumentPreview(document: DocumentsStudioItem) {
    if (document.type === "image") {
      return renderImagePreview(document, "tile");
    }

    return (
      <div style={loanDocumentsStyles.pdfPlaceholder}>
        <span style={loanDocumentsStyles.pdfIcon}>PDF</span>

        <span style={loanDocumentsStyles.pdfText}>
          {getDocumentTypeLabel(document)}
        </span>
      </div>
    );
  }

  // ==========================================================
  // DOCUMENT COUNT BADGE
  // ==========================================================

  const documentCountBadge: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "76px",
    height: "30px",
    padding: "0 12px",
    boxSizing: "border-box",
    border: "1px solid #d8a72b",
    borderRadius: "999px",
    background: "#fff8dc",
    color: "#8a6100",
    fontSize: "12px",
    fontWeight: 700,
    lineHeight: 1,
    whiteSpace: "nowrap",
    flexShrink: 0,
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      <section aria-label="Loan Documents" style={loanDocumentsStyles.section}>
        {/* ==================================================
            SECTION HEADER
        ================================================== */}

        <div style={loanDocumentsStyles.header}>
          <div style={loanDocumentsStyles.headerTitle}>
            <Files
              aria-hidden="true"
              style={loanDocumentsStyles.headerIcon}
            />

            <div style={loanDocumentsStyles.headerContent}>
              <h2 style={loanDocumentsStyles.title}>
                LOAN DOCUMENTS / IMAGES
              </h2>

              <p style={loanDocumentsStyles.subtitle}>
                Documents and images attached to this loan.
              </p>
            </div>
          </div>

          {/* ==================================================
              HEADER ACTIONS

              COUNT + VIEW ALL
          ================================================== */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "10px",
              flexShrink: 0,
            }}
          >
            {/* ------------------------------------------------
                TOTAL DOCUMENT COUNT
            ------------------------------------------------ */}

            <span
              style={documentCountBadge}
              aria-label={`${normalizedDocuments.length} ${
                normalizedDocuments.length === 1 ? "document" : "documents"
              }`}
            >
              {normalizedDocuments.length}{" "}
              {normalizedDocuments.length === 1 ? "document" : "documents"}
            </span>

            {/* ------------------------------------------------
                VIEW ALL DOCUMENTS
            ------------------------------------------------ */}

            <button
              type="button"
              style={loanDocumentsStyles.viewAllButton}
              onClick={() => setViewAllOpen(true)}
              disabled={normalizedDocuments.length === 0}
            >
              VIEW ALL

              <span aria-hidden="true" style={loanDocumentsStyles.arrow}>
                →
              </span>
            </button>
          </div>
        </div>

        {/* ==================================================
            DOCUMENT GRID
        ================================================== */}

        {normalizedDocuments.length === 0 ? (
          <div style={loanDocumentsStyles.emptyState}>
            <strong style={loanDocumentsStyles.emptyStateTitle}>
              No loan documents
            </strong>

            <span style={loanDocumentsStyles.emptyStateMessage}>
              No documents are currently stored for this loan.
            </span>
          </div>
        ) : (
          <div style={loanDocumentsStyles.grid}>
            {normalizedDocuments.slice(0, 5).map((document) => (
              <article
                key={document.id}
                style={loanDocumentsStyles.allDocumentCard}
              >
                <button
                  type="button"
                  aria-label={`View ${document.name}`}
                  title={`View ${document.name}`}
                  style={loanDocumentsStyles.documentButton}
                  onClick={() => openDocument(document)}
                >
                  {renderDocumentPreview(document)}
                </button>

                <div style={loanDocumentsStyles.allDocumentInfo}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={loanDocumentsStyles.allDocumentName}
                      title={document.name}
                    >
                      {document.name}
                    </span>

                    <button
                      type="button"
                      aria-label={`View ${document.name}`}
                      title={`View ${document.name}`}
                      style={loanDocumentsStyles.viewAllButton}
                      onClick={() => openDocument(document)}
                    >
                      {document.type === "pdf" ? "OPEN" : "VIEW"}
                    </button>
                  </div>

                  <span style={loanDocumentsStyles.allDocumentType}>
                    {getDocumentTypeLabel(document)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ======================================================
          VIEW ALL DOCUMENTS MODAL
      ====================================================== */}

      {viewAllOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="All Loan Documents"
          style={loanDocumentsStyles.viewerBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeViewAll();
            }
          }}
        >
          <div style={loanDocumentsStyles.viewerContent}>
            <div style={loanDocumentsStyles.viewerHeader}>
              <div>
                <strong style={loanDocumentsStyles.viewerTitle}>
                  ALL LOAN DOCUMENTS
                </strong>

                <span style={loanDocumentsStyles.viewerMeta}>
                  {normalizedDocuments.length} document
                  {normalizedDocuments.length === 1 ? "" : "s"}
                </span>
              </div>

              <button
                type="button"
                aria-label="Close all documents"
                style={loanDocumentsStyles.viewerClose}
                onClick={closeViewAll}
              >
                ×
              </button>
            </div>

            <div style={loanDocumentsStyles.allDocumentsGrid}>
              {normalizedDocuments.map((document) => (
                <article
                  key={document.id}
                  style={loanDocumentsStyles.allDocumentCard}
                >
                  <button
                    type="button"
                    aria-label={`View ${document.name}`}
                    title={`View ${document.name}`}
                    style={loanDocumentsStyles.allDocumentPreview}
                    onClick={() => openDocument(document)}
                  >
                    {renderDocumentPreview(document)}
                  </button>

                  <div style={loanDocumentsStyles.allDocumentInfo}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={loanDocumentsStyles.allDocumentName}
                        title={document.name}
                      >
                        {document.name}
                      </span>

                      <button
                        type="button"
                        aria-label={`View ${document.name}`}
                        title={`View ${document.name}`}
                        style={loanDocumentsStyles.viewAllButton}
                        onClick={() => openDocument(document)}
                      >
                        {document.type === "pdf" ? "OPEN" : "VIEW"}
                      </button>
                    </div>

                    <span style={loanDocumentsStyles.allDocumentType}>
                      {getDocumentTypeLabel(document)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          FULL IMAGE VIEWER
      ====================================================== */}

      {viewerDocument && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={viewerDocument.name}
          style={loanDocumentsStyles.imageViewerBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeViewer();
            }
          }}
        >
          <div style={loanDocumentsStyles.imageViewerContent}>
            <div style={loanDocumentsStyles.imageViewerHeader}>
              <span
                style={loanDocumentsStyles.imageViewerTitle}
                title={viewerDocument.name}
              >
                {viewerDocument.name}
              </span>

              <button
                type="button"
                aria-label="Close image viewer"
                style={loanDocumentsStyles.viewerClose}
                onClick={closeViewer}
              >
                ×
              </button>
            </div>

            <div style={loanDocumentsStyles.imageViewerBody}>
              {renderImagePreview(viewerDocument, "viewer")}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// END
// ============================================================