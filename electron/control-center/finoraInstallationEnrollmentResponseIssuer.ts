/* ===========================================================
   FINORA ENTERPRISE OS™

   INSTALLATION ENROLLMENT RESPONSE ISSUER

   MODULE  : Control Center
   LAYER   : Privileged Main-Process Signing Authority
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Sign one dedicated Installation Enrollment Response
   - Reuse the existing Control Center encrypted signing key
   - Serialize against Control Center key rotation
   - Embed the exact active Control Center public trust key
   - Bind the response to the exact native installation target
   - Bind operator-assigned Owner / Business / Branch identity
   - Bind immutable Business / Branch numbering codes
   - Enforce a short bootstrap validity window

   SECURITY:

   - MAIN PROCESS ONLY.
   - No renderer imports.
   - No generic bootstrap signer IPC.
   - No private key leaves this boundary.
   - No recipient persistence.
   - No Branch Activation authority.
   - No Storage Entitlement authority.
=========================================================== */

import {
  canonicalizeFinoraControlCenterValue,
  createFinoraControlCenterPayloadDigest,
} from "./finoraControlCenterCanonicalization.js";

import {
  signFinoraControlCenterCanonicalValue,
} from "./finoraControlCenterCrypto.js";

import {
  runFinoraControlCenterKeyAuthoritySerialized,
} from "./finoraControlCenterKeyAuthorityQueue.js";

import {
  loadOrCreateFinoraControlCenterKeyVault,
} from "./finoraControlCenterKeyVault.js";

import {
  FINORA_INSTALLATION_ENROLLMENT_RESPONSE_PAYLOAD_VERSION,
  FINORA_INSTALLATION_ENROLLMENT_RESPONSE_PURPOSE,
  type FinoraInstallationEnrollmentInitialTrustedKey,
  type FinoraInstallationEnrollmentResponsePayload,
  type FinoraInstallationEnrollmentResponseTarget,
  type FinoraSignedInstallationEnrollmentResponse,
} from "../control/finoraInstallationEnrollmentResponse.types.js";

// ============================================================
// CONSTANTS
// ============================================================

export const FINORA_INSTALLATION_ENROLLMENT_RESPONSE_MAX_VALIDITY_MS =
  24 * 60 * 60 * 1000;

// ============================================================
// INPUT
// ============================================================

export interface SignFinoraInstallationEnrollmentResponseInput {

  responseId:
    string;

  requestId:
    string;

  sequence:
    number;

  issuedAt:
    string;

  expiresAt:
    string;

  target:
    FinoraInstallationEnrollmentResponseTarget;

  businessCode:
    string;

