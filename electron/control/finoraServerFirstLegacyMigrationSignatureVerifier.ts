import {
  createHash,
  createPublicKey,
  verify as nodeVerify,
} from "node:crypto";

import {
  validateFinoraLegacyMigrationAuthorizationShape,
} from "./finoraServerFirstLegacyMigrationAuthorization.js";

/**
 * FINORA_P1_675O_MIGRATION_SIGNATURE_VERIFIER
 *
 * Migration authorization must be signed by the same pinned
 * FINORA server authority as the server-first bootstrap.
 *
 * This module requires the caller to supply independently
 * pinned public-key trust material.
 *
 * It does NOT accept trust material from the signed message.
 */

export interface FinoraPinnedMigrationSigningAuthority {
  publicKeySpkiBase64: string;
  signingKeyId: string;
  publicKeyFingerprint: string;
  issuerId: string;
}

export interface FinoraSignedMigrationAuthorization {
  schemaVersion: 1;
  payload: unknown;
  issuer: {
    issuerId: string;
    signingKeyId: string;
  };
  signature: {
    algorithm: string;
    encoding: "BASE64";
    value: string;
  };
  publicAuthority: unknown;
}

function canonicalize(value: unknown): string {
  if (
    value === null ||
    typeof value !== "object"
  ) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return "[" +
      value.map(canonicalize).join(",") +
      "]";
  }

  const object =
    value as Record<string, unknown>;

  return "{" +
    Object.keys(object)
      .sort()
      .map(
        (key) =>
          JSON.stringify(key) +
          ":" +
          canonicalize(object[key]),
      )
      .join(",") +
    "}";
}

export function verifyFinoraLegacyMigrationSignature(
  signed: FinoraSignedMigrationAuthorization,
  pinned: FinoraPinnedMigrationSigningAuthority,
  now: Date = new Date(),
): boolean {
  try {
    if (
      signed.schemaVersion !== 1 ||
      !validateFinoraLegacyMigrationAuthorizationShape(
        signed.payload,
      ) ||
      signed.issuer.issuerId !== pinned.issuerId ||
      signed.issuer.signingKeyId !== pinned.signingKeyId ||
      signed.signature.encoding !== "BASE64"
    ) {
      return false;
    }

    if (
      signed.signature.algorithm !== "ECDSA_P256_SHA256"
    ) {
      return false;
    }

    const payload = signed.payload;

    if (
      now.getTime() <
        Date.parse(payload.issuedAt) ||
      now.getTime() >=
        Date.parse(payload.expiresAt)
    ) {
      return false;
    }

    const spki =
      Buffer.from(
        pinned.publicKeySpkiBase64,
        "base64",
      );

    const fingerprint =
      createHash("sha256")
        .update(spki)
        .digest("hex");

    if (
      fingerprint.toLowerCase() !==
      pinned.publicKeyFingerprint.toLowerCase()
    ) {
      return false;
    }

    const key =
      createPublicKey({
        key: spki,
        format: "der",
        type: "spki",
      });

    const signature =
      Buffer.from(
        signed.signature.value,
        "base64",
      );

    if (signature.length !== 64) {
      return false;
    }

    return nodeVerify(
      "sha256",
      Buffer.from(
        canonicalize(payload),
        "utf8",
      ),
      {
        key,
        dsaEncoding: "ieee-p1363",
      },
      signature,
    );
  }
  catch {
    return false;
  }
}

// FINORA_P1_676A_PRODUCTION_PIN
// This entry point accepts no caller-controlled trust anchor.
// The public key in the signed envelope is permitted only when
// it matches the independently pinned production fingerprint.
import {
  FINORA_SERVER_FIRST_LOGIN_ISSUER_ID,
  FINORA_SERVER_FIRST_LOGIN_PINNED_SIGNING_KEY_ID,
  FINORA_SERVER_FIRST_LOGIN_PINNED_PUBLIC_KEY_FINGERPRINT,
} from "./finoraServerFirstLoginBootstrapVerifier.js";

