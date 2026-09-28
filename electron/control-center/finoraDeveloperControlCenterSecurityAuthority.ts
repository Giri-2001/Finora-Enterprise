/* ============================================================
   FINORA ENTERPRISE OS
   DEVELOPER CONTROL CENTER PRODUCTION SECURITY AUTHORITY

   RESPONSIBILITY:
   - Bind the encrypted Developer Security Code store to the
     in-memory Developer Control Center session authority.
   - Provide one main-process singleton security authority.
   - Provide backend unlock / lock / assertUnlocked boundaries.

   SECURITY:
   - Session begins locked.
   - Renderer state is never authoritative.
   - Plaintext Security Code is passed directly to verifier only.
   - No Security Code initialization occurs here.
   - Missing verifier configuration remains fail-closed.
   - No signing authority creation occurs here.
   - No device binding exists here.
   ============================================================ */

import {
  changeFinoraDeveloperSecurityCode as changePersistedFinoraDeveloperSecurityCode,
  clearFinoraDeveloperSecurityCodeThrottleState,
  readFinoraDeveloperSecurityCodeConfigurationState,
  readFinoraDeveloperSecurityCodeThrottleState,
  verifyConfiguredFinoraDeveloperSecurityCode,
  writeFinoraDeveloperSecurityCodeThrottleState,
} from "./finoraDeveloperControlCenterSecurityCodeStore.js";

import {
  createFinoraDeveloperControlCenterSessionAuthority,
} from "./finoraDeveloperControlCenterSessionAuthority.js";

import type {
  FinoraDeveloperControlCenterSessionAuthority,
  FinoraDeveloperControlCenterSessionState,
  FinoraDeveloperControlCenterUnlockResult,
} from "./finoraDeveloperControlCenterSessionAuthority.js";

let productionSessionAuthority:
  FinoraDeveloperControlCenterSessionAuthority |
  undefined;

function createProductionSessionAuthority():
  FinoraDeveloperControlCenterSessionAuthority {

  return createFinoraDeveloperControlCenterSessionAuthority({
    readConfigurationState:
      readFinoraDeveloperSecurityCodeConfigurationState,

    verifySecurityCode:
      verifyConfiguredFinoraDeveloperSecurityCode,

    readThrottleState:
      readFinoraDeveloperSecurityCodeThrottleState,

    writeThrottleState:
      writeFinoraDeveloperSecurityCodeThrottleState,

    clearThrottleState:
      clearFinoraDeveloperSecurityCodeThrottleState,
  });
}

export function
getFinoraDeveloperControlCenterSecurityAuthority():
  FinoraDeveloperControlCenterSessionAuthority {

  if (!productionSessionAuthority) {
    productionSessionAuthority =
      createProductionSessionAuthority();
  }

  return productionSessionAuthority;
}

export function
readFinoraDeveloperControlCenterSecuritySessionState():
  FinoraDeveloperControlCenterSessionState {

  return getFinoraDeveloperControlCenterSecurityAuthority()
    .getState();
}

export function
unlockFinoraDeveloperControlCenter(
  securityCode:
    string,
): Promise<
  FinoraDeveloperControlCenterUnlockResult
> {

  return getFinoraDeveloperControlCenterSecurityAuthority()
    .unlock(
      securityCode,
    );
}

export function
lockFinoraDeveloperControlCenter():
  void {

  if (!productionSessionAuthority) {
    return;
  }

  productionSessionAuthority
    .lock();
}

export function
assertFinoraDeveloperControlCenterUnlocked():
  void {

  getFinoraDeveloperControlCenterSecurityAuthority()
    .assertUnlocked();
}

export async function
changeFinoraDeveloperControlCenterSecurityCode(
  oldSecurityCode:
    string,
  newSecurityCode:
    string,
): Promise<boolean> {

  /*
   * Two independent authorization conditions are required:
   *
   * 1. Developer Control Center session is already unlocked.
   * 2. Persisted Security Code store verifies oldSecurityCode.
   *
   * This production boundary owns condition #1.
   * The existing store primitive owns condition #2.
   */
  assertFinoraDeveloperControlCenterUnlocked();

  return changePersistedFinoraDeveloperSecurityCode(
    oldSecurityCode,
    newSecurityCode,
  );
}

/*
 * TEST / LIFECYCLE BOUNDARY:
 *
 * This clears only in-memory authority state.
 * It never deletes the persisted Security Code verifier.
 *
 * Production process restart naturally has the same effect
 * because module memory is recreated from a locked state.
 */
export function
resetFinoraDeveloperControlCenterSecuritySession():
  void {

  if (productionSessionAuthority) {
    productionSessionAuthority
      .lock();
  }

  productionSessionAuthority =
    undefined;
}
