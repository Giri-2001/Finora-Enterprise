/* ===========================================================
   FINORA ENTERPRISE OS™

   WINDOWS INSTALLATION BINDING SERVICE

   MODULE  : Native Control
   LAYER   : Electron Main
   VERSION : 1.1
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Reconcile existing Control Store installation identity
     with native installation-binding identity
   - Preserve legacy installationId when creating the first
     binding vault
   - Create a fresh native installationId only when neither
     identity exists
   - Fail closed if Control Store and binding vault disagree
   - Expose only public binding metadata to Electron-main code
   - Sign installation-enrollment proof internally

   SECURITY:

   - No IPC.
   - No preload.
   - No renderer.
   - No raw private-key getter.
   - No Control Center signing authority.
   - No Business Date.
=========================================================== */

import {
  generateFinoraWindowsInstallationBindingMaterial,
  signFinoraInstallationEnrollmentCanonicalValue,
  toFinoraWindowsInstallationBindingPublic,
} from "./finoraInstallationBindingCrypto.js";

import {
  reconcileFinoraInstallationBinding,
} from "./finoraInstallationBindingReconciliation.js";

import {
  loadFinoraInstallationBindingVault,
  persistNewFinoraInstallationBindingVault,
} from "./finoraInstallationBindingVault.js";

import {
  getFinoraInstallationIdentity,
} from "./finoraControlStore.js";

import type {
  FinoraWindowsInstallationBindingMaterial,
  FinoraWindowsInstallationBindingPublic,
} from "./finoraInstallationBindingCrypto.js";

// ============================================================
// SERIALIZED CREATION
// ============================================================

let installationBindingQueue:
  Promise<void> =
    Promise.resolve();

// ============================================================
// CONTROL STORE INSTALLATION ID
// ============================================================

async function loadControlInstallationId():
  Promise<
    string |
    undefined
  > {

  const result =
    await getFinoraInstallationIdentity();

  if (!result.success) {

    throw new Error(
      result.error ??
        "Unable to load FINORA Control Store installation identity.",
    );
  }

  return result.data
    ?.installationId;
}

// ============================================================
// CONSISTENCY GUARD
// ============================================================

async function assertBindingConsistency(
  material:
    FinoraWindowsInstallationBindingMaterial,
): Promise<void> {

  const controlInstallationId =
    await loadControlInstallationId();

  const reconciliation =
    reconcileFinoraInstallationBinding(
      controlInstallationId,
      material.installationId,
    );

  if (!reconciliation.accepted) {

    throw new Error(
      reconciliation.error,
    );
  }

  if (
    reconciliation.action !==
      "USE_EXISTING_BINDING"
  ) {

    throw new Error(
      "FINORA installation binding consistency state is invalid.",
    );
  }
}

// ============================================================
// INTERNAL ENSURE
// ============================================================

async function ensureBindingInternal():
  Promise<
    FinoraWindowsInstallationBindingPublic
  > {

  const controlInstallationId =
    await loadControlInstallationId();

  const existing =
    await loadFinoraInstallationBindingVault();

  const reconciliation =
    reconcileFinoraInstallationBinding(
      controlInstallationId,
      existing?.installationId,
    );

  if (!reconciliation.accepted) {

    throw new Error(
      reconciliation.error,
    );
  }

  if (
    reconciliation.action ===
      "USE_EXISTING_BINDING"
  ) {

    if (!existing) {

      throw new Error(
        "FINORA installation binding reconciliation expected an existing native binding.",
      );
    }

    return toFinoraWindowsInstallationBindingPublic(
      existing,
    );
  }

  const generated =
    generateFinoraWindowsInstallationBindingMaterial(
      new Date(),
      reconciliation.installationId,
    );

  try {

    await persistNewFinoraInstallationBindingVault(
      generated,
    );

    return toFinoraWindowsInstallationBindingPublic(
      generated,
    );

  } catch (
    error
  ) {

    /*
     * Another native path may have established the immutable
     * vault first. Only accept that authoritative vault if it
     * reconciles with the Control Store identity.
     */
    const authoritative =
      await loadFinoraInstallationBindingVault();

    if (!authoritative) {
      throw error;
    }

    const authoritativeReconciliation =
      reconcileFinoraInstallationBinding(
        controlInstallationId,
        authoritative.installationId,
      );

    if (
      !authoritativeReconciliation.accepted ||
      authoritativeReconciliation.action !==
        "USE_EXISTING_BINDING"
    ) {

      throw new Error(
        !authoritativeReconciliation.accepted
          ? authoritativeReconciliation.error
          : "FINORA authoritative installation binding state is invalid.",
      );
    }

    return toFinoraWindowsInstallationBindingPublic(
      authoritative,
    );
  }
}

// ============================================================
// ENSURE
// ============================================================

export function ensureFinoraWindowsInstallationBinding():
  Promise<
    FinoraWindowsInstallationBindingPublic
  > {

  const operation =
    installationBindingQueue.then(
      () =>
        ensureBindingInternal(),
    );

  installationBindingQueue =
    operation.then(
      () =>
        undefined,
      () =>
        undefined,
    );

  return operation;
}

// ============================================================
// READ PUBLIC BINDING
// ============================================================

export async function getFinoraWindowsInstallationBinding():
  Promise<
    FinoraWindowsInstallationBindingPublic |
    undefined
  > {

  const material =
    await loadFinoraInstallationBindingVault();

  if (!material) {
    return undefined;
  }

  await assertBindingConsistency(
    material,
  );

  return toFinoraWindowsInstallationBindingPublic(
    material,
  );
}

// ============================================================
// INTERNAL ENROLLMENT POSSESSION PROOF
// ============================================================

export async function signFinoraWindowsInstallationEnrollment(
  canonicalEnrollmentPayload:
    string,
): Promise<string> {

  const material =
    await loadFinoraInstallationBindingVault();

  if (!material) {

    throw new Error(
      "FINORA Windows installation binding has not been initialized.",
    );
  }

  await assertBindingConsistency(
    material,
  );

  return signFinoraInstallationEnrollmentCanonicalValue(
    canonicalEnrollmentPayload,
    material,
  );
}

// ============================================================
// END
// ============================================================