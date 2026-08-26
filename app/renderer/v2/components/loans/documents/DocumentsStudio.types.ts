/* ==========================================================
   FINORA ENTERPRISE OS™

   DOCUMENTS STUDIO™ — TYPES / CONSTANTS / HELPERS

   RESPONSIBILITY:
   - Shared Documents Studio contracts
   - Category definitions
   - Upload constants
   - Persistent document metadata contract
   - Pure document helper functions

   STORAGE CONTRACT:
   - This file does NOT access StorageManager.
   - This file does NOT save or load documents.
   - Persistent document data is represented here so the
     Documents Studio, Loan Studio and storage layer can share
     one stable document contract.
   - Temporary browser object URLs remain presentation-only.
   - Persistent document content/reference is represented by
     storageKey / dataUrl when available.

   THEME:
   - No visual styling lives in this file.
========================================================== */

/* ==========================================================
   DOCUMENT ITEM TYPE
========================================================== */

export type DocumentsStudioItemType = "image" | "pdf";

/* ==========================================================
   DOCUMENT PERSISTENCE STATUS
========================================================== */

export type DocumentsStudioPersistenceMode =
  | "pending"
  | "local"
  | "usb"
  | "cloud";

/* ==========================================================
   DOCUMENT ITEM
========================================================== */

export interface DocumentsStudioItem {
  /* --------------------------------------------------------
     DOCUMENT ID
  -------------------------------------------------------- */

  id: string;

  /* --------------------------------------------------------
     CATEGORY
  -------------------------------------------------------- */

  categoryId: string;

  /* --------------------------------------------------------
     DISPLAY NAME
  -------------------------------------------------------- */

  name: string;

  /* --------------------------------------------------------
     ORIGINAL FILE NAME
  -------------------------------------------------------- */

  originalName: string;

  /* --------------------------------------------------------
     FILE TYPE
  -------------------------------------------------------- */

  type: DocumentsStudioItemType;

  /* --------------------------------------------------------
     MIME TYPE
  -------------------------------------------------------- */

  mimeType: string;

  /* --------------------------------------------------------
     PRESENTATION URL
     --------------------------------------------------------
     Browser object URL used only while the uploaded file is
     available in the current renderer session.

     IMPORTANT:
     This is NOT the permanent storage location.
  -------------------------------------------------------- */

  url: string;

  /* --------------------------------------------------------
     FILE SIZE
  -------------------------------------------------------- */

  size: number;

  /* --------------------------------------------------------
     CREATED TIMESTAMP
  -------------------------------------------------------- */

  createdAt: string;

  /* --------------------------------------------------------
     FINORA PERSISTENT STORAGE KEY
     -------------------------------------------------------- */

  storageKey?: string;

  /* --------------------------------------------------------
     PERSISTENT DATA URL
     -------------------------------------------------------- */

  dataUrl?: string;

  /* --------------------------------------------------------
     PERSISTENCE MODE
  -------------------------------------------------------- */

  persistenceMode?: DocumentsStudioPersistenceMode;

  /* --------------------------------------------------------
     PERSISTENCE STATE
  -------------------------------------------------------- */

  persisted?: boolean;

  /* --------------------------------------------------------
     OPTIONAL LOAN LINK
     --------------------------------------------------------
     Filled by the Loan Studio / loan persistence layer once
     the document becomes attached to a concrete loan.
  -------------------------------------------------------- */

  loanId?: string;

  /* --------------------------------------------------------
     CUSTOMER LINK
     --------------------------------------------------------
     Keeps evidence associated with the selected customer
     before / alongside the final loan relationship.
  -------------------------------------------------------- */

  customerId?: string;

  /* --------------------------------------------------------
     OPTIONAL QUICK ROLE
  -------------------------------------------------------- */

  quickRole?: "family" | "nominee";
}

/* ==========================================================
   PUBLIC COMPONENT PROPS
   ----------------------------------------------------------
   CUSTOMER / LOAN CONTEXT:
   - customerId identifies the active customer workspace.
   - loanId identifies the concrete loan once it exists.
   - Documents can therefore exist against the customer before
     loan creation and become loan-linked after approval.
========================================================== */

export interface DocumentsStudioProps {
  customerName?: string;

  customerPhoto?: string;

  customerId?: string;

  loanId?: string;

  items?: DocumentsStudioItem[];

