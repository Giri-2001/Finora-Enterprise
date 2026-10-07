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
  recoverFinoraPortableBranchAuthPasswordV2,
} from "./finoraPortableBranchAuthPasswordRecoveryCoordinatorV2.js";

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
    "Secure operating-system encryption is unavailable for Forgot Password V2 self-test.",
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
      "Forgot Password V2 self-test must configure userData before Electron readiness.",
    );

    temporaryUserData =
      await mkdtemp(
        join(
          tmpdir(),
          "finora-forgot-password-v2-",
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
      "Forgot-New-Password-456";

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
    // CASE 1 - WRONG SECURITY CODE
    // Must fail before server call and before durable journal.
    // ========================================================

    await seedControlFixture();

    const wrongCodePortable =
      await createPortableCase(
        "wrong-security-code",
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
      await recoverFinoraPortableBranchAuthPasswordV2({
        request: {
          recoveryRequestId:
            "FORGOT-REQUEST-WRONG-CODE-000001",

          username:
            "admin",

          currentSecurityCode:
            "WRONG-SECURITY-CODE",

          newPassword,
        },

        portableStore:
          wrongCodePortable,
      });

    assert(
      !wrongCodeResult.success &&
      wrongCodeResult.errorCode ===
        "INVALID_CREDENTIALS",
      "Wrong Security Code was not rejected.",
    );

    assert(
      wrongCodeFetchCalls ===
        0,
      "Wrong Security Code unexpectedly reached the server.",
    );

    const wrongCodeControl =
      await readFinoraControlStore();

    assert(
      wrongCodeControl.success &&
      wrongCodeControl.data &&
      (
        wrongCodeControl.data
          .portableBranchAuthV2CredentialRotationTransactions ??
        []
      ).length ===
        0,
      "Wrong Security Code created a durable credential transaction.",
    );

    console.log(
      "PASS: wrong Security Code rejected before server and before PREPARED",
    );

    // ========================================================
    // CASE 2 - SERVER UNAVAILABLE
    // Local successor may be derived in memory, but absolutely
    // no PREPARED journal or Portable/Control mutation may occur.
    // ========================================================

    await seedControlFixture();

    const unavailablePortable =
      await createPortableCase(
        "server-unavailable",
      );

    let unavailableFetchCalls =
      0;

    globalThis.fetch =
      (async () => {
        unavailableFetchCalls +=
          1;

        throw new Error(
          "NETWORK_UNAVAILABLE_TEST",
        );
      }) as typeof fetch;

    const unavailableResult =
      await recoverFinoraPortableBranchAuthPasswordV2({
        request: {
          recoveryRequestId:
            "FORGOT-REQUEST-SERVER-FAIL-000001",

          username:
            "admin",

          currentSecurityCode:
            securityCode,

          newPassword,
        },

        portableStore:
          unavailablePortable,
      });

    assert(
      !unavailableResult.success &&
      unavailableResult.errorCode ===
        "SERVER_UNAVAILABLE",
      "Server-unavailable Forgot Password did not fail closed.",
    );

    assert(
      unavailableFetchCalls ===
        1,
      "Server-unavailable case did not perform exactly one reset request.",
    );

    const unavailableControl =
      await readFinoraControlStore();

    assert(
      unavailableControl.success &&
      unavailableControl.data,
      unavailableControl.error ??
        "Unable to read Control Store after server failure.",
    );

    assert(
      (
        unavailableControl.data
          .portableBranchAuthV2CredentialRotationTransactions ??
        []
      ).length ===
        0,
      "Server failure incorrectly persisted PREPARED transaction.",
    );

    const unavailableCredential =
      unavailableControl.data.branchCredentials?.find(
        (credential) =>
          credential.credentialId ===
            credentialId,
      );

    assert(
      unavailableCredential?.authGeneration ===
        1 &&
      jsonEqual(
        unavailableCredential.securityVerifier,
        expectedCredential.securityVerifier,
      ) &&
      jsonEqual(
        unavailableCredential.verifier,
        expectedCredential.verifier,
      ),
      "Server failure mutated authoritative Control credential.",
    );

    const unavailableEnvelope =
      await unavailablePortable.read(
        "LOCAL",
      );

    assert(
      unavailableEnvelope !==
        null,
      "Server failure lost Portable Auth state.",
    );

    await decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
      unavailableEnvelope,
      oldPassword,
    );

    console.log(
      "PASS: server failure created no PREPARED state and left local credential untouched",
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
            "/owner/password/reset",
          ),
          "Forgot Password called the wrong server endpoint.",
        );

        assert(
          init?.method ===
            "POST",
          "Forgot Password server reset was not POST.",
        );

        assert(
          typeof init?.body ===
            "string",
          "Forgot Password server request body is missing.",
        );

        const body =
          JSON.parse(
            init.body,
          ) as Record<string, unknown>;

        assert(
          body.username ===
            "admin" &&
          body.securityCode ===
            securityCode &&
          body.newPassword ===
            newPassword,
          "Forgot Password server request body is incorrect.",
        );

        assert(
          !Object.prototype.hasOwnProperty.call(
            body,
            "currentPassword",
          ),
          "Forgot Password server request leaked an old Password field.",
        );

        return new Response(
          JSON.stringify({
            ok:
              true,
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
      await recoverFinoraPortableBranchAuthPasswordV2({
        request: {
          recoveryRequestId:
            "FORGOT-REQUEST-SUCCESS-000001",

          username:
            "  ADMIN  ",

          currentSecurityCode:
            securityCode,

          newPassword,
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
      "Successful Forgot Password did not perform exactly one server reset.",
    );

    assert(
      successResult.data.authGeneration ===
        2 &&
      successResult.data.credential.authGeneration ===
        2,
      "Forgot Password did not advance authGeneration exactly once.",
    );

    assert(
      jsonEqual(
        successResult.data.credential.securityVerifier,
        expectedCredential.securityVerifier,
      ),
      "Forgot Password changed Security Code verifier.",
    );

    assert(
      successResult.data.credential.createdAt ===
        initialAt,
      "Forgot Password changed immutable credential createdAt.",
    );

    const successEnvelope =
      await successPortable.read(
        "LOCAL",
      );

    assert(
      successEnvelope !==
        null,
      "Forgot Password did not persist successor Portable Auth.",
    );

    const passwordPayload =
      await decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
        successEnvelope,
        newPassword,
      );

    const recoveryPayload =
      await decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode(
        successEnvelope,
        securityCode,
      );

    assert(
      jsonEqual(
        passwordPayload,
        recoveryPayload,
      ),
      "New Password and unchanged Security Code do not resolve to the same successor payload.",
    );

    assert(
      passwordPayload.authGeneration ===
        2 &&
      passwordPayload.authGeneration ===
        successResult.data.credential.authGeneration,
      "Portable and Control authGeneration diverged.",
    );

    assert(
      passwordPayload.updatedAt ===
        successResult.data.credential.updatedAt,
      "Portable and Control updatedAt diverged.",
    );

    assert(
      passwordPayload.createdAt ===
        initialAt,
      "Forgot Password changed Portable payload createdAt.",
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
      "Old Password still unlocks successor Portable Auth.",
    );

    const successControl =
      await readFinoraControlStore();

    assert(
      successControl.success &&
      successControl.data,
      successControl.error ??
        "Unable to read Control Store after successful Forgot Password.",
    );

    const finalCredential =
      successControl.data.branchCredentials?.find(
        (credential) =>
          credential.credentialId ===
            credentialId,
      );

    assert(
      finalCredential !==
        undefined,
      "Successful Forgot Password lost authoritative credential.",
    );

    assert(
      finalCredential.authGeneration ===
        2 &&
      finalCredential.updatedAt ===
        passwordPayload.updatedAt &&
      jsonEqual(
        finalCredential.securityVerifier,
        expectedCredential.securityVerifier,
      ),
      "Control credential does not match successful password-only successor.",
    );

    const completedTransactions =
      (
        successControl.data
          .portableBranchAuthV2CredentialRotationTransactions ??
        []
      ).filter(
        (transaction) =>
          transaction.rotationRequestId ===
            "FORGOT-REQUEST-SUCCESS-000001",
      );

    assert(
      completedTransactions.length ===
        1 &&
      completedTransactions[0].status ===
        "COMPLETE" &&
      completedTransactions[0].targetGeneration ===
        2,
      "Successful Forgot Password did not finish exactly one durable V2 transaction.",
    );

    console.log(
      "PASS: Security Code remained reusable and unchanged",
    );

    console.log(
      "PASS: new Password works and predecessor Password is stale",
    );

    console.log(
      "PASS: Portable + Control generation/timestamp remain synchronized",
    );

    console.log(
      "PASS: Forgot Password durable transaction reached COMPLETE",
    );

    // ========================================================
    // CASE 4 - SAME CURRENT PASSWORD
    // Must not hit server or consume generation 3.
    // ========================================================

    let samePasswordFetchCalls =
      0;

    globalThis.fetch =
      (async () => {
        samePasswordFetchCalls +=
          1;

        return new Response(
          JSON.stringify({
            ok:
              true,
          }),
          {
            status:
              200,
          },
        );
      }) as typeof fetch;

    const samePasswordResult =
      await recoverFinoraPortableBranchAuthPasswordV2({
        request: {
          recoveryRequestId:
            "FORGOT-REQUEST-SAME-PASSWORD-000001",

          username:
            "admin",

          currentSecurityCode:
            securityCode,

          newPassword,
        },

        portableStore:
          successPortable,
      });

    assert(
      !samePasswordResult.success &&
      samePasswordResult.errorCode ===
        "NEW_PASSWORD_MUST_DIFFER",
      "Same-current-Password reset was not rejected.",
    );

    assert(
      samePasswordFetchCalls ===
        0,
      "Same-current-Password reset unexpectedly reached server.",
    );

    const samePasswordControl =
      await readFinoraControlStore();

    assert(
      samePasswordControl.success &&
      samePasswordControl.data,
      samePasswordControl.error ??
        "Unable to read Control Store after same-password rejection.",
    );

    const samePasswordCredential =
      samePasswordControl.data.branchCredentials?.find(
        (credential) =>
          credential.credentialId ===
            credentialId,
      );

    assert(
      samePasswordCredential?.authGeneration ===
        2,
      "Same-current-Password reset consumed an extra auth generation.",
    );

    console.log(
      "PASS: same-current-Password reset rejected before server without generation advance",
    );

    console.log(
      "",
    );

    console.log(
      "PASS: FINORA FORGOT PASSWORD V2 SELF-TEST",
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
        "PASS: isolated Forgot Password V2 self-test root deleted",
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