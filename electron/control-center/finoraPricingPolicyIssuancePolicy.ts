// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// PRICING POLICY ISSUANCE POLICY
//
// RESPONSIBILITY:
//
// - Revalidate PRICING_POLICY payload before signing
// - Require REPLACE-only Pricing Policy issuance
// - Require exact Owner / Business / Branch target scope
// - Require exact native installation binding identity
// - Validate FINORA-controlled Pricing Override rules
// - Reject duplicate Override IDs
// - Reject overlapping validity windows
// - Require canonical signed timestamps
//
// SECURITY:
//
// Renderer/domain validation is NOT sufficient authority.
//
// The privileged Control Center signing boundary MUST validate
// the payload independently before applying the private key.
//
// IMPORTANT:
//
// - PURE NODE/DOMAIN POLICY.
// - No Electron IPC.
// - No private keys.
// - No signing.
// - No filesystem.
// - No safeStorage.
// - No Business Date.
// - No operational pricing state mutation.
// - Recipient-side lineage/current-state authority remains
//   inside the serialized Control Store apply boundary.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// TARGET
// ============================================================

export interface FinoraPricingPolicyIssuanceTarget {

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
// RESULT
// ============================================================

export interface FinoraPricingPolicyIssuanceAccepted {

  valid:
    true;

  payload:
    Record<string, unknown>;
}

export interface FinoraPricingPolicyIssuanceRejected {

  valid:
    false;

  error:
    string;
}

export type FinoraPricingPolicyIssuancePolicyResult =
  | FinoraPricingPolicyIssuanceAccepted
  | FinoraPricingPolicyIssuanceRejected;

// ============================================================
// INTERNAL RULE
// ============================================================

interface FinoraPricingPolicyIssuanceOverrideRule {

  overrideId:
    string;

  chargeCode:
    "LOAN_DISBURSEMENT";

  model:
    "FIXED_PRICE_OVERRIDE";

  amount:
    number;

  currency:
    "INR";

  validity: {
    validFrom:
      string;

    validUntil:
      string;
  };

