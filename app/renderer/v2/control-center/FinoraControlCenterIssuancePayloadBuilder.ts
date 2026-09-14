/* ===========================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER
   CANONICAL ISSUANCE PAYLOAD BUILDER

   RESPONSIBILITY:

   - Convert renderer form drafts into purpose-specific payloads
   - Derive repeated Owner / Business / Branch identity from target
   - Derive installation-binding payload values from target
   - Canonicalize renderer-entered timestamps
   - Apply fixed FINORA commercial constants
   - Omit irrelevant REGISTERED / DEMO fields

   SECURITY:

   - Renderer validation is convenience only.
   - Main-process issuance policy remains authoritative.
   - packageId is never created here.
   - sequence is never created here.
   - root issuance time is never created here.
=========================================================== */

import type {
  FinoraControlCenterIssuanceRequest,
} from "../../../../electron/control-center/finoraControlCenterPreload";

import type {
  FinoraBranchActivationFormDraft,
  FinoraBranchAccessFormDraft,
  FinoraBusinessProfileFormDraft,
  FinoraControlCenterTargetDraft,
  FinoraPricingPolicyFormDraft,
  FinoraStorageEntitlementFormDraft,
  FinoraWalletRechargeFormDraft,
} from "./FinoraControlCenterIssuanceForm.types";

/* ============================================================
   RESULT
============================================================ */

export type FinoraControlCenterBuiltIssuanceRequest =
  Omit<
    FinoraControlCenterIssuanceRequest,
    "packageValidity"
  >;

/* ============================================================
   CONSTANTS
============================================================ */

const REGISTERED_DURATION_MS =
  365 * 24 * 60 * 60 * 1000;

const REGISTRATION_FEE =
  2000;

const REGISTRATION_CURRENCY =
  "INR";

/* ============================================================
   HELPERS
============================================================ */

function requiredString(
  value:
    string,

  label:
    string,
): string {

  const trimmed =
    value.trim();

  if (trimmed.length === 0) {
    throw new Error(
      `${label} is required.`,
    );
  }

  return trimmed;
}

function optionalString(
  value:
    string,
): string | undefined {

  const trimmed =
    value.trim();

  return trimmed.length > 0
    ? trimmed
    : undefined;
}

function canonicalTimestamp(
  value:
    string,

  label:
    string,
): string {

  const source =
    requiredString(
      value,
      label,
    );

  const milliseconds =
    Date.parse(
      source,
    );

  if (
    !Number.isFinite(
      milliseconds,
    )
  ) {
    throw new Error(
      `${label} must be a valid timestamp.`,
    );
  }

  return new Date(
    milliseconds,
  ).toISOString();
}

function optionalCanonicalTimestamp(
  value:
    string,

  label:
    string,
): string | undefined {

  if (value.trim().length === 0) {
    return undefined;
  }

  return canonicalTimestamp(
    value,
    label,
  );
}

function parseInrAmountToMinorUnits(
  value:
    string,

  label:
    string,
): number {

  const source =
    requiredString(
      value,
      label,
    );

  /*
   * Parse the decimal text directly.
   *
   * Do NOT use Number(source) * 100 here. The signed payload
   * requires an exact integer minor-unit representation and
   * must not inherit binary floating-point multiplication
   * artifacts.
   */
  if (
    !/^\d+(?:\.\d{1,2})?$/.test(
      source,
    )
  ) {
    throw new Error(
      `${label} must be a positive INR amount with at most 2 decimal places.`,
    );
  }

  const parts =
    source.split(
      ".",
    );

  const rupees =
    parts[0];

  const paise =
    (
      parts[1] ??
      ""
    ).padEnd(
      2,
      "0",
    );

  const minorText =
    `${rupees}${paise}`;

  const amountMinor =
    Number(
      minorText,
    );

  if (
    !Number.isSafeInteger(
      amountMinor,
    ) ||
    amountMinor <=
      0
  ) {
    throw new Error(
      `${label} must resolve to a positive safe INR minor-unit amount.`,
    );
  }

  return amountMinor;
}

