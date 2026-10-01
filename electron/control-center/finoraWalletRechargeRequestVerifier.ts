/* ============================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER - WALLET RECHARGE REQUEST VERIFIER

   RESPONSIBILITY:

   - Accept one untrusted parsed Wallet Recharge Request.
   - Validate the complete V1 request structure.
   - Resolve the exact branch from the authoritative Branch Registry.
   - Require exact provisioned scope / code / installation identity.
   - Verify the branch installation IEEE-P1363 P-256 signature.
   - Return only a locked verified request summary.

   SECURITY:

   - Filename is never trusted.
   - Renderer cannot supply authoritative branch identity.
   - Registry public key is the verification authority.
   - Recipient private keys never exist here.
   - Control Center private signing material is not used here.
   - No Wallet credit occurs here.
   - No approval / decline state is persisted here.
============================================================ */

import {
  createHash,
} from "node:crypto";

import {
  canonicalizeFinoraControlCenterValue,
} from "./finoraControlCenterCanonicalization.js";

import {
  findFinoraControlCenterBranchRegistryRecord,
} from "./finoraControlCenterBranchRegistryStore.js";

import type {
  FinoraControlCenterBranchRegistryRecord,
} from "./finoraControlCenterBranchRegistry.types.js";

import {
  verifyFinoraInstallationBindingCanonicalValue,
} from "../control/finoraInstallationBindingCrypto.js";

import {
  verifyFinoraBranchCertificationCanonicalValue,
} from "../control/finoraBranchCertificationCrypto.js";

import type {
  FinoraBranchCertificationSignatureV1,
} from "../control/finoraBranchCertificationContract.js";

const REQUEST_FILE_FORMAT_V1 =
  "FINORA_WALLET_RECHARGE_REQUEST_V1" as const;

const REQUEST_FILE_FORMAT_V2 =
  "FINORA_WALLET_RECHARGE_REQUEST_V2" as const;

const REQUEST_PURPOSE =
  "WALLET_RECHARGE_REQUEST" as const;

const SIGNATURE_ALGORITHM =
  "ECDSA_P256_SHA256" as const;

const SIGNATURE_ENCODING =
  "IEEE_P1363" as const;

const CANONICALIZATION =
  "FINORA_CANONICAL_JSON_V1" as const;

const FINGERPRINT_ALGORITHM =
  "SHA-256" as const;

const CURRENCY =
  "INR" as const;

const PAYMENT_METHODS =
  new Set<string>([
    "UPI",
    "PHONEPE",
    "GOOGLE_PAY",
    "PAYTM",
    "RAZORPAY",
    "BANK_TRANSFER",
    "OTHER",
  ]);

const PAYMENT_SOURCES =
  new Set<string>([
    "PHONEPE",
    "RAZORPAY",
    "UPI",
    "GOOGLE_PAY",
    "PAYTM",
    "BANK_TRANSFER",
    "MANUAL",
  ]);

type NativePublicBinding =
  Parameters<
    typeof verifyFinoraInstallationBindingCanonicalValue
  >[2];

export interface FinoraVerifiedWalletRechargeRequest {
  requestId: string;
  paymentReference: string;

  target: {
    ownerId: string;
    businessId: string;
    branchId: string;
    businessCode: string;
    branchCode: string;
    installationId: string;
    bindingKeyId: string;
    fingerprintAlgorithm: typeof FINGERPRINT_ALGORITHM;
    publicKeyFingerprint: string;
  };

  amountMinor: number;
  currency: typeof CURRENCY;
  paymentMethod: string;
  paymentSource: string;
  requestedAt: string;
  schemaVersion: 1 | 2;
}

export type FinoraWalletRechargeRequestVerificationErrorCode =
  | "INVALID_STRUCTURE"
  | "INVALID_REQUEST_ID"
  | "BRANCH_NOT_REGISTERED"
  | "SCOPE_MISMATCH"
  | "INSTALLATION_MISMATCH"
  | "INVALID_SIGNATURE";

export type FinoraWalletRechargeRequestVerificationResult =
  | {
      success: true;
      data: FinoraVerifiedWalletRechargeRequest;
    }
  | {
      success: false;
      errorCode: FinoraWalletRechargeRequestVerificationErrorCode;
      error: string;
    };

function failure(
  errorCode: FinoraWalletRechargeRequestVerificationErrorCode,
  error: string,
): FinoraWalletRechargeRequestVerificationResult {
  return {
    success: false,
    errorCode,
    error,
  };
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();

  return (
    actual.length === wanted.length &&
    actual.every(
      (key, index) => key === wanted[index],
    )
  );
}

