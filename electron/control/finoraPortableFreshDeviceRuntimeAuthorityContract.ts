import type {
  FinoraBranchCertificationSignatureV1,
} from "./finoraBranchCertificationContract.js";

// ============================================================
// CONSTANTS
// ============================================================

export const FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_FORMAT =
  "FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY" as const;

export const FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_SCHEMA_VERSION =
  1 as const;

export const FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_PURPOSE =
  "FRESH_DEVICE_RUNTIME_AUTHORITY" as const;

// ============================================================
// CONTRACT
// ============================================================

export type FinoraPortableFreshDeviceRuntimeAuthorityRole =
  | "ADMIN"
  | "MANAGER"
  | "COLLECTOR"
  | "VIEWER";

export type FinoraPortableFreshDeviceRuntimeAuthorityStorageMode =
  | "LOCAL"
  | "USB";

export type FinoraPortableFreshDeviceRuntimeAuthorityDataContext =
  | "REAL"
  | "DEMO";

export type FinoraPortableFreshDeviceRuntimeAuthorityAccessType =
  | "REGISTERED"
  | "DEMO";

export type FinoraPortableFreshDeviceRuntimeAuthorityAccessMode =
  | "ACTIVE"
  | "REGISTERED_EXPIRED_READ_ONLY";

export interface FinoraPortableFreshDeviceRuntimeAuthorityRegistrationPayment {
  amount:
    number;

  currency:
    "INR";

  paymentMode:
    "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER";

  paidAt:
    string;

  reference?:
    string;

  remarks?:
    string;

  refundable:
    false;
}

export interface FinoraPortableFreshDeviceRuntimeAuthorityBusinessProfileV1 {
  profileId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  businessCode:
    string;

  branchCode:
    string;

  businessName:
    string;

  branchName:
    string;

  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    "SHA-256";

  publicKeyFingerprint:
    string;

  createdAt:
    string;

  updatedAt:
    string;

  schemaVersion:
    1;
}
export interface FinoraPortableFreshDeviceRuntimeAuthorityPayloadV1 {
  schemaVersion:
    typeof FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_SCHEMA_VERSION;

  purpose:
    typeof FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_PURPOSE;

  authorityId:
    string;

  sourceAuthorizationId:
    string;

  credentialId:
    string;

  activationId:
    string;

  branchAccessGrantId:
    string;

  storageEntitlementId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  businessCode:
    string | null;

  branchCode:
    string | null;

  businessProfile?:
    FinoraPortableFreshDeviceRuntimeAuthorityBusinessProfileV1;

  userId:
    string;

  username:
    string;

  canonicalUsername:
    string;

  fullName:
    string;

  role:
    FinoraPortableFreshDeviceRuntimeAuthorityRole;

  storageMode:
    FinoraPortableFreshDeviceRuntimeAuthorityStorageMode;

  dataContext:
    FinoraPortableFreshDeviceRuntimeAuthorityDataContext;

  demoId:
    string | null;

  authGeneration:
    number;

  activationStatus:
    "ACTIVE";

  activationActivatedAt?:
    string;

  activationCreatedAt:
    string;

  activationUpdatedAt:
    string;

  branchAccessType:
    FinoraPortableFreshDeviceRuntimeAuthorityAccessType;

  registrationPayment:
    FinoraPortableFreshDeviceRuntimeAuthorityRegistrationPayment |
    null;

  registrationCycle:
    number |
    null;

  demoRemarks:
    string |
    null;

  accessMode:
    FinoraPortableFreshDeviceRuntimeAuthorityAccessMode;

  accessValidFrom:
    string;

  accessValidUntil:
    string | null;

  branchAccessCreatedAt:
    string;

  branchAccessUpdatedAt:
    string;

  storageEntitlementStatus:
    "ACTIVE";

  storageEntitlementActivatedAt:
    string;

  storageEntitlementCreatedAt:
    string;

  storageEntitlementUpdatedAt:
    string;

  portableAuthFingerprint:
    string;

  issuedAt:
    string;
}

export interface FinoraPortableFreshDeviceRuntimeAuthorityPackageV1 {
  format:
    typeof FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_FORMAT;

  schemaVersion:
    typeof FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_SCHEMA_VERSION;

