/* ============================================================
   FINORA ENTERPRISE OS
   DEVELOPER CONTROL CENTER
   RECOVERY-BACKED SECURITY CODE ENROLLMENT
   PRODUCTION AUTHORITY

   PURPOSE:
   - Bind the pure first-code enrollment authority to real
     Electron-main production primitives.
   - Keep all recovery, signing-authority and Security Code
     persistence operations out of renderer authority.

   SECURITY:
   - No work executes at module import.
   - No signing authority is auto-created.
   - Recovery uses native main-process file transport.
   - Admin Recovery Security Code is a one-shot call input.
   - Developer Security Code is a one-shot call input.
   - Existing signing authority is never overwritten.
   - Private signing material never crosses this API.
   ============================================================ */

import {
  decryptFinoraControlCenterAdminAuthorityRecoveryBundleV1,
  parseFinoraControlCenterAdminAuthorityRecoveryBundleV1,
} from "./finoraControlCenterAdminAuthorityRecoveryBundle.js";

import {
  importFinoraControlCenterAdminAuthorityRecoveryFile,
} from "./finoraControlCenterAdminAuthorityRecoveryFileTransport.js";

import {
  bootstrapRestoreFinoraControlCenterKeyVault,
  hasExistingFinoraControlCenterKeyVault,
  matchesExistingFinoraControlCenterKeyVaultPublicAuthority,
  readExistingFinoraControlCenterPublicAuthorityIdentity,
} from "./finoraControlCenterKeyVault.js";

import {
  createFinoraDeveloperSecurityCodeRecoveryEnrollmentAuthority,
} from "./finoraDeveloperControlCenterSecurityCodeRecoveryEnrollmentAuthority.js";

import type {
  FinoraDeveloperSecurityCodeRecoveryEnrollmentAuthority,
  FinoraDeveloperSecurityCodeRecoveryEnrollmentResult,
} from "./finoraDeveloperControlCenterSecurityCodeRecoveryEnrollmentAuthority.js";

import {
  initializeFinoraDeveloperSecurityCode,
  readFinoraDeveloperSecurityCodeConfigurationState,
} from "./finoraDeveloperControlCenterSecurityCodeStore.js";

let productionRecoveryEnrollmentAuthority:
  FinoraDeveloperSecurityCodeRecoveryEnrollmentAuthority |
  undefined;

export function
getFinoraDeveloperSecurityCodeRecoveryEnrollmentProductionAuthority():
  FinoraDeveloperSecurityCodeRecoveryEnrollmentAuthority {

  if (
    productionRecoveryEnrollmentAuthority ===
      undefined
  ) {
    productionRecoveryEnrollmentAuthority =
      createFinoraDeveloperSecurityCodeRecoveryEnrollmentAuthority({
        hasExistingAuthority:
          hasExistingFinoraControlCenterKeyVault,

        readSecurityCodeConfiguration:
          readFinoraDeveloperSecurityCodeConfigurationState,

        importRecoveryFile:
          importFinoraControlCenterAdminAuthorityRecoveryFile,

        parseRecoveryBundle:
          parseFinoraControlCenterAdminAuthorityRecoveryBundleV1,

        decryptRecoveryBundle:
          decryptFinoraControlCenterAdminAuthorityRecoveryBundleV1,

        bootstrapRestoreAuthority:
          bootstrapRestoreFinoraControlCenterKeyVault,

        matchesExistingAuthority:
          matchesExistingFinoraControlCenterKeyVaultPublicAuthority,

        initializeDeveloperSecurityCode:
          initializeFinoraDeveloperSecurityCode,

        readExistingPublicAuthority:
          readExistingFinoraControlCenterPublicAuthorityIdentity,
      });
  }

  return productionRecoveryEnrollmentAuthority;
}

export function
enrollFinoraDeveloperSecurityCodeFromAdminRecovery(
  adminRecoverySecurityCode:
    string,

  newDeveloperSecurityCode:
    string,
): Promise<
  FinoraDeveloperSecurityCodeRecoveryEnrollmentResult
> {

  return getFinoraDeveloperSecurityCodeRecoveryEnrollmentProductionAuthority()
    .enroll(
      adminRecoverySecurityCode,
      newDeveloperSecurityCode,
    );
}

export function
resetFinoraDeveloperSecurityCodeRecoveryEnrollmentProductionAuthority():
  void {

  /*
   * Test / lifecycle reset only.
   *
   * This discards only the in-memory orchestration singleton.
   * It does NOT:
   * - delete Developer Security Code persistence,
   * - delete signing authority,
   * - modify Recovery artifacts.
   */
  productionRecoveryEnrollmentAuthority =
    undefined;
}
