// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// CONTROL BUNDLE PRE-SIGN ISSUANCE POLICY
//
// RESPONSIBILITY:
//
// - Validate one CONTROL_BUNDLE payload before signing
// - Enforce exact outer package target identity
// - Enforce canonical bundle issuance timestamp
// - Enforce FINORA_CONTROL_BUNDLE_V1 payload contract
// - Enforce supported signed child-package purposes
// - Enforce exact child target parity with outer target
// - Reject nested CONTROL_BUNDLE packages
// - Reject duplicate child package IDs
// - Reject duplicate child purposes
//
// IMPORTANT:
//
// - PURE DOMAIN POLICY.
// - No I/O.
// - No Electron APIs.
// - No recipient-state reads.
// - No cryptographic verification.
// - Child signature/trust/replay/sequence enforcement remains
//   authoritative at the recipient purpose-specific apply boundary.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// TARGET
// ============================================================

export interface FinoraControlBundleIssuanceTarget {

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
// SUPPORTED CHILD PURPOSE
// ============================================================

export type FinoraControlBundleChildPurpose =
  | "BRANCH_ACTIVATION"
  | "STORAGE_ENTITLEMENT"
  | "BUSINESS_PROFILE"
  | "PRICING_POLICY"
  | "WALLET_RECHARGE";

const FINORA_CONTROL_BUNDLE_CHILD_PURPOSES:
  readonly FinoraControlBundleChildPurpose[] = [
    "BRANCH_ACTIVATION",
    "STORAGE_ENTITLEMENT",
    "BUSINESS_PROFILE",
    "PRICING_POLICY",
    "WALLET_RECHARGE",
  ];

// ============================================================
// RESULT
// ============================================================

export interface FinoraControlBundleIssuanceAccepted {

  valid:
    true;

  payload:
    Record<string, unknown>;
}

export interface FinoraControlBundleIssuanceRejected {

  valid:
    false;

  error:
    string;
}

export type FinoraControlBundleIssuancePolicyResult =
  | FinoraControlBundleIssuanceAccepted
  | FinoraControlBundleIssuanceRejected;

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
  bindingKeyId:
    unknown,

  fingerprintAlgorithm:
    unknown,

  publicKeyFingerprint:
    unknown,
): boolean {

  if (
    !isNonEmptyString(
      bindingKeyId,
    ) ||
    fingerprintAlgorithm !==
      "SHA-256" ||
    !isSha256Fingerprint(
      publicKeyFingerprint,
    )
  ) {
    return false;
  }

  const expectedBindingKeyId =
    `FINORA-BINDING-${publicKeyFingerprint
      .slice(
        0,
        32,
      )
      .toUpperCase()}`;

  return (
    bindingKeyId ===
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
      value as FinoraControlBundleChildPurpose,
    )
  );
}

function targetMatches(
  value:
    unknown,

  target:
    FinoraControlBundleIssuanceTarget,
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
): value is Record<string, unknown> {

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

function accepted(
  payload:
    Record<string, unknown>,
): FinoraControlBundleIssuanceAccepted {

  return {
    valid:
      true,

    payload,
  };
}

function rejected(
  error:
    string,
): FinoraControlBundleIssuanceRejected {

  return {
    valid:
      false,

    error,
  };
}

// ============================================================
// VALIDATE
// ============================================================

export function validateFinoraControlBundleIssuance(
  payload:
    unknown,

  target:
    FinoraControlBundleIssuanceTarget,
): FinoraControlBundleIssuancePolicyResult {

  // ----------------------------------------------------------
  // OUTER TARGET
  // ----------------------------------------------------------

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
    )
  ) {
    return rejected(
      "FINORA Control Bundle issuance target is incomplete.",
    );
  }

  if (
    !isValidBindingIdentity(
      target.bindingKeyId,
      target.fingerprintAlgorithm,
      target.publicKeyFingerprint,
    )
  ) {
    return rejected(
      "FINORA Control Bundle issuance target installation binding is invalid.",
    );
  }

  // ----------------------------------------------------------
  // PAYLOAD ROOT
  // ----------------------------------------------------------

  if (!isRecord(payload)) {
    return rejected(
      "FINORA CONTROL_BUNDLE payload is invalid.",
    );
  }

  if (
    payload.schemaVersion !==
      1
  ) {
    return rejected(
      "FINORA CONTROL_BUNDLE payload schema is unsupported.",
    );
  }

  if (
    payload.bundleFormat !==
      "FINORA_CONTROL_BUNDLE_V1"
  ) {
    return rejected(
      "FINORA CONTROL_BUNDLE format is unsupported.",
    );
  }

  if (
    !isCanonicalTimestamp(
      payload.issuedAt,
    )
  ) {
    return rejected(
      "FINORA CONTROL_BUNDLE issuedAt must be a canonical ISO timestamp.",
    );
  }

  if (
    !Array.isArray(
      payload.packages,
    ) ||
    payload.packages.length <
      1
  ) {
    return rejected(
      "FINORA CONTROL_BUNDLE must contain at least one signed child package.",
    );
  }

  if (
    payload.packages.length >
      FINORA_CONTROL_BUNDLE_CHILD_PURPOSES.length
  ) {
    return rejected(
      "FINORA CONTROL_BUNDLE contains more child packages than supported purposes.",
    );
  }

  // ----------------------------------------------------------
  // CHILD PACKAGE CONTRACT
  // ----------------------------------------------------------

  const packageIds =
    new Set<string>();

  const purposes =
    new Set<FinoraControlBundleChildPurpose>();

  for (
    const childPackage of
      payload.packages
  ) {
    if (
      !isStructurallySignedChildPackage(
        childPackage,
      )
    ) {
      return rejected(
        "FINORA CONTROL_BUNDLE contains an invalid signed child package.",
      );
    }

    if (
      childPackage.purpose ===
        "CONTROL_BUNDLE"
    ) {
      return rejected(
        "Nested FINORA CONTROL_BUNDLE packages are not supported.",
      );
    }

    if (
      !isSupportedChildPurpose(
        childPackage.purpose,
      )
    ) {
      return rejected(
        "FINORA CONTROL_BUNDLE contains an unsupported child package purpose.",
      );
    }

    if (
      !targetMatches(
        childPackage.target,
        target,
      )
    ) {
      return rejected(
        "FINORA CONTROL_BUNDLE child package target does not match the outer package target.",
      );
    }

    const packageId =
      childPackage.packageId as string;

    if (
      packageIds.has(
        packageId,
      )
    ) {
      return rejected(
        "FINORA CONTROL_BUNDLE contains a duplicate child package ID.",
      );
    }

    packageIds.add(
      packageId,
    );

    const purpose =
      childPackage.purpose as
        FinoraControlBundleChildPurpose;

    if (
      purposes.has(
        purpose,
      )
    ) {
      return rejected(
        "FINORA CONTROL_BUNDLE v1 allows only one child package per purpose.",
      );
    }

    purposes.add(
      purpose,
    );
  }

  return accepted(
    payload,
  );
}

// ============================================================
// END
// ============================================================