  payload:
    FinoraPortableFreshDeviceRuntimeAuthorityPayloadV1;

  signature:
    FinoraBranchCertificationSignatureV1;
}

// ============================================================
// VALIDATION
// ============================================================

type UnknownObject =
  Record<string, unknown>;

function asObject(
  value:
    unknown,
  label:
    string,
): UnknownObject {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(
      `${label} must be an object.`,
    );
  }

  return value as UnknownObject;
}

function assertExactKeys(
  value:
    UnknownObject,
  keys:
    readonly string[],
  label:
    string,
): void {
  const actual =
    Object.keys(value).sort();

  const expected =
    [...keys].sort();

  if (
    actual.length !==
      expected.length ||
    actual.some(
      (key, index) =>
        key !== expected[index],
    )
  ) {
    throw new Error(
      `${label} contains an invalid field set.`,
    );
  }
}

function assertNonEmptyString(
  value:
    unknown,
  label:
    string,
): asserts value is string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `${label} must be a non-empty string.`,
    );
  }
}

function assertCanonicalTimestamp(
  value:
    unknown,
  label:
    string,
): asserts value is string {
  assertNonEmptyString(
    value,
    label,
  );

  const parsed =
    Date.parse(value);

  if (
    !Number.isFinite(parsed) ||
    new Date(parsed).toISOString() !==
      value
  ) {
    throw new Error(
      `${label} must be a canonical ISO timestamp.`,
    );
  }
}

function assertPortableAuthFingerprint(
  value:
    unknown,
): asserts value is string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{64}$/.test(value)
  ) {
    throw new Error(
      "portableAuthFingerprint must be 64 lowercase hexadecimal characters.",
    );
  }
}