function positiveSafeInteger(
  value:
    string,

  label:
    string,
): number {

  const source =
    requiredString(
      value,
      label,
    );

  if (!/^\d+$/.test(source)) {
    throw new Error(
      `${label} must be a positive whole number.`,
    );
  }

  const number =
    Number(
      source,
    );

  if (
    !Number.isSafeInteger(
      number,
    ) ||
    number <=
      0
  ) {
    throw new Error(
      `${label} must be a positive safe integer.`,
    );
  }

  return number;
}

function positiveFiniteNumber(
  value:
    string,

  label:
    string,
): number {

  const source =
    requiredString(
      value,
      label,
    );

  const number =
    Number(
      source,
    );

  if (
    !Number.isFinite(
      number,
    ) ||
    number <=
      0
  ) {
    throw new Error(
      `${label} must be a positive finite number.`,
    );
  }

  return number;
}

function buildTarget(
  draft:
    FinoraControlCenterTargetDraft,
): FinoraControlCenterTargetDraft {

  const publicKeyFingerprint =
    requiredString(
      draft.publicKeyFingerprint,
      "Public Key Fingerprint",
    ).toLowerCase();

  if (
    !/^[0-9a-f]{64}$/.test(
      publicKeyFingerprint,
    )
  ) {
    throw new Error(
      "Public Key Fingerprint must contain exactly 64 lowercase SHA-256 hexadecimal characters.",
    );
  }

  const expectedBindingKeyId =
    `FINORA-BINDING-${publicKeyFingerprint
      .slice(
        0,
        32,
      )
      .toUpperCase()}`;

  const bindingKeyId =
    requiredString(
      draft.bindingKeyId,
      "Binding Key ID",
    );

  if (
    bindingKeyId !==
      expectedBindingKeyId
  ) {
    throw new Error(
      "Binding Key ID does not match the native public-key fingerprint.",
    );
  }

  return {
    ownerId:
      requiredString(
        draft.ownerId,
        "Owner ID",
      ),

    businessId:
      requiredString(
        draft.businessId,
        "Business ID",
      ),

    branchId:
      requiredString(
        draft.branchId,
        "Branch ID",
      ),

    installationId:
      requiredString(
        draft.installationId,
        "Installation ID",
      ),

    bindingKeyId,

    fingerprintAlgorithm:
      "SHA-256",

    publicKeyFingerprint,
  };
}



/* ============================================================
   BRANCH ACTIVATION
============================================================ */

export function buildFinoraBranchActivationIssuanceRequest(
  draft:
    FinoraBranchActivationFormDraft,
): FinoraControlCenterBuiltIssuanceRequest {

  const target =
    buildTarget(
      draft.target,
    );

  const activationCreatedAt =
    canonicalTimestamp(
      draft.activationCreatedAt,
      "Activation Created At",
    );

  const activationUpdatedAt =
    canonicalTimestamp(
      draft.activationUpdatedAt,
      "Activation Updated At",
    );

  const activationActivatedAt =
    optionalCanonicalTimestamp(
      draft.activationActivatedAt,
      "Activation Activated At",
    );

  const activation = {
    activationId:
      requiredString(
        draft.activationId,
        "Activation ID",
      ),

    ownerId:
      target.ownerId,

    businessId:
      target.businessId,

    branchId:
      target.branchId,

    status:
      "ACTIVE" as const,

    ...(
      activationActivatedAt ===
        undefined
        ? {}
        : {
            activatedAt:
              activationActivatedAt,
          }
    ),

    createdAt:
      activationCreatedAt,

    updatedAt:
      activationUpdatedAt,

    schemaVersion:
      1 as const,
  };

  return {
    target,

    payload: {
      action:
        "ISSUE",

      activation,

      installationBinding: {
        installationId:
          target.installationId,

        bindingKeyId:
          target.bindingKeyId,

        fingerprintAlgorithm:
          target.fingerprintAlgorithm,

        publicKeyFingerprint:
          target.publicKeyFingerprint,
      },

      schemaVersion:
        1,
    },
  };
}

