/* ============================================================
   FINORA ENTERPRISE OS
   DEVELOPER CONTROL CENTER
   RECOVERY-BACKED FIRST SECURITY CODE ENROLLMENT AUTHORITY

   PURPOSE:
   - Establish the first local Developer Security Code only
     after cryptographic Admin Authority Recovery proof.
   - Remain safe across a crash after authority restoration.
   - Never treat mere local authority presence as setup proof.

   RESTART-SAFE FLOW:
   A. No local authority:
      authenticated Recovery Bundle
      -> exact authority restore
      -> exact public-authority match
      -> first Security Code initialization.

   B. Authority already exists but Security Code is not configured:
      authenticated Recovery Bundle
      -> exact public-authority match
      -> first Security Code initialization.

   Therefore a process crash after restore but before Security Code
   initialization does not brick first setup. Repeating the same
   authenticated recovery proof enters path B.

   SECURITY:
   - No Electron authority.
   - No filesystem authority.
   - No persistence authority.
   - No signing-key creation authority.
   - No private signing material is returned.
   - Admin Recovery Security Code is ephemeral input only.
   - Developer Security Code is ephemeral input only.
   ============================================================ */

import {
  validateFinoraDeveloperSecurityCode,
} from "./finoraDeveloperControlCenterSecurityCodeCrypto.js";

import type {
  FinoraControlCenterAdminAuthorityRecoveryBundleV1,
} from "./finoraControlCenterAdminAuthorityRecoveryBundle.js";

import type {
  FinoraControlCenterAdminRecoveryFileImportResult,
} from "./finoraControlCenterAdminAuthorityRecoveryFileTransport.js";

import type {
  FinoraControlCenterKeyVaultRecord,
  FinoraControlCenterPublicAuthorityIdentity,
} from "./finoraControlCenterKeyVault.js";

export type FinoraDeveloperSecurityCodeRecoveryEnrollmentErrorCode =
  | "INVALID_DEVELOPER_SECURITY_CODE"
  | "SECURITY_CODE_ALREADY_CONFIGURED"
  | "RECOVERY_FILE_IMPORT_FAILED"
  | "INVALID_RECOVERY_BUNDLE"
  | "RECOVERY_AUTHENTICATION_FAILED"
  | "RECOVERY_RESTORE_FAILED"
  | "RECOVERY_AUTHORITY_MISMATCH"
  | "SECURITY_CODE_CONFIGURATION_FAILED";

export interface FinoraDeveloperSecurityCodeRecoveryEnrollmentSuccess {
  success:
    true;

  cancelled:
    false;

  status:
    "CONFIGURED";

  issuerId:
    string;

  authorityRestored:
    boolean;

  fileName:
    string;
}

export interface FinoraDeveloperSecurityCodeRecoveryEnrollmentCancelled {
  success:
    false;

  cancelled:
    true;
}

export interface FinoraDeveloperSecurityCodeRecoveryEnrollmentFailure {
  success:
    false;

  cancelled:
    false;

  errorCode:
    FinoraDeveloperSecurityCodeRecoveryEnrollmentErrorCode;

  error:
    string;
}

export type FinoraDeveloperSecurityCodeRecoveryEnrollmentResult =
  | FinoraDeveloperSecurityCodeRecoveryEnrollmentSuccess
  | FinoraDeveloperSecurityCodeRecoveryEnrollmentCancelled
  | FinoraDeveloperSecurityCodeRecoveryEnrollmentFailure;

export interface FinoraDeveloperSecurityCodeRecoveryEnrollmentDependencies {
  hasExistingAuthority:
    () => Promise<boolean>;

  readSecurityCodeConfiguration:
    () => Promise<{
      configured:
        boolean;
    }>;

  importRecoveryFile:
    () => Promise<
      FinoraControlCenterAdminRecoveryFileImportResult
    >;

  parseRecoveryBundle:
    (
      serializedBundle:
        string,
    ) => FinoraControlCenterAdminAuthorityRecoveryBundleV1;

  decryptRecoveryBundle:
    (
      bundle:
        FinoraControlCenterAdminAuthorityRecoveryBundleV1,
      adminRecoverySecurityCode:
        string,
    ) => Promise<
      FinoraControlCenterKeyVaultRecord
    >;