function validateFinoraPortableFreshDeviceRuntimeAuthorityBusinessProfileV1(
  value:
    unknown,
): asserts value is FinoraPortableFreshDeviceRuntimeAuthorityBusinessProfileV1 {
  const profile =
    asObject(
      value,
      "Portable fresh-device runtime authority Business Profile",
    );

  assertExactKeys(
    profile,
    [
      "profileId",
      "ownerId",
      "businessId",
      "branchId",
      "businessCode",
      "branchCode",
      "businessName",
      "branchName",
      "installationId",
      "bindingKeyId",
      "fingerprintAlgorithm",
      "publicKeyFingerprint",
      "createdAt",
      "updatedAt",
      "schemaVersion",
    ],
    "Portable fresh-device runtime authority Business Profile",
  );

  for (
    const key of [
      "profileId",
      "ownerId",
      "businessId",
      "branchId",
      "businessCode",
      "branchCode",
      "businessName",
      "branchName",
      "installationId",
      "bindingKeyId",
    ] as const
  ) {
    assertNonEmptyString(
      profile[key],
      `businessProfile.${key}`,
    );
  }

  if (
    profile.fingerprintAlgorithm !==
      "SHA-256"
  ) {
    throw new Error(
      "businessProfile.fingerprintAlgorithm must be SHA-256.",
    );
  }

  const fingerprint =
    profile.publicKeyFingerprint;

  if (
    typeof fingerprint !==
      "string" ||
    !/^[0-9a-f]{64}$/.test(
      fingerprint,
    )
  ) {
    throw new Error(
      "businessProfile.publicKeyFingerprint is invalid.",
    );
  }

  const bindingKeyId =
    profile.bindingKeyId;

  assertNonEmptyString(
    bindingKeyId,
    "businessProfile.bindingKeyId",
  );

  const expectedBindingKeyId =
    `FINORA-BINDING-${fingerprint
      .slice(0, 32)
      .toUpperCase()}`;

  if (
    bindingKeyId !==
      expectedBindingKeyId
  ) {
    throw new Error(
      "businessProfile.bindingKeyId does not match its fingerprint.",
    );
  }

  const createdAt =
    profile.createdAt;

  const updatedAt =
    profile.updatedAt;

  assertCanonicalTimestamp(
    createdAt,
    "businessProfile.createdAt",
  );

  assertCanonicalTimestamp(
    updatedAt,
    "businessProfile.updatedAt",
  );

  if (
    Date.parse(updatedAt) <
      Date.parse(createdAt)
  ) {
    throw new Error(
      "businessProfile.updatedAt cannot precede createdAt.",
    );
  }

  if (
    profile.schemaVersion !==
      1
  ) {
    throw new Error(
      "businessProfile.schemaVersion is unsupported.",
    );
  }
}
export function validateFinoraPortableFreshDeviceRuntimeAuthorityPayloadV1(
  value:
    unknown,
): asserts value is FinoraPortableFreshDeviceRuntimeAuthorityPayloadV1 {
  const payload =
    asObject(
      value,
      "Portable fresh-device runtime authority payload",
    );

  assertExactKeys(
    payload,
    [
      "schemaVersion",
      "purpose",
      "authorityId",
      "sourceAuthorizationId",
      "credentialId",
      "activationId",
      "branchAccessGrantId",
      "storageEntitlementId",
      "ownerId",
      "businessId",
      "branchId",
      "businessCode",
      "branchCode",
      ...(
        Object.prototype.hasOwnProperty.call(
          payload,
          "businessProfile",
        )
          ? ["businessProfile"]
          : []
      ),
      "userId",
      "username",
      "canonicalUsername",
      "fullName",
      "role",
      "storageMode",
      "dataContext",
      "demoId",
      "authGeneration",
      "activationStatus",
      "activationActivatedAt",
      "activationCreatedAt",
      "activationUpdatedAt",
      "branchAccessType",
      "registrationPayment",
      "registrationCycle",
      "demoRemarks",      "accessMode",
      "accessValidFrom",
      "accessValidUntil",
      "branchAccessCreatedAt",
      "branchAccessUpdatedAt",
      "storageEntitlementStatus",
      "storageEntitlementActivatedAt",
      "storageEntitlementCreatedAt",
      "storageEntitlementUpdatedAt",
      "portableAuthFingerprint",
      "issuedAt",
    ],
    "Portable fresh-device runtime authority payload",
  );

  if (
    payload.schemaVersion !==
      FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_SCHEMA_VERSION
  ) {
    throw new Error(
      "Portable fresh-device runtime authority payload schemaVersion is unsupported.",
    );
  }

  if (
    payload.purpose !==
      FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_PURPOSE
  ) {
    throw new Error(
      "Portable fresh-device runtime authority purpose is invalid.",
    );
  }

  for (
    const key of [
      "authorityId",
      "sourceAuthorizationId",
      "credentialId",
      "activationId",
      "branchAccessGrantId",
      "storageEntitlementId",
      "ownerId",
      "businessId",
      "branchId",
      "userId",
      "username",
      "canonicalUsername",
      "fullName",
    ] as const
  ) {
    assertNonEmptyString(
      payload[key],
      key,
    );
  }

  const businessCodeValid =
    payload.businessCode === null ||
    (
      typeof payload.businessCode ===
        "string" &&
      payload.businessCode.trim().length >
        0
    );

  const branchCodeValid =
    payload.branchCode === null ||
    (
      typeof payload.branchCode ===
        "string" &&
      payload.branchCode.trim().length >
        0
    );

  if (
    !businessCodeValid ||
    !branchCodeValid ||
    (
      payload.businessCode === null
    ) !==
    (
      payload.branchCode === null
    )
  ) {
    throw new Error(
      "Portable fresh-device runtime authority numbering codes are invalid.",
    );
  }

  const businessProfile =
    payload.businessProfile;

  if (
    businessProfile !==
      undefined
  ) {
    validateFinoraPortableFreshDeviceRuntimeAuthorityBusinessProfileV1(
      businessProfile,
    );

    if (
      businessProfile.ownerId !==
        payload.ownerId ||
      businessProfile.businessId !==
        payload.businessId ||
      businessProfile.branchId !==
        payload.branchId ||
      payload.businessCode ===
        null ||
      payload.branchCode ===
        null ||
      businessProfile.businessCode !==
        payload.businessCode ||
      businessProfile.branchCode !==
        payload.branchCode
    ) {
      throw new Error(
        "Portable fresh-device runtime authority Business Profile does not match its signed branch scope.",
      );
    }
  }
  if (
    payload.role !== "ADMIN" &&
    payload.role !== "MANAGER" &&
    payload.role !== "COLLECTOR" &&
    payload.role !== "VIEWER"
  ) {
    throw new Error(
      "Portable fresh-device runtime authority role is invalid.",
    );
  }

  if (
    payload.storageMode !== "LOCAL" &&
    payload.storageMode !== "USB"
  ) {
    throw new Error(
      "Portable fresh-device runtime authority storageMode is invalid.",
    );
  }

  if (
    payload.dataContext !== "REAL" &&
    payload.dataContext !== "DEMO"
  ) {
    throw new Error(
      "Portable fresh-device runtime authority dataContext is invalid.",
    );
  }

  if (
    !Number.isSafeInteger(
      payload.authGeneration,
    ) ||
    (
      payload.authGeneration as number
    ) <= 0
  ) {
    throw new Error(
      "Portable fresh-device runtime authority authGeneration is invalid.",
    );
  }

  if (
    payload.activationStatus !==
      "ACTIVE"
  ) {
    throw new Error(
      "Portable fresh-device runtime authority activationStatus must be ACTIVE.",
    );
  }

  if (
    payload.branchAccessType !==
      "REGISTERED" &&
    payload.branchAccessType !==
      "DEMO"
  ) {
    throw new Error(
      "Portable fresh-device runtime authority branchAccessType is invalid.",
    );
  }

  if (
    payload.branchAccessType ===
      "REGISTERED"
  ) {
    if (
      !payload.registrationPayment ||
      typeof payload.registrationPayment !==
        "object" ||
      Array.isArray(
        payload.registrationPayment,
      ) ||
      payload.registrationCycle ===
        null ||
      !Number.isSafeInteger(
        payload.registrationCycle as number,
      ) ||
      (
        payload.registrationCycle as number
      ) <=
        0
    ) {
      throw new Error(
        "Portable fresh-device runtime authority REGISTERED access metadata is invalid.",
      );
    }

    const payment =
      asObject(
        payload.registrationPayment,
        "Portable fresh-device runtime authority registrationPayment",
      );

    const requiredPaymentKeys =
      [
        "amount",
        "currency",
        "paymentMode",
        "paidAt",
        "refundable",
      ] as const;

    const allowedPaymentKeys =
      new Set([
        ...requiredPaymentKeys,
        "reference",
        "remarks",
      ]);

    if (
      requiredPaymentKeys.some(
        (
          key,
        ) =>
          !Object.prototype.hasOwnProperty.call(
            payment,
            key,
          ),
      ) ||
      Object.keys(
        payment,
      ).some(
        (
          key,
        ) =>
          !allowedPaymentKeys.has(
            key,
          ),
      ) ||
      payment.amount !==
        2000 ||
      payment.currency !==
        "INR" ||
      (
        payment.paymentMode !==
          "CASH" &&
        payment.paymentMode !==
          "UPI" &&
        payment.paymentMode !==
          "BANK_TRANSFER" &&
        payment.paymentMode !==
          "OTHER"
      ) ||
      payment.refundable !==
        false ||
      (
        payment.reference !==
          undefined &&
        typeof payment.reference !==
          "string"
      ) ||
      (
        payment.remarks !==
          undefined &&
        typeof payment.remarks !==
          "string"
      )
    ) {
      throw new Error(
        "Portable fresh-device runtime authority registrationPayment is invalid.",
      );
    }

    assertCanonicalTimestamp(
      payment.paidAt,
      "registrationPayment.paidAt",
    );
  }
  else if (
    payload.registrationPayment !==
      null ||
    payload.registrationCycle !==
      null
  ) {
    throw new Error(
      "Portable fresh-device runtime authority DEMO access cannot carry registration metadata.",
    );
  }

  if (
    payload.demoRemarks !==
      null &&
    typeof payload.demoRemarks !==
      "string"
  ) {
    throw new Error(
      "Portable fresh-device runtime authority demoRemarks is invalid.",
    );
  }

  if (
    payload.accessMode !==
      "ACTIVE" &&
    payload.accessMode !==
      "REGISTERED_EXPIRED_READ_ONLY"
  ) {
    throw new Error(
      "Portable fresh-device runtime authority accessMode is invalid.",
    );
  }

  if (
    payload.storageEntitlementStatus !==
      "ACTIVE"
  ) {
    throw new Error(
      "Portable fresh-device runtime authority storageEntitlementStatus must be ACTIVE.",
    );
  }

  assertCanonicalTimestamp(
    payload.accessValidFrom,
    "accessValidFrom",
  );

  if (
    payload.accessValidUntil !==
      null
  ) {
    assertCanonicalTimestamp(
      payload.accessValidUntil,
      "accessValidUntil",
    );

    if (
      Date.parse(
        payload.accessValidUntil,
      ) <
      Date.parse(
        payload.accessValidFrom,
      )
    ) {
      throw new Error(
        "Portable fresh-device runtime authority access validity window is invalid.",
      );
    }
  }

  if (
    payload.activationActivatedAt !==
      undefined
  ) {
    assertCanonicalTimestamp(
      payload.activationActivatedAt,
      "activationActivatedAt",
    );
  }

  assertCanonicalTimestamp(
    payload.activationCreatedAt,
    "activationCreatedAt",
  );

  assertCanonicalTimestamp(
    payload.activationUpdatedAt,
    "activationUpdatedAt",
  );

  assertCanonicalTimestamp(
    payload.branchAccessCreatedAt,
    "branchAccessCreatedAt",
  );

  assertCanonicalTimestamp(
    payload.branchAccessUpdatedAt,
    "branchAccessUpdatedAt",
  );

  assertCanonicalTimestamp(
    payload.storageEntitlementActivatedAt,
    "storageEntitlementActivatedAt",
  );

  assertCanonicalTimestamp(
    payload.storageEntitlementCreatedAt,
    "storageEntitlementCreatedAt",
  );

  assertCanonicalTimestamp(
    payload.storageEntitlementUpdatedAt,
    "storageEntitlementUpdatedAt",
  );

  assertCanonicalTimestamp(
    payload.issuedAt,
    "issuedAt",
  );

  assertPortableAuthFingerprint(
    payload.portableAuthFingerprint,
  );

  if (
    payload.dataContext ===
      "REAL"
  ) {
    if (
      payload.demoId !==
        null ||
      payload.branchAccessType !==
        "REGISTERED"
    ) {
      throw new Error(
        "REAL portable runtime authority must use REGISTERED access without demoId.",
      );
    }
  }
  else {
    if (
      typeof payload.demoId !==
        "string" ||
      payload.demoId.trim().length ===
        0 ||
      payload.branchAccessType !==
        "DEMO" ||
      payload.accessMode !==
        "ACTIVE"
    ) {
      throw new Error(
        "DEMO portable runtime authority must use ACTIVE DEMO access with demoId.",
      );
    }
  }

  if (
    payload.accessMode ===
      "REGISTERED_EXPIRED_READ_ONLY" &&
    payload.branchAccessType !==
      "REGISTERED"
  ) {
    throw new Error(
      "Expired read-only portable runtime authority must be REGISTERED.",
    );
  }
}