/* ============================================================
   BRANCH ACCESS
============================================================ */

export function buildFinoraBranchAccessIssuanceRequest(
  draft:
    FinoraBranchAccessFormDraft,
): FinoraControlCenterBuiltIssuanceRequest {

  const target =
    buildTarget(
      draft.target,
    );

  if (
    draft.action ===
      "AUTHORIZE_CREDENTIAL"
  ) {
    if (
      !draft.credentialEnrollmentEnabled
    ) {
      throw new Error(
        "AUTHORIZE_CREDENTIAL requires one-time recipient credential authorization.",
      );
    }

    if (
      draft.credentialRole !==
        "ADMIN" &&
      draft.credentialRole !==
        "MANAGER" &&
      draft.credentialRole !==
        "COLLECTOR" &&
      draft.credentialRole !==
        "VIEWER"
    ) {
      throw new Error(
        "A valid Branch Access credential role is required.",
      );
    }

    const credentialBase = {
      authorizationId:
        requiredString(
          draft.credentialAuthorizationId,
          "Credential Authorization ID",
        ),

      userId:
        requiredString(
          draft.userId,
          "User ID",
        ),

      username:
        requiredString(
          draft.credentialUsername,
          "Credential Username",
        ),

      fullName:
        requiredString(
          draft.credentialFullName,
          "Credential Full Name",
        ),

      role:
        draft.credentialRole,

      ownerId:
        target.ownerId,

      businessId:
        target.businessId,

      branchId:
        target.branchId,

      storageMode:
        draft.storageMode,

      method:
        "SET_PASSWORD_ON_RECIPIENT" as const,

      oneTime:
        true as const,

      schemaVersion:
        1 as const,
    };

    const credentialEnrollment =
      draft.accessType ===
        "DEMO"
        ? {
            ...credentialBase,

            dataContext:
              "DEMO" as const,

            demoId:
              requiredString(
                draft.demoId,
                "Demo ID",
              ),
          }
        : {
            ...credentialBase,

            dataContext:
              "REAL" as const,
          };

    return {
      target,

      payload: {
        action:
          "AUTHORIZE_CREDENTIAL",

        credentialEnrollment,

        /*
         * Root payload.issuedAt is deliberately absent.
         * The privileged main-process issuance coordinator
         * injects the authoritative timestamp before signing.
         */
        schemaVersion:
          1,
      },
    };
  }

  const validFrom =
    canonicalTimestamp(
      draft.validFrom,
      "Access Valid From",
    );

  const validUntil =
    canonicalTimestamp(
      draft.validUntil,
      "Access Valid Until",
    );

  if (
    Date.parse(
      validUntil,
    ) <=
    Date.parse(
      validFrom,
    )
  ) {
    throw new Error(
      "Access Valid Until must be later than Access Valid From.",
    );
  }

  let administrativeStatus:
    | "ACTIVE"
    | "SUSPENDED"
    | "REVOKED";

  switch (draft.action) {
    case "ISSUE":
    case "RESUME":
      administrativeStatus =
        "ACTIVE";
      break;

    case "SUSPEND":
      administrativeStatus =
        "SUSPENDED";
      break;

    case "REVOKE":
      administrativeStatus =
        "REVOKED";
      break;

    case "RENEW":
    case "REPLACE":
      administrativeStatus =
        draft.administrativeStatus;
      break;
  }

  const grantBase = {
    grantId:
      requiredString(
        draft.grantId,
        "Grant ID",
      ),

    userId:
      requiredString(
        draft.userId,
        "User ID",
      ),

    ownerId:
      target.ownerId,

    businessId:
      target.businessId,

    branchId:
      target.branchId,

    storageMode:
      draft.storageMode,

    administrativeStatus,

    validity: {
      validFrom,
      validUntil,
    },

    createdAt:
      canonicalTimestamp(
        draft.grantCreatedAt,
        "Grant Created At",
      ),

    updatedAt:
      canonicalTimestamp(
        draft.grantUpdatedAt,
        "Grant Updated At",
      ),

    schemaVersion:
      1 as const,
  };

  let accessGrant:
    Record<string, unknown>;

  if (
    draft.accessType ===
      "REGISTERED"
  ) {

    if (
      Date.parse(
        validUntil,
      ) -
        Date.parse(
          validFrom,
        ) !==
      REGISTERED_DURATION_MS
    ) {
      throw new Error(
        "REGISTERED access must contain exactly 365 days of validity.",
      );
    }

    const registrationCycle =
      positiveSafeInteger(
        draft.registrationCycle,
        "Registration Cycle",
      );

    if (
      draft.action ===
        "RENEW" &&
      registrationCycle <=
        1
    ) {
      throw new Error(
        "RENEW requires a Registration Cycle greater than 1.",
      );
    }

    const reference =
      optionalString(
        draft.registrationPaymentReference,
      );

    const remarks =
      optionalString(
        draft.registrationPaymentRemarks,
      );

    accessGrant = {
      ...grantBase,

      accessType:
        "REGISTERED",

      registrationPayment: {
        amount:
          REGISTRATION_FEE,

        currency:
          REGISTRATION_CURRENCY,

        paymentMode:
          draft.registrationPaymentMode,

        paidAt:
          canonicalTimestamp(
            draft.registrationPaidAt,
            "Registration Paid At",
          ),

        ...(
          reference ===
            undefined
            ? {}
            : {
                reference,
              }
        ),

        ...(
          remarks ===
            undefined
            ? {}
            : {
                remarks,
              }
        ),

        refundable:
          false,
      },

      registrationCycle,
    };

  } else {

    if (
      draft.action ===
        "RENEW"
    ) {
      throw new Error(
        "DEMO access cannot use the RENEW action.",
      );
    }

    const demoRemarks =
      optionalString(
        draft.demoRemarks,
      );

    accessGrant = {
      ...grantBase,

      accessType:
        "DEMO",

      demoId:
        requiredString(
          draft.demoId,
          "Demo ID",
        ),

      ...(
        demoRemarks ===
          undefined
          ? {}
          : {
              demoRemarks,
            }
      ),
    };
  }

  let credentialEnrollment:
    Record<string, unknown> |
    undefined;

  if (
    draft.credentialEnrollmentEnabled
  ) {

    if (
      draft.action !==
        "ISSUE"
    ) {
      throw new Error(
        "Credential enrollment authorization is permitted only with ISSUE or AUTHORIZE_CREDENTIAL.",
      );
    }

    if (
      draft.credentialRole !==
        "ADMIN" &&
      draft.credentialRole !==
        "MANAGER" &&
      draft.credentialRole !==
        "COLLECTOR" &&
      draft.credentialRole !==
        "VIEWER"
    ) {
      throw new Error(
        "A valid Branch Access credential role is required.",
      );
    }

    const credentialBase = {
      authorizationId:
        requiredString(
          draft.credentialAuthorizationId,
          "Credential Authorization ID",
        ),

      userId:
        requiredString(
          draft.userId,
          "User ID",
        ),

      username:
        requiredString(
          draft.credentialUsername,
          "Credential Username",
        ),

      fullName:
        requiredString(
          draft.credentialFullName,
          "Credential Full Name",
        ),

      role:
        draft.credentialRole,

      ownerId:
        target.ownerId,

      businessId:
        target.businessId,

      branchId:
        target.branchId,

      storageMode:
        draft.storageMode,

      method:
        "SET_PASSWORD_ON_RECIPIENT" as const,

      oneTime:
        true as const,

      schemaVersion:
        1 as const,
    };

    credentialEnrollment =
      draft.accessType ===
        "DEMO"
        ? {
            ...credentialBase,

            dataContext:
              "DEMO",

            demoId:
              requiredString(
                draft.demoId,
                "Demo ID",
              ),
          }
        : {
            ...credentialBase,

            dataContext:
              "REAL",
          };
  }

  return {
    target,

    payload: {
      action:
        draft.action,

      accessGrant,

      ...(
        credentialEnrollment ===
          undefined
          ? {}
          : {
              credentialEnrollment,
            }
      ),

      /*
       * Root payload.issuedAt is deliberately absent.
       * The privileged main-process issuance coordinator
       * injects the authoritative timestamp before signing.
       */
      schemaVersion:
        1,
    },
  };
}
/* ============================================================
   STORAGE ENTITLEMENT
============================================================ */

