/* ===========================================================
   FINORA ENTERPRISE OS™

   INSTALLATION ENROLLMENT REQUEST SERVICE

   MODULE  : Native Control
   LAYER   : Electron Main
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Ensure the native Windows installation binding exists
   - Build one public offline enrollment request payload
   - Canonicalize that payload with FINORA canonical JSON
   - Sign the payload with the native installation private key
   - Return only public binding material + possession proof

   SECURITY:

   - MAIN PROCESS ONLY.
   - No renderer.
   - No IPC.
   - No filesystem transport.
   - No Control Center private key access.
   - No Branch Activation authority.
   - No REGISTERED / DEMO authority.
   - No LOCAL / USB entitlement authority.
   - Native private binding key is never exported.
   - Enrollment proves installation-key possession only.
   - FINORA Control Center remains the authorization authority.
=========================================================== */

import {
  randomUUID,
} from "node:crypto";

import {
  canonicalizeFinoraControlCenterValue,
} from "../control-center/finoraControlCenterCanonicalization.js";

import {
  ensureFinoraWindowsInstallationBinding,
  signFinoraWindowsInstallationEnrollment,
} from "./finoraInstallationBindingService.js";

// ============================================================
// PUBLIC DEVICE BINDING
// ============================================================

export type FinoraWindowsInstallationEnrollmentDeviceBinding =
  Awaited<
    ReturnType<
      typeof ensureFinoraWindowsInstallationBinding
    >
  >;

// ============================================================
// ENROLLMENT PAYLOAD
// ============================================================

export interface FinoraWindowsInstallationEnrollmentPayload {

  requestId:
    string;

  deviceBinding:
    FinoraWindowsInstallationEnrollmentDeviceBinding;

  requestedAt:
    string;

  schemaVersion:
    1;
}

// ============================================================
// POSSESSION SIGNATURE
// ============================================================

export interface FinoraWindowsInstallationEnrollmentSignature {

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

// ============================================================
// SIGNED REQUEST
// ============================================================

export interface FinoraWindowsInstallationEnrollmentRequest {

  payload:
    FinoraWindowsInstallationEnrollmentPayload;

  signature:
    FinoraWindowsInstallationEnrollmentSignature;

  schemaVersion:
    1;
}

// ============================================================
// STRICT SIGNATURE ASSERTION
// ============================================================

function assertCanonicalP1363Signature(
  value:
    string,
): void {

  const decoded =
    Buffer.from(
      value,
      "base64",
    );

  if (
    decoded.byteLength !==
      64 ||
    decoded.toString(
      "base64",
    ) !==
      value
  ) {
    throw new Error(
      "FINORA installation enrollment possession proof must be a canonical 64-byte IEEE-P1363 Base64 signature.",
    );
  }
}

// ============================================================
// CREATE REQUEST
// ============================================================

export async function createFinoraWindowsInstallationEnrollmentRequest():
  Promise<
    FinoraWindowsInstallationEnrollmentRequest
  > {

  /*
   * ensureFinoraWindowsInstallationBinding() owns native
   * installation-binding creation/reconciliation.
   *
   * The private key remains inside the protected binding vault.
   */
  const deviceBinding =
    await ensureFinoraWindowsInstallationBinding();

  const payload:
    FinoraWindowsInstallationEnrollmentPayload = {

      requestId:
        `FINORA-ENROLLMENT-${randomUUID()}`,

      deviceBinding,

      requestedAt:
        new Date().toISOString(),

      schemaVersion:
        1,
    };

  /*
   * Sign exactly the canonical enrollment payload.
   *
   * This proves possession of the private key corresponding to
   * deviceBinding.publicKey. It grants no commercial authority.
   */
  const canonicalPayload =
    canonicalizeFinoraControlCenterValue(
      payload,
    );

  const signatureValue =
    await signFinoraWindowsInstallationEnrollment(
      canonicalPayload,
    );

  assertCanonicalP1363Signature(
    signatureValue,
  );

  if (
    deviceBinding.bindingKeyId.trim().length ===
      0
  ) {
    throw new Error(
      "FINORA installation enrollment bindingKeyId is unavailable.",
    );
  }

  return {
    payload,

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
      1,
  };
}

// ============================================================
// END
// ============================================================