export function canonicalizeFinoraPortableFreshDeviceRuntimeAuthorityPayloadV1(
  payload:
    FinoraPortableFreshDeviceRuntimeAuthorityPayloadV1,
): string {
  validateFinoraPortableFreshDeviceRuntimeAuthorityPayloadV1(
    payload,
  );

  return JSON.stringify({
    schemaVersion:
      payload.schemaVersion,

    purpose:
      payload.purpose,

    authorityId:
      payload.authorityId,

    sourceAuthorizationId:
      payload.sourceAuthorizationId,

    credentialId:
      payload.credentialId,

    activationId:
      payload.activationId,

    branchAccessGrantId:
      payload.branchAccessGrantId,

    storageEntitlementId:
      payload.storageEntitlementId,

    ownerId:
      payload.ownerId,

    businessId:
      payload.businessId,

    branchId:
      payload.branchId,

    businessCode:
      payload.businessCode,

    branchCode:
      payload.branchCode,

    ...(
      payload.businessProfile ===
        undefined
        ? {}
        : {
            businessProfile: {
              profileId:
                payload.businessProfile.profileId,

              ownerId:
                payload.businessProfile.ownerId,

              businessId:
                payload.businessProfile.businessId,

              branchId:
                payload.businessProfile.branchId,

              businessCode:
                payload.businessProfile.businessCode,

              branchCode:
                payload.businessProfile.branchCode,

              businessName:
                payload.businessProfile.businessName,

              branchName:
                payload.businessProfile.branchName,

              installationId:
                payload.businessProfile.installationId,

              bindingKeyId:
                payload.businessProfile.bindingKeyId,

              fingerprintAlgorithm:
                payload.businessProfile.fingerprintAlgorithm,

              publicKeyFingerprint:
                payload.businessProfile.publicKeyFingerprint,

              createdAt:
                payload.businessProfile.createdAt,

              updatedAt:
                payload.businessProfile.updatedAt,

              schemaVersion:
                payload.businessProfile.schemaVersion,
            },
          }
    ),

    userId:
      payload.userId,

    username:
      payload.username,

    canonicalUsername:
      payload.canonicalUsername,

    fullName:
      payload.fullName,

    role:
      payload.role,

    storageMode:
      payload.storageMode,

    dataContext:
      payload.dataContext,

    demoId:
      payload.demoId,

    authGeneration:
      payload.authGeneration,

    activationStatus:
      payload.activationStatus,

    ...(
      payload.activationActivatedAt ===
        undefined
        ? {}
        : {
            activationActivatedAt:
              payload.activationActivatedAt,
          }
    ),

    activationCreatedAt:
      payload.activationCreatedAt,

    activationUpdatedAt:
      payload.activationUpdatedAt,

    branchAccessType:
      payload.branchAccessType,

    registrationPayment:
      payload.registrationPayment ===
        null
        ? null
        : {
            amount:
              payload.registrationPayment.amount,

            currency:
              payload.registrationPayment.currency,

            paymentMode:
              payload.registrationPayment.paymentMode,

            paidAt:
              payload.registrationPayment.paidAt,

            ...(
              payload.registrationPayment.reference ===
                undefined
                ? {}
                : {
                    reference:
                      payload.registrationPayment.reference,
                  }
            ),

            ...(
              payload.registrationPayment.remarks ===
                undefined
                ? {}
                : {
                    remarks:
                      payload.registrationPayment.remarks,
                  }
            ),

            refundable:
              false,
          },

    registrationCycle:
      payload.registrationCycle,

    demoRemarks:
      payload.demoRemarks,

    accessMode:
      payload.accessMode,

    accessValidFrom:
      payload.accessValidFrom,

    accessValidUntil:
      payload.accessValidUntil,

    branchAccessCreatedAt:
      payload.branchAccessCreatedAt,

    branchAccessUpdatedAt:
      payload.branchAccessUpdatedAt,

    storageEntitlementStatus:
      payload.storageEntitlementStatus,

    storageEntitlementActivatedAt:
      payload.storageEntitlementActivatedAt,

    storageEntitlementCreatedAt:
      payload.storageEntitlementCreatedAt,

    storageEntitlementUpdatedAt:
      payload.storageEntitlementUpdatedAt,

    portableAuthFingerprint:
      payload.portableAuthFingerprint,

    issuedAt:
      payload.issuedAt,
  });
}

