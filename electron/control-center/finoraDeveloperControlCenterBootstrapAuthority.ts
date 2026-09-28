/* ============================================================
   FINORA ENTERPRISE OS
   DEVELOPER CONTROL CENTER BOOTSTRAP STATE AUTHORITY

   PURPOSE:
   - Determine whether this standalone Developer installation
     already holds a legitimate Control Center signing authority.
   - Distinguish an existing-authority installation from a fresh
     installation that requires Admin Authority Recovery.

   SECURITY:
   - READ ONLY.
   - Never generates a Control Center signing identity.
   - Never calls loadOrCreateFinoraControlCenterKeyVault.
   - Never writes or replaces the key vault.
   - Never performs Admin Authority Recovery itself.
   - Never exposes private signing material.
   - Never introduces device binding.
   ============================================================ */

import {
  assertFinoraDeveloperControlCenterIdentitySeparation,
} from "./finoraDeveloperControlCenterIdentity.js";

import {
  hasExistingFinoraControlCenterKeyVault,
} from "./finoraControlCenterKeyVault.js";

export type FinoraDeveloperControlCenterBootstrapStatus =
  | "READY_WITH_EXISTING_AUTHORITY"
  | "RECOVERY_REQUIRED";

export interface FinoraDeveloperControlCenterBootstrapState {
  status:
    FinoraDeveloperControlCenterBootstrapStatus;

  authorityPresent:
    boolean;
}

export async function
resolveFinoraDeveloperControlCenterBootstrapState():
  Promise<
    FinoraDeveloperControlCenterBootstrapState
  > {

  assertFinoraDeveloperControlCenterIdentitySeparation();

  const authorityPresent =
    await hasExistingFinoraControlCenterKeyVault();

  if (authorityPresent) {
    return {
      status:
        "READY_WITH_EXISTING_AUTHORITY",

      authorityPresent:
        true,
    };
  }

  return {
    status:
      "RECOVERY_REQUIRED",

    authorityPresent:
      false,
  };
}
