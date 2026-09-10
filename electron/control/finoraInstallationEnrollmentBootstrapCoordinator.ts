/* ===========================================================
   FINORA ENTERPRISE OS™

   INSTALLATION ENROLLMENT BOOTSTRAP COORDINATOR

   MODULE  : Native Control
   LAYER   : Electron Main / Bootstrap Mutation Authority
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Revalidate pending Enrollment Request provenance
   - Revalidate the current native installation binding
   - Preflight any existing recipient trust
   - Preflight any existing installation identity
   - Latch the first verified Enrollment Response
   - Bootstrap initial recipient trust when absent
   - Recover idempotently from an exact already-persisted trust
   - Persist immutable installation identity when absent
   - Recover idempotently from an exact already-persisted identity
   - Read back and confirm both authorities
   - Clear the exact pending Enrollment Request LAST

   CRASH / RETRY:

   - Crash before latch:
       same verified response may retry.

   - Crash after latch:
       only the exact same response digest may retry.

   - Crash after trust persistence:
       exact existing trust is accepted as recovery.

   - Crash after installation persistence:
       exact existing installation is accepted as recovery.

   - Pending request is cleared only after trust + installation
     read-back confirmation.

   SECURITY:

   - ELECTRON MAIN PROCESS ONLY.
   - No IPC registration.
   - No preload.
   - No renderer.
   - No filesystem path authority.
   - No REGISTERED / DEMO authority.
   - No branch activation mutation.
   - No storage entitlement mutation.
   - Business Date has zero authority.
=========================================================== */


import {
  getFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  clearFinoraPendingInstallationEnrollment,
  latchFinoraPendingInstallationEnrollmentResponse,
  loadFinoraPendingInstallationEnrollment,
} from "./finoraInstallationEnrollmentPendingStore.js";

import {
  bootstrapFinoraRecipientTrust,
} from "./finoraRecipientTrustBootstrapService.js";

import {
  loadFinoraRecipientTrustStore,
} from "./finoraRecipientTrustStore.js";

import type {
  FinoraRecipientTrustStoreState,
} from "./finoraRecipientTrustStore.js";

import {
  getFinoraInstallationIdentity,
  saveFinoraInstallationIdentity,
} from "./finoraControlStore.js";

import type {
  FinoraControlInstallationIdentity,
} from "./finoraControlStore.js";

import {
  createFinoraVerifiedInstallationEnrollmentResponseDigest,
} from "./finoraInstallationEnrollmentResponseVerifier.js";

import type {
  FinoraVerifiedInstallationEnrollmentResponse,
} from "./finoraInstallationEnrollmentResponseVerifier.js";

// ============================================================
// RESULT
// ============================================================

export type FinoraInstallationEnrollmentBootstrapResult =
  | {
      success:
        true;

      data: {
        responseId:
          string;

        requestId:
          string;

        installationId:
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

        trustRecovered:
          boolean;

        installationRecovered:
          boolean;

        completedAt:
          string;
      };
    }
  | {
      success:
        false;

      error:
        string;
    };

// ============================================================
// FAILURE
// ============================================================

function failure(
  error:
    string,
): FinoraInstallationEnrollmentBootstrapResult {

  return {
    success:
      false,

    error,
  };
}

// ============================================================
// SERIALIZATION
// ============================================================

let enrollmentBootstrapQueue:
  Promise<void> =
    Promise.resolve();

function runEnrollmentBootstrapSerialized<T>(
  operation:
    () => Promise<T>,
): Promise<T> {

  const result =
    enrollmentBootstrapQueue.then(
      operation,
      operation,
    );

  enrollmentBootstrapQueue =
    result.then(
      () =>
        undefined,
      () =>
        undefined,
    );

  return result;
}

// ============================================================
// EXACT INITIAL TRUST RECOVERY
// ============================================================

function isExactInitialTrustRecoveryState(
  trustStore:
    FinoraRecipientTrustStoreState,

  response:
    FinoraVerifiedInstallationEnrollmentResponse,
): boolean {

  /*
   * bootstrapFinoraRecipientTrust() writes exactly:
   *
   * {
   *   schemaVersion: 1,
   *   trustedKeys: [initialKey]
   * }
   *
   * Recovery deliberately accepts only that pristine initial
   * bootstrap state. Trust-transition/recovery state is not an
   * Enrollment Response recovery surface.
   */
  const storeKeys =
    Object.keys(
      trustStore,
    ).sort();

  if (
    storeKeys.length !==
      2 ||
    storeKeys[0] !==
      "schemaVersion" ||
    storeKeys[1] !==
      "trustedKeys" ||
    trustStore.schemaVersion !==
      1 ||
    trustStore.trustedKeys.length !==
      1
  ) {
    return false;
  }

  const existingKey =
    trustStore.trustedKeys[0];

  const expectedKey =
    response.trustedKey;

  return (
    existingKey.issuerId ===
      expectedKey.issuerId &&
    existingKey.signingKeyId ===
      expectedKey.signingKeyId &&
    existingKey.algorithm ===
      expectedKey.algorithm &&
    existingKey.format ===
      expectedKey.format &&
    existingKey.publicKey ===
      expectedKey.publicKey &&
    existingKey.status ===
      "ACTIVE" &&
    existingKey.validFrom ===
      expectedKey.validFrom &&
    existingKey.validUntil ===
      undefined
  );
}

