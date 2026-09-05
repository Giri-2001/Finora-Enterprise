/* ===========================================================
   FINORA ENTERPRISE OS™

   WINDOWS INSTALLATION BINDING RECONCILIATION

   MODULE  : Native Control
   LAYER   : Pure Domain Policy
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Reconcile legacy Control Store installation identity
     with native installation-binding identity
   - Preserve existing installationId during migration
   - Fail closed on identity mismatch
   - Determine which installationId a new native binding
     must use

   SECURITY:

   - Pure policy only.
   - No Electron APIs.
   - No filesystem.
   - No private key.
   - No IPC.
   - No Business Date.
=========================================================== */

export type FinoraInstallationBindingReconciliation =
  | {
      accepted:
        true;

      action:
        "USE_EXISTING_BINDING";

      installationId:
        string;
    }
  | {
      accepted:
        true;

      action:
        "CREATE_BINDING";

      /**
       * Existing legacy installation ID when migration must
       * preserve it.
       *
       * Undefined means a completely fresh installation may
       * generate a new native installationId.
       */
      installationId?:
        string;
    }
  | {
      accepted:
        false;

      error:
        string;
    };

// ============================================================
// NORMALIZATION
// ============================================================

function normalizeOptionalId(
  value:
    string |
    undefined,
): string | undefined {

  if (
    typeof value !== "string"
  ) {
    return undefined;
  }

  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : undefined;
}

// ============================================================
// RECONCILE
// ============================================================

export function reconcileFinoraInstallationBinding(
  controlInstallationId:
    string |
    undefined,

  bindingInstallationId:
    string |
    undefined,
): FinoraInstallationBindingReconciliation {

  const controlId =
    normalizeOptionalId(
      controlInstallationId,
    );

  const bindingId =
    normalizeOptionalId(
      bindingInstallationId,
    );

  // ----------------------------------------------------------
  // EXISTING NATIVE BINDING
  // ----------------------------------------------------------

  if (bindingId) {

    if (
      controlId &&
      controlId !== bindingId
    ) {

      return {
        accepted:
          false,

        error:
          "FINORA native installation binding does not match the existing Control Store installation identity.",
      };
    }

    return {
      accepted:
        true,

      action:
        "USE_EXISTING_BINDING",

      installationId:
        bindingId,
    };
  }

  // ----------------------------------------------------------
  // NO BINDING YET
  //
  // Existing legacy Control Store ID must be preserved.
  // Completely fresh installation may generate a new ID.
  // ----------------------------------------------------------

  return {
    accepted:
      true,

    action:
      "CREATE_BINDING",

    installationId:
      controlId,
  };
}

// ============================================================
// END
// ============================================================