function hasText(
  value: unknown,
  maxLength: number,
): value is string {
  return (
    typeof value === "string" &&
    value.trim() === value &&
    value.length > 0 &&
    value.length <= maxLength
  );
}

function isCanonicalIsoTimestamp(
  value: unknown,
): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const parsed = new Date(value);

  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString() === value
  );
}

function isCanonicalFingerprint(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{64}$/.test(value)
  );
}

function createExpectedRequestId(
  ownerId: string,
  businessId: string,
  branchId: string,
  paymentReference: string,
): string {
  const digest =
    createHash("sha256")
      .update(
        [
          REQUEST_PURPOSE,
          ownerId,
          businessId,
          branchId,
          paymentReference,
        ].join("\u0000"),
        "utf8",
      )
      .digest("hex")
      .toUpperCase();

  return `FINORA-WAL-REQ-${digest}`;
}

export function verifyFinoraWalletRechargeRequestAgainstRegistryRecord(
  value: unknown,
  registryRecord: FinoraControlCenterBranchRegistryRecord,
): FinoraWalletRechargeRequestVerificationResult {
  if (
    !isRecord(value) ||
    !hasExactKeys(
      value,
      [
        "format",
        "request",
        "schemaVersion",
      ],
    ) ||
    !isRecord(value.request)
  ) {
    return failure(
      "INVALID_STRUCTURE",
      "FINORA Wallet Recharge Request file structure is invalid or unsupported.",
    );
  }

  const historicalV1 =
    value.format === REQUEST_FILE_FORMAT_V1 &&
    value.schemaVersion === 1;

  const portableV2 =
    value.format === REQUEST_FILE_FORMAT_V2 &&
    value.schemaVersion === 2;

  if (!historicalV1 && !portableV2) {
    return failure(
      "INVALID_STRUCTURE",
      "FINORA Wallet Recharge Request file structure is invalid or unsupported.",
    );
  }

  const request = value.request;

  const expectedRequestKeys =
    portableV2
      ? [
          "payload",
          "signature",
          "branchCertificationSignature",
          "schemaVersion",
        ]
      : [
          "payload",
          "signature",
          "schemaVersion",
        ];

  if (
    !hasExactKeys(
      request,
      expectedRequestKeys,
    ) ||
    request.schemaVersion !== (portableV2 ? 2 : 1) ||
    !isRecord(request.payload) ||
    !isRecord(request.signature) ||
    (
      portableV2 &&
      !isRecord(request.branchCertificationSignature)
    )
  ) {
    return failure(
      "INVALID_STRUCTURE",
      "FINORA Wallet Recharge Request signed envelope is invalid.",
    );
  }

  const payload = request.payload;

  const branchCertificationSignature =
    portableV2
      ? request.branchCertificationSignature
      : undefined;

  if (
    !hasExactKeys(
      payload,
      [
        "purpose",
        "requestId",
        "paymentReference",
        "scope",
        "displayIdentity",
        "installation",
        "amountMinor",
        "currency",
        "paymentMethod",
        "paymentSource",
        "requestedAt",
        "schemaVersion",
      ],
    ) ||
    payload.purpose !== REQUEST_PURPOSE ||
    payload.schemaVersion !== (portableV2 ? 2 : 1) ||
    !hasText(payload.requestId, 128) ||
    !hasText(payload.paymentReference, 256) ||
    !Number.isSafeInteger(payload.amountMinor) ||
    (payload.amountMinor as number) <= 0 ||
    payload.currency !== CURRENCY ||
    typeof payload.paymentMethod !== "string" ||
    !PAYMENT_METHODS.has(payload.paymentMethod) ||
    typeof payload.paymentSource !== "string" ||
    !PAYMENT_SOURCES.has(payload.paymentSource) ||
    !isCanonicalIsoTimestamp(payload.requestedAt) ||
    !isRecord(payload.scope) ||
    !isRecord(payload.displayIdentity) ||
    !isRecord(payload.installation)
  ) {
    return failure(
      "INVALID_STRUCTURE",
      "FINORA Wallet Recharge Request payload is invalid.",
    );
  }

  const scope = payload.scope;

  if (
    !hasExactKeys(
      scope,
      [
        "ownerId",
        "businessId",
        "branchId",
      ],
    ) ||
    !hasText(scope.ownerId, 128) ||
    !hasText(scope.businessId, 128) ||
    !hasText(scope.branchId, 128)
  ) {
    return failure(
      "INVALID_STRUCTURE",
      "FINORA Wallet Recharge Request scope is invalid.",
    );
  }

  const displayIdentity = payload.displayIdentity;

  if (
    !hasExactKeys(
      displayIdentity,
      [
        "businessCode",
        "branchCode",
      ],
    ) ||
    !hasText(displayIdentity.businessCode, 64) ||
    !hasText(displayIdentity.branchCode, 64)
  ) {
    return failure(
      "INVALID_STRUCTURE",
      "FINORA Wallet Recharge Request display identity is invalid.",
    );
  }

  const installation = payload.installation;

  if (
    portableV2
      ? (
          !hasExactKeys(
            installation,
            [
              "installationId",
              "bindingKeyId",
              "fingerprintAlgorithm",
              "publicKeyFingerprint",
              "platform",
              "algorithm",
              "publicKeyFormat",
              "publicKey",
              "createdAt",
              "schemaVersion",
            ],
          ) ||
          !hasText(installation.installationId, 256) ||
          !hasText(installation.bindingKeyId, 128) ||
          installation.fingerprintAlgorithm !== FINGERPRINT_ALGORITHM ||
          !isCanonicalFingerprint(installation.publicKeyFingerprint) ||
          !hasText(installation.platform, 64) ||
          installation.algorithm !== SIGNATURE_ALGORITHM ||
          installation.publicKeyFormat !== "SPKI_DER_BASE64" ||
          !hasText(installation.publicKey, 4096) ||
          !isCanonicalIsoTimestamp(installation.createdAt) ||
          installation.schemaVersion !== 1
        )
      : (
          !hasExactKeys(
            installation,
            [
              "installationId",
              "bindingKeyId",
              "fingerprintAlgorithm",
              "publicKeyFingerprint",
            ],
          ) ||
          !hasText(installation.installationId, 256) ||
          !hasText(installation.bindingKeyId, 128) ||
          installation.fingerprintAlgorithm !== FINGERPRINT_ALGORITHM ||
          !isCanonicalFingerprint(installation.publicKeyFingerprint)
        )
  ) {
    return failure(
      "INVALID_STRUCTURE",
      "FINORA Wallet Recharge Request installation identity is invalid.",
    );
  }

  const expectedBindingKeyId =
    `FINORA-BINDING-${(installation.publicKeyFingerprint as string)
      .slice(0, 32)
      .toUpperCase()}`;

  if (
    installation.bindingKeyId !== expectedBindingKeyId
  ) {
    return failure(
      "INVALID_STRUCTURE",
      "FINORA Wallet Recharge Request bindingKeyId is not canonical.",
    );
  }

  const expectedRequestId =
    createExpectedRequestId(
      scope.ownerId,
      scope.businessId,
      scope.branchId,
      payload.paymentReference,
    );

  if (
    payload.requestId !== expectedRequestId
  ) {
    return failure(
      "INVALID_REQUEST_ID",
      "FINORA Wallet Recharge Request requestId does not match its canonical payment identity.",
    );
  }

  const identity = registryRecord.identity;

  if (
    identity.ownerId !== scope.ownerId ||
    identity.businessId !== scope.businessId ||
    identity.branchId !== scope.branchId ||
    identity.businessCode !== displayIdentity.businessCode ||
    identity.branchCode !== displayIdentity.branchCode
  ) {
    return failure(
      "SCOPE_MISMATCH",
      "FINORA Wallet Recharge Request does not match the provisioned Branch Registry scope.",
    );
  }

  const registryInstallation = identity.installation;

  if (
    !portableV2 &&
    (
      registryInstallation.installationId !== installation.installationId ||
      registryInstallation.bindingKeyId !== installation.bindingKeyId ||
      registryInstallation.fingerprintAlgorithm !== installation.fingerprintAlgorithm ||
      registryInstallation.publicKeyFingerprint !== installation.publicKeyFingerprint
    )
  ) {
    return failure(
      "INSTALLATION_MISMATCH",
      "FINORA Wallet Recharge Request does not match the provisioned installation binding.",
    );
  }

  const signature = request.signature;

  if (
    !hasExactKeys(
      signature,
      [
        "algorithm",
        "encoding",
        "canonicalization",
        "bindingKeyId",
        "value",
      ],
    ) ||
    signature.algorithm !== SIGNATURE_ALGORITHM ||
    signature.encoding !== SIGNATURE_ENCODING ||
    signature.canonicalization !== CANONICALIZATION ||
    signature.bindingKeyId !== (portableV2 ? installation.bindingKeyId : registryInstallation.bindingKeyId) ||
    !hasText(signature.value, 512)
  ) {
    return failure(
      "INVALID_SIGNATURE",
      "FINORA Wallet Recharge Request signature envelope is invalid.",
    );
  }

  let signatureBytes: Buffer;

  try {
    signatureBytes =
      Buffer.from(
        signature.value,
        "base64",
      );
  } catch {
    return failure(
      "INVALID_SIGNATURE",
      "FINORA Wallet Recharge Request signature is not valid Base64.",
    );
  }

  if (
    signatureBytes.byteLength !== 64
  ) {
    return failure(
      "INVALID_SIGNATURE",
      "FINORA Wallet Recharge Request signature must be a canonical 64-byte IEEE-P1363 signature.",
    );
  }

  const publicBinding: NativePublicBinding = {
    installationId:
      registryInstallation.installationId,

    bindingKeyId:
      registryInstallation.bindingKeyId,

    platform:
      registryInstallation.platform,

    algorithm:
      registryInstallation.algorithm,

    publicKeyFormat:
      registryInstallation.publicKeyFormat,

    publicKey:
      registryInstallation.publicKey,

    fingerprintAlgorithm:
      registryInstallation.fingerprintAlgorithm,

    publicKeyFingerprint:
      registryInstallation.publicKeyFingerprint,

    createdAt:
      registryInstallation.bindingCreatedAt,

    schemaVersion:
      1,
  };

  const canonicalPayload =
    canonicalizeFinoraControlCenterValue(
      payload,
    );

  if (portableV2) {
    const certificationPublicKey =
      registryRecord.branchCertificationPublicKey;

    if (
      certificationPublicKey === undefined ||
      !isRecord(branchCertificationSignature) ||
      !hasExactKeys(
        branchCertificationSignature,
        [
          "algorithm",
          "encoding",
          "canonicalization",
          "keyId",
          "value",
        ],
      ) ||
      !hasText(
        branchCertificationSignature.value,
        512,
      )
    ) {
      return failure(
        "INVALID_SIGNATURE",
        "FINORA Wallet Recharge Request Branch Certification authority or signature envelope is invalid.",
      );
    }

    if (
      !verifyFinoraBranchCertificationCanonicalValue(
        canonicalPayload,
        branchCertificationSignature as unknown as FinoraBranchCertificationSignatureV1,
        certificationPublicKey,
      )
    ) {
      return failure(
        "INVALID_SIGNATURE",
        "FINORA Wallet Recharge Request Branch Certification signature verification failed.",
      );
    }
  }

  if (
    !portableV2 &&
    !verifyFinoraInstallationBindingCanonicalValue(
      canonicalPayload,
      signature.value,
      publicBinding,
    )
  ) {
    return failure(
      "INVALID_SIGNATURE",
      "FINORA Wallet Recharge Request installation signature verification failed.",
    );
  }

  return {
    success: true,

    data: {
      requestId:
        payload.requestId,

      paymentReference:
        payload.paymentReference,

      target: {
        ownerId:
          scope.ownerId,

        businessId:
          scope.businessId,

        branchId:
          scope.branchId,

        businessCode:
          displayIdentity.businessCode,

        branchCode:
          displayIdentity.branchCode,

        installationId:
          installation.installationId as string,

        bindingKeyId:
          installation.bindingKeyId,

        fingerprintAlgorithm:
          FINGERPRINT_ALGORITHM,

        publicKeyFingerprint:
          installation.publicKeyFingerprint as string,
      },

      amountMinor:
        payload.amountMinor as number,

      currency:
        CURRENCY,

      paymentMethod:
        payload.paymentMethod,

      paymentSource:
        payload.paymentSource,

      requestedAt:
        payload.requestedAt,

      schemaVersion:
        (portableV2 ? 2 : 1),
    },
  };
}

