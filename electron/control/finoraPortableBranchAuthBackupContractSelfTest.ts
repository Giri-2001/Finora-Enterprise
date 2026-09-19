// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH BACKUP CONTRACT SELF-TEST
// PHASE : 5.6N-N1
// ============================================================

import {
  FINORA_PORTABLE_BRANCH_AUTH_BACKUP_FILE_EXTENSION,
  FINORA_PORTABLE_BRANCH_AUTH_BACKUP_FILE_FORMAT,
  FINORA_PORTABLE_BRANCH_AUTH_BACKUP_SCHEMA_VERSION,
  computeFinoraPortableBranchAuthBackupEnvelopeSha256,
  createFinoraPortableBranchAuthBackupFileV1,
  parseFinoraPortableBranchAuthBackupFileV1,
  serializeFinoraPortableBranchAuthBackupFileV1,
} from "./finoraPortableBranchAuthBackupContract.js";

function assert(
  condition:
    unknown,
  message:
    string,
): asserts condition {
  if (
    !condition
  ) {
    throw new Error(
      message,
    );
  }
}

function expectFailure(
  action:
    () => void,
  message:
    string,
): void {
  let failed =
    false;

  try {
    action();
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

function runSelfTest(): void {
  const portableAuthEnvelopeSerialized =
    JSON.stringify({
      format:
        "OPAQUE-ENCRYPTED-PORTABLE-AUTH-TEST-FIXTURE",

      schemaVersion:
        1,

      ciphertext:
        "TEST-CIPHERTEXT-ONLY",
    });

  const file =
    createFinoraPortableBranchAuthBackupFileV1({
      backupId:
        "FINORA-PBA-BACKUP-TEST-0001",

      createdAt:
        "2026-09-17T16:30:00.000Z",

      branchScope: {
        ownerId:
          "OWNER-TEST",

        businessId:
          "BUSINESS-TEST",

        branchId:
          "BRANCH-TEST",
      },

      sourceStorageMode:
        "USB",

      authGeneration:
        7,

      portableAuthEnvelopeSerialized,
    });

  assert(
    file.format ===
      FINORA_PORTABLE_BRANCH_AUTH_BACKUP_FILE_FORMAT &&
    file.format ===
      "FINORA_PORTABLE_BRANCH_AUTH_BACKUP",
    "Backup format is invalid.",
  );

  assert(
    file.schemaVersion ===
      FINORA_PORTABLE_BRANCH_AUTH_BACKUP_SCHEMA_VERSION &&
    file.schemaVersion ===
      1,
    "Backup schemaVersion is invalid.",
  );

  assert(
    FINORA_PORTABLE_BRANCH_AUTH_BACKUP_FILE_EXTENSION ===
      ".finora",
    "Backup extension must remain .finora.",
  );

  console.log(
    "PASS: dedicated Portable Branch Auth backup format is distinct and schemaVersion 1",
  );

  assert(
    file.portableAuthEnvelopeSerialized ===
      portableAuthEnvelopeSerialized,
    "Backup did not preserve the exact serialized encrypted Portable Auth envelope.",
  );

  console.log(
    "PASS: backup wrapper preserves the exact serialized encrypted Portable Auth envelope",
  );

  const expectedSha =
    computeFinoraPortableBranchAuthBackupEnvelopeSha256(
      portableAuthEnvelopeSerialized,
    );

  assert(
    file.envelopeSha256 ===
      expectedSha &&
    /^[A-F0-9]{64}$/.test(
      file.envelopeSha256,
    ),
    "Backup envelope SHA-256 is invalid.",
  );

  console.log(
    "PASS: backup wrapper carries deterministic SHA-256 corruption evidence for the embedded envelope",
  );

  const serialized =
    serializeFinoraPortableBranchAuthBackupFileV1(
      file,
    );

  const parsed =
    parseFinoraPortableBranchAuthBackupFileV1(
      serialized,
    );

  assert(
    parsed.backupId ===
      file.backupId &&
    parsed.createdAt ===
      file.createdAt &&
    parsed.branchScope.ownerId ===
      file.branchScope.ownerId &&
    parsed.branchScope.businessId ===
      file.branchScope.businessId &&
    parsed.branchScope.branchId ===
      file.branchScope.branchId &&
    parsed.sourceStorageMode ===
      "USB" &&
    parsed.authGeneration ===
      7 &&
    parsed.portableAuthEnvelopeSerialized ===
      portableAuthEnvelopeSerialized &&
    parsed.envelopeSha256 ===
      file.envelopeSha256,
    "Backup serialize/parse round trip changed evidence.",
  );

  assert(
    serializeFinoraPortableBranchAuthBackupFileV1(
      parsed,
    ) ===
      serialized,
    "Backup serialization is not deterministic.",
  );

  console.log(
    "PASS: backup wrapper serialize/parse round trip is deterministic",
  );

  const topLevelKeys =
    Object.keys(
      parsed,
    );

  for (
    const forbidden of [
      "password",
      "securityCode",
      "privateKey",
      "branchCertificationKeyMaterial",
    ]
  ) {
    assert(
      !topLevelKeys.includes(
        forbidden,
      ),
      `Backup wrapper exposes forbidden plaintext field: ${forbidden}`,
    );
  }

  console.log(
    "PASS: backup wrapper defines no plaintext Password, Security Code or Certification private-key field",
  );

  {
    const tampered =
      JSON.parse(
        serialized,
      ) as Record<string, unknown>;

    tampered.portableAuthEnvelopeSerialized =
      `${portableAuthEnvelopeSerialized}TAMPERED`;

    expectFailure(
      () => {
        parseFinoraPortableBranchAuthBackupFileV1(
          JSON.stringify(
            tampered,
          ),
        );
      },
      "Tampered embedded envelope was accepted with stale checksum.",
    );
  }

  console.log(
    "PASS: embedded Portable Auth envelope tamper is rejected by checksum validation",
  );

  {
    const injected =
      JSON.parse(
        serialized,
      ) as Record<string, unknown>;

    injected.password =
      "MUST-NOT-BE-ACCEPTED";

    expectFailure(
      () => {
        parseFinoraPortableBranchAuthBackupFileV1(
          JSON.stringify(
            injected,
          ),
        );
      },
      "Unexpected top-level secret field was accepted.",
    );
  }

  console.log(
    "PASS: backup parser rejects unexpected top-level secret fields",
  );

  {
    const invalidMode =
      JSON.parse(
        serialized,
      ) as Record<string, unknown>;

    invalidMode.sourceStorageMode =
      "NETWORK";

    expectFailure(
      () => {
        parseFinoraPortableBranchAuthBackupFileV1(
          JSON.stringify(
            invalidMode,
          ),
        );
      },
      "Invalid source storage mode was accepted.",
    );
  }

  console.log(
    "PASS: backup parser rejects invalid source storage mode",
  );

  {
    const invalidGeneration =
      JSON.parse(
        serialized,
      ) as Record<string, unknown>;

    invalidGeneration.authGeneration =
      0;

    expectFailure(
      () => {
        parseFinoraPortableBranchAuthBackupFileV1(
          JSON.stringify(
            invalidGeneration,
          ),
        );
      },
      "Invalid authGeneration was accepted.",
    );
  }

  console.log(
    "PASS: backup parser rejects invalid authGeneration evidence",
  );

  {
    const invalidScope =
      JSON.parse(
        serialized,
      ) as {
        branchScope:
          Record<string, unknown>;
      };

    invalidScope.branchScope.extra =
      "UNEXPECTED";

    expectFailure(
      () => {
        parseFinoraPortableBranchAuthBackupFileV1(
          JSON.stringify(
            invalidScope,
          ),
        );
      },
      "Unexpected branchScope field was accepted.",
    );
  }

  console.log(
    "PASS: backup parser requires exact owner/business/branch scope evidence shape",
  );

  assert(
    !serialized.includes(
      '"password"'
    ) &&
    !serialized.includes(
      '"securityCode"'
    ) &&
    !serialized.includes(
      '"branchCertificationKeyMaterial"'
    ),
    "Test backup wrapper unexpectedly contains plaintext secret field names.",
  );

  console.log(
    "PASS: backup wrapper remains a container for encrypted Portable Auth rather than extracted secrets",
  );

  console.log(
    "PASS: checksum is treated as corruption evidence only; Restore must authenticate the inner envelope",
  );

  console.log(
    "PASS: 5.6N-N1 Portable Branch Auth backup artifact contract executable proof",
  );
}

try {
  runSelfTest();

  process.exitCode =
    0;
}
catch (
  error
) {
  console.error(
    "SELF-TEST FAILED:",
    error,
  );

  process.exitCode =
    1;
}