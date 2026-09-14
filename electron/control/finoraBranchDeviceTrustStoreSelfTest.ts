/* ============================================================
   FINORA ENTERPRISE OS
   BRANCH DEVICE TRUST STORE RUNTIME SELF-TEST
============================================================ */

import {
  app,
  safeStorage,
} from "electron";

import {
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  dirname,
  join,
} from "node:path";

import {
  tmpdir,
} from "node:os";

import {
  FINORA_BRANCH_DEVICE_TRUST_FORMAT,
  FINORA_BRANCH_DEVICE_TRUST_RECORD_SCHEMA_VERSION,
  FINORA_BRANCH_DEVICE_TRUST_SCHEMA_VERSION,
  getFinoraBranchDeviceTrustStorePath,
  loadFinoraBranchDeviceTrustStore,
  persistFinoraBranchDeviceTrustStore,
  validateFinoraBranchDeviceTrustStoreStateV1,
} from "./finoraBranchDeviceTrustStore.js";

import type {
  FinoraBranchDeviceTrustStoreStateV1,
} from "./finoraBranchDeviceTrustStore.js";

// ============================================================
// ASSERT
// ============================================================

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

function expectRejected(
  label:
    string,
  operation:
    () => void,
): void {
  let rejected =
    false;

  try {
    operation();
  }
  catch {
    rejected =
      true;
  }

  assert(
    rejected,
    `${label} was unexpectedly accepted.`,
  );
}

// ============================================================
// TEST
// ============================================================