  onDocumentsChange?: (items: DocumentsStudioItem[]) => void;
}

/* ==========================================================
   PAGINATION / PREVIEW CONSTANTS
========================================================== */

export const MAX_ITEMS_PER_PAGE = 15;

export const PREVIEW_LIMIT = 10;

/* ==========================================================
   ACCEPTED UPLOAD TYPES
========================================================== */

export const ACCEPTED_TYPES =
  "image/jpeg,image/png,image/webp,image/gif,application/pdf";

/* ==========================================================
   CATEGORY DEFINITIONS
   ----------------------------------------------------------
   Icon names are resolved by DocumentsStudio.parts.tsx
   using the FINORA-wide Lucide React icon system.

   IMPORTANT:
   - No Unicode placeholder icons.
   - No emoji icons.
   - No custom SVG icons.
   - Use the existing Lucide icon library already installed
     across FINORA Enterprise.
========================================================== */

export const CATEGORIES = [
  {
    id: "identity",
    title: "Identity Documents",
    shortTitle: "Identity",
    icon: "id-card",
  },

  {
    id: "address",
    title: "Address Proof",
    shortTitle: "Address",
    icon: "map-pin-house",
  },

  {
    id: "income",
    title: "Income / Business Proof",
    shortTitle: "Income",
    icon: "briefcase-business",
  },

  {
    id: "vehicle",
    title: "Vehicle Documents",
    shortTitle: "Vehicle",
    icon: "car-front",
  },

  {
    id: "loan",
    title: "Loan Agreements / Promissory Notes",
    shortTitle: "Agreements",
    icon: "file-signature",
  },

  {
    id: "collateral",
    title: "Collateral / Security Documents",
    shortTitle: "Collateral",
    icon: "shield-check",
  },

  {
    id: "other",
    title: "Other Documents",
    shortTitle: "Other",
    icon: "files",
  },

  {
    id: "personal",
    title: "Personal Photos",
    shortTitle: "Personal",
    icon: "images",
  },
] as const;

/* ==========================================================
   CATEGORY TYPES
========================================================== */

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export type CategoryConfig = (typeof CATEGORIES)[number];

/* ==========================================================
   DOCUMENT ID FACTORY
========================================================== */

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/* ==========================================================
   FILE TYPE RESOLVER
========================================================== */

export function getItemType(file: File): DocumentsStudioItemType | null {
  if (file.type === "application/pdf") {
    return "pdf";
  }

  if (file.type.startsWith("image/")) {
    return "image";
  }

  return null;
}

/* ==========================================================
   DISPLAY NAME RESOLVER
========================================================== */

export function getDisplayName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "");

  return withoutExtension.trim() || "Uploaded Document";
}

/* ==========================================================
   DOCUMENT SIZE FORMATTER
========================================================== */

export function formatDocumentSize(size: number): string {
  if (!Number.isFinite(size) || size <= 0) {
    return "0 B";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/* ==========================================================
   DOCUMENT PERSISTENCE CHECK
========================================================== */

export function isDocumentPersisted(item: DocumentsStudioItem): boolean {
  return item.persisted === true && Boolean(item.storageKey);
}

/* ==========================================================
   DOCUMENT STORAGE KEY FACTORY
========================================================== */

export function createDocumentStorageKey(
  customerId: string,
  documentId: string,
  loanId?: string,
): string {
  const normalizedCustomerId = customerId.trim();

  const normalizedDocumentId = documentId.trim();

  const normalizedLoanId = loanId?.trim();

  if (normalizedLoanId) {
    return [
      "FINORA",
      "loans",
      normalizedLoanId,
      "documents",
      normalizedDocumentId,
    ].join("/");
  }

  return [
    "FINORA",
    "customers",
    normalizedCustomerId,
    "documents",
    normalizedDocumentId,
  ].join("/");
}

/* ==========================================================
   DOCUMENT PERSISTENCE MODE GUARD
========================================================== */

export function isPersistentStorageMode(
  value: DocumentsStudioPersistenceMode,
): value is "local" | "usb" | "cloud" {
  return value === "local" || value === "usb" || value === "cloud";
}

/* ==========================================================
   COUNT FORMATTER
========================================================== */

export function formatCount(count: number): string {
  return `${count} ${count === 1 ? "item" : "items"}`;
}

/* ==========================================================
   END
========================================================== */