export function buildFinoraStorageEntitlementIssuanceRequest(
  draft:
    FinoraStorageEntitlementFormDraft,
): FinoraControlCenterBuiltIssuanceRequest {

  const target =
    buildTarget(
      draft.target,
    );

  return {
    target,

    payload: {
      entitlement: {
        entitlementId:
          requiredString(
            draft.entitlementId,
            "Entitlement ID",
          ),

        userId:
          requiredString(
            draft.userId,
            "User ID",
          ),

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

        storageMode:
          draft.storageMode,

        status:
          draft.status,

        activatedAt:
          canonicalTimestamp(
            draft.activatedAt,
            "Entitlement Activated At",
          ),

        createdAt:
          canonicalTimestamp(
            draft.createdAt,
            "Entitlement Created At",
          ),

        updatedAt:
          canonicalTimestamp(
            draft.updatedAt,
            "Entitlement Updated At",
          ),

        schemaVersion:
          1,
      },

      schemaVersion:
        1,
    },
  };
}

/* ============================================================
   BUSINESS PROFILE
============================================================ */

export function buildFinoraBusinessProfileIssuanceRequest(
  draft:
    FinoraBusinessProfileFormDraft,
): FinoraControlCenterBuiltIssuanceRequest {

  const target =
    buildTarget(
      draft.target,
    );

  return {
    target,

    payload: {
      action:
        draft.action,

      profile: {
        profileId:
          requiredString(
            draft.profileId,
            "Profile ID",
          ),

        ownerId:
          target.ownerId,

        businessId:
          target.businessId,

        branchId:
          target.branchId,

        businessCode:
          requiredString(
            draft.businessCode,
            "Business Code",
          ),

        branchCode:
          requiredString(
            draft.branchCode,
            "Branch Code",
          ),

        businessName:
          requiredString(
            draft.businessName,
            "Business Name",
          ),

        branchName:
          requiredString(
            draft.branchName,
            "Branch Name",
          ),

        createdAt:
          canonicalTimestamp(
            draft.createdAt,
            "Profile Created At",
          ),

        updatedAt:
          canonicalTimestamp(
            draft.updatedAt,
            "Profile Updated At",
          ),

        schemaVersion:
          1,
      },

      installationBinding: {
        installationId:
          target.installationId,

        bindingKeyId:
          target.bindingKeyId,

        fingerprintAlgorithm:
          target.fingerprintAlgorithm,

        publicKeyFingerprint:
          target.publicKeyFingerprint,

        schemaVersion:
          1,
      },

      schemaVersion:
        1,
    },
  };
}

