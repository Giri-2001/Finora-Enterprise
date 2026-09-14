/* ============================================================
   FINORA ENTERPRISE OS
   ADMIN AUTHORITY RECOVERY FILE TRANSPORT SELF-TEST
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
} from "./finoraControlCenterAdminAuthorityRecoveryBundle.js";

import {
  FINORA_CONTROL_CENTER_ADMIN_RECOVERY_MAX_FILE_BYTES,
  parseFinoraControlCenterAdminAuthorityRecoveryFileContent,
  serializeFinoraControlCenterAdminAuthorityRecoveryFileContent,
} from "./finoraControlCenterAdminAuthorityRecoveryFileTransport.js";

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

function expectThrow(
  operation:
    () => unknown,

  message:
    string,
): void {
  let failed =
    false;

  try {
    operation();
  }
  catch {
    failed =
      true;
  }

  assert(
    failed,
    message,
  );
}

async function run():
  Promise<void> {
  const root =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-admin-recovery-transport-",
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

    const securityCode =
      "FINORA-Test-Transport-Code-01";

    const bundle =
      await createFinoraControlCenterAdminAuthorityRecoveryBundleV1(
        vault,
        securityCode,
      );

    const serialized =
      serializeFinoraControlCenterAdminAuthorityRecoveryFileContent(
        bundle,
      );

    assert(
      serialized.bytes >
        0,
      "Recovery transport serialized empty file content.",
    );

    assert(
      !serialized.content.includes(
        vault.privateKeyPkcs8DerBase64,
      ),
      "Recovery file exposed private signing material.",
    );

    assert(
      !serialized.content.includes(
        securityCode,
      ),
      "Recovery file exposed Admin Security Code.",
    );

    console.log(
      "PASS: bounded encrypted recovery file content serialized without plaintext secrets",
    );

    const parsed =
      parseFinoraControlCenterAdminAuthorityRecoveryFileContent(
        Buffer.from(
          serialized.content,
          "utf8",
        ),
      );

    assert(
      parsed.bundle.issuerId ===
        vault.issuerId &&
      parsed.bundle.signingKeyId ===
        vault.signingKeyId,
      "Recovery file parse changed public authority identity metadata.",
    );

    assert(
      parsed.serializedBundle ===
        serialized.content,
      "Recovery file parse did not return canonical serialized bundle.",
    );

    console.log(
      "PASS: canonical recovery file round-trip preserved encrypted bundle",
    );

    expectThrow(
      () =>
        parseFinoraControlCenterAdminAuthorityRecoveryFileContent(
          Buffer.from(
            "{invalid-json",
            "utf8",
          ),
        ),
      "Malformed recovery file was accepted.",
    );

    console.log(
      "PASS: malformed recovery file fails closed",
    );

    const invalidUtf8 =
      Buffer.from([
        0xc3,
        0x28,
      ]);

    expectThrow(
      () =>
        parseFinoraControlCenterAdminAuthorityRecoveryFileContent(
          invalidUtf8,
        ),
      "Invalid UTF-8 recovery file was accepted.",
    );

    console.log(
      "PASS: invalid UTF-8 recovery file fails closed",
    );

    expectThrow(
      () =>
        parseFinoraControlCenterAdminAuthorityRecoveryFileContent(
          Buffer.alloc(
            FINORA_CONTROL_CENTER_ADMIN_RECOVERY_MAX_FILE_BYTES +
              1,
            0x41,
          ),
        ),
      "Oversized recovery file was accepted.",
    );

    console.log(
      "PASS: oversized recovery file fails before parsing",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: D4E3D3B ADMIN AUTHORITY RECOVERY FILE TRANSPORT FOUNDATION",
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
        "FAIL: D4E3D3B ADMIN AUTHORITY RECOVERY FILE TRANSPORT FOUNDATION",
        error,
      );

      app.exit(
        1,
      );
    },
  );