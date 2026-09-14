/* ============================================================
   FINORA ENTERPRISE OS
   ADMIN AUTHORITY RECOVERY BUNDLE SELF-TEST
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
  loadOrCreateFinoraControlCenterKeyVault,
} from "./finoraControlCenterKeyVault.js";

import {
  createFinoraControlCenterAdminAuthorityRecoveryBundleV1,
  decryptFinoraControlCenterAdminAuthorityRecoveryBundleV1,
  parseFinoraControlCenterAdminAuthorityRecoveryBundleV1,
  serializeFinoraControlCenterAdminAuthorityRecoveryBundleV1,
} from "./finoraControlCenterAdminAuthorityRecoveryBundle.js";

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
        "finora-admin-recovery-bundle-",
      ),
    );

  try {
    app.setPath(
      "userData",
      root,
    );

    await app.whenReady();

    const vault =
      await loadOrCreateFinoraControlCenterKeyVault();

    const firstSecurityCode =
      "FINORA-Test-Admin-Code-01";

    const secondSecurityCode =
      "FINORA-Test-Admin-Code-02";

    const bundle =
      await createFinoraControlCenterAdminAuthorityRecoveryBundleV1(
        vault,
        firstSecurityCode,
      );

    console.log(
      "PASS: Admin Authority Recovery Bundle created",
    );

    const serialized =
      serializeFinoraControlCenterAdminAuthorityRecoveryBundleV1(
        bundle,
      );

    assert(
      !serialized.includes(
        vault.privateKeyPkcs8DerBase64,
      ),
      "Recovery Bundle exposed current private signing key plaintext.",
    );

    assert(
      !serialized.includes(
        firstSecurityCode,
      ),
      "Recovery Bundle exposed Admin Security Code plaintext.",
    );

    console.log(
      "PASS: portable bundle exposes neither private signing key nor Admin Security Code",
    );

    const parsed =
      parseFinoraControlCenterAdminAuthorityRecoveryBundleV1(
        serialized,
      );

    assert(
      parsed.issuerId ===
        vault.issuerId &&
      parsed.signingKeyId ===
        vault.signingKeyId,
      "Parsed recovery metadata changed Control Center identity.",
    );

    const decrypted =
      await decryptFinoraControlCenterAdminAuthorityRecoveryBundleV1(
        parsed,
        firstSecurityCode,
      );

    assert(
      JSON.stringify(
        decrypted,
      ) ===
        JSON.stringify(
          vault,
        ),
      "Recovery Bundle did not decrypt to exact Key Vault authority.",
    );

    console.log(
      "PASS: correct Admin Security Code decrypts exact signing authority",
    );

    await expectRejected(
      () =>
        decryptFinoraControlCenterAdminAuthorityRecoveryBundleV1(
          parsed,
          "FINORA-Wrong-Admin-Code",
        ),
      "Wrong Admin Security Code unexpectedly decrypted Recovery Bundle.",
    );

    console.log(
      "PASS: wrong Admin Security Code fails closed",
    );

    const tampered = {
      ...parsed,

      ciphertext:
        `${
          parsed.ciphertext.startsWith(
            "A",
          )
            ? "B"
            : "A"
        }${parsed.ciphertext.slice(
          1,
        )}`,
    };

    await expectRejected(
      () =>
        decryptFinoraControlCenterAdminAuthorityRecoveryBundleV1(
          tampered,
          firstSecurityCode,
        ),
      "Tampered Recovery Bundle unexpectedly authenticated.",
    );

    console.log(
      "PASS: ciphertext tampering fails closed",
    );

    const reprotected =
      await createFinoraControlCenterAdminAuthorityRecoveryBundleV1(
        decrypted,
        secondSecurityCode,
      );

    const reprotectedVault =
      await decryptFinoraControlCenterAdminAuthorityRecoveryBundleV1(
        reprotected,
        secondSecurityCode,
      );

    assert(
      reprotectedVault.issuerId ===
        vault.issuerId &&
      reprotectedVault.signingKeyId ===
        vault.signingKeyId &&
      JSON.stringify(
        reprotectedVault,
      ) ===
        JSON.stringify(
          vault,
        ),
      "Admin Security Code change rotated or modified signing identity.",
    );

    await expectRejected(
      () =>
        decryptFinoraControlCenterAdminAuthorityRecoveryBundleV1(
          reprotected,
          firstSecurityCode,
        ),
      "Old Admin Security Code still decrypted re-protected bundle.",
    );

    console.log(
      "PASS: Admin Security Code can change without rotating Control Center signing identity",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: D4E3D1R1 ADMIN AUTHORITY RECOVERY BUNDLE CRYPTO FOUNDATION",
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
        "FAIL: D4E3D1R1 ADMIN AUTHORITY RECOVERY BUNDLE CRYPTO FOUNDATION",
        error,
      );

      app.exit(
        1,
      );
    },
  );