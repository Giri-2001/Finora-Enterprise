import {
  createHash,
} from "node:crypto";

import {
  assertFinoraP256SpkiPublicKey,
  verifyFinoraInstallationBindingCanonicalValue,
} from "../control/finoraInstallationBindingCrypto.js";

import {
  assertFinoraBranchCertificationRotationSignedRequest,
} from "../control/finoraBranchCertificationRotationSignedRequest.js";

import type {
  FinoraBranchCertificationRotationSignedRequestV1,
} from "../control/finoraBranchCertificationRotationSignedRequest.js";

import {
  canonicalizeFinoraControlCenterValue,
} from "./finoraControlCenterCanonicalization.js";

// ============================================================
// VERIFIED RESULT
// ============================================================

export interface FinoraVerifiedBranchCertificationRotationRequest {

  request:
    FinoraBranchCertificationRotationSignedRequestV1[
      "requestFile"
    ]["request"];

  deviceBinding:
    FinoraBranchCertificationRotationSignedRequestV1[
      "deviceBinding"
    ];

  schemaVersion:
    1;
}

// ============================================================
// VERIFY
// ============================================================

export function verifyFinoraBranchCertificationRotationSignedRequest(
  value:
    unknown,
): FinoraVerifiedBranchCertificationRotationRequest {

  assertFinoraBranchCertificationRotationSignedRequest(
    value,
  );

  const deviceBinding =
    value.deviceBinding;

  /*
   * Verify the supplied public key is a valid P-256 SPKI key.
   */
  assertFinoraP256SpkiPublicKey(
    deviceBinding.publicKey,
  );

  const publicKeyDer =
    Buffer.from(
      deviceBinding.publicKey,
      "base64",
    );

  if (
    publicKeyDer.byteLength ===
      0 ||
    publicKeyDer.toString(
      "base64",
    ) !==
      deviceBinding.publicKey
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation native public key encoding is invalid.",
    );
  }

  const derivedFingerprint =
    createHash(
      "sha256",
    )
      .update(
        publicKeyDer,
      )
      .digest(
        "hex",
      );

  if (
    derivedFingerprint !==
      deviceBinding.publicKeyFingerprint
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation native public-key fingerprint is invalid.",
    );
  }

  const expectedBindingKeyId =
    `FINORA-BINDING-${derivedFingerprint
      .slice(
        0,
        32,
      )
      .toUpperCase()}`;

  if (
    deviceBinding.bindingKeyId !==
      expectedBindingKeyId
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation native bindingKeyId is not canonical.",
    );
  }

  const request =
    value.requestFile.request;

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
      "FINORA Branch Certification Rotation signed request target does not match its native public binding.",
    );
  }

  const canonicalRequest =
    canonicalizeFinoraControlCenterValue(
      value.requestFile,
    );

  const signatureValid =
    verifyFinoraInstallationBindingCanonicalValue(
      canonicalRequest,
      value.signature.value,
      deviceBinding,
    );

  if (
    !signatureValid
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation native possession signature verification failed.",
    );
  }

  return {
    request: {
      ...request,


      replacementCertificationPublicKey: {
        ...request.replacementCertificationPublicKey,
      },
    },

    deviceBinding: {
      ...deviceBinding,
    },

    schemaVersion:
      1,
  };
}