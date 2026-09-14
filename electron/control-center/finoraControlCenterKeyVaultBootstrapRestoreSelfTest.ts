/* ============================================================
   FINORA ENTERPRISE OS
   CONTROL CENTER KEY-VAULT BOOTSTRAP RESTORE SELF-TEST
============================================================ */

import {
  app,
} from "electron";

import {
  mkdir,
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
  bootstrapRestoreFinoraControlCenterKeyVault,
  loadOrCreateFinoraControlCenterKeyVault,
} from "./finoraControlCenterKeyVault.js";

import type {
  FinoraControlCenterKeyVaultRecord,
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

async function expectRejected(
  operation:
    () => Promise<unknown>,

  message:
    string,
): Promise<void> {
  let rejected =
    false;

  try {
    await operation();
  }
  catch {
    rejected =
      true;
  }

  assert(
    rejected,
    message,
  );
}

async function run():
  Promise<void> {
  const root =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-cc-bootstrap-restore-",
      ),
    );

  try {
    await app.whenReady();

    const sourceRoot =
      join(
        root,
        "source",
      );

    const restoredRoot =
      join(
        root,
        "restored",
      );

    const invalidRoot =
      join(
        root,
        "invalid",
      );

    const concurrentRoot =
      join(
        root,
        "concurrent",
      );

    await Promise.all([
      mkdir(sourceRoot, {
        recursive:
          true,
      }),
      mkdir(restoredRoot, {
        recursive:
          true,
      }),
      mkdir(invalidRoot, {
        recursive:
          true,
      }),
      mkdir(concurrentRoot, {
        recursive:
          true,
      }),
    ]);

    // --------------------------------------------------------
    // SOURCE AUTHORITY
    // --------------------------------------------------------

    app.setPath(
      "userData",
      sourceRoot,
    );

    const source =
      await loadOrCreateFinoraControlCenterKeyVault();

    const sourceSerialized =
      JSON.stringify(
        source,
      );

    console.log(
      "PASS: source Control Center signing authority created",
    );

    // --------------------------------------------------------
    // FRESH MACHINE RESTORE
    // --------------------------------------------------------

    app.setPath(
      "userData",
      restoredRoot,
    );

    const restored =
      await bootstrapRestoreFinoraControlCenterKeyVault(
        source,
      );

    assert(
      JSON.stringify(
        restored,
      ) ===
        sourceSerialized,
      "Bootstrap restore changed Control Center signing authority.",
    );

    const ordinaryLoad =
      await loadOrCreateFinoraControlCenterKeyVault();

    assert(
      JSON.stringify(
        ordinaryLoad,
      ) ===
        sourceSerialized,
      "Ordinary load did not preserve restored signing identity.",
    );

    console.log(
      "PASS: fresh machine restores exact issuer and signing-key history",
    );

    // --------------------------------------------------------
    // EXISTING VAULT MUST NEVER BE OVERWRITTEN
    // --------------------------------------------------------

    await expectRejected(
      () =>
        bootstrapRestoreFinoraControlCenterKeyVault(
          source,
        ),
      "Existing-vault bootstrap restore did not fail closed.",
    );

    const afterRejectedOverwrite =
      await loadOrCreateFinoraControlCenterKeyVault();

    assert(
      JSON.stringify(
        afterRejectedOverwrite,
      ) ===
        sourceSerialized,
      "Rejected bootstrap restore modified existing vault state.",
    );

    console.log(
      "PASS: existing vault cannot be overwritten by bootstrap restore",
    );

    // --------------------------------------------------------
    // INVALID CRYPTO MATERIAL MUST NOT CONSUME FRESH MACHINE
    // --------------------------------------------------------

    app.setPath(
      "userData",
      invalidRoot,
    );

    const malformed:
      FinoraControlCenterKeyVaultRecord = {
        ...source,

        privateKeyPkcs8DerBase64:
          "INVALID-PRIVATE-KEY",
      };

    await expectRejected(
      () =>
        bootstrapRestoreFinoraControlCenterKeyVault(
          malformed,
        ),
      "Malformed recovered signing material was accepted.",
    );

    const validAfterMalformed =
      await bootstrapRestoreFinoraControlCenterKeyVault(
        source,
      );

    assert(
      JSON.stringify(
        validAfterMalformed,
      ) ===
        sourceSerialized,
      "Failed malformed restore left persistent authority state.",
    );

    console.log(
      "PASS: malformed recovery material fails with no persistent vault creation",
    );

    // --------------------------------------------------------
    // CONCURRENT LOAD/CREATE MUST SHARE RESTORE AUTHORITY
    // --------------------------------------------------------

    app.setPath(
      "userData",
      concurrentRoot,
    );

    const restorePromise =
      bootstrapRestoreFinoraControlCenterKeyVault(
        source,
      );

    const concurrentLoadPromise =
      loadOrCreateFinoraControlCenterKeyVault();

    const [
      concurrentRestore,
      concurrentLoad,
    ] =
      await Promise.all([
        restorePromise,
        concurrentLoadPromise,
      ]);

    assert(
      JSON.stringify(
        concurrentRestore,
      ) ===
        sourceSerialized &&
      JSON.stringify(
        concurrentLoad,
      ) ===
        sourceSerialized,
      "Concurrent load/create generated a competing Control Center identity.",
    );

    console.log(
      "PASS: concurrent load/create cannot generate competing genesis identity",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: D4E3C2 CONTROL CENTER FRESH-MACHINE BOOTSTRAP RESTORE",
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
        "FAIL: D4E3C2 CONTROL CENTER FRESH-MACHINE BOOTSTRAP RESTORE",
        error,
      );

      app.exit(
        1,
      );
    },
  );