export function verifyFinoraProductionLegacyMigrationSignature(
  candidate: unknown,
  now: Date = new Date(),
): boolean {
  try {
    if (
      candidate === null ||
      typeof candidate !== "object" ||
      Array.isArray(candidate)
    ) {
      return false;
    }

    const signed = candidate as Record<string, unknown>;

    if (
      signed.publicAuthority === null ||
      typeof signed.publicAuthority !== "object" ||
      Array.isArray(signed.publicAuthority)
    ) {
      return false;
    }

    const authority = signed.publicAuthority as Record<string, unknown>;

    if (
      authority.issuerId !== FINORA_SERVER_FIRST_LOGIN_ISSUER_ID ||
      authority.signingKeyId !== FINORA_SERVER_FIRST_LOGIN_PINNED_SIGNING_KEY_ID ||
      authority.publicKeyFingerprint !==
        FINORA_SERVER_FIRST_LOGIN_PINNED_PUBLIC_KEY_FINGERPRINT ||
      authority.algorithm !== "ECDSA_P256_SHA256" ||
      authority.format !== "SPKI_DER_BASE64" ||
      typeof authority.publicKey !== "string"
    ) {
      return false;
    }

    const encoded = authority.publicKey;

    if (
      encoded.length === 0 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)
    ) {
      return false;
    }

    const keyBytes = Buffer.from(encoded, "base64");

    if (
      keyBytes.length === 0 ||
      keyBytes.toString("base64") !== encoded
    ) {
      return false;
    }

    const fingerprint = createHash("sha256")
      .update(keyBytes)
      .digest("hex");

    if (
      fingerprint !==
      FINORA_SERVER_FIRST_LOGIN_PINNED_PUBLIC_KEY_FINGERPRINT
    ) {
      return false;
    }

    const signingKeyId =
      "FINORA-BOOTSTRAP-" +
      fingerprint.slice(0, 32).toUpperCase();

    if (
      signingKeyId !== FINORA_SERVER_FIRST_LOGIN_PINNED_SIGNING_KEY_ID
    ) {
      return false;
    }

    const parsed = createPublicKey({
      key: keyBytes,
      format: "der",
      type: "spki",
    });

    if (
      parsed.asymmetricKeyType !== "ec" ||
      parsed.asymmetricKeyDetails?.namedCurve !== "prime256v1"
    ) {
      return false;
    }

    return verifyFinoraLegacyMigrationSignature(
      candidate as unknown as FinoraSignedMigrationAuthorization,
      {
        issuerId: FINORA_SERVER_FIRST_LOGIN_ISSUER_ID,
        signingKeyId: FINORA_SERVER_FIRST_LOGIN_PINNED_SIGNING_KEY_ID,
        publicKeyFingerprint:
          FINORA_SERVER_FIRST_LOGIN_PINNED_PUBLIC_KEY_FINGERPRINT,
        publicKeySpkiBase64: encoded,
      },
      now,
    );
  } catch {
    return false;
  }
}

// FINORA_P1_676B_MIGRATION_PROOF_BINDING
// Bind the verified server signature to the exact migration
// requested by the authenticated enrollment flow.
// Never derive "expected" from the untrusted signed envelope.

export interface FinoraExpectedLegacyMigrationScope {
  oldSourceAuthorizationId: string;
  newSourceAuthorizationId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
  userId: string;
  canonicalUsername: string;
  authGeneration: number;
}

export function verifyFinoraLegacyMigrationForEnrollment(
  candidate: unknown,
  expected: FinoraExpectedLegacyMigrationScope,
  now: Date = new Date(),
): boolean {
  if (
    !expected ||
    !verifyFinoraProductionLegacyMigrationSignature(
      candidate,
      now,
    )
  ) {
    return false;
  }

  try {
    const signed =
      candidate as Record<string, unknown>;

    const payload =
      signed.payload as Record<string, unknown>;

    const fields: Array<
      keyof FinoraExpectedLegacyMigrationScope
    > = [
      "oldSourceAuthorizationId",
      "newSourceAuthorizationId",
      "ownerId",
      "businessId",
      "branchId",
      "userId",
      "canonicalUsername",
      "authGeneration",
    ];

    for (const field of fields) {
      if (
        payload[field] !== expected[field]
      ) {
        return false;
      }
    }

    if (
      expected.oldSourceAuthorizationId.trim() === "" ||
      expected.newSourceAuthorizationId.trim() === "" ||
      expected.ownerId.trim() === "" ||
      expected.businessId.trim() === "" ||
      expected.branchId.trim() === "" ||
      expected.userId.trim() === "" ||
      expected.canonicalUsername.trim() === "" ||
      !Number.isSafeInteger(expected.authGeneration) ||
      expected.authGeneration <= 0
    ) {
      return false;
    }

    return (
      payload.schemaVersion === 1 &&
      payload.purpose ===
        "FINORA_LEGACY_TO_SERVER_FIRST_MIGRATION" &&
      payload.storageMode === "USB"
    );
  } catch {
    return false;
  }
}