export function validateFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
  value:
    unknown,
): asserts value is FinoraPortableFreshDeviceRuntimeAuthorityPackageV1 {
  const packageValue =
    asObject(
      value,
      "Portable fresh-device runtime authority package",
    );

  assertExactKeys(
    packageValue,
    [
      "format",
      "schemaVersion",
      "payload",
      "signature",
    ],
    "Portable fresh-device runtime authority package",
  );

  if (
    packageValue.format !==
      FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_FORMAT ||
    packageValue.schemaVersion !==
      FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_SCHEMA_VERSION
  ) {
    throw new Error(
      "Portable fresh-device runtime authority package header is invalid.",
    );
  }

  validateFinoraPortableFreshDeviceRuntimeAuthorityPayloadV1(
    packageValue.payload,
  );

  const signature =
    asObject(
      packageValue.signature,
      "Portable fresh-device runtime authority signature",
    );

  assertExactKeys(
    signature,
    [
      "algorithm",
      "encoding",
      "canonicalization",
      "keyId",
      "value",
    ],
    "Portable fresh-device runtime authority signature",
  );

  for (
    const key of [
      "algorithm",
      "encoding",
      "canonicalization",
      "keyId",
      "value",
    ] as const
  ) {
    assertNonEmptyString(
      signature[key],
      `signature.${key}`,
    );
  }
}