/* ===========================================================
   FINORA ENTERPRISE OS™

   INSTALLATION DEVICE BINDING VALIDATION

   MODULE  : Activation
   LAYER   : Domain Service
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Validate public installation binding metadata
   - Validate signed-package binding target metadata
   - Create an exact immutable target from an enrolled binding
   - Compare local binding against signed package target

   SECURITY:

   - Public metadata only.
   - No private key.
   - No signing capability.
   - No filesystem.
   - No storage mutation.
   - No Business Date.
=========================================================== */

import type {
  FinoraInstallationBindingTarget,
  FinoraInstallationDeviceBinding,
  FinoraInstallationEnrollmentPayload,
  FinoraInstallationEnrollmentRequest,
} from "../../types/activation/finoraInstallationBinding.types";

// ============================================================
// CONSTANTS
// ============================================================

const SHA256_HEX_PATTERN =
  /^[0-9a-f]{64}$/;

const STANDARD_BASE64_PATTERN =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

// ============================================================
// PRIMITIVES
// ============================================================

function hasText(
  value:
    unknown,
): value is string {

  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isIsoTimestamp(
  value:
    unknown,
): value is string {

  if (!hasText(value)) {
    return false;
  }

  const parsed =
    Date.parse(
      value,
    );

  return Number.isFinite(
    parsed,
  );
}

function isSha256Fingerprint(
  value:
    unknown,
): value is string {

  return (
    typeof value === "string" &&
    SHA256_HEX_PATTERN.test(
      value,
    )
  );
}

function isStandardBase64(
  value:
    unknown,
): value is string {

  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length % 4 === 0 &&
    STANDARD_BASE64_PATTERN.test(
      value,
    )
  );
}

// ============================================================
// DEVICE BINDING VALIDATION
// ============================================================

export function validateFinoraInstallationDeviceBinding(
  value:
    FinoraInstallationDeviceBinding,
): string | null {

  if (!hasText(value.installationId)) {
    return "FINORA installationId is required.";
  }

  if (!hasText(value.bindingKeyId)) {
    return "FINORA installation bindingKeyId is required.";
  }

  if (
    value.platform !== "WINDOWS" &&
    value.platform !== "ANDROID"
  ) {
    return "FINORA installation platform is invalid.";
  }

  if (
    value.algorithm !==
    "ECDSA_P256_SHA256"
  ) {
    return "FINORA installation binding algorithm is unsupported.";
  }

  if (
    value.publicKeyFormat !==
    "SPKI_DER_BASE64"
  ) {
    return "FINORA installation public-key format is unsupported.";
  }

  if (!isStandardBase64(value.publicKey)) {
    return "FINORA installation public key is invalid.";
  }

  if (
    value.fingerprintAlgorithm !==
    "SHA-256"
  ) {
    return "FINORA installation fingerprint algorithm is unsupported.";
  }

  if (
    !isSha256Fingerprint(
      value.publicKeyFingerprint,
    )
  ) {
    return "FINORA installation public-key fingerprint is invalid.";
  }

  if (!isIsoTimestamp(value.createdAt)) {
    return "FINORA installation binding createdAt is invalid.";
  }

  if (value.schemaVersion !== 1) {
    return "FINORA installation binding schema version is unsupported.";
  }

  return null;
}

// ============================================================
// TARGET VALIDATION
// ============================================================

export function validateFinoraInstallationBindingTarget(
  value:
    FinoraInstallationBindingTarget,
): string | null {

  if (!hasText(value.installationId)) {
    return "FINORA binding target installationId is required.";
  }

  if (!hasText(value.bindingKeyId)) {
    return "FINORA binding target bindingKeyId is required.";
  }

  if (
    value.fingerprintAlgorithm !==
    "SHA-256"
  ) {
    return "FINORA binding target fingerprint algorithm is unsupported.";
  }

  if (
    !isSha256Fingerprint(
      value.publicKeyFingerprint,
    )
  ) {
    return "FINORA binding target fingerprint is invalid.";
  }

  if (value.schemaVersion !== 1) {
    return "FINORA binding target schema version is unsupported.";
  }

  return null;
}

// ============================================================
// TARGET CREATION
// ============================================================

export function createFinoraInstallationBindingTarget(
  binding:
    FinoraInstallationDeviceBinding,
): FinoraInstallationBindingTarget {

  const validationError =
    validateFinoraInstallationDeviceBinding(
      binding,
    );

  if (validationError) {
    throw new Error(
      validationError,
    );
  }

  return {
    installationId:
      binding.installationId,

    bindingKeyId:
      binding.bindingKeyId,

    fingerprintAlgorithm:
      binding.fingerprintAlgorithm,

    publicKeyFingerprint:
      binding.publicKeyFingerprint,

    schemaVersion:
      1,
  };
}

// ============================================================
// EXACT TARGET MATCH
// ============================================================

export function matchesFinoraInstallationBindingTarget(
  binding:
    FinoraInstallationDeviceBinding,

  target:
    FinoraInstallationBindingTarget,
): boolean {

  if (
    validateFinoraInstallationDeviceBinding(
      binding,
    ) !== null
  ) {
    return false;
  }

  if (
    validateFinoraInstallationBindingTarget(
      target,
    ) !== null
  ) {
    return false;
  }

  return (
    binding.installationId ===
      target.installationId &&
    binding.bindingKeyId ===
      target.bindingKeyId &&
    binding.fingerprintAlgorithm ===
      target.fingerprintAlgorithm &&
    binding.publicKeyFingerprint ===
      target.publicKeyFingerprint
  );
}

// ============================================================
// ENROLLMENT PAYLOAD
// ============================================================

export function validateFinoraInstallationEnrollmentPayload(
  value:
    FinoraInstallationEnrollmentPayload,
): string | null {

  if (!hasText(value.requestId)) {
    return "FINORA installation enrollment requestId is required.";
  }

  const bindingError =
    validateFinoraInstallationDeviceBinding(
      value.deviceBinding,
    );

  if (bindingError) {
    return bindingError;
  }

  if (!isIsoTimestamp(value.requestedAt)) {
    return "FINORA installation enrollment requestedAt is invalid.";
  }

  if (value.schemaVersion !== 1) {
    return "FINORA installation enrollment schema version is unsupported.";
  }

  return null;
}

// ============================================================
// SIGNED ENROLLMENT REQUEST STRUCTURE
// ============================================================

export function validateFinoraInstallationEnrollmentRequest(
  value:
    FinoraInstallationEnrollmentRequest,
): string | null {

  const payloadError =
    validateFinoraInstallationEnrollmentPayload(
      value.payload,
    );

  if (payloadError) {
    return payloadError;
  }

  const signature =
    value.signature;

  if (
    signature.algorithm !==
    "ECDSA_P256_SHA256"
  ) {
    return "FINORA installation enrollment signature algorithm is unsupported.";
  }

  if (
    signature.encoding !==
    "IEEE_P1363"
  ) {
    return "FINORA installation enrollment signature encoding is unsupported.";
  }

  if (
    signature.canonicalization !==
    "FINORA_CANONICAL_JSON_V1"
  ) {
    return "FINORA installation enrollment canonicalization is unsupported.";
  }

  if (
    signature.bindingKeyId !==
    value.payload.deviceBinding.bindingKeyId
  ) {
    return "FINORA installation enrollment signature key does not match the device binding.";
  }

  if (!isStandardBase64(signature.value)) {
    return "FINORA installation enrollment signature is invalid.";
  }

  if (value.schemaVersion !== 1) {
    return "FINORA installation enrollment request schema version is unsupported.";
  }

  return null;
}

// ============================================================
// END
// ============================================================