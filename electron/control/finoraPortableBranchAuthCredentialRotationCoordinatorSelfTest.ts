// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH CREDENTIAL ROTATION COORDINATOR SELF TEST
//
// PROVES:
//
// - Password-first failure never reaches Portable Store
// - wrong Security Code never persists PREPARED
// - unchanged plaintext factors never rotate
// - Password-only rotation 1 -> 2
// - Security-Code-only rotation 2 -> 3
// - unchanged factor remains usable across each rotation
// - old factor becomes unusable after its rotation
// - credentialId/sourceAuthorizationId/authStateId remain immutable
// - Control Store credential and Portable Auth converge
// - completed transaction history is retained
// - unrelated Control Store authority state is unchanged
// - plaintext credential factors never enter durable journal
// - LOCAL rotation never consults USB resolver
// ============================================================

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
  authenticateFinoraBranchCredential,
} from "./finoraBranchCredentialAuthenticationService.js";

import {
  createFinoraPortableBranchAuthEnrollmentMaterialV1,
  decryptFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthCrypto.js";

import type {
  FinoraPortableBranchAuthVerifierV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import {
  rotateFinoraPortableBranchAuthCredential,
} from "./finoraPortableBranchAuthCredentialRotationCoordinator.js";

import {
  readFinoraControlStore,
} from "./finoraControlStore.js";

import type {
  FinoraControlBranchCredential,
  FinoraControlBranchCredentialVerifierV1,
  FinoraControlStorePackage,
} from "./finoraControlStore.js";

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
    "Secure operating-system encryption is unavailable for rotation coordinator self-test.",
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

async function expectDecryptFailure(
  envelope:
    Parameters<
      typeof decryptFinoraPortableBranchAuthEnvelopeV1
    >[0],
  password:
    string,
  securityCode:
    string,
  ownerId:
    string,
  businessId:
    string,
  branchId:
    string,
): Promise<void> {
  let failed =
    false;

  try {
    await decryptFinoraPortableBranchAuthEnvelopeV1(
      envelope,
      password,
      securityCode,
      {
        expectedScope: {
          ownerId,
          businessId,
          branchId,
        },
      },
    );
  }
  catch {
    failed =
      true;
  }

  assert(
    failed,
    "Expected Portable Branch Auth decryption to fail.",
  );
}

function normalizeUnrelatedControlState(
  current:
    FinoraControlStorePackage,
  baseline:
    FinoraControlStorePackage,
): FinoraControlStorePackage {
  const normalized =
    cloneJson(
      current,
    );

  normalized.branchCredentials =
    cloneJson(
      baseline.branchCredentials,
    );

  normalized.portableBranchAuthCredentialRotationTransactions =
    cloneJson(
      baseline.portableBranchAuthCredentialRotationTransactions,
    );

  normalized.updatedAt =
    baseline.updatedAt;

  return normalized;
}

// ============================================================
// MAIN
// ============================================================

async function runSelfTest():
  Promise<void> {
  let temporaryUserData:
    string |
    undefined;

  try {
    assert(
      !app.isReady(),
      "Self-test must configure userData before Electron readiness.",
    );

    temporaryUserData =
      await mkdtemp(
        join(
          tmpdir(),
          "finora-portable-auth-rotation-coordinator-",
        ),
      );

    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    process.env.FINORA_DEV_CONTROL_STORE_DIAGNOSTICS =
      "0";

    console.log(
      "PASS: isolated Electron userData configured",
    );

    const emptyResult =
      await readFinoraControlStore();

    assert(
      emptyResult.success &&
      emptyResult.data,
      emptyResult.error ??
        "Unable to create isolated empty Control Store.",
    );

    // ========================================================
    // AUTHORITATIVE GENERATION-1 FIXTURE
    // ========================================================

    const username =
      "admin";

    const currentPassword =
      "Old-Password-123";

    const currentSecurityCode =
      "Old-Security-Code-9876";

    const newPassword =
      "New-Password-456";

    const newSecurityCode =
      "New-Security-Code-6543";

    const wrongPassword =
      "Wrong-Password-000";

    const wrongSecurityCode =
      "Wrong-Security-Code-0000";

    const credentialId =
      "FINORA-CREDENTIAL-ROTATION-COORDINATOR-000001";

    const authStateId =
      "FINORA-PORTABLE-AUTH-STATE-ROTATION-COORDINATOR-000001";

    const sourceAuthorizationId =
      "FINORA-SOURCE-AUTH-ROTATION-COORDINATOR-000001";

    const ownerId =
      "OWNER-ROTATION-COORDINATOR-000001";

    const businessId =
      "BUSINESS-ROTATION-COORDINATOR-000001";

    const branchId =
      "BRANCH-ROTATION-COORDINATOR-000001";

    const userId =
      "USER-ROTATION-COORDINATOR-000001";

    const initialAt =
      "2026-09-14T02:00:00.000Z";

    const sourceEvidence =
      createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
        sourceAuthorizationId,
      );

    const initialMaterial =
      await createFinoraPortableBranchAuthEnrollmentMaterialV1({
        authStateId,

        sourceAuthorizationId,

        sourceAuthorizationVerificationEvidence:
          sourceEvidence,

        ownerId,

        businessId,

        branchId,

        userId,

        username,

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

        password:
          currentPassword,

        securityCode:
          currentSecurityCode,
      });

    const initialCredential:
      FinoraControlBranchCredential = {
      schemaVersion:
        1,

      credentialId,

      sourceAuthorizationId,

      authGeneration:
        1,

      userId,

      username,

      canonicalUsername:
        username,

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

    const seededStore:
      FinoraControlStorePackage =
      cloneJson(
        emptyResult.data,
      );

    seededStore.branchCredentials = [
      initialCredential,
    ];

    seededStore.portableBranchAuthCredentialRotationTransactions =
      [];

    seededStore.updatedAt =
      initialAt;

    await writeEncryptedControlFixture(
      temporaryUserData,
      seededStore,
    );

    const seededRead =
      await readFinoraControlStore();

    assert(
      seededRead.success &&
      seededRead.data &&
      seededRead.data.branchCredentials?.length ===
        1 &&
      jsonEqual(
        seededRead.data.branchCredentials[0],
        initialCredential,
      ),
      seededRead.error ??
        "Generation-1 credential fixture was not readable.",
    );

    let localResolverCalls =
      0;

    let usbResolverCalls =
      0;

    const portableRoot =
      join(
        temporaryUserData,
        "portable-local",
      );

    const portableStore =
      new FinoraPortableBranchAuthStore({
        resolveLocalRoot:
          () => {
            localResolverCalls +=
              1;

            return portableRoot;
          },

        resolveUsbRoot:
          async () => {
            usbResolverCalls +=
              1;

            return null;
          },
      });

    const initialWrite =
      await portableStore.ensureExact(
        "LOCAL",
        initialMaterial.envelope,
      );

    assert(
      initialWrite ===
        "WRITTEN",
      "Initial Portable Branch Auth fixture was not written.",
    );

    const baselineStoreResult =
      await readFinoraControlStore();

    assert(
      baselineStoreResult.success &&
      baselineStoreResult.data,
      baselineStoreResult.error ??
        "Unable to capture baseline Control Store.",
    );

    const baselineStore =
      cloneJson(
        baselineStoreResult.data,
      );

    console.log(
      "PASS: authoritative generation-1 credential and Portable Auth seeded",
    );

    // ========================================================
    // CASE 1 — WRONG PASSWORD
    //
    // Must fail before Portable Store read / Security Code path.
    // ========================================================

    localResolverCalls =
      0;

    usbResolverCalls =
      0;

    const wrongPasswordResult =
      await rotateFinoraPortableBranchAuthCredential({
        request: {
          username,

          currentPassword:
            wrongPassword,

          currentSecurityCode,

          newPassword,
        },

        portableStore,
      });

    assert(
      wrongPasswordResult.success ===
        false &&
      wrongPasswordResult.errorCode ===
        "INVALID_CREDENTIALS",
      "Wrong current Password was not rejected as INVALID_CREDENTIALS.",
    );

    assert(
      localResolverCalls ===
        0,
      `Wrong Password unexpectedly reached Portable Store ${localResolverCalls} time(s).`,
    );

    assert(
      usbResolverCalls ===
        0,
      "Wrong Password unexpectedly consulted USB resolver.",
    );

    const afterWrongPassword =
      await readFinoraControlStore();

    assert(
      afterWrongPassword.success &&
      afterWrongPassword.data &&
      jsonEqual(
        afterWrongPassword.data,
        baselineStore,
      ),
      "Wrong Password mutated durable Control Store state.",
    );

    console.log(
      "PASS: wrong current Password rejected before Portable Store access",
    );

    // ========================================================
    // CASE 2 — WRONG SECURITY CODE
    //
    // Password succeeds, Portable Auth is read, decrypt fails.
    // PREPARED must not exist.
    // ========================================================

    const wrongSecurityResult =
      await rotateFinoraPortableBranchAuthCredential({
        request: {
          username,

          currentPassword,

          currentSecurityCode:
            wrongSecurityCode,

          newPassword,
        },

        portableStore,
      });

    assert(
      wrongSecurityResult.success ===
        false &&
      wrongSecurityResult.errorCode ===
        "CURRENT_PORTABLE_AUTH_AUTHENTICATION_FAILED",
      "Wrong Security Code was not rejected before rotation preparation.",
    );

    const afterWrongSecurity =
      await readFinoraControlStore();

    assert(
      afterWrongSecurity.success &&
      afterWrongSecurity.data &&
      jsonEqual(
        afterWrongSecurity.data,
        baselineStore,
      ),
      "Wrong Security Code mutated durable Control Store state.",
    );

    const portableAfterWrongSecurity =
      await portableStore.read(
        "LOCAL",
      );

    assert(
      portableAfterWrongSecurity !==
        null &&
      jsonEqual(
        portableAfterWrongSecurity,
        initialMaterial.envelope,
      ),
      "Wrong Security Code changed Portable Auth state.",
    );

    console.log(
      "PASS: wrong Security Code rejected before PREPARED mutation",
    );

    // ========================================================
    // CASE 3 — NO ACTUAL FACTOR CHANGE
    // ========================================================

    const noChangeResult =
      await rotateFinoraPortableBranchAuthCredential({
        request: {
          username,

          currentPassword,

          currentSecurityCode,

          newPassword:
            currentPassword,

          newSecurityCode:
            currentSecurityCode,
        },

        portableStore,
      });

    assert(
      noChangeResult.success ===
        false &&
      noChangeResult.errorCode ===
        "NO_CREDENTIAL_CHANGE",
      "Unchanged factors were not rejected.",
    );

    const afterNoChange =
      await readFinoraControlStore();

    assert(
      afterNoChange.success &&
      afterNoChange.data &&
      jsonEqual(
        afterNoChange.data,
        baselineStore,
      ),
      "No-change request created durable rotation state.",
    );

    const portableAfterNoChange =
      await portableStore.read(
        "LOCAL",
      );

    assert(
      portableAfterNoChange !==
        null &&
      jsonEqual(
        portableAfterNoChange,
        initialMaterial.envelope,
      ),
      "No-change request changed Portable Auth state.",
    );

    console.log(
      "PASS: unchanged credential factors rejected before PREPARED mutation",
    );

    // ========================================================
    // CASE 4 — PASSWORD-ONLY ROTATION 1 -> 2
    // ========================================================

    const passwordRotation =
      await rotateFinoraPortableBranchAuthCredential({
        request: {
          username,

          currentPassword,

          currentSecurityCode,

          newPassword,
        },

        portableStore,
      });

    assert(
      passwordRotation.success ===
        true,
      passwordRotation.success
        ? "Unexpected password rotation assertion state."
        : passwordRotation.error,
    );

    assert(
      passwordRotation.data.authGeneration ===
        2 &&
      passwordRotation.data.credential.authGeneration ===
        2 &&
      passwordRotation.data.portableReplaceResult ===
        "REPLACED",
      "Password-only rotation did not commit generation 2.",
    );

    const afterPasswordRotation =
      await readFinoraControlStore();

    assert(
      afterPasswordRotation.success &&
      afterPasswordRotation.data,
      afterPasswordRotation.error ??
        "Unable to read generation-2 Control Store.",
    );

    const generation2Credential =
      afterPasswordRotation.data.branchCredentials?.find(
        (credential) =>
          credential.credentialId ===
            credentialId,
      );

    assert(
      generation2Credential !==
        undefined &&
      generation2Credential.authGeneration ===
        2,
      "Generation-2 authoritative credential was not persisted.",
    );

    const generation2Envelope =
      await portableStore.read(
        "LOCAL",
      );

    assert(
      generation2Envelope !==
        null,
      "Generation-2 Portable Auth state is missing.",
    );

    const generation2Payload =
      await decryptFinoraPortableBranchAuthEnvelopeV1(
        generation2Envelope,
        newPassword,
        currentSecurityCode,
        {
          expectedScope: {
            ownerId,

            businessId,

            branchId,
          },
        },
      );

    assert(
      generation2Payload.authGeneration ===
        2 &&
      generation2Payload.authStateId ===
        authStateId,
      "Generation-2 Portable Auth payload is inconsistent.",
    );

    console.log(
      "PASS: Password-only rotation completed generation 1 -> 2",
    );

    console.log(
      "PASS: Password-only rotation retained current Security Code",
    );

    const stalePasswordAuthentication =
      await authenticateFinoraBranchCredential({
        username,

        password:
          currentPassword,
      });

    assert(
      stalePasswordAuthentication.success ===
        false &&
      stalePasswordAuthentication.errorCode ===
        "INVALID_CREDENTIALS",
      "Old Password remained valid after Password rotation.",
    );

    console.log(
      "PASS: stale old Password rejected after Password rotation",
    );

    // ========================================================
    // CASE 5 — SECURITY-CODE-ONLY ROTATION 2 -> 3
    // ========================================================

    const securityRotation =
      await rotateFinoraPortableBranchAuthCredential({
        request: {
          username,

          currentPassword:
            newPassword,

          currentSecurityCode,

          newSecurityCode,
        },

        portableStore,
      });

    assert(
      securityRotation.success ===
        true,
      securityRotation.success
        ? "Unexpected Security Code rotation assertion state."
        : securityRotation.error,
    );

    assert(
      securityRotation.data.authGeneration ===
        3 &&
      securityRotation.data.credential.authGeneration ===
        3 &&
      securityRotation.data.portableReplaceResult ===
        "REPLACED",
      "Security-Code-only rotation did not commit generation 3.",
    );

    const finalStoreResult =
      await readFinoraControlStore();

    assert(
      finalStoreResult.success &&
      finalStoreResult.data,
      finalStoreResult.error ??
        "Unable to read final generation-3 Control Store.",
    );

    const finalStore =
      finalStoreResult.data;

    const finalCredential =
      finalStore.branchCredentials?.find(
        (credential) =>
          credential.credentialId ===
            credentialId,
      );

    assert(
      finalCredential !==
        undefined &&
      finalCredential.authGeneration ===
        3,
      "Generation-3 authoritative credential was not persisted.",
    );

    const finalEnvelope =
      await portableStore.read(
        "LOCAL",
      );

    assert(
      finalEnvelope !==
        null,
      "Generation-3 Portable Auth state is missing.",
    );

    const finalPayload =
      await decryptFinoraPortableBranchAuthEnvelopeV1(
        finalEnvelope,
        newPassword,
        newSecurityCode,
        {
          expectedScope: {
            ownerId,

            businessId,

            branchId,
          },
        },
      );

    assert(
      finalPayload.authGeneration ===
        3,
      "Final Portable Auth generation is not 3.",
    );

    console.log(
      "PASS: Security-Code-only rotation completed generation 2 -> 3",
    );

    const retainedPasswordAuthentication =
      await authenticateFinoraBranchCredential({
        username,

        password:
          newPassword,
      });

    assert(
      retainedPasswordAuthentication.success ===
        true &&
      retainedPasswordAuthentication.data.authGeneration ===
        3,
      "Security-Code-only rotation did not retain current Password.",
    );

    console.log(
      "PASS: Security-Code-only rotation retained current Password",
    );

    await expectDecryptFailure(
      finalEnvelope,
      newPassword,
      currentSecurityCode,
      ownerId,
      businessId,
      branchId,
    );

    console.log(
      "PASS: stale old Security Code rejected after Security Code rotation",
    );

    await expectDecryptFailure(
      finalEnvelope,
      currentPassword,
      newSecurityCode,
      ownerId,
      businessId,
      branchId,
    );

    // ========================================================
    // IMMUTABLE LINEAGE
    // ========================================================

    assert(
      finalCredential.credentialId ===
        credentialId &&
      finalCredential.sourceAuthorizationId ===
        sourceAuthorizationId &&
      finalCredential.userId ===
        userId &&
      finalCredential.ownerId ===
        ownerId &&
      finalCredential.businessId ===
        businessId &&
      finalCredential.branchId ===
        branchId &&
      finalPayload.authStateId ===
        authStateId &&
      finalPayload.sourceAuthorizationId ===
        sourceAuthorizationId &&
      finalPayload.userId ===
        userId &&
      finalPayload.ownerId ===
        ownerId &&
      finalPayload.businessId ===
        businessId &&
      finalPayload.branchId ===
        branchId,
      "Credential/source/auth-state lineage changed during rotation.",
    );

    console.log(
      "PASS: immutable credential/source/auth-state lineage preserved",
    );

    // ========================================================
    // CONTROL / PORTABLE CONVERGENCE
    // ========================================================

    assert(
      finalCredential.authGeneration ===
        finalPayload.authGeneration &&
      finalCredential.username ===
        finalPayload.username &&
      finalCredential.canonicalUsername ===
        finalPayload.canonicalUsername &&
      finalCredential.fullName ===
        finalPayload.fullName &&
      finalCredential.role ===
        finalPayload.role &&
      finalCredential.storageMode ===
        finalPayload.storageMode &&
      finalCredential.dataContext ===
        finalPayload.dataContext &&
      finalCredential.createdAt ===
        finalPayload.createdAt &&
      finalCredential.updatedAt ===
        finalPayload.updatedAt &&
      jsonEqual(
        finalCredential.verifier,
        toControlCredentialVerifier(
          finalPayload.passwordVerifier,
        ),
      ) &&
      jsonEqual(
        finalCredential.securityVerifier,
        toControlCredentialVerifier(
          finalPayload.securityVerifier,
        ),
      ),
      "Final Control Store credential and Portable payload diverged.",
    );

    console.log(
      "PASS: Control Store credential and Portable payload converge at generation 3",
    );

    // ========================================================
    // COMPLETE HISTORY
    // ========================================================

    const rotations =
      finalStore.portableBranchAuthCredentialRotationTransactions ??
      [];

    assert(
      rotations.length ===
        2,
      "Expected exactly two completed rotation-history records.",
    );

    assert(
      rotations[0].status ===
        "COMPLETE" &&
      rotations[0].credentialId ===
        credentialId &&
      rotations[0].sourceAuthorizationId ===
        sourceAuthorizationId &&
      rotations[0].currentGeneration ===
        1 &&
      rotations[0].targetGeneration ===
        2,
      "First completed rotation history is inconsistent.",
    );

    assert(
      rotations[1].status ===
        "COMPLETE" &&
      rotations[1].credentialId ===
        credentialId &&
      rotations[1].sourceAuthorizationId ===
        sourceAuthorizationId &&
      rotations[1].currentGeneration ===
        2 &&
      rotations[1].targetGeneration ===
        3,
      "Second completed rotation history is inconsistent.",
    );

    console.log(
      "PASS: two COMPLETE rotation history records retained",
    );

    // ========================================================
    // UNRELATED CONTROL AUTHORITY MUST NOT CHANGE
    //
    // Normalize only the three expected mutation surfaces:
    //
    // - branchCredentials
    // - rotation journal
    // - root updatedAt
    //
    // Every other Control Store field must remain byte-equivalent
    // under canonical JSON representation.
    // ========================================================

    const normalizedFinal =
      normalizeUnrelatedControlState(
        finalStore,
        baselineStore,
      );

    assert(
      jsonEqual(
        normalizedFinal,
        baselineStore,
      ),
      "Credential rotation mutated unrelated Control Store authority state.",
    );

    console.log(
      "PASS: unrelated Control Store authority state remained byte-equivalent",
    );

    // ========================================================
    // PLAINTEXT FACTORS MUST NOT ENTER DURABLE JOURNAL
    // ========================================================

    const durableRotationJson =
      JSON.stringify(
        rotations,
      );

    for (
      const secret of [
        currentPassword,
        currentSecurityCode,
        newPassword,
        newSecurityCode,
        wrongPassword,
        wrongSecurityCode,
      ]
    ) {
      assert(
        !durableRotationJson.includes(
          secret,
        ),
        "Plaintext credential factor appeared in durable rotation journal.",
      );
    }

    console.log(
      "PASS: durable rotation journal contains no plaintext credential factors",
    );

    // ========================================================
    // LOCAL STORAGE MUST NEVER CONSULT USB
    // ========================================================

    assert(
      usbResolverCalls ===
        0,
      `LOCAL credential rotation unexpectedly consulted USB resolver ${usbResolverCalls} time(s).`,
    );

    console.log(
      "PASS: LOCAL credential rotation never consulted USB resolver",
    );

    console.log(
      "",
    );

    console.log(
      "PASS: D4E4I8-B4.5-C4 CREDENTIAL ROTATION COORDINATOR EXECUTABLE SECURITY MATRIX",
    );
  }
  finally {
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
        "PASS: isolated rotation coordinator self-test root deleted",
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

// ============================================================
// END
// ============================================================