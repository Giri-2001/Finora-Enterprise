import { createHash } from "node:crypto";

/**
 * FINORA HF28-CH45-C58
 *
 * Canonical digest of a native-read-back USB record.
 * This module does not sign, enroll, attest, or issue evidence.
 *
 * Only invoke after the native USB read-back has succeeded.
 * Version 1 accepts JSON-safe values and rejects ambiguous
 * numeric or unsupported JavaScript representations.
 */

export interface FinoraUsageDigestRecord {
  id: string;
  entity: string;
  ownerId: string;
  businessId: string;
  branchId: string;
  demoId?: string;
  data: unknown;
}

function canonicalJson(value: unknown): string {
  if (value === null) return "null";

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    // JSON-compatible finite decimals are valid business values.
    // Unsafe integer magnitudes remain rejected to avoid
    // silently hashing already-rounded monetary identifiers.
    if (
      !Number.isFinite(value) ||
      (Number.isInteger(value) && !Number.isSafeInteger(value))
    ) {
      throw new Error("FINORA_USAGE_DIGEST_UNSAFE_NUMBER");
    }
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return "[" + value.map(canonicalJson).join(",") + "]";
  }

  if (
    typeof value === "object" &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    const object = value as Record<string, unknown>;
    const keys = Object.keys(object).sort();

    return "{" + keys.map((key) => {
      return JSON.stringify(key) + ":" +
        canonicalJson(object[key]);
    }).join(",") + "}";
  }

  throw new Error("FINORA_USAGE_DIGEST_UNSUPPORTED_VALUE");
}

function required(value: unknown, name: string): string {
  if (
    typeof value !== "string" ||
    value.trim() !== value ||
    value.length === 0 ||
    value.length > 128
  ) {
    throw new Error("FINORA_USAGE_DIGEST_INVALID_" + name);
  }

  return value;
}

export function createFinoraUsageRecordDigest(
  record: FinoraUsageDigestRecord,
): string {
  if (!record || typeof record !== "object") {
    throw new Error("FINORA_USAGE_DIGEST_RECORD_REQUIRED");
  }

  const payload = {
    schema: "FINORA_USAGE_USB_RECORD_DIGEST_V1",
    id: required(record.id, "ID"),
    entity: required(record.entity, "ENTITY"),
    ownerId: required(record.ownerId, "OWNER"),
    businessId: required(record.businessId, "BUSINESS"),
    branchId: required(record.branchId, "BRANCH"),
    demoId: record.demoId ?? null,
    data: record.data,
  };

  return createHash("sha256")
    .update(canonicalJson(payload), "utf8")
    .digest("hex");
}