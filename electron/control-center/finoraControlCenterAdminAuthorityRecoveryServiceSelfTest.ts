/* ============================================================
   FINORA ENTERPRISE OS
   CONTROL CENTER ADMIN AUTHORITY RECOVERY SERVICE SELF-TEST
============================================================ */

import {
  app,
} from "electron";

import {
  mkdtemp,
  rm,
} from "node:fs/promises";

import {
  join,
} from "node:path";

import {
  tmpdir,
} from "node:os";

import {
  createFinoraControlCenterAdminAuthorityRecoveryBundleV1,
  serializeFinoraControlCenterAdminAuthorityRecoveryBundleV1,
} from "./finoraControlCenterAdminAuthorityRecoveryBundle.js";

import {
  recoverFinoraControlCenterAdminAuthority,
} from "./finoraControlCenterAdminAuthorityRecoveryService.js";

import {
  loadOrCreateFinoraControlCenterKeyVault,
} from "./finoraControlCenterKeyVault.js";

function assert(
  condition:
    unknown,

  message:
    string,
): asserts condition {
  if (!condition) {
    throw new Error(
      message,
    );
  }
}

async function run():
  Promise<void> {
  const root =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-admin-authority-recovery-service-",
      ),
    );

  try {
    await app.whenReady();

    const sourceRoot =
      join(
        root,
        "source",
      );

    const wrongCodeRoot =
      join(
        root,
        "wrong-code",
      );

    const restoreRoot =
      join(
        root,
        "restore",
      );

    const existingRoot =
      join(
        root,
        "existing",
      );

    // --------------------------------------------------------
    // SOURCE AUTHORITY + RECOVERY BUNDLE
    // --------------------------------------------------------

    app.setPath(
      "userData",
      sourceRoot,
    );

    const sourceVault =
      await loadOrCreateFinoraControlCenterKeyVault();

    const securityCode =
      "FINORA-Test-Admin-Recovery-01";

    const bundle =
      await createFinoraControlCenterAdminAuthorityRecoveryBundleV1(
        sourceVault,
        securityCode,
      );

    const serializedBundle =
      serializeFinoraControlCenterAdminAuthorityRecoveryBundleV1(
        bundle,
      );

    console.log(
      "PASS: source Control Center authority and encrypted recovery bundle prepared",
    );

    // --------------------------------------------------------
    // WRONG SECURITY CODE MUST NOT CREATE A VAULT
    // --------------------------------------------------------

    app.setPath(
      "userData",
      wrongCodeRoot,
    );

    const wrongCodeResult =
      await recoverFinoraControlCenterAdminAuthority(
        serializedBundle,
        "FINORA-Wrong-Admin-Recovery",
      );

    assert(
      !wrongCodeResult.success &&
      wrongCodeResult.errorCode ===
        "RECOVERY_AUTHENTICATION_FAILED",
      "Wrong Admin Security Code did not fail closed.",
    );

    const validAfterWrongCode =
      await recoverFinoraControlCenterAdminAuthority(
        serializedBundle,
        securityCode,
      );

    assert(
      validAfterWrongCode.success &&
      validAfterWrongCode.issuerId ===
        sourceVault.issuerId &&
      validAfterWrongCode.signingKeyId ===
        sourceVault.signingKeyId,
      "Wrong-code attempt consumed or corrupted fresh-machine recovery state.",
    );

    console.log(
      "PASS: wrong Admin Security Code creates no authority and does not consume recovery",
    );

    // --------------------------------------------------------
    // FRESH MACHINE EXACT RESTORE
    // --------------------------------------------------------

    app.setPath(
      "userData",
      restoreRoot,
    );

    const restoreResult =
      await recoverFinoraControlCenterAdminAuthority(
        serializedBundle,
        securityCode,
      );

    assert(
      restoreResult.success,
      "Fresh-machine recovery failed.",
    );

    assert(
      restoreResult.issuerId ===
        sourceVault.issuerId &&
      restoreResult.signingKeyId ===
        sourceVault.signingKeyId &&
      restoreResult.createdAt ===
        sourceVault.createdAt &&
      restoreResult.retainedSigningKeyCount ===
        (
          sourceVault.retainedSigningKeys?.length ??
          0
        ),
      "Fresh-machine recovery changed Control Center authority identity.",
    );

    const restoredVault =
      await loadOrCreateFinoraControlCenterKeyVault();

    assert(
      JSON.stringify(
        restoredVault,
      ) ===
        JSON.stringify(
          sourceVault,
        ),
      "Recovered Key Vault differs from source authority.",
    );

    console.log(
      "PASS: fresh machine restores exact Control Center signing authority",
    );

    // --------------------------------------------------------
    // RESULT MUST NOT EXPOSE PRIVATE MATERIAL
    // --------------------------------------------------------

    const resultText =
      JSON.stringify(
        restoreResult,
      );

    assert(
      !resultText.includes(
        sourceVault.privateKeyPkcs8DerBase64,
      ),
      "Recovery result exposed private signing key.",
    );

    assert(
      !resultText.includes(
        securityCode,
      ),
      "Recovery result exposed Admin Security Code.",
    );

    console.log(
      "PASS: recovery result exposes no private key or Admin Security Code",
    );

    // --------------------------------------------------------
    // EXISTING AUTHORITY MUST NOT BE OVERWRITTEN
    // --------------------------------------------------------

    app.setPath(
      "userData",
      existingRoot,
    );

    const existingVault =
      await loadOrCreateFinoraControlCenterKeyVault();

    assert(
      existingVault.issuerId !==
        sourceVault.issuerId,
      "Existing-machine fixture unexpectedly shares source issuer.",
    );

    const existingRestore =
      await recoverFinoraControlCenterAdminAuthority(
        serializedBundle,
        securityCode,
      );

    assert(
      !existingRestore.success &&
      existingRestore.errorCode ===
        "RECOVERY_RESTORE_FAILED",
      "Recovery overwrote an existing Control Center signing authority.",
    );

    const existingAfter =
      await loadOrCreateFinoraControlCenterKeyVault();

    assert(
      JSON.stringify(
        existingAfter,
      ) ===
        JSON.stringify(
          existingVault,
        ),
      "Rejected recovery modified existing Control Center authority.",
    );

    console.log(
      "PASS: existing Control Center authority cannot be overwritten",
    );

    // --------------------------------------------------------
    // MALFORMED BUNDLE
    // --------------------------------------------------------

    app.setPath(
      "userData",
      join(
        root,
        "malformed",
      ),
    );

    const malformedResult =
      await recoverFinoraControlCenterAdminAuthority(
        "{not-valid-json",
        securityCode,
      );

    assert(
      !malformedResult.success &&
      malformedResult.errorCode ===
        "INVALID_RECOVERY_BUNDLE",
      "Malformed recovery bundle did not fail closed.",
    );

    console.log(
      "PASS: malformed recovery bundle fails closed",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: D4E3D2 ADMIN AUTHORITY RECOVERY SERVICE",
    );

    console.log(
      "============================================================",
    );
  }
  finally {
    await rm(
      root,
      {
        recursive:
          true,

        force:
          true,
      },
    );
  }
}

void run()
  .then(
    () =>
      app.exit(
        0,
      ),
  )
  .catch(
    (
      error,
    ) => {
      console.error(
        "FAIL: D4E3D2 ADMIN AUTHORITY RECOVERY SERVICE",
        error,
      );

      app.exit(
        1,
      );
    },
  );