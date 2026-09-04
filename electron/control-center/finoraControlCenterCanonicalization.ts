// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// NODE CANONICALIZATION + SHA-256
//
// RESPONSIBILITY:
//
// - Produce FINORA_CANONICAL_JSON_V1 inside Electron main
// - Match the Branch Client canonicalization contract
// - Produce lowercase hexadecimal SHA-256 digests
//
// IMPORTANT:
//
// - MAIN / PRIVILEGED RUNTIME FOUNDATION.
// - No private keys.
// - No Electron IPC.
// - No renderer imports.
// - No persistence.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  createHash,
} from "node:crypto";

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
// PUBLIC CANONICALIZATION
// ============================================================

export function canonicalizeFinoraControlCenterValue(
  value: unknown,
): string {

  return canonicalizeValue(
    value,
    new Set<object>(),
  );
}

// ============================================================
// SHA-256
// ============================================================

export function createFinoraControlCenterSha256(
  value:
    string | Buffer,
): string {

  return createHash(
    "sha256",
  )
    .update(
      value,
    )
    .digest(
      "hex",
    );
}

// ============================================================
// PAYLOAD DIGEST
// ============================================================

export function createFinoraControlCenterPayloadDigest(
  payload: object,
): {
  algorithm: "SHA-256";
  value: string;
} {

  const canonicalPayload =
    canonicalizeFinoraControlCenterValue(
      payload,
    );

  return {
    algorithm:
      "SHA-256",

    value:
      createFinoraControlCenterSha256(
        canonicalPayload,
      ),
  };
}

// ============================================================
// END
// ============================================================