/* ============================================================
   PRICING POLICY
============================================================ */

export function buildFinoraPricingPolicyIssuanceRequest(
  draft:
    FinoraPricingPolicyFormDraft,
): FinoraControlCenterBuiltIssuanceRequest {

  const target =
    buildTarget(
      draft.target,
    );

  const overrideSetId =
    requiredString(
      draft.overrideSetId,
      "Override Set ID",
    );

  const overrideIds =
    new Set<string>();

  const overrides =
    draft.overrides.map(
      (
        draftRule,
        index,
      ) => {

        const ruleNumber =
          index +
          1;

        const overrideId =
          requiredString(
            draftRule.overrideId,
            `Override ${ruleNumber} ID`,
          );

        if (
          overrideIds.has(
            overrideId,
          )
        ) {
          throw new Error(
            `Duplicate Pricing Override ID: ${overrideId}.`,
          );
        }

        overrideIds.add(
          overrideId,
        );

        const validFrom =
          canonicalTimestamp(
            draftRule.validFrom,
            `Override ${ruleNumber} Valid From`,
          );

        const validUntil =
          canonicalTimestamp(
            draftRule.validUntil,
            `Override ${ruleNumber} Valid Until`,
          );

        if (
          Date.parse(
            validUntil,
          ) <=
          Date.parse(
            validFrom,
          )
        ) {
          throw new Error(
            `Override ${ruleNumber} Valid Until must be later than Valid From.`,
          );
        }

        return {
          overrideId,

          chargeCode:
            "LOAN_DISBURSEMENT" as const,

          model:
            "FIXED_PRICE_OVERRIDE" as const,

          amount:
            positiveFiniteNumber(
              draftRule.amount,
              `Override ${ruleNumber} Amount`,
            ),

          currency:
            "INR" as const,

          validity: {
            validFrom,

            validUntil,
          },

          schemaVersion:
            1 as const,
        };
      },
    );

  const orderedOverrides =
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
    index < orderedOverrides.length;
    index += 1
  ) {

    const previous =
      orderedOverrides[
        index -
          1
      ];

    const current =
      orderedOverrides[
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
      throw new Error(
        "Pricing Override validity windows must not overlap.",
      );
    }
  }

  return {
    target,

    payload: {
      action:
        "REPLACE",

      overrideSet: {
        overrideSetId,

        scope: {
          ownerId:
            target.ownerId,

          businessId:
            target.businessId,

          branchId:
            target.branchId,
        },

        overrides,

        schemaVersion:
          1,
      },

      installationBinding: {
        installationId:
          target.installationId,

        bindingKeyId:
          target.bindingKeyId,

        fingerprintAlgorithm:
          target.fingerprintAlgorithm,

        publicKeyFingerprint:
          target.publicKeyFingerprint,

        schemaVersion:
          1,
      },

      schemaVersion:
        1,
    },
  };
}