  branchCode:
    string;
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

function hasText(
  value:
    string,
  maxLength:
    number,
): boolean {

  return (
    value.trim().length >
      0 &&
    value.length <=
      maxLength
  );
}

function parseCanonicalTimestamp(
  value:
    string,
  label:
    string,
): number {

  const parsed =
    Date.parse(
      value,
    );

  if (
    !Number.isFinite(
      parsed,
    ) ||
    new Date(
      parsed,
    ).toISOString() !==
      value
  ) {
    throw new Error(
      `${label} must be a canonical ISO timestamp.`,
    );
  }

  return parsed;
}

function validateTarget(
  target:
    FinoraInstallationEnrollmentResponseTarget,
): void {

  if (
    !hasText(
      target.ownerId,
      256,
    ) ||
    !hasText(
      target.businessId,
      256,
    ) ||
    !hasText(
      target.branchId,
      256,
    ) ||
    !hasText(
      target.installationId,
      256,
    )
  ) {
    throw new Error(
      "FINORA Installation Enrollment Response target identity is incomplete.",
    );
  }

  if (
    target.fingerprintAlgorithm !==
      "SHA-256" ||
    !/^[0-9a-f]{64}$/.test(
      target.publicKeyFingerprint,
    )
  ) {
    throw new Error(
      "FINORA Installation Enrollment Response target fingerprint is invalid.",
    );
  }

  const expectedBindingKeyId =
    `FINORA-BINDING-${target.publicKeyFingerprint
      .slice(
        0,
        32,
      )
      .toUpperCase()}`;

  if (
    target.bindingKeyId !==
      expectedBindingKeyId
  ) {
    throw new Error(
      "FINORA Installation Enrollment Response bindingKeyId is not canonical for the verified installation fingerprint.",
    );
  }
}

function validateInput(
  input:
    SignFinoraInstallationEnrollmentResponseInput,
): void {

  if (
    !hasText(
      input.responseId,
      256,
    ) ||
    !input.responseId.startsWith(
      "FINORA-ENROLLMENT-RESPONSE-",
    )
  ) {
    throw new Error(
      "FINORA Installation Enrollment Response responseId is invalid.",
    );
  }

  if (
    !hasText(
      input.requestId,
      256,
    ) ||
    !input.requestId.startsWith(
      "FINORA-ENROLLMENT-",
    )
  ) {
    throw new Error(
      "FINORA Installation Enrollment Response requestId is invalid.",
    );
  }

  if (
    !Number.isSafeInteger(
      input.sequence,
    ) ||
    input.sequence <=
      0
  ) {
    throw new Error(
      "FINORA Installation Enrollment Response sequence must be a positive safe integer.",
    );
  }

  if (
    !hasText(
      input.businessCode,
      64,
    ) ||
    !hasText(
      input.branchCode,
      64,
    )
  ) {
    throw new Error(
      "FINORA Installation Enrollment Response Business and Branch numbering codes are required.",
    );
  }

  validateTarget(
    input.target,
  );

  const issuedAtMs =
    parseCanonicalTimestamp(
      input.issuedAt,
      "FINORA Installation Enrollment Response issuedAt",
    );

  const expiresAtMs =
    parseCanonicalTimestamp(
      input.expiresAt,
      "FINORA Installation Enrollment Response expiresAt",
    );

  if (
    expiresAtMs <=
      issuedAtMs
  ) {
    throw new Error(
      "FINORA Installation Enrollment Response expiry must be after issuedAt.",
    );
  }

  if (
    expiresAtMs -
      issuedAtMs >
      FINORA_INSTALLATION_ENROLLMENT_RESPONSE_MAX_VALIDITY_MS
  ) {
    throw new Error(
      "FINORA Installation Enrollment Response validity cannot exceed 24 hours.",
    );
  }
}

// ============================================================
// SIGN
// ============================================================

export function signFinoraInstallationEnrollmentResponse(
  input:
    SignFinoraInstallationEnrollmentResponseInput,
): Promise<
  FinoraSignedInstallationEnrollmentResponse
> {

  validateInput(
    input,
  );

  return runFinoraControlCenterKeyAuthoritySerialized(
    async () => {

      /*
       * The same key-authority queue used by normal Control Center
       * signing and key rotation owns this entire operation.
       *
       * Therefore the embedded initial public trust key and the
       * private key used for the response signature cannot observe
       * different signing-key generations.
       */

      const vault =
        await loadOrCreateFinoraControlCenterKeyVault();

      const initialTrustedKey:
        FinoraInstallationEnrollmentInitialTrustedKey = {

          issuerId:
            vault.issuerId,

          signingKeyId:
            vault.signingKeyId,

          algorithm:
            "ECDSA_P256_SHA256",

          format:
            "SPKI_DER_BASE64",

          publicKey:
            vault.publicKeySpkiDerBase64,

          status:
            "ACTIVE",

          validFrom:
            vault.createdAt,
        };

      const payload:
        FinoraInstallationEnrollmentResponsePayload = {

          requestId:
            input.requestId,

          businessCode:
            input.businessCode,

          branchCode:
            input.branchCode,

          initialTrustedKey,

          issuedAt:
            input.issuedAt,

          schemaVersion:
            1,
        };

      const unsignedResponse = {

        responseId:
          input.responseId,

        purpose:
          FINORA_INSTALLATION_ENROLLMENT_RESPONSE_PURPOSE,

        target:
          input.target,

        issuedAt:
          input.issuedAt,

        validity: {
          notBefore:
            input.issuedAt,

          expiresAt:
            input.expiresAt,
        },

        sequence:
          input.sequence,

        payloadVersion:
          FINORA_INSTALLATION_ENROLLMENT_RESPONSE_PAYLOAD_VERSION,

        payload,

        issuer: {
          type:
            "FINORA_CONTROL_CENTER" as const,

          issuerId:
            vault.issuerId,

          signingKeyId:
            vault.signingKeyId,
        },

        payloadDigest:
          createFinoraControlCenterPayloadDigest(
            payload,
          ),

        schemaVersion:
          1 as const,
      };

      const canonicalResponse =
        canonicalizeFinoraControlCenterValue(
          unsignedResponse,
        );

      const signature =
        signFinoraControlCenterCanonicalValue(
          canonicalResponse,
          vault.privateKeyPkcs8DerBase64,
        );

      return {
        ...unsignedResponse,

        signature: {
          algorithm:
            "ECDSA_P256_SHA256" as const,

          encoding:
            "IEEE_P1363" as const,

          canonicalization:
            "FINORA_CANONICAL_JSON_V1" as const,

          signingKeyId:
            vault.signingKeyId,

          value:
            signature,
        },
      };
    },
  );
}

// ============================================================
// END
// ============================================================