  bootstrapRestoreAuthority:
    (
      recoveredVault:
        FinoraControlCenterKeyVaultRecord,
    ) => Promise<
      FinoraControlCenterKeyVaultRecord
    >;

  matchesExistingAuthority:
    (
      recoveredVault:
        FinoraControlCenterKeyVaultRecord,
    ) => Promise<boolean>;

  initializeDeveloperSecurityCode:
    (
      developerSecurityCode:
        string,
    ) => Promise<void>;

  readExistingPublicAuthority:
    () => Promise<
      FinoraControlCenterPublicAuthorityIdentity |
      undefined
    >;
}

export interface FinoraDeveloperSecurityCodeRecoveryEnrollmentAuthority {
  enroll:
    (
      adminRecoverySecurityCode:
        string,
      newDeveloperSecurityCode:
        string,
    ) => Promise<
      FinoraDeveloperSecurityCodeRecoveryEnrollmentResult
    >;
}

function failure(
  errorCode:
    FinoraDeveloperSecurityCodeRecoveryEnrollmentErrorCode,
  error:
    string,
): FinoraDeveloperSecurityCodeRecoveryEnrollmentFailure {

  return {
    success:
      false,

    cancelled:
      false,

    errorCode,

    error,
  };
}

export function
createFinoraDeveloperSecurityCodeRecoveryEnrollmentAuthority(
  dependencies:
    FinoraDeveloperSecurityCodeRecoveryEnrollmentDependencies,
): FinoraDeveloperSecurityCodeRecoveryEnrollmentAuthority {

  let serializationTail:
    Promise<void> =
      Promise.resolve();

  function runSerialized<T>(
    operation:
      () => Promise<T>,
  ): Promise<T> {

    const result =
      serializationTail.then(
        operation,
        operation,
      );

    serializationTail =
      result.then(
        () =>
          undefined,
        () =>
          undefined,
      );

    return result;
  }

  async function enrollInternal(
    adminRecoverySecurityCode:
      string,
    newDeveloperSecurityCode:
      string,
  ): Promise<
    FinoraDeveloperSecurityCodeRecoveryEnrollmentResult
  > {

    /*
     * Validate the new local Security Code BEFORE any authority
     * restoration can occur. An invalid new code must never leave
     * behind a restored authority awaiting an unusable credential.
     */
    try {
      validateFinoraDeveloperSecurityCode(
        newDeveloperSecurityCode,
      );
    } catch {
      return failure(
        "INVALID_DEVELOPER_SECURITY_CODE",
        "A valid FINORA Developer Security Code is required.",
      );
    }

    let authorityPresent:
      boolean;

    try {
      authorityPresent =
        await dependencies
          .hasExistingAuthority();
    } catch {
      return failure(
        "RECOVERY_RESTORE_FAILED",
        "FINORA Developer signing-authority state could not be verified.",
      );
    }

    /*
     * If an authority already exists and the Developer Security
     * Code is already configured, first setup is permanently closed.
     * No recovery file dialog is opened in that state.
     */
    if (authorityPresent) {
      try {
        const configuration =
          await dependencies
            .readSecurityCodeConfiguration();

        if (
          configuration.configured
        ) {
          return failure(
            "SECURITY_CODE_ALREADY_CONFIGURED",
            "FINORA Developer Security Code is already configured.",
          );
        }
      } catch {
        return failure(
          "SECURITY_CODE_CONFIGURATION_FAILED",
          "FINORA Developer Security Code configuration state could not be verified.",
        );
      }
    }

    const imported =
      await dependencies
        .importRecoveryFile();

    if (
      !imported.success
    ) {
      if (
        imported.cancelled
      ) {
        return {
          success:
            false,

          cancelled:
            true,
        };
      }

      return failure(
        "RECOVERY_FILE_IMPORT_FAILED",
        imported.error,
      );
    }

    let bundle:
      FinoraControlCenterAdminAuthorityRecoveryBundleV1;

    try {
      bundle =
        dependencies
          .parseRecoveryBundle(
            imported.serializedBundle,
          );
    } catch {
      return failure(
        "INVALID_RECOVERY_BUNDLE",
        "FINORA Admin Authority Recovery Bundle is invalid.",
      );
    }

    let recoveredVault:
      FinoraControlCenterKeyVaultRecord;

    try {
      recoveredVault =
        await dependencies
          .decryptRecoveryBundle(
            bundle,
            adminRecoverySecurityCode,
          );
    } catch {
      return failure(
        "RECOVERY_AUTHENTICATION_FAILED",
        "FINORA Admin Authority Recovery authentication failed.",
      );
    }

    let authorityRestored =
      false;

    /*
     * Fresh-machine path:
     * restore exact recovered authority.
     *
     * Existing-authority path:
     * NEVER overwrite it. The authenticated recovered authority
     * must exactly match the existing public authority state.
     */
    if (!authorityPresent) {
      try {
        await dependencies
          .bootstrapRestoreAuthority(
            recoveredVault,
          );

        authorityRestored =
          true;
      } catch {
        return failure(
          "RECOVERY_RESTORE_FAILED",
          "FINORA Control Center signing authority could not be restored.",
        );
      }
    }

    let authorityMatches:
      boolean;

    try {
      authorityMatches =
        await dependencies
          .matchesExistingAuthority(
            recoveredVault,
          );
    } catch {
      return failure(
        "RECOVERY_AUTHORITY_MISMATCH",
        "FINORA Admin Recovery authority could not be matched to the local Developer authority.",
      );
    }

    if (!authorityMatches) {
      return failure(
        "RECOVERY_AUTHORITY_MISMATCH",
        "FINORA Admin Recovery authority does not match the local Developer authority.",
      );
    }

    /*
     * Re-check after restore / match. This closes a concurrent
     * initialization race and guarantees existing configuration
     * is never replaced.
     */
    try {
      const configuration =
        await dependencies
          .readSecurityCodeConfiguration();

      if (
        configuration.configured
      ) {
        return failure(
          "SECURITY_CODE_ALREADY_CONFIGURED",
          "FINORA Developer Security Code is already configured.",
        );
      }
    } catch {
      return failure(
        "SECURITY_CODE_CONFIGURATION_FAILED",
        "FINORA Developer Security Code configuration state could not be verified.",
      );
    }

    let publicAuthority:
      FinoraControlCenterPublicAuthorityIdentity |
      undefined;

    /*
     * FINAL PRE-PERSISTENCE AUTHORITY CHECK:
     *
     * Every fallible Recovery / authority verification operation
     * must complete before the first Developer Security Code is
     * persisted. Once initialization below succeeds, this flow
     * performs no further awaited dependency operation.
     */
    try {
      publicAuthority =
        await dependencies
          .readExistingPublicAuthority();
    } catch {
      return failure(
        "SECURITY_CODE_CONFIGURATION_FAILED",
        "FINORA Developer authority could not be verified before Security Code configuration.",
      );
    }

    if (!publicAuthority) {
      return failure(
        "SECURITY_CODE_CONFIGURATION_FAILED",
        "FINORA Developer authority is unavailable before Security Code configuration.",
      );
    }

    /*
     * FINAL FALLIBLE PERSISTENT STEP:
     *
     * initializeDeveloperSecurityCode is deliberately last.
     * After it resolves, only the in-memory success result is
     * constructed from the already verified public authority.
     */
    try {
      await dependencies
        .initializeDeveloperSecurityCode(
          newDeveloperSecurityCode,
        );
    } catch {
      return failure(
        "SECURITY_CODE_CONFIGURATION_FAILED",
        "FINORA Developer Security Code could not be configured.",
      );
    }

    return {
      success:
        true,

      cancelled:
        false,

      status:
        "CONFIGURED",

      issuerId:
        publicAuthority.issuerId,

      authorityRestored,

      fileName:
        imported.fileName,
    };
  }

  return {
    enroll:
      (
        adminRecoverySecurityCode,
        newDeveloperSecurityCode,
      ) =>
        runSerialized(
          () =>
            enrollInternal(
              adminRecoverySecurityCode,
              newDeveloperSecurityCode,
            ),
        ),
  };
}
