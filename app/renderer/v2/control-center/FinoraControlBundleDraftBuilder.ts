// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// CONTROL BUNDLE RENDERER DRAFT BUILDER
//
// RESPONSIBILITY:
//
// - Compose already-signed child Control Packages
// - Preserve each signed child package unchanged
// - Enforce CONTROL_BUNDLE v1 composition invariants early
// - Produce only target + unsigned bundle payload draft
//
// IMPORTANT:
//
// - PURE RENDERER DOMAIN BUILDER.
// - No IPC.
// - No filesystem.
// - No signing.
// - No private keys.
// - No packageId authority.
// - No sequence authority.
// - No root issuedAt authority.
// - No packageValidity authority.
// - Main-process issuance policy remains authoritative.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// FORMAT
// ============================================================

export const FINORA_CONTROL_BUNDLE_FORMAT =
  "FINORA_CONTROL_BUNDLE_V1" as const;

export const FINORA_CONTROL_BUNDLE_CHILD_PURPOSES =
  [
    "BRANCH_ACTIVATION",
    "STORAGE_ENTITLEMENT",
    "BUSINESS_PROFILE",
    "PRICING_POLICY",
    "WALLET_RECHARGE",
  ] as const;

export type FinoraControlBundleChildPurpose =
  (
    typeof FINORA_CONTROL_BUNDLE_CHILD_PURPOSES
  )[number];

// ============================================================
// TARGET
// ============================================================

export interface FinoraControlBundleDraftTarget {

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    "SHA-256";

  publicKeyFingerprint:
    string;
}

// ============================================================
// SIGNED CHILD STRUCTURE
// ============================================================

export interface FinoraControlBundleSignedChildPackage
  extends Record<string, unknown> {

  packageId:
    string;

  purpose:
    string;

  issuer:
    Record<string, unknown>;

  target:
    Record<string, unknown>;

  issuedAt:
    string;

  sequence:
    number;

  payloadVersion:
    number;

  payload:
    Record<string, unknown>;

  payloadDigest:
    Record<string, unknown>;

  signature:
    Record<string, unknown>;

  schemaVersion:
    1;
}

// ============================================================
// INPUT / RESULT
// ============================================================

export interface BuildFinoraControlBundleDraftInput {

  target:
    FinoraControlBundleDraftTarget;

  packages:
    readonly unknown[];
}

export interface FinoraControlBundleIssuanceRequestDraft {

  target:
    FinoraControlBundleDraftTarget;

  payload:
    Record<string, unknown>;
}

