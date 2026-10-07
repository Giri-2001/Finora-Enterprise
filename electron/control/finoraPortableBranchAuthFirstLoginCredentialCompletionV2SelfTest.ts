import {
  app,
  safeStorage,
} from "electron";

import {
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  dirname,
  join,
} from "node:path";

import {
  FINORA_PORTABLE_BRANCH_AUTH_PAYLOAD_SCHEMA_VERSION,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraPortableBranchAuthVerifierV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  generateFinoraBranchCertificationKeyMaterial,
} from "./finoraBranchCertificationCrypto.js";

import {
  createFinoraPortableBranchAuthEnrollmentMaterialV2,
  decryptFinoraPortableBranchAuthEnvelopeV2WithPassword,
  decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode,
} from "./finoraPortableBranchAuthV2Crypto.js";

import {
  FinoraPortableBranchAuthV2Store,
} from "./finoraPortableBranchAuthV2Store.js";

import {
  readFinoraControlStore,
} from "./finoraControlStore.js";

import type {
  FinoraControlBranchCredential,
  FinoraControlBranchCredentialVerifierV1,
  FinoraControlStorePackage,
} from "./finoraControlStore.js";

import {
  completeFinoraPortableBranchAuthFirstLoginCredentialsV2,
} from "./finoraPortableBranchAuthFirstLoginCredentialCompletionCoordinatorV2.js";

import {
  createFinoraPortableBranchAuthTestSourceAuthorizationEvidence,
} from "./finoraPortableBranchAuthTestEvidence.js";

// ============================================================
// HELPERS
// ============================================================

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

function cloneJson<T>(
  value:
    T,
): T {
  return JSON.parse(
    JSON.stringify(
      value,
    ),
  ) as T;
}

function jsonEqual(
  left:
    unknown,
  right:
    unknown,
): boolean {
  return JSON.stringify(
    left,
  ) ===
    JSON.stringify(
      right,
    );
}

function toControlCredentialVerifier(
  verifier:
    FinoraPortableBranchAuthVerifierV1,
): FinoraControlBranchCredentialVerifierV1 {
  return {
    algorithm:
      "SCRYPT",

    saltEncoding:
      "BASE64",

    salt:
      verifier.salt,

    derivedKeyEncoding:
      "BASE64",

    derivedKey:
      verifier.verifier,

    keyLength:
      32,

    N:
      verifier.N,

    r:
      verifier.r,

    p:
      verifier.p,
  };
}

async function encryptControlFixture(
  plainText:
    string,
): Promise<Buffer> {
  if (
    await safeStorage.isAsyncEncryptionAvailable()
  ) {
    return safeStorage.encryptStringAsync(
      plainText,
    );
  }

  if (
    safeStorage.isEncryptionAvailable()
  ) {
    return safeStorage.encryptString(
      plainText,
    );
  }

  throw new Error(
    "Secure operating-system encryption is unavailable for First Login V2 self-test.",
  );
}

async function writeEncryptedControlFixture(
  userDataRoot:
    string,
  value:
    unknown,
): Promise<void> {
  const controlFile =
    join(
      userDataRoot,
      "FINORA",
      "control",
      "finora-control.bin",
    );

  await mkdir(
    dirname(
      controlFile,
    ),
    {
      recursive:
        true,

      mode:
        0o700,
    },
  );

  const encrypted =
    await encryptControlFixture(
      JSON.stringify(
        value,
      ),
    );

  await writeFile(
    controlFile,
    encrypted,
    {
      mode:
        0o600,
    },
  );
}

// ============================================================
// MAIN
// ============================================================

