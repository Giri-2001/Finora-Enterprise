// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// PRIVILEGED CONTROL PACKAGE SIGNER
//
// RESPONSIBILITY:
//
// - Build cryptographically complete FINORA control packages
// - Calculate canonical payload SHA-256 digest
// - Attach trusted Control Center issuer identity
// - Sign unsigned package using encrypted private-key vault
// - Export PUBLIC trust metadata only
//
// IMPORTANT:
//
// - MAIN PROCESS ONLY.
// - No IPC is exposed here.
// - Private key never leaves this module boundary.
// - No renderer imports.
// - No branch operational storage mutation.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  canonicalizeFinoraControlCenterValue,
  createFinoraControlCenterPayloadDigest,
} from "./finoraControlCenterCanonicalization.js";

import {
  signFinoraControlCenterCanonicalValue,
} from "./finoraControlCenterCrypto.js";

import {
  getFinoraControlCenterPublicIdentity,
  loadOrCreateFinoraControlCenterKeyVault,
} from "./finoraControlCenterKeyVault.js";

// ============================================================
// PURPOSE
// ============================================================

export type FinoraControlCenterPackagePurpose =
  | "BRANCH_ACTIVATION"
  | "STORAGE_ENTITLEMENT"
  | "BUSINESS_PROFILE"
  | "PRICING_POLICY"
  | "WALLET_RECHARGE"
  | "CONTROL_BUNDLE";

// ============================================================
// TARGET
// ============================================================

export interface FinoraControlCenterPackageTarget {

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  installationId?:
    string;
}

// ============================================================
// VALIDITY
// ============================================================

export interface FinoraControlCenterPackageValidity {

  notBefore?:
    string;

  expiresAt?:
    string;
}

// ============================================================
// DRAFT
// ============================================================

export interface FinoraControlCenterPackageDraft<
  TPayload extends object,
> {

  packageId:
    string;

  purpose:
    FinoraControlCenterPackagePurpose;

  target:
    FinoraControlCenterPackageTarget;

  issuedAt:
    string;

  validity?:
    FinoraControlCenterPackageValidity;

  sequence:
    number;

  payloadVersion:
    number;

  payload:
    TPayload;

  schemaVersion:
    1;
}

// ============================================================
// SIGNED PACKAGE
// ============================================================

export interface FinoraControlCenterSignedPackage<
  TPayload extends object,
> extends
  FinoraControlCenterPackageDraft<TPayload> {

  issuer: {
    type:
      "FINORA_CONTROL_CENTER";

    issuerId:
      string;

    signingKeyId:
      string;
  };

  payloadDigest: {
    algorithm:
      "SHA-256";

    value:
      string;
  };

  signature: {
    algorithm:
      "ECDSA_P256_SHA256";

    encoding:
      "IEEE_P1363";

    canonicalization:
      "FINORA_CANONICAL_JSON_V1";

    signingKeyId:
      string;

    value:
      string;
  };
}

// ============================================================
// VALIDATION
// ============================================================

function validateDraft(
  draft:
    FinoraControlCenterPackageDraft<object>,
): void {

  if (
    !draft.packageId.trim() ||
    !draft.target.ownerId.trim() ||
    !draft.target.businessId.trim() ||
    !draft.target.branchId.trim()
  ) {
    throw new Error(
      "FINORA Control Package target identity is incomplete.",
    );
  }

  if (
    !Number.isSafeInteger(
      draft.sequence,
    ) ||
    draft.sequence <= 0
  ) {
    throw new Error(
      "FINORA Control Package sequence must be a positive safe integer.",
    );
  }

  if (
    !Number.isSafeInteger(
      draft.payloadVersion,
    ) ||
    draft.payloadVersion <= 0
  ) {
    throw new Error(
      "FINORA Control Package payloadVersion must be a positive safe integer.",
    );
  }

  if (
    !Number.isFinite(
      Date.parse(
        draft.issuedAt,
      ),
    )
  ) {
    throw new Error(
      "FINORA Control Package issuedAt timestamp is invalid.",
    );
  }
}

// ============================================================
// SIGN
// ============================================================

export async function signFinoraControlCenterPackage<
  TPayload extends object,
>(
  draft:
    FinoraControlCenterPackageDraft<TPayload>,
): Promise<
  FinoraControlCenterSignedPackage<TPayload>
> {

  validateDraft(
    draft as
      FinoraControlCenterPackageDraft<object>,
  );

  const vault =
    await loadOrCreateFinoraControlCenterKeyVault();

  const unsignedPackage = {
    ...draft,

    issuer: {
      type:
        "FINORA_CONTROL_CENTER" as const,

      issuerId:
        vault.issuerId,

      signingKeyId:
        vault.signingKeyId,
    },

    payloadDigest:
      createFinoraControlCenterPayloadDigest(
        draft.payload,
      ),
  };

  const canonicalPackage =
    canonicalizeFinoraControlCenterValue(
      unsignedPackage,
    );

  const signature =
    signFinoraControlCenterCanonicalValue(
      canonicalPackage,
      vault.privateKeyPkcs8DerBase64,
    );

  return {
    ...unsignedPackage,

    signature: {
      algorithm:
        "ECDSA_P256_SHA256",

      encoding:
        "IEEE_P1363",

      canonicalization:
        "FINORA_CANONICAL_JSON_V1",

      signingKeyId:
        vault.signingKeyId,

      value:
        signature,
    },
  };
}

// ============================================================
// PUBLIC TRUST RECORD
// ============================================================

export async function getFinoraControlCenterTrustRecord() {

  const identity =
    await getFinoraControlCenterPublicIdentity();

  return {
    issuerId:
      identity.issuerId,

    signingKeyId:
      identity.signingKeyId,

    algorithm:
      "ECDSA_P256_SHA256" as const,

    format:
      "SPKI_DER_BASE64" as const,

    publicKey:
      identity.publicKeySpkiDerBase64,

    status:
      "ACTIVE" as const,

    validFrom:
      identity.createdAt,

    createdAt:
      identity.createdAt,

    schemaVersion:
      1 as const,
  };
}

// ============================================================
// END
// ============================================================