// ============================================================
// HELPERS
// ============================================================

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {

  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

function isNonEmptyString(
  value:
    unknown,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function isCanonicalTimestamp(
  value:
    unknown,
): value is string {

  if (!isNonEmptyString(value)) {
    return false;
  }

  const parsed =
    Date.parse(
      value,
    );

  return (
    Number.isFinite(
      parsed,
    ) &&
    new Date(
      parsed,
    ).toISOString() ===
      value
  );
}

function isSha256Fingerprint(
  value:
    unknown,
): value is string {

  return (
    typeof value ===
      "string" &&
    /^[0-9a-f]{64}$/.test(
      value,
    )
  );
}

function isValidBindingIdentity(
  target:
    FinoraControlBundleDraftTarget,
): boolean {

  if (
    !isSha256Fingerprint(
      target.publicKeyFingerprint,
    )
  ) {
    return false;
  }

  const expectedBindingKeyId =
    `FINORA-BINDING-${target.publicKeyFingerprint
      .slice(
        0,
        32,
      )
      .toUpperCase()}`;

  return (
    target.bindingKeyId ===
      expectedBindingKeyId
  );
}

function isSupportedChildPurpose(
  value:
    unknown,
): value is FinoraControlBundleChildPurpose {

  return (
    typeof value ===
      "string" &&
    FINORA_CONTROL_BUNDLE_CHILD_PURPOSES.includes(
      value as
        FinoraControlBundleChildPurpose,
    )
  );
}

function targetMatches(
  value:
    unknown,
  target:
    FinoraControlBundleDraftTarget,
): boolean {

  if (!isRecord(value)) {
    return false;
  }

  return (
    value.ownerId ===
      target.ownerId &&
    value.businessId ===
      target.businessId &&
    value.branchId ===
      target.branchId &&
    value.installationId ===
      target.installationId &&
    value.bindingKeyId ===
      target.bindingKeyId &&
    value.fingerprintAlgorithm ===
      target.fingerprintAlgorithm &&
    value.publicKeyFingerprint ===
      target.publicKeyFingerprint
  );
}

function isStructurallySignedChildPackage(
  value:
    unknown,
): value is FinoraControlBundleSignedChildPackage {

  if (!isRecord(value)) {
    return false;
  }

  if (
    value.schemaVersion !==
      1 ||
    !isNonEmptyString(
      value.packageId,
    ) ||
    !isNonEmptyString(
      value.purpose,
    ) ||
    !isRecord(
      value.issuer,
    ) ||
    !isRecord(
      value.target,
    ) ||
    !isCanonicalTimestamp(
      value.issuedAt,
    ) ||
    !Number.isSafeInteger(
      value.sequence,
    ) ||
    (
      value.sequence as number
    ) <=
      0 ||
    !Number.isSafeInteger(
      value.payloadVersion,
    ) ||
    (
      value.payloadVersion as number
    ) <=
      0 ||
    !isRecord(
      value.payload,
    ) ||
    !isRecord(
      value.payloadDigest,
    ) ||
    !isRecord(
      value.signature,
    )
  ) {
    return false;
  }

  const issuer =
    value.issuer;

  const payloadDigest =
    value.payloadDigest;

  const signature =
    value.signature;

  if (
    issuer.type !==
      "FINORA_CONTROL_CENTER" ||
    !isNonEmptyString(
      issuer.issuerId,
    ) ||
    !isNonEmptyString(
      issuer.signingKeyId,
    ) ||
    payloadDigest.algorithm !==
      "SHA-256" ||
    typeof payloadDigest.value !==
      "string" ||
    !/^[0-9a-f]{64}$/.test(
      payloadDigest.value,
    ) ||
    signature.algorithm !==
      "ECDSA_P256_SHA256" ||
    signature.encoding !==
      "IEEE_P1363" ||
    signature.canonicalization !==
      "FINORA_CANONICAL_JSON_V1" ||
    !isNonEmptyString(
      signature.signingKeyId,
    ) ||
    !isNonEmptyString(
      signature.value,
    ) ||
    issuer.signingKeyId !==
      signature.signingKeyId
  ) {
    return false;
  }

  return true;
}

// ============================================================
// BUILD
// ============================================================

export function buildFinoraControlBundleIssuanceRequest(
  input:
    BuildFinoraControlBundleDraftInput,
): FinoraControlBundleIssuanceRequestDraft {

  const target =
    input.target;

  if (
    !isNonEmptyString(
      target.ownerId,
    ) ||
    !isNonEmptyString(
      target.businessId,
    ) ||
    !isNonEmptyString(
      target.branchId,
    ) ||
    !isNonEmptyString(
      target.installationId,
    ) ||
    target.fingerprintAlgorithm !==
      "SHA-256" ||
    !isValidBindingIdentity(
      target,
    )
  ) {
    throw new Error(
      "A valid FINORA Control Bundle target and native binding identity are required.",
    );
  }

  if (
    !Array.isArray(
      input.packages,
    ) ||
    input.packages.length <
      1
  ) {
    throw new Error(
      "FINORA CONTROL_BUNDLE must contain at least one signed child package.",
    );
  }

  if (
    input.packages.length >
      FINORA_CONTROL_BUNDLE_CHILD_PURPOSES.length
  ) {
    throw new Error(
      "FINORA CONTROL_BUNDLE v1 supports at most five signed child packages.",
    );
  }

  const packageIds =
    new Set<string>();

  const purposes =
    new Set<
      FinoraControlBundleChildPurpose
    >();

  const signedChildren:
    FinoraControlBundleSignedChildPackage[] =
      [];

  for (
    const candidate of
      input.packages
  ) {

    if (
      !isStructurallySignedChildPackage(
        candidate,
      )
    ) {
      throw new Error(
        "FINORA CONTROL_BUNDLE contains an invalid signed child package.",
      );
    }

    if (
      candidate.purpose ===
        "CONTROL_BUNDLE"
    ) {
      throw new Error(
        "Nested FINORA CONTROL_BUNDLE packages are not supported.",
      );
    }

    if (
      !isSupportedChildPurpose(
        candidate.purpose,
      )
    ) {
      throw new Error(
        "FINORA CONTROL_BUNDLE contains an unsupported child package purpose.",
      );
    }

    if (
      !targetMatches(
        candidate.target,
        target,
      )
    ) {
      throw new Error(
        "FINORA CONTROL_BUNDLE child package target does not match the outer package target.",
      );
    }

    if (
      packageIds.has(
        candidate.packageId,
      )
    ) {
      throw new Error(
        "FINORA CONTROL_BUNDLE contains a duplicate child package ID.",
      );
    }

    if (
      purposes.has(
        candidate.purpose,
      )
    ) {
      throw new Error(
        "FINORA CONTROL_BUNDLE v1 allows only one child package per purpose.",
      );
    }

    packageIds.add(
      candidate.packageId,
    );

    purposes.add(
      candidate.purpose,
    );

    /*
     * Preserve the already-signed child object unchanged.
     *
     * The outer package signature later protects bundle
     * composition/order/content. Child signatures remain
     * independently verified by the recipient apply boundary.
     */
    signedChildren.push(
      candidate,
    );
  }

  return {
    target: {
      ownerId:
        target.ownerId,

      businessId:
        target.businessId,

      branchId:
        target.branchId,

      installationId:
        target.installationId,

      bindingKeyId:
        target.bindingKeyId,

      fingerprintAlgorithm:
        target.fingerprintAlgorithm,

      publicKeyFingerprint:
        target.publicKeyFingerprint,
    },

    payload: {
      bundleFormat:
        FINORA_CONTROL_BUNDLE_FORMAT,

      packages:
        signedChildren,

      schemaVersion:
        1,

      /*
       * issuedAt intentionally absent.
       *
       * The privileged main-process coordinator injects the
       * authoritative root payload.issuedAt from its persisted
       * CONTROL_BUNDLE issuance reservation.
       */
    },
  };
}

// ============================================================
// END
// ============================================================