// ============================================================
// EXACT INSTALLATION RECOVERY
// ============================================================

function isExactInstallationRecoveryState(
  installation:
    FinoraControlInstallationIdentity,

  response:
    FinoraVerifiedInstallationEnrollmentResponse,
): boolean {

  return (
    installation.installationId ===
      response.target.installationId &&
    installation.ownerId ===
      response.target.ownerId &&
    installation.businessId ===
      response.target.businessId &&
    installation.branchId ===
      response.target.branchId &&
    installation.businessCode ===
      response.businessCode &&
    installation.branchCode ===
      response.branchCode &&
    installation.schemaVersion ===
      1
  );
}


// ============================================================
// APPLY
// ============================================================

export function applyVerifiedFinoraInstallationEnrollmentResponse(
  response:
    FinoraVerifiedInstallationEnrollmentResponse,
): Promise<
  FinoraInstallationEnrollmentBootstrapResult
> {

  return runEnrollmentBootstrapSerialized(
    async () => {

      try {

        // ----------------------------------------------------
        // LOCAL PENDING PROVENANCE REVALIDATION
        // ----------------------------------------------------

        const pending =
          await loadFinoraPendingInstallationEnrollment();

        if (!pending) {
          return failure(
            "FINORA protected pending Installation Enrollment Request is unavailable.",
          );
        }

        if (
          pending.requestId !==
            response.requestId
        ) {
          return failure(
            "FINORA verified Enrollment Response does not match the protected pending requestId.",
          );
        }

        // ----------------------------------------------------
        // CURRENT NATIVE BINDING REVALIDATION
        // ----------------------------------------------------

        const nativeBinding =
          await getFinoraWindowsInstallationBinding();

        if (!nativeBinding) {
          return failure(
            "FINORA native installation binding is unavailable during Enrollment bootstrap.",
          );
        }

        if (
          pending.installationId !==
            nativeBinding.installationId ||
          pending.bindingKeyId !==
            nativeBinding.bindingKeyId ||
          pending.fingerprintAlgorithm !==
            nativeBinding.fingerprintAlgorithm ||
          pending.publicKeyFingerprint !==
            nativeBinding.publicKeyFingerprint
        ) {
          return failure(
            "FINORA protected pending Enrollment Request no longer matches the current native installation binding.",
          );
        }

        if (
          response.target.installationId !==
            nativeBinding.installationId ||
          response.target.bindingKeyId !==
            nativeBinding.bindingKeyId ||
          response.target.fingerprintAlgorithm !==
            nativeBinding.fingerprintAlgorithm ||
          response.target.publicKeyFingerprint !==
            nativeBinding.publicKeyFingerprint
        ) {
          return failure(
            "FINORA verified Enrollment Response no longer targets the current native installation binding.",
          );
        }

        // ----------------------------------------------------
        // PREFLIGHT EXISTING TRUST
        //
        // Never mutate trust if an incompatible root already
        // exists.
        // ----------------------------------------------------

        let existingTrust =
          await loadFinoraRecipientTrustStore();

        let trustRecovered =
          false;

        if (
          existingTrust !==
            undefined
        ) {

          if (
            !isExactInitialTrustRecoveryState(
              existingTrust,
              response,
            )
          ) {
            return failure(
              "FINORA recipient trust already exists but does not exactly match this Enrollment Response.",
            );
          }

          trustRecovered =
            true;
        }

        // ----------------------------------------------------
        // PREFLIGHT EXISTING INSTALLATION
        //
        // Never bootstrap trust for an Enrollment Response that
        // conflicts with an already-established installation.
        // ----------------------------------------------------

        const installationBeforeResult =
          await getFinoraInstallationIdentity();

        if (
          !installationBeforeResult.success
        ) {
          return failure(
            installationBeforeResult.error ??
              "Unable to read the FINORA installation identity before Enrollment bootstrap.",
          );
        }

        let existingInstallation =
          installationBeforeResult.data;

        let installationRecovered =
          false;

        if (
          existingInstallation !==
            undefined
        ) {

          if (
            !isExactInstallationRecoveryState(
              existingInstallation,
              response,
            )
          ) {
            return failure(
              "FINORA installation identity already exists but does not exactly match this Enrollment Response.",
            );
          }

          installationRecovered =
            true;
        }

        // ----------------------------------------------------
        // FIRST MUTATION — LATCH VERIFIED RESPONSE
        // ----------------------------------------------------

        const responseDigest =
          createFinoraVerifiedInstallationEnrollmentResponseDigest(
            response,
          );

        await latchFinoraPendingInstallationEnrollmentResponse(
          response.requestId,
          response.responseId,
          responseDigest,
        );

        // ----------------------------------------------------
        // TRUST BOOTSTRAP / RECOVERY
        // ----------------------------------------------------

        if (
          existingTrust ===
            undefined
        ) {

          const bootstrapResult =
            await bootstrapFinoraRecipientTrust({
              trustedKey:
                response.trustedKey,

              expectedPublicKeyFingerprint:
                response.expectedControlCenterPublicKeyFingerprint,
            });

          if (
            !bootstrapResult.success
          ) {

            /*
             * The low-level bootstrap may have successfully
             * persisted the trust root and then failed during
             * its read-back confirmation.
             *
             * Reload and accept only an exact pristine state.
             */
            existingTrust =
              await loadFinoraRecipientTrustStore();

            if (
              existingTrust ===
                undefined ||
              !isExactInitialTrustRecoveryState(
                existingTrust,
                response,
              )
            ) {
              return failure(
                bootstrapResult.error,
              );
            }

            trustRecovered =
              true;

          } else {
            existingTrust =
              await loadFinoraRecipientTrustStore();
          }
        }

        // ----------------------------------------------------
        // TRUST READ-BACK CONFIRMATION
        // ----------------------------------------------------

        const confirmedTrust =
          existingTrust ??
          await loadFinoraRecipientTrustStore();

        if (
          confirmedTrust ===
            undefined ||
          !isExactInitialTrustRecoveryState(
            confirmedTrust,
            response,
          )
        ) {
          return failure(
            "FINORA Enrollment bootstrap recipient trust read-back confirmation failed.",
          );
        }

        // ----------------------------------------------------
        // INSTALLATION IDENTITY PERSIST / RECOVERY
        // ----------------------------------------------------

        if (
          existingInstallation ===
            undefined
        ) {

          const now =
            new Date().toISOString();

          const installationToPersist:
            FinoraControlInstallationIdentity = {

              installationId:
                response.target.installationId,

              ownerId:
                response.target.ownerId,

              businessId:
                response.target.businessId,

              branchId:
                response.target.branchId,

              businessCode:
                response.businessCode,

              branchCode:
                response.branchCode,

              createdAt:
                now,

              updatedAt:
                now,

              schemaVersion:
                1,
            };

          const saveResult =
            await saveFinoraInstallationIdentity(
              installationToPersist,
            );

          if (
            !saveResult.success
          ) {

            /*
             * Same recovery rule as trust:
             * if persistence happened before a later failure,
             * accept only exact immutable read-back state.
             */
            const recoveryResult =
              await getFinoraInstallationIdentity();

            if (
              !recoveryResult.success ||
              recoveryResult.data ===
                undefined ||
              !isExactInstallationRecoveryState(
                recoveryResult.data,
                response,
              )
            ) {
              return failure(
                saveResult.error ??
                  recoveryResult.error ??
                  "FINORA installation identity persistence failed.",
              );
            }

            existingInstallation =
              recoveryResult.data;

            installationRecovered =
              true;

          } else {
            existingInstallation =
              saveResult.data;
          }
        }

        // ----------------------------------------------------
        // INSTALLATION READ-BACK CONFIRMATION
        // ----------------------------------------------------

        const installationAfterResult =
          await getFinoraInstallationIdentity();

        if (
          !installationAfterResult.success ||
          installationAfterResult.data ===
            undefined ||
          !isExactInstallationRecoveryState(
            installationAfterResult.data,
            response,
          )
        ) {
          return failure(
            installationAfterResult.error ??
              "FINORA Enrollment bootstrap installation identity read-back confirmation failed.",
          );
        }

        // ----------------------------------------------------
        // FINAL MUTATION — CLEAR EXACT PENDING REQUEST
        //
        // This must remain after both authority read-backs.
        // ----------------------------------------------------

        const pendingCleared =
          await clearFinoraPendingInstallationEnrollment(
            response.requestId,
          );

        if (!pendingCleared) {
          return failure(
            "FINORA Enrollment bootstrap completed its authority writes, but the exact pending request could not be cleared.",
          );
        }

        const completedAt =
          new Date().toISOString();

        return {
          success:
            true,

          data: {
            responseId:
              response.responseId,

            requestId:
              response.requestId,

            installationId:
              response.target.installationId,

            ownerId:
              response.target.ownerId,

            businessId:
              response.target.businessId,

            branchId:
              response.target.branchId,

            businessCode:
              response.businessCode,

            branchCode:
              response.branchCode,

            trustRecovered,

            installationRecovered,

            completedAt,
          },
        };

      } catch (
        error
      ) {

        return failure(
          error instanceof Error
            ? error.message
            : "FINORA Installation Enrollment bootstrap failed.",
        );
      }
    },
  );
}

// ============================================================
// END
// ============================================================