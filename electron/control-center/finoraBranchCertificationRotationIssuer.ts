import {
  getOrCreateFinoraBranchCertificationRotationIssuedPackage,
} from "./finoraBranchCertificationRotationIssuanceJournal.js";
import {
  FINORA_BRANCH_CERTIFICATION_ROTATION_PAYLOAD_VERSION,
  FINORA_BRANCH_CERTIFICATION_ROTATION_PURPOSE,
  assertFinoraBranchCertificationRotationPayload,
} from "../control/finoraBranchCertificationRotationContract.js";

import type {
  FinoraBranchCertificationRotationPayloadV1,
} from "../control/finoraBranchCertificationRotationContract.js";

import type {
  FinoraVerifiedBranchCertificationRotationRequest,
} from "./finoraBranchCertificationRotationRequestVerifier.js";

import {
  findFinoraControlCenterBranchRegistryRecord,
} from "./finoraControlCenterBranchRegistryStore.js";

import type {
  FinoraControlCenterBranchInstallationIdentity,
} from "./finoraControlCenterBranchRegistry.types.js";

import {
  reserveFinoraControlCenterIssuance,
} from "./finoraControlCenterIssuanceLedger.js";

import {
  signFinoraControlCenterPackage,
} from "./finoraControlCenterSigner.js";

import type {
  FinoraControlCenterPackageValidity,
  FinoraControlCenterSignedPackage,
} from "./finoraControlCenterSigner.js";

// ============================================================
// INPUT
// ============================================================

export interface IssueFinoraBranchCertificationRotationPackageInput {

  verifiedRequest:
    FinoraVerifiedBranchCertificationRotationRequest;

  packageValidity?:
    FinoraControlCenterPackageValidity;
}

// ============================================================
// EXACT AUTHORITY COMPARATORS
// ============================================================

function registryInstallationMatchesRequestDevice(
  registryInstallation:
    FinoraControlCenterBranchInstallationIdentity,

  requestDevice:
    FinoraVerifiedBranchCertificationRotationRequest[
      "deviceBinding"
    ],
): boolean {

  return (
    registryInstallation.installationId ===
      requestDevice.installationId &&
    registryInstallation.bindingKeyId ===
      requestDevice.bindingKeyId &&
    registryInstallation.platform ===
      requestDevice.platform &&
    registryInstallation.algorithm ===
      requestDevice.algorithm &&
    registryInstallation.publicKeyFormat ===
      requestDevice.publicKeyFormat &&
    registryInstallation.publicKey ===
      requestDevice.publicKey &&
    registryInstallation.fingerprintAlgorithm ===
      requestDevice.fingerprintAlgorithm &&
    registryInstallation.publicKeyFingerprint ===
      requestDevice.publicKeyFingerprint &&
    registryInstallation.bindingCreatedAt ===
      requestDevice.createdAt
  );
}

// ============================================================
// ISSUE
// ============================================================

async function issueFinoraBranchCertificationRotationPackageInternal(
  input:
    IssueFinoraBranchCertificationRotationPackageInput,
): Promise<
  FinoraControlCenterSignedPackage<
    FinoraBranchCertificationRotationPayloadV1
  >