/* ============================================================
   WALLET RECHARGE
============================================================ */

export function buildFinoraWalletRechargeIssuanceRequest(
  draft:
    FinoraWalletRechargeFormDraft,
): FinoraControlCenterBuiltIssuanceRequest {

  const target =
    buildTarget(
      draft.target,
    );

  const paymentReference =
    requiredString(
      draft.paymentReference,
      "Payment Reference",
    );

  const amountMinor =
    parseInrAmountToMinorUnits(
      draft.amount,
      "Wallet Recharge Amount",
    );

  const providerOrderId =
    optionalString(
      draft.providerOrderId,
    );

  const providerTransactionId =
    optionalString(
      draft.providerTransactionId,
    );

  return {
    target,

    payload: {
      scope: {
        ownerId:
          target.ownerId,

        businessId:
          target.businessId,

        branchId:
          target.branchId,
      },

      installationBinding: {
        installationId:
          target.installationId,

        bindingKeyId:
          target.bindingKeyId,

        fingerprintAlgorithm:
          target.fingerprintAlgorithm,

        publicKeyFingerprint:
          target.publicKeyFingerprint,

        schemaVersion:
          1,
      },

      paymentReference,

      amountMinor,

      currency:
        "INR",

      paymentMethod:
        draft.paymentMethod,

      paymentSource:
        draft.paymentSource,

      ...(
        providerOrderId ===
          undefined
          ? {}
          : {
              providerOrderId,
            }
      ),

      ...(
        providerTransactionId ===
          undefined
          ? {}
          : {
              providerTransactionId,
            }
      ),

      schemaVersion:
        1,
    },
  };
}

/* ============================================================
   END
============================================================ */