/* ===========================================================
   FINORA ENTERPRISE OS™

   COLLECTION STUDIO™

   LOAN DOCUMENTS / IMAGES

   RESPONSIBILITY

   - Display loan-related document/image area
   - Provide document preview tiles
   - Provide View All Documents action
   - Presentation only

   IMPORTANT

   - No business logic
   - No persistence
   - No local theme system
   - No responsive logic
   - No image generation
=========================================================== */

// ============================================================
// IMPORTS
// ============================================================

import type { CSSProperties } from "react";

import { SummaryCard } from "../../common";

import { loanDocumentsStyles } from "./LoanDocuments.styles";

// ============================================================
// TYPES
// ============================================================

interface LoanDocumentItem {
  id: string;
  label: string;
  type: "image" | "document";
  src?: string;
}

// ============================================================
// PLACEHOLDER DOCUMENT CONTRACT
//
// The real document collection can be connected by the
// Collection Controller / document engine later.
// ============================================================

const DOCUMENTS: LoanDocumentItem[] = [
  {
    id: "document-1",
    label: "Document 1",
    type: "image",
  },
  {
    id: "document-2",
    label: "Document 2",
    type: "image",
  },
  {
    id: "document-3",
    label: "Document 3",
    type: "image",
  },
  {
    id: "document-4",
    label: "Document 4",
    type: "image",
  },
  {
    id: "document-5",
    label: "Document 5",
    type: "image",
  },
];

// ============================================================
// COMPONENT
// ============================================================

export default function LoanDocuments() {
  return (
    <section aria-label="Loan Documents" style={loanDocumentsStyles.section}>
      {/* ======================================================
          SECTION HEADER
      ====================================================== */}

      <div style={loanDocumentsStyles.header}>
        <div style={loanDocumentsStyles.headerTitle}>
          <span style={loanDocumentsStyles.step}>7</span>

          <div>
            <h2 style={loanDocumentsStyles.title}>LOAN DOCUMENTS / IMAGES</h2>

            <p style={loanDocumentsStyles.subtitle}>
              Documents and images attached to this loan.
            </p>
          </div>
        </div>

        <button
          type="button"
          style={loanDocumentsStyles.viewAllButton}
          onClick={() => {
            console.log("View all loan documents");
          }}
        >
          VIEW ALL DOCUMENTS
          <span aria-hidden="true" style={loanDocumentsStyles.arrow}>
            →
          </span>
        </button>
      </div>

      {/* ======================================================
          DOCUMENT GRID
      ====================================================== */}

      <div style={loanDocumentsStyles.grid}>
        {DOCUMENTS.map((document) => (
          <button
            key={document.id}
            type="button"
            aria-label={`Open ${document.label}`}
            style={loanDocumentsStyles.documentButton}
            onClick={() => {
              console.log("Open loan document:", document.id);
            }}
          >
            {document.src ? (
              <img
                src={document.src}
                alt={document.label}
                style={loanDocumentsStyles.image}
              />
            ) : (
              <div style={loanDocumentsStyles.placeholder}>
                <span style={loanDocumentsStyles.placeholderIcon}>IMG</span>

                <span style={loanDocumentsStyles.placeholderText}>
                  {document.type === "document" ? "DOC" : "IMAGE"}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// END
// ============================================================