> {

  const verified =
    input.verifiedRequest;

  const request =
    verified.request;

  /*
   * PRE-FLIGHT 1:
   * Branch scope must already exist in authoritative Registry.
   *
   * No issuance sequence is reserved before all preflights pass.
   */
  const registryRecord =
    await findFinoraControlCenterBranchRegistryRecord(
      request.ownerId,
      request.businessId,
      request.branchId,
    );

  if (
    registryRecord ===
      undefined
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation rejected an unknown Branch Registry scope.",
    );
  }

  /*
   * PRE-FLIGHT 2:
   *
   * The Control Center Branch Registry is authoritative for the
   * full currently pinned Branch Certification public key.
   *
   * Legacy owner installations can legitimately lack the old
   * public key and even its local keyId evidence after bootstrap
   * custody was lost.
   *
   * When the owner supplies previousCertificationKeyId, treat it
   * as additional stale/foreign-anchor evidence and require an
   * exact Registry keyId match.
   *
   * When it is absent, authorization still requires the exact
   * registered branch scope plus an already-authorized native
   * installation possession proof.
   */
  const currentCertification =
    registryRecord.branchCertificationPublicKey;

  if (
    currentCertification ===
      undefined
  ) {
    if (
      request.previousCertificationKeyId !==
        undefined
    ) {
      throw new Error(
        "FINORA legacy Branch Certification adoption rejected unexpected previous certification keyId evidence.",
      );
    }

    if (
      registryRecord.branchCertificationRotation !==
        undefined
    ) {
      throw new Error(
        "FINORA legacy Branch Certification adoption rejected prior Registry certification-rotation evidence.",
      );
    }
  }
  else if (
    request.previousCertificationKeyId !==
      undefined &&
    request.previousCertificationKeyId !==
      currentCertification.keyId
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation previous certification keyId does not match the authoritative Registry anchor.",
    );
  }
  /*
   * PRE-FLIGHT 3:
   * The native proof-of-possession request must come from an
   * installation already represented as authorized Registry
   * evidence for this exact branch.
   *
   * Initial provisioned installation remains valid evidence.
   * authorizedDevices is also checked for future registry
   * portability migration compatibility.
   */
  const provisionedDeviceMatch =
    registryInstallationMatchesRequestDevice(
      registryRecord.identity.installation,
      verified.deviceBinding,
    );

  const authorizedDeviceMatch =
    registryRecord.authorizedDevices.some(
      (
        authorized,
      ) =>
        registryInstallationMatchesRequestDevice(
          authorized.installation,
          verified.deviceBinding,
        ),
    );

  if (
    !provisionedDeviceMatch &&
    !authorizedDeviceMatch
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation requesting installation is not authorized for this branch.",
    );
  }

  /*
   * Sequence reservation happens only after immutable Registry
   * authority and requesting-device authorization pass.
   */
  const reservation =
    await reserveFinoraControlCenterIssuance({
      purpose:
        FINORA_BRANCH_CERTIFICATION_ROTATION_PURPOSE,

      scope: {
        ownerId:
          request.ownerId,

        businessId:
          request.businessId,

        branchId:
          request.branchId,

        installationId:
          request.requestingInstallationId,
      },
    });

  const payload:
    FinoraBranchCertificationRotationPayloadV1 = {

      payloadVersion:
        FINORA_BRANCH_CERTIFICATION_ROTATION_PAYLOAD_VERSION,

      requestId:
        request.requestId,

      ownerId:
        request.ownerId,

      businessId:
        request.businessId,

      branchId:
        request.branchId,

      requestingInstallationId:
        request.requestingInstallationId,

      requestingBindingKeyId:
        request.requestingBindingKeyId,

      requestingFingerprintAlgorithm:
        request.requestingFingerprintAlgorithm,

      requestingPublicKeyFingerprint:
        request.requestingPublicKeyFingerprint,

      authStateId:
        request.authStateId,

      authGeneration:
        request.authGeneration,

      portableAuthFingerprintAlgorithm:
        request.portableAuthFingerprintAlgorithm,

      portableAuthFingerprint:
        request.portableAuthFingerprint,

      ...(
        currentCertification ===
          undefined
          ? {
              legacyCertificationAdoption:
                true as const,
            }
          : {
              previousCertificationPublicKey: {
                ...currentCertification,
              },
            }
      ),

      replacementCertificationPublicKey: {
        ...request.replacementCertificationPublicKey,
      },

      recoveryReason:
        request.recoveryReason,

      requestedAt:
        request.requestedAt,

      approvedAt:
        reservation.issuedAt,
    };

  assertFinoraBranchCertificationRotationPayload(
    payload,
  );

  return signFinoraControlCenterPackage({
    packageId:
      reservation.packageId,

    purpose:
      FINORA_BRANCH_CERTIFICATION_ROTATION_PURPOSE,

    target: {
      ownerId:
        request.ownerId,

      businessId:
        request.businessId,

      branchId:
        request.branchId,

      installationId:
        request.requestingInstallationId,

      bindingKeyId:
        request.requestingBindingKeyId,

      fingerprintAlgorithm:
        request.requestingFingerprintAlgorithm,

      publicKeyFingerprint:
        request.requestingPublicKeyFingerprint,
    },

    issuedAt:
      reservation.issuedAt,

    ...(
      input.packageValidity ===
        undefined
        ? {}
        : {
            validity:
              input.packageValidity,
          }
    ),

    sequence:
      reservation.sequence,

    payloadVersion:
      FINORA_BRANCH_CERTIFICATION_ROTATION_PAYLOAD_VERSION,

    payload,

    schemaVersion:
      1,
  });
}

// ============================================================
// DURABLE IDEMPOTENT PUBLIC ISSUER
//
// requestId lookup -> first issue -> encrypted durable journal
// write completes before the signed package is returned to the
// export transaction.
//
// Exact retry therefore returns the original packageId,
// sequence, issuedAt and signature instead of issuing again.
// ============================================================

export async function issueFinoraBranchCertificationRotationPackage(
  input:
    IssueFinoraBranchCertificationRotationPackageInput,
): Promise<
  FinoraControlCenterSignedPackage<
    FinoraBranchCertificationRotationPayloadV1
  >
> {

  return getOrCreateFinoraBranchCertificationRotationIssuedPackage<
    FinoraControlCenterSignedPackage<
      FinoraBranchCertificationRotationPayloadV1
    >
  >(
    input.verifiedRequest,
    () =>
      issueFinoraBranchCertificationRotationPackageInternal(
        input,
      ),
  );
}
