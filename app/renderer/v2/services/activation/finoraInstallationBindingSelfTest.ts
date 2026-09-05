/* ===========================================================
   FINORA ENTERPRISE OS™

   INSTALLATION DEVICE BINDING SELF TEST
=========================================================== */

import type {
  FinoraInstallationDeviceBinding,
  FinoraInstallationEnrollmentRequest,
} from "../../types/activation/finoraInstallationBinding.types";

import {
  createFinoraInstallationBindingTarget,
  matchesFinoraInstallationBindingTarget,
  validateFinoraInstallationDeviceBinding,
  validateFinoraInstallationEnrollmentRequest,
} from "./finoraInstallationBindingValidation";

function assert(
  condition:
    boolean,

  message:
    string,
): void {

  if (!condition) {
    throw new Error(
      message,
    );
  }
}

const fingerprint =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const binding:
  FinoraInstallationDeviceBinding = {

    installationId:
      "FINORA-INSTALLATION-001",

    bindingKeyId:
      "FINORA-BINDING-KEY-001",

    platform:
      "WINDOWS",

    algorithm:
      "ECDSA_P256_SHA256",

    publicKeyFormat:
      "SPKI_DER_BASE64",

    publicKey:
      "QUJDRA==",

    fingerprintAlgorithm:
      "SHA-256",

    publicKeyFingerprint:
      fingerprint,

    createdAt:
      "2026-09-05T12:00:00.000Z",

    schemaVersion:
      1,
  };

assert(
  validateFinoraInstallationDeviceBinding(
    binding,
  ) === null,

  "Valid installation binding must pass validation.",
);

const target =
  createFinoraInstallationBindingTarget(
    binding,
  );

assert(
  matchesFinoraInstallationBindingTarget(
    binding,
    target,
  ),

  "Exact installation binding target must match.",
);

assert(
  !matchesFinoraInstallationBindingTarget(
    binding,
    {
      ...target,

      installationId:
        "FINORA-INSTALLATION-WRONG",
    },
  ),

  "Wrong installationId must fail binding.",
);

assert(
  !matchesFinoraInstallationBindingTarget(
    binding,
    {
      ...target,

      bindingKeyId:
        "FINORA-BINDING-KEY-WRONG",
    },
  ),

  "Wrong bindingKeyId must fail binding.",
);

assert(
  !matchesFinoraInstallationBindingTarget(
    binding,
    {
      ...target,

      publicKeyFingerprint:
        "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    },
  ),

  "Wrong public-key fingerprint must fail binding.",
);

const enrollment:
  FinoraInstallationEnrollmentRequest = {

    payload: {
      requestId:
        "FINORA-ENROLLMENT-001",

      deviceBinding:
        binding,

      requestedAt:
        "2026-09-05T12:00:01.000Z",

      schemaVersion:
        1,
    },

    signature: {
      algorithm:
        "ECDSA_P256_SHA256",

      encoding:
        "IEEE_P1363",

      canonicalization:
        "FINORA_CANONICAL_JSON_V1",

      bindingKeyId:
        binding.bindingKeyId,

      value:
        "QUJDRA==",
    },

    schemaVersion:
      1,
  };

assert(
  validateFinoraInstallationEnrollmentRequest(
    enrollment,
  ) === null,

  "Valid installation enrollment request structure must pass.",
);

assert(
  validateFinoraInstallationEnrollmentRequest({
    ...enrollment,

    signature: {
      ...enrollment.signature,

      bindingKeyId:
        "FINORA-BINDING-KEY-WRONG",
    },
  }) !== null,

  "Enrollment signature using the wrong binding key must fail.",
);

console.log(
  "PASS: Valid installation device binding accepted",
);

console.log(
  "PASS: Exact signed binding target accepted",
);

console.log(
  "PASS: Wrong installationId rejected",
);

console.log(
  "PASS: Wrong bindingKeyId rejected",
);

console.log(
  "PASS: Wrong public-key fingerprint rejected",
);

console.log(
  "PASS: Enrollment request requires matching binding key identity",
);

console.log(
  "PASS: FINORA installation device-binding contract verified",
);