async function runSelfTest():
  Promise<void> {
  let temporaryUserData:
    string |
    undefined;

  const originalFetch =
    globalThis.fetch;

  try {
    assert(
      !app.isReady(),
      "First Login V2 self-test must configure userData before Electron readiness.",
    );

    temporaryUserData =
      await mkdtemp(
        join(
          tmpdir(),
          "finora-first-login-v2-",
        ),
      );

    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    process.env.FINORA_DEV_CONTROL_STORE_DIAGNOSTICS =
      "0";

    const emptyResult =
      await readFinoraControlStore();

    assert(
      emptyResult.success &&
      emptyResult.data,
      emptyResult.error ??
        "Unable to create isolated empty Control Store.",
    );

    const emptyStore:
      FinoraControlStorePackage =
      cloneJson(
        emptyResult.data,
      );

    console.log(
      "PASS: isolated Forgot Password V2 userData configured",
    );

    const sourceAuthorizationId =
      "FINORA-SOURCE-AUTH-FORGOT-PASSWORD-000001";

    const credentialId =
      "FINORA-CREDENTIAL-FORGOT-PASSWORD-000001";

    const authStateId =
      "FINORA-PORTABLE-AUTH-STATE-FORGOT-PASSWORD-000001";

    const ownerId =
      "OWNER-FORGOT-PASSWORD-000001";

    const businessId =
      "BUSINESS-FORGOT-PASSWORD-000001";

    const branchId =
      "BRANCH-FORGOT-PASSWORD-000001";

    const userId =
      "USER-FORGOT-PASSWORD-000001";

    const initialAt =
      "2020-01-01T00:00:00.000Z";

    const oldPassword =
      "Forgot-Old-Password-123";

    const securityCode =
      "Forgot-Security-Code-9876";

    const newPassword =
      "FirstLogin-New-Password-456";

    const newSecurityCode =
      "FirstLogin-New-Security-654";

    const evidence =
      createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
        sourceAuthorizationId,
      );

    const branchCertificationKeyMaterial =
      generateFinoraBranchCertificationKeyMaterial(
        new Date(
          initialAt,
        ),
      );

    const initialMaterial =
      await createFinoraPortableBranchAuthEnrollmentMaterialV2({
        payload: {
          schemaVersion:
            FINORA_PORTABLE_BRANCH_AUTH_PAYLOAD_SCHEMA_VERSION,

          authStateId,

          sourceAuthorizationId,

          sourceAuthorizationVerificationEvidence:
            evidence,

          ownerId,
          businessId,
          branchId,
          userId,

          username:
            "admin",

          fullName:
            "FINORA Admin",

          role:
            "ADMIN",

          dataContext:
            "REAL",

          storageMode:
            "LOCAL",

          authGeneration:
            1,

          createdAt:
            initialAt,

          updatedAt:
            initialAt,

          canonicalUsername:
            "admin",

          branchCertificationKeyMaterial:
            structuredClone(
              branchCertificationKeyMaterial,
            ),
        },

        password:
          oldPassword,

        securityCode,
      });

    const expectedCredential:
      FinoraControlBranchCredential = {
      schemaVersion:
        1,

      credentialId,

      sourceAuthorizationId,

      authGeneration:
        1,

      userId,

      username:
        "admin",

      canonicalUsername:
        "admin",

      fullName:
        "FINORA Admin",

      role:
        "ADMIN",

      ownerId,
      businessId,
      branchId,

      storageMode:
        "LOCAL",

      dataContext:
        "REAL",

      status:
        "ACTIVE",

      credentialChangeRequired:
        true,

      verifier:
        toControlCredentialVerifier(
          initialMaterial.passwordVerifier,
        ),

      securityVerifier:
        toControlCredentialVerifier(
          initialMaterial.securityVerifier,
        ),

      createdAt:
        initialAt,

      updatedAt:
        initialAt,
    };

    async function seedControlFixture():
      Promise<void> {
      const fixture:
        FinoraControlStorePackage =
        cloneJson(
          emptyStore,
        );

      fixture.branchCredentials = [
        cloneJson(
          expectedCredential,
        ),
      ];

      fixture.portableBranchAuthV2CredentialRotationTransactions =
        [];

      fixture.updatedAt =
        initialAt;

      await writeEncryptedControlFixture(
        temporaryUserData!,
        fixture,
      );
    }

    async function createPortableCase(
      caseName:
        string,
    ): Promise<FinoraPortableBranchAuthV2Store> {
      const root =
        join(
          temporaryUserData!,
          `portable-${caseName}`,
        );

      const store =
        new FinoraPortableBranchAuthV2Store({
          resolveLocalRoot:
            () =>
              root,

          resolveUsbRoot:
            async () =>
              null,
        });

      const seedResult =
        await store.ensureExact(
          "LOCAL",
          initialMaterial.envelope,
        );

      assert(
        seedResult ===
          "WRITTEN",
        `${caseName}: unable to seed Portable Auth fixture.`,
      );

      return store;
    }

    // ========================================================
    // CASE 1 - WRONG TEMP SECURITY CODE
    // ========================================================

    await seedControlFixture();

    const wrongCodePortable =
      await createPortableCase(
        "wrong-temp-security-code",
      );

    let wrongCodeFetchCalls =
      0;

    globalThis.fetch =
      (async () => {
        wrongCodeFetchCalls +=
          1;

        return new Response(
          JSON.stringify({
            ok:
              true,

            credentialChangeRequired:
              false,

            alreadyApplied:
              false,
          }),
          {
            status:
              200,

            headers: {
              "content-type":
                "application/json",
            },
          },
        );
      }) as typeof fetch;

    const wrongCodeResult =
      await completeFinoraPortableBranchAuthFirstLoginCredentialsV2({
        request: {
          rotationRequestId:
            "FIRST-LOGIN-WRONG-CODE-000001",

          username:
            "admin",

          currentPassword:
            oldPassword,

          currentSecurityCode:
            "WRONG-TEMP-SECURITY-CODE",

          newPassword,

          newSecurityCode,
        },

        portableStore:
          wrongCodePortable,
      });

    assert(
      !wrongCodeResult.success,
      "Wrong temporary Security Code was not rejected.",
    );

    assert(
      wrongCodeFetchCalls ===
        0,
      "Wrong temporary Security Code unexpectedly reached server.",
    );

    const wrongCodeControl =
      await readFinoraControlStore();

    assert(
      wrongCodeControl.success &&
      wrongCodeControl.data,
      wrongCodeControl.error ??
        "Unable to read Control Store after wrong temp Security Code.",
    );

    assert(
      (
        wrongCodeControl.data
          .portableBranchAuthV2CredentialRotationTransactions ??
        []
      ).length ===
        0,
      "Wrong temporary Security Code created PREPARED transaction.",
    );

    console.log(
      "PASS: wrong temporary Security Code rejected before server and PREPARED",
    );

    // ========================================================
    // CASE 2 - SERVER FAILURE
    // ========================================================

    await seedControlFixture();

    const serverFailurePortable =
      await createPortableCase(
        "server-failure",
      );

    let serverFailureFetchCalls =
      0;

    globalThis.fetch =
      (async () => {
        serverFailureFetchCalls +=
          1;

        throw new Error(
          "Simulated first-login server outage",
        );
      }) as typeof fetch;

    const serverFailureResult =
      await completeFinoraPortableBranchAuthFirstLoginCredentialsV2({
        request: {
          rotationRequestId:
            "FIRST-LOGIN-SERVER-FAIL-000001",

          username:
            "admin",

          currentPassword:
            oldPassword,

          currentSecurityCode:
            securityCode,

          newPassword,

          newSecurityCode,
        },

        portableStore:
          serverFailurePortable,
      });

    assert(
      !serverFailureResult.success &&
      serverFailureResult.errorCode ===
        "SERVER_UNAVAILABLE",
      serverFailureResult.success
        ? "Server-failure case unexpectedly succeeded."
        : `Unexpected server-failure code: ${serverFailureResult.errorCode}`,
    );

    assert(
      serverFailureFetchCalls ===
        1,
      "Server-failure case did not perform exactly one server request.",
    );

    const serverFailureControl =
      await readFinoraControlStore();

    assert(
      serverFailureControl.success &&
      serverFailureControl.data,
      serverFailureControl.error ??
        "Unable to read Control Store after first-login server failure.",
    );

    assert(
      (
        serverFailureControl.data
          .portableBranchAuthV2CredentialRotationTransactions ??
        []
      ).length ===
        0,
      "Server failure incorrectly persisted PREPARED transaction.",
    );

    const serverFailureCredential =
      serverFailureControl.data.branchCredentials?.find(
        (credential) =>
          credential.credentialId ===
            credentialId,
      );

    assert(
      serverFailureCredential?.authGeneration ===
        1 &&
      serverFailureCredential.credentialChangeRequired ===
        true,
      "Server failure mutated authoritative first-login credential.",
    );

    console.log(
      "PASS: server failure created no PREPARED state and preserved temporary credential",
    );

    // ========================================================
    // CASE 3 - SUCCESS
    // ========================================================

    await seedControlFixture();

    const successPortable =
      await createPortableCase(
        "success",
      );

    let successFetchCalls =
      0;

    globalThis.fetch =
      (async (
        input:
          Parameters<typeof fetch>[0],
        init?:
          Parameters<typeof fetch>[1],
      ) => {
        successFetchCalls +=
          1;

        assert(
          String(
            input,
          ).endsWith(
            "/owner/credentials/complete-first-login",
          ),
          "First Login called wrong server endpoint.",
        );

        assert(
          init?.method ===
            "POST",
          "First Login server completion was not POST.",
        );

        assert(
          typeof init?.body ===
            "string",
          "First Login server request body missing.",
        );

        const body =
          JSON.parse(
            init.body,
          ) as Record<string, unknown>;

        assert(
          body.username ===
            "admin" &&
          body.currentPassword ===
            oldPassword &&
          body.currentSecurityCode ===
            securityCode &&
          body.newPassword ===
            newPassword &&
          body.newSecurityCode ===
            newSecurityCode,
          "First Login server request body incorrect.",
        );

        return new Response(
          JSON.stringify({
            ok:
              true,

            credentialChangeRequired:
              false,

            alreadyApplied:
              false,
          }),
          {
            status:
              200,

            headers: {
              "content-type":
                "application/json",
            },
          },
        );
      }) as typeof fetch;

    const successResult =
      await completeFinoraPortableBranchAuthFirstLoginCredentialsV2({
        request: {
          rotationRequestId:
            "FIRST-LOGIN-SUCCESS-000001",

          username:
            "  ADMIN  ",

          currentPassword:
            oldPassword,

          currentSecurityCode:
            securityCode,

          newPassword,

          newSecurityCode,
        },

        portableStore:
          successPortable,
      });

    assert(
      successResult.success,
      successResult.success
        ? "Unexpected success assertion state."
        : successResult.error,
    );

    assert(
      successFetchCalls ===
        1,
      "Successful First Login did not perform exactly one server request.",
    );

    assert(
      successResult.data.authGeneration ===
        2 &&
      successResult.data.credential.authGeneration ===
        2,
      "First Login did not advance authGeneration exactly once.",
    );

    assert(
      successResult.data.credential.credentialChangeRequired ===
        false,
      "First Login did not clear credentialChangeRequired.",
    );

    const successEnvelope =
      await successPortable.read(
        "LOCAL",
      );

    assert(
      successEnvelope !==
        null,
      "First Login did not persist successor Portable Auth.",
    );

    const passwordPayload =
      await decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
        successEnvelope,
        newPassword,
      );

    const securityPayload =
      await decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode(
        successEnvelope,
        newSecurityCode,
      );

    assert(
      jsonEqual(
        passwordPayload,
        securityPayload,
      ),
      "Permanent Password and Security Code do not unlock same successor payload.",
    );

    let oldPasswordRejected =
      false;

    try {
      await decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
        successEnvelope,
        oldPassword,
      );
    }
    catch {
      oldPasswordRejected =
        true;
    }

    assert(
      oldPasswordRejected,
      "Temporary Password still unlocks successor Portable Auth.",
    );

    let oldSecurityCodeRejected =
      false;

    try {
      await decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode(
        successEnvelope,
        securityCode,
      );
    }
    catch {
      oldSecurityCodeRejected =
        true;
    }

    assert(
      oldSecurityCodeRejected,
      "Temporary Security Code still unlocks successor Portable Auth.",
    );

    const successControl =
      await readFinoraControlStore();

    assert(
      successControl.success &&
      successControl.data,
      successControl.error ??
        "Unable to read Control Store after successful First Login.",
    );

    const finalCredential =
      successControl.data.branchCredentials?.find(
        (credential) =>
          credential.credentialId ===
            credentialId,
      );

    assert(
      finalCredential !==
        undefined &&
      finalCredential.authGeneration ===
        2 &&
      finalCredential.credentialChangeRequired ===
        false,
      "Control credential did not reach permanent first-login state.",
    );

    const completedTransactions =
      (
        successControl.data
          .portableBranchAuthV2CredentialRotationTransactions ??
        []
      ).filter(
        (transaction) =>
          transaction.rotationRequestId ===
            "FIRST-LOGIN-SUCCESS-000001",
      );

    assert(
      completedTransactions.length ===
        1 &&
      completedTransactions[0].status ===
        "COMPLETE" &&
      completedTransactions[0].targetGeneration ===
        2,
      "Successful First Login did not finish exactly one COMPLETE transaction.",
    );

    console.log(
      "PASS: permanent Password + Security Code authoritative",
    );

    console.log(
      "PASS: temporary Password + Security Code stale",
    );

    console.log(
      "PASS: Portable + Control generation synchronized",
    );

    console.log(
      "PASS: first-login transaction reached COMPLETE",
    );

    console.log(
      "",
    );

    console.log(
      "PASS: FINORA FIRST LOGIN V2 SELF-TEST",
    );
  }
  finally {
    globalThis.fetch =
      originalFetch;

    if (
      temporaryUserData !==
        undefined
    ) {
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
        "PASS: isolated First Login V2 self-test root deleted",
      );
    }
  }
}

void runSelfTest().then(
  () => {
    app.exit(
      0,
    );
  },
  (
    error,
  ) => {
    console.error(
      "",
    );

    console.error(
      "SELF-TEST FAILED",
    );

    console.error(
      error,
    );

    if (
      app.isReady()
    ) {
      app.exit(
        1,
      );

      return;
    }

    process.exitCode =
      1;
  },
);