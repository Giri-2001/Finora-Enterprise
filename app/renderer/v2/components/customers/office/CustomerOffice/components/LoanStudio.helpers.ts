/* ============================================================
   FINORA ENTERPRISE OS
   LOAN STUDIO HELPERS
   ============================================================ */

import { StorageMode } from "../../../../../storage/storage.types";

const STORAGE_MODE_SESSION_KEY = "FINORA_STORAGE_MODE";

export function getAuthenticatedStorageMode(): StorageMode {
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

export const parseNumericValue = (value: string): number => {
  const normalized = value.replace(/,/g, "").trim();

  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeLoanType = (
  value: string,
): "MONTHLY" | "YEARLY" | "" => {
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/\s+LOAN$/, "");

  if (normalized === "MONTHLY") {
    return "MONTHLY";
  }

  if (normalized === "YEARLY") {
    return "YEARLY";
  }

  return "";
};

export const getLoanTypeLabel = (value: string): string => {
  const normalized = normalizeLoanType(value);

  switch (normalized) {
    case "MONTHLY":
      return "Monthly Loan";

    case "YEARLY":
      return "Yearly Loan";

    default:
      return "--";
  }
};

export const formatIndianDate = (value: Date | null): string => {
  if (!value) {
    return "--";
  }

  const day = String(value.getDate()).padStart(2, "0");

  const month = String(value.getMonth() + 1).padStart(2, "0");

  return `${day}/${month}/${value.getFullYear()}`;
};

/* ============================================================
   END
============================================================ */
