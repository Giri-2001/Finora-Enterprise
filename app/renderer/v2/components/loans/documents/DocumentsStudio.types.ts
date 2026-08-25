/* ==========================================================
   FINORA ENTERPRISE OS™
   DOCUMENTS STUDIO™ — TYPES / CONSTANTS / HELPERS

   RESPONSIBILITY:
   - Shared Documents Studio contracts
   - Category definitions
   - Upload constants
   - Pure document helper functions

   THEME:
   - No visual styling lives in this file.
========================================================== */

export type DocumentsStudioItemType =
  | "image"
  | "pdf";

export interface DocumentsStudioItem {
  id: string;
  categoryId: string;
  name: string;
  originalName: string;
  type: DocumentsStudioItemType;
  mimeType: string;
  url: string;
  size: number;
  createdAt: string;
  quickRole?: "family" | "nominee";
}

export interface DocumentsStudioProps {
  customerName?: string;
  customerPhoto?: string;
  items?: DocumentsStudioItem[];

  onDocumentsChange?: (
    items: DocumentsStudioItem[],
  ) => void;
}

export const MAX_ITEMS_PER_PAGE = 15;

export const PREVIEW_LIMIT = 10;

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

export type CategoryId =
  (typeof CATEGORIES)[number]["id"];

export type CategoryConfig =
  (typeof CATEGORIES)[number];

export function createId(
  prefix: string,
): string {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

export function getItemType(
  file: File,
): DocumentsStudioItemType | null {
  if (file.type === "application/pdf") {
    return "pdf";
  }

  if (file.type.startsWith("image/")) {
    return "image";
  }

  return null;
}

export function getDisplayName(
  fileName: string,
): string {
  const withoutExtension =
    fileName.replace(/\.[^/.]+$/, "");

  return (
    withoutExtension.trim() ||
    "Uploaded Document"
  );
}

export function formatCount(
  count: number,
): string {
  return `${count} ${
    count === 1 ? "item" : "items"
  }`;
}