export async function verifyFinoraWalletRechargeRequest(
  value: unknown,
): Promise<
  FinoraWalletRechargeRequestVerificationResult
> {
  if (
    !isRecord(value) ||
    !isRecord(value.request) ||
    !isRecord(value.request.payload) ||
    !isRecord(value.request.payload.scope)
  ) {
    return failure(
      "INVALID_STRUCTURE",
      "FINORA Wallet Recharge Request does not contain a readable branch scope.",
    );
  }

  const scope = value.request.payload.scope;

  if (
    !hasText(scope.ownerId, 128) ||
    !hasText(scope.businessId, 128) ||
    !hasText(scope.branchId, 128)
  ) {
    return failure(
      "INVALID_STRUCTURE",
      "FINORA Wallet Recharge Request branch scope is invalid.",
    );
  }

  const registryRecord =
    await findFinoraControlCenterBranchRegistryRecord(
      scope.ownerId,
      scope.businessId,
      scope.branchId,
    );

  if (!registryRecord) {
    return failure(
      "BRANCH_NOT_REGISTERED",
      "FINORA Wallet Recharge Request does not match a registered Control Center branch.",
    );
  }

  return verifyFinoraWalletRechargeRequestAgainstRegistryRecord(
    value,
    registryRecord,
  );
}

/* ============================================================
   END
============================================================ */



