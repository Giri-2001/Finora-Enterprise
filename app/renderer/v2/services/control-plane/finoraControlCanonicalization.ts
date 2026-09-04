// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL PLANE
// CANONICALIZATION + PAYLOAD DIGEST
//
// RESPONSIBILITY:
//
// - Produce deterministic FINORA canonical JSON
// - Sort object keys lexicographically
// - Reject unsafe / ambiguous JavaScript values
// - Generate SHA-256 payload digests
// - Provide canonical unsigned-package bytes for signing
//
// IMPORTANT:
//
// - No private keys.
// - No signing.
// - No signature verification.
// - No filesystem.
// - No Electron IPC.
// - No Android plugin access.
// - No storage mutation.
// - No activation mutation.
// - No wallet mutation.
//
// SECURITY:
//
// Normal JSON.stringify() MUST NOT be used directly as the
// cryptographic signing representation.
//
// FINORA_CANONICAL_JSON_V1 guarantees that the same logical
// package produces the same canonical UTF-8 byte sequence on
// Electron and Android.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  FinoraControlPayloadDigest,
  FinoraUnsignedControlPackage,
} from "../../types/control-plane/finoraControlPackage.types";

// ============================================================
// CONSTANTS
// ============================================================

const SHA_256 =
  "SHA-256" as const;

// ============================================================
// INTERNAL HELPERS
// ============================================================

function isPlainObject(
  value: object,
): boolean {

  const prototype =
    Object.getPrototypeOf(
      value,
    );

  return (
    prototype ===
      Object.prototype ||
    prototype ===
      null
  );
}

function canonicalizeNumber(
  value: number,
): string {

  if (!Number.isFinite(value)) {
    throw new Error(
      "FINORA canonical JSON does not allow NaN or infinite numbers.",
    );
  }

  /**
   * JSON canonicalization must normalize negative zero.
   */
  if (Object.is(value, -0)) {
    return "0";
  }

  return JSON.stringify(value);
}

function canonicalizeString(
  value: string,
): string {

  return JSON.stringify(value);
}

function canonicalizeValue(
  value: unknown,
  ancestors: Set<object>,
): string {

  if (value === null) {
    return "null";
  }


  switch (typeof value) {

    case "string":
      return canonicalizeString(
        value,
      );


    case "boolean":
      return value
        ? "true"
        : "false";


    case "number":
      return canonicalizeNumber(
        value,
      );


    case "undefined":
      throw new Error(
        "FINORA canonical JSON does not allow undefined values.",
      );


    case "bigint":
      throw new Error(
        "FINORA canonical JSON does not allow bigint values.",
      );


    case "function":
      throw new Error(
        "FINORA canonical JSON does not allow function values.",
      );


    case "symbol":
      throw new Error(
        "FINORA canonical JSON does not allow symbol values.",
      );


    case "object":
      break;


    default:
      throw new Error(
        "FINORA canonical JSON encountered an unsupported value.",
      );
  }


  const objectValue =
    value as object;


  if (ancestors.has(objectValue)) {
    throw new Error(
      "FINORA canonical JSON does not allow cyclic object graphs.",
    );
  }


  ancestors.add(
    objectValue,
  );


  try {

    if (Array.isArray(value)) {

      const items =
        value.map(
          (item) =>
            canonicalizeValue(
              item,
              ancestors,
            ),
        );

      return `[${items.join(",")}]`;
    }


    if (!isPlainObject(objectValue)) {
      throw new Error(
        "FINORA canonical JSON accepts only plain objects and arrays.",
      );
    }


    const record =
      value as Record<
        string,
        unknown
      >;


    const keys =
      Object.keys(record)
        .sort();


    const members =
      keys.map(
        (key) => {

          const canonicalKey =
            canonicalizeString(
              key,
            );

          const canonicalValue =
            canonicalizeValue(
              record[key],
              ancestors,
            );

          return `${canonicalKey}:${canonicalValue}`;
        },
      );


    return `{${members.join(",")}}`;

  } finally {

    ancestors.delete(
      objectValue,
    );
  }
}

// ============================================================
// PUBLIC CANONICAL JSON
// ============================================================

/**
 * Convert a FINORA cryptographic value to deterministic
 * FINORA_CANONICAL_JSON_V1 text.
 *
 * Supported:
 *
 * - null
 * - string
 * - boolean
 * - finite number
 * - arrays
 * - plain objects
 *
 * Rejected:
 *
 * - undefined
 * - bigint
 * - function
 * - symbol
 * - NaN / Infinity
 * - Date / Map / Set / class instances
 * - cyclic object graphs
 */
export function canonicalizeFinoraControlValue(
  value: unknown,
): string {

  return canonicalizeValue(
    value,
    new Set<object>(),
  );
}

// ============================================================
// UTF-8
// ============================================================

export function encodeFinoraCanonicalUtf8(
  canonicalValue: string,
): Uint8Array {

  return new TextEncoder()
    .encode(
      canonicalValue,
    );
}

// ============================================================
// SHA-256
// ============================================================

function bytesToLowerHex(
  bytes: Uint8Array,
): string {

  return Array.from(
    bytes,
  )
    .map(
      (byte) =>
        byte
          .toString(16)
          .padStart(
            2,
            "0",
          ),
    )
    .join("");
}

/**
 * Generate a lowercase hexadecimal SHA-256 digest from bytes.
 */
export async function sha256FinoraBytes(
  bytes: Uint8Array,
): Promise<string> {

  if (
    !globalThis.crypto?.subtle
  ) {
    throw new Error(
      "FINORA secure SHA-256 runtime is unavailable.",
    );
  }


  const source =
    new Uint8Array(
      bytes,
    );


  const digest =
    await globalThis.crypto.subtle.digest(
      SHA_256,
      source,
    );


  return bytesToLowerHex(
    new Uint8Array(
      digest,
    ),
  );
}

// ============================================================
// PAYLOAD DIGEST
// ============================================================

/**
 * Generate the canonical FINORA SHA-256 digest for one
 * domain-specific Control Package payload.
 */
export async function createFinoraControlPayloadDigest(
  payload: object,
): Promise<
  FinoraControlPayloadDigest
> {

  const canonicalPayload =
    canonicalizeFinoraControlValue(
      payload,
    );


  const digest =
    await sha256FinoraBytes(
      encodeFinoraCanonicalUtf8(
        canonicalPayload,
      ),
    );


  return {
    algorithm:
      SHA_256,

    value:
      digest,
  };
}

// ============================================================
// UNSIGNED PACKAGE CANONICALIZATION
// ============================================================

/**
 * Produce the exact canonical representation that the
 * privileged FINORA Control Center signing boundary signs.
 *
 * The signature field cannot exist here by type contract.
 */
export function canonicalizeFinoraUnsignedControlPackage<
  TPayload extends object,
>(
  controlPackage:
    FinoraUnsignedControlPackage<TPayload>,
): string {

  return canonicalizeFinoraControlValue(
    controlPackage,
  );
}

// ============================================================
// END
// ============================================================