  schemaVersion:
    1;
}

// ============================================================
// HELPERS
// ============================================================

function accepted(
  payload:
    Record<string, unknown>,
): FinoraPricingPolicyIssuanceAccepted {

  return {
    valid:
      true,

    payload,
  };
}

function rejected(
  error:
    string,
): FinoraPricingPolicyIssuanceRejected {

  return {
    valid:
      false,

    error,
  };
}

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

function parseCanonicalTimestamp(
  value:
    unknown,
): number | undefined {

  if (!isNonEmptyString(value)) {
    return undefined;
  }

  const parsed =
    Date.parse(
      value,
    );

  if (
    !Number.isFinite(
      parsed,
    )
  ) {
    return undefined;
  }

  if (
    new Date(
      parsed,
    ).toISOString() !==
      value
  ) {
    return undefined;
  }

  return parsed;
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
    typeof publicKeyFingerprint !==
      "string" ||
    !/^[0-9a-f]{64}$/.test(
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

function isPricingOverrideRule(
  value:
    unknown,
): value is FinoraPricingPolicyIssuanceOverrideRule {

  if (!isRecord(value)) {
    return false;
  }

  if (
    !isRecord(
      value.validity,
    )
  ) {
    return false;
  }

  const validity =
    value.validity;

  const validFrom =
    parseCanonicalTimestamp(
      validity.validFrom,
    );

  const validUntil =
    parseCanonicalTimestamp(
      validity.validUntil,
    );

  return (
    isNonEmptyString(
      value.overrideId,
    ) &&
    value.chargeCode ===
      "LOAN_DISBURSEMENT" &&
    value.model ===
      "FIXED_PRICE_OVERRIDE" &&
    typeof value.amount ===
      "number" &&
    Number.isFinite(
      value.amount,
    ) &&
    value.amount >
      0 &&
    value.currency ===
      "INR" &&
    validFrom !==
      undefined &&
    validUntil !==
      undefined &&
    validUntil >
      validFrom &&
    value.schemaVersion ===
      1
  );
}

// ============================================================
// VALIDATE
// ============================================================

export function validateFinoraPricingPolicyIssuance(
  payload:
    unknown,

  target:
    FinoraPricingPolicyIssuanceTarget,
): FinoraPricingPolicyIssuancePolicyResult {

  // ----------------------------------------------------------
  // TARGET
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
      "FINORA Pricing Policy issuance target is incomplete.",
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
      "FINORA Pricing Policy issuance target installation binding is invalid.",
    );
  }

  // ----------------------------------------------------------
  // PAYLOAD ROOT
  // ----------------------------------------------------------

  if (!isRecord(payload)) {
    return rejected(
      "FINORA PRICING_POLICY payload is invalid.",
    );
  }

  if (
    payload.schemaVersion !==
      1
  ) {
    return rejected(
      "FINORA PRICING_POLICY payload schema is unsupported.",
    );
  }

  if (
    payload.action !==
      "REPLACE"
  ) {
    return rejected(
      "FINORA PRICING_POLICY action must be REPLACE.",
    );
  }

  const payloadIssuedAt =
    parseCanonicalTimestamp(
      payload.issuedAt,
    );

  if (
    payloadIssuedAt ===
      undefined
  ) {
    return rejected(
      "FINORA PRICING_POLICY issuedAt must be a canonical ISO timestamp.",
    );
  }

  // ----------------------------------------------------------
  // OVERRIDE SET
  // ----------------------------------------------------------

  if (
    !isRecord(
      payload.overrideSet,
    )
  ) {
    return rejected(
      "FINORA PRICING_POLICY override set is required.",
    );
  }

  const overrideSet =
    payload.overrideSet;

  if (
    overrideSet.schemaVersion !==
      1 ||
    !isNonEmptyString(
      overrideSet.overrideSetId,
    )
  ) {
    return rejected(
      "FINORA Pricing Policy override set identity is invalid.",
    );
  }

  // ----------------------------------------------------------
  // SCOPE
  // ----------------------------------------------------------

  if (
    !isRecord(
      overrideSet.scope,
    )
  ) {
    return rejected(
      "FINORA Pricing Policy scope is required.",
    );
  }

  const scope =
    overrideSet.scope;

  if (
    !isNonEmptyString(
      scope.ownerId,
    ) ||
    !isNonEmptyString(
      scope.businessId,
    ) ||
    !isNonEmptyString(
      scope.branchId,
    )
  ) {
    return rejected(
      "FINORA Pricing Policy scope is invalid.",
    );
  }

  if (
    scope.ownerId !==
      target.ownerId ||
    scope.businessId !==
      target.businessId ||
    scope.branchId !==
      target.branchId
  ) {
    return rejected(
      "FINORA Pricing Policy scope does not match the package target.",
    );
  }

  // ----------------------------------------------------------
  // OVERRIDE RULES
  // ----------------------------------------------------------

  if (
    !Array.isArray(
      overrideSet.overrides,
    )
  ) {
    return rejected(
      "FINORA Pricing Policy overrides must be an array.",
    );
  }

  if (
    !overrideSet.overrides.every(
      isPricingOverrideRule,
    )
  ) {
    return rejected(
      "FINORA Pricing Policy contains an invalid override rule.",
    );
  }

  const overrides =
    overrideSet.overrides as
      FinoraPricingPolicyIssuanceOverrideRule[];

  // ----------------------------------------------------------
  // DUPLICATE OVERRIDE IDS
  // ----------------------------------------------------------

  const overrideIds =
    new Set<string>();

  for (const rule of overrides) {

    if (
      overrideIds.has(
        rule.overrideId,
      )
    ) {
      return rejected(
        "FINORA Pricing Policy contains duplicate override IDs.",
      );
    }

    overrideIds.add(
      rule.overrideId,
    );
  }

  // ----------------------------------------------------------
  // OVERLAPPING VALIDITY WINDOWS
  //
  // Current recipient contract supports only
  // LOAN_DISBURSEMENT overrides.
  //
  // Touching boundaries are valid:
  //
  // previous.validUntil === current.validFrom
  //
  // is NOT an overlap.
  // ----------------------------------------------------------

  const ordered =
    [...overrides].sort(
      (
        left,
        right,
      ) =>
        Date.parse(
          left.validity.validFrom,
        ) -
        Date.parse(
          right.validity.validFrom,
        ),
    );

  for (
    let index = 1;
    index < ordered.length;
    index += 1
  ) {

    const previous =
      ordered[
        index - 1
      ];

    const current =
      ordered[
        index
      ];

    if (
      Date.parse(
        current.validity.validFrom,
      ) <
      Date.parse(
        previous.validity.validUntil,
      )
    ) {
      return rejected(
        "FINORA Pricing Policy override validity windows must not overlap.",
      );
    }
  }

  // ----------------------------------------------------------
  // INSTALLATION BINDING
  // ----------------------------------------------------------

  if (
    !isRecord(
      payload.installationBinding,
    )
  ) {
    return rejected(
      "FINORA PRICING_POLICY installation binding is required.",
    );
  }

  const installationBinding =
    payload.installationBinding;

  if (
    installationBinding.schemaVersion !==
      1 ||
    !isNonEmptyString(
      installationBinding.installationId,
    ) ||
    !isValidBindingIdentity(
      installationBinding.bindingKeyId,
      installationBinding.fingerprintAlgorithm,
      installationBinding.publicKeyFingerprint,
    )
  ) {
    return rejected(
      "FINORA PRICING_POLICY installation binding is invalid.",
    );
  }

  if (
    installationBinding.installationId !==
      target.installationId ||
    installationBinding.bindingKeyId !==
      target.bindingKeyId ||
    installationBinding.fingerprintAlgorithm !==
      target.fingerprintAlgorithm ||
    installationBinding.publicKeyFingerprint !==
      target.publicKeyFingerprint
  ) {
    return rejected(
      "FINORA PRICING_POLICY installation binding does not match the package target.",
    );
  }

  // ----------------------------------------------------------
  // ACCEPT
  // ----------------------------------------------------------

  return accepted(
    payload,
  );
}

// ============================================================
// END
// ============================================================