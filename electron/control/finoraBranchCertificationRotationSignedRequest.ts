import {
  canonicalizeFinoraControlCenterValue,
} from "../control-center/finoraControlCenterCanonicalization.js";

import {
  getFinoraWindowsInstallationBinding,
  signFinoraWindowsInstallationCanonicalValue,
} from "./finoraInstallationBindingService.js";

import {
  assertFinoraBranchCertificationRotationRequestFile,
} from "./finoraBranchCertificationRotationRequest.js";

import type {
  FinoraBranchCertificationRotationRequestFileV1,
} from "./finoraBranchCertificationRotationRequest.js";

// ============================================================
// CONTRACT
// ============================================================

export const FINORA_BRANCH_CERTIFICATION_ROTATION_SIGNED_REQUEST_SCHEMA_VERSION =
  1 as const;

export interface FinoraBranchCertificationRotationNativeSignatureV1 {

  algorithm:
    "ECDSA_P256_SHA256";

  encoding:
    "IEEE_P1363";

  canonicalization:
    "FINORA_CANONICAL_JSON_V1";

  bindingKeyId:
    string;

  value:
    string;
}

export type FinoraBranchCertificationRotationNativePublicBinding =
  NonNullable<
    Awaited<
      ReturnType<
        typeof getFinoraWindowsInstallationBinding
      >
    >
  >;

export interface FinoraBranchCertificationRotationSignedRequestV1 {

  requestFile:
    FinoraBranchCertificationRotationRequestFileV1;

  deviceBinding:
    FinoraBranchCertificationRotationNativePublicBinding;

  signature:
    FinoraBranchCertificationRotationNativeSignatureV1;

  schemaVersion:
    typeof FINORA_BRANCH_CERTIFICATION_ROTATION_SIGNED_REQUEST_SCHEMA_VERSION;
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

function hasText(
  value:
    unknown,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.length >
      0 &&
    value.length <=
      8192 &&
    value.trim() ===
      value
  );
}

function isCanonicalP1363Signature(
  value:
    unknown,
): value is string {

  if (
    typeof value !==
      "string"
  ) {
    return false;
  }

  let decoded:
    Buffer;

  try {
    decoded =
      Buffer.from(
        value,
        "base64",
      );
  }
  catch {
    return false;
  }

  return (
    decoded.byteLength ===
      64 &&
    decoded.toString(
      "base64",
    ) ===
      value
  );
}

function assertDeviceBindingShape(
  value:
    unknown,
): asserts value is FinoraBranchCertificationRotationNativePublicBinding {

  if (
    !isRecord(
      value,
    ) ||
    Object.prototype.hasOwnProperty.call(
      value,
      "privateKey",
    ) ||
    !hasText(
      value.installationId,
    ) ||
    !hasText(
      value.bindingKeyId,
    ) ||
    !hasText(
      value.publicKey,
    ) ||
    !hasText(
      value.publicKeyFingerprint,
    ) ||
    value.fingerprintAlgorithm !==
      "SHA-256"
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation native public binding is invalid.",
    );
  }
}

// ============================================================
// STRICT STRUCTURE ASSERTION
// ============================================================

export function assertFinoraBranchCertificationRotationSignedRequest(
  value:
    unknown,
): asserts value is FinoraBranchCertificationRotationSignedRequestV1 {

  if (
    !isRecord(
      value,
    ) ||
    Object.keys(
      value,
    ).sort().join(
      "|",
    ) !==
      [
        "requestFile",
        "deviceBinding",
        "signature",
        "schemaVersion",
      ].sort().join(
        "|",
      ) ||
    value.schemaVersion !==
      FINORA_BRANCH_CERTIFICATION_ROTATION_SIGNED_REQUEST_SCHEMA_VERSION
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation signed request structure is invalid.",
    );
  }

  assertFinoraBranchCertificationRotationRequestFile(
    value.requestFile,
  );

  assertDeviceBindingShape(
    value.deviceBinding,
  );

  if (
    !isRecord(
      value.signature,
    ) ||
    Object.keys(
      value.signature,
    ).sort().join(
      "|",
    ) !==
      [
        "algorithm",
        "encoding",
        "canonicalization",
        "bindingKeyId",
        "value",
      ].sort().join(
        "|",
      ) ||
    value.signature.algorithm !==
      "ECDSA_P256_SHA256" ||
    value.signature.encoding !==
      "IEEE_P1363" ||
    value.signature.canonicalization !==
      "FINORA_CANONICAL_JSON_V1" ||
    value.signature.bindingKeyId !==
      value.deviceBinding.bindingKeyId ||
    !isCanonicalP1363Signature(
      value.signature.value,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation native possession signature is invalid.",
    );
  }

  const request =
    value.requestFile.request;

  if (
    request.requestingInstallationId !==
      value.deviceBinding.installationId ||
    request.requestingBindingKeyId !==
      value.deviceBinding.bindingKeyId ||
    request.requestingFingerprintAlgorithm !==
      value.deviceBinding.fingerprintAlgorithm ||
    request.requestingPublicKeyFingerprint !==
      value.deviceBinding.publicKeyFingerprint
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation request does not match the native installation binding.",
    );
  }
}

// ============================================================
// CREATE
// ============================================================

export async function createFinoraBranchCertificationRotationSignedRequest(
  requestFile:
    FinoraBranchCertificationRotationRequestFileV1,
): Promise<
  FinoraBranchCertificationRotationSignedRequestV1
> {

  assertFinoraBranchCertificationRotationRequestFile(
    requestFile,
  );

  const deviceBinding =
    await getFinoraWindowsInstallationBinding();

  if (
    deviceBinding ===
      undefined
  ) {
    throw new Error(
      "FINORA Windows installation binding is unavailable for Branch Certification Rotation.",
    );
  }

  const request =
    requestFile.request;

  if (
    request.requestingInstallationId !==
      deviceBinding.installationId ||
    request.requestingBindingKeyId !==
      deviceBinding.bindingKeyId ||
    request.requestingFingerprintAlgorithm !==
      deviceBinding.fingerprintAlgorithm ||
    request.requestingPublicKeyFingerprint !==
      deviceBinding.publicKeyFingerprint
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation pending request is not bound to this native installation.",
    );
  }

  const canonicalRequest =
    canonicalizeFinoraControlCenterValue(
      requestFile,
    );

  const signatureValue =
    await signFinoraWindowsInstallationCanonicalValue(
      canonicalRequest,
    );

  if (
    !isCanonicalP1363Signature(
      signatureValue,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation native signer returned a non-canonical signature.",
    );
  }

  const signed:
    FinoraBranchCertificationRotationSignedRequestV1 = {

      requestFile,

      deviceBinding: {
        ...deviceBinding,
      },

      signature: {
        algorithm:
          "ECDSA_P256_SHA256",

        encoding:
          "IEEE_P1363",

        canonicalization:
          "FINORA_CANONICAL_JSON_V1",

        bindingKeyId:
          deviceBinding.bindingKeyId,

        value:
          signatureValue,
      },

      schemaVersion:
        FINORA_BRANCH_CERTIFICATION_ROTATION_SIGNED_REQUEST_SCHEMA_VERSION,
    };

  assertFinoraBranchCertificationRotationSignedRequest(
    signed,
  );

  return signed;
}