async function runSelfTest():
  Promise<void> {
  let temporaryUserData:
    string | undefined;

  let failure:
    unknown;

  try {
    temporaryUserData =
      await mkdtemp(
        join(
          tmpdir(),
          "finora-device-trust-",
        ),
      );

    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    assert(
      safeStorage.isEncryptionAvailable(),
      "Electron safeStorage encryption is unavailable.",
    );

    console.log(
      "PASS: isolated Electron userData configured",
    );

    const missing =
      await loadFinoraBranchDeviceTrustStore();

    assert(
      missing ===
        undefined,
      "Missing Device Trust store did not resolve to no authority.",
    );

    console.log(
      "PASS: missing Device Trust store means no trusted-device authority",
    );

    const trustedAt =
      new Date().toISOString();

    const validState:
      FinoraBranchDeviceTrustStoreStateV1 = {
        format:
          FINORA_BRANCH_DEVICE_TRUST_FORMAT,

        schemaVersion:
          FINORA_BRANCH_DEVICE_TRUST_SCHEMA_VERSION,

        records: [
          {
            authStateId:
              "FINORA-AUTH-STATE-SELFTEST",

            userId:
              "FINORA-USER-SELFTEST",

            canonicalUsername:
              "admin",

            ownerId:
              "FINORA-OWNER-SELFTEST",

            businessId:
              "FINORA-BUSINESS-SELFTEST",

            branchId:
              "FINORA-BRANCH-SELFTEST",

            storageMode:
              "USB",

            dataContext:
              "REAL",

            authGeneration:
              1,

            portableAuthFingerprintAlgorithm:
              "SHA256",

            portableAuthFingerprint:
              "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",

            platform:
              "WINDOWS",

            installationId:
              "FINORA-INSTALLATION-SELFTEST",

            bindingKeyId:
              "FINORA-BINDING-SELFTEST",

            fingerprintAlgorithm:
              "SHA256",

            publicKeyFingerprint:
              "SELFTEST-PUBLIC-KEY-FINGERPRINT",

            trustedAt,

            updatedAt:
              trustedAt,

            schemaVersion:
              FINORA_BRANCH_DEVICE_TRUST_RECORD_SCHEMA_VERSION,
          },
        ],

        updatedAt:
          trustedAt,
      };

    validateFinoraBranchDeviceTrustStoreStateV1(
      validState,
    );

    console.log(
      "PASS: canonical Device Trust state validates",
    );

    expectRejected(
      "extra root field",
      () =>
        validateFinoraBranchDeviceTrustStoreStateV1({
          ...validState,
          unexpected:
            true,
        }),
    );

    console.log(
      "PASS: extra root field rejected",
    );

    expectRejected(
      "non-canonical username",
      () =>
        validateFinoraBranchDeviceTrustStoreStateV1({
          ...validState,

          records: [
            {
              ...validState.records[0],

              canonicalUsername:
                " ADMIN ",
            },
          ],
        }),
    );

    console.log(
      "PASS: non-canonical username rejected",
    );

    expectRejected(
      "invalid Portable Auth fingerprint",
      () =>
        validateFinoraBranchDeviceTrustStoreStateV1({
          ...validState,

          records: [
            {
              ...validState.records[0],

              portableAuthFingerprint:
                "NOT-A-CANONICAL-SHA256",
            },
          ],
        }),
    );

    console.log(
      "PASS: malformed Portable Auth envelope fingerprint rejected",
    );

    const secondDeviceState:
      FinoraBranchDeviceTrustStoreStateV1 = {
        ...validState,

        records: [
          validState.records[0],
          {
            ...validState.records[0],

            installationId:
              "FINORA-INSTALLATION-SECOND",

            bindingKeyId:
              "FINORA-BINDING-SECOND",

            publicKeyFingerprint:
              "SECOND-PUBLIC-KEY-FINGERPRINT",
          },
        ],
      };

    validateFinoraBranchDeviceTrustStoreStateV1(
      secondDeviceState,
    );

    assert(
      secondDeviceState.records.length ===
        2,
      "Same branch/auth-generation did not preserve two distinct trusted devices.",
    );

    console.log(
      "PASS: same branch/auth-generation supports multiple distinct trusted devices",
    );

    const rotatedPortableEnvelopeState:
      FinoraBranchDeviceTrustStoreStateV1 = {
        ...validState,

        records: [
          validState.records[0],
          {
            ...validState.records[0],

            authStateId:
              "FINORA-AUTH-STATE-ROTATED",

            authGeneration:
              2,

            portableAuthFingerprint:
              "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",

            trustedAt,

            updatedAt:
              trustedAt,
          },
        ],
      };

    validateFinoraBranchDeviceTrustStoreStateV1(
      rotatedPortableEnvelopeState,
    );

    assert(
      rotatedPortableEnvelopeState.records.length ===
        2,
      "Rotated Portable Auth lineage could not coexist with historical trust evidence.",
    );

    console.log(
      "PASS: rotated Portable Auth envelope creates distinct trust lineage",
    );

    expectRejected(
      "duplicate exact device authority",
      () =>
        validateFinoraBranchDeviceTrustStoreStateV1({
          ...validState,

          records: [
            validState.records[0],
            {
              ...validState.records[0],
            },
          ],
        }),
    );

    console.log(
      "PASS: duplicate exact Device Trust authority rejected",
    );

    expectRejected(
      "REAL record with demoId",
      () =>
        validateFinoraBranchDeviceTrustStoreStateV1({
          ...validState,

          records: [
            {
              ...validState.records[0],

              demoId:
                "DEMO-INVALID",
            },
          ],
        }),
    );

    console.log(
      "PASS: REAL Device Trust record cannot carry demoId",
    );

    await persistFinoraBranchDeviceTrustStore(
      validState,
    );

    const loaded =
      await loadFinoraBranchDeviceTrustStore();

    assert(
      loaded !==
        undefined &&
      JSON.stringify(
        loaded,
      ) ===
        JSON.stringify(
          validState,
        ),
      "Encrypted Device Trust roundtrip changed state.",
    );

    console.log(
      "PASS: encrypted Device Trust state roundtrips exactly",
    );

    const physicalPath =
      getFinoraBranchDeviceTrustStorePath();

    assert(
      physicalPath ===
        join(
          temporaryUserData,
          "FINORA",
          "auth",
          "finora-device-trust.bin",
        ),
      "Device Trust physical path contract is incorrect.",
    );

    console.log(
      "PASS: physical path is FINORA/auth/finora-device-trust.bin",
    );

    const ciphertext =
      await readFile(
        physicalPath,
      );

    assert(
      ciphertext.length >
        0,
      "Device Trust ciphertext is empty.",
    );

    assert(
      !ciphertext.includes(
        Buffer.from(
          validState.records[0]
            .ownerId,
          "utf8",
        ),
      ) &&
      !ciphertext.includes(
        Buffer.from(
          validState.records[0]
            .bindingKeyId,
          "utf8",
        ),
      ) &&
      !ciphertext.includes(
        Buffer.from(
          validState.records[0]
            .publicKeyFingerprint,
          "utf8",
        ),
      ),
      "Device Trust sensitive authority metadata was persisted as plaintext.",
    );

    console.log(
      "PASS: persisted Device Trust authority metadata is encrypted",
    );

    const malformedCiphertext =
      safeStorage.encryptString(
        JSON.stringify({
          ...validState,

          unexpected:
            true,
        }),
      );

    await writeFile(
      physicalPath,
      malformedCiphertext,
    );

    let malformedRejected =
      false;

    try {
      await loadFinoraBranchDeviceTrustStore();
    }
    catch {
      malformedRejected =
        true;
    }

    assert(
      malformedRejected,
      "Malformed encrypted Device Trust state was accepted.",
    );

    console.log(
      "PASS: malformed encrypted Device Trust state fails closed",
    );

    await persistFinoraBranchDeviceTrustStore(
      validState,
    );

    const restored =
      await loadFinoraBranchDeviceTrustStore();

    assert(
      restored !==
        undefined &&
      JSON.stringify(
        restored,
      ) ===
        JSON.stringify(
          validState,
        ),
      "Canonical Device Trust state did not restore.",
    );

    console.log(
      "PASS: canonical Device Trust state restores after malformed-state rejection",
    );

    const directoryEntries =
      await readdir(
        dirname(
          physicalPath,
        ),
      );

    const leakedTemporaryFiles =
      directoryEntries.filter(
        (
          entry,
        ) =>
          entry.startsWith(
            "finora-device-trust.bin.",
          ) &&
          entry.endsWith(
            ".tmp",
          ),
      );

    assert(
      leakedTemporaryFiles.length ===
        0,
      `Device Trust temporary files leaked: ${leakedTemporaryFiles.join(", ")}`,
    );

    console.log(
      "PASS: Device Trust atomic-write temporary-file cleanup verified",
    );

    const serialized =
      JSON.stringify(
        validState,
      );

    assert(
      !serialized.includes(
        "password",
      ) &&
      !serialized.includes(
        "securityCode",
      ) &&
      !serialized.includes(
        "privateKey",
      ),
      "Device Trust contract contains forbidden secret material.",
    );

    console.log(
      "PASS: Device Trust contract contains no Password, Security Code or private key",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: PHASE 5.6E3D4D1 BRANCH DEVICE TRUST STORE RUNTIME SELFTEST",
    );

    console.log(
      "============================================================",
    );
  }
  catch (
    error
  ) {
    failure =
      error;
  }
  finally {
    if (
      temporaryUserData !==
        undefined
    ) {
      try {
        await rm(
          temporaryUserData,
          {
            recursive:
              true,

            force:
              true,
          },
        );

        console.log(
          "PASS: isolated Device Trust userData deleted",
        );
      }
      catch (
        cleanupError
      ) {
        if (
          !failure
        ) {
          failure =
            cleanupError;
        }
      }
    }
  }

  if (
    failure
  ) {
    throw failure;
  }
}

void runSelfTest()
  .then(
    () => {
      console.log(
        "PASS: Device Trust self-test process exiting with code 0",
      );

      app.exit(
        0,
      );
    },
  )
  .catch(
    (
      error,
    ) => {
      console.error(
        "FAIL: PHASE 5.6E3D4D1 BRANCH DEVICE TRUST STORE RUNTIME SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );